import { NextRequest, NextResponse } from 'next/server';
import { auditDiagram } from '@/services/geminiService';

export async function POST(req: NextRequest) {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  process.env.API_KEY = apiKey;

  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing "code" field' }, { status: 400 });
    }
    const report = await auditDiagram(code);
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Audit failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
