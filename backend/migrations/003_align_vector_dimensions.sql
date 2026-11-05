-- =============================================================================
-- Migration: 003_align_vector_dimensions.sql
-- Description: Align observations.embedding column to 768 dimensions for Google Gemini
-- =============================================================================

DROP INDEX IF EXISTS idx_observations_embedding_hnsw;

-- Reset any legacy 1536-dimensional embeddings so column type can change
UPDATE observations 
SET embedding = NULL, status = 'pending_embedding' 
WHERE embedding IS NOT NULL;

ALTER TABLE observations 
    ALTER COLUMN embedding TYPE vector(768);

CREATE INDEX IF NOT EXISTS idx_observations_embedding_hnsw 
ON observations USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
