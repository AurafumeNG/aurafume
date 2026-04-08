'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, ToggleGroup, fmtNaira } from './shared';
import type { OverviewData, StateItem } from '@/types/analytics-overview';

type Mode = 'revenue' | 'orders' | 'customers';

const MODE_OPTIONS: { label: string; value: Mode }[] = [
  { label: 'Revenue',   value: 'revenue'   },
  { label: 'Orders',    value: 'orders'    },
  { label: 'Customers', value: 'customers' },
];

const OPACITIES = [1, 0.88, 0.76, 0.66, 0.58, 0.50, 0.44, 0.38, 0.34, 0.30];

interface TooltipPayload { payload: StateItem; value: number }

function CustomTooltip({ active, payload, mode }: { active?: boolean; payload?: TooltipPayload[]; mode: Mode }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="p-3" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem] tracking-[0.08em] uppercase mb-1.5" style={{ color: TEXT.muted }}>{d.state}</p>
      <p className="text-[0.58rem] font-semibold" style={{ color: TEXT.primary }}>
        {mode === 'revenue' ? fmtNaira(d.revenue, true) : mode === 'orders' ? `${d.orders} orders` : `${d.customers} customers`}
      </p>
      <p className="text-[0.46rem] mt-0.5" style={{ color: TEXT.secondary }}>{d.pct}% of total</p>
    </div>
  );
}

interface Props { data: OverviewData | null }

export default function GeographicDistribution({ data }: Props) {
  const [mode, setMode] = useState<Mode>('revenue');

  const sorted = [...(data?.states ?? [])].sort((a, b) => b[mode] - a[mode]);

  return (
    <SectionCard>
      <SectionHeading
        title="Geographic Distribution"
        action={<ToggleGroup options={MODE_OPTIONS} value={mode} onChange={setMode} />}
      />

      {sorted.length === 0 ? (
        <p className="text-[0.48rem] py-8 text-center" style={{ color: TEXT.muted }}>No geographic data for this period</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 64, bottom: 0, left: 0 }}
              barCategoryGap="22%">
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => mode === 'revenue' ? fmtNaira(v as number, true) : String(v)} />
              <YAxis type="category" dataKey="state" width={76}
                tick={{ fill: TEXT.secondary, fontSize: 7.5, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey={mode} radius={[0, 3, 3, 0]}
                label={({ x, y, width, height, index }: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; index?: number }) => (
                  <text x={Number(x ?? 0) + Number(width ?? 0) + 6} y={Number(y ?? 0) + Number(height ?? 0) / 2} dy="0.35em"
                    fill={TEXT.muted} fontSize={8} fontFamily="inherit">
                    {sorted[index ?? 0]?.pct ?? 0}%
                  </text>
                )}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={GOLD_BG(OPACITIES[i] ?? 0.30)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
