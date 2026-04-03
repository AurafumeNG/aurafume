'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Home, Briefcase, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AddressData {
  _id: string;
  label: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

type LabelPreset = 'Home' | 'Work' | 'Other';

interface FormState {
  preset:      LabelPreset;
  customLabel: string;
  street:      string;
  apt:         string;
  city:        string;
  state:       string;
  postalCode:  string;
  country:     string;
  isDefault:   boolean;
}

interface FormErrors {
  street?:     string;
  city?:       string;
  state?:      string;
  postalCode?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

const GOLD = 'oklch(0.72 0.10 74)';

const PRESETS: { value: LabelPreset; icon: React.ElementType }[] = [
  { value: 'Home', icon: Home      },
  { value: 'Work', icon: Briefcase },
  { value: 'Other', icon: MapPin   },
];

// ── Helper — derive preset from stored label ───────────────────────────────────
function labelToPreset(label: string): { preset: LabelPreset; customLabel: string } {
  if (label === 'Home' || label === 'Work') return { preset: label, customLabel: '' };
  return { preset: 'Other', customLabel: label };
}

// ── Empty form ─────────────────────────────────────────────────────────────────
const EMPTY_FORM: FormState = {
  preset: 'Home', customLabel: '', street: '', apt: '',
  city: '', state: '', postalCode: '', country: 'Nigeria', isDefault: false,
};

// ── Field wrapper ──────────────────────────────────────────────────────────────
function Field({
  label, optional, error, children,
}: {
  label: string; optional?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.54rem] tracking-[0.18em] uppercase font-medium text-muted-foreground/70">
        {label}
        {optional && (
          <span className="ml-1.5 text-muted-foreground/40 normal-case tracking-normal text-[0.5rem]">
            (optional)
          </span>
        )}
      </p>
      {children}
      {error && (
        <p className="text-[0.5rem] tracking-[0.06em] text-rose-500">{error}</p>
      )}
    </div>
  );
}

const inputCls =
  'h-10 w-full border border-border/60 bg-background px-3 text-[0.72rem] tracking-[0.03em] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:border-foreground/40 transition-colors duration-150';

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{ background: checked ? GOLD : 'oklch(0.8 0 0)' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// ── Drag-to-dismiss handle ─────────────────────────────────────────────────────
const DISMISS_THRESHOLD = 90; // px

function useDragDismiss(onClose: () => void, sheetRef: React.RefObject<HTMLDivElement | null>) {
  const startY   = useRef(0);
  const dragging = useRef(false);
  const frame    = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startY.current   = e.clientY;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !sheetRef.current) return;
    const delta = Math.max(0, e.clientY - startY.current);
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (sheetRef.current) {
        sheetRef.current.style.transform  = `translateY(${delta}px)`;
        sheetRef.current.style.transition = 'none';
      }
    });
  }, [sheetRef]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (frame.current) cancelAnimationFrame(frame.current);
    const delta = Math.max(0, e.clientY - startY.current);
    if (delta > DISMISS_THRESHOLD) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)';
      sheetRef.current.style.transform  = 'translateY(0)';
    }
  }, [onClose, sheetRef]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

// ── Main component ─────────────────────────────────────────────────────────────
interface AddressSheetProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSaved:  (addresses: AddressData[]) => void;
  initial?: AddressData;   // undefined = add mode; defined = edit mode
}

export default function AddressSheet({
  isOpen, onClose, onSaved, initial,
}: AddressSheetProps) {
  const isEdit  = !!initial;
  const sheetRef = useRef<HTMLDivElement>(null);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form,    setForm]    = useState<FormState>(EMPTY_FORM);
  const [errors,  setErrors]  = useState<FormErrors>({});
  const [apiErr,  setApiErr]  = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill when editing or reset when adding
  useEffect(() => {
    if (isOpen) {
      if (initial) {
        const { preset, customLabel } = labelToPreset(initial.label);
        setForm({
          preset,
          customLabel,
          street:     initial.street      ?? '',
          apt:        initial.apt         ?? '',
          city:       initial.city        ?? '',
          state:      initial.state       ?? '',
          postalCode: initial.postalCode  ?? '',
          country:    initial.country     ?? 'Nigeria',
          isDefault:  initial.isDefault,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setApiErr('');
    }
  }, [isOpen, initial]);

  // Scroll-lock body while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const drag = useDragDismiss(onClose, sheetRef);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  // ── Validate ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.street.trim())     errs.street     = 'Street address is required';
    if (!form.city.trim())       errs.city       = 'City is required';
    if (!form.state)             errs.state      = 'Please select a state';
    if (!form.postalCode.trim()) errs.postalCode = 'Postal code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const label = form.preset === 'Other'
      ? (form.customLabel.trim() || 'Other')
      : form.preset;

    const body = {
      label,
      street:     form.street.trim(),
      apt:        form.apt.trim() || undefined,
      city:       form.city.trim(),
      state:      form.state,
      postalCode: form.postalCode.trim(),
      country:    form.country.trim() || 'Nigeria',
      isDefault:  form.isDefault,
    };

    setLoading(true);
    setApiErr('');

    try {
      const url    = isEdit ? `/api/addresses/${initial!._id}` : '/api/addresses';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { success?: boolean; error?: string; data?: AddressData[] };

      if (!res.ok || !json.success) {
        setApiErr(json.error ?? 'Something went wrong. Please try again.');
        return;
      }

      onSaved(json.data ?? []);
      onClose();
    } catch {
      setApiErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 0.9 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl max-h-[93dvh] flex flex-col shadow-2xl sm:max-w-lg sm:mx-auto sm:rounded-t-2xl"
          >
            {/* Drag handle */}
            <div
              className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              {...drag}
            >
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-4 border-b border-border/40">
              <h2 className="font-heading text-[0.9rem] tracking-[0.18em] uppercase text-foreground">
                {isEdit ? 'Edit Address' : 'New Address'}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Scrollable form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
            >
              {/* API error */}
              {apiErr && (
                <p className="text-[0.58rem] tracking-[0.06em] text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5 border border-rose-200 dark:border-rose-800/40">
                  {apiErr}
                </p>
              )}

              {/* ── Address Label ── */}
              <Field label="Address Label">
                <div className="flex gap-2">
                  {PRESETS.map(({ value, icon: Icon }) => {
                    const active = form.preset === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, preset: value }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 h-10 border text-[0.58rem] tracking-[0.12em] uppercase font-medium transition-all duration-150 ${
                          active
                            ? 'border-foreground/70 text-foreground bg-foreground/5'
                            : 'border-border/50 text-muted-foreground/60 hover:border-border hover:text-foreground'
                        }`}
                        style={active ? { borderColor: GOLD, color: GOLD } : undefined}
                      >
                        <Icon size={12} strokeWidth={1.8} />
                        {value}
                      </button>
                    );
                  })}
                </div>
                {form.preset === 'Other' && (
                  <input
                    type="text"
                    placeholder="e.g. Parents' home, Gym…"
                    value={form.customLabel}
                    onChange={set('customLabel')}
                    maxLength={32}
                    className={`${inputCls} mt-2`}
                  />
                )}
              </Field>

              {/* ── Street Address ── */}
              <Field label="Street Address" error={errors.street}>
                <input
                  type="text"
                  placeholder="14 Admiralty Way"
                  value={form.street}
                  onChange={e => {
                    set('street')(e);
                    if (errors.street) setErrors(p => ({ ...p, street: undefined }));
                  }}
                  className={`${inputCls} ${errors.street ? 'border-rose-400 focus:border-rose-400' : ''}`}
                />
              </Field>

              {/* ── Apt / Suite ── */}
              <Field label="Apartment / Suite" optional>
                <input
                  type="text"
                  placeholder="Flat 3B, Block C…"
                  value={form.apt}
                  onChange={set('apt')}
                  className={inputCls}
                />
              </Field>

              {/* ── City + State ── */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" error={errors.city}>
                  <input
                    type="text"
                    placeholder="Lekki"
                    value={form.city}
                    onChange={e => {
                      set('city')(e);
                      if (errors.city) setErrors(p => ({ ...p, city: undefined }));
                    }}
                    className={`${inputCls} ${errors.city ? 'border-rose-400 focus:border-rose-400' : ''}`}
                  />
                </Field>

                <Field label="State" error={errors.state}>
                  <select
                    value={form.state}
                    onChange={e => {
                      set('state')(e);
                      if (errors.state) setErrors(p => ({ ...p, state: undefined }));
                    }}
                    className={`${inputCls} cursor-pointer appearance-none ${
                      errors.state ? 'border-rose-400 focus:border-rose-400' : ''
                    } ${!form.state ? 'text-muted-foreground/35' : ''}`}
                  >
                    <option value="" disabled>Select…</option>
                    {NIGERIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* ── Postal Code + Country ── */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Postal Code" error={errors.postalCode}>
                  <input
                    type="text"
                    placeholder="100001"
                    value={form.postalCode}
                    onChange={e => {
                      set('postalCode')(e);
                      if (errors.postalCode) setErrors(p => ({ ...p, postalCode: undefined }));
                    }}
                    inputMode="numeric"
                    maxLength={10}
                    className={`${inputCls} ${errors.postalCode ? 'border-rose-400 focus:border-rose-400' : ''}`}
                  />
                </Field>

                <Field label="Country">
                  <input
                    type="text"
                    value={form.country}
                    onChange={set('country')}
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* ── Set as Default ── */}
              <div className="flex items-center justify-between py-3 border-t border-b border-border/40">
                <div>
                  <p className="text-[0.62rem] tracking-[0.06em] font-medium text-foreground">
                    Set as default address
                  </p>
                  <p className="text-[0.52rem] tracking-[0.04em] text-muted-foreground/55 mt-0.5">
                    Used automatically at checkout
                  </p>
                </div>
                <Toggle
                  checked={form.isDefault}
                  onChange={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}
                />
              </div>

              {/* ── Actions ── */}
              <div className="space-y-2.5 pb-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center text-[0.6rem] tracking-[0.22em] uppercase font-medium bg-foreground text-background disabled:opacity-50 transition-opacity duration-200"
                >
                  {loading ? 'Saving…' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-11 flex items-center justify-center text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
