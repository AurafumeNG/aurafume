'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GOLD, TEXT, BORDER, CHART_COLORS, SectionCard, SectionHeading } from './shared';
import type { OverviewData, StatusItem } from '@/types/analytics-overview';

const STATUS_COLORS: Record<string, string> = {
  Pending:    CHART_COLORS.pending,
  Confirmed:  CHART_COLORS.processing,
  Processing: CHART_COLORS.processing,
  Shipped:    CHART_COLORS.shipped,
  Delivered:  CHART_COLORS.delivered,
  Cancelled:  CHART_COLORS.cancelled,
};

interface TooltipPayload { payload: StatusItem }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="p-3" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem] tracking-[0.10em] uppercase mb-1.5" style={{ color: TEXT.muted }}>{d.status}</p>
      <p className="text-[0.58rem] font-semibold" style={{ color: TEXT.primary }}>{d.count} orders</p>
      <p className="text-[0.48rem] mt-0.5" style={{ color: TEXT.secondary }}>{d.pct}% of total</p>
    </div>
  );
}

interface Props { data: OverviewData | null }

export default function OrdersStatus({ data }: Props) {
  const statusData = data?.statusDistribution ?? [];
  const total      = statusData.reduce((s, d) => s + d.count, 0);
  const delivered  = statusData.find((d) => d.status === 'Delivered');
  const cancelled  = statusData.find((d) => d.status === 'Cancelled');

  return (
    <SectionCard>
      <SectionHeading title="Orders by Status" />

      {statusData.length === 0 ? (
        <p className="text-[0.48rem] py-8 text-center" style={{ color: TEXT.muted }}>No orders in this period</p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={32}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="status" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? CHART_COLORS.processing} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 pt-4 grid grid-cols-3 gap-3" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        {[
          {
            label: 'Completion rate',
            value: delivered ? `${delivered.pct}%` : '—',
            sub:   'of orders delivered',
            color: CHART_COLORS.delivered,
          },
          {
            label: 'Cancellation rate',
            value: cancelled ? `${cancelled.pct}%` : '—',
            sub:   'cancelled',
            color: CHART_COLORS.cancelled,
          },
          {
            label: 'Total orders',
            value: total > 0 ? total.toLocaleString() : '—',
            sub:   'in selected period',
            color: GOLD,
          },
        ].map((item) => (
          <div key={item.label} className="p-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER.default}` }}>
            <p className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
            <p className="mt-1 text-[0.90rem] font-semibold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[0.44rem] mt-0.5" style={{ color: TEXT.muted }}>{item.sub}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
