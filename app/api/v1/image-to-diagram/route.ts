import { NextRequest, NextResponse } from 'next/server';
import { imageToDiagram } from '@/services/geminiService';

export async function POST(req: NextRequest) {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  process.env.API_KEY = apiKey;

  try {
    const { image, mimeType } = await req.json();
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing "image" field' }, { status: 400 });
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'Missing "mimeType" field' }, { status: 400 });
    }
    const code = await imageToDiagram(image, mimeType);
    return NextResponse.json({ code });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image conversion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
