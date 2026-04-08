'use client';

import { useState } from 'react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { RevenueData } from '@/types/analytics-revenue';

function cellOpacity(v: number, max: number): number {
  if (v === 0 || max === 0) return 0;
  return 0.08 + (v / max) * 0.80;
}

function cellTextColor(opacity: number): string {
  return opacity > 0.50 ? TEXT.primary : TEXT.secondary;
}

interface Props { data: RevenueData | null }

export default function RevenueCohortTable({ data }: Props) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  const cohortData   = data?.cohortData   ?? [];
  const cohortMonths = data?.cohortMonths ?? [];
  const cohortMax    = data?.cohortMax    ?? 1;

  const colHeaders = cohortMonths.map((_, i) => `Month ${i}`);

  // Insight: find largest Month 0 cohort
  const bestCohort = cohortData.reduce<typeof cohortData[0] | null>(
    (mx, r) => (!mx || (r.values[0] ?? 0) > (mx.values[0] ?? 0) ? r : mx), null
  );

  return (
    <SectionCard>
      <SectionHeading title="Monthly Revenue Cohorts" />

      <p className="text-[0.48rem] leading-relaxed mb-4" style={{ color: TEXT.secondary }}>
        Each row shows revenue generated from customers acquired in that month, tracked across
        subsequent months. Darker cells indicate higher revenue from that cohort.
      </p>

      {cohortData.length === 0 ? (
        <p className="text-[0.48rem] py-8 text-center" style={{ color: TEXT.muted }}>
          Not enough order history to build cohort data
        </p>
      ) : (
        <>
          {/* Tooltip */}
          <div className="mb-3 h-5 flex items-center">
            {hovered !== null ? (
              <p className="text-[0.46rem] tracking-[0.04em]" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>
                  {cohortData[hovered.row]?.cohort} cohort, {colHeaders[hovered.col]}
                </span>
                {' '}—{' '}
                {cohortData[hovered.row]?.values[hovered.col] !== null
                  ? fmtNaira(cohortData[hovered.row].values[hovered.col] as number)
                  : 'No data yet'}
              </p>
            ) : (
              <p className="text-[0.46rem] tracking-[0.04em]" style={{ color: TEXT.muted }}>
                Hover a cell to see cohort revenue
              </p>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 580 }}>
              <thead>
                <tr>
                  <th className="w-20 pb-2 pr-3 text-left text-[0.44rem] tracking-[0.12em] uppercase"
                    style={{ color: TEXT.muted }}>Cohort</th>
                  {colHeaders.map((col) => (
                    <th key={col} className="pb-2 text-center text-[0.40rem] tracking-[0.08em] uppercase font-medium"
                      style={{ color: TEXT.muted, minWidth: 68 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row, ri) => (
                  <tr key={row.cohort}>
                    <td className="py-1 pr-3">
                      <span className="text-[0.48rem] font-medium" style={{ color: TEXT.secondary }}>{row.cohort}</span>
                    </td>
                    {row.values.map((val, ci) => {
                      const opacity  = val !== null ? cellOpacity(val, cohortMax) : 0;
                      const isHov    = hovered?.row === ri && hovered?.col === ci;
                      const isFuture = val === null;
                      return (
                        <td key={ci} className="py-1 px-0.5">
                          <div
                            className="flex items-center justify-center h-8 cursor-default transition-all duration-100 rounded-sm"
                            style={{
                              background: isFuture ? 'rgba(255,255,255,0.02)' : GOLD_BG(opacity),
                              border: isHov
                                ? `1px solid ${GOLD_BG(0.60)}`
                                : isFuture ? `1px solid ${BORDER.default}` : '1px solid transparent',
                            }}
                            onMouseEnter={() => setHovered({ row: ri, col: ci })}
                            onMouseLeave={() => setHovered(null)}
                          >
                            {isFuture ? (
                              <span className="text-[0.38rem]" style={{ color: TEXT.muted }}>—</span>
                            ) : (
                              <span className="text-[0.42rem] font-semibold" style={{ color: cellTextColor(opacity) }}>
                                {fmtNaira(val as number, true)}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>Lower revenue</span>
            <div className="flex gap-0.5">
              {[0.08, 0.25, 0.42, 0.58, 0.75, 0.88].map((op) => (
                <div key={op} className="w-5 h-3 rounded-sm" style={{ background: GOLD_BG(op) }} />
              ))}
            </div>
            <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>Higher revenue</span>
          </div>

          {/* Insight */}
          {bestCohort && (
            <div className="mt-4 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
              <p className="text-[0.50rem] tracking-[0.04em]" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>{bestCohort.cohort} cohort</span> generated{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>
                  {fmtNaira(bestCohort.values[0] as number)}
                </span>{' '}
                in their first month — the highest Month 0 revenue of any cohort.
              </p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
