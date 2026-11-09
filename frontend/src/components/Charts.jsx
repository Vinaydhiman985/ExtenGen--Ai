import React, { useState, useRef } from "react";

/**
 * 1. Line Chart: API Throughput & Tool Calls Over Time
 * Visualizes real-time MCP tool executions (recall_context vs store_observation)
 */
export function ThroughputLineChart() {
  const [range, setRange] = useState("24h");
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  // Datasets for different time ranges
  const datasets = {
    "24h": {
      labels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "Now"],
      recalls: [18, 12, 8, 14, 38, 72, 95, 110, 84, 96, 114, 128],
      stores: [6, 4, 2, 5, 14, 26, 34, 42, 28, 33, 39, 45],
      latency: [16, 15, 14, 17, 18, 20, 22, 19, 18, 19, 17, 18],
      totalCalls: "1,248",
      avgLatency: "18ms",
      peakRps: "34/min"
    },
    "7d": {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      recalls: [480, 620, 750, 890, 1040, 410, 520],
      stores: [140, 190, 240, 280, 310, 95, 120],
      latency: [17, 18, 19, 18, 21, 16, 17],
      totalCalls: "6,075",
      avgLatency: "18.2ms",
      peakRps: "48/min"
    },
    "1h": {
      labels: ["-50m", "-40m", "-30m", "-20m", "-10m", "-5m", "Now"],
      recalls: [12, 15, 22, 18, 28, 34, 31],
      stores: [4, 5, 8, 6, 9, 11, 10],
      latency: [18, 17, 19, 18, 17, 18, 17],
      totalCalls: "223",
      avgLatency: "17.8ms",
      peakRps: "12/min"
    }
  };

  const data = datasets[range];
  const maxVal = Math.max(...data.recalls) * 1.15 || 100;

  // SVG dimensions
  const width = 640;
  const height = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const pointsCount = data.labels.length;
  const getX = (idx) => padLeft + (idx / (pointsCount - 1)) * plotW;
  const getY = (val) => padTop + plotH - (val / maxVal) * plotH;

  const recallPoints = data.recalls.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));
  const storePoints = data.stores.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));

  // Generate SVG path string
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const toAreaPath = (pts) => `${toPath(pts)} L ${pts[pts.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;
    
    if (svgX < padLeft || svgX > width - padRight) {
      setHoverIndex(null);
      return;
    }

    const ratio = (svgX - padLeft) / plotW;
    const idx = Math.min(Math.max(Math.round(ratio * (pointsCount - 1)), 0), pointsCount - 1);
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeIdx = hoverIndex !== null ? hoverIndex : pointsCount - 1;

  return (
    <div className="dash-box" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="dash-box-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="dash-badge dash-badge-dark">Telemetry</span>
            <span className="dash-badge dash-badge-yellow" style={{ fontSize: "11px" }}>Sample Benchmark</span>
            <span className="dash-sidebar-dot green" />
            <span style={{ fontSize: "12px", color: "var(--mut)", fontFamily: "var(--mono)" }}>Fastify + SSE</span>
          </div>
          <h3 style={{ margin: "6px 0 2px" }}>API Throughput & Tool Calls</h3>
          <p className="dash-sub">Frequency of `recall_context` vs `store_observation` MCP calls over time</p>
        </div>

        {/* Range picker buttons */}
        <div className="dash-picker">
          {["1h", "24h", "7d"].map((r) => (
            <button
              key={r}
              className={`dash-picker-btn ${range === r ? "active" : ""}`}
              onClick={() => { setRange(r); setHoverIndex(null); }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats strip */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: "11px", color: "var(--mut)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Total Executions</span>
          <strong style={{ fontSize: "18px", fontFamily: "var(--mono)", color: "var(--ink)" }}>{data.totalCalls}</strong>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "var(--mut)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Avg Latency</span>
          <strong style={{ fontSize: "18px", fontFamily: "var(--mono)", color: "#10b981" }}>{data.avgLatency}</strong>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "var(--mut)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Peak Rate</span>
          <strong style={{ fontSize: "18px", fontFamily: "var(--mono)", color: "var(--ink)" }}>{data.peakRps}</strong>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "var(--mut)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Error Rate</span>
          <strong style={{ fontSize: "18px", fontFamily: "var(--mono)", color: "#10b981" }}>0.00%</strong>
        </div>
      </div>

      {/* Legend & Current Hover Readout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", flexWrap: "wrap", gap: "10px" }}>
        <div className="dash-legend" style={{ margin: 0 }}>
          <div className="dash-legend-item">
            <span className="dash-legend-dot" style={{ background: "#141414" }} />
            <span>recall_context</span>
            <strong style={{ fontFamily: "var(--mono)", marginLeft: "4px" }}>({data.recalls[activeIdx]})</strong>
          </div>
          <div className="dash-legend-item">
            <span className="dash-legend-dot" style={{ background: "#2563eb" }} />
            <span>store_observation</span>
            <strong style={{ fontFamily: "var(--mono)", marginLeft: "4px" }}>({data.stores[activeIdx]})</strong>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--mut)", fontFamily: "var(--mono)" }}>
          Point: <b>{data.labels[activeIdx]}</b> | Latency: <b>{data.latency[activeIdx]}ms</b>
        </div>
      </div>

      {/* Responsive SVG Line Chart */}
      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%", cursor: "crosshair", userSelect: "none" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <defs>
            {/* Linear gradients for filled area */}
            <linearGradient id="gradRecalls" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141414" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#141414" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradStores" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + plotH * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e5e5e2"
                  strokeDasharray={pct === 0 ? "none" : "3,3"}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#888888"
                  fontFamily="var(--mono)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bottom X-Axis labels */}
          {data.labels.map((lbl, i) => {
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill={hoverIndex === i ? "#141414" : "#888888"}
                fontWeight={hoverIndex === i ? "700" : "500"}
                fontFamily="var(--mono)"
              >
                {lbl}
              </text>
            );
          })}

          {/* Filled Area paths */}
          <path d={toAreaPath(recallPoints)} fill="url(#gradRecalls)" />
          <path d={toAreaPath(storePoints)} fill="url(#gradStores)" />

          {/* Solid line paths */}
          <path
            d={toPath(storePoints)}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={toPath(recallPoints)}
            fill="none"
            stroke="#141414"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active hover crosshair cursor */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={padTop + plotH}
                stroke="#141414"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <circle
                cx={recallPoints[hoverIndex].x}
                cy={recallPoints[hoverIndex].y}
                r="5"
                fill="#ffffff"
                stroke="#141414"
                strokeWidth="2.5"
              />
              <circle
                cx={storePoints[hoverIndex].x}
                cy={storePoints[hoverIndex].y}
                r="5"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/**
 * 2. Donut Chart: Memory & Chunk Type Breakdown
 * Shows proportion of stored knowledge chunks across categories
 */
export function MemoryDonutChart({ totalMemories = 0, sourcesBreakdown = {} }) {
  const [activeSlice, setActiveSlice] = useState(null);

  const hasRealData = totalMemories > 0 && Object.keys(sourcesBreakdown).length > 0;

  let categories = [];
  if (hasRealData) {
    const colorPalette = {
      agent_session: "#141414",
      github_pr: "#10b981",
      github_commit: "#2563eb",
      manual: "#e9e23a",
      api: "#8b5cf6",
    };
    const nameMap = {
      agent_session: "Agent Sessions (MCP)",
      github_pr: "GitHub PRs (Merged)",
      github_commit: "Git Commits",
      manual: "Manual Notes & Rules",
      api: "REST API Ingestion",
    };

    categories = Object.entries(sourcesBreakdown).map(([source, count], idx) => {
      const pct = Math.round((Number(count) / totalMemories) * 100);
      return {
        id: source,
        name: nameMap[source] || source,
        count: Number(count),
        color: colorPalette[source] || ["#141414", "#10b981", "#2563eb", "#e9e23a", "#ec4899"][idx % 5],
        pct,
      };
    });
  } else {
    categories = [
      { id: "arch", name: "Architecture & Standards (Sample)", count: 18, color: "#141414", pct: 42 },
      { id: "api", name: "API & Endpoints (Sample)", count: 12, color: "#10b981", pct: 28 },
      { id: "db", name: "DB & Vector Schemas (Sample)", count: 8, color: "#2563eb", pct: 18 },
      { id: "sec", name: "Security & RLS Rules (Sample)", count: 4, color: "#e9e23a", pct: 12 },
    ];
  }

  // SVG arc calculation for donut
  const size = 220;
  const center = size / 2;
  const radius = 75;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPct = 0;

  const activeCategory = activeSlice !== null ? categories[activeSlice] : null;

  return (
    <div className="dash-box" style={{ display: "flex", flexDirection: "column", gap: "16px", opacity: hasRealData ? 1 : 0.90 }}>
      <div className="dash-box-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className={`dash-badge ${hasRealData ? "dash-badge-green" : "dash-badge-yellow"}`}>
              {hasRealData ? "Live DB Breakdown" : "Example Distribution"}
            </span>
            <span className="dash-badge dash-badge-white" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
              {hasRealData ? "PostgreSQL Real-Time" : "Sample Model"}
            </span>
          </div>
          <h3 style={{ margin: "6px 0 2px" }}>Memory Type Breakdown</h3>
          <p className="dash-sub">
            {hasRealData
              ? "Live categorical distribution of stored knowledge chunks"
              : "Sample categorical distribution (Live stats update when memories are created)"}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", flexWrap: "wrap", padding: "10px 0" }}>
        {/* SVG Donut Ring */}
        <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background track circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#ebebeb"
              strokeWidth={strokeWidth}
            />

            {categories.map((cat, i) => {
              const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPct / 100) * circumference);
              accumulatedPct += cat.pct;

              const isHovered = activeSlice === i;

              return (
                <circle
                  key={cat.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{
                    transition: "stroke-width 0.2s, opacity 0.2s",
                    cursor: "pointer",
                    opacity: activeSlice !== null && !isHovered ? 0.45 : 1
                  }}
                  onMouseEnter={() => setActiveSlice(i)}
                  onMouseLeave={() => setActiveSlice(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout Metric */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}
          >
            <span
              style={{
                font: "400 36px/1 var(--disp)",
                color: activeCategory ? activeCategory.color : "var(--ink)",
                letterSpacing: "0.02em"
              }}
            >
              {activeCategory ? activeCategory.count : totalMemories}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--mut)",
                fontFamily: "var(--mono)",
                marginTop: "2px"
              }}
            >
              {activeCategory ? activeCategory.pct + "%" : "CHUNKS"}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minWidth: "170px" }}>
          {categories.map((cat, idx) => {
            const isHovered = activeSlice === idx;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveSlice(idx)}
                onMouseLeave={() => setActiveSlice(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  background: isHovered ? "rgba(0,0,0,0.04)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      background: cat.color,
                      border: cat.color === "#e9e23a" ? "1px solid #141414" : "none"
                    }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: isHovered ? 700 : 500, color: "var(--ink)" }}>
                    {cat.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--mono)", fontSize: "12px" }}>
                  <strong>{cat.count}</strong>
                  <span style={{ color: "var(--mut)" }}>({cat.pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Bar Chart / Distribution Histogram: Recall Similarity Scores
 * Visualizes cosine similarity score distribution (RAG retrieval accuracy)
 */
export function SimilarityHistogramChart() {
  const [hoverBar, setHoverBar] = useState(null);

  const buckets = [
    { range: "0.90 - 1.00", count: 184, pct: 62, label: "High Precision", badge: "EXACT", color: "#10b981", desc: "Direct semantic match, accurate retrieval" },
    { range: "0.80 - 0.89", count: 72, pct: 24, label: "Strong Match", badge: "HIGH", color: "#2563eb", desc: "Highly relevant contextual rules" },
    { range: "0.70 - 0.79", count: 27, pct: 9, label: "Broad Match", badge: "PARTIAL", color: "#e9e23a", desc: "Related architectural pattern" },
    { range: "< 0.70", count: 14, pct: 5, label: "Zero Match / Gap", badge: "GAP", color: "#c93b3b", desc: "Knowledge gap candidates for ingestion" }
  ];

  return (
    <div className="dash-box" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="dash-box-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="dash-badge dash-badge-dark">Cosine Metric</span>
            <span className="dash-badge dash-badge-yellow" style={{ fontSize: "11px" }}>Sample Distribution Model</span>
            <span className="dash-badge dash-badge-green">gemini-embedding-001</span>
          </div>
          <h3 style={{ margin: "6px 0 2px" }}>Vector Recall Similarity Distribution</h3>
          <p className="dash-sub">Quality distribution of pgvector cosine similarity scores across agent queries</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "var(--mut)", textTransform: "uppercase", display: "block" }}>Mean Similarity</span>
          <strong style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "#10b981" }}>0.884</strong>
        </div>
      </div>

      {/* Horizontal Bar Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
        {buckets.map((b, i) => {
          const isHovered = hoverBar === i;
          return (
            <div
              key={b.range}
              onMouseEnter={() => setHoverBar(i)}
              onMouseLeave={() => setHoverBar(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "10px",
                background: isHovered ? "rgba(0,0,0,0.03)" : "transparent",
                transition: "background 0.15s",
                cursor: "default"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>{b.range}</strong>
                  <span style={{ color: "var(--mut)", fontSize: "12px" }}>— {b.label}</span>
                  <span
                    className="dash-badge"
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      background: b.color === "#e9e23a" ? "#e9e23a" : b.color,
                      color: b.color === "#e9e23a" ? "#141414" : "#ffffff"
                    }}
                  >
                    {b.badge}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>
                  <strong>{b.count} queries</strong>
                  <span style={{ color: "var(--mut)", marginLeft: "6px" }}>({b.pct}%)</span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div style={{ width: "100%", height: "10px", background: "#f0f0ed", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${b.pct}%`,
                    height: "100%",
                    background: b.color,
                    borderRadius: "999px",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>

              {isHovered && (
                <div style={{ fontSize: "11.5px", color: "var(--mut)", marginTop: "2px" }}>
                  {b.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 4. Area Chart: Zero-Match Queries (Knowledge Gaps) Trend
 * Tracks unanswered agent queries over the past 7 days
 */
export function KnowledgeGapsAreaChart() {
  const days = ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Yesterday", "Today"];
  const zeroMatches = [8, 12, 9, 15, 11, 7, 4];
  const ingestedFixes = [2, 5, 4, 8, 9, 6, 4];

  const maxVal = 18;
  const width = 580;
  const height = 180;
  const padLeft = 35;
  const padRight = 15;
  const padTop = 20;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx) => padLeft + (idx / (days.length - 1)) * plotW;
  const getY = (val) => padTop + plotH - (val / maxVal) * plotH;

  const points = zeroMatches.map((v, i) => ({ x: getX(i), y: getY(v) }));
  const toPath = pts => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const toArea = pts => `${toPath(pts)} L ${pts[pts.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  return (
    <div className="dash-box" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="dash-box-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="dash-badge dash-badge-red">Knowledge Ingestion Trend</span>
            <span style={{ fontSize: "12px", color: "var(--mut)" }}>Last 7 Days</span>
          </div>
          <h3 style={{ margin: "6px 0 2px" }}>Zero-Match Queries vs Resolutions</h3>
          <p className="dash-sub">Frequency of queries with &lt;0.65 cosine score requiring team memory ingestion</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", color: "var(--mut)", textTransform: "uppercase", display: "block" }}>Deficit Resolved</span>
          <strong style={{ fontSize: "20px", fontFamily: "var(--mono)", color: "#10b981" }}>+68%</strong>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id="gradGaps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c93b3b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#c93b3b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = padTop + plotH * (1 - pct);
            return (
              <line
                key={i}
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e5e5e2"
                strokeDasharray="3,3"
                strokeWidth="1"
              />
            );
          })}

          {/* X axis labels */}
          {days.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#888888"
              fontFamily="var(--mono)"
            >
              {d}
            </text>
          ))}

          {/* Area & line */}
          <path d={toArea(points)} fill="url(#gradGaps)" />
          <path d={toPath(points)} fill="none" stroke="#c93b3b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#ffffff"
              stroke="#c93b3b"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
        <span style={{ color: "#c93b3b", fontWeight: 600 }}>● Unanswered Zero-Match Queries (Down 50%)</span>
        <span style={{ color: "#10b981", fontWeight: 600 }}>● 38 Memories Ingested This Week</span>
      </div>
    </div>
  );
}

