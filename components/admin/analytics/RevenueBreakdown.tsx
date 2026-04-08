'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { GOLD, TEXT, BORDER, CHART_COLORS, SectionCard, SectionHeading, fmtNaira } from './shared';
import type { OverviewData, BreakdownItem } from '@/types/analytics-overview';

const PAYMENT_COLORS  = [CHART_COLORS.paystack, CHART_COLORS.bank];
const DELIVERY_COLORS = [CHART_COLORS.express,  CHART_COLORS.standard, CHART_COLORS.pickup];

interface TooltipPayload { name: string; value: number }

function DonutTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem] tracking-[0.08em]" style={{ color: TEXT.primary }}>{payload[0].name}</p>
      <p className="text-[0.54rem] font-semibold mt-0.5" style={{ color: GOLD }}>{fmtNaira(payload[0].value)}</p>
    </div>
  );
}

function DonutSection({ title, data, colors }: { title: string; data: BreakdownItem[]; colors: string[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[0.52rem] tracking-[0.14em] uppercase" style={{ color: TEXT.secondary }}>{title}</p>
        <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data for this period</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[0.52rem] tracking-[0.14em] uppercase" style={{ color: TEXT.secondary }}>{title}</p>
      <div className="flex items-center gap-6">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="60%" outerRadius="85%"
                dataKey="value" paddingAngle={2} strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={colors[i] ?? CHART_COLORS.bank} />)}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2.5 flex-1">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: colors[i] ?? CHART_COLORS.bank }} />
                <span className="text-[0.48rem] tracking-[0.06em] truncate" style={{ color: TEXT.secondary }}>
                  {item.name}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
                  {fmtNaira(item.value, true)}
                </p>
                <p className="text-[0.44rem]" style={{ color: TEXT.muted }}>{item.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props { data: OverviewData | null }

export default function RevenueBreakdown({ data }: Props) {
  return (
    <SectionCard>
      <SectionHeading title="Revenue Breakdown" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutSection title="By Payment Method"  data={data?.paymentBreakdown  ?? []} colors={PAYMENT_COLORS}  />
        <div className="hidden md:block w-px self-stretch" style={{ background: BORDER.default }} />
        <DonutSection title="By Delivery Method" data={data?.deliveryBreakdown ?? []} colors={DELIVERY_COLORS} />
      </div>
    </SectionCard>
  );
}
