'use client';

import { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SCENT_FAMILIES, SORT_OPTIONS, type SortOption } from './types';

interface FilterSortBarProps {
  activeScentFamilies: string[];
  onScentToggle: (family: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeFilterCount: number;
  onFilterOpen: () => void;
}

export default function FilterSortBar({
  activeScentFamilies,
  onScentToggle,
  sortBy,
  onSortChange,
  activeFilterCount,
  onFilterOpen,
}: FilterSortBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';

  return (
    <>
      {/* Bar */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-12">

            {/* Scent pills — scrollable */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {/* "All" pill */}
              <button
                onClick={() => activeScentFamilies.length > 0 && onScentToggle('__clear__')}
                className={`shrink-0 h-7 px-3.5 text-[0.6rem] tracking-[0.18em] uppercase border transition-all duration-200 ${
                  activeScentFamilies.length === 0
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground/80'
                }`}
              >
                All
              </button>

              {SCENT_FAMILIES.map(family => {
                const active = activeScentFamilies.includes(family);
                return (
                  <button
                    key={family}
                    onClick={() => onScentToggle(family)}
                    className={`shrink-0 h-7 px-3.5 text-[0.6rem] tracking-[0.18em] uppercase border transition-all duration-200 ${
                      active
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground/80'
                    }`}
                  >
                    {family}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border shrink-0" />

            {/* Sort trigger */}
            <div className="relative shrink-0">
              <button
                onClick={() => setSortOpen(v => !v)}
                aria-expanded={sortOpen}
                className="flex items-center gap-1.5 h-7 px-2.5 text-[0.6rem] tracking-[0.15em] uppercase text-foreground/60 hover:text-foreground border border-transparent hover:border-border transition-all duration-200"
              >
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <span className="sm:hidden">Sort</span>
                <ChevronDown
                  size={11}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Sort dropdown */}
              <AnimatePresence>
                {sortOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setSortOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-48 bg-background border border-border shadow-lg z-50 py-1"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-[0.72rem] tracking-[0.1em] text-left hover:bg-card transition-colors"
                        >
                          {opt.label}
                          {sortBy === opt.value && (
                            <Check size={12} className="text-accent shrink-0" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Filter trigger */}
            <button
              onClick={onFilterOpen}
              className="relative shrink-0 flex items-center gap-1.5 h-7 px-2.5 text-[0.6rem] tracking-[0.15em] uppercase text-foreground/60 hover:text-foreground border border-transparent hover:border-border transition-all duration-200"
            >
              <SlidersHorizontal size={13} strokeWidth={1.8} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <motion.span
                  key={activeFilterCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center leading-none"
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
