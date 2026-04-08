'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { CustomersData } from '@/types/analytics-customers';

const BAR_COLORS = [
  '#a78bfa', '#a78bfa', '#a78bfa',
  'rgba(192,192,192,0.90)', 'rgba(192,192,192,0.90)',
  GOLD,
];

interface TooltipEntry { value: number }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 min-w-[130px]" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>
        {payload[0].value} customers
      </p>
    </div>
  );
}

interface Props { data: CustomersData | null }

export default function LTVDistribution({ data }: Props) {
  const histogram = data?.ltvHistogram   ?? [];
  const segments  = data?.ltvSegments    ?? [];
  const avgLTV    = data?.avgLTV         ?? 0;
  const medianLTV = data?.medianLTV      ?? 0;
  const totalC    = segments.reduce((s, t) => s + t.customers, 0);

  const goldSeg   = segments.find((s) => s.tier === 'Gold');

  return (
    <SectionCard>
      <SectionHeading title="LTV Distribution" />

      <p className="text-[0.48rem] leading-relaxed mb-5" style={{ color: TEXT.secondary }}>
        Distribution of customer lifetime value across segments. Gold customers represent the highest-value tier.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Customers by LTV Range
          </p>
          {histogram.length === 0 ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="24%">
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="range" tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {histogram.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i] ?? GOLD} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[0.46rem] tracking-[0.10em] uppercase" style={{ color: TEXT.secondary }}>
            Tier Breakdown
          </p>

          {segments.map((seg) => (
            <div key={seg.tier} className="p-3" style={{ border: `1px solid ${BORDER.default}`, background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
                  <span className="text-[0.52rem] font-semibold" style={{ color: seg.color }}>{seg.tier}</span>
                </div>
                <span className="text-[0.44rem]" style={{ color: TEXT.muted }}>{seg.range}</span>
              </div>

              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-[0.72rem] font-semibold leading-tight" style={{ color: TEXT.primary }}>
                    {seg.customers.toLocaleString()}
                  </p>
                  <p className="text-[0.42rem]" style={{ color: TEXT.muted }}>customers</p>
                </div>
                <p className="text-[0.52rem] font-medium" style={{ color: seg.color }}>{seg.pct}%</p>
              </div>

              <div className="h-1 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full" style={{ width: `${seg.pct}%`, background: seg.color }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>Revenue share</span>
                <span className="text-[0.48rem] font-semibold" style={{ color: TEXT.secondary }}>{seg.revPct}%</span>
              </div>
              <div className="h-1 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full" style={{ width: `${seg.revPct}%`, background: GOLD_BG(0.55) }} />
              </div>
            </div>
          ))}

          {goldSeg && goldSeg.customers > 0 && totalC > 0 && (
            <div className="p-3 mt-1" style={{ background: GOLD_BG(0.06), border: `1px solid ${GOLD_BG(0.20)}` }}>
              <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>Gold customers ({goldSeg.pct}%)</span> drive{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{goldSeg.revPct}% of total revenue</span> —
                highest-value tier worth protecting.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        {[
          { label: 'Total customers', value: totalC.toLocaleString() },
          { label: 'Avg LTV',         value: fmtNaira(avgLTV, true)    },
          { label: 'Median LTV',      value: fmtNaira(medianLTV, true)  },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
            <p className="mt-0.5 text-[0.64rem] font-semibold" style={{ color: TEXT.primary }}>{item.value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
