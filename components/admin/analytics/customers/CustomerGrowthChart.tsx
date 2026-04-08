'use client';

import { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, ToggleGroup,
} from '../shared';
import type { CustomersData } from '@/types/analytics-customers';

type GranKey = 'daily' | 'weekly' | 'monthly';

const GRAN_OPTIONS: { label: string; value: GranKey }[] = [
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
];

const NEW_COLOR   = '#4ade80';
const TOTAL_COLOR = GOLD;

interface TooltipEntry { dataKey: string; value: number }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const newC  = payload.find((p) => p.dataKey === 'newCustomers');
  const total = payload.find((p) => p.dataKey === 'total');
  return (
    <div className="p-3" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-2" style={{ color: TEXT.muted }}>{label}</p>
      {newC && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: NEW_COLOR }} />
            <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>New</span>
          </div>
          <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>+{newC.value}</span>
        </div>
      )}
      {total && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: TOTAL_COLOR }} />
            <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>Total</span>
          </div>
          <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>{total.value.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

interface Props { data: CustomersData | null }

export default function CustomerGrowthChart({ data }: Props) {
  const [gran, setGran] = useState<GranKey>('monthly');

  const chartData =
    gran === 'daily'   ? (data?.growthDaily   ?? []) :
    gran === 'weekly'  ? (data?.growthWeekly  ?? []) :
                         (data?.growthMonthly ?? []);

  const milestones = gran === 'monthly' ? (data?.milestones ?? []) : [];

  const periodNew   = (data?.growthDaily   ?? []).reduce((s, d) => s + d.newCustomers, 0);
  const totalAll    = data?.kpis.totalCustomers ?? 0;
  const lastMonthly = data?.growthMonthly?.slice(-1)[0];
  const growthRate  = data?.growthMonthly && data.growthMonthly.length >= 2
    ? (() => {
        const arr = data.growthMonthly;
        const prev = arr[arr.length - 2]?.total || 1;
        const cur  = arr[arr.length - 1]?.total || 0;
        const pct  = Math.round(((cur - prev) / prev) * 100);
        return `${pct > 0 ? '+' : ''}${pct}%`;
      })()
    : '—';

  return (
    <SectionCard>
      <SectionHeading
        title="Customer Growth"
        action={<ToggleGroup options={GRAN_OPTIONS} value={gran} onChange={setGran} />}
      />

      <div className="flex gap-5 mb-4">
        {[
          { label: 'New Customers',   color: NEW_COLOR,   area: true },
          { label: 'Total Customers', color: TOTAL_COLOR, area: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.area
              ? <div className="w-3 h-3 rounded-sm" style={{ background: `${item.color}40` }} />
              : <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={item.color} strokeWidth={2} /></svg>}
            <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>{item.label}</span>
          </div>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data for this period</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NEW_COLOR} stopOpacity={0.30} />
                  <stop offset="100%" stopColor={NEW_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date"
                tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="new" orientation="right"
                tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="total"
                tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: GOLD_BG(0.25), strokeWidth: 1 }} />

              {milestones.map((m) => (
                <ReferenceLine key={m.label} x={m.x} yAxisId="total"
                  stroke={GOLD_BG(0.40)} strokeDasharray="3 3"
                  label={{ value: m.label, fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit', position: 'top' }} />
              ))}

              <Area yAxisId="new" type="monotone" dataKey="newCustomers"
                stroke={NEW_COLOR} strokeWidth={1.5} fill="url(#newGrad)" dot={false} />
              <Line yAxisId="total" type="monotone" dataKey="total"
                stroke={TOTAL_COLOR} strokeWidth={2} dot={false}
                activeDot={{ r: 3, fill: TOTAL_COLOR }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        {[
          { label: 'Period new customers', value: periodNew.toLocaleString() },
          { label: 'Total customers',      value: totalAll.toLocaleString() },
          { label: 'Monthly growth rate',  value: growthRate },
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
