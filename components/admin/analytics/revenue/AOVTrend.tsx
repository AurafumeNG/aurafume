'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, ToggleGroup, fmtNaira } from '../shared';
import type { RevenueData } from '@/types/analytics-revenue';

type GranKey = 'daily' | 'histogram';

const VIEW_OPTIONS: { label: string; value: GranKey }[] = [
  { label: 'Trend',        value: 'daily'     },
  { label: 'Distribution', value: 'histogram' },
];

const HIST_COLORS = [
  'rgba(180,130,60,0.30)',
  'rgba(180,130,60,0.48)',
  GOLD,
  'rgba(180,130,60,0.72)',
  'rgba(180,130,60,0.50)',
  'rgba(180,130,60,0.32)',
];

function AOVTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.08em] mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.56rem] font-semibold" style={{ color: GOLD }}>{fmtNaira(payload[0].value, true)}</p>
    </div>
  );
}

function HistTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.08em] mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.56rem] font-semibold" style={{ color: TEXT.primary }}>{payload[0].value} orders</p>
    </div>
  );
}

interface Props { data: RevenueData | null }

export default function AOVTrend({ data }: Props) {
  const [view, setView] = useState<GranKey>('daily');

  const aovDaily     = data?.aovDaily     ?? [];
  const aovHistogram = data?.aovHistogram ?? [];

  const avgAOV = aovDaily.length > 0
    ? Math.round(aovDaily.reduce((s, d) => s + d.aov, 0) / aovDaily.length)
    : 0;
  const peakAOV   = aovDaily.reduce<typeof aovDaily[0] | null>((mx, d) => (!mx || d.aov > mx.aov ? d : mx), null);
  const lowestAOV = aovDaily.reduce<typeof aovDaily[0] | null>((mn, d) => (!mn || d.aov < mn.aov ? d : mn), null);

  const peakBucket  = aovHistogram.reduce<typeof aovHistogram[0] | null>(
    (mx, b) => (!mx || b.count > mx.count ? b : mx), null
  );
  const totalBucket = aovHistogram.reduce((s, b) => s + b.count, 0);

  return (
    <SectionCard>
      <SectionHeading
        title="Average Order Value Over Time"
        action={<ToggleGroup options={VIEW_OPTIONS} value={view} onChange={setView} />}
      />

      {view === 'daily' ? (
        <>
          {aovDaily.length === 0 ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No AOV data for this period</p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aovDaily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} width={58}
                    tickFormatter={(v) => fmtNaira(v as number, true)} domain={['auto', 'auto']} />
                  <Tooltip content={<AOVTooltip />} cursor={{ stroke: GOLD_BG(0.25), strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="aov" stroke={GOLD} strokeWidth={2}
                    dot={false} activeDot={{ r: 3, fill: GOLD }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
            {[
              { label: 'Period average AOV', value: avgAOV > 0 ? fmtNaira(avgAOV) : '—' },
              { label: 'Peak AOV',           value: peakAOV   ? `${fmtNaira(peakAOV.aov)} (${peakAOV.date})`     : '—' },
              { label: 'Lowest AOV',         value: lowestAOV ? `${fmtNaira(lowestAOV.aov)} (${lowestAOV.date})` : '—' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
                <p className="mt-0.5 text-[0.62rem] font-semibold" style={{ color: TEXT.primary }}>{item.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-[0.46rem] tracking-[0.06em] mb-3" style={{ color: TEXT.secondary }}>
            Distribution of orders by value — showing where most orders cluster
          </p>
          {aovHistogram.length === 0 ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No order distribution data</p>
            </div>
          ) : (
            <>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aovHistogram} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={36}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="range" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} width={28}
                      label={{ value: 'Orders', angle: -90, position: 'insideLeft', fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }} />
                    <Tooltip content={<HistTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {aovHistogram.map((_, i) => (
                        <Cell key={i} fill={HIST_COLORS[i] ?? GOLD_BG(0.40)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {peakBucket && (
                <div className="mt-4 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
                  <p className="text-[0.50rem] tracking-[0.06em]" style={{ color: TEXT.secondary }}>
                    <span style={{ color: GOLD, fontWeight: 600 }}>{peakBucket.range}</span> is the most common
                    order range with <span style={{ color: GOLD, fontWeight: 600 }}>{peakBucket.count} orders</span>
                    {totalBucket > 0 && ` (${Math.round((peakBucket.count / totalBucket) * 100)}% of all orders)`}.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </SectionCard>
  );
}
