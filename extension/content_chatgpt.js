// ExtenGen ChatGPT Content Script — Context Extractor & One-Click Handoff

(function () {
  console.log("🧠 ExtenGen ChatGPT Agent Bridge loaded.");

  function extractChatGPTConversation() {
    // Attempt standard ChatGPT message container selectors
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
      // Return last 4-6 relevant turns
      return messages.slice(-4).join("\n\n---\n\n");
    }

    // Fallback: grab main body text
    const mainEl = document.querySelector("main");
    if (mainEl) {
      return mainEl.innerText.slice(-2500);
    }

    return "Active session discussion from ChatGPT.";
  }

  function injectHandoffButton() {
    if (document.getElementById("extengen-handoff-btn")) return;

    const btn = document.createElement("button");
    btn.id = "extengen-handoff-btn";
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:6px;">
        <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;"></span>
        <strong>ExtenGen:</strong> Handoff to Gemini
      </span>
    `;

    // Styling: Sleek, developer-grade floating button
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "999999",
      background: "#141414",
      color: "#ffffff",
      border: "1.5px solid #10b981",
      borderRadius: "999px",
      padding: "10px 18px",
      fontSize: "13px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      transition: "transform 0.15s, background 0.15s",
    });

    btn.onmouseover = () => (btn.style.transform = "translateY(-2px)");
    btn.onmouseout = () => (btn.style.transform = "translateY(0)");

    btn.onclick = async () => {
      btn.innerText = "⏳ Syncing to ExtenGen...";
      btn.style.opacity = "0.7";

      try {
        const conversationContext = extractChatGPTConversation();

        // 1. Send to ExtenGen Fastify Backend (creates 768d vector in Supabase)
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

        // 2. Save in Chrome storage for the Gemini content script to pick up
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({
            extengen_pending_handoff: {
              content: conversationContext,
              handoffPrompt: data.handoffPrompt || conversationContext,
              timestamp: Date.now(),
            },
          });
        }

        btn.innerHTML = "✅ Context Saved! Opening Gemini...";
        btn.style.background = "#10b981";
        btn.style.color = "#ffffff";

        // 3. Open Gemini in a new tab
        setTimeout(() => {
          window.open("https://gemini.google.com/app", "_blank");
          btn.innerHTML = `
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#10b981;"></span>
              <strong>ExtenGen:</strong> Handoff to Gemini
            </span>
          `;
          btn.style.background = "#141414";
          btn.style.opacity = "1";
        }, 1200);
      } catch (err) {
        console.error("ExtenGen Handoff Error:", err);
        btn.innerHTML = "⚠️ ExtenGen Server Offline (Start npm run dev)";
        btn.style.background = "#c93b3b";
        setTimeout(() => {
          btn.innerHTML = "ExtenGen: Handoff to Gemini";
          btn.style.background = "#141414";
          btn.style.opacity = "1";
        }, 3500);
      }
    };

    document.body.appendChild(btn);
  }

  // Periodic check to inject button when page loads or URL changes
  setInterval(injectHandoffButton, 1500);
})();
