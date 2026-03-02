# Changelog

All notable changes to ArchiGram.ai will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-02-28

### Added

- **Next.js 15 App Router migration** — replaced Vite SPA with Next.js; clean URL routing replaces hash-based navigation (`/editor`, `/gallery`, `/docs`, etc.)
- **Public profile pages** at `/u/[username]` — shareable profile with avatar, bio, social link, stats (diagram count, total likes, join date), and published diagram grid; full OG metadata for social sharing
- **Profile editing** — bio and social link fields added to the private profile page; changes persist to Supabase `profiles` table
- **Server Components** for SEO-critical pages (landing, gallery, docs, public profiles) with proper `generateMetadata` for each route
- **Next.js Route Handlers** replace Vercel serverless functions for all API endpoints (`/api/v1/generate`, `/api/og-image`, `/api/share-diagram`, email routes)
- **Supabase SSR client** (`@supabase/ssr`) with browser/server split — auth session refreshed via Next.js middleware on every request
- **Legacy hash redirects** — old bookmark URLs like `/#gallery` transparently redirect to `/gallery`
- **Keyboard shortcuts cheat sheet** modal (`?` key) — lists all shortcuts grouped by category
- `⌘⇧S` shortcut to copy share link
- Shortcut hints shown in command palette (`⌘K`) next to relevant commands
- Embed view (`/embed`) — clean iframe renderer for embedding diagrams in any website
- Embed code generator: mode selector (minimal/toolbar/interactive), size picker, live-updating `<iframe>` snippet
- Social share URLs include `?title=<diagram-name>` for richer OG image cards

### Changed

- Build tool switched from Vite to Next.js (`bun run dev` now starts on port 3000)
- Environment variables renamed: `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `VITE_SUPABASE_KEY` → `NEXT_PUBLIC_SUPABASE_KEY`, `VITE_GEMINI_API_KEY` → `GEMINI_API_KEY` (server-only)
- Editor moved to `/editor` route (was root `/` with hash routing)

### Technical

- React Context API replaces monolithic `App.tsx` state (3 slices: `AuthContext`, `UIContext`, `EditorContext`)
- Mermaid and bpmn-js bundled into single chunks to prevent Next.js/webpack chunk-name conflicts
- `profiles` Supabase table added with RLS; auto-created on sign-up via database trigger

## [1.1.0] - 2026-02-26

### Added

- User authentication — GitHub OAuth, Google OAuth, and email/password sign-up/sign-in
- Cloud diagram sync — user diagrams persist in Supabase `user_diagrams` table, synced with localStorage on sign-in (local wins on conflict)
- Profile page (`#profile`) — avatar, inline-editable username, stats bar, diagrams grid, danger zone
- Auth-gating — publish to gallery, liking, and commenting require login; pending action replays after sign-in
- `requireAuth` utility in App.tsx for gating any action behind login
- `useDiagramSync` hook for localStorage ↔ Supabase merge logic
- 52 popular Mermaid diagram templates in gallery and prompt marketplace
- REST API endpoints (`POST /api/v1/generate`, `GET /api/v1/diagrams/:id`)
- Dynamic OG image generation (`/api/og-image`)
- `vercel.json` with SPA rewrites, security headers, and asset caching
- Expanded FAQ from 4 to 14 questions

### Fixed

- Hash-based routing was broken — all `#route` URLs now navigate correctly
- Documentation search was decorative — now fully functional with live filter and auto-scroll
- Missing Custom Themes section added to documentation

### Changed

- `constants.ts` refactored — seed prompts and templates moved to `data/seedPrompts.ts` and `data/templates.ts`

### Added

- Comprehensive test infrastructure with Vitest and React Testing Library
- ESLint and Prettier for code quality enforcement
- Husky and lint-staged for pre-commit hooks
- GitHub Actions CI/CD with quality gates, testing, and security scanning
- Dependabot configuration for automated dependency updates
- CodeQL security analysis
- Code coverage reporting with Codecov integration
- SECURITY.md with vulnerability reporting guidelines
- ARCHITECTURE.md with technical documentation
- DEVELOPMENT.md with contributor setup guide

### Changed

- Upgraded project to v1.0.0
- Moved credentials to environment variables
- Enhanced CI workflow with caching and parallel jobs

### Security

- Added CodeQL security scanning
- Implemented Dependabot for dependency security
- Removed hardcoded credentials from source code

## [1.0.0] - 2025-01-29

### Added

- AI-powered diagram generation using Google Gemini 3 Flash
- Vision AI for converting images/sketches to diagrams
- Architectural audit feature for analyzing diagrams
- Multiple diagram format support:
  - Mermaid.js (flowcharts, sequence, class, state, ER, Gantt)
  - PlantUML (enterprise UML diagrams)
  - BPMN (business process modeling)
- Community Gallery for sharing diagrams
- User authentication with GitHub and Google OAuth
- Export functionality (SVG, PNG)
- Share via compressed URLs
- Embeddable diagram links
- Dark/Light theme support
- Responsive design for mobile devices
- Privacy-focused analytics with Plausible

### Technical

- React 19 with TypeScript
- Vite for fast builds
- Supabase for backend services
- Tailwind CSS for styling
- Deployed on Vercel

---

## Version History

### Pre-release Development

- Initial development and MVP creation
- Core AI generation functionality
- Basic diagram rendering
- Community features implementation
- OAuth integration
- Export and sharing features

[Unreleased]: https://github.com/isatimur/archigram.ai/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/isatimur/archigram.ai/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/isatimur/archigram.ai/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/isatimur/archigram.ai/releases/tag/v1.0.0
