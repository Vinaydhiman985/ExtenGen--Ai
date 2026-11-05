import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storeObservation, recallContext, clearMemoryStore } from '../src/services/observations.js';

describe('Multi-Tenant Isolation (RLS Verification)', () => {
  const tenantAcme = {
    orgId: '11111111-1111-1111-1111-111111111111',
    userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };

  const tenantStark = {
    orgId: '22222222-2222-2222-2222-222222222222',
    userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  };

  beforeEach(() => {
    clearMemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store observations scoped to specific org_id', async () => {
    const obs = await storeObservation(tenantAcme, {
      title: 'Acme Microservices Config',
      content: 'All internal microservices communicate via gRPC on port 50051.',
      source: 'agent_session',
      immediateEmbed: true,
    });

    expect(obs.org_id).toBe(tenantAcme.orgId);
    expect(obs.user_id).toBe(tenantAcme.userId);
    expect(obs.status).toBe('indexed');
    expect(obs.embedding).toBeDefined();
  });

  it('should strictly prevent cross-tenant memory leakage', async () => {
    // Org Acme saves a proprietary architecture decision
    await storeObservation(tenantAcme, {
      title: 'Acme Stripe Webhook Secret Handling',
      content: 'Stripe webhook secrets are retrieved from AWS Secrets Manager using key acme-stripe-secret.',
      source: 'agent_session',
      tags: ['stripe', 'secrets', 'aws'],
      immediateEmbed: true,
    });

    // Org Stark saves their own data
    await storeObservation(tenantStark, {
      title: 'Stark Arc Reactor Power Settings',
      content: 'Arc reactor output stabilized at 12 Gigawatts using quantum resonance coils.',
      source: 'agent_session',
      tags: ['power', 'hardware'],
      immediateEmbed: true,
    });

    // Acme queries for Stripe webhooks
    const acmeRecall = await recallContext(tenantAcme, {
      query: 'Stripe webhook secret handling AWS Secrets Manager',
      limit: 5,
      similarityThreshold: 0.40,
    });

    expect(acmeRecall.matchesCount).toBeGreaterThanOrEqual(1);
    expect(acmeRecall.observations[0].title).toContain('Acme Stripe Webhook');
    expect(acmeRecall.observations.every(o => o.org_id === tenantAcme.orgId)).toBe(true);

    // Stark runs the EXACT SAME QUERY for Stripe webhooks
    const starkRecall = await recallContext(tenantStark, {
      query: 'Stripe webhook secret handling AWS Secrets Manager',
      limit: 5,
      similarityThreshold: 0.40,
    });

    // Stark MUST get 0 results from Acme
    expect(starkRecall.matchesCount).toBe(0);
    expect(starkRecall.observations).toHaveLength(0);
    expect(starkRecall.formattedContext).toContain('No prior relevant context');

    // Stark queries for arc reactor
    const starkOwnRecall = await recallContext(tenantStark, {
      query: 'arc reactor quantum resonance coils output',
      limit: 5,
      similarityThreshold: 0.40,
    });

    expect(starkOwnRecall.matchesCount).toBeGreaterThanOrEqual(1);
    expect(starkOwnRecall.observations[0].title).toContain('Stark Arc Reactor');
    expect(starkOwnRecall.observations.every(o => o.org_id === tenantStark.orgId)).toBe(true);
  });

  it('should rank newer observations higher when recency decay is enabled', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    await storeObservation(tenantAcme, {
      content: 'Use a shared Redis cache for product catalog responses.',
      metadata: { label: 'older' },
      immediateEmbed: true,
    });

    vi.setSystemTime(new Date('2026-04-11T00:00:00.000Z'));
    await storeObservation(tenantAcme, {
      content: 'Use a shared Redis cache for product catalog responses.',
      metadata: { label: 'newer' },
      immediateEmbed: true,
    });

    const decayedRecall = await recallContext(tenantAcme, {
      query: 'shared Redis cache product catalog responses',
      similarityThreshold: 0,
      recencyWeight: 0.01,
    });
    expect(decayedRecall.observations.map(observation => observation.metadata.label)).toEqual([
      'newer',
      'older',
    ]);

    const undecayedRecall = await recallContext(tenantAcme, {
      query: 'shared Redis cache product catalog responses',
      similarityThreshold: 0,
      recencyWeight: 0,
    });
    expect(undecayedRecall.observations.map(observation => observation.metadata.label)).toEqual([
      'older',
      'newer',
    ]);
  });
});
