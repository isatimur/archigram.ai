#!/usr/bin/env bun
/**
 * ArchiGram CLI - Generate Mermaid diagrams from natural language
 *
 * Usage:
 *   bun run cli "describe a microservices auth flow"
 *   npx archigram "create a sequence diagram for user login"
 *
 * Requires ARCHIGRAM_API_URL (default: https://archigram-ai.vercel.app)
 * or GEMINI_API_KEY for local generation.
 */

const API_BASE = process.env.ARCHIGRAM_API_URL || 'https://archigram-ai.vercel.app';

async function generateViaAPI(prompt: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, domain: 'General' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  const { code } = await res.json();
  return code || '';
}

async function generateLocal(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY not set. Use hosted API (ARCHIGRAM_API_URL) or set GEMINI_API_KEY.'
    );
  }

  process.env.API_KEY = apiKey;
  const { generateDiagramCode } = await import('../services/geminiService.ts');
  return generateDiagramCode(prompt, undefined, 'General', { useRAG: false });
}

async function main() {
  const args = process.argv.slice(2);
  const prompt = args.join(' ').trim();

  if (!prompt) {
    console.error('Usage: archigram "your diagram description"');
    console.error('Example: archigram "describe a microservices auth flow"');
    process.exit(1);
  }

  try {
    let code: string;
    if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
      code = await generateLocal(prompt);
    } else {
      code = await generateViaAPI(prompt);
    }

    if (!code) {
      console.error('No diagram generated.');
      process.exit(1);
    }

    console.log(code);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
