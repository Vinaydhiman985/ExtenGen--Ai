import { buildApp } from './api/server.js';
import { env } from './config/env.js';
import { initQueue, closeQueue } from './services/queue.js';
import { getDbPool, closeDb } from './db/client.js';
import { seedInitialMemoriesIfEmpty } from './services/observations.js';

async function checkDatabaseConnection(): Promise<{ connected: boolean; message: string }> {
  const pool = getDbPool();
  if (!pool) {
    return { connected: false, message: '🟡 In-Memory Mode (DATABASE_URL not configured)' };
  }
  const start = Date.now();
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out after 3s')), 3000)),
    ]);
    const latency = Date.now() - start;
    return { connected: true, message: `🟢 PostgreSQL / Supabase Connected (${latency}ms latency)` };
  } catch (err) {
    return { connected: false, message: `⚠️ PostgreSQL Offline: ${(err as Error).message} (Using In-Memory Fallback)` };
  }
}

async function start() {
  // Initialize BullMQ Queue & Worker
  initQueue();

  // Actively test database connection
  const dbStatus = await checkDatabaseConnection();

  // Seed default memories for default tenant if empty (non-blocking)
  try {
    await seedInitialMemoriesIfEmpty({
      orgId: env.DEFAULT_ORG_ID,
      userId: env.DEFAULT_USER_ID,
      role: 'agent',
    });
  } catch {
    // Non-blocking in case migrations haven't run
  }

  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      await closeQueue();
      await closeDb();
      console.log('👋 ExtenGen server stopped.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });

    console.log('🚀 Backend server is running');
    console.log(dbStatus.connected ? '✅ Database is connected' : `⚠️  ${dbStatus.message}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
