'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderSearchBarProps {
  value:    string;
  onChange: (v: string) => void;
}

export default function OrderSearchBar({ value, onChange }: OrderSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="relative flex items-center"
    >
      {/* Search icon */}
      <Search
        size={14}
        strokeWidth={1.8}
        className="absolute left-3.5 text-muted-foreground/50 pointer-events-none"
      />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search by order number or product name…"
        autoComplete="off"
        spellCheck={false}
        className="w-full h-10 bg-muted/30 border border-border/60 pl-9 pr-10 text-[0.72rem] tracking-[0.04em] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-accent/50 focus:bg-muted/50 transition-colors duration-200"
      />

      {/* Clear button */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            type="button"
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            aria-label="Clear search"
            className="absolute right-3 flex items-center justify-center w-5 h-5 text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <X size={13} strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
