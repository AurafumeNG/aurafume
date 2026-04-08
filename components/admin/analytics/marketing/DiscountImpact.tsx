'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { MarketingData, DiscountImpactSide } from '@/types/analytics-marketing';

interface Props { data: MarketingData | null }

interface TooltipEntry { name: string; value: number }
function SplitTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.46rem] font-semibold" style={{ color: TEXT.primary }}>
        {payload[0].name}: {fmtNaira(payload[0].value, true)}
      </p>
    </div>
  );
}

type CompareField = 'aov' | 'orders' | 'revenue' | 'repeatRate';
const COMPARE_ROWS: { label: string; key: CompareField; fmt: (v: number) => string; higherIsBetter: boolean }[] = [
  { label: 'Avg Order Value',       key: 'aov',        fmt: (v) => fmtNaira(v, true), higherIsBetter: true  },
  { label: 'Repeat Purchase Rate',  key: 'repeatRate', fmt: (v) => `${v}%`,           higherIsBetter: true  },
  { label: 'Orders',                key: 'orders',     fmt: (v) => String(v),          higherIsBetter: true  },
  { label: 'Revenue',               key: 'revenue',    fmt: (v) => fmtNaira(v, true), higherIsBetter: true  },
];

export default function DiscountImpact({ data }: Props) {
  const impact = data?.discountImpact;

  const withCode: DiscountImpactSide = impact?.withCode ?? { aov: 0, orders: 0, revenue: 0, repeatRate: 0 };
  const noCode:   DiscountImpactSide = impact?.noCode   ?? { aov: 0, orders: 0, revenue: 0, repeatRate: 0 };
  const revenueSplit  = impact?.revenueSplit  ?? [];
  const totalRevenue  = impact?.totalRevenue  ?? 0;

  const repeatDiff = withCode.repeatRate - noCode.repeatRate;

  return (
    <SectionCard>
      <SectionHeading title="Impact of Discounts on Revenue" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Comparison table */}
        <div>
          <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Orders With vs Without Promo Code
          </p>

          <div style={{ border: `1px solid ${BORDER.default}` }}>
            {/* Header */}
            <div className="grid grid-cols-3 px-4 py-2"
              style={{ borderBottom: `1px solid ${BORDER.default}`, background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-[0.40rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>Metric</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                <span className="text-[0.40rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>With Code</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
                <span className="text-[0.40rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>No Code</span>
              </div>
            </div>

            {COMPARE_ROWS.map((row, i) => {
              const vWith = withCode[row.key] as number;
              const vNo   = noCode[row.key]   as number;
              const diff  = vWith - vNo;
              const better = row.higherIsBetter ? diff >= 0 : diff <= 0;

              return (
                <div key={row.label}
                  className="grid grid-cols-3 px-4 py-2.5 items-center"
                  style={{ borderBottom: i < COMPARE_ROWS.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>
                  <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>{row.label}</span>
                  <div>
                    <span className="text-[0.50rem] font-semibold" style={{ color: GOLD }}>
                      {vWith > 0 ? row.fmt(vWith) : '—'}
                    </span>
                    {diff !== 0 && vWith > 0 && vNo > 0 && (
                      <span className="ml-1 text-[0.38rem]" style={{ color: better ? '#4ade80' : '#f87171' }}>
                        {diff > 0 ? '+' : ''}{row.fmt(Math.abs(diff))}
                      </span>
                    )}
                  </div>
                  <span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>
                    {vNo > 0 ? row.fmt(vNo) : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Insight */}
          {repeatDiff !== 0 && (
            <div className="mt-4 p-3" style={{ background: GOLD_BG(0.06), border: `1px solid ${GOLD_BG(0.20)}` }}>
              <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.secondary }}>
                Customers who use promo codes have a{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>
                  {Math.abs(repeatDiff)}% {repeatDiff > 0 ? 'higher' : 'lower'} repeat purchase rate
                </span>{' '}
                than those who don't.
              </p>
            </div>
          )}
        </div>

        {/* Revenue split donut */}
        <div>
          <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Revenue Split
          </p>

          {totalRevenue > 0 ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueSplit}
                      cx="50%" cy="50%"
                      innerRadius="52%" outerRadius="78%"
                      dataKey="value"
                      startAngle={90} endAngle={-270}
                      strokeWidth={0}
                    >
                      {revenueSplit.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<SplitTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                {revenueSplit.map((seg) => (
                  <div key={seg.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }} />
                        <span className="text-[0.48rem] font-medium" style={{ color: TEXT.secondary }}>{seg.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>
                          {fmtNaira(seg.value, true)}
                        </span>
                        <span className="ml-1.5 text-[0.44rem]" style={{ color: TEXT.muted }}>({seg.pct}%)</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1 rounded-full" style={{ width: `${seg.pct}%`, background: seg.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between"
                style={{ borderTop: `1px solid ${BORDER.default}` }}>
                <span className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>Total Revenue</span>
                <span className="text-[0.56rem] font-semibold" style={{ color: TEXT.primary }}>
                  {fmtNaira(totalRevenue, true)}
                </span>
              </div>
            </>
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-[0.50rem]" style={{ color: TEXT.muted }}>No revenue data in this period</p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
