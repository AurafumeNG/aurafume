'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check }          from 'lucide-react';
import type { ProductDraft }           from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const FAMILIES     = ['Floral', 'Woody', 'Fresh', 'Oriental', 'Citrus', 'Aquatic', 'Gourmand'];
const CONCENTRATIONS = [
  { value: 'edp',     label: 'Eau de Parfum (EDP)'     },
  { value: 'edt',     label: 'Eau de Toilette (EDT)'    },
  { value: 'extrait', label: 'Parfum / Extrait'         },
  { value: 'edc',     label: 'Eau de Cologne (EDC)'     },
];
const GENDERS      = ['Unisex', 'Him', 'Her'] as const;
const LONGEVITIES  = ['2–4 hrs', '4–6 hrs', '6–8 hrs', '8–12 hrs', '12 hrs+'];
const SILLAGES     = ['Intimate', 'Soft', 'Moderate', 'Strong', 'Massive'];
const SEASONS      = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Season'];
const OCCASIONS    = ['Daily', 'Office', 'Evening', 'Special Occasion', 'Casual', 'Sport', 'Date Night'];

const inputBase: React.CSSProperties = {
  background: '#1A1A1A',
  border:     '1px solid rgba(255,255,255,0.07)',
  color:      'rgba(255,255,255,0.78)',
  outline:    'none',
};

// ── Shared sub-components ──────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[0.50rem] tracking-[0.14em] uppercase font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
      {children}
      {required && <span className="ml-1" style={{ color: GOLD }}>*</span>}
    </label>
  );
}

// ── Single-select Dropdown ─────────────────────────────────────────────────────

function SingleSelect({
  value, placeholder, options, onChange,
}: {
  value:       string;
  placeholder: string;
  options:     { value: string; label: string }[];
  onChange:    (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const selected        = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-9 px-3 flex items-center justify-between text-[0.56rem] tracking-[0.06em] transition-colors duration-150"
        style={{
          ...inputBase,
          color: selected ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.28)',
          borderColor: open ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={12} strokeWidth={2}
          style={{ color: 'rgba(255,255,255,0.28)', transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      </button>
      {open && (
        <div
          className="absolute z-20 left-0 right-0 top-[calc(100%+3px)] py-1"
          style={{
            background: '#1E1E1E',
            border:     '1px solid rgba(255,255,255,0.10)',
            boxShadow:  '0 8px 24px rgba(0,0,0,0.45)',
            maxHeight:  '200px',
            overflowY:  'auto',
          }}
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[0.54rem] tracking-[0.06em] transition-colors duration-100"
                style={{
                  color:      isSelected ? GOLD : 'rgba(255,255,255,0.55)',
                  background: isSelected ? 'rgba(180,130,60,0.08)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span className="w-3 text-center shrink-0">
                  {isSelected && <Check size={10} strokeWidth={2.5} style={{ color: GOLD }} />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Multi-select Dropdown ──────────────────────────────────────────────────────

function MultiSelect({
  values, options, placeholder, onChange,
}: {
  values:      string[];
  options:     string[];
  placeholder: string;
  onChange:    (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function toggle(opt: string) {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[36px] px-3 py-1.5 flex items-start justify-between gap-2 text-[0.56rem] tracking-[0.06em] transition-colors duration-150"
        style={{
          ...inputBase,
          borderColor: open ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
        }}
      >
        <span className="flex flex-wrap gap-1 flex-1 min-w-0">
          {values.length === 0
            ? <span style={{ color: 'rgba(255,255,255,0.28)' }}>{placeholder}</span>
            : values.map(v => (
                <span
                  key={v}
                  className="inline-flex items-center px-1.5 h-5 text-[0.44rem] tracking-[0.08em] font-medium"
                  style={{ background: 'rgba(180,130,60,0.14)', color: GOLD, borderRadius: '2px' }}
                >
                  {v}
                </span>
              ))
          }
        </span>
        <ChevronDown
          size={12} strokeWidth={2}
          style={{ color: 'rgba(255,255,255,0.28)', transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.15s', flexShrink: 0, marginTop: '2px' }}
        />
      </button>
      {open && (
        <div
          className="absolute z-20 left-0 right-0 top-[calc(100%+3px)] py-1"
          style={{
            background: '#1E1E1E',
            border:     '1px solid rgba(255,255,255,0.10)',
            boxShadow:  '0 8px 24px rgba(0,0,0,0.45)',
            maxHeight:  '220px',
            overflowY:  'auto',
          }}
        >
          {options.map(opt => {
            const isSelected = values.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[0.54rem] tracking-[0.06em] transition-colors duration-100"
                style={{
                  color:      isSelected ? GOLD : 'rgba(255,255,255,0.55)',
                  background: isSelected ? 'rgba(180,130,60,0.08)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {/* Checkbox */}
                <span
                  className="flex items-center justify-center w-3.5 h-3.5 shrink-0"
                  style={{
                    background:   isSelected ? GOLD : 'transparent',
                    border:       isSelected ? 'none' : '1px solid rgba(255,255,255,0.20)',
                    borderRadius: '2px',
                  }}
                >
                  {isSelected && <Check size={8} strokeWidth={3} style={{ color: 'oklch(0.10 0 0)' }} />}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Pill Selector ──────────────────────────────────────────────────────────────

function PillSelect({
  value, options, onChange,
}: {
  value:    string;
  options:  readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? '' : opt)}
            className="h-7 px-3 text-[0.50rem] tracking-[0.12em] font-medium transition-colors duration-150"
            style={{
              background:   active ? 'rgba(180,130,60,0.16)' : 'rgba(255,255,255,0.04)',
              color:        active ? GOLD : 'rgba(255,255,255,0.42)',
              border:       active ? `1px solid rgba(180,130,60,0.35)` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '3px',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Multi-Pill Selector ────────────────────────────────────────────────────────

function MultiPill({
  values, options, onChange,
}: {
  values:   string[];
  options:  string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="h-7 px-3 text-[0.50rem] tracking-[0.12em] font-medium transition-colors duration-150"
            style={{
              background:   active ? 'rgba(180,130,60,0.16)' : 'rgba(255,255,255,0.04)',
              color:        active ? GOLD : 'rgba(255,255,255,0.42)',
              border:       active ? `1px solid rgba(180,130,60,0.35)` : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '3px',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Text Input ─────────────────────────────────────────────────────────────────

function TextInput({ value, placeholder, onChange, type = 'text' }: {
  value:       string;
  placeholder: string;
  onChange:    (v: string) => void;
  type?:       string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="h-9 px-3 text-[0.56rem] tracking-[0.04em] w-full transition-colors duration-150"
      style={inputBase}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
      onBlur={e  => { e.currentTarget.style.borderColor = e.currentTarget.value ? 'rgba(180,130,60,0.20)' : 'rgba(255,255,255,0.07)'; }}
    />
  );
}

// ── Two-column grid helper ─────────────────────────────────────────────────────

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

// ── FragranceDetailsSection ────────────────────────────────────────────────────

type FragranceFields = Pick<
  ProductDraft,
  | 'fragranceFamilies' | 'concentration' | 'gender'
  | 'origin' | 'launchYear' | 'longevity' | 'sillage'
  | 'seasons' | 'occasions'
>;

interface FragranceDetailsProps {
  value:    FragranceFields;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function FragranceDetailsSection({ value, onChange }: FragranceDetailsProps) {
  return (
    <SectionCard title="Fragrance Details">

      {/* Family */}
      <div>
        <FieldLabel required>Fragrance Family / Category</FieldLabel>
        <MultiSelect
          values={value.fragranceFamilies}
          options={FAMILIES}
          placeholder="Select one or more families…"
          onChange={fragranceFamilies => onChange({ fragranceFamilies })}
        />
        {value.fragranceFamilies.length > 0 && (
          <p className="mt-1.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            First selection is the primary category.
          </p>
        )}
      </div>

      {/* Concentration */}
      <div>
        <FieldLabel required>Concentration</FieldLabel>
        <SingleSelect
          value={value.concentration}
          placeholder="Select concentration…"
          options={CONCENTRATIONS}
          onChange={concentration => onChange({ concentration })}
        />
      </div>

      {/* Gender */}
      <div>
        <FieldLabel required>Gender</FieldLabel>
        <PillSelect
          value={value.gender}
          options={GENDERS}
          onChange={gender => onChange({ gender })}
        />
      </div>

      {/* Origin + Launch Year */}
      <Grid2>
        <div>
          <FieldLabel>Origin / Made In</FieldLabel>
          <TextInput
            value={value.origin}
            placeholder="e.g., France"
            onChange={origin => onChange({ origin })}
          />
        </div>
        <div>
          <FieldLabel>Launch Year</FieldLabel>
          <TextInput
            value={value.launchYear}
            placeholder="e.g., 2024"
            type="number"
            onChange={launchYear => onChange({ launchYear })}
          />
        </div>
      </Grid2>

      {/* Longevity + Sillage */}
      <Grid2>
        <div>
          <FieldLabel>Longevity</FieldLabel>
          <SingleSelect
            value={value.longevity}
            placeholder="Select longevity…"
            options={LONGEVITIES.map(l => ({ value: l, label: l }))}
            onChange={longevity => onChange({ longevity })}
          />
        </div>
        <div>
          <FieldLabel>Sillage / Projection</FieldLabel>
          <SingleSelect
            value={value.sillage}
            placeholder="Select sillage…"
            options={SILLAGES.map(s => ({ value: s, label: s }))}
            onChange={sillage => onChange({ sillage })}
          />
        </div>
      </Grid2>

      {/* Seasons */}
      <div>
        <FieldLabel>Season</FieldLabel>
        <MultiPill
          values={value.seasons}
          options={SEASONS}
          onChange={seasons => onChange({ seasons })}
        />
      </div>

      {/* Occasions */}
      <div>
        <FieldLabel>Occasion</FieldLabel>
        <MultiPill
          values={value.occasions}
          options={OCCASIONS}
          onChange={occasions => onChange({ occasions })}
        />
      </div>

    </SectionCard>
  );
}
