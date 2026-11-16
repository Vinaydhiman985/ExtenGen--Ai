import React, { useState, useEffect } from "react";
import { checkHealth } from "../services/api.js";

const UNIVERSAL_AGENTS = [
  { id: "chatgpt", name: "ChatGPT", provider: "OpenAI", url: "https://chatgpt.com", color: "#10b981" },
  { id: "claude", name: "Claude", provider: "Anthropic", url: "https://claude.ai/new", color: "#d97706" },
  { id: "gemini", name: "Google Gemini", provider: "Google", url: "https://gemini.google.com/app", color: "#2563eb" },
  { id: "deepseek", name: "DeepSeek", provider: "DeepSeek AI", url: "https://chat.deepseek.com", color: "#6366f1" },
  { id: "copilot", name: "Microsoft Copilot", provider: "Microsoft", url: "https://copilot.microsoft.com", color: "#0284c7" },
  { id: "perplexity", name: "Perplexity AI", provider: "Perplexity", url: "https://www.perplexity.ai", color: "#06b6d4" },
];

export function ExtensionBridgeSection() {
  const [copiedPath, setCopiedPath] = useState(false);
  const [backendLive, setBackendLive] = useState(true);

  // Dynamic Mesh State
  const [sourceAgent, setSourceAgent] = useState("chatgpt");
  const [targetAgent, setTargetAgent] = useState("claude");
  const [sessionText, setSessionText] = useState(
    "Architecture Decision: Use PostgreSQL 17 + pgvector HNSW index with 768d MRL embeddings for sub-5ms cosine retrieval."
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [injectedResult, setInjectedResult] = useState(null);

  const extensionPath = "C:\\ExtenGen-Ai\\extension";

  useEffect(() => {
    async function verify() {
      const res = await checkHealth();
      setBackendLive(res.isLive);
    }
    verify();
  }, []);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(extensionPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2500);
  };

  const currentSource = UNIVERSAL_AGENTS.find((a) => a.id === sourceAgent) || UNIVERSAL_AGENTS[0];
  const currentTarget = UNIVERSAL_AGENTS.find((a) => a.id === targetAgent) || UNIVERSAL_AGENTS[1];

  const handleSimulateHandoff = async () => {
    if (!sessionText.trim()) return;

    setIsSyncing(true);
    setSyncDone(false);

    try {
      const res = await fetch("/api/v1/handoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 00000000-0000-0000-0000-000000000001",
        },
        body: JSON.stringify({
          fromAgent: currentSource.name,
          toAgent: currentTarget.name,
          title: `${currentSource.name} Session Handoff`,
          content: sessionText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Handoff failed");

      setSyncDone(true);
      setInjectedResult(data);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
            <span className="dash-badge dash-badge-green">Universal AI Mesh</span>
            <span className="dash-badge dash-badge-dark">Manifest V3</span>
            <span className="dash-sidebar-dot green" />
            <span style={{ fontSize: "12px", color: "var(--mut)", fontFamily: "var(--mono)" }}>
              {backendLive ? (typeof window !== "undefined" && window.location.hostname.includes("vercel") ? "Render Cloud Live" : "Fastify Backend Live") : "Backend Offline"}
            </span>
          </div>
          <h1>Universal Multi-Agent Browser Extension</h1>
          <p>
            Connect <strong>any AI model to any other model</strong> in your browser: ChatGPT, Claude, Gemini, DeepSeek, Copilot, and Perplexity share one seamless memory stream.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {UNIVERSAL_AGENTS.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dash-pill dash-pill-white dash-pill-sm"
              style={{ fontSize: "12px" }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: a.color, marginRight: "4px" }} />
              <span>{a.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* QUICK INSTALL STEPS CARD */}
      <div className="dash-box" style={{ background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)", border: "1.5px solid #141414", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "18px" }}>Install in Google Chrome (15 Seconds)</h3>
            <p className="dash-sub">Load the unpacked extension folder to activate the floating handoff button across all 6 AI sites</p>
          </div>
          <button
            className="dash-pill dash-pill-dark"
            onClick={handleCopyPath}
            style={{ minWidth: "160px", justifyContent: "center" }}
          >
            {copiedPath ? "Path Copied!" : "Copy Folder Path"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#141414", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>1</span>
              <strong style={{ fontSize: "14px" }}>Open Extensions Tab</strong>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              In your browser address bar, navigate to:
            </p>
            <code style={{ display: "block", background: "#f1f5f9", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", marginTop: "6px", fontFamily: "var(--mono)" }}>
              chrome://extensions
            </code>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#141414", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>2</span>
              <strong style={{ fontSize: "14px" }}>Turn On Developer Mode</strong>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Toggle the <strong>"Developer mode"</strong> switch in the top-right corner of the extensions page.
            </p>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#141414", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>3</span>
              <strong style={{ fontSize: "14px" }}>Click Load Unpacked</strong>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Click <strong>"Load unpacked"</strong> (top-left) and select this exact folder:
            </p>
            <code style={{ display: "block", background: "#f1f5f9", padding: "6px 8px", borderRadius: "6px", fontSize: "11px", marginTop: "6px", fontFamily: "var(--mono)", wordBreak: "break-all" }}>
              {extensionPath}
            </code>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>✓</span>
              <strong style={{ fontSize: "14px" }}>Active on All 6 AIs</strong>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Works automatically on ChatGPT, Claude, Gemini, DeepSeek, Copilot, and Perplexity!
            </p>
          </div>
        </div>
      </div>

      {/* UNIVERSAL MESH INTERACTIVE SIMULATOR */}
      <div className="dash-box">
        <div className="dash-box-header">
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="dash-badge dash-badge-yellow">Universal Mesh Simulator</span>
              <span className="dash-badge dash-badge-green">Any Model ➔ Any Model</span>
            </div>
            <h3 style={{ margin: "6px 0 2px" }}>Simulate Cross-Agent Memory Handover</h3>
            <p className="dash-sub">
              Select any Source AI and any Target AI below to test instant context handoff via ExtenGen:
            </p>
          </div>
        </div>

        {/* SELECTORS ROW */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", margin: "16px 0", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Source Agent (From):</label>
            <select
              value={sourceAgent}
              onChange={(e) => setSourceAgent(e.target.value)}
              className="dash-input"
              style={{ padding: "8px 12px", borderRadius: "8px", background: "#fff", border: "1.5px solid #141414", fontWeight: 600 }}
            >
              {UNIVERSAL_AGENTS.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.provider})</option>
              ))}
            </select>
          </div>

          <div style={{ alignSelf: "flex-end", paddingBottom: "8px", color: "#94a3b8", fontWeight: "bold" }}>
            ➔
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Target Agent (To):</label>
            <select
              value={targetAgent}
              onChange={(e) => setTargetAgent(e.target.value)}
              className="dash-input"
              style={{ padding: "8px 12px", borderRadius: "8px", background: "#fff", border: "1.5px solid #141414", fontWeight: 600 }}
            >
              {UNIVERSAL_AGENTS.filter((a) => a.id !== sourceAgent).map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.provider})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "20px", alignItems: "center", margin: "16px 0" }}>
          {/* STEP 1: SOURCE AI */}
          <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "14px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentSource.color }} />
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{currentSource.name} Session</strong>
              </div>
              <span className="dash-badge dash-badge-dark">Source</span>
            </div>
            <textarea
              className="dash-textarea"
              rows={4}
              value={sessionText}
              onChange={(e) => setSessionText(e.target.value)}
              placeholder="What you decided in this session..."
              style={{ fontSize: "13px", width: "100%", background: "#fff" }}
            />
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="dash-pill dash-pill-dark"
                onClick={handleSimulateHandoff}
                disabled={isSyncing}
                style={{
                  background: "#0f172a",
                  color: "#fff",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
                <span>{isSyncing ? `Syncing to ${currentTarget.name}...` : `Handoff to ${currentTarget.name}`}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5"/>
                  <path d="m21 3-7 7"/>
                  <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ARROW */}
          <div style={{ textAlign: "center", color: syncDone ? "#10b981" : "#94a3b8", display: "flex", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>

          {/* STEP 2: TARGET AI */}
          <div style={{ background: syncDone ? "#f0fdf4" : "#f8fafc", border: syncDone ? "1.5px solid #10b981" : "1.5px dashed #cbd5e1", borderRadius: "14px", padding: "16px", transition: "all 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentTarget.color }} />
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{currentTarget.name} Prompt Box</strong>
              </div>
              <span className={`dash-badge ${syncDone ? "dash-badge-green" : "dash-badge-white"}`}>
                {syncDone ? "Context Injected" : "Awaiting Handoff"}
              </span>
            </div>

            {syncDone && injectedResult ? (
              <div>
                <pre style={{
                  background: "#ffffff",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "12px",
                  color: "#1e293b",
                  maxHeight: "160px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.5",
                  margin: 0
                }}>
                  <code>{injectedResult.handoffPrompt}</code>
                </pre>
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                  Stored in Supabase (Vector 768d) · Context ready in {currentTarget.name}
                </div>
              </div>
            ) : (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                Click <strong>"Handoff to {currentTarget.name}"</strong> to execute the cross-agent memory transfer.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
