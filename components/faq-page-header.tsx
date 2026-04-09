'use client';

import { Search, X } from 'lucide-react';

interface Props {
  query:    string;
  onChange: (q: string) => void;
}

export default function FaqPageHeader({ query, onChange }: Props) {
  return (
    <section className="py-20 px-6 sm:px-10 lg:px-16 text-center">
      <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase mb-4">
        Support
      </p>
      <h1 className="font-heading text-4xl sm:text-5xl tracking-widest uppercase text-foreground mb-5">
        Frequently Asked Questions
      </h1>
      <p className="text-muted-foreground text-[0.85rem] tracking-wide max-w-md mx-auto leading-relaxed mb-10">
        Find answers to common questions below.
      </p>

      {/* Search bar */}
      <div className="relative max-w-lg mx-auto">
        <Search
          size={16}
          strokeWidth={1.7}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search FAQs…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full h-12 pl-11 pr-10 bg-transparent border border-border text-foreground text-[0.85rem] placeholder:text-muted-foreground/35 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all duration-200"
        />
        {query && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X size={15} strokeWidth={1.7} />
          </button>
        )}
      </div>
    </section>
  );
}
