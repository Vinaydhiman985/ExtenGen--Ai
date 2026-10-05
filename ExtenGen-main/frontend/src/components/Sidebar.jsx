import React from "react";

export function Sidebar({ activeSection, setActiveSection, pendingCount, gapsCount, mobileOpen, setMobileOpen }) {
  const sections = [
    {
      id: "overview",
      name: "Overview",
      icon: "📊",
      desc: "KPIs, stats & live feed",
      badge: null
    },
    {
      id: "activity",
      name: "Activity",
      icon: "⚡",
      desc: "Live calls & session replays",
      badge: "LIVE",
      badgeColor: "green"
    },
    {
      id: "memories",
      name: "Memories",
      icon: "🧠",
      desc: "Table, review & lifecycle",
      badge: pendingCount > 0 ? `${pendingCount} review` : null,
      badgeColor: "yellow"
    },
    {
      id: "playground",
      name: "Recall Playground",
      icon: "🎯",
      desc: "Test queries & explainability",
      badge: null
    },
    {
      id: "gaps",
      name: "Knowledge Gaps",
      icon: "❓",
      desc: "Zero-result query clusters",
      badge: gapsCount > 0 ? `${gapsCount} gaps` : null,
      badgeColor: "red"
    },
    {
      id: "github",
      name: "GitHub Sync",
      icon: "🐙",
      desc: "Repo ingest & webhook triggers",
      badge: "SYNC",
      badgeColor: "dark"
    }
  ];

  const handleSelect = (id) => {
    setActiveSection(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <aside className={`dash-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="dash-sidebar-title">Core Navigation</div>

      <nav className="dash-sidebar-menu">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              className={`dash-sidebar-item ${isActive ? "active" : ""}`}
              onClick={() => handleSelect(sec.id)}
            >
              <span className="dash-sidebar-icon">{sec.icon}</span>
              <div className="dash-sidebar-label-box">
                <span className="dash-sidebar-name">{sec.name}</span>
                <span className="dash-sidebar-desc">{sec.desc}</span>
              </div>
              {sec.badge && (
                <span className={`dash-badge dash-badge-${sec.badgeColor || "dark"}`}>
                  {sec.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div>
        <div className="dash-sidebar-footer-card">
          <div className="dash-sfc-header">
            <span>🚀 Shared Memory Status</span>
          </div>
          <p className="dash-sfc-text">Fastify SSE + pgvector is online and processing real-time embeddings.</p>
          <div className="dash-sfc-stats">
            <span>Latency: <b>18ms</b></span>
            <span>Index: <b>HNSW (1536d)</b></span>
          </div>
        </div>
      </div>
    </aside>
  );
}
