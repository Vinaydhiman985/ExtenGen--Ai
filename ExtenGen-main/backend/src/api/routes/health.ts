import { FastifyPluginAsync } from 'fastify';
import { getDbPool, getSupabaseClient } from '../../db/client.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    let dbStatus = 'disconnected';
    const pool = getDbPool();
    const supabase = getSupabaseClient();

    if (pool) {
      try {
        await pool.query('SELECT 1');
        dbStatus = 'connected (postgresql)';
      } catch (err) {
        dbStatus = 'error';
      }
    } else if (supabase) {
      dbStatus = 'connected (supabase)';
    } else {
      dbStatus = 'in-memory-fallback';
    }

    return {
      status: 'ok',
      service: 'ExtenGen Shared Memory Server',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  });
};
