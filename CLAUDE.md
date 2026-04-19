# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ArchiGram.ai is an AI-powered architecture diagramming app that transforms natural language into diagrams (Mermaid, PlantUML, BPMN) using Google Gemini. Built with **Next.js 15 + React 19 + TypeScript**, backed by Supabase for auth and community features.

## Commands

```bash
bun run dev              # Dev server (port 3000)
bun run build            # Production build → .next/
bun run start            # Start production server
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

**Next.js 15 App Router** — file-system routing under `app/`. The legacy Vite SPA entry (`App.tsx`) is still present for backward compatibility but all new routes are Next.js pages.

**Provider tree:**

```
AuthProvider            ← app/layout.tsx, wraps all routes
  └─ UIProvider
       └─ EditorProvider   ← app/_components/EditorWithProviders.tsx, editor only
            └─ EditorShell
```

**Three React Contexts** (`lib/contexts/`):

- `AuthContext` — `user`, `requireAuth(action)`, `openAuth(mode)`, `handleSignOut`; `authModalMode: 'signin'|'signup'`
- `UIContext` — `viewMode` (Split/Code/Preview), `theme`, `activePanel: 'projects'|'templates'|'community'|null`, `isAIChatExpanded`, and all modal booleans (`isPublishModalOpen`, `isCommandPaletteOpen`, `isShortcutsModalOpen`, `isImageImportModalOpen`, `isAuditModalOpen`, `isPublishPromptModalOpen`). Legacy aliases: `isSidebarOpen` (derived from `activePanel !== null`), `isSidebarCollapsed` (always false, no-op setter).
- `EditorContext` — spreads return of `useProjects()` + `useDiagramSync()`; key fields: `projects`, `activeProjectId`, `code`, `history`, `historyIndex`, `customStyle: DiagramStyleConfig`, `saveStatus: 'saved'|'saving'`

**Key layers:**

- `app/` — Next.js App Router pages and layouts
  - `app/_components/` — `EditorShell.tsx` (orchestrator, 6-theme `THEMES` record, lazy-loads all panels), `ActivityBar.tsx` (48px icon rail: Projects/Templates/Community panels + Copilot toggle), `EditorWithProviders.tsx`, `NavigationAdapter`, `LegacyHashRouter`
  - `app/editor/` — editor page (`next/dynamic ssr:false` to prevent Supabase SSR)
  - `app/u/[username]/` — public profile pages (Server Components); `_components/ProfileHeader.tsx`, `DiagramGrid.tsx`
  - `app/api/` — Route Handlers:
    - `v1/generate` — AI diagram generation
    - `v1/audit` — architecture audit (returns `AuditReport`: score 0–100, risks, strengths, improvements)
    - `v1/fix-syntax` — auto-correct broken diagram code
    - `v1/image-to-diagram` — vision-based image → Mermaid
    - `v1/diagrams/[id]` — CRUD for cloud-persisted diagrams
    - `share-diagram`, `newsletter`, `send-email`, `welcome-email`, `unsubscribe`
- `components/` — React functional components (UI building blocks, framework-agnostic)
- `lib/contexts/` — `AuthContext.tsx`, `UIContext.tsx`, `EditorContext.tsx`
- `lib/supabase/` — `browser.ts` (client-side), `server.ts` (RSC/Route Handlers), `admin.ts` (service role)
- `services/` — External API clients:
  - `geminiService.ts` — Gemini AI (`gemini-3.1-pro-preview` for generation/audit/fix-syntax, `gemini-2.5-flash-image` for vision); supports `CopilotDomain` (General/Healthcare/Finance/E-commerce) and optional RAG context
  - `ragClient.ts` — Optional enterprise RAG backend with graceful degradation (5s timeout)
- `hooks/` — `useProjects` (project CRUD + localStorage), `useDiagramSync` (merges local ↔ Supabase `user_diagrams` on sign-in; higher `updatedAt` wins), `useKeyboardShortcuts`
- `utils/` — Helpers (Plausible analytics, LZ-string URL compression)
- `types.ts` — Shared types: `Project`, `ProjectVersion`, `DiagramStyleConfig`, `ViewMode`, `DiagramTheme`, `User`, `CommunityDiagram`, `ChatMessage`, `AuditReport`
- `constants.ts` — Domain constants, templates, static community data fallback

**Diagram state** is persisted in URL via LZ-string compression, in localStorage via `useProjects`, and synced to Supabase `user_diagrams` on sign-in via `useDiagramSync`.

**Sub-projects:**

- `cli/` — CLI tool (`bun run cli "describe diagram"`) for generating Mermaid from terminal
- `mcp-server/` — Model Context Protocol server exposing `generate_diagram` and `get_diagram` tools
- `rag/` — Python RAG backend (separate dependency tree, tested via pytest/ruff/mypy)

## Testing

- Framework: Vitest with jsdom environment, globals enabled
- Setup: `tests/setup.ts` mocks ResizeObserver, IntersectionObserver, clipboard, URL APIs
- Custom render: `tests/utils/test-utils.tsx` wraps testing-library
- Coverage: v8 provider, thresholds at 70% (branches 65%), covers `services/`, `utils/`, `hooks/`, `constants.ts`
- Tests live in `tests/` directory mirroring source structure

## Code Style

- **Commits**: Conventional Commits format — `feat(scope):`, `fix(scope):`, `docs:`, `refactor:`, etc.
- **TypeScript**: Prefer `type` over `interface`. Avoid `any` (use `unknown`). Target ES2022.
- **React**: Functional components only. Use `React.memo()` for expensive renders.
- **Styling**: Tailwind v4 — no `tailwind.config.ts`; all theme tokens live in the `@theme` block in `app/globals.css`. CSS variables for theming (`--bg`, `--surface`, `--primary`). Six editor themes: `dark` (Obsidian), `midnight` (Abyss), `forest` (Phosphor), `neutral` (Arctic), `ember` (Ember), `dusk` (Dusk). Themes are applied as inline `style` on the root div in `EditorShell`, not via class names. Tailwind color utilities (`bg-background`, `text-text`, `border-border`, etc.) and font utilities (`font-display`, `font-sans`, `font-mono`) are auto-generated from the `@theme` variables.
- **Path alias**: `@/*` maps to project root.
- **Formatting**: Prettier — single quotes, trailing commas (ES5), 100 char width, 2-space indent.
- **Pre-commit**: Husky + lint-staged runs ESLint fix + Prettier on staged `.ts/.tsx` files.

## Environment Variables

`GEMINI_API_KEY` is required for AI generation (server-side). `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_KEY` enable community gallery and auth. The build also accepts legacy `VITE_*` names via webpack `DefinePlugin` shims in `next.config.ts`. See `.env.example` for all options.

## Deployment

Vercel Next.js app — `next build` output served by Vercel. CI runs type-check, lint, format-check, tests, coverage upload (Codecov), CodeQL security analysis, and RAG service tests.
