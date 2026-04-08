'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { RevenueData } from '@/types/analytics-revenue';

const REASON_COLORS = [
  '#f87171',
  'rgba(248,113,113,0.70)',
  'rgba(248,113,113,0.50)',
  'rgba(248,113,113,0.35)',
];

interface TooltipPayload { value: number }

function RefundTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.08em] mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.56rem] font-semibold" style={{ color: '#f87171' }}>{fmtNaira(payload[0].value, true)}</p>
    </div>
  );
}

function ReasonTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.08em] mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.56rem] font-semibold" style={{ color: TEXT.primary }}>{payload[0].value} refunds</p>
    </div>
  );
}

interface Props { data: RevenueData | null }

export default function RefundsAnalysis({ data }: Props) {
  const kpis    = data?.refundKpis;
  const reasons = data?.refundReasons    ?? [];
  const overTime= data?.refundsOverTime  ?? [];
  const orders  = data?.refundedOrders   ?? [];

  return (
    <SectionCard>
      <SectionHeading title="Refunds & Returns" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Refunds Issued',  value: kpis ? `${kpis.count} refund${kpis.count !== 1 ? 's' : ''}` : '—', color: '#f87171' },
          { label: 'Total Amount Refunded', value: kpis ? fmtNaira(kpis.amount) : '—',                                  color: '#f87171' },
          { label: 'Refund Rate',           value: kpis ? `${kpis.rate}%` : '—',                                        color: TEXT.primary },
          { label: 'Avg Refund Amount',     value: kpis ? fmtNaira(kpis.avgAmount) : '—',                               color: TEXT.primary },
        ].map((item) => (
          <div key={item.label} className="p-4"
            style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)' }}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
            <p className="mt-1.5 text-[0.90rem] font-semibold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {kpis?.count === 0 ? (
        <p className="text-[0.48rem] py-6 text-center" style={{ color: TEXT.muted }}>No refunds in this period</p>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Refund reasons bar */}
            <div>
              <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
                Refund Reasons
              </p>
              {reasons.length === 0 ? (
                <p className="text-[0.48rem] py-4" style={{ color: TEXT.muted }}>No data</p>
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reasons} layout="vertical"
                      margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barSize={16}>
                      <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }}
                        axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="reason"
                        tick={{ fill: TEXT.secondary, fontSize: 8, fontFamily: 'inherit' }}
                        axisLine={false} tickLine={false} width={90} />
                      <Tooltip content={<ReasonTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                        {reasons.map((_, i) => (
                          <Cell key={i} fill={REASON_COLORS[i] ?? '#f87171'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Refunds over time line */}
            <div>
              <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
                Refunds Over Time
              </p>
              {overTime.length === 0 ? (
                <p className="text-[0.48rem] py-4" style={{ color: TEXT.muted }}>No data</p>
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overTime} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                        axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                        axisLine={false} tickLine={false} width={52}
                        tickFormatter={(v) => fmtNaira(v as number, true)} />
                      <Tooltip content={<RefundTooltip />}
                        cursor={{ stroke: 'rgba(248,113,113,0.25)', strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="amount" stroke="#f87171" strokeWidth={2}
                        dot={{ fill: '#f87171', r: 3, strokeWidth: 0 }} activeDot={{ r: 4, fill: '#f87171' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Refunded orders table */}
          {orders.length > 0 && (
            <div>
              <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
                Refunded Orders
              </p>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                      {['Order ID', 'Customer', 'Amount', 'Date'].map((col) => (
                        <th key={col} className="pb-2 text-left text-[0.44rem] tracking-[0.14em] uppercase font-medium pr-6"
                          style={{ color: TEXT.muted }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <tr key={order.id}
                        style={{ borderBottom: i < orders.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>
                        <td className="py-2.5 pr-6">
                          <span className="text-[0.50rem] font-mono font-medium" style={{ color: GOLD_BG(1) }}>
                            {order.id}
                          </span>
                        </td>
                        <td className="py-2.5 pr-6">
                          <span className="text-[0.50rem]" style={{ color: TEXT.primary }}>{order.customer}</span>
                        </td>
                        <td className="py-2.5 pr-6">
                          <span className="text-[0.50rem] font-semibold" style={{ color: '#f87171' }}>
                            {fmtNaira(order.amount, true)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="text-[0.48rem]" style={{ color: TEXT.muted }}>{order.date}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
