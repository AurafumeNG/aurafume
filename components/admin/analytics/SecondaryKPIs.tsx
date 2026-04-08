'use client';

import { GOLD, TEXT, BORDER, CARD_BG, POSITIVE, fmtNaira } from './shared';
import type { OverviewData } from '@/types/analytics-overview';

interface Props {
  compare: boolean;
  data:    OverviewData | null;
}

export default function SecondaryKPIs({ compare, data }: Props) {
  const s = data?.secondary;
  const k = data?.kpis;

  const cards = [
    {
      label:         'Repeat Purchase Rate',
      value:         `${s?.repeatRate ?? 0}%`,
      sub:           'Customers with 2+ orders',
      comparison:    undefined as string | undefined,
      comparisonUp:  true,
      lowerIsBetter: false,
    },
    {
      label:         'Revenue Per Customer',
      value:         fmtNaira(s?.revPerCustomer ?? 0, true),
      sub:           'Avg lifetime value (period)',
      comparison:    undefined as string | undefined,
      comparisonUp:  true,
      lowerIsBetter: false,
    },
    {
      label:         'New Customers',
      value:         String(k?.newCustomers ?? 0),
      sub:           'Registered in this period',
      comparison:    undefined as string | undefined,
      comparisonUp:  true,
      lowerIsBetter: false,
    },
    {
      label:         'Refund Rate',
      value:         `${s?.refundRate ?? 0}%`,
      sub:           'Of all orders (all time)',
      comparison:    undefined as string | undefined,
      comparisonUp:  false,
      lowerIsBetter: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => {
        const isPositive = card.lowerIsBetter ? !card.comparisonUp : card.comparisonUp;
        return (
          <div key={card.label} className="flex flex-col gap-2.5 p-4"
            style={{ background: CARD_BG, border: `1px solid ${BORDER.default}` }}>
            <p className="text-[0.48rem] tracking-[0.16em] uppercase font-medium" style={{ color: TEXT.muted }}>
              {card.label}
            </p>
            <p className="text-[1.35rem] font-semibold tracking-tight leading-none" style={{ color: TEXT.primary }}>
              {card.value}
            </p>
            <p className="text-[0.46rem] tracking-[0.06em]" style={{ color: TEXT.secondary }}>
              {card.sub}
            </p>
            {compare && card.comparison && (
              <p className="text-[0.46rem] tracking-[0.06em] font-medium"
                style={{ color: isPositive ? POSITIVE : '#f87171' }}>
                {card.comparisonUp ? '↑' : '↓'} {card.comparison}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
