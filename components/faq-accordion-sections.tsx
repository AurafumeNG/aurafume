'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { CATEGORIES, ALL_TABS, type CategoryId, type FaqItem } from '@/components/faq-data';

// ── Text highlight helper ─────────────────────────────────────────────────────
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts  = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-accent/25 text-foreground rounded-[2px] px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

// ── Single accordion item ─────────────────────────────────────────────────────
function AccordionItem({
  item,
  query,
  isOpen,
  onToggle,
}: {
  item:     FaqItem;
  query:    string;
  isOpen:   boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-start gap-4 py-5 text-left group"
      >
        <span
          className={`shrink-0 mt-0.5 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown
            size={15}
            strokeWidth={1.7}
            className={`transition-colors ${
              isOpen ? 'text-accent' : 'text-muted-foreground/40 group-hover:text-muted-foreground/70'
            }`}
          />
        </span>
        <span
          className={`flex-1 text-[0.82rem] sm:text-[0.88rem] tracking-wide leading-snug transition-colors ${
            isOpen ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
          }`}
        >
          {highlight(item.q, query)}
        </span>
      </button>

      {/* Answer — smooth height transition via grid trick */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pl-[calc(15px+1rem)] pr-2 text-[0.78rem] text-muted-foreground leading-relaxed tracking-wide">
            {highlight(item.a, query)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Category section ──────────────────────────────────────────────────────────
interface Props {
  activeTab: CategoryId;
  query:     string;
}

export default function FaqAccordionSections({ activeTab, query }: Props) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setOpenMap((m) => ({ ...m, [key]: !m[key] }));
  }

  const normalised = query.trim().toLowerCase();

  // Filter categories and items based on active tab + search query
  const visible = useMemo(() => {
    const cats = activeTab === 'all'
      ? CATEGORIES
      : CATEGORIES.filter((c) => c.id === activeTab);

    if (!normalised) return cats.map((c) => ({ ...c }));

    return cats
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (item) =>
            item.q.toLowerCase().includes(normalised) ||
            item.a.toLowerCase().includes(normalised),
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [activeTab, normalised]);

  if (visible.length === 0) {
    return (
      <section className="px-6 sm:px-10 lg:px-16 pb-24">
        <div className="max-w-3xl mx-auto py-16 text-center">
          <p className="text-[0.75rem] text-muted-foreground tracking-wide">
            No results for &ldquo;<span className="text-foreground">{query}</span>&rdquo;. Try a different keyword.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-24">
      <div className="max-w-3xl mx-auto space-y-14">
        {visible.map((cat) => (
          <div key={cat.id}>
            {/* Category heading — only shown in "All" tab or when multiple categories */}
            {(activeTab === 'all' || visible.length > 1) && (
              <div className="flex items-center gap-4 mb-6">
                <p className="text-[0.55rem] tracking-[0.28em] uppercase text-accent shrink-0">
                  {cat.label}
                </p>
                <div className="flex-1 h-px bg-border/40" />
              </div>
            )}

            <div className="border border-border/50 px-5">
              {cat.items.map((item, i) => {
                const key = `${cat.id}-${i}`;
                return (
                  <AccordionItem
                    key={key}
                    item={item}
                    query={query}
                    isOpen={!!openMap[key]}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
