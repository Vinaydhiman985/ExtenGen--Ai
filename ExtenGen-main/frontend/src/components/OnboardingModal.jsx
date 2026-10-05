import React, { useState } from "react";

export function OnboardingModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("claude");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const snippets = {
    claude: `{
  "mcpServers": {
    "extengen": {
      "command": "npx",
      "args": ["-y", "extengen-mcp"],
      "env": {
        "EXTENGEN_API_KEY": "ex_live_9f82a1b9204c44a8b",
        "EXTENGEN_ENDPOINT": "http://localhost:3000/sse"
      }
    }
  }
}`,
    cursor: `{
  "mcp": {
    "servers": [
      {
        "name": "extengen",
        "type": "sse",
        "url": "http://localhost:3000/sse",
        "headers": {
          "Authorization": "Bearer ex_live_9f82a1b9204c44a8b"
        }
      }
    ]
  }
}`,
    api: `curl -X POST http://localhost:3000/api/recall \\
  -H "Authorization: Bearer ex_live_9f82a1b9204c44a8b" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "database connection setup", "top_k": 3}'`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dash-modal-backdrop" onClick={onClose}>
      <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <span className="dash-badge dash-badge-yellow">⚡ Quick Setup</span>
            <h2 style={{ font: "400 32px/1 var(--disp)", textTransform: "uppercase", margin: "6px 0 0" }}>Connect Agent</h2>
            <p className="dash-sub">Integrate ExtenGen shared memory into Claude Code or Cursor.</p>
          </div>
          <button className="dash-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
          <button
            className={`dash-pill ${activeTab === "claude" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
            onClick={() => setActiveTab("claude")}
          >
            🤖 Claude Code (MCP)
          </button>
          <button
            className={`dash-pill ${activeTab === "cursor" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
            onClick={() => setActiveTab("cursor")}
          >
            ⚡ Cursor IDE
          </button>
          <button
            className={`dash-pill ${activeTab === "api" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
            onClick={() => setActiveTab("api")}
          >
            📡 REST API
          </button>
        </div>

        <div style={{ background: "#141414", borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid #333", fontSize: "12px", color: "#aaa" }}>
            <span>{activeTab === "claude" ? "claude_desktop_config.json" : activeTab === "cursor" ? ".cursor/mcp.json" : "cURL"}</span>
            <button className="dash-pill dash-pill-white dash-pill-sm" onClick={handleCopy}>
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
          </div>
          <pre style={{ padding: "16px", margin: 0, fontSize: "13px", color: "#e8e8e8" }}><code>{snippets[activeTab]}</code></pre>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button className="dash-pill dash-pill-white" onClick={onClose}>Close</button>
          <button className="dash-pill dash-pill-dark" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
