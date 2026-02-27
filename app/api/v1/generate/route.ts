import { NextRequest, NextResponse } from 'next/server';
import { generateDiagramCode } from '@/services/geminiService';
import type { CopilotDomain } from '@/types';

export async function POST(req: NextRequest) {
  // Ensure API key is available
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Service unavailable',
        message: 'Gemini API key not configured. Set GEMINI_API_KEY in environment.',
      },
      { status: 503 }
    );
  }
  // geminiService reads process.env.API_KEY
  process.env.API_KEY = apiKey;

  try {
    const { prompt, currentCode, domain = 'General' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Bad request', message: 'Missing or invalid "prompt" field' },
        { status: 400 }
      );
    }

    const code = await generateDiagramCode(
      prompt,
      currentCode,
      (domain as CopilotDomain) || 'General',
      { useRAG: false }
    );

    return NextResponse.json({ code });
  } catch (err: unknown) {
    console.error('[API /v1/generate]', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 });
  }
}
