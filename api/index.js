import { buildApp } from '../dist/api/server.js';

let appPromise = null;

/**
 * Vercel Serverless Function Handler
 * Bridges Vercel Node.js runtime (req, res) directly into Fastify.
 */
export default async function handler(req, res) {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await buildApp();
      await app.ready();
      return app;
    })();
  }

  const app = await appPromise;
  app.server.emit('request', req, res);
}

