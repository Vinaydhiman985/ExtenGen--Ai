// ExtenGen Gemini Content Script — Context Receiver & Prompt Injector

(function () {
  console.log("🧠 ExtenGen Gemini Agent Bridge loaded.");

  function showNotification(message) {
    const banner = document.createElement("div");
    banner.id = "extengen-gemini-banner";
    banner.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:50%;background:#10b981;"></span>
          <strong>ExtenGen Agent Bridge:</strong> ${message}
        </div>
        <button id="extengen-close-btn" style="background:transparent;border:none;color:#fff;cursor:pointer;font-size:16px;">✕</button>
      </div>
    `;

    Object.assign(banner.style, {
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "9999999",
      background: "#141414",
      color: "#ffffff",
      border: "1.5px solid #10b981",
      borderRadius: "12px",
      padding: "12px 20px",
      fontSize: "14px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
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

      // Try finding Gemini's input field
      const interval = setInterval(() => {
        const inputField =
          document.querySelector('rich-textarea div[contenteditable="true"]') ||
          document.querySelector('div.ql-editor') ||
          document.querySelector('textarea');

        if (inputField) {
          clearInterval(interval);

          const injectedText = `[ExtenGen Shared Memory — Bridged from ChatGPT]:
"${handoff.content.slice(0, 1500)}"

Please acknowledge this past context and continue helping me with this task:`;

          if (inputField.tagName.toLowerCase() === "textarea") {
            inputField.value = injectedText;
            inputField.dispatchEvent(new Event("input", { bubbles: true }));
          } else {
            inputField.focus();
            inputField.innerText = injectedText;
            inputField.dispatchEvent(new InputEvent("input", { bubbles: true }));
          }

          showNotification("ChatGPT session seamlessly bridged into Gemini!");

          // Clear handoff so it won't repeat
          chrome.storage.local.remove(["extengen_pending_handoff"]);
        }
      }, 500);

      // Stop trying after 15 seconds
      setTimeout(() => clearInterval(interval), 15000);
    });
  }

  window.addEventListener("load", checkAndInjectHandoff);
  setTimeout(checkAndInjectHandoff, 2000);
})();

