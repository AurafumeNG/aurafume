'use client';

import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, fmtNaira,
} from '../shared';
import type { ProductsData } from '@/types/analytics-products';

interface Props { data: ProductsData | null }

export default function NewArrivalsPerformance({ data }: Props) {
  const newArrivals          = data?.newArrivals          ?? [];
  const newArrivalsRevenue   = data?.newArrivalsRevenue   ?? 0;
  const existingRevenue      = data?.existingArrivalsRevenue ?? 0;
  const totalRevenue         = newArrivalsRevenue + existingRevenue;
  const newPct               = totalRevenue > 0 ? Math.round((newArrivalsRevenue / totalRevenue) * 100) : 0;
  const oldPct               = 100 - newPct;

  return (
    <SectionCard>
      <SectionHeading title="New Arrivals Performance" />

      {/* Revenue split */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4" style={{ background: GOLD_BG(0.08), border: `1px solid ${GOLD_BG(0.22)}` }}>
          <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>
            New Products Revenue
          </p>
          <p className="mt-2 text-[1.10rem] font-semibold" style={{ color: GOLD }}>
            {fmtNaira(newArrivalsRevenue, true)}
          </p>
          <p className="mt-0.5 text-[0.44rem]" style={{ color: TEXT.secondary }}>
            {newPct}% of total revenue
          </p>
          <div className="mt-2 h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${newPct}%`, background: GOLD }} />
          </div>
        </div>

        <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER.default}` }}>
          <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>
            Existing Products Revenue
          </p>
          <p className="mt-2 text-[1.10rem] font-semibold" style={{ color: TEXT.primary }}>
            {fmtNaira(existingRevenue, true)}
          </p>
          <p className="mt-0.5 text-[0.44rem]" style={{ color: TEXT.secondary }}>
            {oldPct}% of total revenue
          </p>
          <div className="mt-2 h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${oldPct}%`, background: 'rgba(255,255,255,0.30)' }} />
          </div>
        </div>
      </div>

      {/* New arrivals list */}
      <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
        New Products ({newArrivals.length} flagged as new arrivals)
      </p>

      {newArrivals.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[0.50rem]" style={{ color: TEXT.muted }}>No new products in the catalogue.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {newArrivals.map((product, i) => (
            <div
              key={product.id}
              className="flex items-center gap-4 py-3"
              style={{ borderBottom: i < newArrivals.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}
            >
              {/* Thumbnail */}
              <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded"
                style={{ background: GOLD_BG(0.10), border: `1px solid ${GOLD_BG(0.20)}` }}>
                <span className="text-[0.42rem]" style={{ color: GOLD }}>{product.name[0]}</span>
              </div>

              {/* Name + launch */}
              <div className="flex-1 min-w-0">
                <p className="text-[0.52rem] font-medium truncate" style={{ color: TEXT.primary }}>
                  {product.name}
                </p>
                <p className="text-[0.44rem] mt-0.5" style={{ color: TEXT.muted }}>
                  Launched{' '}
                  {product.launchDate
                    ? new Date(product.launchDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </p>
              </div>

              {/* Units */}
              <div className="text-right w-14 shrink-0">
                <p className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
                  {product.unitsSold}
                </p>
                <p className="text-[0.40rem]" style={{ color: TEXT.muted }}>units</p>
              </div>

              {/* Revenue */}
              <div className="text-right w-20 shrink-0">
                <p className="text-[0.52rem] font-semibold" style={{ color: GOLD }}>
                  {fmtNaira(product.revenue, true)}
                </p>
                <p className="text-[0.40rem]" style={{ color: TEXT.muted }}>revenue</p>
              </div>

              {/* Sparkline */}
              <div className="hidden md:block w-16 h-8 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={product.trend} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`naGrad${product.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GOLD} stopOpacity={0.30} />
                        <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={GOLD} strokeWidth={1.2}
                      fill={`url(#naGrad${product.id})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Trend indicator */}
              <div className="shrink-0">
                <TrendingUp size={14} strokeWidth={1.8} style={{ color: '#4ade80' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
