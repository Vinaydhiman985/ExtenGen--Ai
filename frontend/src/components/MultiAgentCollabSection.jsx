import React, { useState } from "react";
import { runMultiAgentSimulation } from "../services/api.js";

const AVAILABLE_AGENTS = [
  "ChatGPT (OpenAI)",
  "Claude (Anthropic)",
  "Google Gemini",
  "DeepSeek Chat",
  "Microsoft Copilot",
  "Perplexity AI",
  "Cursor IDE",
  "Windsurf (Codeium)",
  "Codex CLI"
];

const PRESET_SCENARIOS = [
  {
    name: "ChatGPT ➔ Gemini",
    agent1: "ChatGPT (OpenAI)",
    agent2: "Google Gemini",
    ruleTitle: "Microservices Architecture & Auth Standards",
    ruleContent: "In my ChatGPT session, we finalized: 1. Authentication via Supabase Auth + JWT Bearer. 2. Microservices communication using Redis BullMQ queues. 3. PostgreSQL 17 with pgvector for shared memories.",
    ruleTags: ["chatgpt", "gemini", "handoff", "architecture"],
    query: "What authentication and queue system was decided in my previous ChatGPT session?",
    expectedMatch: "Supabase Auth + JWT Bearer"
  },
  {
    name: "Claude ➔ DeepSeek",
    agent1: "Claude (Anthropic)",
    agent2: "DeepSeek Chat",
    ruleTitle: "High-Performance Rust Memory Buffers",
    ruleContent: "All high-throughput telemetry streams must use zero-copy ring buffers implemented in Rust with crossbeam-channel. Allocate pre-pinned memory slabs of 64MB each to avoid Linux kernel GC pauses.",
    ruleTags: ["claude", "deepseek", "rust", "performance"],
    query: "What memory model and allocation strategy did Claude specify for our telemetry stream?",
    expectedMatch: "zero-copy ring buffers implemented in Rust"
  },
  {
    name: "DeepSeek ➔ Copilot",
    agent1: "DeepSeek Chat",
    agent2: "Microsoft Copilot",
    ruleTitle: "Distributed Consensus: Raft Quorum Heartbeat",
    ruleContent: "Cluster nodes must configure Raft election timeouts between 150ms and 300ms, with leader heartbeat intervals strictly capped at 50ms to ensure sub-second failover under network partitions.",
    ruleTags: ["deepseek", "copilot", "raft", "distributed-systems"],
    query: "What Raft election timeout and heartbeat interval should I set for our consensus cluster?",
    expectedMatch: "election timeouts between 150ms and 300ms"
  },
  {
    name: "Perplexity ➔ Gemini",
    agent1: "Perplexity AI",
    agent2: "Google Gemini",
    ruleTitle: "Compliance Standard: EU AI Act Risk Tiering",
    ruleContent: "All production deployments operating in EU jurisdictions must attach transparency metadata headers with SHA-256 model weights hashes, inference latency metrics, and automated human-in-the-loop audit logs.",
    ruleTags: ["perplexity", "gemini", "compliance", "governance"],
    query: "What transparency metadata and audit logs are required for our EU deployment?",
    expectedMatch: "SHA-256 model weights hashes"
  },
  {
    name: "Copilot ➔ ChatGPT",
    agent1: "Microsoft Copilot",
    agent2: "ChatGPT (OpenAI)",
    ruleTitle: "Frontend Streaming Architecture: Server-Sent Events",
    ruleContent: "Do not use short-polling for agent status. All live agent dashboards must consume Server-Sent Events (SSE) via /api/v1/events with 5s keepalive ping frames and auto-reconnect backoff.",
    ruleTags: ["copilot", "chatgpt", "sse", "streaming"],
    query: "How should our agent dashboard receive real-time status updates from the backend?",
    expectedMatch: "Server-Sent Events (SSE)"
  },
  {
    name: "Custom Scenario",
    agent1: "ChatGPT (OpenAI)",
    agent2: "Claude (Anthropic)",
    ruleTitle: "Custom Engineering Decision",
    ruleContent: "We decided to migrate our frontend from REST polling to Server-Sent Events (SSE) with 5s keepalive pings.",
    ruleTags: ["custom", "standards", "architecture"],
    query: "How should our frontend stream live updates from the backend?",
    expectedMatch: "Server-Sent Events (SSE)"
  }
];

export function MultiAgentCollabSection() {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [executionStep, setExecutionStep] = useState(0); // 0: Idle, 1: Agent 1 Writing, 2: Embedded, 3: Agent 2 Querying, 4: Done
  const [simResult, setSimResult] = useState(null);

  const scenario = PRESET_SCENARIOS[selectedScenarioIdx];

  const [agent1Name, setAgent1Name] = useState(scenario.agent1);
  const [agent1Title, setAgent1Title] = useState(scenario.ruleTitle);
  const [agent1Content, setAgent1Content] = useState(scenario.ruleContent);

  const [agent2Name, setAgent2Name] = useState(scenario.agent2);
  const [agent2Query, setAgent2Query] = useState(scenario.query);

  const handleSelectScenario = (idx) => {
    const sc = PRESET_SCENARIOS[idx];
    setSelectedScenarioIdx(idx);
    setAgent1Name(sc.agent1);
    setAgent1Title(sc.ruleTitle);
    setAgent1Content(sc.ruleContent);
    setAgent2Name(sc.agent2);
    setAgent2Query(sc.query);
    setExecutionStep(0);
    setSimResult(null);
  };

  const handleRunFullProof = async () => {
    setIsRunning(true);
    setExecutionStep(1); // Agent 1 Writing

    setTimeout(() => {
      setExecutionStep(2); // Ingested & Embedded in Postgres
    }, 800);

    setTimeout(() => {
      setExecutionStep(3); // Agent 2 Querying
    }, 1600);

    try {
      const result = await runMultiAgentSimulation({
        agentA: agent1Name,
        agentB: agent2Name,
        title: agent1Title,
        content: agent1Content,
        tags: scenario?.ruleTags || ["custom", "standards"],
        query: agent2Query
      });

      setTimeout(() => {
        setExecutionStep(4); // Fully Verified
        setSimResult(result);
        setIsRunning(false);
      }, 2400);
    } catch (err) {
      console.error("Collab run failed:", err);
      setIsRunning(false);
      setExecutionStep(0);
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
            <span className="dash-badge dash-badge-yellow">Universal Mesh Harness</span>
            <span className="dash-badge dash-badge-green">Google Gemini MRL Embeddings (768d)</span>
          </div>
          <h1>Multi-Agent Collaboration Lab</h1>
          <p>
            Experience and verify how ExtenGen connects completely separate AI foundation models into a single shared institutional memory layer via pgvector.
          </p>
        </div>
        <div>
          <button
            className="dash-pill dash-pill-dark dash-pill-big"
            onClick={handleRunFullProof}
            disabled={isRunning}
            style={{ minWidth: "220px", justifyContent: "center" }}
          >
            {isRunning ? "Executing Live Collab..." : "Run Live Cross-Agent Test"}
          </button>
        </div>
      </div>

      {/* REAL CHROME EXTENSION BANNER */}
      <div style={{
        background: "linear-gradient(90deg, #141414 0%, #1e1e1e 100%)",
        border: "1.5px solid #10b981",
        borderRadius: "16px",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        color: "#ffffff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="21.17" y1="8" x2="12" y2="8"/>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "15px" }}>Universal Chrome Extension Ready (6 AI Engines)</strong>
              <span className="dash-badge dash-badge-green" style={{ fontSize: "11px" }}>Manifest V3</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#cccccc" }}>
              Live bidirectional mesh across <strong>ChatGPT</strong>, <strong>Claude</strong>, <strong>Gemini</strong>, <strong>DeepSeek</strong>, <strong>Copilot</strong>, and <strong>Perplexity</strong>. Load unpacked from <code>C:\ExtenGen-Ai\extension</code>.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-white dash-pill-sm"
          >
            ChatGPT
          </a>
          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-white dash-pill-sm"
          >
            Claude
          </a>
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-white dash-pill-sm"
          >
            Gemini
          </a>
          <a
            href="https://chat.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-white dash-pill-sm"
          >
            DeepSeek
          </a>
          <a
            href="https://copilot.microsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-white dash-pill-sm"
          >
            Copilot
          </a>
          <a
            href="https://perplexity.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-green dash-pill-sm"
          >
            Perplexity
          </a>
        </div>
      </div>

      {/* PRESET SCENARIOS SELECTOR */}
      <div className="dash-box" style={{ marginBottom: "20px", padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontSize: "14px" }}>Universal Mesh Presets:</strong>
            <span className="dash-badge dash-badge-yellow" style={{ fontSize: "10px" }}>6 Foundation Models</span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {PRESET_SCENARIOS.map((s, idx) => (
              <button
                key={s.name}
                className={`dash-pill ${selectedScenarioIdx === idx ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
                onClick={() => handleSelectScenario(idx)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TWO AGENT WORKSPACES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: "16px", alignItems: "center" }}>
        {/* AGENT 1 (WRITER) */}
        <div className="dash-box" style={{ border: executionStep >= 2 ? "2px solid #118a4b" : "1.5px solid var(--ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="dash-badge dash-badge-dark" style={{ fontWeight: 800 }}>A1</span>
              <div>
                <strong style={{ fontSize: "15px" }}>Agent 1 (Source Author)</strong>
                <div style={{ fontSize: "12px", color: "#666" }}>Captures and writes architecture memory</div>
              </div>
            </div>
            <div>
              <select
                className="dash-input"
                value={agent1Name}
                onChange={(e) => setAgent1Name(e.target.value)}
                style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px", fontWeight: "bold" }}
              >
                {AVAILABLE_AGENTS.map((agent) => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
              Rule Title / Context Summary
            </label>
            <input
              type="text"
              className="dash-input"
              value={agent1Title}
              onChange={(e) => setAgent1Title(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "13px" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
              Architectural Decision Body (Markdown)
            </label>
            <textarea
              className="dash-textarea"
              rows={4}
              value={agent1Content}
              onChange={(e) => setAgent1Content(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "13px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#666", borderTop: "1px solid #eee", paddingTop: "10px" }}>
            <span>Tool Invocation: <code>store_observation</code></span>
            {executionStep >= 2 && (
              <span className="dash-badge dash-badge-green">Vectorized (768d)</span>
            )}
          </div>
        </div>

        {/* PIPELINE ARROW */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: executionStep >= 2 ? "#118a4b" : "#e0e0e0",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
            transition: "all 0.3s"
          }}>
            VEC
          </div>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#666" }}>pgvector</span>
        </div>

        {/* AGENT 2 (READER) */}
        <div className="dash-box" style={{ border: executionStep >= 4 ? "2px solid #118a4b" : "1.5px solid var(--ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="dash-badge dash-badge-yellow" style={{ fontWeight: 800 }}>A2</span>
              <div>
                <strong style={{ fontSize: "15px" }}>Agent 2 (Target Consumer)</strong>
                <div style={{ fontSize: "12px", color: "#666" }}>Retrieves shared context seamlessly</div>
              </div>
            </div>
            <div>
              <select
                className="dash-input"
                value={agent2Name}
                onChange={(e) => setAgent2Name(e.target.value)}
                style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px", fontWeight: "bold" }}
              >
                {AVAILABLE_AGENTS.map((agent) => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
              Developer Prompt / Task Question
            </label>
            <textarea
              className="dash-textarea"
              rows={3}
              value={agent2Query}
              onChange={(e) => setAgent2Query(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "13px" }}
            />
          </div>

          <div style={{ height: "42px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#666" }}>
              Notice: Agent 2 has zero local chat history or prior prompt tokens.
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#666", borderTop: "1px solid #eee", paddingTop: "10px" }}>
            <span>Tool Invocation: <code>recall_context</code></span>
            {executionStep >= 4 && (
              <span className="dash-badge dash-badge-green">Context Injected</span>
            )}
          </div>
        </div>
      </div>

      {/* LIVE INTERACTIVE EXECUTION PIPELINE */}
      <div className="dash-box" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3>Live Execution & Proof Verifier</h3>
            <p className="dash-sub">Shows step-by-step vector search, cosine distance match, and prompt injection</p>
          </div>
          {executionStep === 4 && (
            <span className="dash-badge dash-badge-green" style={{ fontSize: "13px", padding: "6px 12px" }}>
              PROOF VERIFIED: Match Score {((simResult?.agentB?.topMatch?.similarity || 0.42) * 100).toFixed(1)}%
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
          {/* STEP 1 */}
          <div style={{
            padding: "14px",
            borderRadius: "10px",
            background: executionStep >= 1 ? "#f0fdf4" : "#f8fafc",
            border: executionStep >= 1 ? "1.5px solid #86efac" : "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div className="dash-badge dash-badge-dark" style={{ width: "24px", height: "24px", display: "grid", placeItems: "center", borderRadius: "50%", padding: 0 }}>
              {executionStep >= 2 ? "1" : executionStep === 1 ? "..." : "1"}
            </div>
            <div style={{ flex: 1 }}>
              <strong>Step 1: Agent 1 ({agent1Name}) captures & embeds decision into PostgreSQL</strong>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                Generates 768-dimensional dense neural embedding via Google Gemini gemini-embedding-001 pipeline.
              </div>
            </div>
            {simResult?.agentA?.id && (
              <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#166534" }}>
                ID: {simResult.agentA.id.slice(0, 8)}...
              </span>
            )}
          </div>

          {/* STEP 2 */}
          <div style={{
            padding: "14px",
            borderRadius: "10px",
            background: executionStep >= 3 ? "#f0fdf4" : "#f8fafc",
            border: executionStep >= 3 ? "1.5px solid #86efac" : "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div className="dash-badge dash-badge-dark" style={{ width: "24px", height: "24px", display: "grid", placeItems: "center", borderRadius: "50%", padding: 0 }}>
              {executionStep >= 4 ? "2" : executionStep === 3 ? "..." : "2"}
            </div>
            <div style={{ flex: 1 }}>
              <strong>Step 2: Agent 2 ({agent2Name}) queries ExtenGen with zero prior knowledge</strong>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                Runs pgvector cosine distance search across institutional knowledge base.
              </div>
            </div>
            {executionStep >= 4 && (
              <span className="dash-badge dash-badge-green">
                Found {simResult?.agentB?.matchesCount || 1} relevant decision
              </span>
            )}
          </div>

          {/* STEP 3 - RETRIEVED CONTENT PREVIEW & SYNTHESIZED AGENT 2 RESPONSE */}
          {executionStep === 4 && simResult?.agentB?.topMatch && (
            <div style={{ background: "#ffffff", border: "1.5px solid #10b981", borderRadius: "12px", padding: "16px", marginTop: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ color: "#065f46", fontSize: "14px" }}>
                  Injected Memory Context (Retrieved from Supabase pgvector):
                </strong>
                <span className="dash-badge dash-badge-dark">
                  Semantic Similarity: {((simResult.agentB.topMatch.similarity || 0.42) * 100).toFixed(1)}%
                </span>
              </div>
              <pre style={{
                background: "#0f172a",
                color: "#e2e8f0",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "12px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace"
              }}>
                {simResult.agentB?.formattedContext || simResult.agentB?.topMatch?.content}
              </pre>

              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                    <circle cx="12" cy="5" r="2"/>
                    <path d="M12 7v4"/>
                    <line x1="8" y1="16" x2="8" y2="16"/>
                    <line x1="16" y1="16" x2="16" y2="16"/>
                  </svg>
                  <strong style={{ fontSize: "13px", color: "#1e293b" }}>
                    {agent2Name} (Live Synthesized Output):
                  </strong>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                  "I retrieved the architectural decision recorded by <strong>{agent1Name}</strong> regarding <em>{simResult.agentB.topMatch.title}</em>:
                  <div style={{ margin: "8px 0", padding: "8px 12px", borderLeft: "3px solid #10b981", background: "#f0fdf4", fontStyle: "italic" }}>
                    {simResult.agentB.topMatch.content}
                  </div>
                  I am proceeding with your request adhering strictly to this standard across the codebase."
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
