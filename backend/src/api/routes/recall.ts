import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { resolveAuthContext } from '../../services/auth.js';
import { recallContext } from '../../services/observations.js';

export const recallRoutes: FastifyPluginAsync = async (fastify) => {
  const handleRecall = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const body = request.body as any;

    if (!body || !body.query) {
      return reply.status(400).send({ error: 'Field "query" is required.' });
    }

    const recencyWeight = body.recencyWeight === undefined
      ? undefined
      : Number(body.recencyWeight);
    if (recencyWeight !== undefined && (!Number.isFinite(recencyWeight) || recencyWeight < 0)) {
      return reply.status(400).send({
        error: 'Field "recencyWeight" must be a finite, non-negative number.',
      });
    }

    const result = await recallContext(tenant, {
      query: body.query,
      limit: body.limit ? parseInt(body.limit, 10) : 5,
      similarityThreshold: body.similarityThreshold !== undefined ? parseFloat(body.similarityThreshold) : 0.50,
      recencyWeight,
      sources: body.sources,
      tags: body.tags,
    });

    return {
      success: true,
      result,
    };
  };

  fastify.post('/api/v1/context/recall', handleRecall);
  fastify.post('/api/v1/recall', handleRecall);
};
