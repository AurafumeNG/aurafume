'use client';

import { useRef } from 'react';
import { motion } from 'motion/react';

// ── Filter catalogue ─────────────────────────────────────────────────
export type CollectionFilterId =
  | 'all'
  | 'floral' | 'woody' | 'fresh' | 'oriental' | 'citrus'
  | 'office' | 'evening' | 'daily' | 'special-occasion'
  | 'new-arrivals' | 'best-sellers' | 'gift-sets' | 'luxury-edit';

interface FilterPill {
  id: CollectionFilterId;
  label: string;
}

interface FilterGroup {
  key: string;
  pills: FilterPill[];
}

const ALL_PILL: FilterPill = { id: 'all', label: 'All Collections' };

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: 'fragrance',
    pills: [
      { id: 'floral',   label: 'Floral'   },
      { id: 'woody',    label: 'Woody'    },
      { id: 'fresh',    label: 'Fresh'    },
      { id: 'oriental', label: 'Oriental' },
      { id: 'citrus',   label: 'Citrus'   },
    ],
  },
  {
    key: 'mood',
    pills: [
      { id: 'office',           label: 'Office'           },
      { id: 'evening',          label: 'Evening'          },
      { id: 'daily',            label: 'Daily'            },
      { id: 'special-occasion', label: 'Special Occasion' },
    ],
  },
  {
    key: 'curated',
    pills: [
      { id: 'new-arrivals',  label: '✨ New Arrivals'  },
      { id: 'best-sellers',  label: '🏆 Best Sellers'  },
      { id: 'gift-sets',     label: '🎁 Gift Sets'     },
      { id: 'luxury-edit',   label: '👑 Luxury Edit'   },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────
interface CollectionsFilterBarProps {
  active: CollectionFilterId;
  onSelect: (id: CollectionFilterId) => void;
}

// ── Pill ─────────────────────────────────────────────────────────────
function Pill({
  pill,
  isActive,
  onSelect,
}: {
  pill: FilterPill;
  isActive: boolean;
  onSelect: (id: CollectionFilterId) => void;
}) {
  return (
    <motion.button
      layout
      onClick={() => onSelect(pill.id)}
      whileTap={{ scale: 0.93 }}
      transition={{ duration: 0.15 }}
      className={[
        'relative shrink-0 h-7 px-3.5 text-[0.6rem] tracking-[0.16em] uppercase',
        'border transition-colors duration-200 whitespace-nowrap select-none',
        isActive
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border text-foreground/50 hover:border-foreground/30 hover:text-foreground/80',
      ].join(' ')}
    >
      {pill.label}

      {/* Gold bottom-line accent on active */}
      {isActive && (
        <motion.span
          layoutId="collections-pill-underline"
          className="absolute inset-x-0 bottom-0 h-[1.5px] bg-accent"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────
function Divider() {
  return <span className="shrink-0 w-px h-4 bg-border/60 mx-1" aria-hidden />;
}

// ── Filter Bar ────────────────────────────────────────────────────────
export default function CollectionsFilterBar({
  active,
  onSelect,
}: CollectionsFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 h-12"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* "All" pill */}
        <Pill pill={ALL_PILL} isActive={active === 'all'} onSelect={onSelect} />

        {/* Grouped pills with dividers */}
        {FILTER_GROUPS.map(group => (
          <div key={group.key} className="contents">
            <Divider />
            {group.pills.map(pill => (
              <Pill
                key={pill.id}
                pill={pill}
                isActive={active === pill.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}

        {/* Trailing spacer so last pill clears the scroll edge */}
        <span className="shrink-0 w-2" aria-hidden />
      </div>
    </div>
  );
}
