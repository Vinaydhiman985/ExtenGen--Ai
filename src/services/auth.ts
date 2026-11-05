import crypto from 'crypto';
import { env } from '../config/env.js';
import { getDbPool } from '../db/client.js';
import { TenantContext } from '../db/schema.js';

export interface GeneratedApiKey {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Generate a secure ExtenGen API key (e.g. ext_live_abc123...)
 */
export function generateApiKey(prefix: 'live' | 'test' = 'live'): GeneratedApiKey {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `ext_${prefix}_${randomBytes}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Hash an API key with SHA-256
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Resolve an authorization token or API key header into a verified TenantContext
 */
export async function resolveAuthContext(authHeader?: string): Promise<TenantContext> {
  // If no auth header provided, fallback to default org/user for local CLI mode
  if (!authHeader || authHeader.trim().length === 0) {
    return {
      orgId: env.DEFAULT_ORG_ID,
      userId: env.DEFAULT_USER_ID,
      role: 'agent',
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token.length === 0) {
    return {
      orgId: env.DEFAULT_ORG_ID,
      userId: env.DEFAULT_USER_ID,
      role: 'agent',
    };
  }

  // 1. Check for standard ExtenGen API Key (ext_live_... or ext_test_...)
  if (token.startsWith('ext_')) {
    const keyHash = hashApiKey(token);
    const pool = getDbPool();

    if (pool) {
      try {
        const result = await pool.query(
          `SELECT org_id, user_id FROM api_keys WHERE key_hash = $1 LIMIT 1`,
          [keyHash]
        );

        if (result.rows.length > 0) {
          // Update last_used_at asynchronously
          pool.query(`UPDATE api_keys SET last_used_at = now() WHERE key_hash = $1`, [keyHash]).catch(() => {});

          return {
            orgId: result.rows[0].org_id,
            userId: result.rows[0].user_id,
            role: 'member',
          };
        }
      } catch (err) {
        console.error('Error querying api_key from database:', err);
      }
    }

    const error = new Error('Invalid or revoked ExtenGen API key.');
    (error as any).statusCode = 401;
    throw error;
  }

  // 2. Direct format for tests or CLI passing UUID header: `org_id[:user_id]`
  const parts = token.split(':');
  if (parts.length >= 1 && UUID_REGEX.test(parts[0])) {
    const orgId = parts[0];
    const userId = parts[1] && UUID_REGEX.test(parts[1]) ? parts[1] : (parts[1] || null);
    return {
      orgId,
      userId,
      role: 'member',
    };
  }

  // Reject invalid / unrecognized authorization token
  const error = new Error('Invalid authorization token format.');
  (error as any).statusCode = 401;
  throw error;
}
