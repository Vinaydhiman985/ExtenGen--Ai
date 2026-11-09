import { FastifyPluginAsync } from 'fastify';
import { getDbPool } from '../../db/client.js';
import { broadcastLiveEvent } from '../../services/events.js';

// Connected agents registry
const connectedAgents = new Map<string, { agentName: string; connectedAt: string }>();
connectedAgents.set('chatgpt', { agentName: 'ChatGPT (Source Agent)', connectedAt: new Date().toISOString() });
connectedAgents.set('gemini', { agentName: 'Google Gemini (Target Agent)', connectedAt: new Date().toISOString() });

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
      count: connectedAgents.size,
      agents: Array.from(connectedAgents.values()),
    };
  });

  // Simulate agent connection/disconnection
  fastify.post('/api/v1/agents/simulate', async (request, reply) => {
    const { action, agentName } = (request.body as any) || {};
    const name = agentName || 'Simulated Agent';

    if (action === 'disconnect') {
      for (const [key, val] of connectedAgents.entries()) {
        if (val.agentName === name) {
          connectedAgents.delete(key);
        }
      }
      broadcastLiveEvent('agent_disconnected', { agentName: name, count: connectedAgents.size });
    } else {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      connectedAgents.set(id, { agentName: name, connectedAt: new Date().toISOString() });
      broadcastLiveEvent('agent_connected', { agentName: name, count: connectedAgents.size });
    }

    return {
      ok: true,
      action: action || 'connect',
      count: connectedAgents.size,
      agents: Array.from(connectedAgents.values()),
    };
  });

  // Universal AI Agent Mesh Registry (All Major Foundation Engines)
  fastify.get('/api/v1/agents/mesh', async (request, reply) => {
    return {
      success: true,
      count: 6,
      agents: [
        { id: 'chatgpt', name: 'ChatGPT', provider: 'OpenAI', domain: 'chatgpt.com', url: 'https://chatgpt.com' },
        { id: 'claude', name: 'Claude', provider: 'Anthropic', domain: 'claude.ai', url: 'https://claude.ai/new' },
        { id: 'gemini', name: 'Google Gemini', provider: 'Google', domain: 'gemini.google.com', url: 'https://gemini.google.com/app' },
        { id: 'deepseek', name: 'DeepSeek', provider: 'DeepSeek AI', domain: 'chat.deepseek.com', url: 'https://chat.deepseek.com' },
        { id: 'copilot', name: 'Microsoft Copilot', provider: 'Microsoft', domain: 'copilot.microsoft.com', url: 'https://copilot.microsoft.com' },
        { id: 'perplexity', name: 'Perplexity AI', provider: 'Perplexity', domain: 'perplexity.ai', url: 'https://www.perplexity.ai' },
      ],
    };
  });
};
