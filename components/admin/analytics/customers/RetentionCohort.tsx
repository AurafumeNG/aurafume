'use client';

import { useState } from 'react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading } from '../shared';
import type { CustomersData, CohortRow } from '@/types/analytics-customers';

const COL_HEADERS = ['Month 0', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7'];

function cellOpacity(v: number | null): number {
  if (v === null || v === 0) return 0;
  if (v === 100) return 0.10;
  return 0.08 + (v / 42) * 0.80;
}

function cellColor(v: number | null): string {
  if (v === null) return TEXT.muted;
  if (v === 100) return TEXT.secondary;
  if (v >= 25)   return TEXT.primary;
  return TEXT.secondary;
}

interface Props { data: CustomersData | null }

export default function RetentionCohort({ data }: Props) {
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

  const cohorts: CohortRow[] = data?.retentionCohorts ?? [];

  function getNonNull(col: number): number[] {
    return cohorts.map((r) => r.values[col]).filter((v): v is number => v !== null);
  }

  const m1Vals = getNonNull(1);
  const m3Vals = getNonNull(3);
  const avgMonth1 = m1Vals.length > 0 ? Math.round(m1Vals.reduce((s, v) => s + v, 0) / m1Vals.length) : 0;
  const avgMonth3 = m3Vals.length > 0 ? Math.round(m3Vals.reduce((s, v) => s + v, 0) / m3Vals.length) : 0;

  const bestCohort = m3Vals.length > 0
    ? cohorts.reduce<CohortRow | null>((best, r) => {
        const v = r.values[3];
        if (v === null) return best;
        return !best || v > (best.values[3] ?? 0) ? r : best;
      }, null)
    : null;

  return (
    <SectionCard>
      <SectionHeading title="Retention Cohort Analysis" />

      <p className="text-[0.48rem] leading-relaxed mb-4" style={{ color: TEXT.secondary }}>
        % of each acquisition cohort that made another purchase in subsequent months.
        Darker cells indicate higher retention.
      </p>

      {cohorts.length === 0 ? (
        <p className="py-8 text-center text-[0.50rem]" style={{ color: TEXT.muted }}>
          Not enough purchase history to build cohort data.
        </p>
      ) : (
        <>
          <div className="mb-3 h-5 flex items-center">
            {hovered !== null ? (
              <p className="text-[0.46rem]" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>
                  {cohorts[hovered.row]?.cohort} cohort, {COL_HEADERS[hovered.col]}
                </span>
                {' '}—{' '}
                {(() => {
                  const v = cohorts[hovered.row]?.values[hovered.col];
                  return v === null ? 'No data yet' : v === 100 ? '100% (base month)' : `${v}% retained`;
                })()}
              </p>
            ) : (
              <p className="text-[0.46rem]" style={{ color: TEXT.muted }}>Hover a cell to see retention %</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th className="w-16 pb-2 pr-3 text-left text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>
                    Cohort
                  </th>
                  {COL_HEADERS.map((col) => (
                    <th key={col} className="pb-2 text-center text-[0.40rem] tracking-[0.08em] uppercase" style={{ color: TEXT.muted, minWidth: 64 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((row, ri) => (
                  <tr key={row.cohort}>
                    <td className="py-1 pr-3">
                      <span className="text-[0.48rem] font-medium" style={{ color: TEXT.secondary }}>{row.cohort}</span>
                    </td>
                    {row.values.map((val, ci) => {
                      const opacity  = cellOpacity(val);
                      const isHov    = hovered?.row === ri && hovered?.col === ci;
                      const isFuture = val === null;
                      return (
                        <td key={ci} className="py-1 px-0.5">
                          <div
                            className="flex items-center justify-center h-8 rounded-sm cursor-default transition-all duration-100"
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
                              <span className="text-[0.38rem]" style={{ color: 'rgba(255,255,255,0.10)' }}>—</span>
                            ) : (
                              <span className="text-[0.42rem] font-semibold" style={{ color: cellColor(val) }}>
                                {val}%
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

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>Low retention</span>
            {[0.10, 0.25, 0.42, 0.58, 0.75, 0.88].map((op) => (
              <div key={op} className="w-5 h-3 rounded-sm" style={{ background: GOLD_BG(op) }} />
            ))}
            <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>High retention</span>
          </div>

          <div className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ borderTop: `1px solid ${BORDER.default}` }}>
            {[
              {
                label: 'Best retained cohort',
                value: bestCohort?.cohort ?? '—',
                sub:   bestCohort ? `${bestCohort.values[3]}% retention at Month 3` : 'Not enough data',
              },
              {
                label: 'Avg Month 1 retention',
                value: m1Vals.length > 0 ? `${avgMonth1}%` : '—',
                sub:   'Across all cohorts',
              },
              {
                label: 'Avg Month 3 retention',
                value: m3Vals.length > 0 ? `${avgMonth3}%` : '—',
                sub:   'Long-term loyalty indicator',
              },
            ].map((item) => (
              <div key={item.label} className="p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.15)}` }}>
                <p className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
                <p className="mt-1 text-[0.80rem] font-semibold" style={{ color: GOLD }}>{item.value}</p>
                <p className="mt-0.5 text-[0.42rem]" style={{ color: TEXT.secondary }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
