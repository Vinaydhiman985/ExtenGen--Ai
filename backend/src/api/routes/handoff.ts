import { FastifyPluginAsync } from 'fastify';
import { resolveAuthContext } from '../../services/auth.js';
import { storeObservation, recallContext } from '../../services/observations.js';
import { broadcastLiveEvent } from '../../services/events.js';

export const handoffRoutes: FastifyPluginAsync = async (fastify) => {
  // Capture active chat session from Agent A (e.g. ChatGPT) and prepare seamless handoff
  fastify.post('/api/v1/handoff', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const body = request.body as any;

    if (!body || (!body.content && !body.sessionSummary && !body.lastMessage)) {
      return reply.status(400).send({
        error: 'At least one of "content", "sessionSummary", or "lastMessage" is required for handoff.',
      });
    }

    const fromAgent = body.fromAgent || 'ChatGPT';
    const toAgent = body.toAgent || 'Gemini';
    const title = body.title || `${fromAgent} Session Handoff`;
    const content = body.content || body.sessionSummary || body.lastMessage;
    const tags = Array.isArray(body.tags) ? body.tags : ['handoff', fromAgent.toLowerCase(), toAgent.toLowerCase()];

    // 1. Store the handoff context in Supabase PostgreSQL with 768d vector embedding
    const observation = await storeObservation(tenant, {
      title,
      content,
      source: 'agent_session',
      tags,
      immediateEmbed: true,
      metadata: {
        fromAgent,
        toAgent,
        handoffAt: new Date().toISOString(),
        url: body.url || null,
      }
    });

    // Broadcast SSE live event
    broadcastLiveEvent('sync', {
      action: 'handoff',
      fromAgent,
      toAgent,
      observationId: observation.id,
      title,
    });

    // 2. Prepare the clean prompt injection string for Agent B (e.g. Gemini)
    const handoffPrompt = [
      `[ExtenGen Shared Memory — Session Handoff from ${fromAgent}]`,
      `Context & Key Decisions from previous session:`,
      `"${content}"`,
      ``,
      `Continuing seamlessly without context loss. Please acknowledge this past context and proceed with the user's task.`,
    ].join('\n');

    return reply.status(200).send({
      success: true,
      observationId: observation.id,
      fromAgent,
      toAgent,
      title,
      content,
      handoffPrompt,
      storedAt: observation.created_at,
    });
  });

  // Query handoff memory for target agent (e.g. Gemini querying incoming context)
  fastify.get('/api/v1/handoff/latest', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);

    const recall = await recallContext(tenant, {
      query: 'session handoff context decisions',
      limit: 1,
      similarityThreshold: 0.10,
    });

    const latest = recall.observations[0] || null;

    return {
      success: true,
      hasHandoff: !!latest,
      latestHandoff: latest ? {
        id: latest.id,
        title: latest.title,
        content: latest.content,
        fromAgent: latest.metadata?.fromAgent || 'ChatGPT',
        toAgent: latest.metadata?.toAgent || 'Gemini',
        similarity: latest.similarity,
        handoffPrompt: `[ExtenGen Shared Memory — Bridged from ${latest.metadata?.fromAgent || 'ChatGPT'}]:\n"${latest.content}"\n\nContinuing conversation:`,
      } : null,
    };
  });
};
