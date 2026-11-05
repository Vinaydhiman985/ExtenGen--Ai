import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/api/server.js';
import { resolveAuthContext } from '../src/services/auth.js';
import { clearMemoryStore, listObservations } from '../src/services/observations.js';

const webhookSecret = 'test-webhook-secret';

function signedWebhookHeaders(event: string, rawBody: string) {
  const signature = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  return {
    'content-type': 'application/json',
    'x-github-event': event,
    'x-hub-signature-256': `sha256=${signature}`,
  };
}

describe('REST route aliases', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(() => {
    clearMemoryStore();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['/api/v1/context/recall', '/api/v1/recall'])(
    'accepts the recall route %s',
    async (url) => {
      const response = await app.inject({
        method: 'POST',
        url,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ error: 'Field "query" is required.' });
    }
  );

  it('rejects negative recency weights', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/recall',
      payload: { query: 'Redis cache', recencyWeight: -0.01 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Field "recencyWeight" must be a finite, non-negative number.',
    });
  });

  it.each(['/api/v1/ingest/github', '/api/v1/github/ingest'])(
    'accepts the GitHub ingest route %s',
    async (url) => {
      const response = await app.inject({
        method: 'POST',
        url,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: 'Field "repo" is required (e.g. "owner/repo").',
      });
    }
  );

  it('rejects webhook requests without a valid signature', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/github',
      headers: { 'x-github-event': 'push' },
      payload: {
        repository: { full_name: 'example/team-repo' },
        commits: [],
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Invalid GitHub webhook signature.' });
  });

  it('ingests a simulated GitHub push webhook into tenant memory', async () => {
    const payload = {
      ref: 'refs/heads/main',
      repository: { full_name: 'example/team-repo' },
      commits: [
        {
          id: '0123456789abcdef',
          message: 'feat: add webhook event processing',
          author: { name: 'Test Developer' },
          added: ['src/webhooks/handler.ts'],
          modified: ['src/api.ts'],
          removed: ['src/legacy.ts'],
        },
      ],
    };
    const rawBody = JSON.stringify(payload);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/github',
      headers: signedWebhookHeaders('push', rawBody),
      payload: rawBody,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      event: 'push',
      ingestedCommits: 1,
      ingestedPRs: 0,
    });

    const tenant = await resolveAuthContext();
    const observations = await listObservations(tenant, 10, 'github_commit');
    expect(observations).toHaveLength(1);
    expect(observations[0].content).toContain('feat: add webhook event processing');
    expect(observations[0].metadata.repo).toBe('example/team-repo');
    expect(observations[0].metadata.file_paths).toEqual([
      'src/webhooks/handler.ts',
      'src/api.ts',
      'src/legacy.ts',
    ]);
  });

  it('ingests a simulated merged pull-request webhook', async () => {
    const payload = {
      action: 'closed',
      repository: { full_name: 'example/team-repo' },
      pull_request: {
        number: 42,
        title: 'Add webhook signature validation',
        body: 'Validate incoming webhook signatures before processing.',
        merged: true,
        merged_at: '2026-11-04T12:00:00Z',
        user: { login: 'test-developer' },
        base: { ref: 'main' },
        head: { ref: 'feature/webhook-signatures' },
      },
    };
    const rawBody = JSON.stringify(payload);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/github',
      headers: signedWebhookHeaders('pull_request', rawBody),
      payload: rawBody,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      event: 'pull_request_merged',
      ingestedCommits: 0,
      ingestedPRs: 1,
    });

    const tenant = await resolveAuthContext();
    const observations = await listObservations(tenant, 10, 'github_pr');
    expect(observations).toHaveLength(1);
    expect(observations[0].title).toContain('Add webhook signature validation');
    expect(observations[0].metadata.pr_number).toBe(42);
  });
});
