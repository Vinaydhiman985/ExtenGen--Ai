# 🧠 ExtenGen — ChatGPT ↔ Gemini Chrome Extension

Connects **ChatGPT** and **Google Gemini** into a single shared institutional memory stream powered by **ExtenGen MCP** and **Supabase PostgreSQL (pgvector)**.

---

## 🚀 Quick Setup (15 Seconds)

1. Open your browser (**Google Chrome**, **Brave**, or **Microsoft Edge**).
2. In the address bar, go to:
   ```text
   chrome://extensions
   ```
   *(For Edge: `edge://extensions`, for Brave: `brave://extensions`)*
3. Enable **"Developer mode"** (toggle in the top-right corner).
4. Click **"Load unpacked"** (top-left button).
5. Select this folder:
   ```text
   C:\ExtenGen-Ai\extension
   ```
6. **Done!** The ExtenGen Agent Bridge icon is now installed in your browser.

---

## ⚡ How to Use: Real-Life ChatGPT to Gemini Handoff

1. **Make sure ExtenGen backend is running:**
   ```bash
   npm run dev
   # (Starts Fastify backend on port 3001)
   ```

2. **Open ChatGPT:**
   - Go to [https://chatgpt.com](https://chatgpt.com).
   - Talk to ChatGPT about any project, architecture, code, or decision.
   - Look at the bottom-right corner of your screen:
     You will see a floating green button:
     👉 **`[ ⚡ ExtenGen: Handoff to Gemini ]`**

3. **Click the button (Single Click):**
   - ExtenGen automatically scrapes the key decisions and active context from your ChatGPT conversation.
   - Embeds it into a 768-dimensional vector and saves it into **Supabase PostgreSQL**.
   - Automatically opens **Google Gemini** (`https://gemini.google.com/app`) in a new tab!

4. **Watch Gemini Continue Your Work:**
   - When Gemini loads, ExtenGen automatically injects the exact context and memory from your ChatGPT session into Gemini's input box!
   - Gemini continues the conversation with full context, zero session loss, and zero token waste!
