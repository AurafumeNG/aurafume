import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  `${base}/api/auth/callback/google`,   // matches Google Cloud Console
    response_type: 'code',
    scope:         'email profile',
    access_type:   'offline',
    prompt:        'select_account',
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
