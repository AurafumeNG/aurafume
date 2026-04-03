'use client';

import { Suspense, useState, useId } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

function strengthScore(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score = 2;
  if (score === 2 && /[^A-Za-z0-9]/.test(pw)) score = 3;
  return score as 0 | 1 | 2 | 3;
}

const STRENGTH_COLORS = ['', 'oklch(0.55 0.18 25)', 'oklch(0.68 0.15 60)', 'oklch(0.6 0.15 145)'];
const STRENGTH_LABELS = ['', 'Weak', 'Good', 'Strong'];

// ── Inner ───────────────────────────────────────────────────────────────────────

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get('token') ?? '';

  const pwId      = useId();
  const confirmId = useId();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [errors,    setErrors]    = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [success,     setSuccess]     = useState(false);

  const score = strengthScore(password);

  // No token in URL
  if (!token) {
    return (
      <div className="space-y-5 text-center py-4">
        <AlertCircle size={36} strokeWidth={1.4} className="text-destructive mx-auto" />
        <div className="space-y-2">
          <h2 className="text-[0.62rem] tracking-[0.28em] uppercase text-foreground font-medium">Invalid Link</h2>
          <p className="text-[0.6rem] tracking-[0.06em] text-muted-foreground">
            This reset link is missing or malformed.
          </p>
        </div>
        <Link href="/forgot-password"
          className="block text-[0.6rem] tracking-[0.18em] uppercase font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  function validateField(field: 'password' | 'confirm', val: string) {
    if (field === 'password') {
      if (!val) return 'Password is required';
      if (val.length < 8) return 'Must be at least 8 characters';
    }
    if (field === 'confirm') {
      if (!val) return 'Please confirm your password';
      if (val !== password) return 'Passwords do not match';
    }
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pwErr   = validateField('password', password);
    const confErr = validateField('confirm', confirm);
    setErrors({ password: pwErr, confirm: confErr });
    if (pwErr || confErr) return;

    setIsLoading(true);
    setServerError('');
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setServerError(data.error ?? 'Reset failed. Please try again.');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="space-y-6 text-center py-4"
      >
        <motion.div className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
        >
          <CheckCircle2 size={44} strokeWidth={1.4} style={{ color: 'oklch(0.72 0.10 74)' }} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-[0.62rem] tracking-[0.28em] uppercase text-foreground font-medium">
            Password Updated
          </h2>
          <p className="text-[0.6rem] tracking-[0.06em] leading-relaxed text-muted-foreground">
            Your password has been reset. Redirecting you to sign in…
          </p>
        </div>
        <Link href="/login"
          className="block text-[0.6rem] tracking-[0.18em] uppercase font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Sign In Now
        </Link>
      </motion.div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[0.62rem] tracking-[0.3em] uppercase text-foreground font-medium">New Password</h1>
        <p className="mt-1 text-[0.55rem] tracking-[0.08em] text-muted-foreground/60">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 border border-destructive/30 bg-destructive/8 overflow-hidden"
            >
              <AlertCircle size={12} className="text-destructive mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-[0.58rem] tracking-[0.04em] text-destructive leading-relaxed">{serverError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor={pwId} className="block text-[0.52rem] tracking-[0.22em] uppercase text-muted-foreground">
            New Password
          </label>
          <div className="relative">
            <input
              id={pwId} type={showPw ? 'text' : 'password'} value={password}
              placeholder="Min. 8 characters" autoComplete="new-password"
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setErrors(prev => ({ ...prev, password: validateField('password', password) }))}
              className={`w-full h-11 bg-transparent border px-4 pr-11 text-[0.8rem] text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors duration-200 ${
                errors.password ? 'border-destructive/70' : 'border-border focus:border-accent/60'
              }`}
            />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              {showPw ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
            </button>
          </div>
          {/* Strength bar */}
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-0.5 flex-1 rounded-full transition-all duration-300"
                    style={{ background: n <= score ? STRENGTH_COLORS[score] : 'oklch(0.25 0 0)' }} />
                ))}
              </div>
              <p className="text-[0.48rem] tracking-[0.1em]" style={{ color: STRENGTH_COLORS[score] }}>
                {STRENGTH_LABELS[score]}
              </p>
            </div>
          )}
          <AnimatePresence>
            {errors.password && (
              <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[0.52rem] tracking-[0.06em] text-destructive"
              >{errors.password}</motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <label htmlFor={confirmId} className="block text-[0.52rem] tracking-[0.22em] uppercase text-muted-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id={confirmId} type={showConf ? 'text' : 'password'} value={confirm}
              placeholder="••••••••" autoComplete="new-password"
              onChange={e => setConfirm(e.target.value)}
              onBlur={() => setErrors(prev => ({ ...prev, confirm: validateField('confirm', confirm) }))}
              className={`w-full h-11 bg-transparent border px-4 pr-11 text-[0.8rem] text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors duration-200 ${
                errors.confirm ? 'border-destructive/70' : 'border-border focus:border-accent/60'
              }`}
            />
            <button type="button" onClick={() => setShowConf(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              {showConf ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
            </button>
          </div>
          <AnimatePresence>
            {errors.confirm && (
              <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[0.52rem] tracking-[0.06em] text-destructive"
              >{errors.confirm}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit" disabled={isLoading}
          className="w-full h-12 flex items-center justify-center gap-2.5 text-[0.6rem] tracking-[0.28em] uppercase font-semibold transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
        >
          {isLoading
            ? <><Loader2 size={13} strokeWidth={2.2} className="animate-spin" /><span>Updating…</span></>
            : 'Reset Password'
          }
        </button>
      </form>

      <p className="text-center text-[0.52rem] tracking-[0.1em] text-muted-foreground/50">
        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
