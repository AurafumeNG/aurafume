'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, ToggleGroup, fmtNaira } from '../shared';
import type { RevenueData, RevenueTrendPoint } from '@/types/analytics-revenue';

type GranKey = 'daily' | 'weekly' | 'monthly';

const GRAN_OPTIONS: { label: string; value: GranKey }[] = [
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
];

const NET_COLOR  = '#60a5fa';
const REF_COLOR  = '#f87171';
const PREV_COLOR = 'rgba(255,255,255,0.22)';

interface TooltipEntry { dataKey: string; value: number; color: string; name: string }

function CustomTooltip({ active, payload, label, compare }: {
  active?: boolean; payload?: TooltipEntry[]; label?: string; compare: boolean;
}) {
  if (!active || !payload?.length) return null;
  const get = (key: string) => payload.find((p) => p.dataKey === key);
  return (
    <div className="p-3 min-w-[190px]"
      style={{ background: '#242424', border: `1px solid ${BORDER.default}`, boxShadow: '0 8px 24px rgba(0,0,0,0.40)' }}>
      <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-2.5" style={{ color: TEXT.muted }}>{label}</p>
      {[
        { key: 'gross',   label: 'Gross Revenue', color: GOLD      },
        { key: 'net',     label: 'Net Revenue',   color: NET_COLOR },
        { key: 'refunds', label: 'Refunds',       color: REF_COLOR },
      ].map(({ key, label: lbl, color }) => {
        const entry = get(key);
        if (!entry) return null;
        return (
          <div key={key} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>{lbl}</span>
            </div>
            <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
              {fmtNaira(entry.value, true)}
            </span>
          </div>
        );
      })}
      {compare && get('prevGross') && (
        <>
          <div className="my-1.5" style={{ borderTop: `1px solid ${BORDER.default}` }} />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: PREV_COLOR }} />
              <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>Prev Gross</span>
            </div>
            <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
              {fmtNaira(get('prevGross')!.value, true)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

interface Props { compare: boolean; data: RevenueData | null }

export default function RevenueTrendChart({ compare, data }: Props) {
  const [gran, setGran] = useState<GranKey>('daily');

  const series: RevenueTrendPoint[] =
    gran === 'daily'   ? (data?.trendDaily   ?? []) :
    gran === 'weekly'  ? (data?.trendWeekly  ?? []) :
                         (data?.trendMonthly ?? []);

  // Summary stats
  const peakPoint = series.reduce<RevenueTrendPoint | null>(
    (mx, p) => (!mx || p.gross > mx.gross ? p : mx), null
  );
  const totalNet  = series.reduce((s, p) => s + p.net, 0);
  const totalRef  = series.reduce((s, p) => s + p.refunds, 0);

  return (
    <SectionCard>
      <SectionHeading
        title="Revenue Trend"
        action={<ToggleGroup options={GRAN_OPTIONS} value={gran} onChange={setGran} />}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {[
          { label: 'Gross Revenue', color: GOLD,       dash: false },
          { label: 'Net Revenue',   color: NET_COLOR,  dash: false },
          { label: 'Refunds',       color: REF_COLOR,  dash: false },
          ...(compare ? [{ label: 'Prev Gross (comparison)', color: PREV_COLOR, dash: true }] : []),
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <svg width="20" height="10">
              <line x1="0" y1="5" x2="20" y2="5" stroke={item.color}
                strokeWidth={item.dash ? 1.5 : 2} strokeDasharray={item.dash ? '4 3' : undefined} />
            </svg>
            <span className="text-[0.46rem] tracking-[0.06em]" style={{ color: TEXT.secondary }}>{item.label}</span>
          </div>
        ))}
      </div>

      {series.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No revenue data for this period</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} width={58}
                tickFormatter={(v) => fmtNaira(v as number, true)} />
              <Tooltip content={<CustomTooltip compare={compare} />}
                cursor={{ stroke: GOLD_BG(0.25), strokeWidth: 1 }} />
              {compare && (
                <Line type="monotone" dataKey="prevGross" stroke={PREV_COLOR}
                  strokeWidth={1.2} strokeDasharray="4 3" dot={false} activeDot={false} />
              )}
              <Line type="monotone" dataKey="gross"   stroke={GOLD}      strokeWidth={2}   dot={false} activeDot={{ r: 3, fill: GOLD }} />
              <Line type="monotone" dataKey="net"     stroke={NET_COLOR} strokeWidth={1.8} dot={false} activeDot={{ r: 3, fill: NET_COLOR }} />
              <Line type="monotone" dataKey="refunds" stroke={REF_COLOR} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: REF_COLOR }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        {[
          { label: 'Peak gross day',    value: peakPoint ? `${fmtNaira(peakPoint.gross, true)} (${peakPoint.date})` : '—', color: GOLD      },
          { label: 'Total net revenue', value: totalNet > 0 ? fmtNaira(totalNet) : '—',                                   color: NET_COLOR },
          { label: 'Total refunded',    value: totalRef > 0 ? fmtNaira(totalRef) : '—',                                   color: REF_COLOR },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
            <p className="mt-0.5 text-[0.62rem] font-semibold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
