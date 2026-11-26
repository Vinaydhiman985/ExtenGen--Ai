import React, { useState, useEffect } from "react";
import {
  checkHealth,
  subscribeApiStatus,
  AVAILABLE_ORGS,
  getActiveOrg,
  setActiveOrg,
  subscribeActiveOrg,
  subscribeToLiveEvents
} from "../services/api.js";

export function Navbar({
  activeView,
  setActiveView,
  onOpenCommandPalette,
  onOpenOnboarding,
  onSelectSection,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const [currentOrg, setCurrentOrg] = useState(getActiveOrg());
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({ isLive: false, checked: false });
  const [activeAgentsCount, setActiveAgentsCount] = useState(0);

  useEffect(() => {
    // Initial health check
    checkHealth();
    // Subscribe to status updates from API calls
    const unsubscribe = subscribeApiStatus((status) => {
      setApiStatus(status);
    });

    const unsubOrg = subscribeActiveOrg((org) => {
      setCurrentOrg(org);
    });

    const checkAgents = async () => {
      try {
        const res = await fetch("/api/v1/agents/active");
        if (res.ok) {
          const d = await res.json();
          setActiveAgentsCount(d.count || 0);
        }
      } catch {
        // Fallback
      }
    };
    checkAgents();

    // Listen to live SSE events instead of tight polling
    const unsubSSE = subscribeToLiveEvents((event) => {
      if (event.type === "agent_connected" || event.type === "agent_disconnected") {
        checkAgents();
      }
    });

    // Refresh on user tab return
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAgents();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Gentle 60s background sync only when active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        checkAgents();
      }
    }, 60000);

    return () => {
      unsubscribe();
      unsubOrg();
      unsubSSE();
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

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
          Dashboard
        </button>
        <button
          className={`dash-pill ${activeView === "landing" ? "dash-pill-dark" : "dash-pill-white"} dash-pill-sm`}
          onClick={() => setActiveView("landing")}
        >
          Home
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
        {/* API Live / Demo Mode Indicator */}
        <button
          className={`dash-status-indicator ${apiStatus.isLive ? "dash-status-live" : "dash-status-demo"}`}
          onClick={() => checkHealth()}
          title={apiStatus.isLive ? "Connected to live Fastify backend. Click to re-check." : "Operating in local demo mode. Click to retry connection."}
          style={{ cursor: "pointer", border: "1.5px solid currentColor" }}
        >
          <span className={`dash-pulse-dot ${apiStatus.isLive ? "live" : "demo"}`} />
          <span>{apiStatus.isLive ? "Live API" : "Demo Mode"}</span>
        </button>

        {/* Org Switcher */}
        <div style={{ position: "relative" }}>
          <button
            className="dash-pill dash-pill-white dash-pill-sm"
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          >
            <span>{currentOrg.name}</span>
            <span style={{ fontSize: "10px", marginLeft: "4px" }}>▾</span>
          </button>

          {orgDropdownOpen && (
            <div className="dash-modal-card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: "260px", padding: "10px", zIndex: 60 }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, padding: "4px 8px", color: "var(--mut)" }}>Switch Organization (Multi-Tenant RLS)</div>
              {AVAILABLE_ORGS.map((org) => (
                <button
                  key={org.id}
                  className={`dash-sidebar-item ${currentOrg.id === org.id ? 'active' : ''}`}
                  style={{ borderRadius: "8px", padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer", background: currentOrg.id === org.id ? "var(--ink)" : "transparent", color: currentOrg.id === org.id ? "#fff" : "var(--ink)" }}
                  onClick={() => {
                    setActiveOrg(org);
                    setOrgDropdownOpen(false);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{org.name}</span>
                  <span style={{ fontSize: "10px", opacity: 0.75, background: currentOrg.id === org.id ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: "6px" }}>{org.badge}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chrome Extension Shortcut */}
        <button
          className="dash-pill dash-pill-white dash-pill-sm"
          onClick={() => (onSelectSection ? onSelectSection("extension") : onOpenOnboarding())}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
          title="Install Chrome Extension & Bridge Setup"
        >
          <img src="/icons/icon-32.png" width="14" height="14" style={{ borderRadius: "3px" }} alt="ExtenGen" />
          <span>Add Extension</span>
        </button>

        {/* Connect Agent */}
        <button className="dash-pill dash-pill-dark dash-pill-sm" onClick={onOpenOnboarding} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Connect Agent</span>
          {activeAgentsCount > 0 && (
            <span style={{ background: "#10b981", color: "#ffffff", padding: "2px 7px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>
              {activeAgentsCount} Online
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
