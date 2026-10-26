import { FastifyPluginAsync } from 'fastify';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createExtenGenMcpServer } from '../mcp/server.js';
import { resolveAuthContext } from '../services/auth.js';

// Map of active SSE transports by sessionId
const activeTransports = new Map<string, SSEServerTransport>();

export interface ActiveAgentSession {
  sessionId: string;
  agentName: string;
  userAgent: string;
  clientIp: string;
  connectedAt: string;
  lastActivityAt: string;
  storesCount: number;
  recallsCount: number;
  lastToolCalled?: string;
}

export const activeAgentSessions = new Map<string, ActiveAgentSession>();

// Set of active dashboard SSE clients listening for real-time updates
const dashboardClients = new Set<(event: string) => void>();

export function broadcastDashboardEvent(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, timestamp: new Date().toISOString(), payload });
  const msg = `event: ${eventType}\ndata: ${data}\n\n`;
  for (const send of dashboardClients) {
    try {
      send(msg);
    } catch {
      dashboardClients.delete(send);
    }
  }
}

export const sseRoutes: FastifyPluginAsync = async (fastify) => {
  // Real-time SSE event stream for live dashboard updates
  fastify.get('/api/v1/events', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.flushHeaders();

    const send = (msg: string) => {
      reply.raw.write(msg);
    };

    dashboardClients.add(send);

    // Initial sync
    send(`event: sync\ndata: ${JSON.stringify({
      activeAgentsCount: activeAgentSessions.size,
      agents: Array.from(activeAgentSessions.values()),
    })}\n\n`);

    request.raw.on('close', () => {
      dashboardClients.delete(send);
    });
  });

  // SSE Connection endpoint for MCP Clients (Claude Code, Cursor, Windsurf)
  fastify.get('/sse', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);

    // Raw Node.js response for SSE streaming
    const res = reply.raw;
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId;

    // Detect agent identity
    const userAgent = (request.headers['user-agent'] as string) || '';
    const queryAgent = (request.query as any)?.agent;
    let agentName = 'AI Agent';

    if (queryAgent) {
      agentName = queryAgent;
    } else if (userAgent.toLowerCase().includes('claude')) {
      agentName = 'Claude Code CLI';
    } else if (userAgent.toLowerCase().includes('cursor')) {
      agentName = 'Cursor IDE';
    } else if (userAgent.toLowerCase().includes('windsurf')) {
      agentName = 'Windsurf';
    } else if (userAgent.toLowerCase().includes('node')) {
      agentName = 'Node.js MCP Client';
    } else {
      agentName = 'Claude / Cursor Agent';
    }

    const sessionData: ActiveAgentSession = {
      sessionId,
      agentName,
      userAgent: userAgent || 'MCP SSE Client',
      clientIp: request.ip,
      connectedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      storesCount: 0,
      recallsCount: 0,
    };

    activeTransports.set(sessionId, transport);
    activeAgentSessions.set(sessionId, sessionData);

    broadcastDashboardEvent('agent_connected', sessionData);

    // Create MCP Server with tool execution callback
    const server = createExtenGenMcpServer(tenant, (toolName) => {
      const sess = activeAgentSessions.get(sessionId);
      if (sess) {
        sess.lastActivityAt = new Date().toISOString();
        sess.lastToolCalled = toolName;
        if (toolName === 'store_observation') {
          sess.storesCount++;
        } else if (toolName === 'recall_context') {
          sess.recallsCount++;
        }
        broadcastDashboardEvent('agent_activity', {
          sessionId,
          agentName: sess.agentName,
          toolName,
          storesCount: sess.storesCount,
          recallsCount: sess.recallsCount,
        });
      }
    });

    transport.onclose = () => {
      activeTransports.delete(sessionId);
      activeAgentSessions.delete(sessionId);
      broadcastDashboardEvent('agent_disconnected', { sessionId, agentName });
    };

    await server.connect(transport);
  });

  // Client message posting endpoint
  fastify.post('/messages', async (request, reply) => {
    const sessionId = (request.query as any)?.sessionId;

    if (!sessionId) {
      return reply.status(400).send({ error: 'Missing sessionId query parameter.' });
    }

    const transport = activeTransports.get(sessionId);
    if (!transport) {
      return reply.status(404).send({ error: `Session ${sessionId} not found.` });
    }

    const session = activeAgentSessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date().toISOString();
    }

    await transport.handlePostMessage(request.raw, reply.raw, request.body);
  });

  // Query active live connected agents
  fastify.get('/api/v1/agents/active', async () => {
    return {
      count: activeAgentSessions.size,
      agents: Array.from(activeAgentSessions.values()),
      mcpEndpoints: {
        sse: '/sse',
        messages: '/messages',
      },
    };
  });

  // Simulate or disconnect an agent connection for live UI testing
  fastify.post('/api/v1/agents/simulate', async (request, reply) => {
    const body = (request.body as any) || {};
    const action = body.action || 'connect'; // 'connect' | 'disconnect'
    const agentName = body.agentName || 'Claude Code (Simulated)';

    if (action === 'connect') {
      const simId = `sim_${Date.now()}`;
      const simData: ActiveAgentSession = {
        sessionId: simId,
        agentName,
        userAgent: 'Simulated Agent Test Client',
        clientIp: '127.0.0.1',
        connectedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        storesCount: 1,
        recallsCount: 1,
        lastToolCalled: 'store_observation',
      };
      activeAgentSessions.set(simId, simData);
      broadcastDashboardEvent('agent_connected', simData);
      return { success: true, sessionId: simId, agentName, count: activeAgentSessions.size };
    } else {
      const sessionId = body.sessionId;
      if (sessionId) {
        activeAgentSessions.delete(sessionId);
        broadcastDashboardEvent('agent_disconnected', { sessionId });
      } else {
        for (const [id] of activeAgentSessions.entries()) {
          if (id.startsWith('sim_')) {
            activeAgentSessions.delete(id);
            broadcastDashboardEvent('agent_disconnected', { sessionId: id });
          }
        }
      }
      return { success: true, count: activeAgentSessions.size };
    }
  });
};
