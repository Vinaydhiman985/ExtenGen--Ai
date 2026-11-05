import { FastifyPluginAsync } from 'fastify';
import { resolveAuthContext } from '../../services/auth.js';
import { listObservations } from '../../services/observations.js';
import { storeObservationWithContradictionCheck } from '../../services/contradictions.js';

export const observationRoutes: FastifyPluginAsync = async (fastify) => {
  // Capture observation
  fastify.post('/api/v1/observations', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const body = request.body as any;

    if (!body || !body.content) {
      return reply.status(400).send({ error: 'Field "content" is required.' });
    }

    const result = await storeObservationWithContradictionCheck(tenant, {
      content: body.content,
      title: body.title,
      source: body.source || 'api',
      tags: body.tags,
      metadata: body.metadata,
      immediateEmbed: body.immediateEmbed === true,
    }, body.confirmContradictions === true);

    if (!result.stored) {
      return reply.status(409).send({
        success: false,
        stored: false,
        warning: 'This observation may contradict existing team knowledge. Confirm before storing by repeating the request with confirmContradictions: true.',
        contradictions: result.contradictions,
      });
    }

    return reply.status(201).send({
      success: true,
      observation: result.observation,
      superseded: result.superseded.map(conflict => ({
        id: conflict.id,
        title: conflict.title,
        reason: conflict.reason,
      })),
    });
  });

  // List recent observations
  fastify.get('/api/v1/observations', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const query = request.query as any;

    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const source = query.source;

    const observations = await listObservations(tenant, limit, source);
    return {
      count: observations.length,
      observations,
    };
  });
};
