import React from "react";

const Icons = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  simulator: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  activity: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  memories: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  ),
  playground: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  ),
  gaps: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  github: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
  ),
};

export function Sidebar({ activeSection, setActiveSection, pendingCount, gapsCount, mobileOpen, setMobileOpen }) {
  const sections = [
    {
      id: "overview",
      name: "Overview",
      icon: Icons.overview,
      desc: "Telemetry, metrics and feed"
    },
    {
      id: "simulator",
      name: "Multi-Agent Collab",
      icon: Icons.simulator,
      desc: "Cross-agent context sharing",
      dot: "blue",
      dotTitle: "Active Simulator"
    },
    {
      id: "extension",
      name: "Chrome Extension",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="21.17" y1="8" x2="12" y2="8"></line>
          <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
          <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
        </svg>
      ),
      desc: "Universal 6-Agent Mesh",
      dot: "green",
      dotTitle: "Extension Ready"
    },
    {
      id: "activity",
      name: "Activity",
      icon: Icons.activity,
      desc: "Tool calls and replays",
      dot: "green",
      dotTitle: "Live Event Stream"
    },
    {
      id: "memories",
      name: "Memories",
      icon: Icons.memories,
      desc: "Vector store and lifecycle",
      counter: pendingCount > 0 ? pendingCount : null
    },
    {
      id: "playground",
      name: "Recall Playground",
      icon: Icons.playground,
      desc: "Semantic query ranking"
    },
    {
      id: "gaps",
      name: "Knowledge Gaps",
      icon: Icons.gaps,
      desc: "Zero-match query clusters",
      counter: gapsCount > 0 ? gapsCount : null
    },
    {
      id: "github",
      name: "GitHub Sync",
      icon: Icons.github,
      desc: "Repositories and webhooks",
      dot: "green",
      dotTitle: "Sync Engine Connected"
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
              <span className="dash-sidebar-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {sec.icon}
              </span>
              <div className="dash-sidebar-label-box">
                <span className="dash-sidebar-name">{sec.name}</span>
                <span className="dash-sidebar-desc">{sec.desc}</span>
              </div>
              {sec.dot && (
                <span
                  className={`dash-sidebar-dot ${sec.dot}`}
                  title={sec.dotTitle || "Status"}
                />
              )}
              {sec.counter !== null && sec.counter !== undefined && (
                <span className="dash-sidebar-counter">
                  {sec.counter}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div>
        <div className="dash-sidebar-footer-card">
          <div className="dash-sfc-header">
            <span className="dash-sidebar-dot green" />
            <span>Shared Memory Status</span>
          </div>
          <p className="dash-sfc-text">Fastify SSE + pgvector is online and processing embeddings.</p>
          <div className="dash-sfc-stats">
            <span>Latency: <b>18ms</b></span>
            <span>Index: <b>HNSW (768d)</b></span>
          </div>
        </div>
      </div>
    </aside>
  );
}
