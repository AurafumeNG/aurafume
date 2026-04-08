'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER, CHART_COLORS,
  SectionCard, SectionHeading, ToggleGroup, fmtNaira,
} from './shared';
import type { OverviewData, RevenuePoint } from '@/types/analytics-overview';

type MetricKey = 'revenue' | 'orders' | 'aov';
type GranKey   = 'daily'   | 'weekly'  | 'monthly';

const METRIC_OPTIONS: { label: string; value: MetricKey }[] = [
  { label: 'Revenue', value: 'revenue' },
  { label: 'Orders',  value: 'orders'  },
  { label: 'AOV',     value: 'aov'     },
];
const GRAN_OPTIONS: { label: string; value: GranKey }[] = [
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
];

function fmtY(v: number, metric: MetricKey) {
  return metric === 'revenue' || metric === 'aov' ? fmtNaira(v, true) : String(v);
}

interface TooltipPayload { value: number; name: string }

function CustomTooltip({
  active, payload, label, metric, compare,
}: {
  active?:  boolean;
  payload?: TooltipPayload[];
  label?:   string;
  metric:   MetricKey;
  compare:  boolean;
}) {
  if (!active || !payload?.length) return null;
  const cur  = payload.find((p) => p.name === 'current');
  const prev = payload.find((p) => p.name === 'previous');
  const pct  = cur && prev && prev.value
    ? (((cur.value - prev.value) / prev.value) * 100).toFixed(1)
    : null;

  return (
    <div className="p-3 min-w-[160px]"
      style={{ background: '#242424', border: `1px solid ${BORDER.default}`, boxShadow: '0 8px 24px rgba(0,0,0,0.40)' }}>
      <p className="text-[0.50rem] tracking-[0.10em] uppercase mb-2" style={{ color: TEXT.muted }}>{label}</p>
      {cur && <p className="text-[0.58rem] font-semibold" style={{ color: TEXT.primary }}>{fmtY(cur.value, metric)}</p>}
      {compare && prev && (
        <>
          <p className="mt-1 text-[0.50rem]" style={{ color: TEXT.secondary }}>Prev: {fmtY(prev.value, metric)}</p>
          {pct && (
            <p className="text-[0.48rem] font-medium mt-0.5"
              style={{ color: Number(pct) >= 0 ? '#4ade80' : '#f87171' }}>
              {Number(pct) >= 0 ? '↑' : '↓'} {Math.abs(Number(pct))}%
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props { compare: boolean; data: OverviewData | null }

export default function RevenueChart({ compare, data }: Props) {
  const [metric, setMetric] = useState<MetricKey>('revenue');
  const [gran,   setGran]   = useState<GranKey>('daily');

  const rawData: RevenuePoint[] =
    gran === 'daily'   ? (data?.revenueDaily   ?? []) :
    gran === 'weekly'  ? (data?.revenueWeekly  ?? []) :
                         (data?.revenueMonthly ?? []);

  const chartData = rawData.map((d) => ({
    ...d,
    current:  metric === 'revenue' ? d.revenue : metric === 'orders' ? d.orders : d.aov,
    previous: metric === 'revenue' ? d.prevRevenue
            : metric === 'orders'  ? d.prevOrders
            : (d.prevOrders > 0 ? Math.round(d.prevRevenue / d.prevOrders) : 0),
  }));

  const total = chartData.reduce((s, d) => s + d.current, 0);
  const peak  = chartData.length > 0
    ? chartData.reduce((mx, d) => d.current > mx.current ? d : mx, chartData[0])
    : null;
  const avg   = chartData.length > 0 ? Math.round(total / chartData.length) : 0;

  return (
    <SectionCard>
      <SectionHeading
        title="Revenue Overview"
        action={
          <div className="flex items-center gap-2">
            <ToggleGroup options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
            <ToggleGroup options={GRAN_OPTIONS}   value={gran}   onChange={setGran}   />
          </div>
        }
      />

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="curGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={GOLD} stopOpacity={0.25} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.4)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="rgba(255,255,255,0.4)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date"
              tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={(v) => fmtY(v as number, metric)}
              tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
              axisLine={false} tickLine={false} width={58} />
            <Tooltip content={<CustomTooltip metric={metric} compare={compare} />}
              cursor={{ stroke: GOLD_BG(0.30), strokeWidth: 1 }} />
            {compare && (
              <Area type="monotone" dataKey="previous" name="previous"
                stroke={CHART_COLORS.prev} strokeWidth={1.2} strokeDasharray="4 3"
                fill="url(#prevGrad)" dot={false} />
            )}
            <Area type="monotone" dataKey="current" name="current"
              stroke={GOLD} strokeWidth={2} fill="url(#curGrad)" dot={false} />
            {compare && (
              <Legend wrapperStyle={{ fontSize: 9, color: TEXT.secondary, paddingTop: 8 }}
                formatter={(v) => v === 'current' ? 'Current period' : 'Previous period'} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        {[
          { label: 'Total for period', value: fmtY(total, metric) },
          { label: `Peak ${gran === 'daily' ? 'day' : gran === 'weekly' ? 'week' : 'month'}`,
            value: peak ? `${fmtY(peak.current, metric)} (${peak.date})` : '—' },
          { label: `Avg per ${gran === 'daily' ? 'day' : gran === 'weekly' ? 'week' : 'month'}`,
            value: fmtY(avg, metric) },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
            <p className="mt-0.5 text-[0.62rem] font-semibold" style={{ color: TEXT.primary }}>{item.value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
