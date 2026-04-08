'use client';

import { useState } from 'react';
import { Download, ChevronDown, RefreshCw } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, CARD_BG, type DatePreset } from '../shared';

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today',       value: 'today'     },
  { label: 'Yesterday',   value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7'     },
  { label: 'Last 30 Days',value: 'last30'    },
  { label: 'Last 90 Days',value: 'last90'    },
  { label: 'This Year',   value: 'thisYear'  },
  { label: 'All Time',    value: 'allTime'   },
];

interface RevenuePageHeaderProps {
  preset: DatePreset;
  from: string;
  to: string;
  compare: boolean;
  onPreset: (p: DatePreset) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onCompare: (v: boolean) => void;
}

export default function RevenuePageHeader({
  preset, from, to, compare,
  onPreset, onFrom, onTo, onCompare,
}: RevenuePageHeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);

  function handleExport(fmt: 'csv' | 'pdf') {
    setExportOpen(false);
    console.log(`Exporting revenue analytics as ${fmt}`);
  }

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <h1
            className="text-[0.80rem] tracking-[0.20em] uppercase font-semibold"
            style={{ color: TEXT.primary }}
          >
            Revenue Analytics
          </h1>
          <p className="text-[0.54rem] tracking-[0.08em]" style={{ color: TEXT.muted }}>
            Detailed revenue breakdown and trend analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 h-8 px-3" style={{ border: `1px solid ${BORDER.default}` }}>
            <RefreshCw size={10} style={{ color: TEXT.secondary }} />
            <span className="text-[0.48rem] tracking-[0.08em]" style={{ color: TEXT.secondary }}>
              Last updated: 2 minutes ago
            </span>
          </div>

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
              <div
                className="absolute right-0 top-full mt-1 z-20 min-w-[110px]"
                style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}
              >
                {(['csv', 'pdf'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="w-full text-left px-4 py-2.5 text-[0.52rem] tracking-[0.10em] uppercase transition-colors"
                    style={{ color: TEXT.secondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = TEXT.primary;
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = TEXT.secondary;
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
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
              <button
                key={p.value}
                onClick={() => onPreset(p.value)}
                className="h-7 px-3.5 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-150"
                style={{
                  background: active ? GOLD_BG(0.12) : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? GOLD_BG(0.35) : BORDER.default}`,
                  color: active ? GOLD : TEXT.secondary,
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = TEXT.primary; e.currentTarget.style.borderColor = BORDER.hover; }}}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = TEXT.secondary; e.currentTarget.style.borderColor = BORDER.default; }}}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom range + compare */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.48rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>From</span>
            <input
              type="date" value={from} onChange={(e) => onFrom(e.target.value)}
              className="h-7 px-2.5 text-[0.50rem] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.default}`, color: TEXT.primary, colorScheme: 'dark' }}
            />
            <span className="text-[0.48rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>To</span>
            <input
              type="date" value={to} onChange={(e) => onTo(e.target.value)}
              className="h-7 px-2.5 text-[0.50rem] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.default}`, color: TEXT.primary, colorScheme: 'dark' }}
            />
          </div>

          <div className="h-4 w-px" style={{ background: BORDER.default }} />

          <button
            onClick={() => onCompare(!compare)}
            className="flex items-center gap-2 h-7 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-150"
            style={{
              background: compare ? GOLD_BG(0.08) : 'rgba(255,255,255,0.03)',
              border: `1px solid ${compare ? GOLD_BG(0.30) : BORDER.default}`,
              color: compare ? GOLD : TEXT.secondary,
            }}
          >
            <div
              className="w-7 h-3.5 rounded-full relative transition-colors duration-200"
              style={{ background: compare ? GOLD_BG(0.60) : 'rgba(255,255,255,0.12)' }}
            >
              <div
                className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-200"
                style={{
                  background: compare ? GOLD : 'rgba(255,255,255,0.40)',
                  left: compare ? 'calc(100% - 12px)' : '2px',
                }}
              />
            </div>
            Compare to previous period
          </button>
        </div>
      </div>
    </div>
  );
}
