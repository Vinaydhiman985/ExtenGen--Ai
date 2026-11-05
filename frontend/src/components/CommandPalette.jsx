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
    { id: "overview", label: "Go to Overview Dashboard", icon: "📊", category: "Navigation" },
    { id: "activity", label: "View Recent Live Activity & Replays", icon: "⚡", category: "Navigation" },
    { id: "memories", label: "Manage Memories & Review Queue", icon: "🧠", category: "Navigation" },
    { id: "playground", label: "Open Recall Playground & Test Prompts", icon: "🎯", category: "Navigation" },
    { id: "gaps", label: "Inspect Unanswered Knowledge Gaps", icon: "❓", category: "Navigation" },
    { id: "review_pending", label: "Review 3 Pending Proposed Memories", icon: "⏳", category: "Actions" },
    { id: "create_memory", label: "Create New Memory Entry", icon: "➕", category: "Actions" },
    { id: "connect_agent", label: "Connect New Agent (Claude / Cursor)", icon: "🔌", category: "Setup" },
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
          <span style={{ fontSize: "20px" }}>🔍</span>
          <input
            type="text"
            className="dash-cp-input"
            placeholder="Type a command or search memories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="dash-kbd">ESC to close</span>
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
                <span style={{ fontSize: "20px" }}>{item.icon}</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 700, fontSize: "15px" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>{item.category}</span>
                </div>
                <span style={{ fontWeight: 700 }}>↵</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
