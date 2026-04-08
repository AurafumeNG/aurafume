'use client';

import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading } from '../shared';
import type { MarketingData } from '@/types/analytics-marketing';

const NEW_COLOR = '#4ade80';
const RET_COLOR = GOLD;

interface Props { data: MarketingData | null }

export default function FirstVsRepeatUse({ data }: Props) {
  const split  = data?.codeUsageSplit  ?? [];
  const overall = data?.overallSplit   ?? { newPct: 0, returnPct: 0 };

  const noData = !data || split.length === 0;

  // Dynamic insight: find most new-skewed and most balanced code
  const mostNew     = split.reduce((best, c) => c.newPct > best.newPct ? c : best, split[0] ?? { code: '', newPct: 0 });
  const mostBalance = split.reduce((best, c) => {
    const diff = Math.abs(c.newPct - 50);
    const bestDiff = Math.abs(best.newPct - 50);
    return diff < bestDiff ? c : best;
  }, split[0] ?? { code: '', newPct: 0 });

  return (
    <SectionCard>
      <SectionHeading title="Code Usage by Customer Type" />

      <p className="text-[0.48rem] leading-relaxed mb-5" style={{ color: TEXT.secondary }}>
        Breakdown of each promo code by whether it was used by a new or returning customer.
      </p>

      {noData ? (
        <div className="py-12 text-center">
          <p className="text-[0.50rem]" style={{ color: TEXT.muted }}>No promo code usage in this period</p>
        </div>
      ) : (
        <>
          {/* Overall split callout */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'First-time buyers using codes', value: `${overall.newPct}%`,    color: NEW_COLOR },
              { label: 'Returning buyers using codes',  value: `${overall.returnPct}%`, color: RET_COLOR },
            ].map((item) => (
              <div key={item.label} className="p-4"
                style={{ background: GOLD_BG(0.04), border: `1px solid ${GOLD_BG(0.15)}` }}>
                <p className="text-[0.84rem] font-semibold" style={{ color: item.color }}>{item.value}</p>
                <p className="mt-0.5 text-[0.44rem]" style={{ color: TEXT.muted }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-5 mb-4">
            {[
              { label: 'New customers',       color: NEW_COLOR },
              { label: 'Returning customers', color: RET_COLOR },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                <span className="text-[0.44rem]" style={{ color: TEXT.secondary }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Per-code stacked bars */}
          <div className="flex flex-col gap-4">
            {split.map((row) => (
              <div key={row.code}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                    <span className="text-[0.50rem] font-mono font-semibold" style={{ color: TEXT.primary }}>
                      {row.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[0.42rem]" style={{ color: TEXT.muted }}>
                    <span style={{ color: NEW_COLOR }}>{row.newPct}% new</span>
                    <span style={{ color: RET_COLOR }}>{row.returnPct}% returning</span>
                  </div>
                </div>
                <div className="h-5 flex rounded-sm overflow-hidden">
                  <div className="flex items-center justify-center transition-all duration-300"
                    style={{ width: `${row.newPct}%`, background: `${NEW_COLOR}55` }}>
                    {row.newPct >= 15 && (
                      <span className="text-[0.38rem] font-medium" style={{ color: NEW_COLOR }}>{row.newPct}%</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center transition-all duration-300"
                    style={{ width: `${row.returnPct}%`, background: GOLD_BG(0.35) }}>
                    {row.returnPct >= 15 && (
                      <span className="text-[0.38rem] font-medium" style={{ color: GOLD }}>{row.returnPct}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic insight */}
          {mostNew.code && mostBalance.code && mostNew.code !== mostBalance.code && (
            <div className="mt-5 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
              <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>{mostNew.code}</span> skews most toward
                new customers ({mostNew.newPct}%) — confirming it works as an acquisition tool.{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{mostBalance.code}</span> has the most
                balanced split — consider restricting to new buyers to maximise acquisition ROI.
              </p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
