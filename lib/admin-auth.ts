import { cookies }                     from 'next/headers';
import { verifyToken, type TokenPayload } from '@/lib/jwt';

/**
 * Reads the admin auth cookie and verifies the JWT.
 * Returns the decoded payload if the caller is an admin/superadmin, null otherwise.
 * Use this at the top of every admin API route handler.
 */
export async function requireAdmin(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token       = cookieStore.get('aura-admin-auth')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;
  if (payload.role !== 'admin' && payload.role !== 'superadmin') return null;

  return payload;
}
