import React, { useState } from "react";
import { recallContext, MOCK_RECALL_RESULTS } from "../services/api.js";

export function PlaygroundSection() {
  const [query, setQuery] = useState("how do we handle invoice pagination and rate limits?");
  const [threshold, setThreshold] = useState(0.20);
  const [topK, setTopK] = useState(3);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(MOCK_RECALL_RESULTS);
  const [matchesCount, setMatchesCount] = useState(3);
  const [isLive, setIsLive] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleTestQuery = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setApiError(null);

    try {
      const response = await recallContext({
        query: query.trim(),
        limit: topK,
        similarityThreshold: threshold
      });

      setIsLive(response.isLive);
      setResults(response.results || []);
      setMatchesCount(response.matchesCount || (response.results ? response.results.length : 0));
      setHasExecuted(true);

      if (!response.isLive && response.error) {
        setApiError(response.error);
      }
    } catch (err) {
      console.warn("Recall failed, using fallback:", err);
      setIsLive(false);
      setHasExecuted(true);
      setApiError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
            <span className="dash-badge dash-badge-dark">🎯 Interactive Testing</span>
            {hasExecuted && (
              isLive ? (
                <span className="dash-status-indicator dash-status-live" style={{ padding: "3px 10px", fontSize: "11px" }}>
                  <span className="dash-pulse-dot live" /> Live POST /api/v1/context/recall
                </span>
              ) : (
                <span className="dash-status-indicator dash-status-demo" style={{ padding: "3px 10px", fontSize: "11px" }}>
                  <span className="dash-pulse-dot demo" /> Demo Mode (Mock Fallback)
                </span>
              )
            )}
          </div>
          <h1>Recall Playground & Explainability</h1>
          <p>Test real-time context retrieval (`POST /api/v1/context/recall`), adjust similarity thresholds, inspect "Why this memory?" score breakdowns, and preview exact prompt injections.</p>
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
                <label>Cosine Threshold</label>
                <span className="dash-mono dash-bold">{threshold}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#141414", marginTop: "6px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Top-K Limit</label>
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

          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--mut)", alignSelf: "center" }}>Quick Prompts:</span>
            {[
              "invoice pagination standard",
              "fastify rate limiter config",
              "background queue retry policy"
            ].map((qp) => (
              <button
                key={qp}
                className="dash-pill dash-pill-white dash-pill-sm"
                style={{ fontSize: "11.5px", padding: "4px 10px" }}
                onClick={() => setQuery(qp)}
              >
                "{qp}"
              </button>
            ))}
          </div>

          <button
            className="dash-pill dash-pill-dark dash-pill-big"
            style={{ width: "100%", marginTop: "24px" }}
            onClick={handleTestQuery}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <span className="dash-spin">⚙️</span>
                <span>Searching Vector Space...</span>
              </>
            ) : (
              "🚀 Execute Recall Search"
            )}
          </button>

          {apiError && (
            <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "10px", background: "rgba(233, 226, 58, 0.25)", border: "1px solid var(--ink)", fontSize: "12px" }}>
              <strong>Notice:</strong> Backend offline ({apiError}). Showing mock vector search fallback.
            </div>
          )}
        </div>

        {/* RESULTS */}
        <div className="dash-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h3>Results & "Why this memory?"</h3>
              <p className="dash-sub">Explainability breakdown & prompt injection preview</p>
            </div>
            <span className={`dash-badge ${results.length > 0 ? "dash-badge-green" : "dash-badge-yellow"}`}>
              {results.length} Match{results.length === 1 ? "" : "es"} (Threshold: {threshold})
            </span>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "var(--bg)", border: "1.5px dashed var(--ink)", borderRadius: "18px" }}>
              <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>🔍</span>
              <strong style={{ fontSize: "16px" }}>No memories reached threshold {threshold}</strong>
              <p className="dash-sub" style={{ marginTop: "6px" }}>
                Try lowering the cosine similarity threshold (e.g. 0.50) or capture a new observation in the Memories Hub.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {results.slice(0, topK).map((res, idx) => (
                <div key={res.id || idx} style={{ background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "18px", padding: "20px" }}>
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
                        <span>RLS Permission</span>
                        <span className="dash-badge dash-badge-white">{res.accessRule || "PASSED"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#141414", borderRadius: "14px", padding: "14px", color: "#e8e8e8" }}>
                    <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px" }}>Injected Markdown Snippet</div>
                    <pre style={{ margin: 0, fontSize: "13px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}><code>{res.injectedMarkdown}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
