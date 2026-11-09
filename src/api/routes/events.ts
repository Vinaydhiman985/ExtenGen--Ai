import { FastifyPluginAsync } from 'fastify';
import { liveEventBus, LiveEventType } from '../../services/events.js';

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  // Real-time Server-Sent Events stream for frontend dashboard & extensions
  fastify.get('/api/v1/events', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.flushHeaders();

    // Initial connection handshake
    reply.raw.write(
      `event: sync\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`
    );

    // If a testing harness injected this with closeImmediately, close cleanly
    if ((request.query as any)?.closeImmediately === 'true') {
      reply.raw.end();
      return;
    }

    const onEvent = ({ type, data }: { type: LiveEventType; data: unknown }) => {
      try {
        reply.raw.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        // Socket closed
      }
    };

    liveEventBus.on('event', onEvent);

    // Keep-alive heartbeat every 20 seconds to prevent TCP drops
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(': heartbeat\n\n');
      } catch (err) {
        clearInterval(heartbeat);
      }
    }, 20000);

    request.raw.on('close', () => {
      liveEventBus.off('event', onEvent);
      clearInterval(heartbeat);
    });
  });
};
