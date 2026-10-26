import { FastifyPluginAsync } from 'fastify';
import { resolveAuthContext } from '../../services/auth.js';
import { storeObservation, listObservations, getSystemStats } from '../../services/observations.js';

export const observationRoutes: FastifyPluginAsync = async (fastify) => {
  // Capture observation
  fastify.post('/api/v1/observations', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const body = request.body as any;

    if (!body || !body.content) {
      return reply.status(400).send({ error: 'Field "content" is required.' });
    }

    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      return reply.status(400).send({ error: 'Field "content" must be a non-empty string.' });
    }

    try {
      const observation = await storeObservation(tenant, {
        content: body.content,
        title: body.title,
        source: body.source || 'api',
        tags: body.tags,
        metadata: body.metadata,
        immediateEmbed: body.immediateEmbed === true,
      });

      return reply.status(201).send({
        success: true,
        observation,
      });
    } catch (err: any) {
      if (err?.message?.includes('cannot be empty')) {
        return reply.status(400).send({ error: err.message });
      }
      throw err; // Let Fastify handle unexpected errors as 500
    }
  });

  // List recent observations
  fastify.get('/api/v1/observations', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const query = request.query as any;

    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const source = query.source;
    const tag = query.tag || query.tags;

    const observations = await listObservations(tenant, limit, source, tag);
    return {
      count: observations.length,
      observations,
    };
  });

  // Get real-time system metrics and statistics
  fastify.get('/api/v1/stats', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const stats = await getSystemStats(tenant);
    return stats;
  });
};
