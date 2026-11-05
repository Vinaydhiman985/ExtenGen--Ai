import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMemoryStore,
  listObservations,
  recallContext,
  storeObservation,
} from '../src/services/observations.js';
import { storeObservationWithContradictionCheck } from '../src/services/contradictions.js';
import { handleStoreObservation } from '../src/mcp/tools.js';

describe('Observation contradiction checks', () => {
  const tenant = {
    orgId: '11111111-1111-1111-1111-111111111111',
    userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  };

  beforeEach(() => {
    clearMemoryStore();
  });

  it('holds a suspected conflict until an explicit confirmation stores it', async () => {
    const oldObservation = await storeObservation(tenant, {
      title: 'Session lifetime',
      content: 'User sessions expire after 30 minutes of inactivity.',
      immediateEmbed: true,
    });

    const proposed = {
      title: 'Session lifetime',
      content: 'User sessions expire after 60 minutes of inactivity.',
      immediateEmbed: true,
    };
    const evaluator = vi.fn(async () => [
      { candidate_index: 0, reason: 'The proposed policy removes the existing 30-minute expiry.' },
    ]);

    const result = await storeObservationWithContradictionCheck(
      tenant,
      proposed,
      false,
      evaluator
    );

    expect(result.stored).toBe(false);
    if (result.stored) throw new Error('Expected contradictory observation to be held.');
    expect(result.contradictions).toHaveLength(1);
    expect(result.contradictions[0].reason).toContain('30-minute expiry');
    expect(evaluator).toHaveBeenCalledOnce();
    expect(await listObservations(tenant, 10)).toHaveLength(1);

    const confirmed = await storeObservationWithContradictionCheck(
      tenant,
      proposed,
      true,
      evaluator
    );
    expect(confirmed.stored).toBe(true);
    if (!confirmed.stored) throw new Error('Expected the confirmed observation to be stored.');
    expect(evaluator).toHaveBeenCalledTimes(2);
    expect(confirmed.superseded.map(conflict => conflict.id)).toEqual([oldObservation.id]);

    const observations = await listObservations(tenant, 10);
    expect(observations).toHaveLength(2);
    const superseded = observations.find(observation => observation.id === oldObservation.id);
    expect(superseded?.superseded_by).toBe(confirmed.observation.id);
    expect(superseded?.supersession_reason).toContain('30-minute expiry');

    const recall = await recallContext(tenant, {
      query: 'User session expiration lifetime',
      similarityThreshold: 0,
      recencyWeight: 0,
    });
    expect(recall.observations.map(observation => observation.id)).toContain(confirmed.observation.id);
    expect(recall.observations.map(observation => observation.id)).not.toContain(oldObservation.id);
  });

  it('stores without warning when the evaluator finds no direct conflict', async () => {
    await storeObservation(tenant, {
      title: 'Session lifetime',
      content: 'User sessions expire after 30 minutes of inactivity.',
      immediateEmbed: true,
    });

    const result = await storeObservationWithContradictionCheck(
      tenant,
      {
        title: 'Session lifetime',
        content: 'User sessions expire after 30 minutes and session cookies must use Secure and HttpOnly attributes.',
        immediateEmbed: true,
      },
      false,
      async () => []
    );

    expect(result.stored).toBe(true);
    expect(await listObservations(tenant, 10)).toHaveLength(2);
  });

  it('fails closed without storing when contradiction evaluation fails', async () => {
    await storeObservation(tenant, {
      title: 'Session lifetime',
      content: 'User sessions expire after 30 minutes of inactivity.',
      immediateEmbed: true,
    });

    await expect(storeObservationWithContradictionCheck(
      tenant,
      {
        title: 'Session lifetime',
        content: 'User sessions expire after 60 minutes of inactivity.',
      },
      false,
      async () => {
        throw new Error('Gemini evaluation unavailable.');
      }
    )).rejects.toThrow('Gemini evaluation unavailable.');

    expect(await listObservations(tenant, 10)).toHaveLength(1);
  });

  it('does not supersede an observation belonging to another tenant', async () => {
    const otherTenant = {
      orgId: '22222222-2222-2222-2222-222222222222',
      userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    };
    const foreignObservation = await storeObservation(otherTenant, {
      title: 'Session lifetime',
      content: 'User sessions expire after 30 minutes of inactivity.',
      immediateEmbed: true,
    });

    await expect(storeObservation(tenant, {
      title: 'New policy',
      content: 'User sessions expire after 60 minutes.',
      supersedes: [{ id: foreignObservation.id, reason: 'Confirmed conflict.' }],
    })).rejects.toThrow('no longer active');

    const observations = await listObservations(otherTenant, 10);
    expect(observations).toHaveLength(1);
    expect(observations[0].superseded_by).toBeNull();
  });

  it('returns an MCP warning instead of storing a conflicting observation', async () => {
    await storeObservation(tenant, {
      title: 'Session lifetime',
      content: 'User sessions expire after 30 minutes of inactivity.',
      immediateEmbed: true,
    });

    const response = await handleStoreObservation(
      tenant,
      {
        title: 'Session lifetime',
        content: 'User sessions expire after 60 minutes of inactivity.',
        confirm_contradictions: false,
      },
      async () => [
        { candidate_index: 0, reason: 'This reverses the existing session expiry decision.' },
      ]
    );

    const result = JSON.parse(response.content[0].text);
    expect(result.stored).toBe(false);
    expect(result.warning).toContain('Ask the user');
    expect(result.contradictions).toHaveLength(1);
    expect(await listObservations(tenant, 10)).toHaveLength(1);
  });
});
