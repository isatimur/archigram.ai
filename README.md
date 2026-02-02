<div align="center">

# ArchiGram.ai

### Describe your architecture. AI draws it.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-4285F4.svg)](https://deepmind.google/technologies/gemini/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![CI](https://github.com/isatimur/archigram.ai/actions/workflows/ci.yml/badge.svg)](https://github.com/isatimur/archigram.ai/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/isatimur/archigram.ai/branch/main/graph/badge.svg)](https://codecov.io/gh/isatimur/archigram.ai)
[![GitHub release](https://img.shields.io/github/v/release/isatimur/archigram.ai?include_prereleases)](https://github.com/isatimur/archigram.ai/releases)
[![GitHub stars](https://img.shields.io/github/stars/isatimur/archigram.ai?style=social)](https://github.com/isatimur/archigram.ai/stargazers)

[Live Demo](https://archigram-ai.vercel.app) · [Report Bug](https://github.com/isatimur/archigram.ai/issues/new?template=bug_report.yml) · [Request Feature](https://github.com/isatimur/archigram.ai/issues/new?template=feature_request.yml) · [Discussions](https://github.com/isatimur/archigram.ai/discussions)

<img src="public/og-image.png" alt="ArchiGram.ai Preview" width="600"/>

</div>

---

## What is ArchiGram.ai?

ArchiGram.ai is an **AI-powered architecture diagramming tool** that transforms natural language descriptions into production-ready diagrams. Stop dragging boxes — start describing systems.

```
Input:  "Create a microservices architecture with API gateway,
         user service, order service, Redis cache, and PostgreSQL"

Output: Complete Mermaid.js diagram in 2 seconds
```

## SaaS or Self Hosted?

| Mode                                 | Backend  | What Works                                                      |
| ------------------------------------ | -------- | --------------------------------------------------------------- |
| **Hosted** (archigram-ai.vercel.app) | Supabase | Full: AI, community gallery, publish, like, fork                |
| **Self-hosted minimal**              | None     | AI (Gemini key), diagramming, export, share URL, static gallery |
| **Self-hosted full**                 | Supabase | Same as hosted; your infra, your data                           |

**No vendor lock-in.** Start with the hosted version, self-host when you need data sovereignty.

## Who It's For

| You are...      | You want...                                                           |
| --------------- | --------------------------------------------------------------------- |
| **Architects**  | Local diagramming, AI, export — run locally with Gemini key           |
| **Teams**       | Shared gallery, publish, fork — use hosted or self-host with Supabase |
| **Enterprises** | Data sovereignty, RAG — self-host + optional RAG backend              |

## Features

### AI-Powered Generation

Describe your system in plain English. Gemini 3 Flash generates valid Mermaid.js code instantly.

### Vision AI

Scan whiteboard sketches, screenshots, or hand-drawn diagrams. AI converts them to editable code.

### Architectural Audit

AI analyzes your diagrams for:

- Single points of failure
- Security vulnerabilities
- Scalability bottlenecks
- Missing components

### Multiple Diagram Formats

- **Mermaid.js**: Flowcharts, sequence, class, state, ER, Gantt, and more
- **PlantUML**: Enterprise-standard UML diagrams
- **BPMN**: Business process modeling

### Community Gallery

Browse, like, fork, and share diagrams with the community.

### Export & Share

- Export as SVG or high-resolution PNG
- Share via compressed URLs
- **Copy for Platform** — one-click copy formatted for GitHub, Notion, GitLab, VS Code, Obsidian, Confluence
- Mermaid renders natively in these platforms — no embed widget needed

## Quick Start

### Option 1: Use Hosted Version

Visit [archigram-ai.vercel.app](https://archigram-ai.vercel.app) — no installation required.

### Option 2: Run Locally (Minimal)

```bash
git clone https://github.com/isatimur/archigram.ai.git
cd archigram.ai
bun install
cp .env.example .env
# Add VITE_GEMINI_API_KEY only (see .env.example)
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). Community gallery shows static fallback.

### Option 3: Self-Host with Community

Same as Option 2, but add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` to `.env` for live gallery. See [DEVELOPMENT.md](DEVELOPMENT.md).

### Option 4: Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/isatimur/archigram.ai&env=VITE_GEMINI_API_KEY)

### Option 5: CLI (Generate from Terminal)

```bash
# Use hosted API (no key needed)
bun run cli "describe a microservices auth flow"

# Or use local Gemini key
GEMINI_API_KEY=your_key bun run cli "create a sequence diagram for user login"
```

### Option 6: MCP Server (AI Agent Integration)

Use ArchiGram from Cursor, Claude Desktop, or any MCP client. Exposes `generate_diagram` and `get_diagram` tools.

```bash
bun run mcp-server
```

Add to your MCP config (e.g. Cursor `.cursor/mcp.json` or Claude `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "archigram": {
      "command": "bun",
      "args": ["run", "mcp-server", "--cwd", "/path/to/archigram.ai"]
    }
  }
}
```

Uses hosted API by default; set `GEMINI_API_KEY` for local generation.

## Tech Stack

| Technology    | Purpose            |
| ------------- | ------------------ |
| React 19      | UI Framework       |
| TypeScript    | Type Safety        |
| Vite          | Build Tool         |
| Tailwind CSS  | Styling            |
| Google Gemini | AI Generation      |
| Mermaid.js    | Diagram Rendering  |
| Supabase      | Community Database |
| Vercel        | Hosting            |

## Documentation

- **[Development Guide](DEVELOPMENT.md)** - Set up your local environment
- **[Architecture](ARCHITECTURE.md)** - Technical architecture overview
- **[Product Vision](PRODUCT_VISION.md)** - Strategic vision, JTBD, competitive positioning
- **[Contributing](CONTRIBUTING.md)** - How to contribute
- **[Changelog](CHANGELOG.md)** - Version history
- **[Security Policy](.github/SECURITY.md)** - Report vulnerabilities

## Usage Examples

### System Design

```
"Design a real-time chat application with WebSocket server,
message queue, presence service, and MongoDB"
```

### Cloud Architecture

```
"AWS architecture with ALB, ECS Fargate, RDS Aurora,
ElastiCache, and S3 for static assets"
```

### ML Pipeline

```
"ML training pipeline with data ingestion, feature store,
model training on GPU, experiment tracking, and model registry"
```

### Microservices

```
"E-commerce microservices: API gateway, product catalog,
inventory, cart, checkout, payment processing, notifications"
```

## Roadmap

- [x] AI diagram generation
- [x] Vision AI (image to diagram)
- [x] Architectural audit
- [x] Community gallery
- [x] PlantUML support
- [x] BPMN editor
- [x] Copy for Platform (GitHub, Notion, GitLab, VS Code)
- [x] C4 model templates
- [x] REST API (`POST /api/v1/generate`, `GET /api/v1/diagrams/:id`)
- [x] CLI tool (`bun run cli "describe auth flow"`)
- [x] Dynamic OG images for link previews
- [ ] User authentication
- [ ] Real-time collaboration
- [ ] GitHub integration
- [ ] Team workspaces
- [x] MCP server for AI agent integration

See [PRODUCT_VISION.md](PRODUCT_VISION.md) for the strategic vision and phased roadmap. [Open issues](https://github.com/isatimur/archigram.ai/issues) for proposed features.

## Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

### Good First Issues

Looking to contribute? Check out issues labeled [`good first issue`](https://github.com/isatimur/archigram.ai/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [`help wanted`](https://github.com/isatimur/archigram.ai/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22).

### Quick Contribution Guide

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Community

- [GitHub Discussions](https://github.com/isatimur/archigram.ai/discussions) - Ask questions, share ideas
- [Twitter](https://twitter.com/isatimur) - Follow for updates
- [Discord](https://discord.gg/archigram) - Join the community (coming soon)

## Support the Project

If ArchiGram.ai helps you, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github)](https://github.com/sponsors/isatimur)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/isatimur)

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) - The incredible diagramming library
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI that powers our generation
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Hosting platform
- All our [contributors](https://github.com/isatimur/archigram.ai/graphs/contributors)

---

<div align="center">

**If ArchiGram.ai helps you, please give it a star!**

[![Star this repo](https://img.shields.io/github/stars/isatimur/archigram.ai?style=social)](https://github.com/isatimur/archigram.ai)

Made with love by [Timur Isachenko](https://github.com/isatimur) and [contributors](https://github.com/isatimur/archigram.ai/graphs/contributors)

</div>
