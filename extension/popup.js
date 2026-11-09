async function checkBackend() {
  const statusEl = document.getElementById("api-status");
  try {
    const res = await fetch("http://localhost:3001/health");
    if (res.ok) {
      const data = await res.json();
      statusEl.innerHTML = `<span class="dot online"></span>Connected (v${data.version || "1.0"})`;
    } else {
      statusEl.innerHTML = `<span class="dot offline"></span>Server Error (${res.status})`;
    }
  } catch (err) {
    statusEl.innerHTML = `<span class="dot offline"></span>Offline (Start backend)`;
  }
}

document.addEventListener("DOMContentLoaded", checkBackend);

