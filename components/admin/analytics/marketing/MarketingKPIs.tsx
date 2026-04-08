'use client';

import { Tag, TrendingDown, Hash, Percent, Star, Zap } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, CARD_BG, POSITIVE, fmtNaira } from '../shared';
import type { MarketingData } from '@/types/analytics-marketing';

interface Props { data: MarketingData | null }

interface KpiDef {
  icon:          React.ElementType;
  label:         string;
  value:         string;
  sub:           string;
  change:        string;
  up:            boolean;
  neutral:       boolean;
  lowerIsBetter?: boolean;
  gold?:         boolean;
}

function diff(cur: number, prev: number, fmt: (v: number) => string): { change: string; up: boolean; neutral: boolean } {
  if (!cur && !prev) return { change: 'No data yet', up: true, neutral: true };
  const d = cur - prev;
  return { change: `${d >= 0 ? '+' : ''}${fmt(d)} vs prev`, up: d >= 0, neutral: false };
}

export default function MarketingKPIs({ data }: Props) {
  const k = data?.kpis;

  const KPIS: KpiDef[] = [
    {
      icon:  Tag,
      label: 'Promo Code Revenue',
      value: k ? fmtNaira(k.promoRevenue, true) : '—',
      sub:   'Orders using a code',
      gold:  true,
      ...diff(k?.promoRevenue ?? 0, k?.prevPromoRevenue ?? 0, (v) => fmtNaira(v, true)),
    },
    {
      icon:          TrendingDown,
      label:         'Total Discount Given',
      value:         k ? fmtNaira(k.totalDiscount, true) : '—',
      sub:           'Sum of all discounts applied',
      lowerIsBetter: true,
      ...diff(k?.totalDiscount ?? 0, k?.prevTotalDiscount ?? 0, (v) => fmtNaira(v, true)),
    },
    {
      icon:  Hash,
      label: 'Code Usage Count',
      value: k ? String(k.codeUsageCount) : '—',
      sub:   'Times a code was applied',
      ...diff(k?.codeUsageCount ?? 0, k?.prevCodeUsageCount ?? 0, (v) => String(v)),
    },
    {
      icon:          Percent,
      label:         'Discount Rate',
      value:         k ? `${k.discountRate}%` : '—',
      sub:           'Of total revenue discounted',
      lowerIsBetter: true,
      ...diff(k?.discountRate ?? 0, k?.prevDiscountRate ?? 0, (v) => `${v.toFixed(1)}%`),
    },
    {
      icon:    Star,
      label:   'Codes Redeemed',
      value:   k ? String(data!.promoCodes.filter((c) => c.uses > 0).length) : '—',
      sub:     'Distinct promo codes used',
      change:  'This period',
      up:      true,
      neutral: true,
    },
    {
      icon:  Zap,
      label: 'Discount ROI',
      value: k ? `${k.roi.toFixed(2)}×` : '—',
      sub:   'Revenue per \u20A61 discounted',
      gold:  true,
      ...diff(k?.roi ?? 0, k?.prevRoi ?? 0, (v) => `${v.toFixed(2)}\u00D7`),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {KPIS.map((kpi) => {
        const Icon      = kpi.icon;
        const positive  = kpi.neutral ? true : kpi.lowerIsBetter ? !kpi.up : kpi.up;

        return (
          <div
            key={kpi.label}
            className="relative flex flex-col gap-3 p-4 overflow-hidden"
            style={{
              background: CARD_BG,
              border: `1px solid ${kpi.gold ? GOLD_BG(0.22) : BORDER.default}`,
            }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded"
              style={{ background: kpi.gold ? GOLD_BG(0.12) : 'rgba(255,255,255,0.05)' }}
            >
              <Icon size={13} strokeWidth={1.8} style={{ color: kpi.gold ? GOLD : TEXT.secondary }} />
            </div>

            <div>
              <p className="text-[1.10rem] font-semibold tracking-tight leading-tight"
                style={{ color: kpi.gold ? GOLD : TEXT.primary }}>
                {kpi.value}
              </p>
              <p className="mt-0.5 text-[0.42rem] leading-tight" style={{ color: TEXT.muted }}>
                {kpi.sub}
              </p>
            </div>

            <p className="text-[0.46rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.secondary }}>
              {kpi.label}
            </p>

            <p className="text-[0.44rem] font-medium"
              style={{ color: kpi.neutral ? TEXT.muted : positive ? POSITIVE : '#f87171' }}>
              {kpi.neutral ? kpi.change : `${kpi.up ? '↑' : '↓'} ${kpi.change}`}
            </p>

            {kpi.gold && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(180,130,60,0.08), transparent 70%)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
