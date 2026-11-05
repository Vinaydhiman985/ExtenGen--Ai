import React, { useState, useEffect } from "react";
import { fetchActiveAgents, simulateAgentConnection } from "../services/api.js";

export function OnboardingModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("cursor");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [agentsData, setAgentsData] = useState({ count: 0, agents: [] });
  const [simulating, setSimulating] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({ lanIp: "10.94.17.216" });
  const [useLanIp, setUseLanIp] = useState(false);

  const loadAgents = async () => {
    const res = await fetchActiveAgents();
    if (res.ok && res.data) {
      setAgentsData(res.data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAgents();
      fetch("/health")
        .then((r) => r.json())
        .then((d) => {
          if (d.network) setNetworkInfo(d.network);
        })
        .catch(() => {});
      const interval = setInterval(loadAgents, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleSimulateToggle = async () => {
    setSimulating(true);
    if (agentsData.count > 0) {
      await simulateAgentConnection("disconnect");
    } else {
      await simulateAgentConnection("connect", activeTab === "claude" ? "Claude Code CLI v1.2" : "Cursor IDE v0.42");
    }
    await loadAgents();
    setSimulating(false);
  };

  if (!isOpen) return null;

  const currentHost = useLanIp && networkInfo?.lanIp ? `${networkInfo.lanIp}:3000` : "127.0.0.1:3000";
  const mcpLink = `http://${currentHost}/sse`;

  const snippets = {
    cursor: `// Cursor IDE Setup:
// Method 1: Project Auto-config (Recommended)
// A .cursor/mcp.json file has already been added to your repo:
{
  "mcpServers": {
    "extengen": {
      "url": "${mcpLink}"
    }
  }
}

// Method 2: In Cursor Settings UI
// 1. Open Cursor Settings -> Features -> MCP
// 2. Click "+ Add New MCP Server"
//    Name: extengen | Type: sse | Server URL: ${mcpLink}`,

    windsurf: `// Windsurf (Codeium) Setup:
// Add to ~/.codeium/windsurf/mcp_config.json:
{
  "mcpServers": {
    "extengen": {
      "serverUrl": "${mcpLink}"
    }
  }
}`,

    vscode: `// VS Code (Cline / Roo Code / Continue.dev) Setup:
// In Cline / Roo Code settings -> MCP Servers -> Edit MCP Settings:
{
  "mcpServers": {
    "extengen": {
      "url": "${mcpLink}",
      "type": "sse"
    }
  }
}`,

    claude: `# Claude Code CLI Setup (Terminal):
# Run this command in any terminal:
claude mcp add extengen ${mcpLink}

# For Claude Desktop, add to claude_desktop_config.json:
{
  "mcpServers": {
    "extengen": {
      "command": "npx",
      "args": ["-y", "tsx", "d:/ExtenGen-Ai/ExtenGen-main/backend/src/mcp/stdio.ts"]
    }
  }
}`,

    python: `# Python / CrewAI / LangChain / AutoGen:
# Connect any autonomous Python agent in 5 lines:
import requests

# 1. Store architectural decision from your agent
requests.post("http://${currentHost}/api/v1/observations", json={
    "title": "Auth Architecture",
    "content": "Using JWT with 15min expiry and PostgreSQL RLS",
    "source": "crewai_agent"
})

# 2. Recall shared context before answering:
res = requests.post("http://${currentHost}/api/v1/context/recall", json={
    "query": "what auth system do we use?",
    "limit": 3
}).json()

print("Recalled context:", res.get("results"))`,

    chatgpt: `# OpenAI / ChatGPT Custom GPT:
# 1. Open ChatGPT -> My GPTs -> Create a GPT -> Configure -> Actions -> Create new action
# 2. Paste OpenAPI Schema URL:
#    http://${currentHost}/openapi.json
# 3. ChatGPT automatically gains:
#    - storeObservation
#    - recallContext
# Now ChatGPT can query and contribute to your team's persistent memory!`,

    api: `# Direct REST API / cURL (Usable from any language or script):

# 1. Store memory
curl -X POST http://${currentHost}/api/v1/observations \\
  -H "Content-Type: application/json" \\
  -d '{"title": "DB Setup", "content": "PostgreSQL with Supabase & pgvector"}'

# 2. Semantic Recall
curl -X POST http://${currentHost}/api/v1/context/recall \\
  -H "Content-Type: application/json" \\
  -d '{"query": "how is the database set up?", "limit": 3}'`
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mcpLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="dash-modal-backdrop" onClick={onClose}>
      <div className="dash-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <span className="dash-badge dash-badge-yellow">⚡ MCP Connection Hub</span>
            <h2 style={{ font: "400 30px/1 var(--disp)", textTransform: "uppercase", margin: "6px 0 0" }}>Connect Your AI Agent</h2>
            <p className="dash-sub">Provide this link to Cursor IDE, Claude Code, or Windsurf to share persistent memory.</p>
          </div>
          <button className="dash-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* NETWORK IP SELECTOR */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f1f5f9",
          padding: "8px 12px",
          borderRadius: "10px",
          marginBottom: "12px",
          fontSize: "12px",
        }}>
          <span style={{ fontWeight: 600, color: "#334155" }}>
            🌐 Network Target:
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`dash-pill ${!useLanIp ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
              onClick={() => setUseLanIp(false)}
            >
              💻 Localhost (127.0.0.1)
            </button>
            <button
              type="button"
              className={`dash-pill ${useLanIp ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
              onClick={() => setUseLanIp(true)}
            >
              📡 Real LAN IP ({networkInfo.lanIp || "10.94.17.216"})
            </button>
          </div>
        </div>

        {/* PROMINENT COPY-LINK BOX */}
        <div style={{
          background: "#141414",
          color: "#ffffff",
          borderRadius: "14px",
          padding: "16px 18px",
          marginBottom: "16px",
          border: "1.5px solid #262626"
        }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af", fontWeight: "bold", marginBottom: "6px" }}>
            🔌 Official MCP Server SSE URL ({useLanIp ? "Real Network IP" : "Local Machine"}):
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <code style={{ fontSize: "15px", color: "#34d399", fontFamily: "monospace", wordBreak: "break-all" }}>
              {mcpLink}
            </code>
            <button
              className="dash-pill dash-pill-white dash-pill-sm"
              onClick={handleCopyLink}
              style={{ whiteSpace: "nowrap", minWidth: "95px", justifyContent: "center" }}
            >
              {copiedLink ? "✓ Copied!" : "📋 Copy Link"}
            </button>
          </div>
        </div>

        {/* REAL-TIME AGENT CONNECTION STATUS BANNER */}
        <div style={{
          background: agentsData.count > 0 ? "#ecfdf5" : "#f8fafc",
          border: agentsData.count > 0 ? "1.5px solid #10b981" : "1.5px solid #e2e8f0",
          borderRadius: "14px",
          padding: "12px 16px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>{agentsData.count > 0 ? "🟢" : "⚪"}</span>
              <strong style={{ fontSize: "13.5px", color: agentsData.count > 0 ? "#065f46" : "#475569" }}>
                {agentsData.count > 0
                  ? `${agentsData.count} Agent(s) Online: ${agentsData.agents.map(a => a.agentName).join(", ")}`
                  : "No External Agents Connected Right Now"}
              </strong>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px", marginLeft: "22px" }}>
              ExtenGen Server listening on port 3000 | Host: {currentHost} | Transport: SSE
            </div>
          </div>
          <button
            className={`dash-pill ${agentsData.count > 0 ? "dash-pill-white" : "dash-pill-dark"} dash-pill-sm`}
            onClick={handleSimulateToggle}
            disabled={simulating}
          >
            {simulating ? "..." : agentsData.count > 0 ? "Disconnect Test Agent" : "⚡ Simulate Connect"}
          </button>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          {[
            { id: "cursor", label: "⚡ Cursor IDE" },
            { id: "windsurf", label: "🌊 Windsurf (Codeium)" },
            { id: "vscode", label: "💻 VS Code (Cline/Roo)" },
            { id: "claude", label: "🤖 Claude Code / Desktop" },
            { id: "python", label: "🐍 Python / CrewAI / LangChain" },
            { id: "chatgpt", label: "💬 ChatGPT / Custom GPT" },
            { id: "api", label: "📡 REST API / cURL" },
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

        {/* CODE SNIPPET */}
        <div style={{ background: "#0f172a", borderRadius: "14px", overflow: "hidden", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid #334155", fontSize: "12px", color: "#94a3b8" }}>
            <span>
              {activeTab === "cursor" && "Cursor Settings -> Features -> MCP or .cursor/mcp.json"}
              {activeTab === "windsurf" && "~/.codeium/windsurf/mcp_config.json"}
              {activeTab === "vscode" && "Cline / Roo Code MCP Settings"}
              {activeTab === "claude" && "Terminal Command (claude mcp add)"}
              {activeTab === "python" && "Python Agent Integration Script"}
              {activeTab === "chatgpt" && "Custom GPT OpenAPI Action URL"}
              {activeTab === "api" && "Direct cURL & REST API"}
            </span>
            <button className="dash-pill dash-pill-white dash-pill-sm" onClick={handleCopySnippet}>
              {copiedSnippet ? "✓ Copied!" : "📋 Copy Snippet"}
            </button>
          </div>
          <pre style={{ padding: "14px", margin: 0, fontSize: "12.5px", color: "#e2e8f0", maxHeight: "200px", overflowY: "auto", lineHeight: "1.5" }}>
            <code>{snippets[activeTab]}</code>
          </pre>
        </div>

        {/* WHY THIS JSON? EXPLANATION CARD */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "10px 14px",
          marginBottom: "14px",
          fontSize: "12px",
          lineHeight: "1.5",
          color: "#475569"
        }}>
          <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            💡 Ye JSON Snippet kya karta hai? (What is the purpose of this JSON?)
          </strong>
          <div>
            AI tools (Cursor, Windsurf, Claude) ko pehle se nahi pata hota ki ExtenGen kahan chal raha hai. Yeh JSON unka <strong>"Configuration Passport"</strong> hai. Isme bataya jata hai ki server ka naam <code>extengen</code> hai aur connection URL <code>{mcpLink}</code> hai. Jaise hi AI IDE ye JSON padhti hai, wo background me connect hoke ExtenGen ke <code>store_observation</code> aur <code>recall_context</code> tools ko apne paas activate kar leti hai!
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button className="dash-pill dash-pill-dark" onClick={onClose} style={{ minWidth: "100px", justifyContent: "center" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
