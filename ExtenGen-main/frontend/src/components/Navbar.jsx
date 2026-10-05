import React, { useState } from "react";

export function Navbar({
  activeView,
  setActiveView,
  onOpenCommandPalette,
  onOpenOnboarding,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const [selectedOrg, setSelectedOrg] = useState("Acme Corp (Prod)");
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const orgs = ["Acme Corp (Prod)", "Staging Org", "Dev Sandbox", "Personal Workspace"];

  return (
    <header className="dash-header">
      <button
        className="dash-hamburger-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      <a href="#top" className="dash-brand" onClick={() => setActiveView("landing")}>
        extengen
      </a>

      {/* View Switcher Pills */}
      <div className="dash-view-toggle">
        <button
          className={`dash-pill ${activeView === "dashboard" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
          onClick={() => setActiveView("dashboard")}
        >
          📊 App Dashboard
        </button>
        <button
          className={`dash-pill ${activeView === "landing" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
          onClick={() => setActiveView("landing")}
        >
          🌐 Landing Page
        </button>
      </div>

      {/* Search Trigger */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <button className="dash-search-bar" onClick={onOpenCommandPalette}>
          <span className="dash-search-ph">Search memories, events or commands...</span>
          <span className="dash-kbd">Ctrl K</span>
        </button>
      </div>

      <div className="dash-header-actions">
        {/* Org Switcher */}
        <div style={{ position: "relative" }}>
          <button
            className="dash-pill dash-pill-white dash-pill-sm"
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          >
            <span>🏢 {selectedOrg}</span>
            <span>▾</span>
          </button>

          {orgDropdownOpen && (
            <div className="dash-modal-card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: "230px", padding: "10px", zIndex: 60 }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, padding: "4px 8px", color: "var(--mut)" }}>Switch Organization</div>
              {orgs.map((org) => (
                <button
                  key={org}
                  className="dash-sidebar-item"
                  style={{ borderRadius: "8px", padding: "8px 10px" }}
                  onClick={() => {
                    setSelectedOrg(org);
                    setOrgDropdownOpen(false);
                  }}
                >
                  <span>{org}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Connect Agent */}
        <button className="dash-pill dash-pill-dark dash-pill-sm" onClick={onOpenOnboarding}>
          ⚡ Connect Agent
        </button>
      </div>
    </header>
  );
}
