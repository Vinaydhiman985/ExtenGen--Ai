import React, { useState } from "react";

export function ActivitySection() {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [ratings, setRatings] = useState({});

  const activities = [
    {
      id: "act-101",
      time: "10:12:44 AM",
      type: "recall",
      agent: "Claude Code",
      project: "ExtenGen / API",
      query: "How do we implement cursor pagination for /orders endpoint?",
      latency: "14ms",
      status: "200 OK",
      memoriesReturned: 3,
      topScore: 0.934,
      tokenSaved: 1420,
      feedback: "up",
      sessionReplay: {
        sessionId: "sess_claude_9912a",
        steps: [
          {
            stepNum: 1,
            title: "recall_context",
            sub: "MCP Tool Call",
            details: "Query: 'How do we implement cursor pagination for /orders endpoint?' (Top-K: 3, Threshold: 0.75)",
            scoreBreakdown: {
              similarity: 0.892,
              recencyBoost: 1.05,
              accessRule: "PASSED (Acme Corp / Org Scope)",
              finalScore: 0.934
            }
          },
          {
            stepNum: 2,
            title: "Code Execution & Diff",
            sub: "Claude Code Generation",
            details: "Agent generated `/src/api/routes/orders.ts` with `where id > cursor limit 20` pattern based on recalled decision.",
            diffSnippet: `+ const cursor = req.query.cursor;\n+ const items = stroke.query("SELECT * FROM orders WHERE id > $1 ORDER BY id ASC LIMIT $2", [cursor, limit]);`
          },
          {
            stepNum: 3,
            title: "store_observation",
            sub: "MCP Auto-Ingestion",
            details: "Saved decision: 'Use opaque base64 encoded cursors combining created_at and id to prevent key enumeration'."
          }
        ]
      }
    },
    {
      id: "act-102",
      time: "10:15:02 AM",
      type: "store",
      agent: "Cursor IDE",
      project: "ExtenGen / DB",
      query: "Saved observation: pgvector HNSW index configured with m=16, ef_construction=64",
      latency: "22ms",
      status: "201 Created",
      secretsRedacted: 1,
      tokenSaved: 0,
      feedback: null,
      sessionReplay: {
        sessionId: "sess_cursor_4412b",
        steps: [
          {
            stepNum: 1,
            title: "Observation Ingestion",
            sub: "store_observation call",
            details: "Agent captured vector index optimization decision during database migration task."
          },
          {
            stepNum: 2,
            title: "Secret Redaction Engine",
            sub: "Backend Feature #8",
            details: "Automated scanner detected Database Connection URI with password and redacted token before embedding.",
            redactedChip: "1 Secret Redacted (PGPASSWORD)"
          },
          {
            stepNum: 3,
            title: "pgvector Indexing",
            sub: "Vector Pipeline",
            details: "Generated 1536-d embedding via OpenAI API and stored in `memories` table."
          }
        ]
      }
    },
    {
      id: "act-103",
      time: "10:28:19 AM",
      type: "recall",
      agent: "Codex CLI",
      project: "ExtenGen / Ingestion",
      query: "Fastify CORS origin configuration and credentials header",
      latency: "11ms",
      status: "200 OK",
      memoriesReturned: 2,
      topScore: 0.885,
      tokenSaved: 890,
      feedback: "up",
      sessionReplay: {
        sessionId: "sess_codex_7719c",
        steps: [
          {
            stepNum: 1,
            title: "recall_context",
            sub: "MCP Tool Call",
            details: "Query: 'Fastify CORS origin configuration and credentials header'",
            scoreBreakdown: {
              similarity: 0.860,
              recencyBoost: 1.03,
              accessRule: "PASSED (Acme Corp)",
              finalScore: 0.885
            }
          },
          {
            stepNum: 2,
            title: "Prompt Context Injection",
            sub: "System Prompt Injection",
            details: "Injected memory snippet `#104: Use @fastify/cors with origin: true and credentials: true for SSE stream compatibility` directly into LLM prompt."
          }
        ]
      }
    },
    {
      id: "act-104",
      time: "10:44:50 AM",
      type: "recall",
      agent: "Claude Code",
      project: "ExtenGen / Queue",
      query: "BullMQ queue retry policy with exponential backoff",
      latency: "16ms",
      status: "200 OK",
      memoriesReturned: 4,
      topScore: 0.961,
      tokenSaved: 2150,
      feedback: "up",
      sessionReplay: {
        sessionId: "sess_claude_1002d",
        steps: [
          {
            stepNum: 1,
            title: "recall_context",
            sub: "MCP Tool Call",
            details: "Query: 'BullMQ queue retry policy with exponential backoff'",
            scoreBreakdown: {
              similarity: 0.942,
              recencyBoost: 1.02,
              accessRule: "PASSED",
              finalScore: 0.961
            }
          },
          {
            stepNum: 2,
            title: "Code Generation",
            sub: "Worker Queue Setup",
            details: "Generated background job worker with `attempts: 5, backoff: { type: 'exponential', delay: 1000 }`."
          }
        ]
      }
    },
    {
      id: "act-105",
      time: "11:02:11 AM",
      type: "store",
      agent: "Claude Code",
      project: "ExtenGen / Frontend",
      query: "Vite + PostCSS configuration fix for sub-directory builds",
      latency: "19ms",
      status: "201 Created",
      secretsRedacted: 0,
      tokenSaved: 0,
      feedback: null,
      sessionReplay: {
        sessionId: "sess_claude_1109e",
        steps: [
          {
            stepNum: 1,
            title: "store_observation",
            sub: "Frontend Setup",
            details: "Created root postcss.config.js in frontend subfolder to avoid root-drive directory traversal errors."
          }
        ]
      }
    }
  ];

  const handleRate = (id, rating) => {
    setRatings(prev => ({
      ...prev,
      [id]: prev[id] === rating ? null : rating
    }));
  };

  const filtered = activities.filter(a => {
    if (filterType === "recall") return a.type === "recall";
    if (filterType === "store") return a.type === "store";
    return true;
  });

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <span className="dash-badge dash-badge-green">⚡ Real-Time Activity Feed</span>
          <h1>Activity Calls & Session Replay</h1>
          <p>Live stream of `store_observation` and `recall_context` events. Click any entry to inspect full Session Replay timelines and score breakdowns.</p>
        </div>

        <div className="dash-picker">
          <button
            className={`dash-picker-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Events ({activities.length})
          </button>
          <button
            className={`dash-picker-btn ${filterType === "recall" ? "active" : ""}`}
            onClick={() => setFilterType("recall")}
          >
            🎯 Recalls (3)
          </button>
          <button
            className={`dash-picker-btn ${filterType === "store" ? "active" : ""}`}
            onClick={() => setFilterType("store")}
          >
            📥 Ingested Stores (2)
          </button>
        </div>
      </div>

      {/* ACTIVITY TABLE */}
      <div className="dash-box dash-table-box">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event Type</th>
                <th>Agent Client</th>
                <th>Query / Observation Text</th>
                <th>Latency</th>
                <th>Relevance / Detail</th>
                <th>Feedback</th>
                <th>Replay</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const currentRating = ratings[item.id] || item.feedback;
                return (
                  <tr key={item.id} className="dash-row" onClick={() => setSelectedActivity(item)}>
                    <td style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap" }}>{item.time}</td>
                    <td>
                      <span className={`dash-badge ${item.type === "recall" ? "dash-badge-dark" : "dash-badge-yellow"}`}>
                        {item.type === "recall" ? "🎯 recall_context" : "📥 store_observation"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "14px", color: "#141414" }}>🤖 {item.agent}</strong>
                      <small className="dash-sub">{item.project}</small>
                    </td>
                    <td style={{ maxWidth: "380px" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#141414" }}>{item.query}</div>
                      {item.tokenSaved > 0 && (
                        <span className="dash-badge dash-badge-green" style={{ marginTop: "4px" }}>⚡ {item.tokenSaved} tokens saved</span>
                      )}
                      {item.secretsRedacted > 0 && (
                        <span className="dash-badge dash-badge-yellow" style={{ marginTop: "4px" }}>🔒 Secret Redacted</span>
                      )}
                    </td>
                    <td className="dash-mono dash-bold">{item.latency}</td>
                    <td>
                      {item.type === "recall" ? (
                        <div>
                          <b className="dash-mono">{(item.topScore * 100).toFixed(1)}%</b>
                          <small className="dash-sub">{item.memoriesReturned} memories</small>
                        </div>
                      ) : (
                        <span className="dash-badge dash-badge-white">Indexed</span>
                      )}
                    </td>
                    <td>
                      {item.type === "recall" ? (
                        <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="dash-pill dash-pill-white dash-pill-sm"
                            style={{ background: currentRating === "up" ? "#dcfce7" : "#fff" }}
                            onClick={() => handleRate(item.id, "up")}
                          >
                            👍
                          </button>
                          <button
                            className="dash-pill dash-pill-white dash-pill-sm"
                            style={{ background: currentRating === "down" ? "#fee2e2" : "#fff" }}
                            onClick={() => handleRate(item.id, "down")}
                          >
                            👎
                          </button>
                        </div>
                      ) : (
                        <span className="dash-sub">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="dash-pill dash-pill-white dash-pill-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivity(item);
                        }}
                      >
                        🎬 Replay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SESSION REPLAY MODAL */}
      {selectedActivity && (
        <div className="dash-modal-backdrop" onClick={() => setSelectedActivity(null)}>
          <div className="dash-modal-card" style={{ maxWidth: "780px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <span className="dash-badge dash-badge-dark">🎬 #3 Session Replay Timeline</span>
                <h2 style={{ margin: "6px 0 0", font: "400 32px/1 var(--disp)", textTransform: uppercase }}>{selectedActivity.agent} Event Session</h2>
                <p className="dash-sub" style={{ fontSize: "14px" }}>Replay of: <code>{selectedActivity.query}</code></p>
              </div>
              <button className="dash-close-btn" onClick={() => setSelectedActivity(null)}>✕</button>
            </div>

            <div style={{ display: "flex", gap: "20px", background: "var(--bg)", border: "1.5px solid var(--ink)", padding: "12px 18px", borderRadius: "14px", marginBottom: "20px", fontSize: "13.5px", fontWeight: 600 }}>
              <span>Session ID: <code>{selectedActivity.sessionReplay?.sessionId}</code></span>
              <span>Time: <b>{selectedActivity.time}</b></span>
              <span>Latency: <b>{selectedActivity.latency}</b></span>
              <span>Status: <b>{selectedActivity.status}</b></span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "440px", overflowY: "auto" }}>
              {selectedActivity.sessionReplay?.steps.map((step) => (
                <div key={step.stepNum} style={{ display: "flex", gap: "16px", background: "#fff", border: "1.5px solid var(--ink)", borderRadius: "16px", padding: "18px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--ink)", color: "#fff", fontWeight: 800, fontSize: "14px", display: "grid", placeItems: "center", flexShrink: 0 }}>{step.stepNum}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", color: "#141414" }}>{step.title}</h4>
                      <span className="dash-badge dash-badge-white">{step.sub}</span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>{step.details}</p>

                    {step.scoreBreakdown && (
                      <div style={{ background: "var(--bg)", border: "1.5px solid var(--line)", borderRadius: "12px", padding: "14px", marginTop: "12px" }}>
                        <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 800, color: "#141414", marginBottom: "8px" }}>📊 Score Breakdown</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                          <div><span className="dash-sub">Similarity</span><b>{step.scoreBreakdown.similarity}</b></div>
                          <div><span className="dash-sub">Recency</span><b>+{((step.scoreBreakdown.recencyBoost - 1) * 100).toFixed(0)}%</b></div>
                          <div><span className="dash-sub">RLS Policy</span><b>{step.scoreBreakdown.accessRule}</b></div>
                          <div><span className="dash-sub">Final Score</span><b>{(step.scoreBreakdown.finalScore * 100).toFixed(1)}%</b></div>
                        </div>
                      </div>
                    )}

                    {step.diffSnippet && (
                      <div style={{ background: "#141414", borderRadius: "12px", overflow: "hidden", marginTop: "12px" }}>
                        <div style={{ fontSize: "12px", color: "#aaa", padding: "8px 14px", background: "rgba(255,255,255,0.05)" }}>Code Diff</div>
                        <pre style={{ padding: "12px", margin: 0, color: "#4ade80", fontSize: "13px" }}><code>{step.diffSnippet}</code></pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
              <button className="dash-pill dash-pill-dark" onClick={() => setSelectedActivity(null)}>
                Close Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
