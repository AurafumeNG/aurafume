'use client';

import Link from 'next/link';
import { TrendingUp, ShoppingCart, Users, BarChart2, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, CARD_BG, POSITIVE, fmtNaira } from './shared';
import type { OverviewData } from '@/types/analytics-overview';

interface KPICardProps {
  icon:          React.ElementType;
  label:         string;
  value:         string;
  period?:       string;
  comparison:    string;
  comparisonUp:  boolean;
  subLabel?:     string;
  sparkData:     { v: number }[];
  href:          string;
  accent?:       boolean;
  compare:       boolean;
}

function KPICard({
  icon: Icon, label, value, period, comparison, comparisonUp,
  subLabel, sparkData, href, accent, compare,
}: KPICardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 p-5 overflow-hidden transition-colors duration-150"
      style={{ background: CARD_BG, border: `1px solid ${accent ? GOLD_BG(0.22) : BORDER.default}` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent ? GOLD_BG(0.40) : BORDER.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = accent ? GOLD_BG(0.22) : BORDER.default; }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center w-8 h-8 rounded"
          style={{ background: accent ? GOLD_BG(0.12) : 'rgba(255,255,255,0.05)' }}>
          <Icon size={14} strokeWidth={1.8} style={{ color: accent ? GOLD : TEXT.secondary }} />
        </div>
        <ArrowUpRight size={13} strokeWidth={1.8}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: TEXT.secondary }} />
      </div>

      <div>
        <p className="text-[1.80rem] font-semibold tracking-tight leading-none"
          style={{ color: accent ? GOLD : TEXT.primary }}>
          {value}
        </p>
        {period && (
          <p className="mt-1 text-[0.46rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>
            {period}
          </p>
        )}
      </div>

      <p className="text-[0.54rem] tracking-[0.14em] uppercase font-medium" style={{ color: TEXT.secondary }}>
        {label}
      </p>

      {compare && (
        <div className="flex items-center gap-1.5">
          <span className="text-[0.48rem] tracking-[0.06em] font-medium"
            style={{ color: comparisonUp ? POSITIVE : '#f87171' }}>
            {comparisonUp ? '↑' : '↓'} {comparison}
          </span>
        </div>
      )}

      {subLabel && (
        <p className="text-[0.46rem] tracking-[0.06em]" style={{ color: TEXT.muted }}>{subLabel}</p>
      )}

      <div className="h-10 -mx-1 mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={accent ? GOLD : 'rgba(255,255,255,0.6)'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={accent ? GOLD : 'rgba(255,255,255,0.6)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v"
              stroke={accent ? GOLD : 'rgba(255,255,255,0.35)'}
              strokeWidth={1.5}
              fill={`url(#spark-${label})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {accent && (
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(180,130,60,0.08), transparent 70%)' }} />
      )}
    </Link>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────────

function pctChange(cur: number, prev: number): string {
  if (!prev) return '—';
  const p = ((cur - prev) / prev) * 100;
  return `${Math.abs(p).toFixed(1)}%`;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  compare: boolean;
  data:    OverviewData | null;
}

export default function HeadlineKPIs({ compare, data }: Props) {
  const k = data?.kpis;
  const sp = data?.sparklines;

  const revenue     = k?.revenue     ?? 0;
  const prevRevenue = k?.prevRevenue ?? 0;
  const orders      = k?.orders      ?? 0;
  const prevOrders  = k?.prevOrders  ?? 0;
  const customers   = k?.totalCustomers ?? 0;
  const newCusts    = k?.newCustomers   ?? 0;
  const aov         = k?.aov         ?? 0;
  const prevAov     = k?.prevAov     ?? 0;

  const empty7 = Array.from({ length: 7 }, () => ({ v: 0 }));

  const cards: KPICardProps[] = [
    {
      icon:         TrendingUp,
      label:        'Total Revenue',
      value:        fmtNaira(revenue),
      comparison:   `${pctChange(revenue, prevRevenue)} vs previous period`,
      comparisonUp: revenue >= prevRevenue,
      sparkData:    sp?.revenue   ?? empty7,
      href:         '/admin/analytics/revenue',
      accent:       true,
      compare,
    },
    {
      icon:         ShoppingCart,
      label:        'Total Orders',
      value:        orders.toLocaleString(),
      comparison:   `${orders - prevOrders > 0 ? '+' : ''}${orders - prevOrders} orders (${pctChange(orders, prevOrders)})`,
      comparisonUp: orders >= prevOrders,
      sparkData:    sp?.orders    ?? empty7,
      href:         '/admin/orders',
      compare,
    },
    {
      icon:         Users,
      label:        'Total Customers',
      value:        customers.toLocaleString(),
      comparison:   `+${newCusts} new this period`,
      comparisonUp: true,
      subLabel:     newCusts > 0 ? `+${newCusts} new customers this period` : undefined,
      sparkData:    sp?.customers ?? empty7,
      href:         '/admin/analytics/customers',
      compare,
    },
    {
      icon:         BarChart2,
      label:        'Average Order Value',
      value:        fmtNaira(aov),
      comparison:   `${pctChange(aov, prevAov)} vs previous period`,
      comparisonUp: aov >= prevAov,
      sparkData:    sp?.aov       ?? empty7,
      href:         '/admin/analytics/revenue',
      compare,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => <KPICard key={card.label} {...card} />)}
    </div>
  );
}
