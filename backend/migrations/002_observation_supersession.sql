ALTER TABLE observations
    ADD COLUMN IF NOT EXISTS superseded_by UUID,
    ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS supersession_reason TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'observations_superseded_by_fkey'
          AND conrelid = 'observations'::regclass
    ) THEN
        ALTER TABLE observations
            ADD CONSTRAINT observations_superseded_by_fkey
            FOREIGN KEY (superseded_by) REFERENCES observations(id)
            DEFERRABLE INITIALLY DEFERRED;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_observations_active_org
    ON observations(org_id)
    WHERE superseded_by IS NULL;

CREATE OR REPLACE FUNCTION match_observations(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.60,
    match_count int DEFAULT 5,
    filter_sources text[] DEFAULT NULL,
    filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    user_id UUID,
    source VARCHAR(64),
    title VARCHAR(255),
    content TEXT,
    metadata JSONB,
    similarity float,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        obs.id,
        obs.org_id,
        obs.user_id,
        obs.source,
        obs.title,
        obs.content,
        obs.metadata,
        (1 - (obs.embedding <=> query_embedding))::float AS similarity,
        obs.created_at
    FROM observations obs
    WHERE obs.embedding IS NOT NULL
      AND obs.status = 'indexed'
      AND obs.superseded_by IS NULL
      AND (obs.org_id = get_current_org_id() OR current_setting('app.bypass_rls', true) = 'true')
      AND (1 - (obs.embedding <=> query_embedding)) >= match_threshold
      AND (filter_sources IS NULL OR obs.source = ANY(filter_sources))
      AND (filter_user_id IS NULL OR obs.user_id = filter_user_id)
    ORDER BY obs.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
