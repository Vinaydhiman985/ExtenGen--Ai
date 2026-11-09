import React, { useState } from "react";
import { createObservation } from "../services/api.js";
import { KnowledgeGapsAreaChart } from "./Charts.jsx";

export function KnowledgeGapsSection({ onNavigateToMemories }) {
  const [createGapModal, setCreateGapModal] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [createdSuccess, setCreatedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gaps = [
    {
      id: "gap-1",
      topic: "Staged Database Migrations & Rollback Procedure",
      querySample: "How to deploy database migrations in staging environment without downtime?",
      frequency: 18,
      lastAsked: "20 mins ago",
      agentClients: ["Claude Code", "Cursor IDE"],
      severity: "High",
      tags: ["db", "deployment"]
    },
    {
      id: "gap-2",
      topic: "Stripe Webhook Signature Verification & Secrets",
      querySample: "Where is the STRIPE_WEBHOOK_SECRET stored and how to verify event signature?",
      frequency: 14,
      lastAsked: "1 hour ago",
      agentClients: ["Claude Code", "Codex"],
      severity: "High",
      tags: ["security", "api"]
    },
    {
      id: "gap-3",
      topic: "Redis Cluster Connection Failover Strategy",
      querySample: "How does ioredis handle sentinel failover when primary Redis crashes?",
      frequency: 9,
      lastAsked: "3 hours ago",
      agentClients: ["Cursor IDE"],
      severity: "Medium",
      tags: ["infrastructure"]
    },
    {
      id: "gap-4",
      topic: "Frontend TailwindCSS vs PostCSS Subfolder Config",
      querySample: "Why does Vite look for postcss.config.js in drive root during build?",
      frequency: 6,
      lastAsked: "Yesterday",
      agentClients: ["Claude Code"],
      severity: "Low",
      tags: ["frontend"]
    }
  ];

  const handleOpenCreate = (gap) => {
    setCreateGapModal(gap);
    setNewTitle(gap.topic);
    setNewContent(`Standard operating procedure for: ${gap.topic}\n\nKey decisions & rules:\n1. ...`);
  };

  const handleSubmitMemory = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    try {
      await createObservation({
        title: newTitle,
        content: newContent,
        source: "manual",
        tags: createGapModal?.tags || ["knowledge-gap"],
        immediateEmbed: true,
      });

      setCreatedSuccess(true);
      setTimeout(() => {
        setCreatedSuccess(false);
        setCreateGapModal(null);
        if (onNavigateToMemories) onNavigateToMemories("Indexed");
      }, 1000);
    } catch (err) {
      console.error("Failed to create gap resolution memory:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="dash-badge dash-badge-yellow">Sample Insights</span>
            <span className="dash-badge dash-badge-white" style={{ fontSize: "11px", opacity: 0.85 }}>Demo Cluster Model</span>
          </div>
          <h1>Unanswered Knowledge Gaps</h1>
          <p>Zero-result queries grouped by topic. Identified when AI agents ask questions that return no matching memories in ExtenGen.</p>
        </div>
      </div>

      <div style={{
        background: "rgba(245, 158, 11, 0.08)",
        border: "1.5px dashed #d97706",
        borderRadius: "12px",
        padding: "12px 18px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="dash-badge dash-badge-yellow" style={{ fontWeight: 700 }}>
            EXAMPLE / SAMPLE DATASET
          </span>
          <span style={{ fontSize: "13px", color: "#92400e" }}>
            These are illustrative knowledge gap clusters. As team agents make 0-match recall queries, real clusters appear here. Click <strong>"Draft Knowledge Standard"</strong> on any item to save it into real PostgreSQL memory!
          </span>
        </div>
        <span style={{ fontSize: "11px", color: "#b45309", fontFamily: "var(--mono)" }}>Demo Model</span>
      </div>

      <div style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", background: "var(--card)", border: "1.5px solid var(--ink)", borderRadius: "20px", padding: "24px", opacity: 0.92, display: "grid" }}>
        <div><span className="dash-kpi-val">4</span><span className="dash-sub">Sample Gaps</span></div>
        <div><span className="dash-kpi-val">47</span><span className="dash-sub">Sample Unanswered Queries</span></div>
        <div><span className="dash-kpi-val">~2.8k</span><span className="dash-sub">Saved Agent Tokens</span></div>
        <div><span className="dash-sub">Priority Rating</span><span className="dash-badge dash-badge-yellow" style={{ marginTop: "6px" }}>High Priority</span></div>
      </div>

      {/* GRAPH 4: ZERO-MATCH QUERIES INGESTION TREND */}
      <KnowledgeGapsAreaChart />

      <div className="dash-box dash-table-box">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Unanswered Topic & Sample Query</th>
                <th>Frequency</th>
                <th>Agents Affected</th>
                <th>Severity</th>
                <th>Last Asked</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap) => (
                <tr key={gap.id} className="dash-row">
                  <td style={{ maxWidth: "380px" }}>
                    <strong style={{ fontSize: "16px", color: "#141414" }}>{gap.topic}</strong>
                    <p style={{ fontSize: "13.5px", color: "#666", fontStyle: "italic", margin: "4px 0 8px" }}>"{gap.querySample}"</p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {gap.tags.map((t) => (
                        <span key={t} className="dash-badge dash-badge-white">#{t}</span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <span className="dash-mono dash-bold" style={{ fontSize: "20px", color: "#c93b3b" }}>{gap.frequency}x</span>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {gap.agentClients.map((client) => (
                        <strong key={client} style={{ fontSize: "14px", color: "#141414" }}>{client}</strong>
                      ))}
                    </div>
                  </td>

                  <td>
                    <span className={`dash-badge ${gap.severity === "High" ? "dash-badge-red" : gap.severity === "Medium" ? "dash-badge-yellow" : "dash-badge-white"}`}>
                      {gap.severity}
                    </span>
                  </td>

                  <td style={{ fontSize: "13px", color: "#666" }}>{gap.lastAsked}</td>

                  <td>
                    <button
                      className="dash-pill dash-pill-dark dash-pill-sm"
                      onClick={() => handleOpenCreate(gap)}
                    >
                      Create Memory
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MEMORY MODAL */}
      {createGapModal && (
        <div className="dash-modal-backdrop" onClick={() => setCreateGapModal(null)}>
          <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <span className="dash-badge dash-badge-dark">Fill Knowledge Gap</span>
                <h2 style={{ font: "400 32px/1 var(--disp)", textTransform: "uppercase" }}>Create Memory</h2>
                <p className="dash-sub">Addressing topic: <strong>{createGapModal.topic}</strong></p>
              </div>
              <button className="dash-close-btn" onClick={() => setCreateGapModal(null)}>✕</button>
            </div>

            {createdSuccess ? (
              <div style={{ padding: "30px", textAlign: "center" }}>
                <span className="dash-badge dash-badge-green" style={{ fontSize: "14px", padding: "6px 14px", display: "inline-block", marginBottom: "12px" }}>Success</span>
                <h3>Memory Created & Sent to Review Queue!</h3>
              </div>
            ) : (
              <form onSubmit={handleSubmitMemory}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700 }}>Memory Title</label>
                  <input
                    type="text"
                    className="dash-input"
                    style={{ border: "1.5px solid #141414", borderRadius: "10px", padding: "10px 14px", marginTop: "4px" }}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700 }}>Observation & Decision Content</label>
                  <textarea
                    className="dash-textarea"
                    rows={5}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button type="button" className="dash-pill dash-pill-white" onClick={() => setCreateGapModal(null)}>Cancel</button>
                  <button type="submit" className="dash-pill dash-pill-dark">Save Memory</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
