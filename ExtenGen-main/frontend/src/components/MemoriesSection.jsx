import React, { useState, useEffect } from "react";
import { fetchObservations, createObservation, MOCK_MEMORIES } from "../services/api.js";

export function MemoriesSection({ initialTab = "Indexed" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(true);
  const [memories, setMemories] = useState(MOCK_MEMORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Observation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createFeedback, setCreateFeedback] = useState(null);

  // Load memories on component mount
  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const result = await fetchObservations({ limit: 50 });
      setIsLive(result.isLive);
      if (result.observations && result.observations.length > 0) {
        setMemories(result.observations);
      }
    } catch (err) {
      console.warn("Failed to fetch memories, using fallback:", err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchObservations({ limit: 50 });
      setIsLive(result.isLive);
      if (result.observations && result.observations.length > 0) {
        setMemories(result.observations);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateObservation = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    setCreateFeedback(null);

    const tagList = newTags
      .split(",")
      .map(t => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const result = await createObservation({
      content: newContent.trim(),
      title: newTitle.trim() || undefined,
      source: "dashboard",
      tags: tagList.length > 0 ? tagList : ["general"],
      immediateEmbed: true
    });

    setIsSubmitting(false);

    if (result.ok && result.observation) {
      setMemories(prev => [result.observation, ...prev]);
      setCreateFeedback({ success: true, message: "Observation captured and stored!" });
      setTimeout(() => {
        setShowCreateModal(false);
        setNewTitle("");
        setNewContent("");
        setNewTags("");
        setCreateFeedback(null);
        setActiveTab("Indexed");
      }, 900);
    } else {
      // Local fallback creation if backend offline
      const fallbackItem = {
        id: `mem-${Date.now().toString().slice(-4)}`,
        title: newTitle.trim() || newContent.trim().slice(0, 50),
        content: newContent.trim(),
        status: "Indexed",
        author: "Dashboard User",
        org: "Acme Corp",
        tags: tagList.length > 0 ? tagList : ["general"],
        secretsRedacted: 0,
        createdAt: "Just now",
        vectorId: `vec_${Date.now().toString().slice(-4)}_local`,
        supersededBy: null,
        duplicateWarning: null
      };
      setMemories(prev => [fallbackItem, ...prev]);
      setCreateFeedback({ success: true, message: "Saved in local Demo Mode." });
      setTimeout(() => {
        setShowCreateModal(false);
        setNewTitle("");
        setNewContent("");
        setNewTags("");
        setCreateFeedback(null);
        setActiveTab("Indexed");
      }, 900);
    }
  };

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
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
            <span className="dash-badge dash-badge-dark">🧠 Memory Repository</span>
            {isLive ? (
              <span className="dash-status-indicator dash-status-live" style={{ padding: "3px 10px", fontSize: "11px" }}>
                <span className="dash-pulse-dot live" /> Live API Connected
              </span>
            ) : (
              <span className="dash-status-indicator dash-status-demo" style={{ padding: "3px 10px", fontSize: "11px" }}>
                <span className="dash-pulse-dot demo" /> Demo Mode (Mock Fallback)
              </span>
            )}
          </div>
          <h1>Memories Hub & Lifecycle Control</h1>
          <p>Inspect active vector memories, verify agent observations, review proposed memories (#4 Review Queue), and monitor secrets redaction.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="dash-pill dash-pill-white dash-pill-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Reload memories from server"
          >
            <span className={isRefreshing ? "dash-spin" : ""}>🔄</span>
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            className="dash-pill dash-pill-dark dash-pill-sm"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Capture Observation
          </button>
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

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
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
        {isLoading ? (
          <div style={{ padding: "50px", textAlign: "center" }}>
            <span className="dash-spin" style={{ fontSize: "32px", display: "inline-block", marginBottom: "12px" }}>⚙️</span>
            <h3>Loading Vector Memories...</h3>
            <p className="dash-sub">Connecting to GET /api/v1/observations</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <span style={{ fontSize: "32px" }}>📭</span>
            <h3>No memories in "{activeTab}" status</h3>
            <p className="dash-sub">Try clearing your search query, selecting a different status tab, or capturing a new observation.</p>
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
                        {(mem.tags || []).map(t => (
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

      {/* CREATE NEW OBSERVATION MODAL */}
      {showCreateModal && (
        <div className="dash-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px" }}>
              <div>
                <span className="dash-badge dash-badge-dark">POST /api/v1/observations</span>
                <h2 style={{ font: "400 30px/1 var(--disp)", textTransform: "uppercase", margin: "8px 0 0" }}>Capture New Memory</h2>
                <p className="dash-sub">Store an architectural decision, lesson learned, or workflow rule.</p>
              </div>
              <button className="dash-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {createFeedback && (
              <div style={{ padding: "12px 16px", borderRadius: "12px", background: "var(--yellow)", border: "1.5px solid var(--ink)", marginBottom: "16px", fontWeight: 700 }}>
                {createFeedback.message}
              </div>
            )}

            <form onSubmit={handleCreateObservation} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Title / Decision Summary (Optional)
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "12px", padding: "10px 14px", width: "100%" }}
                  placeholder="e.g. Use Redis + BullMQ for background ingestion"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Observation Content <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <textarea
                  className="dash-textarea"
                  rows={4}
                  required
                  placeholder="Describe the context, decision, or rationale..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "12px", padding: "10px 14px", width: "100%" }}
                  placeholder="architecture, db, pagination"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="dash-pill dash-pill-white"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-pill dash-pill-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "⚡ Vectorizing & Saving..." : "💾 Save & Vectorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
