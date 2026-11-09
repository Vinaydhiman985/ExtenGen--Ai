// ExtenGen Gemini Content Script — Context Receiver & Prompt Injector

(function () {
  console.log("[ExtenGen] Gemini Agent Bridge initialized.");

  function showNotification(message) {
    if (document.getElementById("extengen-gemini-banner")) return;

    const banner = document.createElement("div");
    banner.id = "extengen-gemini-banner";
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
        <button id="extengen-close-btn" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px;display:flex;align-items:center;border-radius:4px;transition:color 0.15s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">
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
    document.getElementById("extengen-close-btn")?.addEventListener("click", () => banner.remove());
    setTimeout(() => banner.remove(), 7000);
  }

  async function checkAndInjectHandoff() {
    if (!chrome?.storage?.local) return;

    chrome.storage.local.get(["extengen_pending_handoff"], (data) => {
      const handoff = data?.extengen_pending_handoff;
      if (!handoff || !handoff.content) return;

      // Check if not expired (within 10 minutes)
      if (Date.now() - handoff.timestamp > 10 * 60 * 1000) {
        chrome.storage.local.remove(["extengen_pending_handoff"]);
        return;
      }

      // Try finding Gemini's prompt input container
      const interval = setInterval(() => {
        const inputField =
          document.querySelector('rich-textarea div[contenteditable="true"]') ||
          document.querySelector('div.ql-editor') ||
          document.querySelector('textarea');

        if (inputField) {
          clearInterval(interval);

          const injectedText = `[ExtenGen Shared Memory — Session Handoff from ChatGPT]:
${handoff.content.slice(0, 1800)}

Please acknowledge this past context and proceed with the task:`;

          if (inputField.tagName.toLowerCase() === "textarea") {
            inputField.value = injectedText;
            inputField.dispatchEvent(new Event("input", { bubbles: true }));
          } else {
            inputField.focus();
            inputField.innerText = injectedText;
            inputField.dispatchEvent(new InputEvent("input", { bubbles: true }));
          }

          showNotification("ChatGPT context successfully injected into Gemini input.");

          // Clean up pending handoff
          chrome.storage.local.remove(["extengen_pending_handoff"]);
        }
      }, 500);

      // Stop polling after 15 seconds
      setTimeout(() => clearInterval(interval), 15000);
    });
  }

  window.addEventListener("load", checkAndInjectHandoff);
  setTimeout(checkAndInjectHandoff, 2000);
})();
