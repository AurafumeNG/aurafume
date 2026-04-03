// lib/admin-rate-limit.ts
// IP-based in-memory rate limiter for the admin login endpoint.
// Module-level store survives warm function instances on Node.js servers.

const MAX_ATTEMPTS       = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface RateRecord {
  count:     number;
  lockUntil: number; // Unix timestamp ms; 0 = no active lock
}

const store = new Map<string, RateRecord>();

export interface RateLimitResult {
  blocked:         boolean;
  remaining:       number;
  retryAfterSecs?: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now    = Date.now();
  const record = store.get(ip);

  if (!record) return { blocked: false, remaining: MAX_ATTEMPTS };

  // Locked out
  if (record.lockUntil > now) {
    return {
      blocked:         true,
      remaining:       0,
      retryAfterSecs:  Math.ceil((record.lockUntil - now) / 1000),
    };
  }

  // Lock expired — purge stale entry
  if (record.lockUntil > 0) {
    store.delete(ip);
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }

  return { blocked: false, remaining: MAX_ATTEMPTS - record.count };
}

export function recordFailedAttempt(ip: string): RateLimitResult {
  const now    = Date.now();
  const record = store.get(ip) ?? { count: 0, lockUntil: 0 };

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
  }

  store.set(ip, record);

  if (record.lockUntil > now) {
    return {
      blocked:        true,
      remaining:      0,
      retryAfterSecs: Math.ceil((record.lockUntil - now) / 1000),
    };
  }

  return { blocked: false, remaining: MAX_ATTEMPTS - record.count };
}

export function resetAttempts(ip: string): void {
  store.delete(ip);
}
