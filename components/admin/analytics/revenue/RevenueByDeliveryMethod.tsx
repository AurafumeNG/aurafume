'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { RevenueData, DeliveryMethodStat } from '@/types/analytics-revenue';

const DELIVERY_COLORS: Record<string, string> = {
  express:  'oklch(0.55 0.09 74)',
  standard: 'rgba(180,130,60,0.55)',
  pickup:   'rgba(180,130,60,0.28)',
};

interface TooltipPayload { payload: DeliveryMethodStat }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="p-3" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem] tracking-[0.10em] uppercase mb-1.5" style={{ color: TEXT.muted }}>{d.method}</p>
      <p className="text-[0.58rem] font-semibold" style={{ color: TEXT.primary }}>{fmtNaira(d.revenue, true)}</p>
      <p className="text-[0.46rem] mt-0.5" style={{ color: TEXT.secondary }}>
        {d.orders} orders · AOV {fmtNaira(d.aov, true)}
      </p>
    </div>
  );
}

interface Props { data: RevenueData | null }

export default function RevenueByDeliveryMethod({ data }: Props) {
  const stats: DeliveryMethodStat[] = data?.deliveryStats ?? [];

  if (stats.length === 0) {
    return (
      <SectionCard>
        <SectionHeading title="Revenue by Delivery Method" />
        <p className="text-[0.48rem] py-8 text-center" style={{ color: TEXT.muted }}>No delivery data for this period</p>
      </SectionCard>
    );
  }

  const totalOrders  = stats.reduce((s, r) => s + r.orders, 0);
  const totalRevenue = stats.reduce((s, r) => s + r.revenue, 0);
  const totalFee     = stats.reduce((s, r) => s + r.deliveryFee, 0);

  return (
    <SectionCard>
      <SectionHeading title="Revenue by Delivery Method" />

      {/* Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
              {['Method', 'Orders', 'Revenue', 'AOV', 'Delivery Fee Collected'].map((col) => (
                <th key={col} className="pb-2 text-left text-[0.44rem] tracking-[0.14em] uppercase font-medium"
                  style={{ color: TEXT.muted }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((row, i) => {
              const color = DELIVERY_COLORS[row.key] ?? GOLD_BG(0.50);
              return (
                <tr key={row.key} style={{ borderBottom: i < stats.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-[0.50rem] font-medium" style={{ color: TEXT.primary }}>{row.method}</span>
                    </div>
                  </td>
                  <td className="py-3"><span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>{row.orders}</span></td>
                  <td className="py-3"><span className="text-[0.52rem] font-semibold" style={{ color: GOLD }}>{fmtNaira(row.revenue, true)}</span></td>
                  <td className="py-3"><span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>{fmtNaira(row.aov, true)}</span></td>
                  <td className="py-3">
                    <span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>
                      {row.deliveryFee > 0 ? fmtNaira(row.deliveryFee, true) : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${BORDER.default}` }}>
              <td className="pt-3"><span className="text-[0.46rem] tracking-[0.10em] uppercase font-semibold" style={{ color: TEXT.muted }}>Total</span></td>
              <td className="pt-3"><span className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>{totalOrders}</span></td>
              <td className="pt-3"><span className="text-[0.52rem] font-semibold" style={{ color: GOLD }}>{fmtNaira(totalRevenue, true)}</span></td>
              <td className="pt-3"><span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>—</span></td>
              <td className="pt-3"><span className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>{fmtNaira(totalFee, true)}</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bar chart */}
      <p className="text-[0.48rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.muted }}>Revenue by Method</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={40}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="method" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: string) =>
                v === 'Express Delivery' ? 'Express' : v === 'Standard Delivery' ? 'Standard' : v
              } />
            <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
              axisLine={false} tickLine={false} width={52}
              tickFormatter={(v) => fmtNaira(v as number, true)} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
              {stats.map((entry) => (
                <Cell key={entry.key} fill={DELIVERY_COLORS[entry.key] ?? GOLD_BG(0.50)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
