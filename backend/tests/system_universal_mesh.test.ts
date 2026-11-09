import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/api/server.js';
import { clearMemoryStore, listObservations } from '../src/services/observations.js';
import { resolveAuthContext } from '../src/services/auth.js';

describe('Universal AI Mesh Test Suite (ChatGPT, Claude, Gemini, DeepSeek, Copilot, Perplexity)', () => {
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

  const agentPairs = [
    { from: 'Claude', to: 'DeepSeek' },
    { from: 'DeepSeek', to: 'Copilot' },
    { from: 'Perplexity', to: 'Gemini' },
    { from: 'Copilot', to: 'ChatGPT' },
    { from: 'ChatGPT', to: 'Claude' },
  ];

  it.each(agentPairs)('successfully executes handoff from %s to %s', async ({ from, to }) => {
    const content = `Decision recorded in ${from}: Use pgvector with HNSW index for sub-5ms cosine queries.`;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/handoff',
      headers: { authorization: 'Bearer 00000000-0000-0000-0000-000000000001' },
      payload: {
        fromAgent: from,
        toAgent: to,
        title: `${from} Architecture Discussion`,
        content,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.fromAgent).toBe(from);
    expect(body.toAgent).toBe(to);
    expect(body.handoffPrompt).toContain(`[ExtenGen Shared Memory — Session Handoff from ${from}]`);
    expect(body.handoffPrompt).toContain(`Instructions for ${to}:`);
  });

  it('serves the universal agent registry via GET /api/v1/agents/mesh', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/agents/mesh',
    });

    expect(res.statusCode).toBe(200);
    const data = res.json();
    expect(data.success).toBe(true);
    expect(data.agents).toBeDefined();

    const agentIds = data.agents.map((a: any) => a.id.toLowerCase());
    expect(agentIds).toContain('chatgpt');
    expect(agentIds).toContain('claude');
    expect(agentIds).toContain('gemini');
    expect(agentIds).toContain('deepseek');
    expect(agentIds).toContain('copilot');
    expect(agentIds).toContain('perplexity');
  });

  it('retrieves targeted handoff for specific recipient agent', async () => {
    // 1. Post handoff specifically for DeepSeek
    await app.inject({
      method: 'POST',
      url: '/api/v1/handoff',
      headers: { authorization: 'Bearer 00000000-0000-0000-0000-000000000001' },
      payload: {
        fromAgent: 'Perplexity',
        toAgent: 'DeepSeek',
        title: 'DeepSeek Model Parameter Tuning',
        content: 'DeepSeek-V3 MoE architecture with 671B parameters and 37B active per token.',
      },
    });

    // 2. Query latest handoff for DeepSeek
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/handoff/latest?toAgent=DeepSeek',
      headers: { authorization: 'Bearer 00000000-0000-0000-0000-000000000001' },
    });

    expect(res.statusCode).toBe(200);
    const data = res.json();
    expect(data.hasHandoff).toBe(true);
    expect(data.handoff.toAgent).toBe('DeepSeek');
    expect(data.handoff.fromAgent).toBe('Perplexity');
  });
});
