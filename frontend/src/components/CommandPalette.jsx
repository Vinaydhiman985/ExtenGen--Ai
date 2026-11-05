import React, { useState, useEffect } from "react";

export function CommandPalette({ isOpen, onClose, onSelectSection }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: "overview", label: "Go to Overview Dashboard", tag: "VIEW", category: "Navigation" },
    { id: "activity", label: "View Recent Live Activity & Replays", tag: "FEED", category: "Navigation" },
    { id: "memories", label: "Manage Memories & Review Queue", tag: "STORE", category: "Navigation" },
    { id: "playground", label: "Open Recall Playground & Test Prompts", tag: "TEST", category: "Navigation" },
    { id: "gaps", label: "Inspect Unanswered Knowledge Gaps", tag: "AUDIT", category: "Navigation" },
    { id: "review_pending", label: "Review Pending Proposed Memories", tag: "QUEUE", category: "Actions" },
    { id: "create_memory", label: "Create New Memory Entry", tag: "NEW", category: "Actions" },
    { id: "connect_agent", label: "Connect New Agent (Claude / Cursor)", tag: "SETUP", category: "Setup" },
  ];

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="dash-modal-backdrop" onClick={() => onClose(false)}>
      <div className="dash-cp-card" onClick={(e) => e.stopPropagation()}>
        <div className="dash-cp-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="dash-cp-input"
            placeholder="Type a command or search memories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="dash-kbd">ESC</span>
        </div>
        <div className="dash-cp-results">
          {filtered.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#666" }}>No results found for "{query}"</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                className="dash-cp-item"
                onClick={() => {
                  if (item.id === "connect_agent") {
                    onSelectSection("onboarding");
                  } else if (item.id === "review_pending") {
                    onSelectSection("memories", "Proposed");
                  } else if (["overview", "activity", "memories", "playground", "gaps"].includes(item.id)) {
                    onSelectSection(item.id);
                  } else {
                    onSelectSection("memories");
                  }
                  onClose(false);
                }}
              >
                <span className="dash-badge dash-badge-dark" style={{ fontSize: "11px", fontWeight: 700, minWidth: "46px", textAlign: "center" }}>
                  {item.tag}
                </span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>{item.category}</span>
                </div>
                <span style={{ fontWeight: 600, fontSize: "12px", opacity: 0.5 }}>Enter</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
