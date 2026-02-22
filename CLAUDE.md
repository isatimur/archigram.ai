# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ArchiGram.ai is an AI-powered architecture diagramming SPA that transforms natural language into diagrams (Mermaid, PlantUML, BPMN) using Google Gemini. Built with React 19 + TypeScript + Vite, backed by Supabase for community features.

## Commands

```bash
bun run dev              # Dev server (port 3000)
bun run build            # Production build → dist/
bun run type-check       # TypeScript check (tsc --noEmit)
bun run lint             # ESLint (zero warnings allowed)
bun run lint:fix         # ESLint with auto-fix
bun run format           # Prettier format all files
bun run format:check     # Prettier check only
bun run test             # Vitest watch mode
bun run test:run         # Vitest single run
bun run test:coverage    # Vitest with v8 coverage
bun run validate         # type-check + lint + test:run (use before committing)
```

Run a single test file: `bunx vitest run tests/services/geminiService.test.ts`

## Architecture

**Single-page app with hash-based routing** — no router library. Routes (`#app`, `#gallery`, `#embed`, `#docs`, `#landing`) are handled in `App.tsx`.

**App.tsx is the central state manager** (~1200 lines). It owns 30+ useState hooks for projects, editor state, UI modals, and theme. All major state flows through here.

**Key layers:**

- `components/` — React functional components, all lazy-loaded from App.tsx
- `services/` — External API clients:
  - `geminiService.ts` — Gemini AI (`gemini-3-flash-preview` for generation, `gemini-2.5-flash-image` for vision). Includes domain-specific prompts (Healthcare/HIPAA, Finance/PCI-DSS, E-commerce) and optional RAG context injection
  - `supabaseClient.ts` — Auth (GitHub/Google OAuth, email/password) and community diagrams CRUD with cursor-based pagination
  - `ragClient.ts` — Optional enterprise RAG backend with graceful degradation (5s timeout)
- `utils/` — Helpers (Plausible analytics, LZ-string URL compression)
- `hooks/` — Custom React hooks (keyboard shortcuts)
- `types.ts` — Shared TypeScript types
- `constants.ts` — Domain constants, templates, static community data fallback

**Diagram state is persisted in URL** via LZ-string compression and in localStorage for projects.

**Sub-projects:**

- `cli/` — CLI tool (`bun run cli "describe diagram"`) for generating Mermaid from terminal
- `mcp-server/` — Model Context Protocol server exposing `generate_diagram` and `get_diagram` tools
- `rag/` — Python RAG backend (separate dependency tree, tested via pytest/ruff/mypy)

## Testing

- Framework: Vitest with jsdom environment, globals enabled
- Setup: `tests/setup.ts` mocks ResizeObserver, IntersectionObserver, clipboard, URL APIs
- Custom render: `tests/utils/test-utils.tsx` wraps testing-library
- Coverage: v8 provider, thresholds at 70% (branches 69%), covers `services/`, `utils/`, `constants.ts`
- Tests live in `tests/` directory mirroring source structure

## Code Style

- **Commits**: Conventional Commits format — `feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, etc.
- **TypeScript**: Prefer `type` over `interface`. Avoid `any` (use `unknown`). Target ES2022.
- **React**: Functional components only. Use `React.memo()` for expensive renders.
- **Styling**: Tailwind CSS utilities. CSS variables for theming (`--bg`, `--surface`, `--primary`). Five theme variants: dark/light/midnight/forest/neutral.
- **Path alias**: `@/*` maps to project root.
- **Formatting**: Prettier — single quotes, trailing commas (ES5), 100 char width, 2-space indent.
- **Pre-commit**: Husky + lint-staged runs ESLint fix + Prettier on staged `.ts/.tsx` files.

## Environment Variables

Only `VITE_GEMINI_API_KEY` is required. Without Supabase keys, community gallery falls back to static data in `constants.ts`. See `.env.example` for all options.

## Deployment

Vercel SPA — `vite build` output to `dist/`. CI runs type-check, lint, format-check, tests, coverage upload (Codecov), CodeQL security analysis, and RAG service tests.
