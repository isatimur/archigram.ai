#!/usr/bin/env bun
/**
 * ArchiGram MCP Server - AI agent integration for diagram generation
 *
 * Exposes tools for Cursor, Claude Desktop, and other MCP clients:
 * - generate_diagram: Generate Mermaid diagram from natural language
 * - get_diagram: Fetch a community diagram by ID
 *
 * Usage:
 *   bun run mcp-server
 *   bun mcp-server/index.ts
 *
 * Configure in Cursor/Claude:
 *   "archigram": {
 *     "command": "bun",
 *     "args": ["run", "mcp-server", "--cwd", "/path/to/archigram.ai"]
 *   }
 *
 * Env: ARCHIGRAM_API_URL (default: https://archigram-ai.vercel.app)
 *      GEMINI_API_KEY (optional, for local generation)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = process.env.ARCHIGRAM_API_URL || 'https://archigram-ai.vercel.app';

async function generateViaAPI(prompt: string, domain: string = 'General'): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, domain }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  const { code } = await res.json();
  return code || '';
}

async function generateLocal(prompt: string, domain: string = 'General'): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY not set. Use hosted API (ARCHIGRAM_API_URL) or set GEMINI_API_KEY.'
    );
  }

  process.env.API_KEY = apiKey;
  const { generateDiagramCode } = await import('../services/geminiService.ts');
  return generateDiagramCode(
    prompt,
    undefined,
    domain as 'General' | 'Healthcare' | 'Finance' | 'E-commerce',
    { useRAG: false }
  );
}

async function getDiagramViaAPI(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/v1/diagrams/${id}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Diagram not found');
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

const server = new McpServer({
  name: 'archigram',
  version: '1.0.0',
});

server.registerTool(
  'generate_diagram',
  {
    description:
      'Generate a Mermaid architecture diagram from a natural language description. Use for sequence diagrams, flowcharts, C4 diagrams, ER diagrams, etc.',
    inputSchema: {
      prompt: z
        .string()
        .describe(
          'Natural language description of the diagram (e.g. "microservices auth flow with JWT", "C4 context diagram for e-commerce")'
        ),
      domain: z
        .enum(['General', 'Healthcare', 'Finance', 'E-commerce'])
        .optional()
        .describe('Domain context for generation (default: General)'),
    },
  },
  async ({ prompt, domain = 'General' }) => {
    try {
      let code: string;
      if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
        code = await generateLocal(prompt, domain);
      } else {
        code = await generateViaAPI(prompt, domain);
      }

      if (!code) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No diagram generated. Try a more specific prompt.',
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Generated Mermaid diagram:\n\n\`\`\`mermaid\n${code}\n\`\`\``,
          },
        ],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: `Error: ${msg}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  'get_diagram',
  {
    description:
      'Fetch a published community diagram by ID. Use when the user references a specific diagram or ID.',
    inputSchema: {
      id: z.string().describe('Diagram ID (UUID from community gallery)'),
    },
  },
  async ({ id }) => {
    try {
      const data = await getDiagramViaAPI(id);
      const code = data.code as string;
      const title = data.title as string;
      const author = data.author as string;

      return {
        content: [
          {
            type: 'text' as const,
            text: `Diagram: ${title} (by ${author})\n\n\`\`\`mermaid\n${code}\n\`\`\``,
          },
        ],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: `Error: ${msg}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Use stderr for logging - stdout is used for MCP JSON-RPC
  console.error('ArchiGram MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
