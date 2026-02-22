# Development Guide

This guide will help you set up ArchiGram.ai for local development.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0 (recommended) or Node.js >= 18.0.0
- [Git](https://git-scm.com/)
- A [Google Gemini API key](https://makersuite.google.com/app/apikey)
- [Supabase](https://supabase.com/) (optional; required for community gallery)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/isatimur/archigram.ai.git
cd archigram.ai

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Start development server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Deployment Modes

- **Minimal:** Only `VITE_GEMINI_API_KEY` — AI and diagramming work; gallery uses static data.
- **Full:** Add Supabase URL/key — live community gallery, publish, like, fork.

## Environment Variables

Minimal setup: `VITE_GEMINI_API_KEY` only. Add Supabase for community gallery.

Create a `.env` file in the root directory:

```env
# Required: Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Supabase (for community features)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key

# Optional: Plausible Analytics (self-hosted)
VITE_PLAUSIBLE_DOMAIN=archigram.ai
```

### Getting API Keys

#### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to your `.env` file

#### Supabase (Optional)

1. Create a project at [Supabase](https://supabase.com/)
2. Go to Settings > API
3. Copy the Project URL and anon/public key
4. Run the migrations in `supabase-migrations.sql`

## Available Scripts

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `bun run dev`           | Start development server            |
| `bun run build`         | Build for production                |
| `bun run preview`       | Preview production build            |
| `bun run test`          | Run tests in watch mode             |
| `bun run test:run`      | Run tests once                      |
| `bun run test:coverage` | Run tests with coverage             |
| `bun run test:ui`       | Open Vitest UI                      |
| `bun run lint`          | Run ESLint                          |
| `bun run lint:fix`      | Fix ESLint errors                   |
| `bun run format`        | Format code with Prettier           |
| `bun run format:check`  | Check formatting                    |
| `bun run type-check`    | Run TypeScript type checker         |
| `bun run validate`      | Run all checks (type, lint, test)   |
| `bun run cli`           | CLI for diagram generation          |
| `bun run mcp-server`    | MCP server for AI agent integration |

## Project Structure

```
archigram.ai/
├── components/        # React components
├── services/          # API clients (Gemini, Supabase)
├── utils/             # Helper functions
├── tests/             # Test files
├── public/            # Static assets
├── App.tsx            # Main app component
├── index.tsx          # Entry point
├── types.ts           # TypeScript types
├── constants.ts       # App constants
├── cli/               # CLI tool
└── mcp-server/        # MCP server for AI agents
```

## MCP Server

The MCP server exposes ArchiGram to AI agents (Cursor, Claude Desktop, etc.) via the [Model Context Protocol](https://modelcontextprotocol.io/).

**Tools:**

- `generate_diagram` — Generate Mermaid diagram from natural language
- `get_diagram` — Fetch a community diagram by ID

**Configuration:**

**Cursor** — Add to `.cursor/mcp.json` (or project settings):

```json
{
  "mcpServers": {
    "archigram": {
      "command": "bun",
      "args": ["run", "mcp-server", "--cwd", "/absolute/path/to/archigram.ai"]
    }
  }
}
```

**Claude Desktop** — Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "archigram": {
      "command": "bun",
      "args": ["run", "mcp-server", "--cwd", "/absolute/path/to/archigram.ai"]
    }
  }
}
```

Uses hosted API by default. Set `GEMINI_API_KEY` for local generation.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow the code style guide:

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Add tests for new functionality
- Keep components small and focused

### 3. Run Quality Checks

```bash
# Run all checks
bun run validate

# Or run individually
bun run type-check
bun run lint
bun run test:run
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(editor): add syntax highlighting for PlantUML"
git commit -m "fix(gallery): resolve pagination issue"
git commit -m "docs: update API documentation"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 5. Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub.

## Testing

### Running Tests

```bash
# Watch mode (development)
bun run test

# Single run (CI)
bun run test:run

# With coverage report
bun run test:coverage

# Visual test UI
bun run test:ui
```

### Writing Tests

Tests are located in `tests/` directory:

```typescript
// tests/components/Editor.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import { Editor } from '../../components/Editor';

describe('Editor', () => {
  it('renders textarea', () => {
    render(<Editor value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

### Test Coverage

We aim for >50% coverage. Check current coverage:

```bash
bun run test:coverage
```

Coverage report is generated in `coverage/` directory.

## Code Style

### TypeScript

- Prefer `type` over `interface` for object types
- Use explicit return types for public functions
- Avoid `any` - use `unknown` if type is truly unknown

### React

- Use functional components with hooks
- Keep components under 200 lines
- Extract custom hooks for reusable logic
- Use `React.memo()` for expensive renders

### CSS

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Keep custom CSS minimal

## Debugging

### VS Code Configuration

Recommended extensions:

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense

### Browser DevTools

- React DevTools for component inspection
- Network tab for API debugging
- Console for error messages

### Environment Issues

```bash
# Clear Bun cache
bun pm cache rm

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install

# Check Bun version
bun --version
```

## Common Issues

### "Cannot find module" errors

```bash
bun install
bun run type-check
```

### Mermaid rendering issues

Clear browser cache or try incognito mode.

### Supabase connection errors

1. Check environment variables
2. Verify Supabase project is active
3. Check RLS policies

### Build failures

```bash
# Check for type errors
bun run type-check

# Check for lint errors
bun run lint

# Verbose build
bun run build --debug
```

## Need Help?

- Check [existing issues](https://github.com/isatimur/archigram.ai/issues)
- Join [GitHub Discussions](https://github.com/isatimur/archigram.ai/discussions)
- Read the [Architecture docs](ARCHITECTURE.md)

Happy coding!
