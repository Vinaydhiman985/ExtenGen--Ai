// ExtenGen Universal Multi-Agent AI Bridge (Manifest V3)
// Supported: ChatGPT, Claude, Gemini, DeepSeek, Copilot, Perplexity

(function () {
  console.log("[ExtenGen] Universal Multi-Agent AI Bridge initialized.");

  const AI_PLATFORMS = {
    chatgpt: {
      id: "chatgpt",
      name: "ChatGPT",
      matcher: (host) => host.includes("chatgpt.com") || host.includes("openai.com"),
      url: "https://chatgpt.com",
      color: "#10b981",
    },
    claude: {
      id: "claude",
      name: "Claude",
      matcher: (host) => host.includes("claude.ai"),
      url: "https://claude.ai/new",
      color: "#d97706",
    },
    gemini: {
      id: "gemini",
      name: "Gemini",
      matcher: (host) => host.includes("gemini.google.com"),
      url: "https://gemini.google.com/app",
      color: "#2563eb",
    },
    deepseek: {
      id: "deepseek",
      name: "DeepSeek",
      matcher: (host) => host.includes("deepseek.com"),
      url: "https://chat.deepseek.com",
      color: "#6366f1",
    },
    copilot: {
      id: "copilot",
      name: "Copilot",
      matcher: (host) => host.includes("copilot.microsoft.com"),
      url: "https://copilot.microsoft.com",
      color: "#0284c7",
    },
    perplexity: {
      id: "perplexity",
      name: "Perplexity",
      matcher: (host) => host.includes("perplexity.ai"),
      url: "https://www.perplexity.ai",
      color: "#06b6d4",
    },
  };

  function getCurrentPlatform() {
    const host = window.location.hostname;
    for (const key of Object.keys(AI_PLATFORMS)) {
      if (AI_PLATFORMS[key].matcher(host)) {
        return AI_PLATFORMS[key];
      }
    }
    return { id: "generic", name: "AI Agent", url: window.location.href, color: "#10b981" };
  }

  const currentPlatform = getCurrentPlatform();

  // Inject styles once
  if (!document.getElementById("extengen-universal-styles")) {
    const style = document.createElement("style");
    style.id = "extengen-universal-styles";
    style.textContent = `
      @keyframes extengen-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .extengen-menu-item:hover {
        background: #1e293b !important;
        color: #ffffff !important;
      }
      #extengen-universal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(0,0,0,0.4) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // PART 1: MESSAGE SCRAPER FOR CURRENT PLATFORM
  // ============================================================
  function extractConversation() {
    let selectors = [];
    if (currentPlatform.id === "chatgpt") {
      selectors = ['[data-message-author-role]', '.text-message', 'article', '.agent-turn', 'div[data-testid^="conversation-turn"]'];
    } else if (currentPlatform.id === "claude") {
      selectors = ['.font-claude-message', '[data-testid="user-message"]', 'div.prose', '[data-is-streaming]'];
    } else if (currentPlatform.id === "gemini") {
      selectors = ['message-content', '.model-response-text', '.user-query'];
    } else if (currentPlatform.id === "deepseek") {
      selectors = ['.ds-markdown', '.fbb737a4', 'div[class*="chat-message"]', 'div[class*="message"]'];
    } else if (currentPlatform.id === "copilot") {
      selectors = ['cib-message-group', '[data-author="bot"]', '[data-author="user"]', 'div[class*="message"]'];
    } else if (currentPlatform.id === "perplexity") {
      selectors = ['div[class*="prose"]', 'div[class*="answer"]', 'div[class*="query"]'];
    } else {
      selectors = ['article', 'div[class*="message"]', 'div[class*="turn"]'];
    }

    const elements = document.querySelectorAll(selectors.join(", "));
    const messages = [];

    elements.forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length > 5) {
        messages.push(text);
      }
    });

    if (messages.length > 0) {
      return messages.slice(-5).join("\n\n---\n\n");
    }

    const mainEl = document.querySelector("main") || document.body;
    return mainEl.innerText.slice(-2500) || `Active session conversation from ${currentPlatform.name}.`;
  }

  // ============================================================
  // PART 2: CONTEXT INJECTOR (When arriving at target platform)
  // ============================================================
  function showToast(message) {
    if (document.getElementById("extengen-toast-banner")) return;

    const banner = document.createElement("div");
    banner.id = "extengen-toast-banner";
    banner.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#94a3b8;font-weight:700;">ExtenGen Shared Memory</div>
            <div style="font-size:13px;color:#f8fafc;font-weight:500;">${message}</div>
          </div>
        </div>
        <button id="extengen-toast-close" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px;display:flex;align-items:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;

    Object.assign(banner.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "9999999",
      background: "#0f172a",
      border: "1px solid rgba(16,185,129,0.3)",
      borderRadius: "14px",
      padding: "10px 18px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      maxWidth: "92vw",
      minWidth: "360px",
    });

    document.body.appendChild(banner);
    document.getElementById("extengen-toast-close")?.addEventListener("click", () => banner.remove());
    setTimeout(() => banner.remove(), 7000);
  }

  function findInputField() {
    const candidates = [
      '#prompt-textarea',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"].ProseMirror',
      'div.ProseMirror',
      'textarea#chat-input',
      'textarea#userInput',
      'textarea[placeholder*="Ask"]',
      'div.ql-editor',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea',
    ];

    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        return el;
      }
    }
    return null;
  }

  function checkAndInjectIncomingContext() {
    if (!chrome?.storage?.local) return;

    chrome.storage.local.get(["extengen_pending_handoff"], (data) => {
      const handoff = data?.extengen_pending_handoff;
      if (!handoff || !handoff.content) return;

      // Only inject if target matches current platform or is generic
      const targetId = handoff.toAgentId?.toLowerCase();
      if (targetId && targetId !== currentPlatform.id) {
        return;
      }

      // Check if not expired (within 10 minutes)
      if (Date.now() - handoff.timestamp > 10 * 60 * 1000) {
        chrome.storage.local.remove(["extengen_pending_handoff"]);
        return;
      }

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const inputField = findInputField();

        if (inputField) {
          clearInterval(interval);

          const injectedText = `[ExtenGen Shared Memory — Session Handoff from ${handoff.fromAgent || "Previous Agent"}]:
${handoff.content.slice(0, 2000)}

Please acknowledge this past context and proceed with the task:`;

          if (inputField.tagName.toLowerCase() === "textarea" || inputField.tagName.toLowerCase() === "input") {
            inputField.value = injectedText;
            inputField.dispatchEvent(new Event("input", { bubbles: true }));
          } else {
            inputField.focus();
            inputField.innerText = injectedText;
            inputField.dispatchEvent(new InputEvent("input", { bubbles: true }));
          }

          showToast(`Context from ${handoff.fromAgent} injected into ${currentPlatform.name}.`);
          chrome.storage.local.remove(["extengen_pending_handoff"]);
        }

        if (attempts > 30) {
          clearInterval(interval);
        }
      }, 500);
    });
  }

  // ============================================================
  // PART 3: UNIVERSAL FLOATING ACTION PILL & TARGET SELECTOR
  // ============================================================
  function injectUniversalPill() {
    if (document.getElementById("extengen-universal-container")) return;

    const container = document.createElement("div");
    container.id = "extengen-universal-container";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "999999",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    // Dropdown menu of other 5 targets
    const otherPlatforms = Object.values(AI_PLATFORMS).filter((p) => p.id !== currentPlatform.id);

    const menu = document.createElement("div");
    menu.id = "extengen-universal-menu";
    Object.assign(menu.style, {
      display: "none",
      position: "absolute",
      bottom: "48px",
      right: "0",
      background: "#0f172a",
      border: "1px solid rgba(16, 185, 129, 0.35)",
      borderRadius: "14px",
      padding: "8px",
      boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
      width: "210px",
      flexDirection: "column",
      gap: "4px",
    });

    const menuHeader = document.createElement("div");
    menuHeader.style.padding = "6px 10px 4px";
    menuHeader.style.fontSize = "11px";
    menuHeader.style.textTransform = "uppercase";
    menuHeader.style.letterSpacing = "0.04em";
    menuHeader.style.color = "#94a3b8";
    menuHeader.style.fontWeight = "700";
    menuHeader.innerText = "Handoff Context to:";
    menu.appendChild(menuHeader);

    otherPlatforms.forEach((target) => {
      const item = document.createElement("button");
      item.className = "extengen-menu-item";
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.justifyContent = "space-between";
      item.style.width = "100%";
      item.style.padding = "8px 10px";
      item.style.background = "transparent";
      item.style.border = "none";
      item.style.borderRadius = "8px";
      item.style.color = "#e2e8f0";
      item.style.fontSize = "13px";
      item.style.cursor = "pointer";
      item.style.textAlign = "left";
      item.style.transition = "background 0.15s ease, color 0.15s ease";

      item.innerHTML = `
        <span style="display:flex;align-items:center;gap:8px;">
          <span style="width:7px;height:7px;border-radius:50%;background:${target.color};"></span>
          <span>${target.name}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      `;

      item.onclick = async (e) => {
        e.stopPropagation();
        menu.style.display = "none";
        await executeHandoff(target);
      };

      menu.appendChild(item);
    });

    // Main Floating Action Button
    const btn = document.createElement("button");
    btn.id = "extengen-universal-btn";
    Object.assign(btn.style, {
      background: "#0f172a",
      color: "#ffffff",
      border: "1px solid rgba(16, 185, 129, 0.4)",
      borderRadius: "999px",
      padding: "9px 16px",
      fontSize: "13px",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
      backdropFilter: "blur(8px)",
    });

    btn.innerHTML = `
      <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.8);flex-shrink:0;"></span>
      <span style="font-weight:600;letter-spacing:-0.01em;">ExtenGen</span>
      <span style="opacity:0.35;">|</span>
      <span style="display:flex;align-items:center;gap:6px;">
        <span>Handoff</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    `;

    btn.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    };

    document.addEventListener("click", () => {
      menu.style.display = "none";
    });

    container.appendChild(menu);
    container.appendChild(btn);
    document.body.appendChild(container);

    async function executeHandoff(target) {
      btn.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:8px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:extengen-spin 0.8s linear infinite;">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span>Syncing to ${target.name}...</span>
        </span>
      `;

      try {
        const textContext = extractConversation();

        // 1. Post to ExtenGen Fastify backend on port 3001
        const response = await fetch("http://localhost:3001/api/v1/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromAgent: currentPlatform.name,
            toAgent: target.name,
            title: `${currentPlatform.name} Session Handoff`,
            content: textContext,
            url: window.location.href,
          }),
        });

        const data = await response.json();

        // 2. Save in Chrome storage
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({
            extengen_pending_handoff: {
              fromAgent: currentPlatform.name,
              toAgent: target.name,
              toAgentId: target.id,
              content: textContext,
              handoffPrompt: data.handoffPrompt || textContext,
              timestamp: Date.now(),
            },
          });
        }

        btn.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Saved · Opening ${target.name}</span>
          </span>
        `;
        btn.style.background = "#065f46";

        setTimeout(() => {
          window.open(target.url, "_blank");
          btn.style.background = "#0f172a";
          btn.innerHTML = `
            <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.8);flex-shrink:0;"></span>
            <span style="font-weight:600;">ExtenGen</span>
            <span style="opacity:0.35;">|</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <span>Handoff</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          `;
        }, 1100);
      } catch (err) {
        console.error("[ExtenGen] Universal Handoff Error:", err);
        btn.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:8px;color:#fca5a5;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Server Offline (Port 3001)</span>
          </span>
        `;
        btn.style.background = "#7f1d1d";

        setTimeout(() => {
          btn.style.background = "#0f172a";
          btn.innerHTML = `
            <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.8);flex-shrink:0;"></span>
            <span style="font-weight:600;">ExtenGen</span>
            <span style="opacity:0.35;">|</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <span>Handoff</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          `;
        }, 3500);
      }
    }
  }

  // Run initialization
  window.addEventListener("load", checkAndInjectIncomingContext);
  setTimeout(checkAndInjectIncomingContext, 2000);
  setInterval(injectUniversalPill, 1500);
})();

