'use client';

import { useState } from 'react';
import { Download, ChevronDown, RefreshCw } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, CARD_BG, type DatePreset } from '../shared';

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today',        value: 'today'     },
  { label: 'Yesterday',    value: 'yesterday' },
  { label: 'Last 7 Days',  value: 'last7'     },
  { label: 'Last 30 Days', value: 'last30'    },
  { label: 'Last 90 Days', value: 'last90'    },
  { label: 'This Year',    value: 'thisYear'  },
  { label: 'All Time',     value: 'allTime'   },
];

const CATEGORIES = ['All Categories', 'Woody', 'Floral', 'Fresh', 'Oriental', 'Citrus'];

interface ProductPageHeaderProps {
  preset: DatePreset;
  from: string;
  to: string;
  category: string;
  onPreset: (p: DatePreset) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onCategory: (v: string) => void;
}

export default function ProductPageHeader({
  preset, from, to, category,
  onPreset, onFrom, onTo, onCategory,
}: ProductPageHeaderProps) {
  const [exportOpen, setExportOpen]     = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <h1
            className="text-[0.80rem] tracking-[0.20em] uppercase font-semibold"
            style={{ color: TEXT.primary }}
          >
            Product Analytics
          </h1>
          <p className="text-[0.54rem] tracking-[0.08em]" style={{ color: TEXT.muted }}>
            Product performance, conversion funnels & inventory insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 h-8 px-3" style={{ border: `1px solid ${BORDER.default}` }}>
            <RefreshCw size={10} style={{ color: TEXT.secondary }} />
            <span className="text-[0.48rem] tracking-[0.08em]" style={{ color: TEXT.secondary }}>
              Last updated: 2 minutes ago
            </span>
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="flex items-center gap-1.5 h-8 px-4 text-[0.52rem] tracking-[0.12em] uppercase transition-colors duration-150"
              style={{ background: GOLD_BG(0.12), border: `1px solid ${GOLD_BG(0.30)}`, color: GOLD }}
              onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_BG(0.18); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = GOLD_BG(0.12); }}
            >
              <Download size={11} strokeWidth={1.8} />
              Export
              <ChevronDown size={10} strokeWidth={2} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 min-w-[110px]"
                style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
                {(['csv', 'pdf'] as const).map((fmt) => (
                  <button key={fmt} onClick={() => setExportOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-[0.52rem] tracking-[0.10em] uppercase transition-colors"
                    style={{ color: TEXT.secondary }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = TEXT.primary; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.secondary; e.currentTarget.style.background = 'transparent'; }}>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER.default}` }}>
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PRESETS.map((p) => {
            const active = p.value === preset;
            return (
              <button key={p.value} onClick={() => onPreset(p.value)}
                className="h-7 px-3.5 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-150"
                style={{
                  background: active ? GOLD_BG(0.12) : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? GOLD_BG(0.35) : BORDER.default}`,
                  color: active ? GOLD : TEXT.secondary,
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = TEXT.primary; e.currentTarget.style.borderColor = BORDER.hover; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = TEXT.secondary; e.currentTarget.style.borderColor = BORDER.default; } }}>
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Date range + category filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.48rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>From</span>
            <input type="date" value={from} onChange={(e) => onFrom(e.target.value)}
              className="h-7 px-2.5 text-[0.50rem] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.default}`, color: TEXT.primary, colorScheme: 'dark' }} />
            <span className="text-[0.48rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>To</span>
            <input type="date" value={to} onChange={(e) => onTo(e.target.value)}
              className="h-7 px-2.5 text-[0.50rem] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.default}`, color: TEXT.primary, colorScheme: 'dark' }} />
          </div>

          <div className="h-4 w-px" style={{ background: BORDER.default }} />

          {/* Category filter */}
          <div className="relative">
            <button
              onClick={() => setCategoryOpen((o) => !o)}
              className="flex items-center gap-2 h-7 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-150"
              style={{
                background: category !== 'All Categories' ? GOLD_BG(0.08) : 'rgba(255,255,255,0.03)',
                border: `1px solid ${category !== 'All Categories' ? GOLD_BG(0.30) : BORDER.default}`,
                color: category !== 'All Categories' ? GOLD : TEXT.secondary,
              }}
            >
              {category}
              <ChevronDown size={10} strokeWidth={2} />
            </button>
            {categoryOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 min-w-[150px]"
                style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
                {CATEGORIES.map((cat) => (
                  <button key={cat}
                    onClick={() => { onCategory(cat); setCategoryOpen(false); }}
                    className="w-full text-left px-4 py-2 text-[0.50rem] tracking-[0.08em] transition-colors"
                    style={{ color: cat === category ? GOLD : TEXT.secondary }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
