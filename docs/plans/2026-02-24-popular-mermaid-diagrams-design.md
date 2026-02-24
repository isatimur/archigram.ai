# Popular Mermaid Diagrams — Design Doc

## Goal

Add 50+ high-quality, real-world Mermaid diagrams to both the Community Gallery and Prompt Marketplace. Diagrams should cover all Mermaid types and look professional.

## Data Destinations

Each diagram becomes two entries:

1. **CommunityDiagram** in `data/communityDiagrams.ts` — rendered preview card in gallery
2. **PromptEntry** in seed prompts section of `constants.ts` — prompt text + result code in marketplace

## Diagram Categories (50+ total)

| Category              | Diagram Types                     | Count |
| --------------------- | --------------------------------- | ----- |
| Software Architecture | Flowchart, C4, Sequence           | ~10   |
| DevOps & Cloud        | Flowchart, Sequence               | ~8    |
| Database & Data       | ER, Flowchart                     | ~6    |
| Business Process      | Flowchart, Sequence, User Journey | ~6    |
| Project Management    | Gantt, Timeline                   | ~5    |
| OOP & Design Patterns | Class Diagram                     | ~5    |
| State Machines        | State Diagram                     | ~4    |
| Data Visualization    | Pie, Quadrant, XY Chart           | ~4    |
| Knowledge & Planning  | Mindmap                           | ~4    |
| Git Workflows         | Git Graph                         | ~3    |
| Networking & Security | Sequence, Flowchart               | ~3    |
| ML/AI Pipelines       | Flowchart                         | ~3    |

## Approach

- Curate patterns from popular open-source examples (mermaid-js docs, GitHub repos, dev.to)
- Generate production-quality diagrams with realistic detail and styling
- Each diagram: title, description, tags, author, engagement metrics, polished Mermaid code
- Validate all code renders in Mermaid
- Batch by category for parallel implementation

## Schema Reference

### CommunityDiagram

```ts
{
  id: string,           // 'pop-{category}-{n}'
  title: string,
  author: string,       // realistic usernames
  description: string,
  code: string,         // mermaid code
  likes: number,        // 50-3000 range
  views: number,        // 200-20000 range
  tags: string[],
  createdAt: string,    // date string
  createdAtTimestamp: number
}
```

### PromptEntry

```ts
{
  id: string,                  // 'seed-pop-{category}-{n}'
  title: string,
  author: string,
  description: string,
  prompt_text: string,         // natural language prompt that would generate this diagram
  domain: PromptDomain,
  tags: string[],
  result_diagram_code: string, // same mermaid code
  likes: number,
  views: number,
  created_at: string           // ISO string
}
```

## Implementation Plan

1. Create diagrams in batches of ~10 by category
2. Add CommunityDiagram entries to `data/communityDiagrams.ts`
3. Add corresponding PromptEntry entries to seed prompts in `constants.ts`
4. Validate rendering with dev server
5. Run type-check and lint
