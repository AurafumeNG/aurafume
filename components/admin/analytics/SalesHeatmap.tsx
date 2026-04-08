'use client';

import { useState } from 'react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading } from './shared';
import type { OverviewData } from '@/types/analytics-overview';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function fmtHour(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function cellOpacity(v: number, max: number): number {
  if (v === 0 || max === 0) return 0;
  return 0.08 + (v / max) * 0.82;
}

function computeInsights(heatmap: number[][]): {
  peakHour: string;
  peakDay: string;
  quietPeriod: string;
} {
  let maxVal = 0;
  let peakDay = 0;
  let peakHour = 0;
  let minSum = Infinity;
  let quietDay = 0;
  let quietHourStart = 0;

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = heatmap[d]?.[h] ?? 0;
      if (v > maxVal) { maxVal = v; peakDay = d; peakHour = h; }
    }
  }

  // Find quietest 3-hour window across all days
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 22; h++) {
      const windowSum = (heatmap[d]?.[h] ?? 0) + (heatmap[d]?.[h + 1] ?? 0) + (heatmap[d]?.[h + 2] ?? 0);
      if (windowSum < minSum) {
        minSum = windowSum;
        quietDay = d;
        quietHourStart = h;
      }
    }
  }

  return {
    peakHour: `${fmtHour(peakHour)} – ${fmtHour(Math.min(peakHour + 2, 23))}`,
    peakDay: DAYS[peakDay],
    quietPeriod: `${DAYS[quietDay]} ${fmtHour(quietHourStart)}–${fmtHour(quietHourStart + 2)}`,
  };
}

interface Props { data: OverviewData | null }

export default function SalesHeatmap({ data }: Props) {
  const [hovered, setHovered] = useState<{ day: number; hour: number } | null>(null);

  const heatmap: number[][] = data?.heatmap ?? DAYS.map(() => HOURS.map(() => 0));
  const maxVal = Math.max(...heatmap.flat(), 1);
  const hoveredVal = hovered !== null ? (heatmap[hovered.day]?.[hovered.hour] ?? 0) : null;
  const insights = computeInsights(heatmap);

  return (
    <SectionCard>
      <SectionHeading title="Sales Activity Heatmap" />

      {/* Tooltip hint */}
      <div className="mb-3 h-5 flex items-center">
        {hovered && hoveredVal !== null ? (
          <p className="text-[0.46rem] tracking-[0.06em]" style={{ color: TEXT.secondary }}>
            <span style={{ color: GOLD, fontWeight: 600 }}>
              {DAYS[hovered.day]} {fmtHour(hovered.hour)}
            </span>
            {' '}— {hoveredVal} orders
          </p>
        ) : (
          <p className="text-[0.46rem] tracking-[0.06em]" style={{ color: TEXT.muted }}>
            Hover a cell to see order count
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 600 }}>
          {/* Hour labels */}
          <div className="flex mb-1 ml-10">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-[0.36rem]" style={{ color: TEXT.muted }}>
                {h % 3 === 0 ? fmtHour(h) : ''}
              </div>
            ))}
          </div>

          {/* Rows */}
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center mb-0.5">
              <div className="w-10 shrink-0 text-[0.44rem] tracking-[0.06em] pr-2 text-right" style={{ color: TEXT.secondary }}>
                {day}
              </div>
              {HOURS.map((hr) => {
                const v = heatmap[di]?.[hr] ?? 0;
                const isHov = hovered?.day === di && hovered?.hour === hr;
                return (
                  <div
                    key={hr}
                    className="flex-1 h-5 mx-px cursor-default transition-all duration-100 rounded-sm"
                    style={{
                      background: v === 0 ? 'rgba(255,255,255,0.03)' : GOLD_BG(cellOpacity(v, maxVal)),
                      border: isHov
                        ? `1px solid ${GOLD_BG(0.60)}`
                        : `1px solid ${v === 0 ? 'rgba(255,255,255,0.04)' : 'transparent'}`,
                    }}
                    onMouseEnter={() => setHovered({ day: di, hour: hr })}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>Less</span>
        {[0.08, 0.25, 0.45, 0.65, 0.85].map((op) => (
          <div key={op} className="w-4 h-3 rounded-sm" style={{ background: GOLD_BG(op) }} />
        ))}
        <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>More</span>
      </div>

      {/* Insights */}
      <div className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        {[
          { label: 'Peak hour',        value: insights.peakHour,    sub: 'Highest order volume' },
          { label: 'Peak day',         value: insights.peakDay,     sub: 'Highest revenue day of the week' },
          { label: 'Quietest period',  value: insights.quietPeriod, sub: 'Lowest order volume' },
        ].map((item) => (
          <div key={item.label} className="p-3" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER.default}` }}>
            <p className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
            <p className="mt-1 text-[0.60rem] font-semibold" style={{ color: TEXT.primary }}>{item.value}</p>
            <p className="mt-0.5 text-[0.44rem]" style={{ color: TEXT.secondary }}>{item.sub}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
