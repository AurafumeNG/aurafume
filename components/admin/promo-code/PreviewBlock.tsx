'use client';

import { useMemo } from 'react';
import { Tag } from 'lucide-react';
import type { PromoDraft } from './types';
import { GOLD, SectionCard } from './shared';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDate(str: string) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Preview logic ──────────────────────────────────────────────────────────────

interface Preview {
  code:       string;
  label:      string;
  discount:   string;
  conditions: string[];
  expiry:     string | null;
  isEmpty:    boolean;
}

function buildPreview(d: PromoDraft): Preview {
  const code  = d.code  || 'CODE';
  const label = d.label || 'Promo';
  const isEmpty = !d.code && !d.label;

  // Discount line
  let discount = '';
  switch (d.discountType) {
    case 'pct':
      discount = `${d.pctValue}% off${d.applyTo === 'order' ? ' your order' : ' selected items'}`;
      if (d.hasPctCap && d.pctCap > 0) discount += ` (max ${formatNaira(d.pctCap)})`;
      break;
    case 'flat':
      discount = `${formatNaira(d.flatValue)} off${d.applyTo === 'order' ? ' your order' : ''}`;
      break;
    case 'free-shipping':
      discount = 'Free delivery';
      break;
    case 'buy-x-get-y': {
      const off = d.getDiscount === 'free' ? '100% off' : d.getDiscount === 'half' ? '50% off' : `${d.getCustomPct}% off`;
      discount = `Buy ${d.buyX} get ${d.getY} at ${off}`;
      break;
    }
  }

  // Conditions
  const conds: string[] = [];
  if (d.hasMinOrder   && d.minOrderAmount > 0)  conds.push(`Min spend ${formatNaira(d.minOrderAmount)}`);
  if (d.hasMinItems   && d.minItems > 0)         conds.push(`Min ${d.minItems} items`);
  if (d.firstOrderOnly)                          conds.push('First order only');
  if (d.newCustomersOnly)                        conds.push(`New customers (≤${d.newCustomerDays}d)`);
  if (d.hasSpecificCustomers && d.specificCustomerEmails.length > 0)
    conds.push(`${d.specificCustomerEmails.length} specific customers`);
  if (d.hasPaymentRestriction && d.paymentRestriction !== 'all')
    conds.push(d.paymentRestriction === 'paystack' ? 'Paystack only' : 'Bank transfer only');

  // Expiry
  const expiry = d.hasExpiry && d.expiresAt ? `Valid until ${formatDate(d.expiresAt)}` : null;

  return { code, label, discount, conditions: conds, expiry, isEmpty };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PreviewBlock({ value }: { value: PromoDraft }) {
  const preview = useMemo(() => buildPreview(value), [value]);

  return (
    <SectionCard title="Code Preview" subtitle="Live preview — updates as you fill in the form">

      {/* Checkout card */}
      <div
        className="relative overflow-hidden"
        style={{
          background:    'linear-gradient(135deg, rgba(180,130,60,0.06) 0%, rgba(180,130,60,0.02) 100%)',
          border:        '1px solid rgba(180,130,60,0.22)',
          padding:       '16px',
        }}
      >
        {/* Dashed left bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: 'repeating-linear-gradient(to bottom, rgba(180,130,60,0.55) 0px, rgba(180,130,60,0.55) 6px, transparent 6px, transparent 12px)' }}
        />

        <div className="pl-3">
          {/* Code badge */}
          <div className="flex items-center gap-2 mb-3">
            <Tag size={13} strokeWidth={1.8} style={{ color: GOLD, flexShrink: 0 }} />
            <span
              className="text-[0.64rem] tracking-[0.20em] font-bold font-mono"
              style={{ color: preview.isEmpty ? 'rgba(255,255,255,0.20)' : GOLD }}
            >
              {preview.code}
            </span>
          </div>

          {/* Label */}
          <p
            className="text-[0.56rem] tracking-[0.06em] font-medium mb-1"
            style={{ color: preview.isEmpty ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)' }}
          >
            {preview.label}
          </p>

          {/* Discount */}
          <p
            className="text-[0.52rem] tracking-[0.04em] mb-2"
            style={{ color: preview.isEmpty ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)' }}
          >
            {preview.discount}
          </p>

          {/* Conditions */}
          {preview.conditions.length > 0 && (
            <p className="text-[0.44rem] tracking-[0.06em] mb-2" style={{ color: 'rgba(255,255,255,0.30)' }}>
              {preview.conditions.join(' · ')}
            </p>
          )}

          {/* Expiry */}
          {preview.expiry && (
            <p className="text-[0.44rem] tracking-[0.08em] uppercase font-medium" style={{ color: 'rgba(180,130,60,0.55)' }}>
              {preview.expiry}
            </p>
          )}

          {preview.isEmpty && (
            <p className="text-[0.46rem] tracking-[0.10em] uppercase mt-1" style={{ color: 'rgba(255,255,255,0.14)' }}>
              Fill in the form to see a preview
            </p>
          )}
        </div>
      </div>

      {/* Context note */}
      <p className="text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
        This is how the code will appear to customers at checkout.
      </p>

    </SectionCard>
  );
}
