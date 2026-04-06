'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// ── Constants ──────────────────────────────────────────────────────────────────

export const GOLD = 'oklch(0.53 0.09 70)';

// ── Input styles ───────────────────────────────────────────────────────────────

export const inputBase: React.CSSProperties = {
  background: '#1A1A1A',
  border:     '1px solid rgba(255,255,255,0.07)',
  color:      'rgba(255,255,255,0.78)',
  outline:    'none',
  width:      '100%',
};

export function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
}

export function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = e.currentTarget.value
    ? 'rgba(180,130,60,0.20)'
    : 'rgba(255,255,255,0.07)';
}

// ── SectionCard ────────────────────────────────────────────────────────────────

export function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

// ── FieldLabel ─────────────────────────────────────────────────────────────────

export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-[0.50rem] tracking-[0.14em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {children}
        {required && <span className="ml-1" style={{ color: GOLD }}>*</span>}
      </label>
      {hint && (
        <span className="text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.20)' }}>{hint}</span>
      )}
    </div>
  );
}

// ── CharCount ──────────────────────────────────────────────────────────────────

export function CharCount({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const col = pct > 0.9 ? 'rgba(239,68,68,0.80)' : pct > 0.75 ? 'oklch(0.70 0.14 55)' : 'rgba(255,255,255,0.22)';
  return (
    <span className="text-[0.44rem] tracking-[0.06em] shrink-0" style={{ color: col }}>
      {current}/{max}
    </span>
  );
}

// ── FormToggle ─────────────────────────────────────────────────────────────────

export function FormToggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled:  boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={disabled ? undefined : onToggle}
      className="relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200"
      style={{
        background: enabled ? 'rgba(74,222,128,0.78)' : 'rgba(255,255,255,0.10)',
        cursor:     disabled ? 'not-allowed' : 'pointer',
        border:     `1px solid ${enabled ? 'rgba(74,222,128,0.40)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <span
        className="absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// ── ToggleRow ──────────────────────────────────────────────────────────────────

export function ToggleRow({
  enabled,
  onToggle,
  label,
  sublabel,
  disabled,
  children,
}: {
  enabled:   boolean;
  onToggle:  () => void;
  label:     string;
  sublabel?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="pt-0.5 shrink-0">
          <FormToggle enabled={enabled} onToggle={onToggle} disabled={disabled} />
        </div>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={disabled ? undefined : onToggle}
            className="text-left w-full"
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <p
              className="text-[0.56rem] tracking-[0.08em] font-medium leading-snug"
              style={{ color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.72)' }}
            >
              {label}
            </p>
            {sublabel && (
              <p className="mt-0.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {sublabel}
              </p>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {enabled && children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-3 ml-12 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── InlineInput ────────────────────────────────────────────────────────────────

export function InlineInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  min,
  max,
  step,
  style: extraStyle,
}: {
  type?:       string;
  value:       string | number;
  onChange:    (v: string) => void;
  placeholder?: string;
  prefix?:     string;
  suffix?:     string;
  min?:        number;
  max?:        number;
  step?:       number;
  style?:      React.CSSProperties;
}) {
  return (
    <div
      className="flex items-center gap-1.5 h-8 px-3"
      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)', ...extraStyle }}
    >
      {prefix && <span className="text-[0.50rem] tracking-[0.06em] shrink-0" style={{ color: 'rgba(255,255,255,0.28)' }}>{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="flex-1 bg-transparent outline-none text-[0.56rem] tracking-[0.06em] tabular-nums min-w-0"
        style={{ color: 'rgba(255,255,255,0.78)' }}
        onFocus={focusBorder as React.FocusEventHandler<HTMLInputElement>}
        onBlur={blurBorder   as React.FocusEventHandler<HTMLInputElement>}
      />
      {suffix && <span className="text-[0.50rem] tracking-[0.06em] shrink-0" style={{ color: 'rgba(255,255,255,0.28)' }}>{suffix}</span>}
    </div>
  );
}

// ── SelectInput ────────────────────────────────────────────────────────────────

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value:    string;
  onChange: (v: string) => void;
  options:  { value: string; label: string }[];
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-8 px-3 text-[0.54rem] tracking-[0.06em] outline-none appearance-none w-full"
      style={{
        background:   '#1A1A1A',
        border:       `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
        color:        'rgba(255,255,255,0.72)',
        colorScheme:  'dark',
        cursor:       'pointer',
      }}
      onFocus={focusBorder as React.FocusEventHandler<HTMLSelectElement>}
      onBlur={blurBorder   as React.FocusEventHandler<HTMLSelectElement>}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ── HelperText ─────────────────────────────────────────────────────────────────

export function HelperText({ children, color = 'muted' }: { children: React.ReactNode; color?: 'muted' | 'gold' | 'green' | 'red' }) {
  const colorMap = {
    muted: 'rgba(255,255,255,0.28)',
    gold:  GOLD,
    green: 'rgba(74,222,128,0.80)',
    red:   'rgba(239,68,68,0.80)',
  };
  return (
    <p className="text-[0.48rem] tracking-[0.06em] mt-1.5" style={{ color: colorMap[color] }}>
      {children}
    </p>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />;
}
