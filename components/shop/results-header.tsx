'use client';

import { LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ViewMode } from './types';

interface ResultsHeaderProps {
  count: number;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export default function ResultsHeader({ count, viewMode, onViewChange }: ResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">

      {/* Count */}
      <AnimatePresence mode="wait">
        <motion.p
          key={count}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="text-[0.72rem] text-muted-foreground tracking-[0.1em]"
        >
          <span className="text-foreground font-medium tabular-nums">{count}</span>{' '}
          {count === 1 ? 'Product' : 'Products'} Found
        </motion.p>
      </AnimatePresence>

      {/* View toggle */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onViewChange('grid')}
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            viewMode === 'grid'
              ? 'text-foreground'
              : 'text-foreground/35 hover:text-foreground/60'
          }`}
        >
          <LayoutGrid size={16} strokeWidth={1.8} />
        </button>
        <button
          onClick={() => onViewChange('list')}
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            viewMode === 'list'
              ? 'text-foreground'
              : 'text-foreground/35 hover:text-foreground/60'
          }`}
        >
          <List size={16} strokeWidth={1.8} />
        </button>
      </div>

    </div>
  );
}
