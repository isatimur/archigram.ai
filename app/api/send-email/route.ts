import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ArchiGram.ai <noreply@archigram.ai>';

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Service unavailable', message: 'RESEND_API_KEY not configured.' },
      { status: 503 }
    );
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('[API /send-email] Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    console.error('[API /send-email]', err);
    const message = err instanceof Error ? err.message : 'Email sending failed';
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 });
  }
}
