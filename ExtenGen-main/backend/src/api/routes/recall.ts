import { FastifyPluginAsync } from 'fastify';
import { resolveAuthContext } from '../../services/auth.js';
import { recallContext } from '../../services/observations.js';

export const recallRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/v1/context/recall', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const body = request.body as any;

    if (!body || !body.query) {
      return reply.status(400).send({ error: 'Field "query" is required.' });
    }

    const parsedLimit = parseInt(body.limit, 10);
    const limit = Math.min(Math.max(isNaN(parsedLimit) ? 5 : parsedLimit, 1), 50);

    const parsedThreshold = parseFloat(body.similarityThreshold);
    const similarityThreshold = !isNaN(parsedThreshold) ? Math.min(Math.max(parsedThreshold, 0.0), 1.0) : 0.30;

    const result = await recallContext(tenant, {
      query: body.query,
      limit,
      similarityThreshold,
      sources: body.sources,
      tags: body.tags,
    });

    return {
      success: true,
      result,
    };
  });
};
