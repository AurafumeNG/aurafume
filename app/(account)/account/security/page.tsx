'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Eye, EyeOff, Check, Loader2, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = 'oklch(0.72 0.10 74)';

// ── Password strength ─────────────────────────────────────────────────────────
type StrengthScore = 0 | 1 | 2 | 3 | 4;

interface Strength {
  score:  StrengthScore;
  label:  string;
  color:  string;   // Tailwind bg class for the bar segments
  textColor: string;
}

const STRENGTH_LEVELS: Omit<Strength, 'score'>[] = [
  { label: '',       color: '',                   textColor: ''                    },
  { label: 'Weak',   color: 'bg-rose-500',        textColor: 'text-rose-500'       },
  { label: 'Fair',   color: 'bg-amber-400',       textColor: 'text-amber-500'      },
  { label: 'Good',   color: 'bg-yellow-400',      textColor: 'text-yellow-600'     },
  { label: 'Strong', color: 'bg-emerald-500',     textColor: 'text-emerald-600'    },
];

function getStrength(pw: string): Strength {
  if (!pw) return { score: 0, ...STRENGTH_LEVELS[0] };

  let score = 0;
  if (pw.length >= 8)                                      score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))               score++;
  if (/[0-9]/.test(pw))                                    score++;
  if (/[^a-zA-Z0-9]/.test(pw))                            score++;

  const clamped = Math.min(score, 4) as StrengthScore;
  return { score: clamped, ...STRENGTH_LEVELS[clamped] };
}

// ── Strength bar ──────────────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const { score, label, color, textColor } = getStrength(password);
  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1.5 pt-1"
    >
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-400 ${
              i < score ? color : 'bg-muted/35'
            }`}
          />
        ))}
      </div>
      <p className={`text-[0.5rem] tracking-[0.14em] uppercase font-semibold ${textColor}`}>
        {label}
      </p>
    </motion.div>
  );
}

// ── Input styles ──────────────────────────────────────────────────────────────
const inputCls =
  'h-11 w-full border border-border/60 bg-background px-3 pr-10 text-[0.72rem] tracking-[0.03em] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:border-foreground/40 transition-colors duration-150';

// ── Password field (with show/hide toggle) ────────────────────────────────────
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  label:        string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  error?:       string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  const hasError = !!error;

  return (
    <div className="space-y-1.5">
      <p className="text-[0.54rem] tracking-[0.18em] uppercase font-medium text-muted-foreground/70">
        {label}
      </p>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck={false}
          className={`${inputCls} ${hasError ? 'border-rose-400 focus:border-rose-400' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/35 hover:text-foreground/60 transition-colors"
        >
          {show
            ? <EyeOff size={14} strokeWidth={1.8} />
            : <Eye    size={14} strokeWidth={1.8} />
          }
        </button>
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[0.5rem] tracking-[0.06em] text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Success toast ─────────────────────────────────────────────────────────────
function SuccessToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="fixed bottom-24 inset-x-0 z-50 flex justify-center px-5 pointer-events-none"
        >
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-foreground text-background text-[0.58rem] tracking-[0.14em] uppercase font-medium shadow-xl">
            <Check size={13} strokeWidth={2.5} />
            Password updated successfully
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Security header ───────────────────────────────────────────────────────────
function SecurityHeader() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-30 h-14 bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      <div className="h-full max-w-xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center">

        {/* Left — back */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            aria-label="Back to account"
            className="flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>
        </div>

        {/* Center — title */}
        <div className="flex items-center justify-center">
          <h1 className="font-heading text-[0.88rem] tracking-[0.22em] uppercase text-foreground leading-none">
            Security
          </h1>
        </div>

        <div />

      </div>
    </motion.header>
  );
}

// ── Form state & errors ───────────────────────────────────────────────────────
interface FormState {
  current: string;
  next:    string;
  confirm: string;
}

interface FormErrors {
  current?: string;
  next?:    string;
  confirm?: string;
}

const EMPTY: FormState = { current: '', next: '', confirm: '' };

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SecurityPage() {
  const router              = useRouter();
  const { user, isLoading } = useAuth();

  const [form,     setForm]     = useState<FormState>(EMPTY);
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?redirect=/account/security');
  }, [isLoading, user, router]);

  const set = (key: keyof FormState) => (v: string) =>
    setForm(p => ({ ...p, [key]: v }));

  // ── Client-side validation ────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};

    if (!form.current.trim())          errs.current = 'Current password is required';
    if (!form.next.trim())             errs.next    = 'New password is required';
    else if (form.next.length < 8)     errs.next    = 'Must be at least 8 characters';
    else if (form.next === form.current) errs.next  = 'Must differ from current password';

    if (!form.confirm.trim())          errs.confirm = 'Please confirm your new password';
    else if (form.confirm !== form.next) errs.confirm = 'Passwords do not match';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const res  = await fetch('/api/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          currentPassword: form.current,
          newPassword:     form.next,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !json.success) {
        setApiError(json.error ?? 'Something went wrong. Please try again.');
        return;
      }

      // Success — reset form and show toast
      setForm(EMPTY);
      setErrors({});
      setToast(true);
      setTimeout(() => setToast(false), 3200);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <SecurityHeader />
        <div className="pt-14 max-w-xl mx-auto px-5 sm:px-8 py-8 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-2 w-28 bg-muted/40 animate-pulse" />
              <div className="h-11 bg-muted/40 animate-pulse" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <SecurityHeader />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-14 max-w-xl mx-auto px-5 sm:px-8 py-8 space-y-8"
      >

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex items-start gap-3.5 pb-2"
        >
          <span
            className="mt-0.5 flex items-center justify-center w-9 h-9 shrink-0 border border-border/50"
            style={{ color: GOLD }}
          >
            <ShieldCheck size={17} strokeWidth={1.6} />
          </span>
          <div className="space-y-0.5">
            <p className="text-[0.68rem] tracking-[0.1em] uppercase font-medium text-foreground">
              Change Password
            </p>
            <p className="text-[0.58rem] tracking-[0.04em] leading-relaxed text-muted-foreground/60">
              Use a strong, unique password you don't use anywhere else.
            </p>
          </div>
        </motion.div>

        {/* ── Form ── */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          {/* API error */}
          <AnimatePresence>
            {apiError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[0.56rem] tracking-[0.06em] text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5 border border-rose-200 dark:border-rose-800/40"
              >
                {apiError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Current password */}
          <PasswordField
            label="Current Password"
            value={form.current}
            onChange={v => { set('current')(v); if (errors.current) setErrors(p => ({ ...p, current: undefined })); }}
            placeholder="Enter your current password"
            error={errors.current}
            autoComplete="current-password"
          />

          {/* Divider */}
          <div className="border-t border-border/40 pt-1" />

          {/* New password + strength bar */}
          <div className="space-y-2">
            <PasswordField
              label="New Password"
              value={form.next}
              onChange={v => { set('next')(v); if (errors.next) setErrors(p => ({ ...p, next: undefined })); }}
              placeholder="At least 8 characters"
              error={errors.next}
              autoComplete="new-password"
            />
            <StrengthBar password={form.next} />
          </div>

          {/* Confirm password */}
          <PasswordField
            label="Confirm New Password"
            value={form.confirm}
            onChange={v => { set('confirm')(v); if (errors.confirm) setErrors(p => ({ ...p, confirm: undefined })); }}
            placeholder="Re-enter your new password"
            error={errors.confirm}
            autoComplete="new-password"
          />

          {/* Password tips */}
          <ul className="space-y-1.5 pt-1">
            {[
              { rule: form.next.length >= 8,                              text: 'At least 8 characters'             },
              { rule: /[A-Z]/.test(form.next) && /[a-z]/.test(form.next), text: 'Uppercase & lowercase letters'     },
              { rule: /[0-9]/.test(form.next),                            text: 'At least one number'               },
              { rule: /[^a-zA-Z0-9]/.test(form.next),                    text: 'At least one special character'    },
            ].map(({ rule, text }) => (
              <li key={text} className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    rule ? 'bg-emerald-500' : 'bg-muted/40'
                  }`}
                >
                  {rule && <Check size={8} strokeWidth={3} className="text-white" />}
                </span>
                <span
                  className={`text-[0.5rem] tracking-[0.08em] transition-colors duration-300 ${
                    rule ? 'text-foreground/70' : 'text-muted-foreground/40'
                  }`}
                >
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2 text-[0.6rem] tracking-[0.22em] uppercase font-medium bg-foreground text-background mt-2 disabled:opacity-50 transition-opacity duration-200"
          >
            {loading ? (
              <><Loader2 size={13} strokeWidth={2} className="animate-spin" /> Updating…</>
            ) : (
              'Update Password'
            )}
          </button>
        </motion.form>

      </motion.div>

      {/* Success toast */}
      <SuccessToast visible={toast} />
    </>
  );
}
