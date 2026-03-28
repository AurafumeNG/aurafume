'use client';

import { Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export default function QuantitySelector({ value, min = 1, max, onChange }: QuantitySelectorProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="space-y-3">
      <p className="text-[0.6rem] tracking-[0.28em] uppercase text-muted-foreground">Quantity</p>

      <div className="inline-flex items-center border border-border">
        <motion.button
          onClick={() => !atMin && onChange(value - 1)}
          disabled={atMin}
          whileTap={!atMin ? { scale: 0.88 } : undefined}
          aria-label="Decrease quantity"
          className="w-11 h-11 flex items-center justify-center text-foreground/60 hover:text-foreground disabled:text-foreground/20 disabled:cursor-not-allowed transition-colors border-r border-border"
        >
          <Minus size={14} strokeWidth={2} />
        </motion.button>

        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.12 }}
          className="w-14 h-11 flex items-center justify-center text-[0.9rem] font-medium text-foreground tabular-nums"
          aria-live="polite"
          aria-label={`Quantity: ${value}`}
        >
          {value}
        </motion.span>

        <motion.button
          onClick={() => !atMax && onChange(value + 1)}
          disabled={atMax}
          whileTap={!atMax ? { scale: 0.88 } : undefined}
          aria-label="Increase quantity"
          className="w-11 h-11 flex items-center justify-center text-foreground/60 hover:text-foreground disabled:text-foreground/20 disabled:cursor-not-allowed transition-colors border-l border-border"
        >
          <Plus size={14} strokeWidth={2} />
        </motion.button>
      </div>

      {atMax && max > 0 && (
        <p className="text-[0.62rem] text-muted-foreground tracking-wide">
          Maximum available quantity selected
        </p>
      )}
    </div>
  );
}
