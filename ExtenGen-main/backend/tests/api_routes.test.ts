import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../src/api/server.js';
import { clearMemoryStore } from '../src/services/observations.js';
import type { FastifyInstance } from 'fastify';

/**
 * HTTP API Route Tests — using Fastify inject() for in-process HTTP testing.
 * No real network needed, no DB/Redis needed (uses in-memory fallback).
 */

describe('HTTP API Routes', () => {
  let app: FastifyInstance;

  const TEST_ORG = '11111111-1111-1111-1111-111111111111';
  const TEST_USER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const AUTH_HEADER = `Bearer ${TEST_ORG}:${TEST_USER}`;

  beforeEach(async () => {
    clearMemoryStore();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  // --- Health Check ---
  describe('GET /health', () => {
    it('should return 200 with service info', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('ok');
      expect(body.service).toContain('ExtenGen');
      expect(body.database).toBeDefined();
    });
  });

  // --- POST /api/v1/observations ---
  describe('POST /api/v1/observations', () => {
    it('should store an observation and return 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/observations',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Use cursor-based pagination.', title: 'Pagination Standard', source: 'manual', tags: ['api'] }),
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.observation.title).toBe('Pagination Standard');
      expect(body.observation.org_id).toBe(TEST_ORG);
    });

    it('should return 400 when content is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/observations',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'No content' }),
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('content');
    });

    it('should return 400 when content is whitespace-only', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/observations',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '   ' }),
      });
      expect(res.statusCode).toBe(400);
    });

    it('should return 401 for invalid API key', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/observations',
        headers: { Authorization: 'Bearer ext_live_invalid_key_that_does_not_exist', 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Should be rejected' }),
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // --- GET /api/v1/observations ---
  describe('GET /api/v1/observations', () => {
    it('should return empty list when memory is empty', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/observations', headers: { Authorization: AUTH_HEADER } });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.count).toBe(0);
      expect(body.observations).toHaveLength(0);
    });

    it('should return stored observations for the correct tenant', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/observations',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Redis is used for caching', title: 'Cache Decision' }),
      });
      const res = await app.inject({ method: 'GET', url: '/api/v1/observations', headers: { Authorization: AUTH_HEADER } });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.count).toBeGreaterThanOrEqual(1);
      expect(body.observations.some((o: any) => o.title === 'Cache Decision')).toBe(true);
    });

    it('should isolate observations between tenants', async () => {
      const ORG_B = '22222222-2222-2222-2222-222222222222';
      await app.inject({
        method: 'POST',
        url: '/api/v1/observations',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Org A secret', title: 'Org A Only' }),
      });
      const res = await app.inject({ method: 'GET', url: '/api/v1/observations', headers: { Authorization: `Bearer ${ORG_B}` } });
      const body = JSON.parse(res.body);
      expect(body.observations.every((o: any) => !o.title?.includes('Org A Only'))).toBe(true);
    });
  });

  // --- POST /api/v1/context/recall ---
  describe('POST /api/v1/context/recall', () => {
    it('should return 400 when query is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/context/recall',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toContain('query');
    });

    it('should return 200 with empty results when no observations exist', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/context/recall',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'database migrations postgres' }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.result.matchesCount).toBe(0);
    });

    it('should recall relevant observations with semantic similarity', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/observations',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'We use Redis for caching with 5-minute TTL on product endpoints.', title: 'Redis Caching Policy', immediateEmbed: true }),
      });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/context/recall',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'What is our caching strategy and TTL for Redis?', similarityThreshold: 0.2 }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.result.matchesCount).toBeGreaterThanOrEqual(1);
      expect(body.result.formattedContext).toContain('Redis');
    });
  });

  // --- POST /api/v1/ingest/github ---
  describe('POST /api/v1/ingest/github', () => {
    it('should return 400 when repo is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ingest/github',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ commits: [] }),
      });
      expect(res.statusCode).toBe(400);
    });

    it('should ingest commits and PRs from explicit payload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/ingest/github',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: 'acme/test-repo',
          commits: [{ hash: 'abc1234', message: 'refactor: migrate auth to JWT', author: 'alice', filesChanged: ['src/auth.ts'] }],
          pullRequests: [{ number: 7, title: 'Add pgvector HNSW index', body: 'Adds HNSW index.', author: 'bob', baseBranch: 'main', headBranch: 'feature/hnsw' }],
        }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.ingestedCommits).toBe(1);
      expect(body.ingestedPRs).toBe(1);
    });
  });

  // --- POST /api/v1/webhooks/github ---
  describe('POST /api/v1/webhooks/github', () => {
    it('should accept push event (no secret configured)', async () => {
      const payload = {
        repository: { full_name: 'acme/core' },
        ref: 'refs/heads/main',
        commits: [{ id: 'deadbeef', message: 'fix auth token', author: { name: 'Alice' }, added: [], modified: ['src/auth.ts'] }],
      };
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/github',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json', 'x-github-event': 'push' },
        body: JSON.stringify(payload),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
    });

    it('should accept pull_request merged event', async () => {
      const payload = {
        action: 'closed',
        repository: { full_name: 'acme/core' },
        pull_request: { number: 99, title: 'Add HNSW index', body: 'Adds HNSW.', user: { login: 'bob' }, merged_at: new Date().toISOString(), base: { ref: 'main' }, head: { ref: 'feature/hnsw' }, merged: true },
      };
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/github',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json', 'x-github-event': 'pull_request' },
        body: JSON.stringify(payload),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
    });

    it('should return 400 for webhook payload without repository field', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/github',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json', 'x-github-event': 'push' },
        body: JSON.stringify({ action: 'push' }),
      });
      expect(res.statusCode).toBe(400);
    });

    it('should ignore unhandled github event types gracefully', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/github',
        headers: { Authorization: AUTH_HEADER, 'Content-Type': 'application/json', 'x-github-event': 'star' },
        body: JSON.stringify({ repository: { full_name: 'acme/core' }, action: 'created' }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.ignored).toBe(true);
    });
  });
});
