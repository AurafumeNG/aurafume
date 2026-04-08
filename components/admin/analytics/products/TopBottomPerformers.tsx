'use client';

import { Medal, TrendingUp, TrendingDown, Tag, Megaphone, Package } from 'lucide-react';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, fmtNaira,
} from '../shared';
import type { ProductsData } from '@/types/analytics-products';

const MEDAL_COLORS = [GOLD, 'rgba(192,192,192,0.90)', 'rgba(176,141,87,0.90)'];

const SUGGESTIONS = [
  { tag: 'Consider discount', icon: Tag,       color: '#facc15', bg: 'rgba(250,204,21,0.10)'   },
  { tag: 'Needs promotion',   icon: Megaphone, color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'   },
  { tag: 'Check stock levels',icon: Package,   color: '#f87171', bg: 'rgba(248,113,113,0.10)'  },
  { tag: 'Consider discount', icon: Tag,       color: '#facc15', bg: 'rgba(250,204,21,0.10)'   },
  { tag: 'Needs promotion',   icon: Megaphone, color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'   },
];

interface Props { data: ProductsData | null }

export default function TopBottomPerformers({ data }: Props) {
  const byRevenue = [...(data?.products ?? [])].sort((a, b) => b.revenue - a.revenue);
  const top5      = byRevenue.slice(0, 5);
  const bottom5   = byRevenue.filter((p) => p.unitsSold > 0).slice(-5).reverse();

  if (!data || byRevenue.length === 0) {
    return (
      <SectionCard>
        <SectionHeading title="Performance Comparison" />
        <p className="py-8 text-center text-[0.50rem]" style={{ color: TEXT.muted }}>
          No product sales data for this period.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionHeading title="Performance Comparison" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Top 5 ─────────────────────────────────────────────── */}
        <div>
          <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Top 5 by Revenue
          </p>
          <div className="space-y-0">
            {top5.map((product, i) => {
              const hasMedal = i < 3;
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < 4 ? `1px solid ${BORDER.default}` : 'none' }}
                >
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    {hasMedal
                      ? <Medal size={14} strokeWidth={1.8} style={{ color: MEDAL_COLORS[i] }} />
                      : <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.muted }}>{i + 1}</span>}
                  </div>

                  <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded"
                    style={{ background: GOLD_BG(0.08), border: `1px solid ${GOLD_BG(0.15)}` }}>
                    <span className="text-[0.40rem]" style={{ color: GOLD }}>{product.name[0]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[0.50rem] font-medium truncate" style={{ color: TEXT.primary }}>
                      {product.name}
                    </p>
                    <p className="text-[0.42rem] mt-0.5" style={{ color: TEXT.muted }}>
                      {product.unitsSold} units
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[0.54rem] font-semibold" style={{ color: GOLD }}>
                      {fmtNaira(product.revenue, true)}
                    </span>
                    <TrendingUp size={12} strokeWidth={1.8} style={{ color: '#4ade80' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom 5 ──────────────────────────────────────────── */}
        <div>
          <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Bottom 5 by Revenue
          </p>
          {bottom5.length === 0 ? (
            <p className="text-[0.48rem] py-4" style={{ color: TEXT.muted }}>Not enough data</p>
          ) : (
            <div className="space-y-0">
              {bottom5.map((product, i) => {
                const sug    = SUGGESTIONS[i] ?? SUGGESTIONS[0];
                const SugIcon = sug.icon;
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 py-3"
                    style={{ borderBottom: i < bottom5.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}
                  >
                    <div className="w-5 shrink-0 flex items-center justify-center">
                      <TrendingDown size={12} strokeWidth={1.8} style={{ color: '#f87171' }} />
                    </div>

                    <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.default}` }}>
                      <span className="text-[0.40rem]" style={{ color: TEXT.secondary }}>{product.name[0]}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[0.50rem] font-medium truncate" style={{ color: TEXT.primary }}>
                        {product.name}
                      </p>
                      <p className="text-[0.42rem] mt-0.5" style={{ color: TEXT.muted }}>
                        {product.unitsSold} units
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[0.52rem] font-semibold" style={{ color: TEXT.secondary }}>
                        {fmtNaira(product.revenue, true)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 px-1.5 py-1 rounded-sm shrink-0"
                      style={{ background: sug.bg }}>
                      <SugIcon size={9} strokeWidth={2} style={{ color: sug.color }} />
                      <span className="text-[0.38rem] tracking-[0.04em]" style={{ color: sug.color }}>
                        {sug.tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
