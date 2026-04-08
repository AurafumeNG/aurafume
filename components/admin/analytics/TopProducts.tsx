'use client';

import Link from 'next/link';
import { ArrowUpRight, Medal } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from './shared';
import type { OverviewData, TopProductData } from '@/types/analytics-overview';

const MEDAL_COLORS = [GOLD, 'rgba(192,192,192,0.90)', 'rgba(176,141,87,0.90)'];

const STOCK_BADGE: Record<TopProductData['stockStatus'], { label: string; color: string; bg: string }> = {
  in_stock:     { label: 'In Stock',    color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  },
  low_stock:    { label: 'Low Stock',   color: '#facc15', bg: 'rgba(250,204,21,0.10)'  },
  out_of_stock: { label: 'Out of Stock',color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
};

interface Props { data: OverviewData | null }

export default function TopProducts({ data }: Props) {
  const products = data?.topProducts ?? [];

  return (
    <SectionCard>
      <SectionHeading
        title="Top Products"
        action={
          <Link href="/admin/analytics/products"
            className="flex items-center gap-1 text-[0.48rem] tracking-[0.10em] uppercase transition-colors"
            style={{ color: TEXT.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.muted; }}>
            View Full Product Analytics
            <ArrowUpRight size={10} strokeWidth={2} />
          </Link>
        }
      />

      {products.length === 0 ? (
        <p className="text-[0.48rem] py-8 text-center" style={{ color: TEXT.muted }}>No sales data for this period</p>
      ) : (
        <div className="space-y-0">
          {products.map((product, i) => {
            const badge    = STOCK_BADGE[product.stockStatus];
            const hasMedal = product.rank <= 3;
            return (
              <div key={product.rank} className="flex items-center gap-4 py-3"
                style={{ borderBottom: i < products.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>

                <div className="w-5 shrink-0 flex items-center justify-center">
                  {hasMedal
                    ? <Medal size={14} strokeWidth={1.8} style={{ color: MEDAL_COLORS[product.rank - 1] }} />
                    : <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.muted }}>{product.rank}</span>}
                </div>

                <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded"
                  style={{ background: GOLD_BG(0.08), border: `1px solid ${GOLD_BG(0.15)}` }}>
                  <span className="text-[0.40rem]" style={{ color: GOLD }}>{product.name[0]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[0.52rem] font-medium truncate" style={{ color: TEXT.primary }}>{product.name}</p>
                  <p className="text-[0.44rem] mt-0.5" style={{ color: TEXT.muted }}>{product.variant}</p>
                </div>

                <div className="hidden sm:block text-right w-14 shrink-0">
                  <p className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>{product.unitsSold}</p>
                  <p className="text-[0.40rem]" style={{ color: TEXT.muted }}>units</p>
                </div>

                <div className="text-right w-20 shrink-0">
                  <p className="text-[0.52rem] font-semibold" style={{ color: GOLD }}>{fmtNaira(product.revenue, true)}</p>
                  <p className="text-[0.40rem]" style={{ color: TEXT.muted }}>{product.pctOfTotal}% of total</p>
                </div>

                <div className="hidden md:block w-16 h-8 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={product.trend} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id={`tpg${product.rank}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={GOLD} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={GOLD} strokeWidth={1.2}
                        fill={`url(#tpg${product.rank})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="hidden lg:flex items-center h-5 px-2 shrink-0 rounded-sm" style={{ background: badge.bg }}>
                  <span className="text-[0.40rem] tracking-[0.08em] font-medium" style={{ color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
