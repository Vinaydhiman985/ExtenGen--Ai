import React, { useState } from "react";

export function GitHubSyncSection({ onNavigateToMemories }) {
  const [repoInput, setRepoInput] = useState("neeraj-ch7/ExtenGen");
  const [branchInput, setBranchInput] = useState("main");
  const [tokenInput, setTokenInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const [activeTab, setActiveTab] = useState("repos");

  // Ingested repositories
  const repos = [
    {
      id: "repo-1",
      fullName: "neeraj-ch7/ExtenGen",
      branch: "main",
      status: "Synced & Active",
      lastSync: "10 mins ago",
      commitsIngested: 142,
      prsIngested: 28,
      memoriesCreated: 170,
      webhookConfigured: true
    },
    {
      id: "repo-2",
      fullName: "acme-corp/billing-service",
      branch: "main",
      status: "Synced",
      lastSync: "2 hours ago",
      commitsIngested: 89,
      prsIngested: 14,
      memoriesCreated: 103,
      webhookConfigured: true
    },
    {
      id: "repo-3",
      fullName: "acme-corp/api-gateway",
      branch: "develop",
      status: "Idle",
      lastSync: "1 day ago",
      commitsIngested: 210,
      prsIngested: 45,
      memoriesCreated: 255,
      webhookConfigured: false
    }
  ];

  // Ingested GitHub PRs & Commits memory items
  const ingestedEvents = [
    {
      id: "gh-1",
      type: "pull_request",
      repo: "neeraj-ch7/ExtenGen",
      title: "PR #42: Add pgvector HNSW index tuning with ef_construction=64",
      author: "Ana (GitHub)",
      mergedAt: "11:40 AM Today",
      commitHash: "8b9f1a2",
      memoriesCreated: 2,
      summary: "Merged PR embeddings saved: optimized cosine distance queries using HNSW index parameters m=16, ef_construction=64."
    },
    {
      id: "gh-2",
      type: "push",
      repo: "neeraj-ch7/ExtenGen",
      title: "Commit: Fix Fastify CORS preflight headers for SSE stream",
      author: "Vinay Dhiman",
      mergedAt: "Yesterday 4:15 PM",
      commitHash: "f421c90",
      memoriesCreated: 1,
      summary: "Pushed commit: added @fastify/cors plugin with origin: true to allow Claude Code MCP server-sent events."
    },
    {
      id: "gh-3",
      type: "pull_request",
      repo: "acme-corp/billing-service",
      title: "PR #18: Replace OFFSET queries with base64 cursor pagination",
      author: "Ravi",
      mergedAt: "2 days ago",
      commitHash: "10a992b",
      memoriesCreated: 3,
      summary: "Merged PR embeddings saved: enforced base64 cursor strings combining created_at and invoice ID across /invoices API."
    }
  ];

  const handleSyncSubmit = (e) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncSuccess(false);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setLastSyncResult({
        repo: repoInput,
        commits: 12,
        pullRequests: 3,
        memoriesCreated: 15,
        time: "Just now"
      });
    }, 1200);
  };

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <span className="dash-badge dash-badge-dark">🐙 Automated Repository Ingestion</span>
          <h1>GitHub Sync & Webhooks</h1>
          <p>Ingest merged Pull Requests, commit messages, and diff summaries into ExtenGen memory via REST API or automated GitHub Webhooks.</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Synced Repositories</span>
            <span>🐙</span>
          </div>
          <div className="dash-kpi-val">3</div>
          <div className="dash-kpi-sub pos">
            <span>2 Active Webhooks</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Ingested PRs</span>
            <span>🔀</span>
          </div>
          <div className="dash-kpi-val">87</div>
          <div className="dash-kpi-sub pos">
            <span>Merged PR context</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Commits Extracted</span>
            <span>📝</span>
          </div>
          <div className="dash-kpi-val">441</div>
          <div className="dash-kpi-sub pos">
            <span>Commit message vectors</span>
          </div>
        </div>

        <div className="dash-kpi-card highlight">
          <div className="dash-kpi-top">
            <span>GitHub Memories</span>
            <span>🧠</span>
          </div>
          <div className="dash-kpi-val">528</div>
          <div className="dash-kpi-sub pos">
            <span>Auto-fed to agent prompts</span>
          </div>
        </div>
      </div>

      {/* SYNC FORM & WEBHOOK CONFIG */}
      <div className="dash-grid-2">
        {/* REPO SYNC TRIGGER FORM */}
        <div className="dash-box">
          <h3>🚀 Ingest GitHub Repository</h3>
          <p className="dash-sub" style={{ marginTop: "4px" }}>Trigger on-demand fetch via `/api/v1/ingest/github` endpoint</p>

          {syncSuccess && (
            <div style={{ background: "#dcfce7", border: "1.5px solid #118a4b", borderRadius: "14px", padding: "14px", margin: "16px 0", color: "#0e4d3a" }}>
              <strong>✓ Ingestion Job Completed!</strong>
              <p style={{ fontSize: "13.5px", marginTop: "4px" }}>
                Ingested <strong>{lastSyncResult?.commits} commits</strong> and <strong>{lastSyncResult?.pullRequests} PRs</strong> from <code>{lastSyncResult?.repo}</code>. Created {lastSyncResult?.memoriesCreated} vector memories.
              </p>
            </div>
          )}

          <form onSubmit={handleSyncSubmit} style={{ marginTop: "16px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, display: "block" }}>Repository Name (owner/repo)</label>
              <input
                type="text"
                className="dash-input"
                style={{ border: "1.5px solid #141414", borderRadius: "10px", padding: "10px 14px", marginTop: "4px" }}
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g. neeraj-ch7/ExtenGen"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block" }}>Target Branch</label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ border: "1.5px solid #141414", borderRadius: "10px", padding: "10px 14px", marginTop: "4px" }}
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  placeholder="main"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block" }}>GitHub PAT Token (Optional)</label>
                <input
                  type="password"
                  className="dash-input"
                  style={{ border: "1.5px solid #141414", borderRadius: "10px", padding: "10px 14px", marginTop: "4px" }}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                />
              </div>
            </div>

            <button
              type="submit"
              className="dash-pill dash-pill-dark dash-pill-big"
              style={{ width: "100%", cursor: "pointer" }}
            >
              {isSyncing ? "⚡ Fetching & Vectorizing GitHub Data..." : "🚀 Sync & Ingest Repo"}
            </button>
          </form>
        </div>

        {/* AUTOMATED WEBHOOK CONFIGURATION */}
        <div className="dash-box">
          <h3>⚡ Automated GitHub Webhook</h3>
          <p className="dash-sub" style={{ marginTop: "4px" }}>Auto-ingest PRs and commits when pushed or merged</p>

          <div style={{ background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "14px", padding: "16px", marginTop: "16px" }}>
            <span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>Webhook Payload URL</span>
            <code className="dash-mono" style={{ display: "block", background: "#141414", color: "#e8e8e8", padding: "10px", borderRadius: "8px", margin: "6px 0 12px", fontSize: "13px" }}>
              http://localhost:3000/api/v1/webhooks/github
            </code>

            <span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>Subscribed GitHub Events</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
              <span className="dash-badge dash-badge-dark">🔀 pull_request (merged)</span>
              <span className="dash-badge dash-badge-yellow">📝 push (commits)</span>
            </div>
          </div>

          <div style={{ marginTop: "16px", fontSize: "13.5px", color: "#666" }}>
            💡 When a developer merges a Pull Request or pushes to main branch, ExtenGen automatically extracts architectural decisions and stores them with RLS org permissions.
          </div>
        </div>
      </div>

      {/* INGESTED REPOS TABLE & PR MEMORIES FEED */}
      <div className="dash-tab-bar">
        <button
          className={`dash-tab-btn ${activeTab === "repos" ? "active" : ""}`}
          onClick={() => setActiveTab("repos")}
        >
          📂 Synced Repositories ({repos.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === "feed" ? "active" : ""}`}
          onClick={() => setActiveTab("feed")}
        >
          🔀 Ingested PRs & Commits ({ingestedEvents.length})
        </button>
      </div>

      <div className="dash-box dash-table-box">
        {activeTab === "repos" ? (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Repository Name</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Last Sync</th>
                  <th>Commits Ingested</th>
                  <th>PRs Ingested</th>
                  <th>Memories Created</th>
                  <th>Webhook</th>
                </tr>
              </thead>
              <tbody>
                {repos.map((r) => (
                  <tr key={r.id} className="dash-row">
                    <td><strong style={{ fontSize: "15px", color: "#141414" }}>🐙 {r.fullName}</strong></td>
                    <td><code className="dash-mono">{r.branch}</code></td>
                    <td>
                      <span className="dash-badge dash-badge-green">{r.status}</span>
                    </td>
                    <td style={{ fontSize: "13px", color: "#666" }}>{r.lastSync}</td>
                    <td><b className="dash-mono">{r.commitsIngested}</b></td>
                    <td><b className="dash-mono">{r.prsIngested}</b></td>
                    <td><b className="dash-mono">{r.memoriesCreated}</b></td>
                    <td>
                      {r.webhookConfigured ? (
                        <span className="dash-badge dash-badge-dark">✓ Webhook Active</span>
                      ) : (
                        <span className="dash-badge dash-badge-white">Manual</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Repository</th>
                  <th>PR / Commit Title</th>
                  <th>Author</th>
                  <th>Merged / Pushed</th>
                  <th>Memories</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ingestedEvents.map((ev) => (
                  <tr key={ev.id} className="dash-row">
                    <td>
                      <span className={`dash-badge ${ev.type === "pull_request" ? "dash-badge-dark" : "dash-badge-yellow"}`}>
                        {ev.type === "pull_request" ? "🔀 PR Merged" : "📝 Commit Push"}
                      </span>
                    </td>
                    <td><code className="dash-mono">{ev.repo}</code></td>
                    <td style={{ maxWidth: "380px" }}>
                      <strong style={{ fontSize: "14px", color: "#141414" }}>{ev.title}</strong>
                      <p className="dash-sub" style={{ marginTop: "4px" }}>{ev.summary}</p>
                    </td>
                    <td><strong style={{ fontSize: "14px", color: "#141414" }}>{ev.author}</strong></td>
                    <td style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap" }}>{ev.mergedAt}</td>
                    <td><b className="dash-mono">{ev.memoriesCreated} memories</b></td>
                    <td>
                      <button className="dash-pill dash-pill-white dash-pill-sm" onClick={() => onNavigateToMemories("Indexed")}>
                        🧠 View Memories
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
