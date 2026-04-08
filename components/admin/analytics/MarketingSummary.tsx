'use client';

import Link from 'next/link';
import { ArrowUpRight, Tag } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from './shared';
import type { OverviewData } from '@/types/analytics-overview';

interface Props { data: OverviewData | null }

export default function MarketingSummary({ data }: Props) {
  const mkt = data?.marketing;

  const metrics = [
    {
      label: 'Promo Codes Used',
      value: mkt ? `${mkt.promoOrders} times` : '—',
      sub: 'Orders that used a promo code',
    },
    {
      label: 'Total Discount Given',
      value: mkt ? fmtNaira(mkt.totalDiscount) : '—',
      sub: 'Revenue offset by promos',
    },
    {
      label: 'Revenue from Promo Orders',
      value: mkt ? fmtNaira(mkt.promoRevenue) : '—',
      sub: 'Orders that included a promo',
    },
  ];

  const topCode = mkt?.topCode ?? null;

  return (
    <SectionCard>
      <SectionHeading
        title="Marketing Summary"
        action={
          <Link
            href="/admin/analytics/marketing"
            className="flex items-center gap-1 text-[0.48rem] tracking-[0.10em] uppercase transition-colors"
            style={{ color: TEXT.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.muted; }}
          >
            View Full Marketing Analytics
            <ArrowUpRight size={10} strokeWidth={2} />
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="p-4" style={{ background: GOLD_BG(0.04), border: `1px solid ${GOLD_BG(0.12)}` }}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase leading-tight" style={{ color: TEXT.muted }}>
              {m.label}
            </p>
            <p className="mt-2 text-[0.82rem] font-semibold leading-tight" style={{ color: TEXT.primary }}>
              {m.value}
            </p>
            <p className="mt-1 text-[0.42rem]" style={{ color: TEXT.secondary }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Top promo code */}
      {topCode ? (
        <div className="flex items-center gap-3 p-3" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER.default}` }}>
          <div className="flex items-center justify-center w-7 h-7 rounded shrink-0" style={{ background: GOLD_BG(0.12) }}>
            <Tag size={13} strokeWidth={1.8} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>Top Promo Code</p>
            <p className="text-[0.56rem] font-semibold mt-0.5" style={{ color: GOLD }}>{topCode}</p>
            <p className="text-[0.44rem] mt-0.5" style={{ color: TEXT.secondary }}>
              {mkt?.topCodeUses ?? 0} uses · {mkt?.topCodeLabel ?? ''}
            </p>
          </div>
          <div className="ml-auto">
            <Link
              href={`/admin/promos?search=${topCode}`}
              className="flex items-center gap-0.5 text-[0.44rem] tracking-[0.08em] uppercase transition-colors"
              style={{ color: TEXT.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.muted; }}
            >
              View
              <ArrowUpRight size={9} strokeWidth={2} />
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-[0.48rem] py-4 text-center" style={{ color: TEXT.muted }}>No promo activity in this period</p>
      )}
    </SectionCard>
  );
}
