import React, { useState, useEffect } from "react";
import { ingestGitHub, fetchObservations } from "../services/api.js";

export function GitHubSyncSection({ onNavigateToMemories }) {
  const [repoInput, setRepoInput] = useState("Vinaydhiman985/ExtenGen--Ai");
  const [tokenInput, setTokenInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [realEvents, setRealEvents] = useState([]);

  // Load real ingested GitHub memories from DB
  const loadRealGitHubData = async () => {
    try {
      const res = await fetchObservations({ limit: 50 });
      if (res.ok && res.observations) {
        const ghMemories = res.observations.filter(
          (obs) => obs.metadata?.repo || obs.tags?.includes("github") || obs.tags?.includes("commit") || obs.tags?.includes("pull_request")
        );
        setRealEvents(ghMemories);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadRealGitHubData();
  }, []);

  const handleSyncSubmit = async (e) => {
    e.preventDefault();
    let s = repoInput.trim();
    s = s.replace(/^https?:\/\/github\.com\//i, "");
    s = s.replace(/^git@github\.com:/i, "");
    s = s.replace(/\.git$/i, "");
    s = s.replace(/^\/+|\/+$/g, "");

    const parts = s.split("/");
    const owner = parts[0];
    const repo = parts[1];

    if (!owner || !repo || parts.length > 2) {
      setSyncError("Please enter a valid repository in the format 'owner/repo' or paste a GitHub URL.");
      return;
    }

    setIsSyncing(true);
    setSyncSuccess(false);
    setSyncError(null);

    try {
      const result = await ingestGitHub({
        owner,
        repo,
        token: tokenInput.trim() || undefined,
        limitCommits: 10,
        limitPRs: 5
      });

      if (result.ok) {
        setSyncSuccess(true);
        setLastSyncResult({
          repo: `${owner}/${repo}`,
          commits: result.data?.commitsIngested || 0,
          pullRequests: result.data?.prsIngested || 0,
          memoriesCreated: result.data?.totalIngested || 0
        });
        await loadRealGitHubData();
      } else {
        setSyncError(result.error || "Failed to trigger GitHub sync.");
      }
    } catch (err) {
      setSyncError(err.message || "Failed to trigger GitHub sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  const commitsCount = realEvents.filter(e => !e.tags?.includes("pull_request")).length;
  const prsCount = realEvents.filter(e => e.tags?.includes("pull_request")).length;
  
  const uniqueReposSet = new Set();
  realEvents.forEach(e => {
    if (e.metadata?.repo) uniqueReposSet.add(e.metadata.repo);
  });
  if (uniqueReposSet.size === 0 && repoInput) {
    uniqueReposSet.add(repoInput);
  }
  const uniqueRepos = Array.from(uniqueReposSet);

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <span className="dash-badge dash-badge-dark">Automated Repository Ingestion</span>
          <h1>GitHub Sync & Webhooks</h1>
          <p>Ingest merged Pull Requests, commit messages, and diff summaries into ExtenGen memory via REST API or automated GitHub Webhooks.</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Repositories Synced</span>
            <span className="dash-badge dash-badge-dark">REPO</span>
          </div>
          <div className="dash-kpi-val">{uniqueRepos.length}</div>
          <div className="dash-kpi-sub pos">
            <span>Active Knowledge Sources</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Commits Extracted</span>
            <span className="dash-badge dash-badge-dark">GIT</span>
          </div>
          <div className="dash-kpi-val">{commitsCount}</div>
          <div className="dash-kpi-sub pos">
            <span>Commit message vectors</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Ingested PRs</span>
            <span className="dash-badge dash-badge-dark">PR</span>
          </div>
          <div className="dash-kpi-val">{prsCount}</div>
          <div className="dash-kpi-sub pos">
            <span>Merged PR context</span>
          </div>
        </div>

        <div className="dash-kpi-card highlight">
          <div className="dash-kpi-top">
            <span>Total GitHub Memories</span>
            <span className="dash-badge dash-badge-green">LIVE</span>
          </div>
          <div className="dash-kpi-val">{realEvents.length}</div>
          <div className="dash-kpi-sub pos">
            <span>Auto-fed to agent prompts</span>
          </div>
        </div>
      </div>

      {/* SYNC FORM & WEBHOOK CONFIG */}
      <div className="dash-grid-2">
        {/* REPO SYNC TRIGGER FORM */}
        <div className="dash-box">
          <h3>Ingest GitHub Repository</h3>
          <p className="dash-sub" style={{ marginTop: "4px" }}>Trigger on-demand fetch via `/api/v1/ingest/github` endpoint</p>

          {syncSuccess && (
            <div style={{ background: "#dcfce7", border: "1.5px solid #118a4b", borderRadius: "14px", padding: "14px", margin: "16px 0", color: "#0e4d3a" }}>
              <strong>Ingestion Job Completed</strong>
              <p style={{ fontSize: "13.5px", marginTop: "4px" }}>
                Ingested <strong>{lastSyncResult?.commits} commits</strong> and <strong>{lastSyncResult?.pullRequests} PRs</strong> from <code>{lastSyncResult?.repo}</code>. Created {lastSyncResult?.memoriesCreated} vector memories.
              </p>
            </div>
          )}

          {syncError && (
            <div style={{ background: "#fee2e2", border: "1.5px solid #dc2626", borderRadius: "14px", padding: "14px", margin: "16px 0", color: "#7f1d1d" }}>
              <strong>Ingestion Notice / Error</strong>
              <p style={{ fontSize: "13.5px", marginTop: "4px" }}>{syncError}</p>
              <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>For private repositories or higher rate limits, please provide a GitHub Personal Access Token below.</p>
            </div>
          )}

          <form onSubmit={handleSyncSubmit} style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, display: "block" }}>Target Repository</label>
              <input
                type="text"
                className="dash-input"
                style={{ width: "100%", marginTop: "6px", fontFamily: "monospace", fontSize: "14px", background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "12px", padding: "10px 14px" }}
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repo (e.g. Vinaydhiman985/ExtenGen--Ai)"
                required
              />
              <span className="dash-sub" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
                Accepts GitHub URLs (https://github.com/...) or shorthand owner/repo format.
              </span>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, display: "block" }}>GitHub PAT Token (Optional for public)</label>
                <span className="dash-badge dash-badge-white" style={{ fontSize: "10px" }}>repo & read:org scope</span>
              </div>
              <input
                type="password"
                className="dash-input"
                style={{ width: "100%", marginTop: "6px", fontFamily: "monospace", fontSize: "14px", background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "12px", padding: "10px 14px" }}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Leaves blank for public repos)"
              />
            </div>

            <button
              type="submit"
              className="dash-pill dash-pill-dark dash-pill-big"
              style={{ width: "100%", cursor: "pointer", justifyContent: "center" }}
              disabled={isSyncing}
            >
              {isSyncing ? "Fetching & Vectorizing GitHub Data..." : "Ingest GitHub Repository"}
            </button>
          </form>
        </div>

        {/* AUTOMATED WEBHOOK CONFIGURATION */}
        <div className="dash-box">
          <h3>Automated GitHub Webhook</h3>
          <p className="dash-sub" style={{ marginTop: "4px" }}>Auto-ingest PRs and commits when pushed or merged</p>

          <div style={{ background: "var(--bg)", border: "1.5px solid var(--ink)", borderRadius: "14px", padding: "16px", marginTop: "16px" }}>
            <span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>Webhook Payload URL</span>
            <code className="dash-mono" style={{ display: "block", background: "#141414", color: "#e8e8e8", padding: "10px", borderRadius: "8px", margin: "6px 0 12px", fontSize: "13px" }}>
              http://localhost:3000/api/v1/webhooks/github
            </code>

            <span className="dash-sub" style={{ textTransform: "uppercase", fontWeight: 700 }}>Subscribed GitHub Events</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
              <span className="dash-badge dash-badge-dark">pull_request (merged)</span>
              <span className="dash-badge dash-badge-yellow">push (commits)</span>
            </div>
          </div>

          <div style={{ marginTop: "16px", fontSize: "13.5px", color: "#666" }}>
            When a developer merges a Pull Request or pushes to main branch, ExtenGen automatically extracts architectural decisions and stores them with RLS org permissions.
          </div>
        </div>
      </div>

      {/* INGESTED REPOS TABLE & PR MEMORIES FEED */}
      <div className="dash-tab-bar" style={{ marginTop: "24px" }}>
        <button
          className={`dash-tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          Live Ingested Commits & PRs ({realEvents.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === "repos" ? "active" : ""}`}
          onClick={() => setActiveTab("repos")}
        >
          Synced Repositories ({uniqueRepos.length})
        </button>
      </div>

      <div className="dash-box dash-table-box">
        {activeTab === "events" ? (
          <div className="dash-table-wrap">
            {realEvents.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
                No GitHub memories ingested yet. Use the form above to ingest commits from <code>Vinaydhiman985/ExtenGen--Ai</code>.
              </div>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Repository</th>
                    <th>Title & Summary</th>
                    <th>Author</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {realEvents.map((ev) => (
                    <tr key={ev.id} className="dash-row">
                      <td>
                        <span className={`dash-badge ${ev.tags?.includes("pull_request") ? "dash-badge-dark" : "dash-badge-yellow"}`}>
                          {ev.tags?.includes("pull_request") ? "PR Merged" : "Commit Push"}
                        </span>
                      </td>
                      <td><code className="dash-mono">{ev.metadata?.repo || repoInput}</code></td>
                      <td style={{ maxWidth: "420px" }}>
                        <strong style={{ fontSize: "14px", color: "#141414" }}>{ev.title}</strong>
                        <p className="dash-sub" style={{ marginTop: "4px" }}>{ev.content.slice(0, 110)}...</p>
                      </td>
                      <td><strong style={{ fontSize: "14px", color: "#141414" }}>{ev.metadata?.author || ev.author}</strong></td>
                      <td style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap" }}>{ev.createdAt}</td>
                      <td>
                        <button className="dash-pill dash-pill-white dash-pill-sm" onClick={() => onNavigateToMemories("Indexed")}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Repository Name</th>
                  <th>Target Branch</th>
                  <th>Status</th>
                  <th>Total Memories</th>
                  <th>Ingestion Type</th>
                </tr>
              </thead>
              <tbody>
                {uniqueRepos.map((repoName) => (
                  <tr key={repoName} className="dash-row">
                    <td><strong style={{ fontSize: "15px", color: "#141414" }}>{repoName}</strong></td>
                    <td><code className="dash-mono">main</code></td>
                    <td><span className="dash-badge dash-badge-green">Active Ingestion</span></td>
                    <td><b className="dash-mono">{realEvents.filter(e => e.metadata?.repo === repoName || repoName === repoInput).length}</b></td>
                    <td><span className="dash-badge dash-badge-dark">REST API & Webhook</span></td>
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
