/**
 * ExtenGen Frontend API Service Layer
 * 
 * Handles communication with the Fastify backend:
 * - GET /health (connectivity check)
 * - GET /api/v1/observations (fetch stored memories)
 * - POST /api/v1/observations (store new memory)
 * - POST /api/v1/context/recall (semantic vector search)
 * 
 * Includes automated fallback to realistic mock data and "Demo Mode" state
 * when the backend server is unreachable.
 */

// Initial Mock Memories Dataset for Demo Mode fallback
export const MOCK_MEMORIES = [
  {
    id: "mem-201",
    title: "Use Redis + BullMQ for asynchronous background ingestion",
    content: "All GitHub webhooks and batch vector embeddings are processed asynchronously using BullMQ with Redis 7+. Retries use exponential backoff up to 5 attempts.",
    status: "Indexed",
    author: "Ana (Claude Code)",
    org: "Acme Corp",
    tags: ["architecture", "queue"],
    secretsRedacted: 0,
    createdAt: "Oct 5, 09:12 AM",
    vectorId: "vec_9921_hnsw",
    supersededBy: null,
    duplicateWarning: null
  },
  {
    id: "mem-202",
    title: "Fastify CORS configuration for SSE streaming",
    content: "Always configure @fastify/cors with origin: true and credentials: true to allow browser clients to stream MCP Server-Sent Events without preflight errors.",
    status: "Verified",
    author: "Vinay Dhiman",
    org: "Acme Corp",
    tags: ["api", "security"],
    secretsRedacted: 1,
    createdAt: "Oct 4, 02:30 PM",
    vectorId: "vec_8812_hnsw",
    supersededBy: null,
    duplicateWarning: null
  },
  {
    id: "mem-203",
    title: "Proposed: Always use base64 cursors for order pagination",
    content: "Agent proposed: When querying /orders endpoint, do not use OFFSET. Use opaque base64 encoded cursor strings combining created_at timestamp and order id.",
    status: "Proposed",
    author: "Claude Code Agent",
    org: "Acme Corp",
    tags: ["api", "db"],
    secretsRedacted: 0,
    createdAt: "10 mins ago",
    vectorId: "pending_embedding",
    supersededBy: null,
    duplicateWarning: "⚠️ 94% similarity match with memory #mem-201 (Off-by-one pagination rule)"
  },
  {
    id: "mem-204",
    title: "Proposed: Enforce PostgreSQL Row-Level Security (RLS) on memories table",
    content: "Agent proposed: All queries must pass auth.uid() and current_setting('app.current_org_id') into pgvector search function to prevent cross-tenant memory leak.",
    status: "Proposed",
    author: "Cursor IDE Agent",
    org: "Acme Corp",
    tags: ["security", "db"],
    secretsRedacted: 2,
    createdAt: "25 mins ago",
    vectorId: "pending_embedding",
    supersededBy: null,
    duplicateWarning: null
  },
  {
    id: "mem-205",
    title: "Proposed: Use Vitest for parallel worker test execution",
    content: "Agent proposed: Run Vitest with --threads=true for fast unit testing of Fastify routes.",
    status: "Proposed",
    author: "Codex CLI Agent",
    org: "Acme Corp",
    tags: ["testing"],
    secretsRedacted: 0,
    createdAt: "1 hour ago",
    vectorId: "pending_embedding",
    supersededBy: null,
    duplicateWarning: null
  },
  {
    id: "mem-206",
    title: "Legacy: Offset-based pagination for /orders API",
    content: "Use page and limit query params for SQL OFFSET queries.",
    status: "Superseded",
    author: "Ravi",
    org: "Acme Corp",
    tags: ["api"],
    secretsRedacted: 0,
    createdAt: "Sep 15, 11:20 AM",
    vectorId: "vec_1002_arch",
    supersededBy: "mem-203",
    duplicateWarning: null
  },
  {
    id: "mem-207",
    title: "Old OpenAI Ada-002 embedding dimension config",
    content: "1536d vector format with Ada-002 model.",
    status: "Archived",
    author: "Sreedharan",
    org: "Acme Corp",
    tags: ["architecture"],
    secretsRedacted: 0,
    createdAt: "Aug 1, 10:00 AM",
    vectorId: "vec_0001_legacy",
    supersededBy: null,
    duplicateWarning: null
  }
];

export const MOCK_RECALL_RESULTS = [
  {
    id: "mem-201",
    title: "Use opaque base64 cursors for invoice and order pagination",
    similarity: 0.942,
    recencyBoost: "+4%",
    accessRule: "PASSED (Org: Acme Corp)",
    finalScore: 0.961,
    injectedMarkdown: `### [ExtenGen Memory #mem-201]\n**Topic**: Invoice & Order Pagination Standard\n**Decision**: Use opaque base64 encoded cursor strings combining created_at timestamp and order ID. Do NOT use SQL OFFSET pagination.\n**Source**: Claude Code session (2026-10-05)`
  },
  {
    id: "mem-202",
    title: "Fastify API rate limiting with Redis token bucket",
    similarity: 0.884,
    recencyBoost: "+2%",
    accessRule: "PASSED (Org: Acme Corp)",
    finalScore: 0.901,
    injectedMarkdown: `### [ExtenGen Memory #mem-202]\n**Topic**: Fastify Rate Limiter\n**Decision**: Enforce 100 req/min per IP using Redis rate-limiter plugin on /api/v1 endpoints.\n**Source**: Vinay Dhiman (2026-10-04)`
  },
  {
    id: "mem-203",
    title: "BullMQ queue retry policy with exponential backoff",
    similarity: 0.791,
    recencyBoost: "+0%",
    accessRule: "PASSED (Org: Acme Corp)",
    finalScore: 0.791,
    injectedMarkdown: `### [ExtenGen Memory #mem-203]\n**Topic**: Background Job Retry Policy\n**Decision**: Retries configured with 5 max attempts and 1000ms exponential delay.\n**Source**: Sreedharan (2026-10-02)`
  }
];

// Helper to format backend Observation into UI Presentation Object
export function formatObservationForUI(obs) {
  const metadata = obs.metadata || {};
  let status = "Indexed";
  if (obs.status === "pending_embedding") {
    status = "Proposed";
  } else if (metadata.verified) {
    status = "Verified";
  } else if (metadata.superseded) {
    status = "Superseded";
  } else if (obs.status === "failed") {
    status = "Archived";
  } else if (obs.status === "indexed") {
    status = "Indexed";
  }

  const tags = Array.isArray(metadata.tags) && metadata.tags.length > 0
    ? metadata.tags
    : [obs.source || "general"];

  let formattedDate = "Just now";
  if (obs.created_at) {
    try {
      const d = new Date(obs.created_at);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    } catch {
      formattedDate = obs.created_at;
    }
  }

  const author = metadata.agent_name || (
    obs.source === "agent_session" ? "Claude Code Agent" :
    obs.source === "github_pr" ? "GitHub PR" :
    obs.source === "github_commit" ? "GitHub Commits" :
    obs.source === "api" ? "REST API" :
    obs.source || "ExtenGen Agent"
  );

  return {
    id: obs.id,
    title: obs.title || obs.content.slice(0, 65) + (obs.content.length > 65 ? "..." : ""),
    content: obs.content,
    status,
    rawStatus: obs.status,
    author,
    org: obs.org_id ? `Org (${obs.org_id.slice(0, 8)})` : "Acme Corp",
    tags,
    secretsRedacted: metadata.secretsRedacted || 0,
    createdAt: formattedDate,
    vectorId: obs.embedding ? `vec_${obs.id.slice(0, 8)}_hnsw` : (obs.status === "pending_embedding" ? "pending_embedding" : "unindexed"),
    supersededBy: metadata.supersededBy || null,
    duplicateWarning: metadata.duplicateWarning || null,
    metadata
  };
}

/**
 * Format scored observation for the Playground results display
 */
export function formatScoredObservationForUI(scoredObs, index) {
  const similarityScore = typeof scoredObs.similarity === "number" ? scoredObs.similarity : 0;
  const title = scoredObs.title || scoredObs.content.slice(0, 60) + "...";
  
  return {
    id: scoredObs.id || `live-${index + 1}`,
    title,
    similarity: similarityScore,
    accessRule: `PASSED (Org: ${scoredObs.org_id ? scoredObs.org_id.slice(0, 8) : "Acme Corp"})`,
    finalScore: similarityScore,
    injectedMarkdown: `### [ExtenGen Memory #${scoredObs.id ? scoredObs.id.slice(0, 8) : index + 1}]\n**Topic**: ${title}\n**Content**: ${scoredObs.content}\n**Source**: ${scoredObs.source || "agent_session"}\n**Cosine Similarity**: ${(similarityScore * 100).toFixed(1)}%`
  };
}

// Global API connection status state
let _apiStatusListeners = [];
let _currentStatus = {
  isLive: false,
  checked: false,
  error: null
};

export function subscribeApiStatus(listener) {
  _apiStatusListeners.push(listener);
  listener(_currentStatus);
  return () => {
    _apiStatusListeners = _apiStatusListeners.filter(l => l !== listener);
  };
}

function notifyStatus(status) {
  _currentStatus = { ..._currentStatus, ...status, checked: true };
  _apiStatusListeners.forEach(listener => listener(_currentStatus));
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
  try {
    const res = await fetch("/health", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      notifyStatus({ isLive: true, error: null });
      return { ok: true, isLive: true, data };
    }
    notifyStatus({ isLive: false, error: `HTTP ${res.status}` });
    return { ok: false, isLive: false };
  } catch (err) {
    notifyStatus({ isLive: false, error: err.message });
    return { ok: false, isLive: false, error: err.message };
  }
}

/**
 * Fetch observations from backend or fallback to mock
 */
export async function fetchObservations({ limit = 50, source } = {}) {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.set("limit", limit.toString());
  if (source) queryParams.set("source", source);

  try {
    const res = await fetch(`/api/v1/observations?${queryParams.toString()}`, {
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    notifyStatus({ isLive: true, error: null });

    // When backend is live, return its actual observations (never mask an empty DB with mock data)
    const uiObservations = (data.observations || []).map(formatObservationForUI);

    return {
      ok: true,
      isLive: true,
      count: data.count || 0,
      observations: uiObservations,
      isBackendEmpty: uiObservations.length === 0
    };
  } catch (err) {
    // API failed or offline - graceful fallback to mock data
    notifyStatus({ isLive: false, error: err.message });
    return {
      ok: false,
      isLive: false,
      isFallback: true,
      error: err.message,
      observations: MOCK_MEMORIES
    };
  }
}

/**
 * Store a new observation
 */
export async function createObservation({
  content,
  title,
  source = "dashboard",
  tags = [],
  metadata = {},
  immediateEmbed = true
}) {
  try {
    const res = await fetch("/api/v1/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        title,
        source,
        tags,
        metadata,
        immediateEmbed
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed with status ${res.status}`);
    }

    const data = await res.json();
    notifyStatus({ isLive: true, error: null });

    return {
      ok: true,
      observation: formatObservationForUI(data.observation)
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}

/**
 * Recall context using semantic search
 */
export async function recallContext({
  query,
  limit = 5,
  similarityThreshold = 0.3,
  sources,
  tags
}) {
  try {
    const res = await fetch("/api/v1/context/recall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limit,
        similarityThreshold,
        sources,
        tags
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    notifyStatus({ isLive: true, error: null });

    const rawMatches = data.result?.observations || [];
    const formattedResults = rawMatches.map((obs, idx) => formatScoredObservationForUI(obs, idx));

    return {
      ok: true,
      isLive: true,
      matchesCount: data.result?.matchesCount || formattedResults.length,
      formattedContext: data.result?.formattedContext || "",
      results: formattedResults
    };
  } catch (err) {
    // Graceful fallback to simulated results in demo mode
    notifyStatus({ isLive: false, error: err.message });

    // Filter mock results by similarity threshold simulation
    const simulated = MOCK_RECALL_RESULTS.filter(r => r.similarity >= similarityThreshold).slice(0, limit);

    return {
      ok: false,
      isLive: false,
      isFallback: true,
      error: err.message,
      matchesCount: simulated.length,
      formattedContext: simulated.map(s => s.injectedMarkdown).join("\n\n---\n\n"),
      results: simulated
    };
  }
}
