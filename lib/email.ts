import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM     = `"${process.env.FROM_NAME ?? 'AuraFume'}" <${process.env.FROM_EMAIL}>`;
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

// ── HTML email shell ───────────────────────────────────────────────────────────

export function shell(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 20px;">
  <tr><td align="center">
    <table style="max-width:520px;width:100%;background:#111111;border:1px solid #1e1e1e;">
      <tr>
        <td style="padding:36px 40px 28px;border-bottom:1px solid #1e1e1e;">
          <p style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#c5a76d;font-weight:600;">AuraFume</p>
        </td>
      </tr>
      <tr><td style="padding:40px;">
        ${content}
      </td></tr>
      <tr>
        <td style="padding:24px 40px;border-top:1px solid #1e1e1e;">
          <p style="margin:0;font-size:10px;letter-spacing:0.1em;color:#444;text-transform:uppercase;">
            © ${new Date().getFullYear()} AuraFume &middot; Lagos, Nigeria
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const CTAButton = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:8px;padding:14px 36px;background:linear-gradient(135deg,#c5a76d,#e8c87a);color:#0a0a0a;text-decoration:none;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;font-weight:700;">${label}</a>`;

export const bodyText = (text: string) =>
  `<p style="margin:0 0 28px;font-size:13px;line-height:1.8;color:#999;letter-spacing:0.03em;">${text}</p>`;

const smallText = (text: string) =>
  `<p style="margin:32px 0 0;font-size:11px;color:#555;letter-spacing:0.04em;line-height:1.7;">${text}</p>`;

// ── Emails ─────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string, firstName: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: 'Verify your AuraFume account',
    html: shell(`
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:300;letter-spacing:0.18em;text-transform:uppercase;color:#f0f0f0;">Verify Your Email</h1>
      <p style="margin:0 0 32px;font-size:12px;color:#666;letter-spacing:0.06em;">Hi ${firstName},</p>
      ${bodyText('Welcome to AuraFume. Please verify your email address to activate your account and start exploring our luxury fragrance collection.')}
      ${CTAButton(url, 'Verify Email Address')}
      ${smallText('This link expires in <strong style="color:#888;">24 hours</strong>. If you didn\'t create an account, you can safely ignore this email.')}
    `),
  });
}

export async function sendAdminInviteEmail(
  email:       string,
  firstName:   string,
  inviterName: string,
  setupUrl:    string,
  role:        string,
  message?:    string,
) {
  const roleLabel =
    role === 'superadmin' ? 'Super Admin'
    : role === 'viewer'   ? 'Viewer'
    : 'Admin';

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `You've been invited to join the AuraFumeNG admin team`,
    html: shell(`
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:300;letter-spacing:0.18em;text-transform:uppercase;color:#f0f0f0;">Admin Invitation</h1>
      <p style="margin:0 0 32px;font-size:12px;color:#666;letter-spacing:0.06em;">Hi ${firstName},</p>
      ${bodyText(`<strong style="color:#c5a76d;">${inviterName}</strong> has invited you to join the <strong style="color:#e0e0e0;">AuraFumeNG</strong> admin team as a <strong style="color:#c5a76d;">${roleLabel}</strong>.`)}
      ${message ? bodyText(`<em style="color:#888;">"${message}"</em>`) : ''}
      ${bodyText('Click the button below to set up your password and complete your account. This invitation expires in <strong style="color:#888;">48 hours</strong>.')}
      ${CTAButton(setupUrl, 'Accept Invitation')}
      ${smallText('If you weren\'t expecting this invitation, you can safely ignore this email. The link will expire automatically.')}
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  const url = `${BASE_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: 'Reset your AuraFume password',
    html: shell(`
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:300;letter-spacing:0.18em;text-transform:uppercase;color:#f0f0f0;">Reset Password</h1>
      <p style="margin:0 0 32px;font-size:12px;color:#666;letter-spacing:0.06em;">Hi ${firstName},</p>
      ${bodyText('We received a request to reset your AuraFume password. Click the button below to choose a new password.')}
      ${CTAButton(url, 'Reset My Password')}
      ${smallText('This link expires in <strong style="color:#888;">1 hour</strong>. If you didn\'t request a password reset, you can safely ignore this email — your account remains secure.')}
    `),
  });
}
