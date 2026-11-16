# 🧠 ExtenGen

> **High-Performance, Multi-Tenant Shared Memory Layer for AI Coding Agents**  
> *Connecting ephemeral LLM coding sessions into continuous institutional memory via the Model Context Protocol (MCP) and pgvector.*

[![CI](https://github.com/Vinaydhiman985/ExtenGen--Ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Vinaydhiman985/ExtenGen--Ai/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Standard%20v1.6-purple.svg)](https://modelcontextprotocol.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17%20%7C%20pgvector-336791.svg?logo=postgresql)](https://github.com/pgvector/pgvector)
[![Gemini](https://img.shields.io/badge/Gemini-Embeddings%20768d-4285F4.svg?logo=google)](https://aistudio.google.com/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-black.svg?logo=fastify)](https://www.fastify.io/)
[![Tests](https://img.shields.io/badge/Tests-37%20Passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 💡 What is ExtenGen?

Modern AI coding agents (**Claude Code**, **Cursor**, **Windsurf**, **GitHub Copilot**) suffer from **session-level amnesia**—every new terminal or prompt window forgets past architectural decisions, schemas, and bug fixes.

**ExtenGen** provides a cloud-native, multi-tenant **persistent memory bus** implementing Anthropic's **Model Context Protocol (MCP)**:
- **Capture (Write):** Agents persist architectural standards, schemas, and PR context as structured *observations*.
- **Recall (Read):** Agents query this memory using dense vector similarity search (`pgvector` HNSW cosine metric), injecting past decisions directly into context before generating code.
- **Contradiction Detection:** Automatically evaluates proposals against existing memories to prevent conflicting rules using an atomic supersession DAG.

---

## ⚡ Core Features

- **Dual MCP Transports:** Local `stdio` for CLI tools (Claude Code) and `HTTP/SSE` for remote IDEs & web clients.
- **Sub-20ms Vector Retrieval:** PostgreSQL 17 + `pgvector` HNSW index with Google Gemini Matryoshka 768d embeddings.
- **Strict Multi-Tenancy:** PostgreSQL Row-Level Security (RLS) ensures zero cross-organization memory leakage (`org_id` scoped).
- **Temporal Recency Decay:** Ranks memories by combining semantic similarity with age decay ($S = \text{sim} \cdot e^{-\lambda \Delta t}$).
- **Enterprise Dashboard:** React 19 + Vite 8 UI with pure SVG telemetry charts and multi-tenant organization switching.

---

## 🚀 Quickstart

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/Vinaydhiman985/ExtenGen--Ai.git
cd ExtenGen--Ai
npm install

# 2. Configure environment (PostgreSQL / Supabase & Gemini API Key)
cp .env.example .env

# 3. Run database migrations & test suite (32 tests passing)
npm run migrate
npm test

# 4. Start Fastify REST + MCP SSE server
npm run dev

# 5. (Optional) Run interactive collaboration demo
npm run demo
```

---

## 🔌 Connecting to Agents & IDEs

- **Claude Code CLI:**
  ```bash
  claude mcp add extengen npx -y tsx /absolute/path/to/ExtenGen--Ai/src/mcp/stdio.ts
  ```
- **Cursor & Windsurf IDEs:**  
  Use command `npm run --silent mcp:stdio` with repository path as working directory, or connect to the running SSE endpoint: `http://localhost:3000/sse`.

---

## 🔧 MCP Tools & REST API

| MCP Tool | Purpose | Key Arguments |
| :--- | :--- | :--- |
| `store_observation` | Persists architectural decisions and rules. | `content`, `title`, `tags`, `confirm_contradictions` |
| `recall_context` | Semantically retrieves relevant past decisions. | `query`, `limit`, `similarity_threshold`, `recency_weight` |
| `list_observations` | Chronological list of tenant observations. | `limit`, `source` |
| `ingest_github` | Ingests repository commits and PR discussions. | `repo`, `limit` |

**Core REST Endpoints:**  
`GET /health` • `POST /api/v1/observations` • `POST /api/v1/context/recall` • `GET /sse` (MCP SSE Stream)

---

## 🖥️ Management Dashboard

```bash
npm --prefix frontend run dev
```
Open `http://localhost:5173` to access:
- **Pure SVG Telemetry Charts:** API Throughput Line Chart, Memory Type Donut Chart, Vector Recall Similarity Histogram, and Knowledge Gaps Trend.
- **Multi-Tenant Org Switcher:** Live switching across Personal Workspace, Acme Corp (Prod), Stark Org, and Dev Sandbox.
- **Collaboration Proof:** Live demonstration of Agent A saving a decision and Agent B retrieving it.

---

## 👥 Authorship & Credits

- **Vinay Dhiman** ([@Vinaydhiman985](https://github.com/Vinaydhiman985)) — *Core Engine, System Architecture & Telemetry Dashboard*  
  Gemini MRL 768d embeddings, PostgreSQL 17 + pgvector RLS isolation, Contradiction Engine, Temporal Decay, Vitest 32-test harness, Docker/CI, and React 19 enterprise dashboard with SVG telemetry.
- **Neeraj** ([@neeraj-ch7](https://github.com/neeraj-ch7)) — *Initial Concept & Scaffolding*  
  Initial problem research, baseline MCP protocol schema, and early route scaffolds.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.



















