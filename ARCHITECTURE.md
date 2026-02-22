# Architecture

This document describes the technical architecture of ArchiGram.ai.

## Overview

ArchiGram.ai is a single-page application (SPA) that enables users to generate architecture diagrams from natural language descriptions using AI. The application follows a client-side architecture with serverless backend services.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │──│   Services   │──│   Renderers  │          │
│  │  Components  │  │  (AI, Auth)  │  │  (Diagrams)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Google Gemini  │     Supabase     │    Vercel Hosting         │
│   (AI Generation)│  (Auth, Database)│    (CDN, Edge)            │
└──────────────────┴──────────────────┴───────────────────────────┘
```

## Deployment Modes

ArchiGram supports three deployment modes:

| Mode                    | Supabase | Auth     | Use Case                                          |
| ----------------------- | -------- | -------- | ------------------------------------------------- |
| **Hosted**              | Yes      | Optional | archigram-ai.vercel.app — full community features |
| **Self-hosted minimal** | No       | No       | Gemini key only; static gallery fallback          |
| **Self-hosted full**    | Yes      | Optional | Your infra; live community gallery                |

- **Minimal:** `VITE_GEMINI_API_KEY` required. Supabase omitted → [CommunityGallery](components/CommunityGallery.tsx) falls back to static `COMMUNITY_DATA`.
- **Full:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` for live gallery, publish, like, fork.
- **Auth:** Optional. Publish works as "Anonymous" or with user-provided name.

## Directory Structure

```
archigram.ai/
├── components/           # React UI components
│   ├── AIChat.tsx       # AI chat interface
│   ├── AuditModal.tsx   # Architecture audit feature
│   ├── AuthModal.tsx    # Authentication modal
│   ├── BPMNStudio.tsx   # BPMN diagram editor
│   ├── CodeEditor.tsx   # Code editor component
│   ├── CommandPalette.tsx # Command palette (⌘K)
│   ├── CommunityGallery.tsx # Shared diagrams gallery
│   ├── DiagramPreview.tsx # Live diagram rendering
│   ├── Documentation.tsx # In-app documentation
│   ├── ErrorBoundary.tsx # Error handling (root boundary)
│   ├── FAQPage.tsx      # FAQ page
│   ├── Header.tsx       # App header
│   ├── ImageImportModal.tsx # Vision AI for image upload
│   ├── LandingPage.tsx  # Landing page
│   ├── LegalPage.tsx    # Privacy, terms, license pages
│   ├── LiveDiagramBlock.tsx # Embedded diagram block
│   ├── PlantUMLStudio.tsx # PlantUML editor
│   └── Sidebar.tsx      # Project sidebar
│
├── services/            # External service integrations
│   ├── geminiService.ts # Google Gemini AI client
│   ├── ragClient.ts     # RAG service client (enterprise context)
│   └── supabaseClient.ts # Supabase client (auth, database)
│
├── utils/               # Utility functions
│   ├── analytics.ts     # Plausible analytics
│   └── url.ts          # URL compression utilities
│
├── tests/              # Test files
│   ├── setup.ts        # Test environment setup
│   ├── utils/          # Test utilities
│   └── components/     # Component tests
│
├── public/             # Static assets
│   ├── og-image.png    # Social sharing image
│   ├── manifest.json   # PWA manifest
│   └── sitemap.xml     # SEO sitemap
│
├── App.tsx             # Main application component
├── index.tsx           # React entry point
├── types.ts            # TypeScript type definitions
└── constants.ts        # Domain-specific constants
```

## Core Components

### App.tsx (Main Container)

The central state manager and router for the application:

- **State Management**: Uses React's useState for application state
- **Routing**: Hash-based routing (#app, #gallery, #embed)
- **Theme**: Dark/light mode with system preference detection
- **Layout**: Responsive grid with editor and preview panels

### AI Integration (geminiService.ts)

Connects to Google Gemini for AI-powered features:

```typescript
// Models used:
- gemini-3-flash-preview: Main diagram generation
- gemini-2.5-flash-image: Vision AI (image to diagram)

// Key functions:
- generateDiagramCode(): Natural language → Mermaid (with optional RAG context)
- imageToDiagram(): Image → Diagram code
- auditDiagram(): Diagram → Security/scalability analysis
- fixDiagramSyntax(): Auto-fix Mermaid syntax errors
```

### Diagram Rendering

Multiple rendering engines for different diagram types:

| Format   | Library  | Use Case                       |
| -------- | -------- | ------------------------------ |
| Mermaid  | mermaid  | Flowcharts, sequence, ER, etc. |
| PlantUML | External | Enterprise UML diagrams        |
| BPMN     | bpmn-js  | Business process modeling      |

### Authentication (supabaseClient.ts)

OAuth-based authentication via Supabase:

- GitHub OAuth
- Google OAuth
- Email/password (optional)

## Data Flow

### Diagram Generation Flow

```
User Input → AI Service → Code Generation → Renderer → SVG Output
     │                                           │
     └──────── URL State (compressed) ──────────┘
```

1. User enters natural language description
2. Input sent to Gemini AI with domain-specific prompts
3. AI returns Mermaid/PlantUML code
4. Code rendered client-side to SVG
5. State persisted in URL (LZ-string compressed)

### Community Gallery Flow

```
Create → Publish → Store (Supabase) → Browse → Fork
```

1. User creates diagram locally
2. Optionally publishes to gallery
3. Stored in Supabase PostgreSQL
4. Other users can browse, like, fork

## State Management

The application uses React's built-in state management:

- **Local State**: Component-level useState
- **URL State**: Diagram code compressed in URL hash
- **Persistent State**: localStorage for preferences
- **Server State**: Supabase for community data

### URL State Compression

Diagrams are stored in URLs using LZ-string compression:

```typescript
// Encoding
const compressed = LZString.compressToEncodedURIComponent(code);
window.location.hash = `#app?code=${compressed}`;

// Decoding
const code = LZString.decompressFromEncodedURIComponent(hash);
```

## Security Considerations

### API Key Management

- Gemini API key: Client-side (user's key or env variable)
- Supabase keys: Public anon key only (RLS enforced)

### Row Level Security (RLS)

Supabase tables use RLS policies:

```sql
-- Users can only update their own diagrams
CREATE POLICY "Users can update own diagrams"
ON community_diagrams
FOR UPDATE
USING (auth.uid() = user_id);
```

### Input Validation

- User prompts sanitized before AI calls
- Diagram code validated before rendering
- XSS prevention in rendered output

## Performance Optimizations

### Code Splitting

Lazy loading for heavy components:

```typescript
const BPMNStudio = lazy(() => import('./components/BPMNStudio'));
const PlantUMLStudio = lazy(() => import('./components/PlantUMLStudio'));
const Documentation = lazy(() => import('./components/Documentation'));
```

### Caching

- Mermaid diagrams cached by content hash
- AI responses not cached (unique per request)
- Static assets cached via Vercel CDN

### Bundle Size

Target: < 500KB initial bundle

| Chunk        | Size (approx) |
| ------------ | ------------- |
| React + Core | ~150KB        |
| Mermaid      | ~200KB        |
| BPMN.js      | ~300KB (lazy) |

## Deployment

### Vercel Configuration

```json
{
  "framework": "vite",
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_GEMINI_API_KEY": "@gemini-api-key",
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_KEY": "@supabase-key"
  }
}
```

### Environment Variables

| Variable              | Description                | Required                                    |
| --------------------- | -------------------------- | ------------------------------------------- |
| VITE_GEMINI_API_KEY   | Google Gemini API key      | Yes                                         |
| VITE_SUPABASE_URL     | Supabase project URL       | No (community features disabled if missing) |
| VITE_SUPABASE_KEY     | Supabase anon key          | No (community features disabled if missing) |
| VITE_PLAUSIBLE_DOMAIN | Plausible analytics domain | No (default: archigram-ai.vercel.app)       |
| VITE_RAG_URL          | RAG service URL            | No (enterprise context disabled if missing) |
| VITE_RAG_ENABLED      | Enable RAG integration     | No (default: false)                         |

## Future Architecture Considerations

### Planned Improvements

1. **Real-time Collaboration**: WebSocket-based shared editing
2. **VS Code Extension**: Language server protocol integration
3. **API Access**: REST/GraphQL API for programmatic access
4. **Self-hosting**: Docker support for enterprise deployment

### Scalability

- Horizontal: Vercel edge functions
- Database: Supabase auto-scaling
- AI: Google Cloud quotas

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup instructions and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
