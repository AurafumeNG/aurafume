'use client';

import { Package, BarChart2, TrendingUp, TrendingDown, Star, AlertTriangle } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, CARD_BG } from '../shared';
import type { ProductsData } from '@/types/analytics-products';

interface Props { data: ProductsData | null }

export default function ProductKPIs({ data }: Props) {
  const kpis = data?.kpis;

  const items = [
    {
      icon:    Package,
      label:   'Total Active Products',
      value:   kpis ? `${kpis.totalActive} active` : '—',
      sub:     kpis ? `${kpis.outOfStockVariants} variant${kpis.outOfStockVariants !== 1 ? 's' : ''} out of stock` : '—',
      accent:  false,
      warn:    false,
    },
    {
      icon:    BarChart2,
      label:   'Total Units Sold',
      value:   kpis ? `${kpis.totalUnitsSold.toLocaleString()} units` : '—',
      sub:     'This period',
      accent:  true,
      warn:    false,
    },
    {
      icon:    Star,
      label:   'Best Selling Product',
      value:   kpis?.bestSellerName ?? '—',
      sub:     kpis ? `${kpis.bestSellerUnits} units sold` : '—',
      accent:  false,
      warn:    false,
    },
    {
      icon:    TrendingUp,
      label:   'Highest Revenue Product',
      value:   kpis?.highestRevenueName ?? '—',
      sub:     kpis ? `₦${(kpis.highestRevenue / 1000).toFixed(0)}k this period` : '—',
      accent:  false,
      warn:    false,
    },
    {
      icon:    TrendingDown,
      label:   'Lowest Performing',
      value:   kpis?.lowestRevenueName ?? '—',
      sub:     kpis ? `${kpis.lowestRevenueUnits} units · consider promotion` : '—',
      accent:  false,
      warn:    true,
    },
    {
      icon:    AlertTriangle,
      label:   'Out of Stock',
      value:   kpis ? `${kpis.outOfStockVariants} variant${kpis.outOfStockVariants !== 1 ? 's' : ''}` : '—',
      sub:     kpis ? `${kpis.lowStockVariants} more running low` : '—',
      accent:  false,
      warn:    true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map((kpi) => {
        const Icon      = kpi.icon;
        const iconColor = kpi.accent ? GOLD : kpi.warn ? '#facc15' : TEXT.secondary;
        const iconBg    = kpi.accent ? GOLD_BG(0.12) : kpi.warn ? 'rgba(250,204,21,0.10)' : 'rgba(255,255,255,0.05)';
        const borderClr = kpi.accent ? GOLD_BG(0.22) : kpi.warn ? 'rgba(250,204,21,0.14)' : BORDER.default;
        const valueColor= kpi.accent ? GOLD : TEXT.primary;

        return (
          <div
            key={kpi.label}
            className="relative flex flex-col gap-3 p-4 overflow-hidden"
            style={{ background: CARD_BG, border: `1px solid ${borderClr}` }}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded" style={{ background: iconBg }}>
              <Icon size={13} strokeWidth={1.8} style={{ color: iconColor }} />
            </div>

            <div>
              <p className="text-[1.05rem] font-semibold tracking-tight leading-tight" style={{ color: valueColor }}>
                {kpi.value}
              </p>
              <p className="mt-0.5 text-[0.42rem] leading-tight" style={{ color: TEXT.muted }}>
                {kpi.sub}
              </p>
            </div>

            <p className="text-[0.46rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.secondary }}>
              {kpi.label}
            </p>

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
