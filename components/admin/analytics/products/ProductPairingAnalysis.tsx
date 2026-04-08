'use client';

import { Link2 } from 'lucide-react';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, fmtNaira,
} from '../shared';
import type { ProductsData } from '@/types/analytics-products';

interface Props { data: ProductsData | null }

export default function ProductPairingAnalysis({ data }: Props) {
  const pairings = data?.pairings ?? [];
  const maxTimes = pairings.length > 0 ? Math.max(...pairings.map((p) => p.timesBought)) : 1;

  const topPair = pairings[0];

  return (
    <SectionCard>
      <SectionHeading title="Frequently Bought Together" />

      {pairings.length === 0 ? (
        <p className="py-8 text-center text-[0.50rem]" style={{ color: TEXT.muted }}>
          Not enough multi-item orders in this period to identify pairings.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                  {['Product A', '', 'Product B', 'Times Bought Together', 'Avg Combined Rev', 'Co-purchase Rate'].map((col, i) => (
                    <th key={i}
                      className="pb-2 text-left text-[0.44rem] tracking-[0.12em] uppercase font-medium pr-4"
                      style={{ color: TEXT.muted }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pairings.map((pair, i) => {
                  const barWidth = (pair.timesBought / maxTimes) * 100;
                  const isLast   = i === pairings.length - 1;
                  return (
                    <tr key={i} style={{ borderBottom: isLast ? 'none' : `1px solid ${BORDER.default}` }}>
                      {/* Product A */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded"
                            style={{ background: GOLD_BG(0.10), border: `1px solid ${GOLD_BG(0.20)}` }}>
                            <span className="text-[0.38rem]" style={{ color: GOLD }}>{pair.productA[0]}</span>
                          </div>
                          <span className="text-[0.48rem] font-medium" style={{ color: TEXT.primary }}>
                            {pair.productA}
                          </span>
                        </div>
                      </td>

                      {/* Link icon */}
                      <td className="py-3 pr-3">
                        <Link2 size={11} strokeWidth={1.8} style={{ color: TEXT.muted }} />
                      </td>

                      {/* Product B */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded"
                            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.default}` }}>
                            <span className="text-[0.38rem]" style={{ color: TEXT.secondary }}>{pair.productB[0]}</span>
                          </div>
                          <span className="text-[0.48rem] font-medium" style={{ color: TEXT.primary }}>
                            {pair.productB}
                          </span>
                        </div>
                      </td>

                      {/* Times bought */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.52rem] font-semibold w-6 text-right" style={{ color: TEXT.primary }}>
                            {pair.timesBought}
                          </span>
                          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', minWidth: 60 }}>
                            <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: GOLD }} />
                          </div>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="py-3 pr-4">
                        <span className="text-[0.50rem] font-semibold" style={{ color: GOLD }}>
                          {fmtNaira(pair.revenue, true)}
                        </span>
                      </td>

                      {/* Co-purchase rate */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 rounded-full"
                            style={{ width: `${Math.min(pair.coRate, 100)}%`, maxWidth: 48, background: GOLD_BG(0.60) }} />
                          <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
                            {pair.coRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {topPair && (
            <div className="mt-5 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
              <p className="text-[0.50rem] tracking-[0.04em]" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>{topPair.productA}</span> +{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{topPair.productB}</span> are bought
                together most often — <span style={{ color: GOLD, fontWeight: 600 }}>{topPair.timesBought}×</span>{' '}
                in this period with a co-purchase rate of{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{topPair.coRate}%</span>.
                Consider surfacing this pair as a{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>"Frequently Bought Together"</span> bundle.
              </p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
