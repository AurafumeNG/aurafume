'use client';

import { useState, useId } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

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
  prefix?:     string;            // e.g. "+234"
  onChange:    (v: string) => void;
  onBlur:      () => void;
}

function Field({
  id, label, type = 'text', value, placeholder,
  error, touched, inputMode, autoComplete, prefix,
  onChange, onBlur,
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
        hasError
          ? 'border-destructive'
          : 'border-border focus-within:border-foreground/50'
      }`}>
        {/* Prefix slot (country code etc.) */}
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
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className="w-full h-12 px-3 bg-transparent text-[0.88rem] text-foreground placeholder:text-muted-foreground/40 outline-none"
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

  const [form, setForm] = useState<ContactForm>({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
  });

  const [touched, setTouched] = useState<TouchedMap>({});

  const errors = validate(form);

  function set(field: FieldKey) {
    return (value: string) => setForm(prev => ({ ...prev, [field]: value }));
  }

  function touch(field: FieldKey) {
    return () => setTouched(prev => ({ ...prev, [field]: true }));
  }

  return (
    <section>

      {/* ── Already have an account? ── */}
      <p className="text-[0.7rem] text-muted-foreground mb-5">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
        >
          Log in
        </Link>
        {' '}to check out faster.
      </p>

      {/* ── Section heading ── */}
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        Contact Information
      </h2>

      {/* ── Fields ── */}
      <div className="space-y-4">

        {/* First + Last name — side by side on sm+, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id={`${uid}-first`}
            label="First Name"
            value={form.firstName}
            placeholder="Ada"
            autoComplete="given-name"
            error={errors.firstName}
            touched={!!touched.firstName}
            onChange={set('firstName')}
            onBlur={touch('firstName')}
          />
          <Field
            id={`${uid}-last`}
            label="Last Name"
            value={form.lastName}
            placeholder="Okonkwo"
            autoComplete="family-name"
            error={errors.lastName}
            touched={!!touched.lastName}
            onChange={set('lastName')}
            onBlur={touch('lastName')}
          />
        </div>

        {/* Email */}
        <Field
          id={`${uid}-email`}
          label="Email Address"
          type="email"
          value={form.email}
          placeholder="ada@example.com"
          autoComplete="email"
          inputMode="email"
          error={errors.email}
          touched={!!touched.email}
          onChange={set('email')}
          onBlur={touch('email')}
        />

        {/* Phone */}
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
          touched={!!touched.phone}
          onChange={set('phone')}
          onBlur={touch('phone')}
        />

        {/* Guest checkout notice */}
        <p className="text-[0.62rem] tracking-[0.04em] text-muted-foreground/70 leading-relaxed pt-1">
          Checking out as a guest — your order confirmation will be sent to the email above.
          No account required.
        </p>

      </div>
    </section>
  );
}
