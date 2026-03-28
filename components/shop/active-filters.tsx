'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_PRICE_RANGE, type ShopFilters } from './types';

interface ActiveFiltersProps {
  filters: ShopFilters;
  onRemoveScentFamily: (family: string) => void;
  onRemoveGender: () => void;
  onRemoveSize: (size: string) => void;
  onRemovePriceRange: () => void;
  onClearAll: () => void;
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 bg-accent/10 border border-accent/30 text-accent text-[0.6rem] tracking-[0.16em] uppercase shrink-0"
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-accent/20 transition-colors"
      >
        <X size={9} strokeWidth={2.5} />
      </button>
    </motion.span>
  );
}

export default function ActiveFilters({
  filters,
  onRemoveScentFamily,
  onRemoveGender,
  onRemoveSize,
  onRemovePriceRange,
  onClearAll,
}: ActiveFiltersProps) {
  const hasPriceFilter =
    filters.priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
    filters.priceRange[1] !== DEFAULT_PRICE_RANGE[1];

  const hasAny =
    filters.scentFamilies.length > 0 ||
    filters.gender !== '' ||
    filters.sizes.length > 0 ||
    hasPriceFilter;

  if (!hasAny) return null;

  const priceLabel = `₦${(filters.priceRange[0] / 1000).toFixed(0)}k – ₦${(filters.priceRange[1] / 1000).toFixed(0)}k`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-background border-b border-border overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-none">

          <AnimatePresence mode="popLayout">
            {filters.scentFamilies.map(f => (
              <Tag key={`scent-${f}`} label={f} onRemove={() => onRemoveScentFamily(f)} />
            ))}

            {filters.gender && (
              <Tag key="gender" label={filters.gender} onRemove={onRemoveGender} />
            )}

            {filters.sizes.map(s => (
              <Tag key={`size-${s}`} label={s} onRemove={() => onRemoveSize(s)} />
            ))}

            {hasPriceFilter && (
              <Tag key="price" label={priceLabel} onRemove={onRemovePriceRange} />
            )}
          </AnimatePresence>

          {/* Clear All */}
          <motion.button
            layout
            onClick={onClearAll}
            className="shrink-0 ml-1 h-7 px-3 text-[0.6rem] tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all duration-150"
          >
            Clear All
          </motion.button>

        </div>
      </div>
    </motion.div>
  );
}
