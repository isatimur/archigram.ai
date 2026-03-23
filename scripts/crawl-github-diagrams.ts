/**
 * GitHub Gallery Enrichment Crawler
 *
 * Searches GitHub Code Search API for popular Mermaid architecture diagrams,
 * validates and enriches them (optionally via Gemini), then inserts new ones
 * into the Supabase community_diagrams table using source_url for deduplication.
 *
 * Run:
 *   GITHUB_TOKEN=ghp_xxx SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxx bun run scripts/crawl-github-diagrams.ts
 *
 * Optional (Gemini enrichment):
 *   GEMINI_API_KEY=xxx
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_PER_RUN = 30; // Max new diagrams to insert per run
const MIN_CODE_LENGTH = 50; // Skip trivial one-liners
const MAX_CODE_LENGTH = 5000; // Skip giant/unreadable diagrams
const REQUEST_DELAY_MS = 200; // GitHub API rate-limit safety

const SEARCH_QUERIES = [
  'graph+TD+language:Markdown',
  'graph+LR+language:Markdown',
  'sequenceDiagram+language:Markdown',
  'classDiagram+language:Markdown',
  'erDiagram+language:Markdown',
  'stateDiagram-v2+language:Markdown',
  'C4Context+language:Markdown',
  'architecture-beta+language:Markdown',
];

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

if (!GITHUB_TOKEN) {
  console.warn('WARN: GITHUB_TOKEN not set — requests will be heavily rate-limited (60/hr).');
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const genai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GitHubSearchResult = {
  items: Array<{
    html_url: string;
    repository: { owner: { login: string }; full_name: string };
    path: string;
  }>;
};

type GeminiEnrichment = {
  title: string;
  description: string;
  tags: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function detectType(code: string): string[] {
  if (/flowchart|graph\s+(TD|TB|LR|RL|BT)/i.test(code)) return ['Flowchart'];
  if (/sequenceDiagram/i.test(code)) return ['Sequence', 'API'];
  if (/classDiagram/i.test(code)) return ['Class Diagram', 'OOP'];
  if (/erDiagram/i.test(code)) return ['ER Diagram', 'Database'];
  if (/stateDiagram/i.test(code)) return ['State Machine'];
  if (/C4Context|C4Container|C4Component/i.test(code)) return ['C4', 'Architecture'];
  if (/architecture-beta/i.test(code)) return ['Architecture'];
  if (/gitGraph/i.test(code)) return ['Git', 'DevOps'];
  return ['Diagram'];
}

/**
 * Extract all ```mermaid ... ``` blocks from raw markdown content,
 * returning each block along with the nearest H1/H2 heading above it.
 */
function extractMermaidBlocks(content: string): Array<{ code: string; nearestHeading: string }> {
  const results: Array<{ code: string; nearestHeading: string }> = [];
  const lines = content.split('\n');

  let lastHeading = '';
  let inBlock = false;
  let blockLines: string[] = [];

  for (const line of lines) {
    // Track headings outside of code blocks
    if (!inBlock && /^#{1,2}\s+(.+)/.test(line)) {
      const match = /^#{1,2}\s+(.+)/.exec(line);
      if (match) lastHeading = match[1].trim();
    }

    if (!inBlock && /^```mermaid\s*$/i.test(line.trim())) {
      inBlock = true;
      blockLines = [];
      continue;
    }

    if (inBlock && line.trim() === '```') {
      inBlock = false;
      const code = blockLines.join('\n').trim();
      if (code.length >= MIN_CODE_LENGTH && code.length <= MAX_CODE_LENGTH) {
        results.push({ code, nearestHeading: lastHeading });
      }
      blockLines = [];
      continue;
    }

    if (inBlock) {
      blockLines.push(line);
    }
  }

  return results;
}

function isDiagramKeyword(code: string): boolean {
  return /^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|stateDiagram|gitGraph|pie|gantt|journey|C4Context|C4Container|C4Component|architecture-beta)/im.test(
    code
  );
}

/** Convert a GitHub html_url to a raw content URL */
function toRawUrl(htmlUrl: string, path: string, repoFullName: string): string {
  // html_url: https://github.com/owner/repo/blob/sha/path/to/file.md
  // raw:      https://raw.githubusercontent.com/owner/repo/sha/path/to/file.md
  const match = htmlUrl.match(/github\.com\/[^/]+\/[^/]+\/blob\/([^/]+)/);
  const sha = match?.[1] ?? 'HEAD';
  return `https://raw.githubusercontent.com/${repoFullName}/${sha}/${path}`;
}

// ---------------------------------------------------------------------------
// GitHub API
// ---------------------------------------------------------------------------

async function searchGitHub(query: string): Promise<GitHubSearchResult> {
  const url = `https://api.github.com/search/code?q=${query}&sort=stars&per_page=20`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'archigram-crawler/1.0',
  };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub search failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<GitHubSearchResult>;
}

async function fetchRawFile(rawUrl: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { 'User-Agent': 'archigram-crawler/1.0' };
    if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    const res = await fetch(rawUrl, { headers });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini enrichment
// ---------------------------------------------------------------------------

async function enrichWithGemini(code: string): Promise<GeminiEnrichment | null> {
  if (!genai) return null;
  const prompt = `Given this Mermaid diagram code, return JSON with exactly these keys:
- "title": short descriptive title (max 60 chars)
- "description": 1-2 sentence description of what architecture it depicts
- "tags": array of 3-5 relevant tags (e.g. ["Microservices", "AWS", "CI/CD"])

Respond with ONLY valid JSON, no markdown fences, no explanation.

Code:
\`\`\`mermaid
${code}
\`\`\``;

  try {
    const model = genai.models;
    const response = await model.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = response.text ?? '';
    // Strip any accidental markdown fences
    const cleaned = text
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    const parsed = JSON.parse(cleaned) as GeminiEnrichment;
    if (
      typeof parsed.title === 'string' &&
      typeof parsed.description === 'string' &&
      Array.isArray(parsed.tags)
    ) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn(
      `  [gemini] enrichment failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== ArchiGram GitHub Gallery Crawler ===');
  console.log(`Gemini enrichment: ${genai ? 'enabled' : 'disabled (no GEMINI_API_KEY)'}`);
  console.log('');

  // 1. Load existing source_urls from Supabase for deduplication
  const { data: existingRows, error: fetchError } = await supabase
    .from('community_diagrams')
    .select('source_url')
    .not('source_url', 'is', null);

  if (fetchError) {
    console.error('Failed to fetch existing source_urls:', fetchError.message);
    process.exit(1);
  }

  const existingUrls = new Set<string>(
    (existingRows ?? [])
      .map((r: { source_url: string | null }) => r.source_url)
      .filter((u): u is string => u !== null)
  );
  console.log(`Found ${existingUrls.size} already-imported diagrams in Supabase.\n`);

  let inserted = 0;

  // 2. Iterate search queries
  for (const query of SEARCH_QUERIES) {
    if (inserted >= MAX_PER_RUN) break;

    console.log(`Searching: ${query}`);
    let searchResult: GitHubSearchResult;
    try {
      searchResult = await searchGitHub(query);
    } catch (err) {
      console.warn(`  Search failed: ${err instanceof Error ? err.message : String(err)}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    console.log(`  Found ${searchResult.items.length} results.`);

    for (const item of searchResult.items) {
      if (inserted >= MAX_PER_RUN) break;

      const rawUrl = toRawUrl(item.html_url, item.path, item.repository.full_name);

      if (existingUrls.has(rawUrl)) {
        console.log(`  Skipping (already imported): ${rawUrl}`);
        continue;
      }

      // Fetch file content
      const content = await fetchRawFile(rawUrl);
      await sleep(REQUEST_DELAY_MS);

      if (!content) {
        console.log(`  Skipping (fetch failed): ${rawUrl}`);
        continue;
      }

      // Extract mermaid blocks
      const blocks = extractMermaidBlocks(content);
      if (blocks.length === 0) {
        console.log(`  Skipping (no valid mermaid blocks): ${rawUrl}`);
        continue;
      }

      // Process each block (limit to first 3 per file to avoid noise)
      for (const { code, nearestHeading } of blocks.slice(0, 3)) {
        if (inserted >= MAX_PER_RUN) break;

        // Validate diagram has a recognised keyword
        if (!isDiagramKeyword(code)) {
          console.log(`  Skipping block (no diagram keyword)`);
          continue;
        }

        const author = item.repository.owner.login;
        const autoTags = detectType(code);

        let title =
          nearestHeading ||
          `${autoTags[0]} diagram from ${author}/${item.repository.full_name.split('/')[1]}`;
        let description = `Mermaid ${autoTags[0].toLowerCase()} diagram from ${item.repository.full_name}.`;
        let tags = autoTags;

        // Optional Gemini enrichment
        if (genai) {
          const enriched = await enrichWithGemini(code);
          if (enriched) {
            title = enriched.title || title;
            description = enriched.description || description;
            tags = enriched.tags.length > 0 ? enriched.tags : tags;
          }
        }

        // Truncate title to 100 chars to be safe
        title = title.slice(0, 100);

        // Insert into Supabase
        const { error: insertError } = await supabase.from('community_diagrams').insert({
          title,
          author,
          description,
          code,
          tags,
          likes: 0,
          views: 0,
          source_url: rawUrl,
        });

        if (insertError) {
          if (insertError.code === '23505') {
            // Unique violation — race condition or already exists
            console.log(`  Skipping (duplicate source_url): ${rawUrl}`);
          } else {
            console.warn(`  Insert failed for ${rawUrl}: ${insertError.message}`);
          }
          continue;
        }

        existingUrls.add(rawUrl);
        inserted++;
        console.log(`  [${inserted}/${MAX_PER_RUN}] Inserted: "${title}" (${author})`);
      }

      // Mark the raw URL as seen within this run even if we skipped all blocks,
      // to avoid re-fetching the same file for later queries.
      existingUrls.add(rawUrl);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\n=== Done: ${inserted} new diagram(s) inserted ===`);
}

main().catch((err) => {
  console.error('Crawler error:', err);
  process.exit(1);
});
