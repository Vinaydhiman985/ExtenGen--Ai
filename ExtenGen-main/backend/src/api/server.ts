import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { healthRoutes } from './routes/health.js';
import { observationRoutes } from './routes/observations.js';
import { recallRoutes } from './routes/recall.js';
import { githubRoutes } from './routes/github.js';
import { sseRoutes } from './sse.js';
import { env } from '../config/env.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Disables raw unformatted Pino JSON dumps
  });

  // Plugins
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
  await app.register(sensible);

  // Real-time live request logging in development
  if (env.NODE_ENV !== 'test') {
    app.addHook('onResponse', async (request, reply) => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
      const status = reply.statusCode;
      const duration = Math.round(reply.elapsedTime);
      const icon = status < 400 ? '🟢' : status < 500 ? '🟡' : '🔴';
      const method = request.method.toUpperCase().padEnd(6);
      console.log(`  [${time}] ${icon} ${method} ${request.url.padEnd(30)} ${status} (${duration}ms)`);
    });
  }

  // Register Routes
  await app.register(healthRoutes);
  await app.register(observationRoutes);
  await app.register(recallRoutes);
  await app.register(githubRoutes);
  await app.register(sseRoutes);

  return app;
}
