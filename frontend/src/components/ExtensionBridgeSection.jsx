import React, { useState, useEffect } from "react";
import { fetchActiveAgents, checkHealth } from "../services/api.js";

export function ExtensionBridgeSection() {
  const [copiedPath, setCopiedPath] = useState(false);
  const [backendLive, setBackendLive] = useState(true);
  const [chatgptText, setChatgptText] = useState(
    "In our ChatGPT session, we decided: 1. Use Stripe Checkout with webhook signature validation. 2. Store idempotency keys in Redis with 24h TTL. 3. User JWT tokens expire in 15 minutes."
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

  const handleSimulateHandoff = async () => {
    if (!chatgptText.trim()) return;

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
          fromAgent: "ChatGPT",
          toAgent: "Google Gemini",
          title: "Browser Extension Handoff",
          content: chatgptText.trim(),
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
            <span className="dash-badge dash-badge-green">Browser Integration</span>
            <span className="dash-badge dash-badge-dark">Manifest V3</span>
            <span className="dash-sidebar-dot green" />
            <span style={{ fontSize: "12px", color: "var(--mut)", fontFamily: "var(--mono)" }}>
              {backendLive ? "Fastify Port 3001 Live" : "Fastify Offline"}
            </span>
          </div>
          <h1>ExtenGen Chrome Extension Setup & Live Bridge</h1>
          <p>
            Connects <strong>ChatGPT</strong> and <strong>Google Gemini</strong> in your browser with a single floating button. No manual copy-pasting required.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-white"
          >
            Open ChatGPT
          </a>
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="dash-pill dash-pill-green"
          >
            Open Gemini
          </a>
        </div>
      </div>

      {/* QUICK INSTALL STEPS CARD */}
      <div className="dash-box" style={{ background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)", border: "1.5px solid #141414", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "18px" }}>Install in Google Chrome (15 Seconds)</h3>
            <p className="dash-sub">Load the unpacked extension folder directly into Chrome, Brave, or Microsoft Edge</p>
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
              <strong style={{ fontSize: "14px" }}>Ready to Bridge!</strong>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Go to <a href="https://chatgpt.com" target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600 }}>chatgpt.com</a>. You will see the floating green button at bottom-right.
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE EXTENSION SIMULATOR */}
      <div className="dash-box">
        <div className="dash-box-header">
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="dash-badge dash-badge-yellow">Interactive Preview</span>
              <span className="dash-badge dash-badge-green">Live Backend Test</span>
            </div>
            <h3 style={{ margin: "6px 0 2px" }}>Test Extension Handoff (Browser Playground)</h3>
            <p className="dash-sub">
              See exactly how the Chrome Extension extracts your conversation and injects it into Google Gemini:
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "20px", alignItems: "center", margin: "16px 0" }}>
          {/* STEP 1: CHATGPT SIMULATOR */}
          <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "14px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>ChatGPT Session (chatgpt.com)</strong>
              <span className="dash-badge dash-badge-dark">Source</span>
            </div>
            <textarea
              className="dash-textarea"
              rows={4}
              value={chatgptText}
              onChange={(e) => setChatgptText(e.target.value)}
              placeholder="What you discussed in ChatGPT..."
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
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16, 185, 129, 0.8)" }} />
                <span>{isSyncing ? "Saving to Vector DB..." : "ExtenGen | Handoff to Gemini"}</span>
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

          {/* STEP 2: GEMINI RECEIVER SIMULATOR */}
          <div style={{ background: syncDone ? "#f0fdf4" : "#f8fafc", border: syncDone ? "1.5px solid #10b981" : "1.5px dashed #cbd5e1", borderRadius: "14px", padding: "16px", transition: "all 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Google Gemini Prompt Box</strong>
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
                  Stored in Supabase (Vector 768d) · Ready for Gemini with zero context loss
                </div>
              </div>
            ) : (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                Click <strong>"ExtenGen | Handoff to Gemini"</strong> on the left to see the prompt injection preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

