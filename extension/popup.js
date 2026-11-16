const DEFAULT_LOCAL = "http://localhost:3001";
const DEFAULT_DASHBOARD = "http://localhost:5174";

async function getStoredEndpoint() {
  return new Promise((resolve) => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(["extengen_api_url"], (data) => {
        resolve(data?.extengen_api_url || DEFAULT_LOCAL);
      });
    } else {
      resolve(DEFAULT_LOCAL);
    }
  });
}

async function checkBackend(targetUrl) {
  const statusEl = document.getElementById("api-status");
  const tagEl = document.getElementById("endpoint-tag");
  const dashboardBtn = document.getElementById("btn-open-dashboard");

  const isCloud = targetUrl.startsWith("https://") && !targetUrl.includes("localhost");
  if (tagEl) {
    tagEl.innerText = isCloud ? "Cloud" : "Local";
    tagEl.style.color = isCloud ? "#38bdf8" : "#10b981";
  }

  // Update dashboard button link
  if (dashboardBtn) {
    dashboardBtn.href = isCloud ? targetUrl : DEFAULT_DASHBOARD;
  }

  try {
    const healthUrl = `${targetUrl.replace(/\/$/, "")}/health`;
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      statusEl.innerHTML = `<span class="dot online"></span>${isCloud ? "Cloud Live" : "Local Live"} (v${data.version || "2.0"})`;
    } else {
      statusEl.innerHTML = `<span class="dot offline"></span>Server Error (${res.status})`;
    }
  } catch (err) {
    // If custom endpoint failed, check localhost fallback
    if (isCloud) {
      try {
        const localRes = await fetch("http://localhost:3001/health", { signal: AbortSignal.timeout(1500) });
        if (localRes.ok) {
          statusEl.innerHTML = `<span class="dot online"></span>Fallback to Local:3001`;
          return;
        }
      } catch {}
    }
    statusEl.innerHTML = `<span class="dot offline"></span>Offline (${isCloud ? "Check Vercel" : "Start port 3001"})`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const inputEl = document.getElementById("api-url-input");
  const saveBtn = document.getElementById("save-endpoint-btn");

  const currentEndpoint = await getStoredEndpoint();
  if (inputEl) {
    inputEl.value = currentEndpoint;
  }

  await checkBackend(currentEndpoint);

  if (saveBtn && inputEl) {
    saveBtn.addEventListener("click", () => {
      let val = inputEl.value.trim();
      if (!val) val = DEFAULT_LOCAL;
      val = val.replace(/\/$/, "");

      if (chrome?.storage?.local) {
        chrome.storage.local.set({ extengen_api_url: val }, () => {
          saveBtn.innerText = "Saved!";
          setTimeout(() => { saveBtn.innerText = "Save"; }, 1500);
          checkBackend(val);
        });
      } else {
        checkBackend(val);
      }
    });
  }
});
