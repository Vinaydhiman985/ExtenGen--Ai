import { FastifyPluginAsync } from 'fastify';
import { getDbPool } from '../../db/client.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    let dbStatus = 'disconnected';
    const pool = getDbPool();

    if (pool) {
      try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      } catch (err) {
        dbStatus = 'error';
      }
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

  // Active agents status endpoint
  fastify.get('/api/v1/agents/active', async (request, reply) => {
    return {
      count: 2,
      agents: [
        { agentName: 'ChatGPT (Source Agent)' },
        { agentName: 'Google Gemini (Target Agent)' },
      ],
    };
  });
};
