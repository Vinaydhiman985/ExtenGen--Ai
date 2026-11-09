import pg from 'pg';
import pgvector from 'pgvector/pg';
import { env } from '../config/env.js';
import { TenantContext } from './schema.js';

const { Pool } = pg;

// Connection pool for PostgreSQL / Supabase
let pool: pg.Pool | null = null;

export function getDbPool(): pg.Pool | null {
  if (pool) return pool;

  if (env.DATABASE_URL || env.PGHOST) {
    pool = new Pool({
      ...(env.DATABASE_URL ? { connectionString: env.DATABASE_URL } : {}),
      ...(env.PGHOST ? {
        host: env.PGHOST,
        port: env.PGPORT,
        database: env.PGDATABASE,
        user: env.PGUSER,
        password: env.PGPASSWORD,
      } : {}),
      ssl: env.PGSSLMODE === 'disable'
        ? false
        : (env.PGSSLMODE === 'require'
          || env.DATABASE_URL?.includes('supabase')
          || env.NODE_ENV === 'production')
          ? { rejectUnauthorized: false }
          : undefined,
      max: 10,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
    });

    pool.on('connect', async (client) => {
      try {
        await pgvector.registerType(client);
      } catch (err) {
        // pgvector might not be registered yet if migrations haven't run
      }
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });

    return pool;
  }

  return null;
}

/**
 * Execute a callback within a database client session where PostgreSQL RLS session variables
 * (app.current_org_id, app.current_user_id, app.bypass_rls) are set inside a transaction.
 */
export async function withTenantContext<T>(
  context: TenantContext,
  fn: (client: pg.PoolClient) => Promise<T>,
  retries = 2
): Promise<T> {
  const currentPool = getDbPool();
  if (!currentPool) {
    throw new Error('Database pool not initialized. Set DATABASE_URL in environment.');
  }

  let client: pg.PoolClient;
  try {
    client = await currentPool.connect();
  } catch (err: any) {
    if (retries > 0) {
      console.warn('⚠️ Retrying database connection after dropped pool socket...');
      return withTenantContext(context, fn, retries - 1);
    }
    throw err;
  }

  try {
    await client.query('BEGIN');

    if (context.bypassRls) {
      await client.query("SELECT set_config('app.bypass_rls', 'true', true)");
    } else {
      await client.query("SELECT set_config('app.bypass_rls', 'false', true)");
      if (context.orgId) {
        await client.query("SELECT set_config('app.current_org_id', $1, true)", [context.orgId]);
      }
      if (context.userId) {
        await client.query("SELECT set_config('app.current_user_id', $1, true)", [context.userId]);
      }
    }

    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    if (retries > 0 && (error.message?.includes('Connection terminated') || error.message?.includes('timeout') || error.code === 'ECONNRESET')) {
      console.warn('⚠️ Retrying tenant transaction after connection drop:', error.message);
      return withTenantContext(context, fn, retries - 1);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connections
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
