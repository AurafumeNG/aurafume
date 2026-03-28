'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 bg-background">
      <motion.div
        className="relative flex items-center max-w-2xl mx-auto"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Search icon */}
        <Search
          size={17}
          className="absolute left-4 text-muted-foreground pointer-events-none z-10 shrink-0"
          strokeWidth={1.8}
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search fragrances..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full h-12 pl-11 pr-11 bg-card border border-border text-foreground text-[0.9rem] placeholder:text-muted-foreground/60 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200"
        />

        {/* Clear button */}
        <AnimatePresence>
          {value && (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={14} strokeWidth={2} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
