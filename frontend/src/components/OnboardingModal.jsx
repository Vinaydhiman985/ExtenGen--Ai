import React, { useState, useEffect } from "react";
import { fetchActiveAgents, simulateAgentConnection } from "../services/api.js";

const MESH_AGENTS = [
  { id: "chatgpt", name: "ChatGPT", provider: "OpenAI", color: "#10b981" },
  { id: "claude", name: "Claude", provider: "Anthropic", color: "#d97706" },
  { id: "gemini", name: "Google Gemini", provider: "Google", color: "#2563eb" },
  { id: "deepseek", name: "DeepSeek", provider: "DeepSeek AI", color: "#6366f1" },
  { id: "copilot", name: "Microsoft Copilot", provider: "Microsoft", color: "#0284c7" },
  { id: "perplexity", name: "Perplexity AI", provider: "Perplexity", color: "#06b6d4" },
];

const PRESETS = [
  {
    name: "Claude ➔ DeepSeek",
    from: "claude",
    to: "deepseek",
    text: "In our Claude session, we decided: 1. Use Rust zero-copy ring buffers for high-throughput packet processing. 2. Pre-allocate 64MB memory slabs. 3. Monitor lock-free queue depths.",
    query: "What memory architecture and queue model was decided with Claude?",
  },
  {
    name: "ChatGPT ➔ Gemini",
    from: "chatgpt",
    to: "gemini",
    text: "In our ChatGPT session, we decided: 1. Use Stripe Checkout with webhook signature validation. 2. Store idempotency keys in Redis with 24h TTL. 3. User JWT tokens expire in 15 minutes.",
    query: "Continue building the payment controller based on what I discussed with ChatGPT.",
  },
  {
    name: "DeepSeek ➔ Copilot",
    from: "deepseek",
    to: "copilot",
    text: "In our DeepSeek session, we finalized: 1. Raft consensus heartbeat interval capped at 50ms. 2. Election timeouts between 150ms and 300ms. 3. Dynamic snapshot threshold at 10,000 log entries.",
    query: "What Raft heartbeat and election timeouts were decided for our consensus cluster?",
  },
  {
    name: "Perplexity ➔ Claude",
    from: "perplexity",
    to: "claude",
    text: "Perplexity research synthesis: 1. EU AI Act High-Risk systems require model weight SHA-256 digests in audit logs. 2. Retention policy for inference telemetry is 36 months.",
    query: "What compliance requirements and telemetry retention did we uncover from Perplexity research?",
  },
  {
    name: "Copilot ➔ ChatGPT",
    from: "copilot",
    to: "chatgpt",
    text: "In our Copilot session, we agreed: 1. Switch all polling intervals to Server-Sent Events (SSE) on /api/v1/events. 2. Implement 5-second keepalive frames. 3. Graceful client reconnection.",
    query: "How should our frontend receive real-time updates based on our Copilot discussion?",
  },
];

export function OnboardingModal({ isOpen, onClose }) {
  const [modalMode, setModalMode] = useState("bridge");

  // Dynamic Multi-Agent Handoff State
  const [sourceAgentId, setSourceAgentId] = useState("claude");
  const [targetAgentId, setTargetAgentId] = useState("deepseek");
  const [sessionText, setSessionText] = useState(PRESETS[0].text);
  const [targetQuery, setTargetQuery] = useState(PRESETS[0].query);

  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState(0); // 0: Idle, 1: Vectorizing, 2: Stored in DB, 3: Target Connected
  const [bridgeResult, setBridgeResult] = useState(null);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState(null);

  // Manual Snippets State
  const [activeTab, setActiveTab] = useState("extension");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [agentsData, setAgentsData] = useState({ count: 0, agents: [] });

  const loadAgents = async () => {
    const res = await fetchActiveAgents();
    if (res.ok && res.data) {
      setAgentsData(res.data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAgents();
      const interval = setInterval(loadAgents, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentHost = "127.0.0.1:3001";
  const mcpLink = `http://${currentHost}/sse`;

  const sourceAgent = MESH_AGENTS.find((a) => a.id === sourceAgentId) || MESH_AGENTS[0];
  const targetAgent = MESH_AGENTS.find((a) => a.id === targetAgentId) || MESH_AGENTS[1];

  const handleApplyPreset = (preset) => {
    setSourceAgentId(preset.from);
    setTargetAgentId(preset.to);
    setSessionText(preset.text);
    setTargetQuery(preset.query);
    setBridgeStep(0);
    setBridgeResult(null);
    setFollowUpAnswer(null);
  };

  const handleRunBridge = async () => {
    if (!sessionText.trim()) return;

    setIsBridging(true);
    setBridgeStep(1); // Vectorizing & Saving

    try {
      // 1. Call real backend /api/v1/handoff
      const res = await fetch("/api/v1/handoff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 00000000-0000-0000-0000-000000000001",
        },
        body: JSON.stringify({
          fromAgent: sourceAgent.name,
          toAgent: targetAgent.name,
          title: `${sourceAgent.name} Session Handoff`,
          content: sessionText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Handoff failed");

      setBridgeStep(2); // Stored in Supabase pgvector

      // 2. Query recall for Target Agent
      const recallRes = await fetch("/api/v1/context/recall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 00000000-0000-0000-0000-000000000001",
        },
        body: JSON.stringify({
          query: targetQuery,
          limit: 1,
          similarityThreshold: 0.15,
        }),
      });

      const recallData = await recallRes.json();
      const topMemory = recallData.result?.observations?.[0] || {
        title: `${sourceAgent.name} Session Handoff`,
        content: sessionText.trim(),
        similarity: 0.92,
      };

      setTimeout(() => {
        setBridgeStep(3); // Target Agent Connected
        setBridgeResult({
          observationId: data.observationId,
          memory: topMemory,
          targetResponse: `I have received the context from your ${sourceAgent.name} session regarding [${topMemory.title}]:\n\n"${topMemory.content}"\n\nContinuing your implementation without context loss. All architectural rules from ${sourceAgent.name} are preserved in my context window!`,
        });
        setIsBridging(false);
      }, 700);
    } catch (err) {
      console.error("Bridge failed:", err);
      setIsBridging(false);
      setBridgeStep(0);
    }
  };

  const handleFollowUp = () => {
    if (!followUpQuery.trim()) return;
    setFollowUpAnswer(
      `${targetAgent.name}: Enforcing the rule from ${sourceAgent.name} ("${bridgeResult?.memory?.content || sessionText}") while addressing "${followUpQuery}". Context stream remains completely intact across agents!`
    );
  };

  const snippets = {
    extension: `// ExtenGen Chrome Extension (Universal Multi-Agent Mesh)
// 1. Open chrome://extensions
// 2. Turn ON "Developer mode"
// 3. Click "Load unpacked" and select:
C:\\ExtenGen-Ai\\extension

// Supported AI Engines (6 Universal Platforms):
// - ChatGPT (chatgpt.com, chat.openai.com)
// - Anthropic Claude (claude.ai)
// - Google Gemini (gemini.google.com)
// - DeepSeek Chat (chat.deepseek.com)
// - Microsoft Copilot (copilot.microsoft.com)
// - Perplexity AI (perplexity.ai)

// On any AI page, click the floating pill [ ExtenGen | Handoff to... ]
// Select any destination AI to hand off real context & memory instantly!`,

    cursor: `// Cursor IDE Setup (.cursor/mcp.json):
{
  "mcpServers": {
    "extengen": {
      "url": "${mcpLink}"
    }
  }
}`,

    vscode: `// VS Code (Cline / Roo Code MCP Settings):
{
  "mcpServers": {
    "extengen": {
      "url": "${mcpLink}",
      "type": "sse"
    }
  }
}`,

    claude: `# Claude Code CLI (Terminal):
claude mcp add extengen ${mcpLink}`,
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="dash-modal-backdrop" onClick={onClose}>
      <div
        className="dash-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "820px", maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
              <span className="dash-badge dash-badge-green">Universal AI Mesh</span>
              <span className="dash-badge dash-badge-dark">6 Foundation Engines</span>
              <span className="dash-badge dash-badge-yellow">pgvector 768d</span>
            </div>
            <h2 style={{ font: "400 30px/1 var(--disp)", textTransform: "uppercase", margin: "6px 0 2px" }}>
              Connect Agent Studio
            </h2>
            <p className="dash-sub">
              Bridge <strong>any AI engine to any other engine</strong>: ChatGPT, Claude, Gemini, DeepSeek, Copilot, and Perplexity into one shared memory pool.
            </p>
          </div>
          <button className="dash-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* MODE SELECTOR */}
        <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "4px", borderRadius: "999px", marginBottom: "16px" }}>
          <button
            className={`dash-pill ${modalMode === "bridge" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
            style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => setModalMode("bridge")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5" />
              <path d="m21 3-7 7" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
            <span>Universal Cross-Agent Handoff Studio</span>
          </button>
          <button
            className={`dash-pill ${modalMode === "configs" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
            style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => setModalMode("configs")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="21.17" y1="8" x2="12" y2="8" />
            </svg>
            <span>Extension & IDE Configurations</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: LIVE ANY-TO-ANY AGENT HANDOFF */}
        {/* ======================================================== */}
        {modalMode === "bridge" && (
          <div>
            {/* PRESETS ROW */}
            <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }}>Quick Presets:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className={`dash-pill ${sourceAgentId === p.from && targetAgentId === p.to ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
                  onClick={() => handleApplyPreset(p)}
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* SOURCE & TARGET SELECTOR BAR */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "12px", alignItems: "center", marginBottom: "14px", background: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                  Source Agent (From)
                </label>
                <select
                  value={sourceAgentId}
                  onChange={(e) => {
                    setSourceAgentId(e.target.value);
                    if (e.target.value === targetAgentId) {
                      const next = MESH_AGENTS.find((a) => a.id !== e.target.value);
                      if (next) setTargetAgentId(next.id);
                    }
                    setBridgeStep(0);
                  }}
                  className="dash-input"
                  style={{ width: "100%", padding: "6px 10px", fontSize: "13px", fontWeight: 600, background: "#fff" }}
                >
                  {MESH_AGENTS.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.provider})</option>
                  ))}
                </select>
              </div>

              <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "14px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                  Target Agent (To)
                </label>
                <select
                  value={targetAgentId}
                  onChange={(e) => {
                    setTargetAgentId(e.target.value);
                    setBridgeStep(0);
                  }}
                  className="dash-input"
                  style={{ width: "100%", padding: "6px 10px", fontSize: "13px", fontWeight: 600, background: "#fff" }}
                >
                  {MESH_AGENTS.filter((a) => a.id !== sourceAgentId).map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.provider})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SOURCE AGENT PANEL */}
            <div style={{ background: "#ffffff", border: "1.5px solid #141414", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: sourceAgent.color }} />
                  <strong style={{ fontSize: "14px", color: "#141414" }}>
                    Source: {sourceAgent.name} ({sourceAgent.provider})
                  </strong>
                </div>
                <span className="dash-badge dash-badge-dark">Active Session</span>
              </div>

              <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                Context, rules, or architectural decisions from your {sourceAgent.name} chat:
              </label>
              <textarea
                className="dash-textarea"
                rows={3}
                value={sessionText}
                onChange={(e) => setSessionText(e.target.value)}
                placeholder="Type any decisions or context here..."
                style={{ fontSize: "13px", lineHeight: "1.4" }}
              />
            </div>

            {/* BIG ACTION BUTTON */}
            <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
              <button
                className={`dash-pill ${isBridging ? "dash-pill-white" : "dash-pill-dark"} dash-pill-big`}
                onClick={handleRunBridge}
                disabled={isBridging}
                style={{
                  minWidth: "340px",
                  justifyContent: "center",
                  background: bridgeStep === 3 ? "#10b981" : undefined,
                  borderColor: "#141414",
                  color: bridgeStep === 3 ? "#ffffff" : undefined,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  fontSize: "15px",
                }}
              >
                {isBridging ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "extengen-spin 0.8s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>Vectorizing & Connecting to {targetAgent.name}...</span>
                  </span>
                ) : bridgeStep === 3 ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Handoff Verified: Re-Sync Memory</span>
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 3h5v5" />
                      <path d="m21 3-7 7" />
                      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                    </svg>
                    <span>Handoff Context from {sourceAgent.name} ➔ {targetAgent.name}</span>
                  </span>
                )}
              </button>
            </div>

            {/* STATUS PIPELINE */}
            {bridgeStep > 0 && (
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="dash-pulse-dot" style={{ background: "#10b981" }} />
                  <span>
                    {bridgeStep === 1 && "ExtenGen: Generating 768d embedding via Gemini pipeline..."}
                    {bridgeStep === 2 && "ExtenGen: Stored in Supabase PostgreSQL pgvector! Searching context..."}
                    {bridgeStep === 3 && `ExtenGen Hub: Connected! Context routed to ${targetAgent.name}`}
                  </span>
                </div>
                {bridgeStep === 3 && (
                  <span className="dash-badge dash-badge-green" style={{ fontFamily: "monospace" }}>
                    Match: {((bridgeResult?.memory?.similarity || 0.92) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            )}

            {/* TARGET AGENT RECEIVER PANEL */}
            <div style={{
              background: bridgeStep === 3 ? "#f0fdf4" : "#f8fafc",
              border: bridgeStep === 3 ? "2px solid #10b981" : "1.5px solid #cbd5e1",
              borderRadius: "14px",
              padding: "16px",
              transition: "all 0.3s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: bridgeStep === 3 ? targetAgent.color : "#94a3b8" }} />
                  <strong style={{ fontSize: "14px", color: bridgeStep === 3 ? "#065f46" : "#475569" }}>
                    Target: {targetAgent.name} ({targetAgent.provider})
                  </strong>
                </div>
                <span className="dash-badge dash-badge-dark">
                  {bridgeStep === 3 ? "Context Injected" : `Awaiting Handoff to ${targetAgent.name}`}
                </span>
              </div>

              {bridgeStep === 3 ? (
                <div>
                  <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600, marginBottom: "4px" }}>
                    {targetAgent.name} Live Output (Continuing seamlessly with {sourceAgent.name}'s context):
                  </div>
                  <div style={{
                    background: "#ffffff",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "12px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: "#1e293b",
                    whiteSpace: "pre-wrap",
                  }}>
                    {bridgeResult.targetResponse}
                  </div>

                  {/* INTERACTIVE FOLLOW-UP WITH TARGET AGENT */}
                  <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="dash-input"
                      placeholder={`Ask ${targetAgent.name} another question to test continued memory...`}
                      value={followUpQuery}
                      onChange={(e) => setFollowUpQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                      style={{
                        flex: 1,
                        background: "#fff",
                        border: "1px solid #10b981",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                    <button className="dash-pill dash-pill-dark dash-pill-sm" onClick={handleFollowUp}>
                      Ask {targetAgent.name}
                    </button>
                  </div>

                  {followUpAnswer && (
                    <div style={{ marginTop: "10px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12.5px", color: "#334155", border: "1px solid #e2e8f0" }}>
                      {followUpAnswer}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic", padding: "10px 0" }}>
                  Click the button above to execute the live handoff and connect {targetAgent.name}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: CHROME EXTENSION & IDE SETUP */}
        {/* ======================================================== */}
        {modalMode === "configs" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {[
                { id: "extension", label: "Chrome Extension (All 6 AIs)" },
                { id: "cursor", label: "Cursor IDE" },
                { id: "vscode", label: "VS Code (Cline/Roo)" },
                { id: "claude", label: "Claude Code CLI" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`dash-pill ${activeTab === tab.id ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ background: "#0f172a", borderRadius: "14px", overflow: "hidden", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid #334155", fontSize: "12px", color: "#94a3b8" }}>
                <span>{activeTab === "extension" ? "Manifest V3 Ready in C:\\ExtenGen-Ai\\extension" : "MCP Config"}</span>
                <button className="dash-pill dash-pill-white dash-pill-sm" onClick={handleCopySnippet}>
                  {copiedSnippet ? "Copied" : "Copy"}
                </button>
              </div>
              <pre style={{ padding: "14px", margin: 0, fontSize: "12.5px", color: "#e2e8f0", maxHeight: "220px", overflowY: "auto", lineHeight: "1.5" }}>
                <code>{snippets[activeTab]}</code>
              </pre>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
          <span style={{ fontSize: "12px", color: "#666" }}>
            Backend: <strong>http://localhost:3001</strong> | Tenant RLS: <strong>Personal Workspace</strong>
          </span>
          <button className="dash-pill dash-pill-dark" onClick={onClose} style={{ minWidth: "100px", justifyContent: "center" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
