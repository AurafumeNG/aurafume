import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';

const BASE    = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
const COOKIE  = 'aura-auth';
const MAX_AGE = 7 * 24 * 60 * 60;

// Redirect URI must exactly match what is registered in Google Cloud Console
const REDIRECT_URI = `${BASE}/api/auth/callback/google`;

interface GoogleTokenResponse {
  access_token?: string;
  error?:        string;
}

interface GoogleUserInfo {
  id:           string;
  email:        string;
  given_name?:  string;
  family_name?: string;
  name?:        string;
  picture?:     string;
}

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${BASE}/login?error=google_cancelled`);
  }

  try {
    // ── Exchange code for access token ─────────────────────────────────────────
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    });

    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    if (!tokenRes.ok || !tokens.access_token) {
      console.error('[google/callback] token exchange failed:', tokens);
      return NextResponse.redirect(`${BASE}/login?error=google_failed`);
    }

    // ── Fetch Google profile ───────────────────────────────────────────────────
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = (await profileRes.json()) as GoogleUserInfo;

    if (!profile.email) {
      return NextResponse.redirect(`${BASE}/login?error=google_failed`);
    }

    await connectDB();

    // ── Find or create user ────────────────────────────────────────────────────
    let user = await User.findOne({
      $or: [{ googleId: profile.id }, { email: profile.email.toLowerCase() }],
    });

    if (!user) {
      const nameParts = (profile.name ?? '').split(' ');
      user = await User.create({
        firstName:  profile.given_name  ?? nameParts[0]                  ?? 'User',
        lastName:   profile.family_name ?? nameParts.slice(1).join(' ')  ?? '',
        email:      profile.email.toLowerCase(),
        googleId:   profile.id,
        provider:   'google',
        isVerified: true,
        avatar:     profile.picture,
      });
    } else {
      let changed = false;
      if (!user.googleId)                        { user.googleId   = profile.id;      changed = true; }
      if (!user.isVerified)                      { user.isVerified = true;            changed = true; }
      if (profile.picture && !user.avatar)       { user.avatar     = profile.picture; changed = true; }
      if (changed) await user.save();
    }

    // ── Issue JWT and redirect ─────────────────────────────────────────────────
    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });

    const res = NextResponse.redirect(`${BASE}/`);
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   MAX_AGE,
      path:     '/',
    });

    return res;
  } catch (err) {
    console.error('[api/auth/callback/google]', err);
    return NextResponse.redirect(`${BASE}/login?error=google_failed`);
  }
}
