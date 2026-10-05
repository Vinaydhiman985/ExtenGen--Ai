import React, { useState } from "react";

export function OverviewSection({ onNavigateToSection }) {
  const [timeRange, setTimeRange] = useState("7d");

  const chartData = {
    "24h": [
      { label: "00:00", stores: 12, recalls: 45 },
      { label: "04:00", stores: 5, recalls: 18 },
      { label: "08:00", stores: 28, recalls: 92 },
      { label: "12:00", stores: 44, recalls: 130 },
      { label: "16:00", stores: 38, recalls: 110 },
      { label: "20:00", stores: 22, recalls: 78 },
    ],
    "7d": [
      { label: "Mon", stores: 84, recalls: 240 },
      { label: "Tue", stores: 110, recalls: 310 },
      { label: "Wed", stores: 95, recalls: 290 },
      { label: "Thu", stores: 142, recalls: 420 },
      { label: "Fri", stores: 160, recalls: 490 },
      { label: "Sat", stores: 62, recalls: 180 },
      { label: "Sun", stores: 48, recalls: 140 },
    ],
    "30d": [
      { label: "Week 1", stores: 450, recalls: 1400 },
      { label: "Week 2", stores: 580, recalls: 1890 },
      { label: "Week 3", stores: 620, recalls: 2100 },
      { label: "Week 4", stores: 790, recalls: 2650 },
    ]
  };

  const currentData = chartData[timeRange];
  const maxVal = Math.max(...currentData.map(d => Math.max(d.stores, d.recalls))) * 1.15;

  const miniFeed = [
    { id: 1, time: "2 mins ago", type: "recall", title: "Cursor pagination decision", savings: "1,420 tokens", helpful: true, user: "Ana (Claude Code)" },
    { id: 2, time: "8 mins ago", type: "store", title: "Supabase RLS bypass prevention rule", secretsRedacted: 1, user: "Ravi (Cursor)" },
    { id: 3, time: "15 mins ago", type: "recall", title: "Fastify CORS configuration", savings: "890 tokens", helpful: true, user: "Mohammad (Codex)" },
    { id: 4, time: "32 mins ago", type: "store", title: "BullMQ exponential backoff parameters", secretsRedacted: 0, user: "Vinay (Claude Code)" },
    { id: 5, time: "1 hour ago", type: "recall", title: "pgvector HNSW index tune", savings: "2,150 tokens", helpful: true, user: "Ana (Claude Code)" },
  ];

  return (
    <div className="dash-section">
      <div className="dash-sec-header">
        <div>
          <span className="dash-badge dash-badge-dark">📊 Real-Time Metrics</span>
          <h1>System Overview & Shared Memory Analytics</h1>
          <p>Live visibility into memory indexing, recall efficiency, agent hit rates, and token cost savings.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="dash-pill dash-pill-white" onClick={() => onNavigateToSection("playground")}>
            🎯 Test Playground
          </button>
          <button className="dash-pill dash-pill-dark" onClick={() => onNavigateToSection("memories")}>
            🧠 Manage Memories
          </button>
        </div>
      </div>

      {/* 5 KPI CARDS */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Total Memories</span>
            <span>🧠</span>
          </div>
          <div className="dash-kpi-val">1,284</div>
          <div className="dash-kpi-sub pos">
            <span>↑ +12.4%</span> vs last week
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Recalls Today</span>
            <span>⚡</span>
          </div>
          <div className="dash-kpi-val">342</div>
          <div className="dash-kpi-sub pos">
            <span>↑ 48/hr</span> peak frequency
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Hit Rate</span>
            <span>🎯</span>
          </div>
          <div className="dash-kpi-val">94.2%</div>
          <div className="dash-kpi-sub pos">
            <span>98.1%</span> helpful recall rate
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-top">
            <span>Avg Relevance</span>
            <span>📐</span>
          </div>
          <div className="dash-kpi-val">0.912</div>
          <div className="dash-kpi-sub">
            <span>Cosine similarity</span> (1536-d)
          </div>
        </div>

        <div className="dash-kpi-card highlight">
          <div className="dash-kpi-top">
            <span>Token Savings</span>
            <span>💰</span>
          </div>
          <div className="dash-kpi-val">1.42M</div>
          <div className="dash-kpi-sub pos">
            <span>~$42.60</span> saved in context tokens
          </div>
        </div>
      </div>

      {/* CHART & MINI FEED GRID */}
      <div className="dash-grid-2">
        {/* STORES VS RECALLS CHART */}
        <div className="dash-box">
          <div className="dash-box-header">
            <div>
              <h3>Stores vs. Recalls Activity</h3>
              <p className="dash-sub" style={{ marginTop: "4px" }}>Comparison of memory ingestion (`store_observation`) vs. semantic search (`recall_context`)</p>
            </div>
            <div className="dash-picker">
              <button
                className={`dash-picker-btn ${timeRange === "24h" ? "active" : ""}`}
                onClick={() => setTimeRange("24h")}
              >
                24h
              </button>
              <button
                className={`dash-picker-btn ${timeRange === "7d" ? "active" : ""}`}
                onClick={() => setTimeRange("7d")}
              >
                7d
              </button>
              <button
                className={`dash-picker-btn ${timeRange === "30d" ? "active" : ""}`}
                onClick={() => setTimeRange("30d")}
              >
                30d
              </button>
            </div>
          </div>

          <div>
            <div className="dash-legend">
              <span className="dash-legend-item">
                <span className="dash-legend-dot dash-dot-recalls" /> Recalls (`recall_context`)
              </span>
              <span className="dash-legend-item">
                <span className="dash-legend-dot dash-dot-stores" /> Ingested Stores (`store_observation`)
              </span>
            </div>

            <div style={{ width: "100%" }}>
              <svg viewBox="0 0 700 240" style={{ width: "100%", height: "auto", maxHeight: "250px" }}>
                <line x1="40" y1="40" x2="680" y2="40" stroke="#e0e0dc" strokeDasharray="4 4" />
                <line x1="40" y1="100" x2="680" y2="100" stroke="#e0e0dc" strokeDasharray="4 4" />
                <line x1="40" y1="160" x2="680" y2="160" stroke="#e0e0dc" strokeDasharray="4 4" />
                <line x1="40" y1="210" x2="680" y2="210" stroke="#141414" strokeWidth="1.5" />

                {currentData.map((d, i) => {
                  const x = 70 + i * ((680 - 70) / (currentData.length - 1 || 1));
                  const recallsH = (d.recalls / maxVal) * 160;
                  const storesH = (d.stores / maxVal) * 160;

                  return (
                    <g key={d.label}>
                      {/* Recalls Bar */}
                      <rect
                        x={x - 14}
                        y={210 - recallsH}
                        width="12"
                        height={recallsH}
                        rx="3"
                        fill="#141414"
                      />
                      {/* Stores Bar */}
                      <rect
                        x={x + 2}
                        y={210 - storesH}
                        width="12"
                        height={storesH}
                        rx="3"
                        fill="#2fa36b"
                      />
                      <text x={x} y="230" textAnchor="middle" fill="#666" fontSize="12" fontFamily="var(--body)" fontWeight="600">
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* MINI LIVE FEED */}
        <div className="dash-box">
          <div className="dash-box-header">
            <div>
              <h3>Mini Live Feed</h3>
              <p className="dash-sub" style={{ marginTop: "4px" }}>Real-time token savings & helpful recall rate</p>
            </div>
            <button className="dash-pill dash-pill-white dash-pill-sm" onClick={() => onNavigateToSection("activity")}>
              View All →
            </button>
          </div>

          <div className="dash-feed-list">
            {miniFeed.map((item) => (
              <div key={item.id} className="dash-feed-item">
                <div className={`dash-feed-icon ${item.type}`}>
                  {item.type === "recall" ? "🎯" : "📥"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "15px", color: "#141414" }}>{item.title}</strong>
                    <span style={{ fontSize: "12px", color: "#666" }}>{item.time}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: "#666" }}>{item.user}</span>
                    {item.savings && (
                      <span className="dash-badge dash-badge-green">⚡ {item.savings} saved</span>
                    )}
                    {item.helpful && (
                      <span className="dash-badge dash-badge-dark">👍 Helpful</span>
                    )}
                    {item.secretsRedacted > 0 && (
                      <span className="dash-badge dash-badge-yellow">🔒 Secret Redacted</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
