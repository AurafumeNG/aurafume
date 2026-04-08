'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { MarketingData, PromoCodeRow, PromoStatus } from '@/types/analytics-marketing';

type SortKey = 'uses' | 'revenue' | 'discountGiven' | 'aovWithCode' | 'roi';

function roiColor(roi: number): string {
  if (roi === 0)  return TEXT.muted;
  if (roi >= 8)   return '#4ade80';
  if (roi >= 4)   return GOLD;
  return '#f87171';
}

function statusStyle(status: PromoStatus): { color: string; bg: string; border: string } {
  switch (status) {
    case 'Active':    return { color: '#4ade80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.30)'  };
    case 'Expired':   return { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)' };
    case 'Scheduled': return { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.30)'  };
    default:          return { color: TEXT.muted, bg: 'rgba(255,255,255,0.04)', border: BORDER.default };
  }
}

function typeColor(type: PromoCodeRow['type']): string {
  switch (type) {
    case 'Percentage':   return GOLD;
    case 'Fixed':        return '#60a5fa';
    case 'Free Shipping':return '#a78bfa';
    case 'Buy X Get Y':  return '#4ade80';
  }
}

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== active) return <ArrowUpDown size={8} style={{ color: TEXT.muted }} />;
  return dir === 'asc'
    ? <ArrowUp   size={8} style={{ color: GOLD }} />
    : <ArrowDown size={8} style={{ color: GOLD }} />;
}

interface Props { data: MarketingData | null }

const COLS: { label: string; key: SortKey | null; sortable?: boolean }[] = [
  { label: 'Code',           key: null            },
  { label: 'Type',           key: null            },
  { label: 'Uses / Limit',   key: 'uses',         sortable: true },
  { label: 'Customers',      key: null            },
  { label: 'Revenue',        key: 'revenue',      sortable: true },
  { label: 'Discount Given', key: 'discountGiven',sortable: true },
  { label: 'AOV w/ Code',    key: 'aovWithCode',  sortable: true },
  { label: 'ROI',            key: 'roi',          sortable: true },
  { label: 'Status',         key: null            },
];

export default function PromoCodeTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const rows = useMemo(() => {
    const src = data?.promoCodes ?? [];
    return [...src].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mul;
    });
  }, [data, sortKey, sortDir]);

  const siteAov = data?.siteAov ?? 0;

  return (
    <SectionCard>
      <SectionHeading title="Promo Code Performance Comparison" />

      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[0.50rem]" style={{ color: TEXT.muted }}>No promo codes found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                {COLS.map((col) => (
                  <th key={col.label} className="px-3 py-2.5 text-left"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {col.sortable && col.key ? (
                      <button className="flex items-center gap-1" onClick={() => handleSort(col.key as SortKey)}>
                        <span className="text-[0.40rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>
                          {col.label}
                        </span>
                        <SortIcon col={col.key as SortKey} active={sortKey} dir={sortDir} />
                      </button>
                    ) : (
                      <span className="text-[0.40rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>
                        {col.label}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const ss       = statusStyle(row.status);
                const limitPct = row.limit ? Math.min(100, Math.round((row.uses / row.limit) * 100)) : null;
                const aovDiff  = row.aovWithCode > 0 && siteAov > 0 ? row.aovWithCode - siteAov : null;

                return (
                  <tr key={row.code}
                    style={{
                      borderBottom: i < rows.length - 1 ? `1px solid ${BORDER.default}` : 'none',
                      opacity: row.status === 'Disabled' || row.status === 'Draft' ? 0.55 : 1,
                    }}
                  >
                    {/* Code */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />
                        <span className="text-[0.50rem] font-mono font-semibold" style={{ color: TEXT.primary }}>
                          {row.code}
                        </span>
                      </div>
                      <p className="text-[0.42rem] pl-3 mt-0.5" style={{ color: TEXT.muted }}>{row.discount} off</p>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-sm text-[0.40rem] tracking-[0.06em] uppercase"
                        style={{
                          color:      typeColor(row.type),
                          background: `${typeColor(row.type)}18`,
                          border:     `1px solid ${typeColor(row.type)}35`,
                        }}>
                        {row.type}
                      </span>
                    </td>

                    {/* Uses / limit */}
                    <td className="px-3 py-3 min-w-[100px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[0.48rem] font-medium" style={{ color: TEXT.secondary }}>{row.uses}</span>
                        <span className="text-[0.40rem]" style={{ color: TEXT.muted }}>
                          {row.limit ? `/ ${row.limit}` : '∞'}
                        </span>
                      </div>
                      {limitPct !== null && (
                        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1 rounded-full"
                            style={{
                              width:      `${limitPct}%`,
                              background: limitPct >= 90 ? '#f87171' : limitPct >= 70 ? GOLD : '#4ade80',
                            }} />
                        </div>
                      )}
                    </td>

                    {/* Unique customers */}
                    <td className="px-3 py-3 text-right">
                      <span className="text-[0.48rem]" style={{ color: TEXT.secondary }}>
                        {row.uniqueCustomers > 0 ? row.uniqueCustomers : '—'}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="px-3 py-3">
                      <span className="text-[0.50rem] font-semibold"
                        style={{ color: row.revenue > 0 ? TEXT.primary : TEXT.muted }}>
                        {row.revenue > 0 ? fmtNaira(row.revenue, true) : '—'}
                      </span>
                    </td>

                    {/* Discount given */}
                    <td className="px-3 py-3">
                      <span className="text-[0.48rem]"
                        style={{ color: row.discountGiven > 0 ? '#f87171' : TEXT.muted }}>
                        {row.discountGiven > 0 ? `-${fmtNaira(row.discountGiven, true)}` : '—'}
                      </span>
                    </td>

                    {/* AOV */}
                    <td className="px-3 py-3">
                      {row.aovWithCode > 0 ? (
                        <>
                          <p className="text-[0.48rem] font-medium" style={{ color: TEXT.secondary }}>
                            {fmtNaira(row.aovWithCode, true)}
                          </p>
                          {aovDiff !== null && (
                            <p className="text-[0.40rem]" style={{ color: aovDiff >= 0 ? '#4ade80' : '#f87171' }}>
                              {aovDiff >= 0 ? '+' : ''}{fmtNaira(aovDiff, true)} vs avg
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-[0.44rem]" style={{ color: TEXT.muted }}>—</span>
                      )}
                    </td>

                    {/* ROI */}
                    <td className="px-3 py-3">
                      <span className="text-[0.52rem] font-semibold" style={{ color: roiColor(row.roi) }}>
                        {row.roi > 0 ? `${row.roi.toFixed(1)}×` : '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-sm text-[0.40rem] tracking-[0.08em] uppercase"
                        style={{ color: ss.color, background: ss.bg, border: `1px solid ${ss.border}` }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 flex items-center gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
        <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>ROI:</span>
        {[
          { label: 'Excellent (8×+)', color: '#4ade80' },
          { label: 'Good (4–8×)',     color: GOLD      },
          { label: 'Low (<4×)',       color: '#f87171' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-[0.42rem]" style={{ color: TEXT.muted }}>{item.label}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
