import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ArchiGram.ai <noreply@archigram.ai>';

function buildWelcomeEmailHtml(username: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:12px;padding:12px;margin-bottom:12px;">
        <span style="font-size:24px;">&#128640;</span>
      </div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:8px 0 0;">Welcome to ArchiGram.ai</h1>
    </div>
    <div style="background-color:#18181b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;margin-bottom:24px;">
      <p style="color:#d4d4d8;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hey ${username}! Thanks for joining ArchiGram.ai &mdash; the AI-powered platform for creating architecture diagrams.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://archigram.ai/editor" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-right:8px;">
          Start Creating &rarr;
        </a>
        <a href="https://archigram.ai/gallery" style="display:inline-block;background:transparent;color:#6366f1;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #6366f1;">
          Browse Gallery
        </a>
      </div>
    </div>
    <p style="color:#52525b;font-size:12px;text-align:center;margin:0;">
      <a href="https://archigram.ai" style="color:#6366f1;text-decoration:none;">ArchiGram.ai</a> &mdash; AI-powered architecture diagrams
    </p>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Service unavailable', message: 'RESEND_API_KEY not configured.' },
      { status: 503 }
    );
  }

  try {
    const { email, username } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'email is required.' }, { status: 400 });
    }

    const html = buildWelcomeEmailHtml(username || 'there');

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Welcome to ArchiGram.ai!',
      html,
    });

    if (error) {
      console.error('[API /welcome-email] Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    console.error('[API /welcome-email]', err);
    const message = err instanceof Error ? err.message : 'Welcome email failed';
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 });
  }
}
