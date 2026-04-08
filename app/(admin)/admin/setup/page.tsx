'use client';

import { Suspense, useState, useEffect, useId } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_GOLD =
  'linear-gradient(135deg, oklch(0.50 0.10 68) 0%, oklch(0.58 0.09 74) 60%, oklch(0.53 0.09 70) 100%)';

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

// ── Role label helper ──────────────────────────────────────────────────────────

function roleLabel(role: string) {
  if (role === 'superadmin') return 'Super Admin';
  if (role === 'viewer')     return 'Viewer';
  return 'Admin';
}

// ── Inner page (needs useSearchParams — wrapped in Suspense below) ─────────────

function SetupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get('token') ?? '';

  const pw1Id = useId();
  const pw2Id = useId();

  // Token validation state
  const [checking,  setChecking]  = useState(true);
  const [invitee,   setInvitee]   = useState<{ firstName: string; email: string; role: string } | null>(null);
  const [tokenError, setTokenError] = useState('');

  // Form state
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [errors,    setErrors]    = useState<{ password?: string; confirm?: string }>({});
  const [serverErr, setServerErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,      setDone]      = useState(false);

  // Validate invite token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No invitation token found. Please use the link from your email.');
      setChecking(false);
      return;
    }

    fetch(`/api/admin/team/setup?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((json: { success?: boolean; data?: { firstName: string; email: string; role: string }; error?: string }) => {
        if (json.success && json.data) {
          setInvitee(json.data);
        } else {
          setTokenError(json.error ?? 'Invalid or expired invitation link.');
        }
      })
      .catch(() => setTokenError('Could not verify your invitation. Please try again.'))
      .finally(() => setChecking(false));
  }, [token]);

  function validate(field: 'password' | 'confirm', val: string, pw?: string) {
    if (field === 'password') {
      if (!val) return 'Password is required';
      if (val.length < 8) return 'Password must be at least 8 characters';
    }
    if (field === 'confirm') {
      if (!val) return 'Please confirm your password';
      if (val !== (pw ?? password)) return 'Passwords do not match';
    }
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const pwErr  = validate('password', password);
    const conErr = validate('confirm', confirm, password);
    setErrors({ password: pwErr, confirm: conErr });
    if (pwErr || conErr) return;

    setSubmitting(true);
    setServerErr('');

    try {
      const res  = await fetch('/api/admin/team/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json() as { success?: boolean; data?: { email: string }; error?: string };

      if (!res.ok) {
        setServerErr(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setDone(true);

      // Redirect to login with email pre-filled after a short delay
      setTimeout(() => {
        const email = data.data?.email ?? invitee?.email ?? '';
        router.push(`/admin/login?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch {
      setServerErr('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} strokeWidth={1.5} className="animate-spin" style={{ color: 'oklch(0.58 0.09 74)' }} />
      </div>
    );
  }

  // ── Invalid token state ──────────────────────────────────────────────────────

  if (tokenError) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
        style={{ background: '#0F0F0F' }}
      >
        <div
          className="w-full max-w-[380px] px-8 py-10 space-y-5"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={14} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: 'rgba(239,68,68,0.80)' }} />
            <div className="space-y-1">
              <p className="text-[0.60rem] tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.70)' }}>
                Invitation Invalid
              </p>
              <p className="text-[0.55rem] tracking-[0.05em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {tokenError}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full h-11 text-[0.56rem] tracking-[0.24em] uppercase transition-opacity"
            style={{ border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.40)' }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: '#0F0F0F' }}
      >
        <div
          className="w-full max-w-[380px] px-8 py-10 flex flex-col items-center gap-4 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}
        >
          <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: 'oklch(0.58 0.09 74)' }} />
          <p className="text-[0.60rem] tracking-[0.20em] uppercase" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Account Activated
          </p>
          <p className="text-[0.54rem] tracking-[0.05em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Redirecting you to sign in…
          </p>
          <Loader2 size={14} strokeWidth={1.8} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
      style={{ background: '#0F0F0F' }}
    >
      <div
        className="w-full max-w-[380px] px-8 py-10"
        style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}
      >
        {/* Heading */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2.5">
            <KeyRound size={14} strokeWidth={1.8} style={{ color: 'oklch(0.58 0.09 74)', flexShrink: 0 }} />
            <h1 className="text-[0.62rem] tracking-[0.30em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
              Set Your Password
            </h1>
          </div>
          <p className="text-[0.53rem] tracking-[0.08em] leading-relaxed pl-[22px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Welcome, {invitee?.firstName}. You&apos;ve been invited as{' '}
            <span style={{ color: 'oklch(0.58 0.09 74)' }}>{roleLabel(invitee?.role ?? '')}</span>.
            Choose a password to activate your account.
          </p>
        </div>

        {/* Gold rule */}
        <div
          className="mb-8 h-px"
          style={{ background: 'linear-gradient(90deg, oklch(0.53 0.09 70) 0%, transparent 100%)' }}
        />

        {/* Email chip */}
        <div
          className="mb-6 px-3 py-2"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
        >
          <p className="text-[0.50rem] tracking-[0.14em] uppercase mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Signing in as
          </p>
          <p className="text-[0.70rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.70)' }}>
            {invitee?.email}
          </p>
        </div>

        {/* Server error */}
        <AnimatePresence>
          {serverErr && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 flex items-start gap-2 px-3 py-2.5 overflow-hidden"
              style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}
            >
              <AlertCircle size={12} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: 'rgba(239,68,68,0.80)' }} />
              <p className="text-[0.56rem] tracking-[0.05em] leading-relaxed" style={{ color: 'rgba(239,68,68,0.80)' }}>
                {serverErr}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            id={pw1Id}
            label="New Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            onChange={setPassword}
            onBlur={() => setErrors(prev => ({ ...prev, password: validate('password', password) }))}
            error={errors.password}
            right={
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                tabIndex={-1}
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {showPw ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
              </button>
            }
          />

          <Field
            id={pw2Id}
            label="Confirm Password"
            type={showCon ? 'text' : 'password'}
            value={confirm}
            placeholder="Repeat your password"
            autoComplete="new-password"
            onChange={setConfirm}
            onBlur={() => setErrors(prev => ({ ...prev, confirm: validate('confirm', confirm, password) }))}
            error={errors.confirm}
            right={
              <button
                type="button"
                onClick={() => setShowCon(p => !p)}
                tabIndex={-1}
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {showCon ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
              </button>
            }
          />

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 flex items-center justify-center gap-2.5 text-[0.58rem] tracking-[0.28em] uppercase font-semibold transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: ADMIN_GOLD, color: 'oklch(0.10 0 0)' }}
            >
              {submitting
                ? <><Loader2 size={12} strokeWidth={2.2} className="animate-spin" /><span>Activating…</span></>
                : 'Activate Account'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSetupPage() {
  return (
    <Suspense>
      <SetupInner />
    </Suspense>
  );
}
