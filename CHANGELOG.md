# Changelog

All notable changes to ArchiGram.ai will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/isatimur/archigram.ai/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/isatimur/archigram.ai/releases/tag/v1.0.0
