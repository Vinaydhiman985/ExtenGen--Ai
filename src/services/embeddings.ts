import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { env } from '../config/env.js';

let googleClient: GoogleGenerativeAI | null = null;

function getGoogleClient(): GoogleGenerativeAI | null {
  if (googleClient) return googleClient;
  if (env.GOOGLE_API_KEY && env.GOOGLE_API_KEY !== 'mock') {
    googleClient = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    return googleClient;
  }
  return null;
}

function stem(w: string): string {
  if (w.length <= 3) return w;
  return w.replace(/(ing|edly|ed|es|s|tion|ly)$/, '');
}

/**
 * Deterministic pseudo-semantic embedding generator for testing and offline development.
 * Maps tokens to reproducible vector components via feature hashing and normalizes to a unit sphere (L2 norm = 1).
 */
export function generateMockEmbedding(text: string, dimensions: number = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9_\-\s]/g, ' ').trim();
  const rawWords = normalizedText.split(/\s+/).filter(Boolean);

  if (rawWords.length === 0) {
    vector[0] = 1.0;
    return vector;
  }

  // Include both raw words and stemmed words
  const words = rawWords.flatMap(w => [w, stem(w)]);

  // Feature hashing: select distinct pseudo-random dimensions for each word
  for (const word of words) {
    const hash = crypto.createHash('sha256').update(word).digest();
    for (let j = 0; j < 16; j++) {
      const idx = (hash.readUInt16BE(j * 2) % dimensions);
      const sign = (hash[j] & 1) === 0 ? 1 : -1;
      vector[idx] += sign * 2.0;
    }
  }

  // Character 3-grams for substring / morphologic overlap
  const cleanStr = normalizedText.replace(/\s+/g, ' ');
  for (let i = 0; i < cleanStr.length - 2; i++) {
    const tri = cleanStr.substring(i, i + 3);
    const hash = crypto.createHash('md5').update(tri).digest();
    const idx = (hash.readUInt16BE(0) % dimensions);
    const sign = (hash[2] & 1) === 0 ? 0.5 : -0.5;
    vector[idx] += sign;
  }

  // Compute L2 norm and normalize
  let sumSquares = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSquares += vector[i] * vector[i];
  }

  const norm = Math.sqrt(sumSquares);
  if (norm === 0) {
    vector[0] = 1.0;
    return vector;
  }

  for (let i = 0; i < dimensions; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

/**
 * Generate vector embedding for given text using Google Generative AI or fallback mock.
 * Supports configurable outputDimensionality (e.g. 768).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getGoogleClient();

  if (client) {
    try {
      const model = client.getGenerativeModel({ model: env.EMBEDDING_MODEL });
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text: text.slice(0, 9000) }] },
        outputDimensionality: env.EMBEDDING_DIMENSIONS,
      } as any);
      return result.embedding.values;
    } catch (error) {
      console.warn('⚠️  Google Embedding API call failed, falling back to mock embeddings:', error);
      return generateMockEmbedding(text, env.EMBEDDING_DIMENSIONS);
    }
  }

  return generateMockEmbedding(text, env.EMBEDDING_DIMENSIONS);
}

/**
 * Batch generate vector embeddings.
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getGoogleClient();

  if (client && texts.length > 0) {
    try {
      const model = client.getGenerativeModel({ model: env.EMBEDDING_MODEL });
      const results: number[][] = [];
      for (const text of texts) {
        const result = await model.embedContent({
          content: { role: 'user', parts: [{ text: text.slice(0, 9000) }] },
          outputDimensionality: env.EMBEDDING_DIMENSIONS,
        } as any);
        results.push(result.embedding.values);
      }
      return results;
    } catch (error) {
      console.warn('⚠️  Google Batch Embedding call failed, falling back to mock embeddings:', error);
      return texts.map(t => generateMockEmbedding(t, env.EMBEDDING_DIMENSIONS));
    }
  }

  return texts.map(t => generateMockEmbedding(t, env.EMBEDDING_DIMENSIONS));
}

/**
 * Calculate cosine similarity between two equal-length vectors:
 * dot(A, B) / (||A|| * ||B||).
 * If both vectors are unit-normalized (L2 norm = 1), this is simply dot(A, B).
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
