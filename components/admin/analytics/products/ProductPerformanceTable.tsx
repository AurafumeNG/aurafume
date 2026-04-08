'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronUp, ChevronDown, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, ToggleGroup, fmtNaira,
} from '../shared';
import type { ProductsData, ProductRow, StockStatus } from '@/types/analytics-products';

type SortKey = 'unitsSold' | 'revenue' | 'aov' | 'stockQty';
type SortDir = 'asc' | 'desc';
type ViewMode = 'product' | 'variant';

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: 'By Product', value: 'product' },
  { label: 'By Variant', value: 'variant' },
];

const STOCK_STYLE: Record<StockStatus, { label: string; color: string; bg: string }> = {
  in_stock:     { label: 'In Stock',    color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  },
  low_stock:    { label: 'Low Stock',   color: '#facc15', bg: 'rgba(250,204,21,0.10)'  },
  out_of_stock: { label: 'Out of Stock',color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
};

const CAT_COLORS: Record<string, string> = {
  Woody:    GOLD_BG(0.60),
  Floral:   'rgba(244,114,182,0.50)',
  Fresh:    'rgba(52,211,153,0.50)',
  Oriental: 'rgba(167,139,250,0.50)',
  Citrus:   'rgba(251,191,36,0.50)',
};

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: SortDir }) {
  if (col !== active) return <ChevronUp size={9} style={{ color: TEXT.muted, opacity: 0.3 }} />;
  return dir === 'asc'
    ? <ChevronUp size={9} style={{ color: GOLD }} />
    : <ChevronDown size={9} style={{ color: GOLD }} />;
}

interface Props {
  data: ProductsData | null;
  category?: string;
}

export default function ProductPerformanceTable({ data, category = 'All Categories' }: Props) {
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [view, setView]       = useState<ViewMode>('product');

  const allProducts: ProductRow[] = data?.products ?? [];

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filtered = useMemo(() => {
    let rows = allProducts;
    if (category !== 'All Categories') rows = rows.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [search, sortKey, sortDir, category, allProducts]);

  const cols: { label: string; key: SortKey; fmt?: (v: number) => string }[] = [
    { label: 'Units Sold', key: 'unitsSold' },
    { label: 'Revenue',    key: 'revenue',  fmt: (v) => fmtNaira(v, true) },
    { label: 'AOV',        key: 'aov',      fmt: (v) => fmtNaira(v, true) },
    { label: 'Stock Qty',  key: 'stockQty' },
  ];

  return (
    <SectionCard>
      <SectionHeading
        title="All Products Performance"
        action={<ToggleGroup options={VIEW_OPTIONS} value={view} onChange={setView} />}
      />

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 h-8 px-3 w-full max-w-xs"
        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER.default}` }}>
        <Search size={11} style={{ color: TEXT.secondary }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 bg-transparent outline-none text-[0.50rem] tracking-[0.04em]"
          style={{ color: TEXT.primary }}
        />
      </div>

      {allProducts.length === 0 ? (
        <p className="py-12 text-center text-[0.50rem]" style={{ color: TEXT.muted }}>
          No product sales data for this period.
        </p>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                  <th className="pb-2 pr-4 text-left text-[0.44rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.muted }}>
                    Product
                  </th>
                  <th className="pb-2 pr-4 text-left text-[0.44rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.muted }}>
                    Category
                  </th>
                  {view === 'product' && (
                    <th className="pb-2 pr-4 text-left text-[0.44rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.muted }}>
                      Variants
                    </th>
                  )}
                  {cols.map((col) => (
                    <th key={col.key}
                      className="pb-2 pr-4 text-right text-[0.44rem] tracking-[0.12em] uppercase font-medium cursor-pointer select-none"
                      style={{ color: sortKey === col.key ? GOLD : TEXT.muted }}
                      onClick={() => handleSort(col.key)}>
                      <div className="flex items-center justify-end gap-1">
                        {col.label}
                        <SortIcon col={col.key} active={sortKey} dir={sortDir} />
                      </div>
                    </th>
                  ))}
                  <th className="pb-2 pr-4 text-center text-[0.44rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.muted }}>
                    Stock
                  </th>
                  <th className="pb-2 pr-4 text-center text-[0.44rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.muted }}>
                    Trend
                  </th>
                  <th className="pb-2 text-center text-[0.44rem] tracking-[0.12em] uppercase font-medium" style={{ color: TEXT.muted }}>
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => {
                  const stock  = STOCK_STYLE[product.stock];
                  const catClr = CAT_COLORS[product.category] ?? GOLD_BG(0.40);
                  const isLast = i === filtered.length - 1;

                  return (
                    <tr key={product.id} style={{ borderBottom: isLast ? 'none' : `1px solid ${BORDER.default}` }}>
                      {/* Product name */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded"
                            style={{ background: GOLD_BG(0.08), border: `1px solid ${GOLD_BG(0.15)}` }}>
                            <span className="text-[0.40rem]" style={{ color: GOLD }}>{product.name[0]}</span>
                          </div>
                          <span className="text-[0.50rem] font-medium" style={{ color: TEXT.primary }}>
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 pr-4">
                        <span className="text-[0.44rem] px-1.5 py-0.5 rounded-sm" style={{ background: catClr, color: TEXT.primary }}>
                          {product.category}
                        </span>
                      </td>

                      {/* Variants */}
                      {view === 'product' && (
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {product.variants.map((v) => (
                              <span key={v} className="text-[0.40rem] px-1 py-0.5"
                                style={{ border: `1px solid ${BORDER.default}`, color: TEXT.secondary }}>
                                {v}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}

                      {/* Metric columns */}
                      {cols.map((col) => {
                        const val = product[col.key] as number;
                        return (
                          <td key={col.key} className="py-3 pr-4 text-right">
                            <span className="text-[0.50rem]" style={{ color: col.key === 'revenue' ? GOLD : TEXT.primary }}>
                              {col.fmt ? col.fmt(val) : val.toLocaleString()}
                            </span>
                          </td>
                        );
                      })}

                      {/* Stock badge */}
                      <td className="py-3 pr-4 text-center">
                        <span className="text-[0.40rem] px-1.5 py-0.5 rounded-sm" style={{ background: stock.bg, color: stock.color }}>
                          {stock.label}
                        </span>
                      </td>

                      {/* Sparkline */}
                      <td className="py-3 pr-4">
                        <div className="w-16 h-6 mx-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={product.trend} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
                              <defs>
                                <linearGradient id={`pg${product.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="v" stroke={GOLD} strokeWidth={1.2}
                                fill={`url(#pg${product.id})`} dot={false} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </td>

                      {/* View detail link */}
                      <td className="py-3 text-center">
                        <Link href={`/admin/products/${product.id}`}
                          className="flex items-center gap-0.5 justify-center text-[0.44rem] tracking-[0.06em] uppercase transition-colors"
                          style={{ color: TEXT.muted }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = TEXT.muted; }}>
                          Detail
                          <ArrowUpRight size={9} strokeWidth={2} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[0.50rem] tracking-[0.08em]" style={{ color: TEXT.muted }}>
                  No products match your search.
                </p>
              </div>
            )}
          </div>

          <p className="mt-3 text-[0.44rem]" style={{ color: TEXT.muted }}>
            {filtered.length} of {allProducts.length} products shown
          </p>
        </>
      )}
    </SectionCard>
  );
}
