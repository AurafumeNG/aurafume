import { NextRequest, NextResponse } from 'next/server';
import { transporter, shell, bodyText } from '@/lib/email';

// ── Simple in-memory rate limiter: 3 submissions per IP per 10 minutes ──────────
const RATE_LIMIT = 3;
const WINDOW_MS  = 10 * 60 * 1000;

const ipStore = new Map<string, { count: number; resetAt: number }>();

function checkContactRateLimit(ip: string): boolean {
  const now    = Date.now();
  const record = ipStore.get(ip);

  if (!record || record.resetAt < now) {
    ipStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;

  record.count += 1;
  return true;
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ContactPayload {
  fullName:   string;
  email:      string;
  phone?:     string;
  subject:    string;
  message:    string;
  attachment?: {
    name:    string;
    type:    string;
    base64:  string;
  };
}

const ADMIN_EMAIL = 'aurafumeng@gmail.com';

const SUBJECTS = [
  'Order Inquiry',
  'Product Question',
  'Return / Refund',
  'Other',
] as const;

// ── POST /api/contact ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  if (!checkContactRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes before trying again.' },
      { status: 429 },
    );
  }

  let body: ContactPayload;
  try {
    body = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { fullName, email, phone, subject, message, attachment } = body;

  // Validate required fields
  if (!fullName?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!SUBJECTS.includes(subject as typeof SUBJECTS[number])) {
    return NextResponse.json({ error: 'Invalid subject.' }, { status: 400 });
  }

  if (message.trim().length < 20) {
    return NextResponse.json({ error: 'Message must be at least 20 characters.' }, { status: 400 });
  }

  // Validate attachment if present
  if (attachment) {
    const { name, type, base64 } = attachment;
    if (!name || !type || !base64) {
      return NextResponse.json({ error: 'Invalid attachment.' }, { status: 400 });
    }
    const sizeBytes = Math.ceil((base64.length * 3) / 4);
    if (sizeBytes > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Attachment exceeds 5 MB limit.' }, { status: 400 });
    }
  }

  // ── Build admin notification email ─────────────────────────────────────────
  const adminHtml = shell(`
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:300;letter-spacing:0.18em;text-transform:uppercase;color:#f0f0f0;">New Contact Message</h1>
    <p style="margin:0 0 32px;font-size:12px;color:#666;letter-spacing:0.06em;">Received via the AuraFume contact form</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:11px;letter-spacing:0.08em;color:#666;text-transform:uppercase;width:120px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;color:#e0e0e0;">${fullName.trim()}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:11px;letter-spacing:0.08em;color:#666;text-transform:uppercase;">Email</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;color:#c5a76d;"><a href="mailto:${email.trim()}" style="color:#c5a76d;text-decoration:none;">${email.trim()}</a></td></tr>
      ${phone?.trim() ? `<tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:11px;letter-spacing:0.08em;color:#666;text-transform:uppercase;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;color:#e0e0e0;">${phone.trim()}</td></tr>` : ''}
      <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:11px;letter-spacing:0.08em;color:#666;text-transform:uppercase;">Subject</td><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;font-size:13px;color:#e0e0e0;">${subject}</td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;color:#666;text-transform:uppercase;">Message</p>
    <div style="padding:20px;background:#0d0d0d;border:1px solid #1e1e1e;border-left:3px solid #c5a76d;">
      ${bodyText(message.trim().replace(/\n/g, '<br>'))}
    </div>
    ${attachment ? `<p style="margin:20px 0 0;font-size:11px;color:#666;letter-spacing:0.06em;">📎 Attachment: <strong style="color:#e0e0e0;">${attachment.name}</strong></p>` : ''}
  `);

  // ── Build auto-reply email ─────────────────────────────────────────────────
  const autoReplyHtml = shell(`
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:300;letter-spacing:0.18em;text-transform:uppercase;color:#f0f0f0;">We Got Your Message</h1>
    <p style="margin:0 0 32px;font-size:12px;color:#666;letter-spacing:0.06em;">Hi ${fullName.trim().split(' ')[0]},</p>
    ${bodyText('Thank you for reaching out to AuraFume. We\'ve received your message and our team will get back to you within <strong style="color:#c5a76d;">24 hours</strong>.')}
    ${bodyText(`Your enquiry reference: <strong style="color:#e0e0e0;">${subject}</strong>`)}
    ${bodyText('In the meantime, you can browse our collection or check our FAQ page for quick answers.')}
    <p style="margin:32px 0 0;font-size:11px;color:#555;letter-spacing:0.04em;line-height:1.7;">If you have an urgent issue, you can also reach us via WhatsApp at <strong style="color:#888;">+234 801 234 5678</strong> (Mon–Sat, 9AM–6PM).</p>
  `);

  try {
    const mailAttachments = attachment
      ? [
          {
            filename:    attachment.name,
            content:     Buffer.from(attachment.base64, 'base64'),
            contentType: attachment.type,
          },
        ]
      : [];

    // Send both emails in parallel
    await Promise.all([
      // Notification to admin
      transporter.sendMail({
        from:        `"AuraFume Contact" <${process.env.FROM_EMAIL}>`,
        to:          ADMIN_EMAIL,
        replyTo:     `"${fullName.trim()}" <${email.trim()}>`,
        subject:     `[Contact] ${subject} — ${fullName.trim()}`,
        html:        adminHtml,
        attachments: mailAttachments,
      }),
      // Auto-reply to sender
      transporter.sendMail({
        from:    `"${process.env.FROM_NAME ?? 'AuraFume'}" <${process.env.FROM_EMAIL}>`,
        to:      `"${fullName.trim()}" <${email.trim()}>`,
        subject: 'We received your message — AuraFume',
        html:    autoReplyHtml,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/contact]', err);
    return NextResponse.json(
      { error: 'Failed to send your message. Please try again.' },
      { status: 500 },
    );
  }
}
