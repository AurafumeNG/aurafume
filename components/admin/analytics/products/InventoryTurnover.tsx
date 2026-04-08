'use client';

import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { ProductsData, TurnoverRow, TurnoverStatus } from '@/types/analytics-products';

function statusStyle(status: TurnoverStatus): { color: string; bg: string; label: string } {
  switch (status) {
    case 'fast':   return { color: '#4ade80', bg: 'rgba(74,222,128,0.10)',  label: 'Fast Moving'  };
    case 'normal': return { color: GOLD,      bg: GOLD_BG(0.10),            label: 'Normal'        };
    case 'slow':   return { color: '#f87171', bg: 'rgba(248,113,113,0.10)', label: 'Slow Moving'  };
  }
}

function rateBarColor(rate: number, max: number): string {
  const ratio = max > 0 ? rate / max : 0;
  if (ratio > 0.65) return '#4ade80';
  if (ratio > 0.35) return GOLD;
  return '#f87171';
}

interface Props { data: ProductsData | null }

export default function InventoryTurnover({ data }: Props) {
  const turnoverData: TurnoverRow[] = data?.turnoverData ?? [];
  const avgTurnover                 = data?.avgTurnover   ?? 0;

  const fast   = turnoverData.filter((r) => r.status === 'fast').length;
  const normal = turnoverData.filter((r) => r.status === 'normal').length;
  const slow   = turnoverData.filter((r) => r.status === 'slow').length;

  const MAX_RATE = turnoverData.length > 0 ? Math.max(...turnoverData.map((r) => r.turnoverRate)) : 1;

  return (
    <SectionCard>
      <SectionHeading title="Inventory Turnover" />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Avg Turnover Rate', value: `${avgTurnover}×`, sub: 'Across all products',  color: undefined   },
          { label: 'Fast Moving',       value: String(fast),       sub: 'Rate ≥ 1.5×',         color: '#4ade80'   },
          { label: 'Normal Pace',       value: String(normal),     sub: 'Rate 0.8–1.5×',       color: GOLD        },
          { label: 'Slow Moving',       value: String(slow),       sub: 'Rate < 0.8×',         color: '#f87171'   },
        ].map((item) => (
          <div key={item.label} className="p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER.default}` }}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>
              {item.label}
            </p>
            <p className="mt-1.5 text-[1.10rem] font-semibold" style={{ color: item.color ?? TEXT.primary }}>
              {item.value}
            </p>
            <p className="mt-0.5 text-[0.42rem]" style={{ color: TEXT.secondary }}>{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Formula note */}
      <div className="mb-4 px-3 py-2"
        style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER.default}` }}>
        <p className="text-[0.46rem] tracking-[0.04em]" style={{ color: TEXT.muted }}>
          <span style={{ color: TEXT.secondary, fontWeight: 600 }}>Turnover Rate</span>
          {' '}= COGS ÷ Avg Inventory Value. Higher = faster moving stock. Lower = potential dead stock risk.
        </p>
      </div>

      {turnoverData.length === 0 ? (
        <p className="py-8 text-center text-[0.50rem]" style={{ color: TEXT.muted }}>
          No inventory data available.
        </p>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                  {['Product', 'Category', 'COGS', 'Avg Inventory', 'Turnover Rate', 'Days to Sell', 'Status'].map((col) => (
                    <th key={col} className="pb-2 text-left text-[0.44rem] tracking-[0.12em] uppercase font-medium pr-4"
                      style={{ color: TEXT.muted }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {turnoverData.map((row, i) => {
                  const s        = statusStyle(row.status);
                  const barColor = rateBarColor(row.turnoverRate, MAX_RATE);
                  const barWidth = MAX_RATE > 0 ? (row.turnoverRate / MAX_RATE) * 100 : 0;
                  const isLast   = i === turnoverData.length - 1;

                  return (
                    <tr key={row.name} style={{ borderBottom: isLast ? 'none' : `1px solid ${BORDER.default}` }}>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-5 rounded-full shrink-0" style={{ background: s.color }} />
                          <span className="text-[0.50rem] font-medium" style={{ color: TEXT.primary }}>
                            {row.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 pr-4">
                        <span className="text-[0.44rem]" style={{ color: TEXT.secondary }}>{row.category}</span>
                      </td>

                      <td className="py-2.5 pr-4">
                        <span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>
                          {fmtNaira(row.cogs, true)}
                        </span>
                      </td>

                      <td className="py-2.5 pr-4">
                        <span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>
                          {fmtNaira(row.avgInventory, true)}
                        </span>
                      </td>

                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.52rem] font-semibold w-8" style={{ color: barColor }}>
                            {row.turnoverRate}×
                          </span>
                          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', minWidth: 48 }}>
                            <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: barColor }} />
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 pr-4">
                        <span className="text-[0.50rem]" style={{ color: row.daysToSell > 200 ? '#f87171' : TEXT.secondary }}>
                          {row.daysToSell < 999 ? `${row.daysToSell} days` : '—'}
                        </span>
                      </td>

                      <td className="py-2.5">
                        <span className="text-[0.40rem] px-1.5 py-0.5 rounded-sm font-medium"
                          style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Color scale */}
          <div className="mt-4 pt-4 flex flex-wrap items-center gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
            <span className="text-[0.44rem]" style={{ color: TEXT.muted }}>Turnover scale:</span>
            {[
              { label: 'Fast Moving (≥1.5×)', color: '#4ade80' },
              { label: 'Normal (0.8–1.5×)',   color: GOLD      },
              { label: 'Slow Moving (<0.8×)', color: '#f87171' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-[0.44rem]" style={{ color: TEXT.secondary }}>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
