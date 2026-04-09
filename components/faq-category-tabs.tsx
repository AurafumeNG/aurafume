'use client';

import { useRef } from 'react';
import { ALL_TABS, type CategoryId } from '@/components/faq-data';

interface Props {
  active:   CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function FaqCategoryTabs({ active, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-10">
      <div className="max-w-3xl mx-auto">
        {/* Scrollable pill row */}
        <div
          ref={listRef}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
          role="tablist"
          aria-label="FAQ categories"
        >
          {ALL_TABS.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(id)}
                className={`shrink-0 h-9 px-5 text-[0.58rem] tracking-[0.2em] uppercase font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'border border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
