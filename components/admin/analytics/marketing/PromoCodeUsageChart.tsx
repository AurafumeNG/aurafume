'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, ToggleGroup, fmtNaira } from '../shared';
import type { MarketingData } from '@/types/analytics-marketing';

type MetricKey = 'uses' | 'revenue' | 'discount';

const METRIC_OPTIONS: { label: string; value: MetricKey }[] = [
  { label: 'Uses',            value: 'uses'     },
  { label: 'Revenue',         value: 'revenue'  },
  { label: 'Discount Amount', value: 'discount' },
];

interface TooltipEntry { dataKey: string; value: number; color: string; name: string }

function CustomTooltip({
  active, payload, label, metric,
}: { active?: boolean; payload?: TooltipEntry[]; label?: string; metric: MetricKey }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 min-w-[180px]" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-2" style={{ color: TEXT.muted }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[0.44rem]" style={{ color: TEXT.secondary }}>{p.name}</span>
          </div>
          <span className="text-[0.48rem] font-semibold" style={{ color: TEXT.primary }}>
            {metric === 'uses' ? p.value : fmtNaira(p.value, true)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props { data: MarketingData | null }

export default function PromoCodeUsageChart({ data }: Props) {
  const [metric, setMetric] = useState<MetricKey>('uses');

  const topCodes   = data?.topCodes   ?? [];
  const promoDaily = data?.promoDaily ?? [];

  if (!data || topCodes.length === 0) {
    return (
      <SectionCard>
        <SectionHeading
          title="Promo Code Usage Over Time"
          action={<ToggleGroup options={METRIC_OPTIONS} value={metric} onChange={setMetric} />}
        />
        <div className="h-64 flex items-center justify-center">
          <p className="text-[0.50rem]" style={{ color: TEXT.muted }}>No promo code usage in this period</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionHeading
        title="Promo Code Usage Over Time"
        action={<ToggleGroup options={METRIC_OPTIONS} value={metric} onChange={setMetric} />}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {topCodes.map((code) => (
          <div key={code.code} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5" style={{ background: code.color }} />
            <span className="text-[0.44rem] font-mono" style={{ color: TEXT.secondary }}>{code.code}</span>
          </div>
        ))}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={promoDaily} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
              axisLine={false} tickLine={false} width={metric === 'uses' ? 24 : 44}
              tickFormatter={(v) => metric === 'uses' ? String(v) : fmtNaira(v, true)}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as unknown as TooltipEntry[] | undefined}
                  label={props.label as string | undefined}
                  metric={metric}
                />
              )}
              cursor={{ stroke: GOLD_BG(0.25), strokeWidth: 1 }}
            />
            {topCodes.map((code) => (
              <Line
                key={code.code}
                type="monotone"
                dataKey={`${code.code}_${metric}`}
                name={code.code}
                stroke={code.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: code.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary totals */}
      <div
        className="mt-4 pt-4 flex flex-wrap gap-6"
        style={{ borderTop: `1px solid ${BORDER.default}` }}
      >
        {topCodes.map((code) => (
          <div key={code.code}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-0.5" style={{ background: code.color }} />
              <span className="text-[0.40rem] font-mono tracking-[0.08em]" style={{ color: TEXT.muted }}>
                {code.code}
              </span>
            </div>
            <p className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>
              {metric === 'uses'
                ? `${code.uses} uses`
                : metric === 'revenue'
                ? fmtNaira(code.revenue, true)
                : fmtNaira(code.discountGiven, true)}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
