'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { SizeVariant } from './types';

interface VariantSelectorProps {
  variants: SizeVariant[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function VariantSelector({ variants, selectedIndex, onChange }: VariantSelectorProps) {
  const selected = variants[selectedIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] tracking-[0.28em] uppercase text-muted-foreground">Size</p>

        {/* Stock indicator */}
        <AnimatePresence mode="wait">
          {selected.stock > 0 && selected.stock <= 3 && (
            <motion.p
              key={`low-${selectedIndex}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="text-[0.62rem] tracking-[0.1em] text-destructive font-medium"
            >
              Only {selected.stock} left
            </motion.p>
          )}
          {selected.stock === 0 && (
            <motion.p
              key={`out-${selectedIndex}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="text-[0.62rem] tracking-[0.1em] text-muted-foreground"
            >
              Out of stock
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Size pills */}
      <div className="flex flex-wrap gap-2">
        {variants.map((v, i) => {
          const isSelected    = i === selectedIndex;
          const isOutOfStock  = v.stock === 0;

          return (
            <motion.button
              key={v.size}
              onClick={() => !isOutOfStock && onChange(i)}
              disabled={isOutOfStock}
              whileTap={!isOutOfStock ? { scale: 0.94 } : undefined}
              aria-pressed={isSelected}
              aria-label={`${v.size}${isOutOfStock ? ' — out of stock' : ''}`}
              className={`relative h-10 px-5 text-[0.65rem] tracking-[0.2em] uppercase border transition-all duration-200 ${
                isOutOfStock
                  ? 'border-border text-foreground/25 cursor-not-allowed'
                  : isSelected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-foreground/60 hover:border-foreground/50 hover:text-foreground/90'
              }`}
            >
              {v.size}
              {/* Diagonal strike for out-of-stock */}
              {isOutOfStock && (
                <span
                  aria-hidden
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                >
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                  </svg>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
