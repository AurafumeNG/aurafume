'use client';

import { useState }          from 'react';
import { ChevronDown }       from 'lucide-react';
import type { ProductDraft } from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const inputBase: React.CSSProperties = {
  background:   '#1A1A1A',
  border:       '1px solid rgba(255,255,255,0.07)',
  color:        'rgba(255,255,255,0.78)',
  outline:      'none',
  borderRadius: '2px',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function AccordionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between transition-colors duration-150"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <h2 className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {title}
        </h2>
        <ChevronDown
          size={14} strokeWidth={1.8}
          style={{
            color:      'rgba(255,255,255,0.30)',
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.20s',
          }}
        />
      </button>
      {open && <div className="p-5 space-y-5">{children}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[0.50rem] tracking-[0.14em] uppercase font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
      {children}
    </label>
  );
}

function NumInput({
  value, placeholder, onChange, suffix,
}: {
  value:       string;
  placeholder: string;
  onChange:    (v: string) => void;
  suffix?:     string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        min={0}
        onChange={e => onChange(e.target.value)}
        className="h-9 px-3 text-[0.56rem] tracking-[0.04em] w-full transition-colors duration-150"
        style={{ ...inputBase, paddingRight: suffix ? '2.2rem' : undefined }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
      />
      {suffix && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.46rem] tracking-[0.08em] pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.28)' }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function Toggle({
  checked, onChange, label, hint,
}: {
  checked:  boolean;
  onChange: (v: boolean) => void;
  label:    string;
  hint?:    string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5 flex-1">
        <p className="text-[0.54rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.62)' }}>{label}</p>
        {hint && <p className="text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.25)' }}>{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex items-center shrink-0 transition-colors duration-200"
        style={{
          width:        '36px',
          height:       '20px',
          borderRadius: '10px',
          background:   checked ? GOLD : 'rgba(255,255,255,0.12)',
          marginTop:    '1px',
        }}
      >
        <span
          className="absolute transition-transform duration-200"
          style={{
            width:        '14px',
            height:       '14px',
            borderRadius: '50%',
            background:   'white',
            top:          '3px',
            left:         '3px',
            transform:    checked ? 'translateX(16px)' : 'translateX(0)',
            boxShadow:    '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>
    </div>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />;
}

// ── ShippingSection ────────────────────────────────────────────────────────────

type ShippingFields = Pick<
  ProductDraft,
  'weight' | 'dimL' | 'dimW' | 'dimH' | 'isFragile' | 'specialPackaging'
>;

interface ShippingSectionProps {
  value:    ShippingFields;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function ShippingSection({ value, onChange }: ShippingSectionProps) {
  return (
    <AccordionCard title="Shipping">

      {/* Weight */}
      <div>
        <FieldLabel>Weight</FieldLabel>
        <NumInput
          value={value.weight}
          placeholder="0"
          onChange={weight => onChange({ weight })}
          suffix="g"
        />
        <p className="mt-1.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.20)' }}>
          Used for shipping cost calculation
        </p>
      </div>

      {/* Dimensions */}
      <div>
        <FieldLabel>Dimensions (cm)</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[0.42rem] tracking-[0.10em] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Length</p>
            <NumInput value={value.dimL} placeholder="L" onChange={dimL => onChange({ dimL })} />
          </div>
          <div>
            <p className="text-[0.42rem] tracking-[0.10em] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Width</p>
            <NumInput value={value.dimW} placeholder="W" onChange={dimW => onChange({ dimW })} />
          </div>
          <div>
            <p className="text-[0.42rem] tracking-[0.10em] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Height</p>
            <NumInput value={value.dimH} placeholder="H" onChange={dimH => onChange({ dimH })} />
          </div>
        </div>
      </div>

      <Divider />

      {/* Fragile toggle */}
      <Toggle
        checked={value.isFragile}
        onChange={isFragile => onChange({ isFragile })}
        label="Fragile Item"
        hint="Triggers special handling flag during fulfilment"
      />

      {/* Special packaging toggle */}
      <Toggle
        checked={value.specialPackaging}
        onChange={specialPackaging => onChange({ specialPackaging })}
        label="Requires Special Packaging"
        hint="e.g., gift box, bubble wrap, temperature control"
      />

    </AccordionCard>
  );
}
