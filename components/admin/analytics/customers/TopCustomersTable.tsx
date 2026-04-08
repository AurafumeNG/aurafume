'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { CustomersData, TopCustomer, TopCustomerSegment } from '@/types/analytics-customers';

type SortKey = 'rank' | 'totalOrders' | 'totalSpent' | 'aov';

const SEGMENT_COLORS: Record<TopCustomerSegment, string> = {
  Champion:            GOLD,
  Loyal:               '#4ade80',
  'Potential Loyalist':'#60a5fa',
  New:                 '#a78bfa',
  'At Risk':           '#facc15',
  Lost:                '#f87171',
};

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== active) return <ArrowUpDown size={9} style={{ color: TEXT.muted }} />;
  return dir === 'asc'
    ? <ArrowUp   size={9} style={{ color: GOLD }} />
    : <ArrowDown size={9} style={{ color: GOLD }} />;
}

interface Props { data: CustomersData | null }

export default function TopCustomersTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [segFilter, setSegFilter] = useState<TopCustomerSegment | 'All'>('All');

  const allCustomers: TopCustomer[] = data?.topCustomers ?? [];
  const segments: (TopCustomerSegment | 'All')[] = ['All', 'Champion', 'Loyal', 'Potential Loyalist', 'New', 'At Risk'];

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'rank' ? 'asc' : 'desc'); }
  }

  const rows = useMemo(() => {
    let d = segFilter === 'All' ? allCustomers : allCustomers.filter((c) => c.segment === segFilter);
    return [...d].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mul;
    });
  }, [sortKey, sortDir, segFilter, allCustomers]);

  const COLS: { label: string; key: SortKey | null; sortable?: boolean }[] = [
    { label: 'Rank',       key: 'rank',        sortable: true },
    { label: 'Customer',   key: null },
    { label: 'Orders',     key: 'totalOrders', sortable: true },
    { label: 'Spent',      key: 'totalSpent',  sortable: true },
    { label: 'AOV',        key: 'aov',         sortable: true },
    { label: 'Last Order', key: null },
    { label: 'Segment',    key: null },
    { label: '',           key: null },
  ];

  return (
    <SectionCard>
      <SectionHeading title="Top Customers" />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {segments.map((seg) => {
          const active = seg === segFilter;
          const color  = seg === 'All' ? TEXT.secondary : SEGMENT_COLORS[seg as TopCustomerSegment];
          return (
            <button
              key={seg}
              onClick={() => setSegFilter(seg)}
              className="h-6 px-3 text-[0.44rem] tracking-[0.10em] uppercase transition-colors rounded-sm"
              style={{
                background: active ? (seg === 'All' ? 'rgba(255,255,255,0.08)' : `${color}18`) : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? (seg === 'All' ? BORDER.hover : `${color}50`) : BORDER.default}`,
                color:  active ? (seg === 'All' ? TEXT.primary : color) : TEXT.secondary,
              }}
            >
              {seg}
            </button>
          );
        })}
      </div>

      {allCustomers.length === 0 ? (
        <p className="py-8 text-center text-[0.50rem]" style={{ color: TEXT.muted }}>No customer data available.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                  {COLS.map((col) => (
                    <th key={col.label} className="px-3 py-2.5 text-left" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {col.sortable && col.key ? (
                        <button className="flex items-center gap-1" onClick={() => handleSort(col.key as SortKey)}>
                          <span className="text-[0.42rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{col.label}</span>
                          <SortIcon col={col.key as SortKey} active={sortKey} dir={sortDir} />
                        </button>
                      ) : (
                        <span className="text-[0.42rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{col.label}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((customer, i) => {
                  const segColor = SEGMENT_COLORS[customer.segment];
                  return (
                    <tr key={customer.rank} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>
                      <td className="px-3 py-2.5">
                        <span className="text-[0.50rem] font-semibold" style={{ color: customer.rank <= 3 ? GOLD : TEXT.muted }}>
                          #{customer.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-[0.50rem] font-medium" style={{ color: TEXT.primary }}>{customer.name}</p>
                        <p className="text-[0.42rem]" style={{ color: TEXT.muted }}>{customer.email}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[0.50rem] font-medium" style={{ color: TEXT.secondary }}>{customer.totalOrders}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>{fmtNaira(customer.totalSpent, true)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[0.48rem]" style={{ color: TEXT.secondary }}>{fmtNaira(customer.aov, true)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[0.46rem]" style={{ color: TEXT.muted }}>{customer.lastOrder}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-sm text-[0.40rem] tracking-[0.08em] uppercase font-medium"
                          style={{ background: `${segColor}18`, color: segColor, border: `1px solid ${segColor}35` }}>
                          {customer.segment}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          className="flex items-center justify-center w-6 h-6 rounded-sm transition-colors"
                          style={{ border: `1px solid ${BORDER.default}` }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER.hover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER.default; }}
                          title="View profile"
                        >
                          <ExternalLink size={9} style={{ color: TEXT.secondary }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[0.44rem]" style={{ color: TEXT.muted }}>
              Showing {rows.length} of {allCustomers.length} customers
            </p>
            <p className="text-[0.44rem]" style={{ color: TEXT.muted }}>
              Combined spend:{' '}
              <span style={{ color: TEXT.secondary, fontWeight: 600 }}>
                {fmtNaira(rows.reduce((s, c) => s + c.totalSpent, 0), true)}
              </span>
            </p>
          </div>
        </>
      )}
    </SectionCard>
  );
}
