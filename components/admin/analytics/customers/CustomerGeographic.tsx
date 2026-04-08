'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, ToggleGroup, fmtNaira,
} from '../shared';
import type { CustomersData, GeoRow } from '@/types/analytics-customers';

type MetricKey = 'customers' | 'orders' | 'revenue';

const METRIC_OPTIONS: { label: string; value: MetricKey }[] = [
  { label: 'Customers', value: 'customers' },
  { label: 'Orders',    value: 'orders'    },
  { label: 'Revenue',   value: 'revenue'   },
];

interface TooltipEntry { value: number; dataKey: MetricKey }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const formatted = p.dataKey === 'revenue' ? fmtNaira(p.value) : p.value.toLocaleString();
  return (
    <div className="p-3 min-w-[130px]" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>{formatted}</p>
    </div>
  );
}

interface Props { data: CustomersData | null }

export default function CustomerGeographic({ data }: Props) {
  const [metric, setMetric] = useState<MetricKey>('customers');

  const geoData: GeoRow[] = data?.geoData ?? [];
  const sorted = [...geoData].sort((a, b) => b[metric] - a[metric]);
  const maxVal  = sorted[0]?.[metric] ?? 1;
  const topState = sorted[0];

  return (
    <SectionCard>
      <SectionHeading
        title="Geographic Distribution"
        action={<ToggleGroup options={METRIC_OPTIONS} value={metric} onChange={setMetric} />}
      />

      <p className="text-[0.48rem] leading-relaxed mb-5" style={{ color: TEXT.secondary }}>
        Customer distribution across Nigerian states based on shipping addresses.
        {topState ? ` ${topState.state} leads all metrics.` : ''}
      </p>

      {sorted.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No geographic data for this period</p>
        </div>
      ) : (
        <>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sorted}
                layout="vertical"
                margin={{ top: 4, right: 60, bottom: 0, left: 60 }}
                barCategoryGap="25%"
              >
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number"
                  tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => metric === 'revenue' ? fmtNaira(v as number, true) : (v as number).toLocaleString()}
                />
                <YAxis
                  type="category"
                  dataKey="state"
                  tick={{ fill: TEXT.secondary, fontSize: 7.5, fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false} width={68}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey={metric} radius={[0, 3, 3, 0]}>
                  {sorted.map((entry, i) => (
                    <Cell
                      key={entry.state}
                      fill={i === 0 ? GOLD : GOLD_BG(0.25 + (1 - i / sorted.length) * 0.35)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ border: `1px solid ${BORDER.default}` }}>
            <div className="grid px-4 py-2"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1.4fr 1fr', borderBottom: `1px solid ${BORDER.default}`, background: 'rgba(255,255,255,0.02)' }}>
              {['State', 'Customers', 'Orders', 'Revenue', 'AOV'].map((h) => (
                <span key={h} className="text-[0.42rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{h}</span>
              ))}
            </div>
            {sorted.map((row, i) => (
              <div key={row.state}
                className="grid px-4 py-2.5 items-center"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1.4fr 1fr', borderBottom: i < sorted.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-1 rounded-full" style={{ width: `${(row[metric] / maxVal) * 100}%`, background: i === 0 ? GOLD : GOLD_BG(0.50) }} />
                  </div>
                  <span className="text-[0.48rem] font-medium" style={{ color: TEXT.secondary }}>{row.state}</span>
                </div>
                <span className="text-[0.48rem]" style={{ color: TEXT.secondary }}>{row.customers.toLocaleString()}</span>
                <span className="text-[0.48rem]" style={{ color: TEXT.secondary }}>{row.orders.toLocaleString()}</span>
                <span className="text-[0.48rem]" style={{ color: TEXT.secondary }}>{fmtNaira(row.revenue, true)}</span>
                <span className="text-[0.48rem]" style={{ color: TEXT.secondary }}>{fmtNaira(row.aov, true)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
