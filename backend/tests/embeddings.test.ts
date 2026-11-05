import { describe, it, expect } from 'vitest';
import {
  generateMockEmbedding,
  calculateCosineSimilarity,
  generateEmbedding,
} from '../src/services/embeddings.js';

describe('Embedding Service', () => {
  it('should generate unit-normalized vector of 768 dimensions (Google text-embedding-004)', () => {
    const text = 'ExtenGen shared memory layer for AI agents';
    const vector = generateMockEmbedding(text, 768);

    expect(vector).toHaveLength(768);

    // Check L2 norm is approximately 1.0
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 4);
  });

  it('should calculate accurate cosine similarity between identical vectors', () => {
    const vecA = generateMockEmbedding('PostgreSQL pgvector RLS');
    const vecB = generateMockEmbedding('PostgreSQL pgvector RLS');

    const similarity = calculateCosineSimilarity(vecA, vecB);
    expect(similarity).toBeCloseTo(1.0, 4);
  });

  it('should score semantically close texts significantly higher than unrelated texts', () => {
    const queryVec = generateMockEmbedding('database architecture postgres pgvector');
    const closeVec = generateMockEmbedding('We chose postgres database with pgvector extension');
    const unrelatedVec = generateMockEmbedding('Baking chocolate chip cookies with organic butter');

    const simClose = calculateCosineSimilarity(queryVec, closeVec);
    const simUnrelated = calculateCosineSimilarity(queryVec, unrelatedVec);

    // Close text must score higher than unrelated text
    expect(simClose).toBeGreaterThan(simUnrelated);
    // Close text must score above 0.40 (meaningful overlap via mock feature hashing)
    expect(simClose).toBeGreaterThan(0.40);
  });

  it('generateEmbedding should return a 768-dim vector for any text (mock fallback)', async () => {
    const vector = await generateEmbedding('Testing asynchronous embedding pipeline');
    expect(vector).toHaveLength(768);
  });
});
