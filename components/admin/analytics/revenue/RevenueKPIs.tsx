'use client';

import {
  TrendingUp, TrendingDown, DollarSign, Percent, RotateCcw, ShoppingCart,
} from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, CARD_BG, POSITIVE } from '../shared';
import type { RevenueData } from '@/types/analytics-revenue';

function fmtNaira(v: number): string {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₦${(v / 1_000).toFixed(0)}k`;
  return `₦${v.toLocaleString()}`;
}

function pctChange(cur: number, prev: number): string {
  if (prev === 0) return cur > 0 ? '+100%' : '0%';
  const pct = ((cur - prev) / prev) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs prev period`;
}

function absChange(cur: number, prev: number): string {
  const delta = cur - prev;
  const pct = prev > 0 ? ((Math.abs(delta) / prev) * 100).toFixed(1) : '0';
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}${fmtNaira(Math.abs(delta))} (${delta >= 0 ? '+' : ''}${pct}%)`;
}

interface Props { compare: boolean; data: RevenueData | null }

export default function RevenueKPIs({ compare, data }: Props) {
  const k = data?.kpis;

  interface KPI {
    icon: React.ElementType;
    label: string;
    value: string;
    sub: string;
    comparison: string;
    comparisonUp: boolean;
    lowerIsBetter?: boolean;
    accent?: boolean;
  }

  const kpis: KPI[] = [
    {
      icon: TrendingUp,
      label: 'Gross Revenue',
      value: k ? fmtNaira(k.gross) : '—',
      sub: 'Subtotal before discounts',
      comparison: k ? pctChange(k.gross, k.prevGross) : '',
      comparisonUp: (k?.gross ?? 0) >= (k?.prevGross ?? 0),
      accent: true,
    },
    {
      icon: Percent,
      label: 'Net Revenue',
      value: k ? fmtNaira(k.net) : '—',
      sub: 'Total collected from orders',
      comparison: k ? pctChange(k.net, k.prevNet) : '',
      comparisonUp: (k?.net ?? 0) >= (k?.prevNet ?? 0),
    },
    {
      icon: DollarSign,
      label: 'Effective Revenue',
      value: k ? fmtNaira(k.net - k.refundsAmount) : '—',
      sub: 'Net after refunds',
      comparison: k ? pctChange(k.net - k.refundsAmount, k.prevNet - k.prevRefundsAmount) : '',
      comparisonUp: (k?.net ?? 0) - (k?.refundsAmount ?? 0) >= (k?.prevNet ?? 0) - (k?.prevRefundsAmount ?? 0),
    },
    {
      icon: TrendingDown,
      label: 'Total Discount Given',
      value: k ? fmtNaira(k.discount) : '—',
      sub: 'Via promo codes',
      comparison: k ? absChange(k.discount, k.prevDiscount) : '',
      comparisonUp: (k?.discount ?? 0) >= (k?.prevDiscount ?? 0),
      lowerIsBetter: true,
    },
    {
      icon: RotateCcw,
      label: 'Refunds Issued',
      value: k ? fmtNaira(k.refundsAmount) : '—',
      sub: k ? `${k.refundsCount} refund${k.refundsCount !== 1 ? 's' : ''} · ${data?.refundKpis.rate ?? 0}% rate` : '—',
      comparison: k ? absChange(k.refundsAmount, k.prevRefundsAmount) : '',
      comparisonUp: (k?.refundsAmount ?? 0) >= (k?.prevRefundsAmount ?? 0),
      lowerIsBetter: true,
    },
    {
      icon: ShoppingCart,
      label: 'Revenue per Order',
      value: k ? fmtNaira(k.aov) : '—',
      sub: 'Average order value',
      comparison: k ? absChange(k.aov, k.prevAov) : '',
      comparisonUp: (k?.aov ?? 0) >= (k?.prevAov ?? 0),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isPositive = kpi.lowerIsBetter ? !kpi.comparisonUp : kpi.comparisonUp;
        return (
          <div
            key={kpi.label}
            className="relative flex flex-col gap-3 p-4 overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${kpi.accent ? GOLD_BG(0.22) : BORDER.default}` }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded"
              style={{ background: kpi.accent ? GOLD_BG(0.12) : 'rgba(255,255,255,0.05)' }}
            >
              <Icon size={13} strokeWidth={1.8} style={{ color: kpi.accent ? GOLD : TEXT.secondary }} />
            </div>

            <div>
              <p className="text-[1.10rem] font-semibold tracking-tight leading-tight"
                style={{ color: kpi.accent ? GOLD : TEXT.primary }}>
                {kpi.value}
              </p>
              <p className="mt-0.5 text-[0.42rem] leading-tight" style={{ color: TEXT.muted }}>{kpi.sub}</p>
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
              <div
                className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(180,130,60,0.08), transparent 70%)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
