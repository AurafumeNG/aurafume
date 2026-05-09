'use client';

import { useState, useId, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { useCheckout } from './checkout-context';
import { useAuth } from '@/components/auth/auth-context';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ContactForm {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
}

type FieldKey = keyof ContactForm;
type TouchedMap = Partial<Record<FieldKey, boolean>>;
type ErrorMap   = Partial<Record<FieldKey, string>>;

// ── Validation ─────────────────────────────────────────────────────────────────

function validate(form: ContactForm): ErrorMap {
  const errors: ErrorMap = {};

  if (!form.firstName.trim())
    errors.firstName = 'First name is required.';
  else if (form.firstName.trim().length < 2)
    errors.firstName = 'Must be at least 2 characters.';

  if (!form.lastName.trim())
    errors.lastName = 'Last name is required.';
  else if (form.lastName.trim().length < 2)
    errors.lastName = 'Must be at least 2 characters.';

  if (!form.email.trim())
    errors.email = 'Email address is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'Enter a valid email address.';

  if (!form.phone.trim())
    errors.phone = 'Phone number is required.';
  else if (!/^(0[7-9][01]\d{8}|\+?234[7-9][01]\d{8})$/.test(form.phone.replace(/\s/g, '')))
    errors.phone = 'Enter a valid Nigerian mobile number.';

  return errors;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-1.5 text-[0.64rem] text-destructive mt-1.5 overflow-hidden"
      role="alert"
    >
      <AlertCircle size={11} strokeWidth={2} className="shrink-0" />
      {message}
    </motion.p>
  );
}

interface FieldProps {
  id:          string;
  label:       string;
  type?:       string;
  value:       string;
  placeholder: string;
  error?:      string;
  touched:     boolean;
  inputMode?:  React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  prefix?:     string;
  disabled?:   boolean;
  onChange:    (v: string) => void;
  onBlur:      () => void;
}

function Field({
  id, label, type = 'text', value, placeholder,
  error, touched, inputMode, autoComplete, prefix,
  disabled, onChange, onBlur,
}: FieldProps) {
  const hasError = touched && !!error;

  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="text-[0.6rem] tracking-[0.22em] uppercase text-muted-foreground mb-1.5"
      >
        {label}
      </label>

      <div className={`relative flex items-center border transition-colors duration-200 ${
        disabled
          ? 'border-border bg-muted/30'
          : hasError
            ? 'border-destructive'
            : 'border-border focus-within:border-foreground/50'
      }`}>
        {prefix && (
          <span className="shrink-0 px-3 h-12 flex items-center text-[0.82rem] text-muted-foreground border-r border-border select-none">
            {prefix}
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className="w-full h-12 px-3 bg-transparent text-[0.88rem] text-foreground placeholder:text-muted-foreground/40 outline-none disabled:text-muted-foreground disabled:cursor-default"
        />
      </div>

      <AnimatePresence initial={false}>
        {hasError && (
          <div id={`${id}-error`}>
            <FieldError message={error!} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function ContactInfo() {
  const uid = useId();
  const { setContactSummary } = useCheckout();
  const { logout } = useAuth();

  const [form, setForm] = useState<ContactForm>({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
  });

  const [touched,    setTouched]    = useState<TouchedMap>({});
  const [authUser,   setAuthUser]   = useState<{ firstName: string; lastName: string; email: string; phone?: string } | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // ── Detect logged-in user ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((res: { data?: { firstName: string; lastName: string; email: string; phone?: string } } | null) => {
        if (res?.data) {
          const { firstName, lastName, email, phone } = res.data;
          setAuthUser({ firstName, lastName, email, phone });
          setForm({ firstName, lastName, email, phone: phone ?? '' });
        }
      })
      .catch(() => { /* not logged in */ })
      .finally(() => setAuthLoaded(true));
  }, []);

  const isLoggedIn = !!authUser;
  const errors     = validate(form);

  // Sync to checkout context whenever the form becomes fully valid
  useEffect(() => {
    if (Object.keys(errors).length === 0) {
      setContactSummary({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
      });
    }
  }, [form, errors, setContactSummary]);

  function set(field: FieldKey) {
    return (value: string) => setForm(prev => ({ ...prev, [field]: value }));
  }

  function touch(field: FieldKey) {
    return () => setTouched(prev => ({ ...prev, [field]: true }));
  }

  // Don't render until we know auth status (avoid layout shift)
  if (!authLoaded) {
    return (
      <section>
        <div className="h-4 w-40 bg-muted/40 rounded animate-pulse mb-5" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>

      {/* ── Auth status banner ── */}
      {isLoggedIn ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-center gap-2 mb-5 px-3 py-2 bg-foreground/3 border border-border/60"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          <p className="text-[0.65rem] tracking-[0.04em] text-muted-foreground">
            Checking out as{' '}
            <span className="text-foreground font-medium">
              {authUser.firstName} {authUser.lastName}
            </span>
            {' '}·{' '}
            <button
              type="button"
              onClick={() => logout()}
              className="underline underline-offset-2 hover:text-accent transition-colors"
            >
              Sign out
            </button>
          </p>
        </motion.div>
      ) : (
        <p className="text-[0.7rem] text-muted-foreground mb-5">
          Already have an account?{' '}
          <Link
            href="/login?redirect=/checkout"
            className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
          >
            Log in
          </Link>
          {' '}to check out faster.
        </p>
      )}

      {/* ── Section heading ── */}
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        Contact Information
      </h2>

      {/* ── Fields ── */}
      <div className="space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id={`${uid}-first`}
            label="First Name"
            value={form.firstName}
            placeholder="Ada"
            autoComplete="given-name"
            disabled={isLoggedIn}
            error={errors.firstName}
            touched={isLoggedIn || !!touched.firstName}
            onChange={set('firstName')}
            onBlur={touch('firstName')}
          />
          <Field
            id={`${uid}-last`}
            label="Last Name"
            value={form.lastName}
            placeholder="Okonkwo"
            autoComplete="family-name"
            disabled={isLoggedIn}
            error={errors.lastName}
            touched={isLoggedIn || !!touched.lastName}
            onChange={set('lastName')}
            onBlur={touch('lastName')}
          />
        </div>

        <Field
          id={`${uid}-email`}
          label="Email Address"
          type="email"
          value={form.email}
          placeholder="ada@example.com"
          autoComplete="email"
          inputMode="email"
          disabled={isLoggedIn}
          error={errors.email}
          touched={isLoggedIn || !!touched.email}
          onChange={set('email')}
          onBlur={touch('email')}
        />

        <Field
          id={`${uid}-phone`}
          label="Phone Number"
          type="tel"
          value={form.phone}
          placeholder="08012345678"
          autoComplete="tel-national"
          inputMode="tel"
          prefix="+234"
          error={errors.phone}
          touched={isLoggedIn || !!touched.phone}
          onChange={set('phone')}
          onBlur={touch('phone')}
        />

        {/* Footer note */}
        {!isLoggedIn && (
          <p className="text-[0.62rem] tracking-[0.04em] text-muted-foreground/70 leading-relaxed pt-1">
            Checking out as a guest — your order confirmation will be sent to the email above.
            No account required.
          </p>
        )}

      </div>
    </section>
  );
}
