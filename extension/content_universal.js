// ExtenGen Universal Multi-Agent AI Bridge (Manifest V3)
// Universal 6-Engine Mesh: ChatGPT, Claude, Gemini, DeepSeek, Copilot, Perplexity

(function () {
  // Only execute in top-level window, not in sandboxed iframes (e.g. runner.html)
  if (window.top !== window.self) {
    return;
  }

  console.log("[ExtenGen] Universal Multi-Agent AI Bridge active.");

  const AI_PLATFORMS = {
    chatgpt: {
      id: "chatgpt",
      name: "ChatGPT",
      label: "ChatGPT (OpenAI)",
      matcher: (host) => host.includes("chatgpt.com") || host.includes("openai.com"),
      url: "https://chatgpt.com",
      color: "#10b981",
    },
    claude: {
      id: "claude",
      name: "Claude",
      label: "Claude (Anthropic)",
      matcher: (host) => host.includes("claude.ai"),
      url: "https://claude.ai/new",
      color: "#d97706",
    },
    gemini: {
      id: "gemini",
      name: "Gemini",
      label: "Google Gemini",
      matcher: (host) => host.includes("gemini.google.com"),
      url: "https://gemini.google.com/app",
      color: "#2563eb",
    },
    deepseek: {
      id: "deepseek",
      name: "DeepSeek",
      label: "DeepSeek Chat",
      matcher: (host) => host.includes("deepseek.com"),
      url: "https://chat.deepseek.com",
      color: "#6366f1",
    },
    copilot: {
      id: "copilot",
      name: "Copilot",
      label: "Microsoft Copilot",
      matcher: (host) => host.includes("copilot.microsoft.com"),
      url: "https://copilot.microsoft.com",
      color: "#0284c7",
    },
    perplexity: {
      id: "perplexity",
      name: "Perplexity",
      label: "Perplexity AI",
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
    return { id: "generic", name: "AI Agent", label: "AI Agent", url: window.location.href, color: "#10b981" };
  }

  const currentPlatform = getCurrentPlatform();

  // Clean up any legacy single-target buttons from older scripts
  function removeLegacyElements() {
    const legacyIds = [
      "extengen-handoff-btn",
      "extengen-handoff-container",
      "extengen-chatgpt-handoff-pill",
      "extengen-gemini-handoff-pill",
    ];
    legacyIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }
  removeLegacyElements();

  // Inject CSS animations & styling
  if (!document.getElementById("extengen-universal-styles")) {
    const style = document.createElement("style");
    style.id = "extengen-universal-styles";
    style.textContent = `
      @keyframes extengen-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      #extengen-universal-container * {
        box-sizing: border-box;
      }
      #extengen-target-select:focus {
        border-color: #10b981 !important;
        outline: none !important;
      }
      #extengen-handoff-action-btn:hover {
        background: #059669 !important;
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }

  async function getApiBaseUrl() {
    return new Promise((resolve) => {
      if (chrome?.storage?.local) {
        chrome.storage.local.get(["extengen_api_url"], (data) => {
          resolve(data?.extengen_api_url?.replace(/\/$/, "") || "http://localhost:3001");
        });
      } else {
        resolve("http://localhost:3001");
      }
    });
  }

  // ============================================================
  // PART 1: CONVERSATION SCRAPER FOR CURRENT PLATFORM
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
  // PART 2: CONTEXT INJECTOR (When landing on target platform)
  // ============================================================
  function showToast(message) {
    if (document.getElementById("extengen-toast-banner")) return;

    const banner = document.createElement("div");
    banner.id = "extengen-toast-banner";
    banner.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999999;
      background: #09090b;
      border: 1.5px solid #10b981;
      border-radius: 12px;
      padding: 12px 18px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.5);
      color: #fafafa;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: extengen-slide-in 0.3s ease;
      max-width: 420px;
    `;

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
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#a1a1aa;font-weight:700;">ExtenGen Shared Memory</div>
            <div style="font-size:13px;color:#f4f4f5;font-weight:600;">${message}</div>
          </div>
        </div>
        <button id="extengen-toast-close" style="background:transparent;border:none;color:#a1a1aa;cursor:pointer;padding:4px;display:flex;align-items:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    const closeBtn = document.getElementById("extengen-toast-close");
    if (closeBtn) {
      closeBtn.onclick = () => banner.remove();
    }

    setTimeout(() => {
      if (document.body.contains(banner)) {
        banner.remove();
      }
    }, 7000);
  }

  function findInputField() {
    const candidates = [
      '#prompt-textarea',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Type"]',
      'textarea#chat-input',
      'textarea#userInput',
      'div.ProseMirror[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea',
    ];

    for (const selector of candidates) {
      const el = document.querySelector(selector);
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

      const targetId = handoff.toAgentId?.toLowerCase();
      if (targetId && targetId !== currentPlatform.id && currentPlatform.id !== "generic") {
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
  // PART 3: PROMINENT FLOATING WIDGET WITH INLINE TARGET DROPDOWN
  // ============================================================
  function injectUniversalPill() {
    removeLegacyElements();

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

    // List of other 5 platforms excluding current platform
    const otherPlatforms = Object.values(AI_PLATFORMS).filter((p) => p.id !== currentPlatform.id);

    // Default to Gemini or Claude if available
    const defaultTarget = otherPlatforms.find((p) => p.id === "gemini") || otherPlatforms[0];

    const widget = document.createElement("div");
    widget.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: #09090b;
      border: 1.5px solid #27272a;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
      border-radius: 999px;
      padding: 6px 10px 6px 14px;
      backdrop-filter: blur(12px);
      transition: all 0.2s ease;
    `;

    // Logo & Brand
    const brand = document.createElement("div");
    brand.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 8px;
      border-right: 1px solid #27272a;
    `;
    brand.innerHTML = `
      <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.8);flex-shrink:0;"></span>
      <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">ExtenGen</span>
    `;

    // Label
    const label = document.createElement("span");
    label.style.cssText = "font-size:12px;color:#a1a1aa;font-weight:600;white-space:nowrap;";
    label.innerText = "Handoff to:";

    // INLINE SELECT DROPDOWN (Direct choose option!)
    const select = document.createElement("select");
    select.id = "extengen-target-select";
    select.style.cssText = `
      background: #18181b;
      color: #fafafa;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 5px 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: border-color 0.15s ease;
    `;

    otherPlatforms.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.innerText = p.label;
      if (p.id === defaultTarget.id) opt.selected = true;
      select.appendChild(opt);
    });

    // ACTION BUTTON
    const actionBtn = document.createElement("button");
    actionBtn.id = "extengen-handoff-action-btn";
    actionBtn.style.cssText = `
      background: #10b981;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease, transform 0.1s ease;
      white-space: nowrap;
    `;
    actionBtn.innerHTML = `
      <span>Hand Off</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
      </svg>
    `;

    actionBtn.onclick = async () => {
      const selectedId = select.value;
      const target = AI_PLATFORMS[selectedId] || defaultTarget;

      actionBtn.disabled = true;
      actionBtn.style.background = "#27272a";
      actionBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:extengen-spin 0.8s linear infinite;">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>Syncing...</span>
      `;

      try {
        const textContext = extractConversation();
        const apiBase = await getApiBaseUrl();

        // 1. Post to ExtenGen backend (Cloud Vercel URL or local port 3001)
        let response;
        try {
          response = await fetch(`${apiBase}/api/v1/handoff`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromAgent: currentPlatform.name,
              toAgent: target.name,
              title: `${currentPlatform.name} Session Handoff`,
              content: textContext,
            }),
          });
        } catch (initialErr) {
          if (apiBase !== "http://localhost:3001") {
            response = await fetch("http://localhost:3001/api/v1/handoff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fromAgent: currentPlatform.name,
                toAgent: target.name,
                title: `${currentPlatform.name} Session Handoff`,
                content: textContext,
              }),
            });
          } else {
            throw initialErr;
          }
        }

        const data = await response.json();
        console.log("[ExtenGen] Handoff saved:", data);

        // 2. Save in Chrome storage
        if (chrome?.storage?.local) {
          chrome.storage.local.set(
            {
              extengen_pending_handoff: {
                fromAgent: currentPlatform.name,
                toAgent: target.name,
                toAgentId: target.id,
                content: textContext,
                timestamp: Date.now(),
              },
            },
            () => {
              window.open(target.url, "_blank");
            }
          );
        } else {
          window.open(target.url, "_blank");
        }

        setTimeout(() => {
          actionBtn.disabled = false;
          actionBtn.style.background = "#10b981";
          actionBtn.innerHTML = `
            <span>Hand Off</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          `;
        }, 3000);
      } catch (err) {
        console.error("[ExtenGen] Handoff error:", err);
        actionBtn.disabled = false;
        actionBtn.style.background = "#ef4444";
        actionBtn.innerText = "Error!";
        setTimeout(() => {
          actionBtn.style.background = "#10b981";
          actionBtn.innerHTML = `
            <span>Hand Off</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          `;
        }, 2500);
      }
    };

    widget.appendChild(brand);
    widget.appendChild(label);
    widget.appendChild(select);
    widget.appendChild(actionBtn);

    container.appendChild(widget);
    document.body.appendChild(container);
  }

  // Periodic checker to ensure pill is present in SPA navigation
  setTimeout(injectUniversalPill, 1200);
  setTimeout(checkAndInjectIncomingContext, 2000);
  setInterval(injectUniversalPill, 1500);
})();
