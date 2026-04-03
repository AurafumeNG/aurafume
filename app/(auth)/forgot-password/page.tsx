'use client';

import { useState, useId } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, MailCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

export default function ForgotPasswordPage() {
  const emailId = useId();

  const [email,       setEmail]       = useState('');
  const [emailError,  setEmailError]  = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [sent,        setSent]        = useState(false);

  function validateEmail(val: string) {
    if (!val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsLoading(true);
    setServerError('');
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="space-y-6 text-center py-4"
      >
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
        >
          <MailCheck size={44} strokeWidth={1.4} style={{ color: 'oklch(0.72 0.10 74)' }} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-[0.62rem] tracking-[0.28em] uppercase text-foreground font-medium">
            Check Your Inbox
          </h2>
          <p className="text-[0.6rem] tracking-[0.06em] leading-relaxed text-muted-foreground max-w-[260px] mx-auto">
            If an account exists for <strong className="text-foreground">{email}</strong>, a
            password reset link has been sent. It expires in 1 hour.
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <p className="text-[0.52rem] tracking-[0.1em] text-muted-foreground/40">
            Didn&apos;t receive it?
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-[0.52rem] tracking-[0.12em] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Try again
          </button>
        </div>
        <Link href="/login"
          className="block text-[0.52rem] tracking-[0.1em] text-muted-foreground/50 hover:text-foreground/70 transition-colors"
        >
          ← Back to sign in
        </Link>
      </motion.div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[0.62rem] tracking-[0.3em] uppercase text-foreground font-medium">Forgot Password</h1>
        <p className="mt-1 text-[0.55rem] tracking-[0.08em] leading-relaxed text-muted-foreground/60">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 border border-destructive/30 bg-destructive/8 overflow-hidden"
            >
              <AlertCircle size={12} className="text-destructive mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-[0.58rem] tracking-[0.04em] text-destructive">{serverError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <label htmlFor={emailId} className="block text-[0.52rem] tracking-[0.22em] uppercase text-muted-foreground">
            Email Address
          </label>
          <input
            id={emailId} type="email" value={email} autoComplete="email"
            placeholder="you@example.com"
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setEmailError(validateEmail(email))}
            className={`w-full h-11 bg-transparent border px-4 text-[0.8rem] text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors duration-200 ${
              emailError ? 'border-destructive/70' : 'border-border focus:border-accent/60'
            }`}
          />
          <AnimatePresence>
            {emailError && (
              <motion.p
                initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[0.52rem] tracking-[0.06em] text-destructive"
              >{emailError}</motion.p>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit" disabled={isLoading}
          className="w-full h-12 flex items-center justify-center gap-2.5 text-[0.6rem] tracking-[0.28em] uppercase font-semibold transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
        >
          {isLoading
            ? <><Loader2 size={13} strokeWidth={2.2} className="animate-spin" /><span>Sending…</span></>
            : 'Send Reset Link'
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
