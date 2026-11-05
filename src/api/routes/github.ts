import { createHmac, timingSafeEqual } from 'node:crypto';
import { Transform } from 'node:stream';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { resolveAuthContext } from '../../services/auth.js';
import { ingestGitHubRepo, fetchAndIngestFromGitHubAPI } from '../../services/github.js';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

function hasValidGitHubSignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
  if (!rawBody || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const expected = Buffer.from(
    `sha256=${createHmac('sha256', env.GITHUB_WEBHOOK_SECRET!).update(rawBody).digest('hex')}`
  );
  const provided = Buffer.from(signature);

  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export const githubRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preParsing', (request, _reply, payload, done) => {
    if (request.url.split('?')[0] !== '/api/v1/webhooks/github') {
      done(null, payload);
      return;
    }

    const chunks: Buffer[] = [];
    const capture = new Transform({
      transform(chunk: Buffer | string, _encoding, callback) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(buffer);
        callback(null, buffer);
      },
      flush(callback) {
        request.rawBody = Buffer.concat(chunks);
        callback();
      },
    });

    payload.pipe(capture);
    done(null, capture);
  });

  // Ingest from API or payload
  const handleGitHubIngest = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const body = request.body as any;

    if (!body || !body.repo) {
      return reply.status(400).send({ error: 'Field "repo" is required (e.g. "owner/repo").' });
    }

    // If explicit commits/PRs provided in payload
    if (body.commits || body.pullRequests) {
      const result = await ingestGitHubRepo(tenant, {
        repo: body.repo,
        branch: body.branch,
        commits: body.commits,
        pullRequests: body.pullRequests,
      });

      return reply.status(200).send({
        success: true,
        ...result,
      });
    }

    // Otherwise fetch from GitHub REST API
    const result = await fetchAndIngestFromGitHubAPI(
      tenant,
      body.repo,
      body.token,
      body.limit || 10
    );

    return reply.status(200).send({
      success: true,
      repo: body.repo,
      ...result,
    });
  };

  fastify.post('/api/v1/ingest/github', handleGitHubIngest);
  fastify.post('/api/v1/github/ingest', handleGitHubIngest);

  // GitHub Webhook listener (for automated push / pull_request events)
  fastify.post('/api/v1/webhooks/github', async (request, reply) => {
    if (!env.GITHUB_WEBHOOK_SECRET) {
      return reply.status(503).send({ error: 'GitHub webhook secret is not configured.' });
    }

    const signature = request.headers['x-hub-signature-256'];
    if (!hasValidGitHubSignature(
      request.rawBody,
      typeof signature === 'string' ? signature : undefined
    )) {
      return reply.status(401).send({ error: 'Invalid GitHub webhook signature.' });
    }

    const authHeader = request.headers.authorization;
    const tenant = await resolveAuthContext(authHeader);
    const event = request.headers['x-github-event'] as string;
    const payload = request.body as any;

    if (!payload || !payload.repository) {
      return reply.status(400).send({ error: 'Invalid webhook payload.' });
    }

    const repoName = payload.repository.full_name;

    if (event === 'push' && payload.commits && Array.isArray(payload.commits)) {
      const commits = payload.commits.map((c: any) => ({
        hash: c.id,
        message: c.message,
        author: c.author?.name || c.author?.username || 'unknown',
        filesChanged: [...(c.added || []), ...(c.modified || []), ...(c.removed || [])],
      }));

      const result = await ingestGitHubRepo(tenant, {
        repo: repoName,
        branch: payload.ref?.replace('refs/heads/', '') || 'main',
        commits,
      });

      return reply.send({ success: true, event: 'push', ...result });
    }

    if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request?.merged) {
      const pr = payload.pull_request;
      const result = await ingestGitHubRepo(tenant, {
        repo: repoName,
        pullRequests: [
          {
            number: pr.number,
            title: pr.title,
            body: pr.body || '',
            author: pr.user?.login || 'unknown',
            mergedAt: pr.merged_at,
            baseBranch: pr.base?.ref,
            headBranch: pr.head?.ref,
          },
        ],
      });

      return reply.send({ success: true, event: 'pull_request_merged', ...result });
    }

    return reply.send({ received: true, ignored: true, event });
  });
};
