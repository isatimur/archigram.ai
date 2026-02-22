# ArchiGram.ai — Codebase Review & Improvement Guide

This document summarizes a codebase review with prioritized suggestions to make the project more maintainable, secure, and scalable.

---

## What’s Already Strong

- **Clear structure**: `components/`, `services/`, `utils/`, `api/`, `tests/` with sensible separation.
- **Documentation**: ARCHITECTURE.md, DEVELOPMENT.md, PRODUCT_VISION.md, CONTRIBUTING.md.
- **CI/CD**: Type-check, lint, format, tests, build, RAG tests, Docker build, CodeQL.
- **Testing**: Unit tests for services and utils; coverage thresholds (70% lines/statements/functions) on core code.
- **Lazy loading**: Heavy components (Header, CodeEditor, AIChat, etc.) loaded via `React.lazy`.
- **Error handling**: Root ErrorBoundary; API routes return structured errors.
- **Deployment flexibility**: Hosted vs self-hosted, optional Supabase, env-driven config.
- **API surface**: REST (`/api/v1/generate`, `/api/v1/diagrams/:id`), CLI, MCP server.

---

## High-Impact Improvements

### 1. Break Up `App.tsx` (1,200+ lines, 30+ state variables)

**Problem**: One giant component holds routing, theme, projects, editor, modals, auth, and persistence. Hard to test, reason about, and change.

**Recommendation**:

- Introduce a **small routing layer** (e.g. hash-based router component or a minimal `react-router-dom` setup) and render one main view per route.
- Extract **state into context or a store**:
  - `ProjectContext` (projects, activeProjectId, CRUD).
  - `EditorContext` (code, history, viewMode, error, theme).
  - `UIContext` (modals, sidebar, toasts).
- Keep `App.tsx` as a thin shell: providers + router. Move view-specific logic into page components (e.g. `EditorPage`, `GalleryPage`, `LandingPage`).
- Optional: Add **useReducer** (or Zustand/Jotai) for editor/project state to replace many `useState` calls.

**Outcome**: Easier testing, fewer prop-drilling and re-renders, clearer ownership of state.

---

### 2. Fix Lint and Type Strictness

**Problem**: `bun run lint` fails (unused vars, `any`, `no-undef` for globals, `prefer-const`, etc.) in `App.tsx`, `AIChat.tsx`, `CodeEditor.tsx`, `BPMNStudio.tsx`, `AuthModal.tsx`, `cli/index.ts`. CI runs lint, so this can block PRs.

**Recommendation**:

- Fix or suppress with clear justification:
  - Replace `any` with proper types (e.g. theme CSS object, event handlers).
  - Use `const` where variables are never reassigned.
  - Prefix intentionally unused args with `_` (e.g. `_index`).
- Ensure browser/Node globals used in code are in `eslint.config.js` (you already have many; add any missing ones).
- Consider making `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-non-null-assertion` **error** in new code (e.g. via override for `components/`).

**Outcome**: CI stays green, fewer runtime bugs, better refactoring safety.

---

### 3. API Hardening (Security & Robustness)

**Current**: Basic validation in `/api/v1/generate` (prompt required, string). No rate limiting, no request size limit, no Zod (or similar) for body schema.

**Recommendations**:

- **Validate request body with Zod** (you already use Zod):
  - `prompt`: string, max length (e.g. 10_000 chars).
  - `currentCode`: optional string, max length.
  - `domain`: optional enum.
- **Rate limiting**: Use Vercel’s rate limit (e.g. by IP or by API key if you add one) so `/api/v1/generate` cannot be abused. Document in DEVELOPMENT.md.
- **Diagram ID validation**: In `/api/v1/diagrams/[id]`, validate `id` (e.g. UUID format) before querying Supabase.
- **Avoid mutating `process.env`** in API handlers (e.g. `process.env.API_KEY = apiKey`). Pass the key into the service or use a closure so the handler stays pure and testable.

**Outcome**: Safer API, protection against oversized input and abuse, clearer contracts.

---

### 4. Sensitive Defaults and OSS Hygiene

**Issues**:

- **Sentry DSN** in `index.tsx`: Fallback DSN is hardcoded. For OSS, prefer no default; require `VITE_SENTRY_DSN` when Sentry is enabled.
- **`console.log`** in `index.tsx`: Remove or guard behind `import.meta.env.DEV` so production bundles don’t log unnecessarily.

**Recommendation**:

- Use Sentry only when `VITE_SENTRY_DSN` is set (or keep a documented “hosted app” default but document it in .env.example).
- Add to `.env.example`: `# VITE_SENTRY_DSN=`, `# VITE_SENTRY_ENABLED=false`.
- Remove or conditionalize `console.log` at startup.

**Outcome**: No accidental exposure of project-specific DSN in forks; cleaner production console.

---

### 5. Error Boundary and Observability

**Current**: ErrorBoundary catches errors and shows a simple “Something went wrong” + reload. No report to Sentry from the boundary.

**Recommendation**:

- In `componentDidCatch`, call **Sentry.captureException(error)** (and optionally `errorInfo`) so production errors are reported.
- Optionally add a “Copy error details” button for support, or a small feedback link.

**Outcome**: Fewer silent failures; easier debugging in production.

---

## Medium-Priority Improvements

### 6. Shared API Types and Client

- **API types**: Define shared TypeScript types (or Zod schemas) for `POST /api/v1/generate` and `GET /api/v1/diagrams/:id` responses. Use them in the frontend, CLI, and MCP server so the contract is single-sourced.
- **API client**: Consider a small `apiClient.ts` (e.g. `generateDiagram(prompt, options)`, `getDiagram(id)`) used by the app, CLI, and MCP. Reduces duplication and keeps base URL and error handling in one place.

### 7. Hooks and Reusable Logic

- You have `useKeyboardShortcuts`; more hooks would reduce duplication in `App.tsx`:
  - `useProjects()`: load/save projects, active project, switch/delete.
  - `useHashShare()`: encode/decode diagram from URL hash.
  - `useDiagramTheme()`: theme state + apply CSS variables.
- This pairs well with splitting App into context + pages.

### 8. Supabase RPC for View Count

- `supabaseClient.ts` has a TODO: create RPC `increment_diagram_views` for atomic view increments. Implementing it in Supabase and switching to it removes the read-then-write fallback and avoids race conditions under load.

### 9. Accessibility (a11y)

- Some components use `aria-*` and `role=`; expand consistently:
  - Modals: focus trap, `aria-modal`, `aria-labelledby`, close on Escape.
  - Command palette: arrow-key navigation, `role="listbox"` / `option` semantics.
  - Editor/Preview: ensure keyboard users can move focus and get clear labels (e.g. “Diagram preview”, “Mermaid code”).
- Run **axe-core** or **eslint-plugin-jsx-a11y** in CI to catch regressions.

### 10. Test Coverage and E2E

- **Component tests**: Add a few React Testing Library tests for critical flows (e.g. paste code → preview updates, open publish modal, copy for platform). This will increase confidence when refactoring App.
- **E2E**: One or two Playwright (or similar) tests for “open app → generate diagram → see preview” would protect the main user journey. You already have Playwright in the tooling list; a single smoke test is a good start.

---

## Quick Wins

| Action                                                                           | Benefit                                              |
| -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Remove or gate `console.log` in `index.tsx`                                      | Cleaner production console                           |
| Add Zod validation + max length for `prompt` in `/api/v1/generate`               | Safer API, single source of validation               |
| Document `VITE_SENTRY_DSN` / `VITE_SENTRY_ENABLED` in `.env.example`             | Clear OSS config                                     |
| Call `Sentry.captureException` in ErrorBoundary’s `componentDidCatch`            | Better production debugging                          |
| Validate diagram `id` (e.g. UUID) in `/api/v1/diagrams/[id]`                     | Avoid unnecessary DB calls and clearer 400 responses |
| Add 1–2 custom hooks (e.g. `useProjects`, `useDiagramTheme`) and use them in App | Less state in App, easier to move to context later   |

---

## Suggested Roadmap (Order of Operations)

1. **Quick wins** (Sentry in ErrorBoundary, env docs, API validation, console.log) — low effort, clear benefit.
2. **Lint and type fixes** — unblock CI and improve maintainability.
3. **Extract 1–2 hooks and one context** (e.g. theme or projects) — start shrinking App without a full rewrite.
4. **Introduce router + split views** — then move state into contexts or a store.
5. **Rate limiting and RAG/Docker** — once the app shape is stable.

---

## Summary

The codebase is well-structured and documented, with solid CI, tests, and deployment options. The largest gains will come from **splitting App.tsx** and **centralizing state**, plus **API hardening** and **lint/type hygiene**. Tackling the quick wins and then the high-impact items will make the project easier to extend and safer to run in production.
