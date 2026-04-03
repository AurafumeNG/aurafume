'use client';

import { useState }             from 'react';
import { FileText, Globe, Archive, Calendar } from 'lucide-react';
import type { ProductDraft }    from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.50rem] tracking-[0.14em] uppercase font-medium mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
      {children}
    </p>
  );
}

// ── Toggle Switch ──────────────────────────────────────────────────────────────

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

// ── Status Radio Cards ─────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: ProductDraft['status'];
  label: string;
  hint:  string;
  icon:  React.ReactNode;
  color: string;
}[] = [
  {
    value: 'draft',
    label: 'Draft',
    hint:  'Not visible to customers',
    icon:  <FileText size={14} strokeWidth={1.8} />,
    color: 'rgba(255,255,255,0.38)',
  },
  {
    value: 'published',
    label: 'Published',
    hint:  'Live on store',
    icon:  <Globe size={14} strokeWidth={1.8} />,
    color: 'rgba(74,222,128,0.82)',
  },
  {
    value: 'archived',
    label: 'Archived',
    hint:  'Hidden, data preserved',
    icon:  <Archive size={14} strokeWidth={1.8} />,
    color: 'rgba(239,68,68,0.70)',
  },
];

function StatusRadio({
  value, onChange,
}: {
  value:    ProductDraft['status'];
  onChange: (v: ProductDraft['status']) => void;
}) {
  return (
    <div className="space-y-2">
      {STATUS_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150"
            style={{
              background:   active ? 'rgba(180,130,60,0.08)' : 'rgba(255,255,255,0.02)',
              border:       active ? `1px solid rgba(180,130,60,0.28)` : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '3px',
              textAlign:    'left',
            }}
          >
            {/* Radio dot */}
            <span
              className="flex items-center justify-center w-3.5 h-3.5 rounded-full shrink-0"
              style={{
                border:     active ? 'none' : '1.5px solid rgba(255,255,255,0.22)',
                background: active ? GOLD : 'transparent',
              }}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'oklch(0.10 0 0)' }} />}
            </span>

            {/* Icon */}
            <span style={{ color: active ? GOLD : opt.color }}>{opt.icon}</span>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[0.54rem] tracking-[0.08em] font-medium" style={{ color: active ? GOLD : 'rgba(255,255,255,0.62)' }}>
                {opt.label}
              </p>
              <p className="text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {opt.hint}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />;
}

// ── StatusSection ─────────────────────────────────────────────────────────────

type StatusFields = Pick<
  ProductDraft,
  | 'status' | 'visibleInShop' | 'isFeatured' | 'isNewArrival'
  | 'isBestSeller' | 'scheduleEnabled' | 'scheduleDate' | 'scheduleTime'
>;

interface StatusSectionProps {
  value:    StatusFields;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function StatusSection({ value, onChange }: StatusSectionProps) {
  const inputStyle: React.CSSProperties = {
    background:   '#1A1A1A',
    border:       '1px solid rgba(255,255,255,0.07)',
    color:        'rgba(255,255,255,0.78)',
    outline:      'none',
    width:        '100%',
    borderRadius: '2px',
  };

  return (
    <SectionCard title="Status &amp; Visibility">

      {/* Status radio */}
      <div>
        <FieldLabel>Status</FieldLabel>
        <StatusRadio value={value.status} onChange={status => onChange({ status })} />
      </div>

      <Divider />

      {/* Visibility */}
      <Toggle
        checked={value.visibleInShop}
        onChange={visibleInShop => onChange({ visibleInShop })}
        label="Visible in shop"
        hint="Controls listing visibility in /shop"
      />

      <Divider />

      {/* Feature badges */}
      <div className="space-y-4">
        <Toggle
          checked={value.isFeatured}
          onChange={isFeatured => onChange({ isFeatured })}
          label="Featured Product"
          hint="Appears on homepage featured section"
        />
        <Toggle
          checked={value.isNewArrival}
          onChange={isNewArrival => onChange({ isNewArrival })}
          label='New Arrival badge'
          hint='Shows "New" badge on product card'
        />
        <Toggle
          checked={value.isBestSeller}
          onChange={isBestSeller => onChange({ isBestSeller })}
          label='Best Seller badge'
          hint='Shows "Best Seller" badge on product card'
        />
      </div>

      <Divider />

      {/* Schedule publish */}
      <div className="space-y-3">
        <Toggle
          checked={value.scheduleEnabled}
          onChange={scheduleEnabled => onChange({ scheduleEnabled })}
          label="Schedule Publish"
          hint="Publish automatically at a specific date & time"
        />
        {value.scheduleEnabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[0.46rem] tracking-[0.12em] uppercase font-medium mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Date
              </label>
              <input
                type="date"
                value={value.scheduleDate}
                onChange={e => onChange({ scheduleDate: e.target.value })}
                className="h-8 px-2.5 text-[0.52rem] tracking-[0.04em] transition-colors duration-150"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              />
            </div>
            <div>
              <label className="block text-[0.46rem] tracking-[0.12em] uppercase font-medium mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Time
              </label>
              <input
                type="time"
                value={value.scheduleTime}
                onChange={e => onChange({ scheduleTime: e.target.value })}
                className="h-8 px-2.5 text-[0.52rem] tracking-[0.04em] transition-colors duration-150"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
              />
            </div>
          </div>
        )}
        {value.scheduleEnabled && value.scheduleDate && value.scheduleTime && (
          <div className="flex items-center gap-2">
            <Calendar size={11} strokeWidth={1.8} style={{ color: GOLD, flexShrink: 0 }} />
            <p className="text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Publishes automatically on{' '}
              <span style={{ color: GOLD }}>
                {new Date(`${value.scheduleDate}T${value.scheduleTime}`).toLocaleString('en-NG', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </p>
          </div>
        )}
      </div>

    </SectionCard>
  );
}
