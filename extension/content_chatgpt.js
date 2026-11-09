// ExtenGen ChatGPT Content Script — Context Extractor & One-Click Handoff

(function () {
  console.log("[ExtenGen] ChatGPT Agent Bridge initialized.");

  // Inject spinner animation keyframes once
  if (!document.getElementById("extengen-styles")) {
    const style = document.createElement("style");
    style.id = "extengen-styles";
    style.textContent = `
      @keyframes extengen-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      #extengen-handoff-btn:hover {
        background: #1f2937 !important;
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35) !important;
      }
      #extengen-handoff-btn:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  const icons = {
    handoff: `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <path d="M16 3h5v5"/>
        <path d="m21 3-7 7"/>
        <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>
      </svg>
    `,
    spinner: `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;animation:extengen-spin 0.8s linear infinite;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    `,
    check: `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `,
    alert: `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `,
  };

  function extractChatGPTConversation() {
    const messageElements = document.querySelectorAll(
      '[data-message-author-role], .text-message, article, .agent-turn'
    );

    const messages = [];
    messageElements.forEach((el) => {
      const text = el.innerText?.trim();
      if (text && text.length > 5) {
        messages.push(text);
      }
    });

    if (messages.length > 0) {
      return messages.slice(-4).join("\n\n---\n\n");
    }

    const mainEl = document.querySelector("main");
    if (mainEl) {
      return mainEl.innerText.slice(-2500);
    }

    return "Active session discussion from ChatGPT.";
  }

  function renderDefaultButton(btn) {
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.8);flex-shrink:0;"></span>
        <span style="letter-spacing:-0.01em;font-weight:600;">ExtenGen</span>
        <span style="opacity:0.4;">|</span>
        ${icons.handoff}
        <span style="letter-spacing:-0.01em;">Handoff to Gemini</span>
      </span>
    `;
    btn.style.background = "#0f172a";
    btn.style.color = "#ffffff";
    btn.style.border = "1px solid rgba(16, 185, 129, 0.4)";
    btn.style.opacity = "1";
    btn.disabled = false;
  }

  function injectHandoffButton() {
    if (document.getElementById("extengen-handoff-btn")) return;

    const btn = document.createElement("button");
    btn.id = "extengen-handoff-btn";

    Object.assign(btn.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "999999",
      padding: "10px 18px",
      borderRadius: "999px",
      fontSize: "13px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
      transition: "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
      backdropFilter: "blur(8px)",
      userSelect: "none",
    });

    renderDefaultButton(btn);

    btn.onclick = async () => {
      btn.disabled = true;
      btn.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:8px;">
          ${icons.spinner}
          <span>Syncing Context to Vector Store...</span>
        </span>
      `;
      btn.style.opacity = "0.85";

      try {
        const conversationContext = extractChatGPTConversation();

        const response = await fetch("http://localhost:3001/api/v1/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromAgent: "ChatGPT",
            toAgent: "Gemini",
            title: "ChatGPT Active Session Handoff",
            content: conversationContext,
            url: window.location.href,
          }),
        });

        const data = await response.json();

        if (chrome?.storage?.local) {
          await chrome.storage.local.set({
            extengen_pending_handoff: {
              content: conversationContext,
              handoffPrompt: data.handoffPrompt || conversationContext,
              timestamp: Date.now(),
            },
          });
        }

        btn.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:8px;">
            ${icons.check}
            <span>Context Linked · Launching Gemini</span>
          </span>
        `;
        btn.style.background = "#065f46";
        btn.style.borderColor = "#10b981";

        setTimeout(() => {
          window.open("https://gemini.google.com/app", "_blank");
          renderDefaultButton(btn);
        }, 1100);
      } catch (err) {
        console.error("[ExtenGen] Handoff Error:", err);
        btn.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:8px;">
            ${icons.alert}
            <span>Server Offline · Check Port 3001</span>
          </span>
        `;
        btn.style.background = "#7f1d1d";
        btn.style.borderColor = "#ef4444";

        setTimeout(() => {
          renderDefaultButton(btn);
        }, 3500);
      }
    };

    document.body.appendChild(btn);
  }

  setInterval(injectHandoffButton, 1500);
})();
