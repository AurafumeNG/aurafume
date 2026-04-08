'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading } from '../shared';
import type { CustomersData } from '@/types/analytics-customers';

const BAR_COLORS = [
  'rgba(255,255,255,0.25)',
  GOLD_BG(0.55),
  GOLD_BG(0.75),
  GOLD,
];

interface TooltipEntry { value: number }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 min-w-[140px]" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>
        {payload[0].value.toLocaleString()} customers
      </p>
    </div>
  );
}

interface Props { data: CustomersData | null }

export default function PurchaseFrequency({ data }: Props) {
  const freqData = data?.freqData ?? [];
  const stats    = data?.freqStats;

  const singleBuyers = freqData[0];
  const singlePct    = singleBuyers?.pct ?? 0;

  return (
    <SectionCard>
      <SectionHeading title="Purchase Frequency" />

      <p className="text-[0.48rem] leading-relaxed mb-5" style={{ color: TEXT.secondary }}>
        How often customers place orders. Most customers are single-purchase — a key conversion opportunity.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {freqData.length === 0 ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={freqData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="customers" radius={[3, 3, 0, 0]}>
                    {freqData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i] ?? GOLD} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[0.46rem] tracking-[0.10em] uppercase" style={{ color: TEXT.secondary }}>
            Breakdown
          </p>
          {freqData.map((row, i) => (
            <div key={row.label} className="p-3" style={{ border: `1px solid ${BORDER.default}`, background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: BAR_COLORS[i] ?? GOLD }} />
                  <span className="text-[0.48rem] font-medium" style={{ color: TEXT.secondary }}>{row.label}</span>
                </div>
                <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
                  {row.customers.toLocaleString()}
                </span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full" style={{ width: `${row.pct}%`, background: BAR_COLORS[i] ?? GOLD }} />
              </div>
              <p className="mt-1 text-[0.42rem] text-right" style={{ color: TEXT.muted }}>{row.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 grid grid-cols-2 gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        {[
          { label: 'Avg orders per customer', value: stats ? `${stats.avgOrders}×`   : '—' },
          { label: 'Repeat purchase rate',    value: stats ? `${stats.repeatRate}%`  : '—' },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
            <p className="mt-0.5 text-[0.64rem] font-semibold" style={{ color: TEXT.primary }}>{item.value}</p>
          </div>
        ))}
      </div>

      {singlePct > 0 && (
        <div className="mt-4 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
          <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.secondary }}>
            <span style={{ color: GOLD, fontWeight: 600 }}>{singlePct}% of customers</span> have placed only one order.
            Converting even 10% to repeat buyers could meaningfully grow revenue.
          </p>
        </div>
      )}
    </SectionCard>
  );
}
