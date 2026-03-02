import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Bad request', message: 'Missing diagram id' },
      { status: 400 }
    );
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        error: 'Service unavailable',
        message:
          'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY.',
      },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase
      .from('community_diagrams')
      .select('id, title, author, description, code, tags, likes, views, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Not found', message: 'Diagram not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: data.id,
      title: data.title,
      author: data.author || 'Anonymous',
      description: data.description || '',
      code: data.code,
      tags: data.tags || [],
      likes: data.likes || 0,
      views: data.views || 0,
      createdAt: data.created_at,
    });
  } catch (err: unknown) {
    console.error('[API /v1/diagrams/:id]', err);
    const message = err instanceof Error ? err.message : 'Fetch failed';
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 });
  }
}
