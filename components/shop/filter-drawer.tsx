'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SCENT_FAMILIES,
  DEFAULT_FILTERS,
  DEFAULT_PRICE_RANGE,
  type ShopFilters,
} from './types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ShopFilters;
  onApply: (filters: ShopFilters) => void;
}

const GENDERS = ['Him', 'Her', 'Unisex'] as const;
const SIZES = ['15ml', '30ml', '50ml', '100ml'] as const;
const PRICE_MIN = 0;
const PRICE_MAX = 300000;

// ── Dual-thumb price slider ──────────────────────────────────────────
function PriceRangeSlider({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const range = PRICE_MAX - PRICE_MIN;
  const leftPct  = ((value[0] - PRICE_MIN) / range) * 100;
  const rightPct = 100 - ((value[1] - PRICE_MIN) / range) * 100;

  return (
    <div className="space-y-3">
      {/* Track */}
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-[3px] bg-border rounded-full">
          <div
            className="absolute h-full bg-accent rounded-full"
            style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          />
        </div>

        {/* Min thumb */}
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5000}
          value={value[0]}
          onChange={e => {
            const v = Math.min(+e.target.value, value[1] - 5000);
            onChange([v, value[1]]);
          }}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-accent
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-accent
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background
            [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5000}
          value={value[1]}
          onChange={e => {
            const v = Math.max(+e.target.value, value[0] + 5000);
            onChange([value[0], v]);
          }}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-accent
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-accent
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground tabular-nums">
        <span>₦{value[0].toLocaleString('en-NG')}</span>
        <span>₦{value[1].toLocaleString('en-NG')}</span>
      </div>
    </div>
  );
}

// ── Main drawer ──────────────────────────────────────────────────────
export default function FilterDrawer({ isOpen, onClose, filters, onApply }: FilterDrawerProps) {
  // Draft state — only committed on Apply
  const [draft, setDraft] = useState<ShopFilters>(filters);

  // Sync draft when drawer opens
  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function toggleScent(family: string) {
    setDraft(d => ({
      ...d,
      scentFamilies: d.scentFamilies.includes(family)
        ? d.scentFamilies.filter(f => f !== family)
        : [...d.scentFamilies, family],
    }));
  }

  function toggleSize(size: string) {
    setDraft(d => ({
      ...d,
      sizes: d.sizes.includes(size)
        ? d.sizes.filter(s => s !== size)
        : [...d.sizes, size],
    }));
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(DEFAULT_FILTERS);
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border max-h-[90dvh] flex flex-col rounded-t-2xl overflow-hidden sm:max-w-md sm:left-auto sm:right-0 sm:top-0 sm:bottom-0 sm:max-h-none sm:rounded-t-none sm:rounded-l-2xl sm:border-t-0 sm:border-l"
          >
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-heading text-base tracking-wide">Filters</h2>
              <button
                onClick={onClose}
                aria-label="Close filters"
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-8">

              {/* Fragrance Type */}
              <section>
                <h3 className="text-[0.62rem] tracking-[0.28em] uppercase text-muted-foreground mb-3">
                  Fragrance Type
                </h3>
                <div className="space-y-2.5">
                  {SCENT_FAMILIES.map(family => (
                    <label
                      key={family}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <span
                        className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-all duration-150 ${
                          draft.scentFamilies.includes(family)
                            ? 'border-accent bg-accent/10'
                            : 'border-border group-hover:border-foreground/40'
                        }`}
                      >
                        {draft.scentFamilies.includes(family) && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M1 4l3 3 5-6" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[0.82rem] text-foreground/80 group-hover:text-foreground transition-colors">
                        {family}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Price Range */}
              <section>
                <h3 className="text-[0.62rem] tracking-[0.28em] uppercase text-muted-foreground mb-4">
                  Price Range
                </h3>
                <PriceRangeSlider
                  value={draft.priceRange}
                  onChange={r => setDraft(d => ({ ...d, priceRange: r }))}
                />
              </section>

              {/* Gender */}
              <section>
                <h3 className="text-[0.62rem] tracking-[0.28em] uppercase text-muted-foreground mb-3">
                  Gender
                </h3>
                <div className="flex flex-wrap gap-2">
                  {/* All */}
                  <button
                    onClick={() => setDraft(d => ({ ...d, gender: '' }))}
                    className={`h-8 px-4 text-[0.62rem] tracking-[0.18em] uppercase border transition-all duration-150 ${
                      draft.gender === ''
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground/80'
                    }`}
                  >
                    All
                  </button>
                  {GENDERS.map(g => (
                    <button
                      key={g}
                      onClick={() => setDraft(d => ({ ...d, gender: d.gender === g ? '' : g }))}
                      className={`h-8 px-4 text-[0.62rem] tracking-[0.18em] uppercase border transition-all duration-150 ${
                        draft.gender === g
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground/80'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </section>

              {/* Size */}
              <section>
                <h3 className="text-[0.62rem] tracking-[0.28em] uppercase text-muted-foreground mb-3">
                  Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`h-8 px-4 text-[0.62rem] tracking-[0.18em] uppercase border transition-all duration-150 ${
                        draft.sizes.includes(size)
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground/80'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </section>

            </div>

            {/* Footer actions */}
            <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-border bg-background">
              <button
                onClick={handleReset}
                className="flex-1 h-11 border border-border text-[0.7rem] tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-200"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 h-11 bg-foreground text-background text-[0.7rem] tracking-[0.2em] uppercase hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
