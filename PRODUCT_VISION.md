# ArchiGram.ai Product Vision

## Executive Summary

ArchiGram.ai is an **AI-powered architecture diagramming tool** that transforms natural language into production-ready Mermaid.js diagrams. Today it serves as an OSS diagramming tool; the vision is to evolve toward an enterprise GenAI pipeline for diagramming while maintaining the core value: **describe your system, get diagrams in seconds**.

**Today**: React UI → Gemini API → Mermaid output. Optional RAG, Supabase community gallery.

**Target**: Enterprise-grade GenAI pipeline with orchestration, semantic cache, RAG, guardrails, and observability—while preserving the Mermaid-native advantage for platform integration.

---

## Key Insight: Mermaid Has Native Platform Support

Since ArchiGram outputs **Mermaid.js code**, users can copy-paste directly into:

| Platform              | Support   | How                                          |
| --------------------- | --------- | -------------------------------------------- |
| **GitHub**            | Native    | ` ```mermaid ` blocks in README, issues, PRs |
| **GitLab**            | Native    | ` ```mermaid ` blocks                        |
| **Notion**            | Native    | /mermaid command or code block               |
| **Obsidian**          | Native    | ` ```mermaid ` blocks                        |
| **Azure DevOps**      | Native    | Wiki markdown                                |
| **Confluence**        | Plugin    | Mermaid for Confluence app                   |
| **Docusaurus/MkDocs** | Native    | Mermaid plugin                               |
| **VS Code**           | Extension | Mermaid preview                              |

**Implication**: No embed widget needed for most use cases. The real value is AI generation + one-click copy formatted for the target platform.

---

## Jobs To Be Done (JTBD)

| Job       | Description                                                 | ArchiGram Advantage                                         | Priority           |
| --------- | ----------------------------------------------------------- | ----------------------------------------------------------- | ------------------ |
| **Job 1** | Document my architecture so teammates understand the system | AI generates from description in seconds; Copy for Platform | HIGH               |
| **Job 2** | Keep diagrams in sync with code changes                     | Not yet; Eraserbot differentiator                           | HIGH (high effort) |
| **Job 3** | Create a diagram without leaving my IDE                     | Deprioritized—Copilot + Mermaid Preview suffice             | LOW                |
| **Job 4** | Share a diagram with someone who doesn't have an account    | Copy for Platform; Mermaid renders natively                 | HIGH               |
| **Job 5** | Use standard architecture notation (C4)                     | C4 templates                                                | MEDIUM             |
| **Job 6** | Generate diagrams programmatically in CI/CD                 | REST API, CLI                                               | MEDIUM             |
| **Job 7** | Reduce AI costs for my team                                 | Semantic cache (Phase 3)                                    | LOW                |
| **Job 8** | Use ArchiGram with company internal docs                    | Optional RAG (Phase 4)                                      | LOW                |

---

## Competitive Landscape

| Competitor        | Strengths                                    | Pricing              | ArchiGram Gap              |
| ----------------- | -------------------------------------------- | -------------------- | -------------------------- |
| **Mermaid Chart** | VS Code extension, AI chat, official Mermaid | Free + $4.90–8.90/mo | No IDE extension           |
| **Eraser.io**     | Eraserbot auto-sync, GitHub/Notion/VS Code   | $0–$45/mo            | No integrations, no sync   |
| **draw.io**       | OSS dominant, custom LLM backends            | Free                 | Not AI-first               |
| **Lucidchart**    | Enterprise collab, ChatGPT plugin            | Enterprise           | No real-time collaboration |
| **IcePanel**      | C4 specialist, MCP server, REST API          | SaaS                 | Now: C4 templates, API     |

**ArchiGram differentiators**: AI-first, Mermaid-native (easy platform integration), OSS, C4 templates, REST API, CLI.

---

## Evolution Phases

| Phase                    | Focus                | Deliverables                                      |
| ------------------------ | -------------------- | ------------------------------------------------- |
| **Phase 1** (Current)    | OSS diagramming      | Copy for Platform, platform guides, C4 templates  |
| **Phase 1.5** (Polish)   | Shareability         | OG images, gallery search/filter                  |
| **Phase 2** (API)        | Programmatic access  | REST API, CLI, GitHub Action, MCP server          |
| **Phase 3** (Cache)      | Cost & speed         | Semantic cache (Redis)                            |
| **Phase 4** (RAG)        | Enterprise context   | Re-ranker, improved RAG, code-to-diagram sync     |
| **Phase 5** (Safety)     | Enterprise readiness | Guardrails, OTEL tracing                          |
| **Phase 6** (Enterprise) | Full stack           | Edge gateway, SSO, real-time collab, embed widget |

---

## Product Tiers

| Tier             | Architecture  | Features                                                            |
| ---------------- | ------------- | ------------------------------------------------------------------- |
| **OSS / Free**   | UI → Gemini   | AI generation, diagramming, export, Copy for Platform, C4 templates |
| **Pro** (future) | + API, cache  | REST API, CLI, semantic cache, higher limits                        |
| **Enterprise**   | Full pipeline | RAG, guardrails, observability, SSO, self-hosted                    |

---

## Current vs Target Architecture

```
Today:  UI → Gemini (optional RAG)
Target: UI → Edge → Orchestrator → [Cache | RAG → Re-Ranker] → Guardrails → LLM → Observability
```

---

## Success Metrics (JTBD-Based)

| Job                   | Metric                     | Target              |
| --------------------- | -------------------------- | ------------------- |
| Document architecture | Time to first diagram      | <30 seconds         |
| Share to platforms    | "Copy for Platform" clicks | 500/month           |
| Share without account | Shareable URL opens        | 1,000/month         |
| Programmatic access   | API calls                  | 10,000/month        |
| Recognize notation    | C4 template usage          | 20% of new projects |

---

## Roadmap Reference

See [README.md](README.md#roadmap) for the feature roadmap. This document defines the strategic vision; implementation follows the phased approach above.
