'use client';

import { Suspense, useState, useId } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Darker gold for the admin CTA — distinct from the customer-facing brand tone
const ADMIN_GOLD =
  'linear-gradient(135deg, oklch(0.50 0.10 68) 0%, oklch(0.58 0.09 74) 60%, oklch(0.53 0.09 70) 100%)';

// ── Field component ────────────────────────────────────────────────────────────

function Field({
  id, label, type = 'text', value, onChange, onBlur, error, placeholder, autoComplete, right,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; onBlur: () => void;
  error?: string; placeholder?: string; autoComplete?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[0.50rem] tracking-[0.24em] uppercase"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full h-11 bg-transparent px-4 text-[0.8rem] outline-none transition-colors duration-200"
          style={{
            border: error
              ? '1px solid rgba(239,68,68,0.6)'
              : '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.88)',
            paddingRight: right ? '2.75rem' : undefined,
          }}
          onFocus={e => {
            if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
          }}
          onBlurCapture={e => {
            if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
          }}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[0.52rem] tracking-[0.06em]"
            style={{ color: 'rgba(239,68,68,0.85)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Inner form (needs useSearchParams — wrapped in Suspense below) ─────────────

function AdminLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') ?? '/admin';

  const emailId    = useId();
  const passwordId = useId();

  const [email,       setEmail]       = useState(params.get('email') ?? '');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [errors,      setErrors]      = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMsg,  setLockoutMsg]  = useState('');

  function validate(field: 'email' | 'password', val: string) {
    if (field === 'email') {
      if (!val.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    }
    if (field === 'password' && !val) return 'Password is required';
    return undefined;
  }

  function blurField(field: 'email' | 'password', val: string) {
    setErrors(prev => ({ ...prev, [field]: validate(field, val) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLockedOut) return;

    const emailErr = validate('email', email);
    const pwErr    = validate('password', password);
    setErrors({ email: emailErr, password: pwErr });
    if (emailErr || pwErr) return;

    setIsLoading(true);
    setServerError('');

    try {
      const res  = await fetch('/api/admin/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string };

      if (res.status === 429) {
        setIsLockedOut(true);
        setLockoutMsg(data.error ?? 'Too many failed attempts. Please wait before trying again.');
        return;
      }

      if (!res.ok) {
        setServerError(data.error ?? 'Authentication failed. Please try again.');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setServerError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
      style={{ background: '#0F0F0F' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-[380px] px-8 py-10"
        style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}
      >

        {/* ── Page heading block ──────────────────────────────────────────────── */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2.5">
            <Lock
              size={14}
              strokeWidth={1.8}
              style={{ color: 'oklch(0.58 0.09 74)', flexShrink: 0 }}
            />
            <h1
              className="text-[0.62rem] tracking-[0.30em] uppercase font-semibold"
              style={{ color: 'rgba(255,255,255,0.90)' }}
            >
              Admin Sign In
            </h1>
          </div>
          <p
            className="text-[0.53rem] tracking-[0.10em] leading-relaxed pl-[22px]"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            Restricted access. Authorized personnel only.
          </p>
        </div>

        {/* Thin gold rule beneath heading */}
        <div
          className="mb-8 h-px"
          style={{ background: 'linear-gradient(90deg, oklch(0.53 0.09 70) 0%, transparent 100%)' }}
        />

        {/* ── Lockout banner ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {isLockedOut && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-start gap-2 px-3 py-2.5 overflow-hidden"
              style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}
            >
              <AlertCircle size={12} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: 'rgba(239,68,68,0.80)' }} />
              <p className="text-[0.56rem] tracking-[0.05em] leading-relaxed" style={{ color: 'rgba(239,68,68,0.80)' }}>
                {lockoutMsg}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Server error banner ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {serverError && !isLockedOut && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-start gap-2 px-3 py-2.5 overflow-hidden"
              style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}
            >
              <AlertCircle size={12} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: 'rgba(239,68,68,0.80)' }} />
              <p className="text-[0.56rem] tracking-[0.05em] leading-relaxed" style={{ color: 'rgba(239,68,68,0.80)' }}>
                {serverError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ────────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            id={emailId}
            label="Email"
            type="email"
            value={email}
            placeholder="admin@aurafumeng.com"
            autoComplete="email"
            onChange={setEmail}
            onBlur={() => blurField('email', email)}
            error={errors.email}
          />

          <Field
            id={passwordId}
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            placeholder="••••••••"
            autoComplete="current-password"
            onChange={setPassword}
            onBlur={() => blurField('password', password)}
            error={errors.password}
            right={
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="transition-opacity"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                tabIndex={-1}
              >
                {showPw
                  ? <EyeOff size={14} strokeWidth={1.8} />
                  : <Eye    size={14} strokeWidth={1.8} />
                }
              </button>
            }
          />

          {/* CTA */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading || isLockedOut}
              className="w-full h-12 flex items-center justify-center gap-2.5 text-[0.58rem] tracking-[0.28em] uppercase font-semibold transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: ADMIN_GOLD, color: 'oklch(0.10 0 0)' }}
            >
              {isLoading
                ? <><Loader2 size={12} strokeWidth={2.2} className="animate-spin" /><span>Verifying…</span></>
                : isLockedOut
                  ? 'Account Locked'
                  : 'Sign In to Admin'
              }
            </button>
          </div>
        </form>
      </div>

      {/* ── Back to Store link ───────────────────────────────────────────────── */}
      <div className="mt-7">
        <Link
          href="/"
          className="text-[0.50rem] tracking-[0.14em] transition-colors duration-200"
          style={{ color: 'rgba(255,255,255,0.18)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
        >
          ← Back to Store
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginInner />
    </Suspense>
  );
}
