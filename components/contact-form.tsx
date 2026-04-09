'use client';

import { useState, useRef, useCallback } from 'react';
import { Loader2, Paperclip, X, CheckCircle, ChevronDown } from 'lucide-react';

const GOLD = 'oklch(0.72 0.10 74)';
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

const SUBJECTS = [
  'Order Inquiry',
  'Product Question',
  'Return / Refund',
  'Other',
] as const;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_MSG_CHARS  = 1000;
const MIN_MSG_CHARS  = 20;

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Attachment {
  name:   string;
  type:   string;
  base64: string;
}

interface Toast {
  id:      number;
  message: string;
}

let toastId = 0;

export default function ContactForm() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName,   setFullName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [subject,    setSubject]    = useState('');
  const [message,    setMessage]    = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [fileError,  setFileError]  = useState('');
  const [status,     setStatus]     = useState<Status>('idle');
  const [toasts,     setToasts]     = useState<Toast[]>([]);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const showErrorToast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  // ── File handler ─────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setFileError('File exceeds 5 MB. Please choose a smaller file.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(',')[1];
      setAttachment({ name: file.name, type: file.type, base64 });
    };
    reader.readAsDataURL(file);
  }

  function removeAttachment() {
    setAttachment(null);
    setFileError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (message.trim().length < MIN_MSG_CHARS) {
      showErrorToast(`Message must be at least ${MIN_MSG_CHARS} characters.`);
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName: fullName.trim(),
          email:    email.trim(),
          phone:    phone.trim() || undefined,
          subject,
          message:  message.trim(),
          attachment: attachment ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to send. Please try again.');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      showErrorToast(err instanceof Error ? err.message : 'Failed to send. Please try again.');
      // Reset back to idle so user can retry
      setTimeout(() => setStatus('idle'), 100);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <section className="px-6 sm:px-10 lg:px-16 pb-24">
        <div className="max-w-2xl mx-auto">
          <p className="text-[0.55rem] tracking-[0.28em] uppercase text-muted-foreground/50 mb-10">
            Send Us a Message
          </p>
          <div className="border border-border p-12 flex flex-col items-center text-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: GOLD_GRADIENT }}
            >
              <CheckCircle size={28} strokeWidth={1.5} className="text-background" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-2xl tracking-widest uppercase text-foreground">
                Message Sent!
              </h2>
              <p className="text-[0.78rem] text-muted-foreground tracking-wide">
                We&apos;ll get back to you within 24 hours.
              </p>
            </div>
            <button
              onClick={() => {
                setFullName(''); setEmail(''); setPhone('');
                setSubject(''); setMessage('');
                setAttachment(null); setStatus('idle');
              }}
              className="mt-2 text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </section>
    );
  }

  const charCount      = message.length;
  const charRemaining  = MAX_MSG_CHARS - charCount;
  const charCountColor =
    charRemaining < 50
      ? 'text-rose-500'
      : charCount < MIN_MSG_CHARS
      ? 'text-muted-foreground/40'
      : 'text-muted-foreground/60';

  const isLoading = status === 'loading';

  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Section label */}
        <p className="text-[0.55rem] tracking-[0.28em] uppercase text-muted-foreground/50 mb-10">
          Send Us a Message
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Row 1 — Full Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Full Name" required>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Ada Okafor"
                className={inputCls}
              />
            </Field>
            <Field label="Email Address" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="ada@example.com"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Row 2 — Phone + Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Phone Number" hint="Optional">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                placeholder="+234 801 234 5678"
                className={inputCls}
              />
            </Field>
            <Field label="Subject" required>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isLoading}
                  className={`${inputCls} appearance-none pr-10 ${
                    !subject ? 'text-muted-foreground/40' : ''
                  }`}
                >
                  <option value="" disabled>Select a subject…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  strokeWidth={1.6}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50"
                />
              </div>
            </Field>
          </div>

          {/* Message */}
          <Field label="Message" required>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_MSG_CHARS) setMessage(e.target.value);
                }}
                required
                disabled={isLoading}
                rows={6}
                placeholder="Tell us how we can help you…"
                className={`${inputCls} resize-none`}
              />
              {/* Character count */}
              <div className={`absolute bottom-3 right-3 text-[0.55rem] tracking-wide tabular-nums ${charCountColor}`}>
                {charCount < MIN_MSG_CHARS
                  ? `${MIN_MSG_CHARS - charCount} more to go`
                  : `${charRemaining} left`}
              </div>
            </div>
          </Field>

          {/* Attach File */}
          <div>
            <p className="text-[0.55rem] tracking-[0.2em] uppercase text-muted-foreground/50 mb-2">
              Attach File <span className="text-muted-foreground/30">(Optional)</span>
            </p>
            <p className="text-[0.62rem] text-muted-foreground/40 mb-3">
              e.g. proof of payment, product photo — max 5 MB
            </p>

            {attachment ? (
              <div className="flex items-center gap-3 px-4 py-3 border border-border bg-muted/10">
                <Paperclip size={14} strokeWidth={1.6} style={{ color: GOLD }} />
                <span className="flex-1 text-[0.7rem] text-foreground truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors"
                  aria-label="Remove attachment"
                >
                  <X size={14} strokeWidth={1.6} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2.5 px-5 h-10 border border-border/60 border-dashed text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground hover:border-accent hover:text-accent transition-colors duration-200 disabled:opacity-50"
              >
                <Paperclip size={13} strokeWidth={1.6} />
                Choose File
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
            />
            {fileError && (
              <p className="mt-1.5 text-[0.62rem] text-rose-500">{fileError}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ background: isLoading ? undefined : GOLD_GRADIENT }}
            className={`w-full h-13 flex items-center justify-center gap-2.5 text-[0.62rem] tracking-[0.25em] uppercase font-semibold transition-opacity duration-200 ${
              isLoading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'text-background hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
                Sending…
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </form>
      </div>

      {/* ── Error toasts ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 bg-rose-950 border border-rose-800/60 text-rose-300 text-[0.68rem] tracking-wide shadow-xl min-w-64 max-w-sm"
          >
            <X size={13} strokeWidth={2} className="shrink-0" />
            {t.message}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const inputCls =
  'w-full h-11 px-4 bg-transparent border border-border text-foreground text-[0.85rem] placeholder:text-muted-foreground/35 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-200 disabled:opacity-50';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label:     string;
  required?: boolean;
  hint?:     string;
  children:  React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.55rem] tracking-[0.2em] uppercase text-muted-foreground/60 flex items-center gap-1.5">
        {label}
        {required && <span className="text-accent">*</span>}
        {hint && <span className="text-muted-foreground/30 normal-case tracking-normal text-[0.52rem]">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
