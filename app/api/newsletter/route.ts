import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Service unavailable', message: 'Supabase not configured for newsletter.' },
      { status: 503 }
    );
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const { error } = await supabase.from('email_subscribers').upsert(
      {
        email: email.toLowerCase().trim(),
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: 'email' }
    );

    if (error) {
      console.error('[API /newsletter] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[API /newsletter]', err);
    const message = err instanceof Error ? err.message : 'Subscription failed';
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 });
  }
}
