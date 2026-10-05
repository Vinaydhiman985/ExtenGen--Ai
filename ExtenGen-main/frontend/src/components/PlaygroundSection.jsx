import React, { useState } from "react";

export function PlaygroundSection() {
  const [query, setQuery] = useState("how do we handle invoice pagination and rate limits?");
  const [threshold, setThreshold] = useState(0.75);
  const [topK, setTopK] = useState(3);
  const [selectedTag, setSelectedTag] = useState("all");
  const [isExecuting, setIsExecuting] = useState(false);

  const mockResults = [
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

  const handleTestQuery = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
    }, 400);
  };

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <span className="dash-badge dash-badge-dark">🎯 Interactive Testing</span>
          <h1>Recall Playground & Explainability</h1>
          <p>Test real-time context retrieval (`recall_context`), adjust parameters, inspect "Why this memory?" score breakdowns, and preview exact prompt injections.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px" }}>
        {/* CONTROLS */}
        <div className="dash-box">
          <h3>🎮 Query Parameters</h3>
          <p className="dash-sub">Simulate an incoming AI agent prompt request</p>

          <div style={{ marginTop: "18px" }}>
            <label style={{ fontSize: "13.5px", fontWeight: 700, color: "#141414" }}>Agent Query Prompt</label>
            <textarea
              className="dash-textarea"
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter agent query..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                <label>Threshold</label>
                <span className="dash-mono dash-bold">{threshold}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#141414" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "block" }}>Top-K Limit</label>
              <select
                style={{ width: "100%", background: "#fff", border: "1.5px solid #141414", borderRadius: "12px", padding: "10px", fontSize: "14px", fontWeight: 600 }}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
            </div>
          </div>

          <button
            className="dash-pill dash-pill-dark dash-pill-big"
            style={{ width: "100%", marginTop: "24px" }}
            onClick={handleTestQuery}
          >
            {isExecuting ? "⚡ Searching Vector Space..." : "🚀 Execute Recall Search"}
          </button>
        </div>

        {/* RESULTS */}
        <div className="dash-box">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h3>Results & "Why this memory?"</h3>
              <p className="dash-sub">Feature #1 Explainability & Prompt Injection Preview</p>
            </div>
            <span className="dash-badge dash-badge-green">3 Matches Found</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {mockResults.slice(0, topK).map((res, idx) => (
              <div key={res.id} style={{ background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "18px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <span className="dash-badge dash-badge-dark">#{idx + 1}</span>
                  <span style={{ fontWeight: 700, fontSize: "16px", color: "#141414", flex: 1 }}>{res.title}</span>
                  <span className="dash-badge dash-badge-dark">{(res.finalScore * 100).toFixed(1)}% Match</span>
                </div>

                <div style={{ background: "#fff", border: "1.5px solid var(--line)", borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 800, color: "#666", marginBottom: "8px" }}>Why this memory?</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span>Cosine Similarity</span>
                      <b className="dash-mono">{(res.similarity * 100).toFixed(1)}%</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span>Recency Boost</span>
                      <span className="dash-badge dash-badge-green">{res.recencyBoost}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span>RLS Permission</span>
                      <span className="dash-badge dash-badge-white">{res.accessRule}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#141414", borderRadius: "14px", padding: "14px", color: "#e8e8e8" }}>
                  <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px" }}>Injected Markdown Snippet</div>
                  <pre style={{ margin: 0, fontSize: "13px" }}><code>{res.injectedMarkdown}</code></pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
