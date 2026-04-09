'use client';

import { useState, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GoogleButton from '@/components/auth/google-button';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Password strength ───────────────────────────────────────────────────────────

function strengthScore(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score = 2;
  if (score === 2 && /[^A-Za-z0-9]/.test(pw)) score = 3;
  return score as 0 | 1 | 2 | 3;
}

const STRENGTH_LABELS = ['', 'Weak', 'Good', 'Strong'];
const STRENGTH_COLORS = [
  '',
  'oklch(0.55 0.18 25)',
  'oklch(0.68 0.15 60)',
  'oklch(0.6 0.15 145)',
];

function PasswordStrength({ password }: { password: string }) {
  const score = strengthScore(password);
  if (!password) return null;
  return (
    <div className="space-y-1 mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-0.5 flex-1 rounded-full transition-all duration-300"
            style={{
              background:
                n <= score ? STRENGTH_COLORS[score] : 'oklch(0.25 0 0)',
            }}
          />
        ))}
      </div>
      <p
        className="text-[0.48rem] tracking-[0.1em]"
        style={{ color: STRENGTH_COLORS[score] }}
      >
        {STRENGTH_LABELS[score]}
      </p>
    </div>
  );
}

// ── Field ───────────────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete,
  required = true,
  right,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[0.52rem] tracking-[0.22em] uppercase text-muted-foreground"
      >
        {label}
        {!required && (
          <span className="ml-1 text-muted-foreground/40">(optional)</span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`w-full h-11 bg-transparent border px-4 ${right ? 'pr-11' : ''} text-[0.8rem] text-foreground placeholder:text-muted-foreground/30 outline-none transition-colors duration-200 ${
            error
              ? 'border-destructive/70'
              : 'border-border focus:border-accent/60'
          }`}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {right}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[0.52rem] tracking-[0.06em] text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();

  const firstId = useId();
  const lastId = useId();
  const emailId = useId();
  const phoneId = useId();
  const pwId = useId();
  const confirmId = useId();
  const termsId = useId();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(field: keyof typeof form, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function validateField(field: string, val: string): string | undefined {
    switch (field) {
      case 'firstName':
        return !val.trim() ? 'First name is required' : undefined;
      case 'lastName':
        return !val.trim() ? 'Last name is required' : undefined;
      case 'email':
        if (!val.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
          return 'Enter a valid email address';
        return undefined;
      case 'password':
        if (!val) return 'Password is required';
        if (val.length < 8) return 'Must be at least 8 characters';
        return undefined;
      case 'confirm':
        if (!val) return 'Please confirm your password';
        if (val !== form.password) return 'Passwords do not match';
        return undefined;
      default:
        return undefined;
    }
  }

  function blur(field: string, val: string) {
    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  }

  function validateAll() {
    const e: Record<string, string | undefined> = {};
    (
      ['firstName', 'lastName', 'email', 'password', 'confirm'] as const
    ).forEach((f) => {
      e[f] = validateField(f, form[f]);
    });
    setErrors(e);
    return Object.values(e).every((v) => !v);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateAll()) return;
    if (!agreed) {
      setErrors((prev) => ({ ...prev, terms: 'You must agree to the terms' }));
      return;
    }
    setErrors((prev) => ({ ...prev, terms: undefined }));

    setIsLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setServerError(data.error ?? 'Signup failed. Please try again.');
      } else {
        setSuccess(true);
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 text-center py-4"
      >
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 20,
              delay: 0.1,
            }}
          >
            <CheckCircle2
              size={44}
              strokeWidth={1.4}
              style={{ color: 'oklch(0.72 0.10 74)' }}
            />
          </motion.div>
        </div>
        <div className="space-y-2">
          <h2 className="text-[0.62rem] tracking-[0.28em] uppercase text-foreground font-medium">
            Check Your Inbox
          </h2>
          <p className="text-[0.6rem] tracking-[0.06em] leading-relaxed text-muted-foreground max-w-[260px] mx-auto">
            We&apos;ve sent a verification link to{' '}
            <strong className="text-foreground">{form.email}</strong>. Click it
            to activate your account.
          </p>
        </div>
        <p className="text-[0.52rem] tracking-[0.1em] text-muted-foreground/50">
          Already verified?{' '}
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[0.62rem] tracking-[0.3em] uppercase text-foreground font-medium">
          Create Account
        </h1>
        <p className="mt-1 text-[0.55rem] tracking-[0.1em] text-muted-foreground/60">
          Join the AuraFume experience
        </p>
      </div>

      {/* Google OAuth */}
      <div className="space-y-3">
        <GoogleButton label="Sign up with Google" />
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[0.48rem] tracking-[0.18em] uppercase text-muted-foreground/40">
            or
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Server error */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 border border-destructive/30 bg-destructive/8 overflow-hidden"
            >
              <AlertCircle
                size={12}
                className="text-destructive mt-0.5 shrink-0"
                strokeWidth={2}
              />
              <p className="text-[0.58rem] tracking-[0.04em] text-destructive leading-relaxed">
                {serverError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Field
            id={firstId}
            label="First Name"
            value={form.firstName}
            autoComplete="given-name"
            onChange={(v) => set('firstName', v)}
            onBlur={() => blur('firstName', form.firstName)}
            error={errors.firstName}
            placeholder="Ada"
          />
          <Field
            id={lastId}
            label="Last Name"
            value={form.lastName}
            autoComplete="family-name"
            onChange={(v) => set('lastName', v)}
            onBlur={() => blur('lastName', form.lastName)}
            error={errors.lastName}
            placeholder="Obi"
          />
        </div>

        <Field
          id={emailId}
          label="Email"
          type="email"
          value={form.email}
          autoComplete="email"
          onChange={(v) => set('email', v)}
          onBlur={() => blur('email', form.email)}
          error={errors.email}
          placeholder="you@example.com"
        />

        <Field
          id={phoneId}
          label="Phone"
          type="tel"
          value={form.phone}
          autoComplete="tel"
          onChange={(v) => set('phone', v)}
          onBlur={() => {}}
          required={false}
          placeholder="+234 800 000 0000"
        />

        {/* Password */}
        <div>
          <Field
            id={pwId}
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={form.password}
            autoComplete="new-password"
            onChange={(v) => set('password', v)}
            onBlur={() => blur('password', form.password)}
            error={errors.password}
            placeholder="Min. 8 characters"
            right={
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                {showPw ? (
                  <EyeOff size={15} strokeWidth={1.8} />
                ) : (
                  <Eye size={15} strokeWidth={1.8} />
                )}
              </button>
            }
          />
          {form.password && <PasswordStrength password={form.password} />}
        </div>

        <Field
          id={confirmId}
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          value={form.confirm}
          autoComplete="new-password"
          onChange={(v) => set('confirm', v)}
          onBlur={() => blur('confirm', form.confirm)}
          error={errors.confirm}
          placeholder="••••••••"
          right={
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              {showConfirm ? (
                <EyeOff size={15} strokeWidth={1.8} />
              ) : (
                <Eye size={15} strokeWidth={1.8} />
              )}
            </button>
          }
        />

        {/* Terms */}
        <div className="space-y-1">
          <label
            htmlFor={termsId}
            className="flex items-start gap-3 cursor-pointer group"
          >
            <div className="mt-0.5 relative">
              <input
                id={termsId}
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setErrors((prev) => ({ ...prev, terms: undefined }));
                }}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 border flex items-center justify-center transition-colors duration-150 ${
                  agreed
                    ? 'border-accent bg-accent/20'
                    : 'border-border group-hover:border-accent/50'
                }`}
              >
                {agreed && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="9"
                    height="9"
                    viewBox="0 0 9 9"
                  >
                    <polyline
                      points="1,4.5 3.5,7 8,1.5"
                      fill="none"
                      stroke="oklch(0.72 0.10 74)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </div>
            </div>
            <span className="text-[0.56rem] tracking-[0.06em] leading-relaxed text-muted-foreground">
              I agree to the{' '}
              <Link
                href="/terms"
                className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy-policy"
                className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          <AnimatePresence>
            {errors.terms && (
              <motion.p
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[0.52rem] tracking-[0.06em] text-destructive pl-7"
              >
                {errors.terms}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 flex items-center justify-center gap-2.5 text-[0.6rem] tracking-[0.28em] uppercase font-semibold transition-opacity duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={13} strokeWidth={2.2} className="animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-[0.52rem] tracking-[0.1em] text-muted-foreground/50">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
