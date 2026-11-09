# ExtenGen — Universal Multi-Agent Browser Extension (Manifest V3)

Connects **ChatGPT**, **Claude**, **Google Gemini**, **DeepSeek**, **Microsoft Copilot**, and **Perplexity AI** into a single shared institutional memory stream powered by **ExtenGen MCP** and **Supabase PostgreSQL (pgvector)**.

---

## Quick Setup (15 Seconds)

1. Open your browser (**Google Chrome**, **Brave**, or **Microsoft Edge**).
2. In the address bar, go to:
   ```text
   chrome://extensions
   ```
   *(For Edge: `edge://extensions`, for Brave: `brave://extensions`)*
3. Enable **"Developer mode"** (toggle in the top-right corner).
4. If already loaded: Click the **circular reload icon** on the ExtenGen card.
   If not yet loaded: Click **"Load unpacked"** and select:
   ```text
   C:\ExtenGen-Ai\extension
   ```
5. **IMPORTANT:** After reloading the extension, press **F5 (Reload Page)** on any open AI tabs (`chatgpt.com`, `claude.ai`, `deepseek.com`, etc.) so the updated script takes effect.

---

## How to Use: Universal Any-to-Any Context Handoff

1. **Ensure the ExtenGen backend is active:**
   ```bash
   npm run dev
   # (Runs Fastify backend on port 3001)
   ```

2. **Open ANY supported AI website:**
   - [ChatGPT](https://chatgpt.com)
   - [Anthropic Claude](https://claude.ai)
   - [Google Gemini](https://gemini.google.com/app)
   - [DeepSeek Chat](https://chat.deepseek.com)
   - [Microsoft Copilot](https://copilot.microsoft.com)
   - [Perplexity AI](https://www.perplexity.ai)

3. **Look at the bottom-right corner of your screen:**
   You will see the floating pill widget:
   ```text
   [ ExtenGen | Handoff to: (Dropdown Select) | Hand Off ]
   ```

4. **Choose any target AI from the dropdown:**
   - Select **Claude**, **DeepSeek**, **Gemini**, **Copilot**, **ChatGPT**, or **Perplexity**.
   - Click **"Hand Off"**.

5. **Watch the destination AI continue your work:**
   - ExtenGen embeds the conversation context via Google Gemini 768d embeddings into Supabase pgvector.
   - Automatically opens your chosen target AI in a new tab.
   - Automatically pre-fills and injects the context directly into the target AI's prompt box with zero context loss.
