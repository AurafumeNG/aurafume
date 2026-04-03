'use client';

import { Suspense, useState, useId } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';
import GoogleButton from '@/components/auth/google-button';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Shared input component ──────────────────────────────────────────────────────

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
      <label htmlFor={id} className="block text-[0.52rem] tracking-[0.22em] uppercase text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          className={`w-full h-11 bg-transparent border px-4 ${right ? 'pr-11' : ''} text-[0.8rem] text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors duration-200 ${
            error ? 'border-destructive/70' : 'border-border focus:border-accent/60'
          }`}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[0.52rem] tracking-[0.06em] text-destructive"
          >{error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Inner (needs useSearchParams — wrapped in Suspense) ─────────────────────────

function LoginInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const { refresh } = useAuth();

  const redirectTo   = params.get('redirect') ?? '/';
  const verified     = params.get('verified') === '1';
  const googleError  = params.get('error');

  const emailId    = useId();
  const passwordId = useId();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  function validateField(field: 'email' | 'password', val: string) {
    if (field === 'email') {
      if (!val.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    }
    if (field === 'password') {
      if (!val) return 'Password is required';
    }
    return undefined;
  }

  function blurField(field: 'email' | 'password', val: string) {
    const msg = validateField(field, val);
    setErrors(prev => ({ ...prev, [field]: msg }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateField('email', email);
    const pwErr    = validateField('password', password);
    setErrors({ email: emailErr, password: pwErr });
    if (emailErr || pwErr) return;

    setIsLoading(true);
    setServerError('');
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setServerError(data.error ?? 'Login failed. Please try again.');
      } else {
        await refresh();
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[0.62rem] tracking-[0.3em] uppercase text-foreground font-medium">Sign In</h1>
        <p className="mt-1 text-[0.55rem] tracking-[0.1em] text-muted-foreground/60">
          Welcome back to AuraFume
        </p>
      </div>

      {/* Google OAuth */}
      <div className="space-y-3">
        <GoogleButton label="Sign in with Google" />
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[0.48rem] tracking-[0.18em] uppercase text-muted-foreground/40">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>

      {/* Google error banner */}
      <AnimatePresence>
        {googleError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-3 py-2.5 border border-destructive/30 bg-destructive/8 overflow-hidden"
          >
            <AlertCircle size={12} className="text-destructive mt-0.5 shrink-0" strokeWidth={2} />
            <p className="text-[0.58rem] tracking-[0.04em] text-destructive">
              {googleError === 'google_cancelled'
                ? 'Google sign-in was cancelled.'
                : 'Google sign-in failed. Please try again.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email verified banner */}
      <AnimatePresence>
        {verified && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2.5 border border-accent/30 bg-accent/8 overflow-hidden"
          >
            <p className="text-[0.58rem] tracking-[0.06em] text-accent/90">
              Email verified! You can now sign in.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Server error */}
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

        <Field
          id={emailId} label="Email" type="email" value={email} placeholder="you@example.com"
          autoComplete="email"
          onChange={setEmail} onBlur={() => blurField('email', email)} error={errors.email}
        />

        <Field
          id={passwordId} label="Password" type={showPw ? 'text' : 'password'} value={password}
          placeholder="••••••••" autoComplete="current-password"
          onChange={setPassword} onBlur={() => blurField('password', password)} error={errors.password}
          right={
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              {showPw ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
            </button>
          }
        />

        <div className="flex justify-end">
          <Link href="/forgot-password"
            className="text-[0.52rem] tracking-[0.12em] text-muted-foreground/60 hover:text-accent transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit" disabled={isLoading}
          className="w-full h-12 flex items-center justify-center gap-2.5 text-[0.6rem] tracking-[0.28em] uppercase font-semibold transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
        >
          {isLoading
            ? <><Loader2 size={13} strokeWidth={2.2} className="animate-spin" /><span>Signing in…</span></>
            : 'Sign In'
          }
        </button>
      </form>

      <p className="text-center text-[0.52rem] tracking-[0.1em] text-muted-foreground/50">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
