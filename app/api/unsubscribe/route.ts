import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function buildUnsubscribeHtml(success: boolean) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribe - ArchiGram.ai</title></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;padding:40px;">
    <h1 style="color:#ffffff;font-size:24px;margin-bottom:16px;">
      ${success ? 'Unsubscribed' : 'Something went wrong'}
    </h1>
    <p style="color:#a1a1aa;font-size:16px;margin-bottom:24px;">
      ${success ? "You've been removed from the ArchiGram.ai newsletter." : 'Please try again or contact support.'}
    </p>
    <a href="https://archigram.ai" style="color:#6366f1;text-decoration:none;font-size:14px;">
      &larr; Back to ArchiGram.ai
    </a>
  </div>
</body>
</html>`;
}

// GET /api/unsubscribe?email=... (linked from email)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return new NextResponse(buildUnsubscribeHtml(false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return new NextResponse(buildUnsubscribeHtml(false), {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const { error } = await supabase
    .from('email_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim());

  return new NextResponse(buildUnsubscribeHtml(!error), {
    status: error ? 500 : 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

// POST /api/unsubscribe { email }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const { error } = await supabase
      .from('email_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unsubscribe failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
