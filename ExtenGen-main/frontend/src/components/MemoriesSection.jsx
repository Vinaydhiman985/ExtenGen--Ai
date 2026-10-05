import React, { useState } from "react";

export function MemoriesSection({ initialTab = "Indexed" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(true);

  const [memories, setMemories] = useState([
    {
      id: "mem-201",
      title: "Use Redis + BullMQ for asynchronous background ingestion",
      content: "All GitHub webhooks and batch vector embeddings are processed asynchronously using BullMQ with Redis 7+. Retries use exponential backoff up to 5 attempts.",
      status: "Indexed",
      author: "Ana (Claude Code)",
      org: "Acme Corp",
      tags: ["architecture", "queue"],
      secretsRedacted: 0,
      createdAt: "2026-10-05 09:12",
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
      createdAt: "2026-10-04 14:30",
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
      createdAt: "2026-09-15 11:20",
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
      createdAt: "2026-08-01 10:00",
      vectorId: "vec_0001_legacy",
      supersededBy: null,
      duplicateWarning: null
    }
  ]);

  const tabs = ["Proposed", "Indexed", "Verified", "Superseded", "Archived"];
  const allTags = ["all", "api", "db", "security", "architecture", "queue", "testing"];

  const handleApprove = (id) => {
    setMemories(memories.map(m => m.id === id ? { ...m, status: "Indexed" } : m));
    if (selectedMemory?.id === id) {
      setSelectedMemory(prev => ({ ...prev, status: "Indexed" }));
    }
  };

  const handleReject = (id) => {
    setMemories(memories.map(m => m.id === id ? { ...m, status: "Archived" } : m));
    if (selectedMemory?.id === id) {
      setSelectedMemory(prev => ({ ...prev, status: "Archived" }));
    }
  };

  const handleVerify = (id) => {
    setMemories(memories.map(m => m.id === id ? { ...m, status: "Verified" } : m));
    if (selectedMemory?.id === id) {
      setSelectedMemory(prev => ({ ...prev, status: "Verified" }));
    }
  };

  const filtered = memories.filter(m => {
    const matchesTab = m.status === activeTab;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "all" || m.tags.includes(selectedTag);
    return matchesTab && matchesSearch && matchesTag;
  });

  const proposedCount = memories.filter(m => m.status === "Proposed").length;

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <span className="dash-badge dash-badge-dark">🧠 Memory Repository</span>
          <h1>Memories Hub & Lifecycle Control</h1>
          <p>Inspect active vector memories, verify agent observations, review proposed memories (#4 Review Queue), and monitor secrets redaction.</p>
        </div>
      </div>

      {/* DUPLICATE WARNING ALERT AT STORE TIME */}
      {showDuplicateAlert && activeTab === "Proposed" && proposedCount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderRadius: "16px", background: "var(--yellow)", border: "1.5px solid var(--ink)", fontSize: "14px", fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>⚠️</span>
            <div>
              <strong>Feature #6 Duplicate Store Warning:</strong>
              <span> System detected 1 proposed memory with &gt;90% cosine similarity to existing entries. Review before indexing to prevent drift.</span>
            </div>
          </div>
          <button style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }} onClick={() => setShowDuplicateAlert(false)}>✕</button>
        </div>
      )}

      {/* LIFECYCLE STATUS TABS */}
      <div className="dash-tab-bar">
        {tabs.map(tab => {
          const count = memories.filter(m => m.status === tab).length;
          return (
            <button
              key={tab}
              className={`dash-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span>{tab === "Proposed" ? "📥 Proposed (Review Queue)" : tab}</span>
              <span style={{ fontSize: "12px", background: activeTab === tab ? "#fff" : "#e0e0dc", color: "#141414", padding: "2px 8px", borderRadius: "999px" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* CONTROLS STRIP */}
      <div className="dash-controls">
        <div className="dash-search-input-box">
          <span>🔍</span>
          <input
            type="text"
            className="dash-input"
            placeholder={`Search ${activeTab.toLowerCase()} memories...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`dash-pill ${selectedTag === tag ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag === "all" ? "🏷️ All Tags" : `#${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* MEMORIES TABLE */}
      <div className="dash-box dash-table-box">
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <span style={{ fontSize: "32px" }}>📭</span>
            <h3>No memories in "{activeTab}" status</h3>
            <p className="dash-sub">Try clearing your search query or selecting a different status tab.</p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Title & Observation Content</th>
                  <th>Tags</th>
                  <th>Secrets Redacted</th>
                  <th>Author / Org</th>
                  <th>Created</th>
                  <th>Status / Actions</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(mem => (
                  <tr key={mem.id} className="dash-row" onClick={() => setSelectedMemory(mem)}>
                    <td style={{ maxWidth: "440px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "15px", color: "#141414" }}>{mem.title}</strong>
                        {mem.duplicateWarning && (
                          <span className="dash-badge dash-badge-yellow" title={mem.duplicateWarning}>
                            ⚠️ Duplicate Warning
                          </span>
                        )}
                      </div>
                      <p className="dash-sub" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mem.content}</p>
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {mem.tags.map(t => (
                          <span key={t} className="dash-badge dash-badge-white">#{t}</span>
                        ))}
                      </div>
                    </td>

                    <td>
                      {mem.secretsRedacted > 0 ? (
                        <span className="dash-badge dash-badge-yellow">
                          🔒 {mem.secretsRedacted} secret{mem.secretsRedacted > 1 ? "s" : ""} redacted
                        </span>
                      ) : (
                        <span className="dash-sub">0 redacted</span>
                      )}
                    </td>

                    <td>
                      <strong style={{ fontSize: "14px", color: "#141414" }}>{mem.author}</strong>
                      <small className="dash-sub">{mem.org}</small>
                    </td>

                    <td style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap" }}>{mem.createdAt}</td>

                    <td>
                      {mem.status === "Proposed" ? (
                        <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="dash-pill dash-pill-green dash-pill-sm"
                            onClick={() => handleApprove(mem.id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="dash-pill dash-pill-dark dash-pill-sm"
                            onClick={() => handleReject(mem.id)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`dash-badge dash-badge-status-${mem.status.toLowerCase()}`}>
                          {mem.status}
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        className="dash-pill dash-pill-white dash-pill-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMemory(mem);
                        }}
                      >
                        👁️ Drawer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MEMORY DETAIL DRAWER */}
      {selectedMemory && (
        <div className="dash-modal-backdrop" onClick={() => setSelectedMemory(null)}>
          <div className="dash-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="dash-drawer-header">
              <div>
                <span className={`dash-badge dash-badge-status-${selectedMemory.status.toLowerCase()}`}>
                  {selectedMemory.status}
                </span>
                <span className="dash-badge dash-badge-white" style={{ marginLeft: "8px" }}>ID: {selectedMemory.id}</span>
              </div>
              <button className="dash-close-btn" onClick={() => setSelectedMemory(null)}>✕</button>
            </div>

            <div className="dash-drawer-body">
              <h2 style={{ font: "400 28px/1 var(--disp)", textTransform: "uppercase" }}>{selectedMemory.title}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--bg)", border: "1.5px solid var(--line)", borderRadius: "14px", padding: "16px" }}>
                <div><span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>Author</span><b>{selectedMemory.author}</b></div>
                <div><span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>Organization</span><b>{selectedMemory.org}</b></div>
                <div><span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>Created At</span><b>{selectedMemory.createdAt}</b></div>
                <div><span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>pgvector ID</span><code className="dash-mono">{selectedMemory.vectorId}</code></div>
              </div>

              <div>
                <span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>Full Observation Content</span>
                <div style={{ background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "14px", padding: "16px", fontSize: "15px", lineHeight: "1.6" }}>
                  {selectedMemory.content}
                </div>
              </div>

              <div>
                <span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>PostgreSQL Row-Level Security Policy</span>
                <pre style={{ background: "#141414", color: "#e8e8e8", padding: "14px", borderRadius: "14px", fontSize: "13px" }}>
<code>{`-- Supabase Postgres RLS Enforced\nCREATE POLICY "org_isolation_policy" ON memories\nFOR SELECT USING (org_id = current_setting('app.current_org_id'));`}</code>
                </pre>
              </div>
            </div>

            <div className="dash-drawer-footer">
              {selectedMemory.status === "Proposed" ? (
                <>
                  <button className="dash-pill dash-pill-green" onClick={() => handleApprove(selectedMemory.id)}>✓ Approve & Index</button>
                  <button className="dash-pill dash-pill-dark" onClick={() => handleReject(selectedMemory.id)}>✕ Reject</button>
                </>
              ) : selectedMemory.status !== "Verified" ? (
                <button className="dash-pill dash-pill-yellow" onClick={() => handleVerify(selectedMemory.id)}>⭐ Mark as Verified</button>
              ) : (
                <button className="dash-pill dash-pill-white" onClick={() => setSelectedMemory(null)}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
