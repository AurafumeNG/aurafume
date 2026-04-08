'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from './shared';
import type { OverviewData } from '@/types/analytics-overview';

const DONUT_COLORS = [GOLD, 'rgba(255,255,255,0.20)'];

interface TooltipPayload { name: string; value: number; payload: { revenue: number } }

function DonutTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem] tracking-[0.06em]" style={{ color: TEXT.primary }}>
        {payload[0].name} — {payload[0].value}%
      </p>
      <p className="text-[0.48rem] mt-0.5" style={{ color: TEXT.secondary }}>
        Revenue: {fmtNaira(payload[0].payload.revenue, true)}
      </p>
    </div>
  );
}

interface Props { data: OverviewData | null }

export default function CustomerInsights({ data }: Props) {
  const split = data?.customerSplit;
  const total = (split?.newCount ?? 0) + (split?.returningCount ?? 0);
  const newPct = total > 0 ? Math.round(((split?.newCount ?? 0) / total) * 100) : 0;
  const retPct = 100 - newPct;

  const donutData = [
    { name: 'New',       value: newPct, revenue: split?.newRevenue      ?? 0 },
    { name: 'Returning', value: retPct, revenue: split?.returningRevenue ?? 0 },
  ];

  const stats = [
    { label: 'New customers',    value: String(split?.newCount ?? 0)       },
    { label: 'Returning buyers', value: String(split?.returningCount ?? 0) },
    { label: 'Total customers',  value: (split?.totalCustomers ?? 0).toLocaleString() },
    { label: 'Return rate',      value: `${data?.secondary?.repeatRate ?? 0}%` },
  ];

  return (
    <SectionCard>
      <SectionHeading
        title="Customer Insights"
        action={
          <Link href="/admin/analytics/customers"
            className="flex items-center gap-1 text-[0.48rem] tracking-[0.10em] uppercase transition-colors"
            style={{ color: TEXT.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.muted; }}>
            View Full Customer Analytics
            <ArrowUpRight size={10} strokeWidth={2} />
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New vs Returning donut */}
        <div>
          <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-4" style={{ color: TEXT.secondary }}>
            New vs Returning
          </p>
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius="60%" outerRadius="85%"
                    dataKey="value" paddingAngle={2} strokeWidth={0}>
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {donutData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                    <span className="text-[0.48rem] tracking-[0.06em]" style={{ color: TEXT.secondary }}>
                      {item.name} — {item.value}% of orders
                    </span>
                  </div>
                  <p className="pl-3 text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>
                    {fmtNaira(item.revenue, true)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div>
          <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-4" style={{ color: TEXT.secondary }}>
            Customer Metrics
          </p>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="p-3"
                style={{ background: GOLD_BG(0.04), border: `1px solid ${GOLD_BG(0.12)}` }}>
                <p className="text-[0.44rem] tracking-[0.10em] uppercase leading-tight" style={{ color: TEXT.muted }}>
                  {stat.label}
                </p>
                <p className="mt-1.5 text-[0.90rem] font-semibold" style={{ color: TEXT.primary }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
