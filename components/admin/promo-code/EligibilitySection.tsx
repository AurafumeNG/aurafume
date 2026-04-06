'use client';

import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import type { PromoDraft } from './types';
import {
  GOLD, inputBase, focusBorder, blurBorder,
  SectionCard, FieldLabel, ToggleRow, InlineInput, SelectInput, HelperText,
} from './shared';

// ── Email tag input ────────────────────────────────────────────────────────────

function EmailTagInput({
  emails,
  onChange,
}: {
  emails:   string[];
  onChange: (emails: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addEmail(raw: string) {
    const email = raw.trim().toLowerCase();
    if (!email || emails.includes(email)) { setInput(''); return; }
    onChange([...emails, email]);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(input);
    } else if (e.key === 'Backspace' && !input && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  }

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] p-2"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 h-5 pl-2 pr-1 text-[0.46rem] tracking-[0.06em]"
            style={{ background: 'rgba(180,130,60,0.12)', color: GOLD, border: '1px solid rgba(180,130,60,0.22)' }}
          >
            {email}
            <button
              type="button"
              onClick={() => onChange(emails.filter((e) => e !== email))}
              style={{ color: 'rgba(180,130,60,0.55)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(180,130,60,0.55)')}
            >
              <X size={9} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input) addEmail(input); }}
          placeholder={emails.length === 0 ? 'Type email and press Enter...' : 'Add more...'}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-[0.52rem] tracking-[0.04em] h-5"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        />
      </div>
      <HelperText>Press Enter or comma to add each email. {emails.length} customer{emails.length !== 1 ? 's' : ''} added.</HelperText>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function EligibilitySection({
  value,
  onChange,
}: {
  value:    PromoDraft;
  onChange: (p: Partial<PromoDraft>) => void;
}) {
  return (
    <SectionCard
      title="Eligibility Conditions"
      subtitle="All conditions must be met for the code to apply"
    >

      {/* Minimum Order Value */}
      <ToggleRow
        enabled={value.hasMinOrder}
        onToggle={() => onChange({ hasMinOrder: !value.hasMinOrder })}
        label="Require minimum order amount"
        sublabel={value.hasMinOrder ? undefined : 'No minimum — code applies to any order total'}
      >
        <div>
          <FieldLabel>Minimum Spend</FieldLabel>
          <InlineInput
            type="number"
            value={value.minOrderAmount}
            onChange={(v) => onChange({ minOrderAmount: Math.max(0, Number(v)) })}
            prefix="₦"
            min={0}
            style={{ width: '200px' }}
          />
          <HelperText>Customer must spend at least ₦{value.minOrderAmount.toLocaleString('en-NG')}</HelperText>
        </div>
      </ToggleRow>

      {/* Minimum Items */}
      <ToggleRow
        enabled={value.hasMinItems}
        onToggle={() => onChange({ hasMinItems: !value.hasMinItems })}
        label="Require minimum quantity"
        sublabel={value.hasMinItems ? undefined : 'No minimum — code applies regardless of item count'}
      >
        <div>
          <FieldLabel>Minimum Items in Cart</FieldLabel>
          <InlineInput
            type="number"
            value={value.minItems}
            onChange={(v) => onChange({ minItems: Math.max(1, Number(v)) })}
            suffix="items"
            min={1}
            style={{ width: '160px' }}
          />
        </div>
      </ToggleRow>

      {/* First Order Only */}
      <ToggleRow
        enabled={value.firstOrderOnly}
        onToggle={() => onChange({ firstOrderOnly: !value.firstOrderOnly })}
        label="Only for customers with no previous orders"
        sublabel="Verified at checkout against the customer's complete order history"
      />

      {/* New Customers Only */}
      <ToggleRow
        enabled={value.newCustomersOnly}
        onToggle={() => onChange({ newCustomersOnly: !value.newCustomersOnly })}
        label="Only for recently created accounts"
        sublabel={value.newCustomersOnly ? undefined : 'Available to all account ages'}
      >
        <div className="flex items-center gap-2">
          <span className="text-[0.52rem] tracking-[0.06em] shrink-0" style={{ color: 'rgba(255,255,255,0.42)' }}>
            Accounts created in the last
          </span>
          <InlineInput
            type="number"
            value={value.newCustomerDays}
            onChange={(v) => onChange({ newCustomerDays: Math.max(1, Number(v)) })}
            suffix="days"
            min={1}
            style={{ width: '110px' }}
          />
        </div>
      </ToggleRow>

      {/* Specific Customers */}
      <ToggleRow
        enabled={value.hasSpecificCustomers}
        onToggle={() => onChange({ hasSpecificCustomers: !value.hasSpecificCustomers })}
        label="Restrict to specific customers"
        sublabel={value.hasSpecificCustomers ? undefined : 'Available to all customers'}
      >
        <div className="space-y-3">
          <EmailTagInput
            emails={value.specificCustomerEmails}
            onChange={(emails) => onChange({ specificCustomerEmails: emails })}
          />
          <div className="flex items-center gap-3">
            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
            <span className="text-[0.44rem] tracking-[0.10em] uppercase shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>or</span>
            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 h-8 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-150"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; }}
            onClick={() => {
              // CSV upload: open file picker (placeholder - requires API)
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv,.txt';
              input.click();
            }}
          >
            <Upload size={11} strokeWidth={1.8} />
            Upload Customer Emails (.csv)
          </button>
        </div>
      </ToggleRow>

      {/* Required Products */}
      <ToggleRow
        enabled={value.hasRequiredProducts}
        onToggle={() => onChange({ hasRequiredProducts: !value.hasRequiredProducts })}
        label="Only valid when specific products are in cart"
        sublabel={value.hasRequiredProducts ? undefined : 'Valid with any products in cart'}
      >
        <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Product search will be available once connected to the products API.
          </p>
        </div>
      </ToggleRow>

      {/* Payment Method Restriction */}
      <ToggleRow
        enabled={value.hasPaymentRestriction}
        onToggle={() => onChange({ hasPaymentRestriction: !value.hasPaymentRestriction })}
        label="Restrict to specific payment method"
        sublabel={value.hasPaymentRestriction ? undefined : 'Valid with all payment methods'}
      >
        <div>
          <FieldLabel>Payment Method</FieldLabel>
          <SelectInput
            value={value.paymentRestriction}
            onChange={(v) => onChange({ paymentRestriction: v as PromoDraft['paymentRestriction'] })}
            options={[
              { value: 'all',           label: 'All Payment Methods'  },
              { value: 'paystack',      label: 'Paystack Only'        },
              { value: 'bank-transfer', label: 'Bank Transfer Only'   },
            ]}
          />
        </div>
      </ToggleRow>

    </SectionCard>
  );
}
