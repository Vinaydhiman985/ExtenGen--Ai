import os from 'os';
import { FastifyPluginAsync } from 'fastify';
import { getDbPool } from '../../db/client.js';

function getLanIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

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

    const lanIp = getLanIp();

    return {
      status: 'ok',
      service: 'ExtenGen Shared Memory Server',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      network: {
        lanIp,
        localUrl: 'http://127.0.0.1:3000',
        lanUrl: `http://${lanIp}:3000`,
        mcpSseLocal: 'http://127.0.0.1:3000/sse',
        mcpSseLan: `http://${lanIp}:3000/sse`,
      },
    };
  });

  // OpenAPI 3.0 specification for OpenAI Custom GPTs, LangChain, CrewAI, and Swagger
  fastify.get('/openapi.json', async () => {
    return {
      openapi: '3.0.0',
      info: {
        title: 'ExtenGen Shared Memory API',
        description: 'Universal persistent memory and cross-agent context layer for Claude, Cursor, Windsurf, VS Code, OpenAI, LangChain, CrewAI, and custom agents.',
        version: '0.1.0',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local Development Server' },
      ],
      paths: {
        '/api/v1/observations': {
          post: {
            operationId: 'storeObservation',
            summary: 'Store knowledge, architectural decisions, and context',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                      content: { type: 'string', description: 'The decision, code insight, or memory to persist.' },
                      title: { type: 'string', description: 'Optional short title.' },
                      source: { type: 'string', default: 'agent_session' },
                      tags: { type: 'array', items: { type: 'string' } },
                      metadata: { type: 'object' },
                    },
                  },
                },
              },
            },
            responses: { '201': { description: 'Stored successfully' } },
          },
          get: {
            operationId: 'listObservations',
            summary: 'List recent observations stored in memory',
            responses: { '200': { description: 'List of memories' } },
          },
        },
        '/api/v1/context/recall': {
          post: {
            operationId: 'recallContext',
            summary: 'Semantically retrieve relevant prior team decisions and context',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['query'],
                    properties: {
                      query: { type: 'string', description: 'Search prompt or context query' },
                      limit: { type: 'integer', default: 5 },
                      similarity_threshold: { type: 'number', default: 0.5 },
                      tags: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
            responses: { '200': { description: 'Relevant memory context returned' } },
          },
        },
      },
    };
  });
};
