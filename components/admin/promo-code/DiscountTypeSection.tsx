'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { PromoDraft, PromoDiscountType, PromoApplyTo, PromoGetDiscount } from './types';
import {
  GOLD, inputBase, focusBorder, blurBorder,
  SectionCard, FieldLabel, HelperText, InlineInput, SelectInput, FormToggle,
} from './shared';

// ── Type Card ──────────────────────────────────────────────────────────────────

function TypeCard({
  icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon:        string;
  title:       string;
  description: string;
  selected:    boolean;
  onSelect:    () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-start gap-3 w-full p-4 text-left transition-all duration-150"
      style={{
        background: selected
          ? 'rgba(180,130,60,0.07)'
          : hovered ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${selected ? 'rgba(180,130,60,0.35)' : hovered ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Radio dot */}
      <span
        className="mt-0.5 flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-150"
        style={{
          border:     `1.5px solid ${selected ? GOLD : 'rgba(255,255,255,0.20)'}`,
          background: selected ? 'rgba(180,130,60,0.20)' : 'transparent',
        }}
      >
        {selected && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <p className="text-[0.56rem] tracking-[0.08em] font-semibold" style={{ color: selected ? GOLD : 'rgba(255,255,255,0.72)' }}>
            {title}
          </p>
        </div>
        <p className="mt-1 text-[0.48rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.32)' }}>
          {description}
        </p>
      </div>
    </button>
  );
}

// ── RadioRow (Apply To) ────────────────────────────────────────────────────────

function RadioRow({
  value,
  checked,
  onChange,
  label,
}: {
  value:    string;
  checked:  boolean;
  onChange: () => void;
  label:    string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-2.5 transition-colors duration-100"
    >
      <span
        className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-100"
        style={{
          border:     `1.5px solid ${checked ? GOLD : 'rgba(255,255,255,0.18)'}`,
          background: checked ? 'rgba(180,130,60,0.15)' : 'transparent',
        }}
      >
        {checked && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
      </span>
      <span className="text-[0.54rem] tracking-[0.06em]" style={{ color: checked ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.40)' }}>
        {label}
      </span>
    </button>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

const TYPES: { value: PromoDiscountType; icon: string; title: string; description: string }[] = [
  { value: 'pct',           icon: '💰', title: 'Percentage Off',  description: 'Reduce price by a percentage of the order total'  },
  { value: 'flat',          icon: '🏷️', title: 'Fixed Amount Off', description: 'Deduct a fixed ₦ amount from the order total'      },
  { value: 'free-shipping', icon: '🚚', title: 'Free Shipping',    description: 'Waive the delivery fee entirely'                   },
  { value: 'buy-x-get-y',  icon: '🎁', title: 'Buy X Get Y',      description: 'Give a discount when certain quantity is added'    },
];

export default function DiscountTypeSection({
  value,
  onChange,
}: {
  value:    PromoDraft;
  onChange: (p: Partial<PromoDraft>) => void;
}) {
  return (
    <SectionCard title="Discount Type">

      {/* ── Type cards ── */}
      <div>
        <FieldLabel required>Type</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <TypeCard
              key={t.value}
              icon={t.icon}
              title={t.title}
              description={t.description}
              selected={value.discountType === t.value}
              onSelect={() => onChange({ discountType: t.value })}
            />
          ))}
        </div>
      </div>

      {/* ── Conditional fields ── */}
      <AnimatePresence mode="wait">

        {/* Percentage Off */}
        {value.discountType === 'pct' && (
          <motion.div
            key="pct"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 pt-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
          >
            {/* Percentage input */}
            <div>
              <FieldLabel required>Percentage Discount</FieldLabel>
              <div className="flex items-stretch gap-3">
                <div className="flex items-center gap-0 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#1A1A1A', flex: '0 0 auto' }}>
                  <input
                    type="number"
                    value={value.pctValue}
                    onChange={(e) => onChange({ pctValue: Math.max(1, Math.min(100, Number(e.target.value))) })}
                    min={1}
                    max={100}
                    className="w-16 h-9 px-3 bg-transparent outline-none text-[0.62rem] font-semibold tabular-nums text-center"
                    style={{ color: GOLD }}
                  />
                  <span className="h-9 flex items-center px-2.5 text-[0.56rem] font-medium" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.30)' }}>%</span>
                </div>
                <HelperText>{value.pctValue}% off entire order</HelperText>
              </div>
            </div>

            {/* Cap toggle */}
            <div className="flex items-center gap-3">
              <FormToggle enabled={value.hasPctCap} onToggle={() => onChange({ hasPctCap: !value.hasPctCap })} />
              <span className="text-[0.54rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.52)' }}>
                Cap maximum discount at
              </span>
              <AnimatePresence>
                {value.hasPctCap && (
                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.12 }} className="overflow-hidden">
                    <InlineInput
                      type="number"
                      value={value.pctCap}
                      onChange={(v) => onChange({ pctCap: Number(v) })}
                      prefix="₦"
                      min={0}
                      style={{ width: '130px' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {!value.hasPctCap && <HelperText>Prevents large orders getting huge discounts</HelperText>}
            </div>
          </motion.div>
        )}

        {/* Fixed Amount Off */}
        {value.discountType === 'flat' && (
          <motion.div
            key="flat"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
          >
            <FieldLabel required>Discount Amount</FieldLabel>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#1A1A1A', flex: '0 0 auto' }}>
                <span className="h-9 flex items-center px-2.5 text-[0.54rem]" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.30)' }}>₦</span>
                <input
                  type="number"
                  value={value.flatValue}
                  onChange={(e) => onChange({ flatValue: Math.max(0, Number(e.target.value)) })}
                  min={0}
                  className="w-24 h-9 px-3 bg-transparent outline-none text-[0.62rem] font-semibold tabular-nums"
                  style={{ color: GOLD }}
                />
              </div>
              <HelperText>₦{value.flatValue.toLocaleString('en-NG')} off entire order</HelperText>
            </div>
          </motion.div>
        )}

        {/* Free Shipping */}
        {value.discountType === 'free-shipping' && (
          <motion.div
            key="free-shipping"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.18)' }}>
              <span className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(45,212,191,0.80)' }}>
                This code will waive the delivery fee completely for qualifying orders.
              </span>
            </div>
            <div>
              <FieldLabel>Apply to Delivery Methods</FieldLabel>
              <div className="flex flex-wrap gap-3 mt-1">
                {[
                  { key: 'freeShippingStandard' as const, label: 'Standard Delivery' },
                  { key: 'freeShippingExpress'  as const, label: 'Express Delivery'  },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange({ [key]: !value[key] })}
                    className="flex items-center gap-2 h-7 px-3 text-[0.50rem] tracking-[0.08em] transition-colors duration-100"
                    style={{
                      background: value[key] ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.02)',
                      border:     `1px solid ${value[key] ? 'rgba(20,184,166,0.30)' : 'rgba(255,255,255,0.07)'}`,
                      color:      value[key] ? 'rgba(45,212,191,0.85)' : 'rgba(255,255,255,0.38)',
                    }}
                  >
                    <span
                      className="w-3 h-3 flex items-center justify-center"
                      style={{ color: value[key] ? 'rgba(45,212,191,0.85)' : 'transparent' }}
                    >
                      ✓
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Buy X Get Y */}
        {value.discountType === 'buy-x-get-y' && (
          <motion.div
            key="buy-x-get-y"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <FieldLabel required>Buy Quantity (X)</FieldLabel>
                <input
                  type="number"
                  value={value.buyX}
                  onChange={(e) => onChange({ buyX: Math.max(1, Number(e.target.value)) })}
                  min={1}
                  className="w-20 h-9 px-3 text-center outline-none text-[0.62rem] font-semibold tabular-nums"
                  style={{ ...inputBase, width: '80px' }}
                />
              </div>
              <div className="pt-5 text-[0.54rem]" style={{ color: 'rgba(255,255,255,0.25)' }}>+ get</div>
              <div>
                <FieldLabel required>Get Quantity (Y)</FieldLabel>
                <input
                  type="number"
                  value={value.getY}
                  onChange={(e) => onChange({ getY: Math.max(1, Number(e.target.value)) })}
                  min={1}
                  className="w-20 h-9 px-3 text-center outline-none text-[0.62rem] font-semibold tabular-nums"
                  style={{ ...inputBase, width: '80px' }}
                />
              </div>
            </div>

            <div>
              <FieldLabel required>Get Discount</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'free', label: 'Free (100% off)' },
                  { value: 'half', label: '50% off'         },
                  { value: 'custom', label: 'Custom %'      },
                ] as { value: PromoGetDiscount; label: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ getDiscount: opt.value })}
                    className="h-7 px-3 text-[0.50rem] tracking-[0.08em] transition-colors duration-100"
                    style={{
                      background: value.getDiscount === opt.value ? 'rgba(180,130,60,0.10)' : 'rgba(255,255,255,0.02)',
                      border:     `1px solid ${value.getDiscount === opt.value ? 'rgba(180,130,60,0.30)' : 'rgba(255,255,255,0.07)'}`,
                      color:      value.getDiscount === opt.value ? GOLD : 'rgba(255,255,255,0.42)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
                <AnimatePresence>
                  {value.getDiscount === 'custom' && (
                    <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.12 }} className="overflow-hidden">
                      <InlineInput
                        type="number"
                        value={value.getCustomPct}
                        onChange={(v) => onChange({ getCustomPct: Math.max(1, Math.min(99, Number(v))) })}
                        suffix="%"
                        min={1}
                        max={99}
                        style={{ width: '90px' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <HelperText>
                Buy {value.buyX} get {value.getY} at{' '}
                {value.getDiscount === 'free' ? '100% off' : value.getDiscount === 'half' ? '50% off' : `${value.getCustomPct}% off`}
              </HelperText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Apply discount to ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
        <FieldLabel required>Apply Discount To</FieldLabel>
        <div className="flex flex-col gap-2.5 mt-2">
          {([
            { value: 'order',      label: 'Entire Order'         },
            { value: 'products',   label: 'Specific Products'    },
            { value: 'categories', label: 'Specific Categories'  },
          ] as { value: PromoApplyTo; label: string }[]).map((opt) => (
            <RadioRow
              key={opt.value}
              value={opt.value}
              checked={value.applyTo === opt.value}
              onChange={() => onChange({ applyTo: opt.value })}
              label={opt.label}
            />
          ))}
        </div>
        {value.applyTo !== 'order' && (
          <div className="mt-3 p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {value.applyTo === 'products'
                ? 'Product search & selection will be available after the promo code API is connected.'
                : 'Category multi-select will be available after the promo code API is connected.'}
            </p>
          </div>
        )}
      </div>

    </SectionCard>
  );
}
