'use client';

import { Users, UserPlus, RefreshCw, TrendingUp, DollarSign, UserMinus } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, CARD_BG, POSITIVE, fmtNaira } from '../shared';
import type { CustomersData } from '@/types/analytics-customers';

interface Props {
  compare: boolean;
  data: CustomersData | null;
}

export default function CustomerKPIs({ compare, data }: Props) {
  const k = data?.kpis;

  function pctChange(cur: number, prev: number): string {
    if (!prev) return '';
    const pct = Math.round(((cur - prev) / prev) * 100);
    return `${pct > 0 ? '+' : ''}${pct}% vs previous period`;
  }

  const items = [
    {
      icon:          Users,
      label:         'Total Customers',
      value:         k ? k.totalCustomers.toLocaleString() : '—',
      sub:           'All registered accounts',
      comparison:    k ? pctChange(k.totalCustomers, k.prevTotalCustomers) : '',
      comparisonUp:  k ? k.totalCustomers >= k.prevTotalCustomers : true,
      accent:        true,
      lowerIsBetter: false,
    },
    {
      icon:          UserPlus,
      label:         'New Customers',
      value:         k ? String(k.newCustomers) : '—',
      sub:           'Acquired this period',
      comparison:    k ? pctChange(k.newCustomers, k.prevNewCustomers) : '',
      comparisonUp:  k ? k.newCustomers >= k.prevNewCustomers : true,
      accent:        false,
      lowerIsBetter: false,
    },
    {
      icon:          RefreshCw,
      label:         'Returning Customers',
      value:         k ? `${k.returningRate}%` : '—',
      sub:           'Repeat purchase rate this period',
      comparison:    k ? pctChange(k.returningRate, k.prevReturningRate) : '',
      comparisonUp:  k ? k.returningRate >= k.prevReturningRate : true,
      accent:        false,
      lowerIsBetter: false,
    },
    {
      icon:          DollarSign,
      label:         'Average LTV',
      value:         k ? fmtNaira(k.avgLTV, true) : '—',
      sub:           'Lifetime value per customer',
      comparison:    k ? pctChange(k.avgLTV, k.prevAvgLTV) : '',
      comparisonUp:  k ? k.avgLTV >= k.prevAvgLTV : true,
      accent:        false,
      lowerIsBetter: false,
    },
    {
      icon:          TrendingUp,
      label:         'Avg Orders / Customer',
      value:         k ? `${k.avgOrdersPerCustomer}×` : '—',
      sub:           'All-time average',
      comparison:    '',
      comparisonUp:  true,
      accent:        false,
      lowerIsBetter: false,
    },
    {
      icon:          UserMinus,
      label:         'Churn Rate',
      value:         k ? `${k.churnRate}%` : '—',
      sub:           'No order in last 90 days',
      comparison:    '',
      comparisonUp:  false,
      accent:        false,
      lowerIsBetter: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map((kpi) => {
        const Icon       = kpi.icon;
        const isPositive = kpi.lowerIsBetter ? !kpi.comparisonUp : kpi.comparisonUp;
        return (
          <div
            key={kpi.label}
            className="relative flex flex-col gap-3 p-4 overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${kpi.accent ? GOLD_BG(0.22) : BORDER.default}` }}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded"
              style={{ background: kpi.accent ? GOLD_BG(0.12) : 'rgba(255,255,255,0.05)' }}>
              <Icon size={13} strokeWidth={1.8} style={{ color: kpi.accent ? GOLD : TEXT.secondary }} />
            </div>

            <div>
              <p className="text-[1.10rem] font-semibold tracking-tight leading-tight"
                style={{ color: kpi.accent ? GOLD : TEXT.primary }}>
                {kpi.value}
              </p>
              <p className="mt-0.5 text-[0.42rem] leading-tight" style={{ color: TEXT.muted }}>
                {kpi.sub}
              </p>
            </div>

            <p className="text-[0.46rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.secondary }}>
              {kpi.label}
            </p>

            {compare && kpi.comparison && (
              <p className="text-[0.44rem] font-medium" style={{ color: isPositive ? POSITIVE : '#f87171' }}>
                {kpi.comparisonUp ? '↑' : '↓'} {kpi.comparison}
              </p>
            )}

            {kpi.accent && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(180,130,60,0.08), transparent 70%)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
