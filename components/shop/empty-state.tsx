'use client';

import { motion } from 'motion/react';

interface EmptyStateProps {
  onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      {/* Icon composition */}
      <div className="relative mb-7 w-20 h-20">
        <svg
          viewBox="0 0 80 80"
          fill="none"
          className="w-full h-full text-border"
          aria-hidden="true"
        >
          {/* Bottle silhouette */}
          <rect x="28" y="18" width="24" height="44" rx="4" stroke="currentColor" strokeWidth="2" />
          <rect x="33" y="12" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
          <line x1="28" y1="30" x2="52" y2="30" stroke="currentColor" strokeWidth="2" />
          {/* Search circle */}
          <circle cx="56" cy="56" r="12" stroke="currentColor" strokeWidth="2" />
          <line x1="64.5" y1="64.5" x2="72" y2="72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* X inside search */}
          <line x1="52" y1="52" x2="60" y2="60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="60" y1="52" x2="52" y2="60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="font-heading text-xl text-foreground/40 mb-2">
        No fragrances found
      </h3>
      <p className="text-[0.78rem] text-muted-foreground tracking-wide mb-7 max-w-xs">
        Try adjusting your filters or searching with different keywords
      </p>

      <button
        onClick={onClearFilters}
        className="h-10 px-6 border border-border text-[0.65rem] tracking-[0.22em] uppercase text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-200"
      >
        Clear Filters
      </button>
    </motion.div>
  );
}
