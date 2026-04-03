'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Download,
  Upload,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Archive,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import { ALL_PRODUCTS } from '@/lib/products';
import type { ShopProduct } from '@/components/shop/types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

type AdminProductStatus = 'published' | 'draft' | 'archived';
type StockStatus        = 'in-stock' | 'low-stock' | 'out-of-stock';
type SortKey =
  | 'newest' | 'oldest'
  | 'price-asc' | 'price-desc'
  | 'name-asc'  | 'name-desc'
  | 'most-sold' | 'least-sold';

interface AdminProduct extends ShopProduct {
  sku:         string;
  adminStatus: AdminProductStatus;
  stockStatus: StockStatus;
  totalSold:   number;
  category:    string;
}

interface AdminUser {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',     label: 'Newest First'     },
  { value: 'oldest',     label: 'Oldest First'     },
  { value: 'price-asc',  label: 'Price: Low–High'  },
  { value: 'price-desc', label: 'Price: High–Low'  },
  { value: 'name-asc',   label: 'Name: A–Z'        },
  { value: 'name-desc',  label: 'Name: Z–A'        },
  { value: 'most-sold',  label: 'Most Sold'        },
  { value: 'least-sold', label: 'Least Sold'       },
];

const CATEGORIES = ['All', 'Floral', 'Woody', 'Fresh', 'Oriental', 'Citrus'] as const;
const STATUSES   = ['All', 'Published', 'Draft', 'Archived']                  as const;
const STOCKS     = ['All', 'In Stock', 'Low Stock', 'Out of Stock']           as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString('en-NG')}`;
}

function skuFromId(id: string, index: number): string {
  return (
    id.split('-').map(w => w[0]?.toUpperCase() ?? '').join('') +
    '-' +
    String(index + 1).padStart(3, '0')
  );
}

function buildAdminProducts(): AdminProduct[] {
  return ALL_PRODUCTS.map((p, i) => ({
    ...p,
    sku:         skuFromId(p.id, i),
    adminStatus: 'published' as AdminProductStatus,
    stockStatus: (p.badge === 'Low Stock' ? 'low-stock' : 'in-stock') as StockStatus,
    totalSold:   p.reviewCount * 2,
    category:    p.scentTags[0] ?? 'Floral',
  }));
}

function applyFiltersAndSort(
  products:  AdminProduct[],
  search:    string,
  category:  string,
  status:    string,
  stock:     string,
  priceMin:  string,
  priceMax:  string,
  sort:      SortKey,
): AdminProduct[] {
  let out = [...products];

  if (search.trim()) {
    const q = search.toLowerCase();
    out = out.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)  ||
      p.category.toLowerCase().includes(q),
    );
  }

  if (category !== 'All') {
    out = out.filter(p => p.category === category);
  }

  if (status !== 'All') {
    const s = status.toLowerCase() as AdminProductStatus;
    out = out.filter(p => p.adminStatus === s);
  }

  if (stock !== 'All') {
    const map: Record<string, StockStatus> = {
      'In Stock':     'in-stock',
      'Low Stock':    'low-stock',
      'Out of Stock': 'out-of-stock',
    };
    const s = map[stock];
    if (s) out = out.filter(p => p.stockStatus === s);
  }

  const minNum = priceMin !== '' ? Number(priceMin) : null;
  const maxNum = priceMax !== '' ? Number(priceMax) : null;
  if (minNum !== null && !isNaN(minNum)) out = out.filter(p => p.price >= minNum);
  if (maxNum !== null && !isNaN(maxNum)) out = out.filter(p => p.price <= maxNum);

  out.sort((a, b) => {
    switch (sort) {
      case 'newest':     return b.createdAt - a.createdAt;
      case 'oldest':     return a.createdAt - b.createdAt;
      case 'price-asc':  return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name-asc':   return a.name.localeCompare(b.name);
      case 'name-desc':  return b.name.localeCompare(a.name);
      case 'most-sold':  return b.totalSold - a.totalSold;
      case 'least-sold': return a.totalSold - b.totalSold;
      default:           return 0;
    }
  });

  return out;
}

function exportToCSV(products: AdminProduct[]) {
  const headers = ['SKU', 'Name', 'Category', 'Scent Family', 'Status', 'Stock', 'Price (₦)', 'Sizes', 'Rating', 'Reviews', 'Created'];
  const rows    = products.map(p => [
    p.sku,
    `"${p.name}"`,
    p.category,
    `"${p.scentFamily}"`,
    p.adminStatus,
    p.stockStatus,
    p.price,
    `"${p.sizes.join(' | ')}"`,
    p.rating,
    p.reviewCount,
    new Date(p.createdAt * 1000).toLocaleDateString('en-NG'),
  ]);
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `aurafumeng-products-${Date.now()}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Filter Dropdown ────────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label:    string;
  value:    string;
  options:  readonly string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const active          = value !== 'All';
  const displayLabel    = active ? `${label}: ${value}` : label;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-[0.56rem] tracking-[0.10em] transition-colors duration-150"
        style={{
          border:     `1px solid ${active ? 'rgba(180,130,60,0.30)' : 'rgba(255,255,255,0.08)'}`,
          background: active ? 'rgba(180,130,60,0.08)' : 'rgba(255,255,255,0.02)',
          color:      active ? GOLD : 'rgba(255,255,255,0.45)',
        }}
      >
        <span>{displayLabel}</span>
        <ChevronDown
          size={11}
          strokeWidth={2}
          style={{
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[140px] py-1"
            style={{
              background: '#1E1E1E',
              border:     '1px solid rgba(255,255,255,0.08)',
              boxShadow:  '0 8px 24px rgba(0,0,0,0.55)',
            }}
          >
            {options.map(opt => {
              const selected = opt === value;
              return (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                  style={{
                    color:      selected ? GOLD : 'rgba(255,255,255,0.52)',
                    background: selected ? 'rgba(180,130,60,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!selected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color      = 'rgba(255,255,255,0.78)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color      = 'rgba(255,255,255,0.52)';
                    }
                  }}
                >
                  <span
                    className="text-[0.48rem] shrink-0 w-3 text-center"
                    style={{ color: GOLD, opacity: selected ? 1 : 0 }}
                  >
                    ✓
                  </span>
                  {opt}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sort Dropdown ──────────────────────────────────────────────────────────────

function SortDropdown({
  value,
  onChange,
}: {
  value:    SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const currentLabel    = SORT_OPTIONS.find(o => o.value === value)?.label ?? 'Sort';

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-[0.56rem] tracking-[0.10em] transition-colors duration-150"
        style={{
          border:     '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          color:      'rgba(255,255,255,0.45)',
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDown
          size={11}
          strokeWidth={2}
          style={{
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-[calc(100%+4px)] right-0 z-50 min-w-[170px] py-1"
            style={{
              background: '#1E1E1E',
              border:     '1px solid rgba(255,255,255,0.08)',
              boxShadow:  '0 8px 24px rgba(0,0,0,0.55)',
            }}
          >
            {SORT_OPTIONS.map(opt => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                  style={{
                    color:      selected ? GOLD : 'rgba(255,255,255,0.52)',
                    background: selected ? 'rgba(180,130,60,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!selected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color      = 'rgba(255,255,255,0.78)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color      = 'rgba(255,255,255,0.52)';
                    }
                  }}
                >
                  <span
                    className="text-[0.48rem] shrink-0 w-3 text-center"
                    style={{ color: GOLD, opacity: selected ? 1 : 0 }}
                  >
                    ✓
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Header Button ──────────────────────────────────────────────────────────────

function HeaderButton({
  icon,
  label,
  accent,
  onClick,
  href,
}: {
  icon:     React.ReactNode;
  label:    string;
  accent?:  boolean;
  onClick?: () => void;
  href?:    string;
}) {
  const [hovered, setHovered] = useState(false);

  const cls = 'flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150';

  const style = accent
    ? {
        background: hovered ? 'rgba(180,130,60,0.22)' : 'rgba(180,130,60,0.12)',
        color:      GOLD,
        border:     `1px solid ${hovered ? 'rgba(180,130,60,0.45)' : 'rgba(180,130,60,0.28)'}`,
      }
    : {
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        color:      hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
        border:     `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      };

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  if (href) {
    return (
      <Link href={href} className={cls} style={style} {...handlers}>
        {icon}{label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls} style={style} {...handlers}>
      {icon}{label}
    </button>
  );
}

// ── Status Pill ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: AdminProductStatus }) {
  const cfg = {
    published: {
      label:  'Published',
      bg:     'rgba(34,197,94,0.09)',
      color:  'rgba(74,222,128,0.88)',
      border: 'rgba(34,197,94,0.18)',
    },
    draft: {
      label:  'Draft',
      bg:     'rgba(255,255,255,0.04)',
      color:  'rgba(255,255,255,0.35)',
      border: 'rgba(255,255,255,0.08)',
    },
    archived: {
      label:  'Archived',
      bg:     'rgba(239,68,68,0.08)',
      color:  'rgba(239,68,68,0.72)',
      border: 'rgba(239,68,68,0.18)',
    },
  }[status];

  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

// ── Stock Pill ─────────────────────────────────────────────────────────────────

function StockPill({ status }: { status: StockStatus }) {
  const cfg = {
    'in-stock': {
      label:  'In Stock',
      bg:     'rgba(34,197,94,0.07)',
      color:  'rgba(74,222,128,0.78)',
      border: 'rgba(34,197,94,0.15)',
    },
    'low-stock': {
      label:  'Low Stock',
      bg:     'rgba(234,179,8,0.09)',
      color:  'rgba(250,204,21,0.82)',
      border: 'rgba(234,179,8,0.20)',
    },
    'out-of-stock': {
      label:  'Out of Stock',
      bg:     'rgba(239,68,68,0.08)',
      color:  'rgba(239,68,68,0.70)',
      border: 'rgba(239,68,68,0.16)',
    },
  }[status];

  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

// ── Row Action Button ──────────────────────────────────────────────────────────

function RowAction({
  icon,
  label,
  href,
  danger,
  onClick,
}: {
  icon:    React.ReactNode;
  label:   string;
  href?:   string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const style = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          '28px',
    height:         '28px',
    color:          hovered
      ? (danger ? 'rgba(239,68,68,0.88)' : 'rgba(255,255,255,0.78)')
      : (danger ? 'rgba(239,68,68,0.50)' : 'rgba(255,255,255,0.30)'),
    background: hovered
      ? (danger ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)')
      : 'transparent',
    border: `1px solid ${hovered
      ? (danger ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.10)')
      : 'rgba(255,255,255,0.06)'}`,
    transition: 'color 0.12s, background 0.12s, border-color 0.12s',
    cursor:     'pointer',
  } as React.CSSProperties;

  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    title:        label,
  };

  if (href) {
    return <Link href={href} style={style} {...handlers}>{icon}</Link>;
  }

  return <button onClick={onClick} style={style} {...handlers}>{icon}</button>;
}

// ── Product Row ────────────────────────────────────────────────────────────────

function ProductRow({ product }: { product: AdminProduct }) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? 'rgba(255,255,255,0.018)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition:   'background 0.10s',
      }}
    >
      {/* Product — image + name + SKU */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 shrink-0 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p
              className="text-[0.60rem] tracking-[0.06em] font-medium"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              {product.name}
            </p>
            <p
              className="mt-0.5 text-[0.46rem] tracking-[0.12em] uppercase font-mono"
              style={{ color: 'rgba(255,255,255,0.24)' }}
            >
              {product.sku}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <p
          className="text-[0.56rem] tracking-[0.08em]"
          style={{ color: 'rgba(255,255,255,0.42)' }}
        >
          {product.category}
        </p>
        <p
          className="mt-0.5 text-[0.44rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.20)' }}
        >
          {product.scentFamily}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusPill status={product.adminStatus} />
      </td>

      {/* Stock */}
      <td className="px-4 py-3">
        <StockPill status={product.stockStatus} />
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <p
          className="text-[0.60rem] tracking-[0.04em] font-medium tabular-nums"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          {formatNaira(product.price)}
        </p>
        <p
          className="mt-0.5 text-[0.44rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          {product.sizes.join(' · ')}
        </p>
      </td>

      {/* Sold */}
      <td className="px-4 py-3">
        <p
          className="text-[0.56rem] tracking-[0.06em] tabular-nums"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {product.totalSold.toLocaleString()}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <RowAction
            icon={<Pencil size={12} strokeWidth={1.8} />}
            label="Edit product"
            href={`/admin/products/${product.id}/edit`}
          />
          <RowAction
            icon={<Archive size={12} strokeWidth={1.8} />}
            label="Archive product"
            danger
          />
        </div>
      </td>
    </tr>
  );
}

// ── Pagination Button ─────────────────────────────────────────────────────────

function PaginationBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children:  React.ReactNode;
  active?:   boolean;
  disabled?: boolean;
  onClick:   () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-0.5 h-7 px-2.5 transition-colors duration-100"
      style={{
        background:  active   ? 'rgba(180,130,60,0.14)' : 'transparent',
        color:       active   ? GOLD
                   : disabled ? 'rgba(255,255,255,0.12)'
                   :            'rgba(255,255,255,0.38)',
        border:      `1px solid ${active ? 'rgba(180,130,60,0.28)' : 'rgba(255,255,255,0.06)'}`,
        cursor:      disabled ? 'not-allowed' : 'pointer',
        marginLeft:  '-1px',
      }}
    >
      {children}
    </button>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPage,
  onPageSize,
}: {
  page:       number;
  totalPages: number;
  pageSize:   number;
  totalItems: number;
  onPage:     (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const [jumpValue, setJumpValue] = useState('');

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, totalItems);

  function handleJump(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) onPage(n);
    setJumpValue('');
  }

  function getPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 flex-wrap"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Left: summary + per-page selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <p
          className="text-[0.50rem] tracking-[0.12em] shrink-0"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Showing{' '}
          <span style={{ color: 'rgba(255,255,255,0.50)' }}>{start}–{end}</span>
          {' '}of{' '}
          <span style={{ color: 'rgba(255,255,255,0.50)' }}>{totalItems}</span>
          {' '}products
        </p>

        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.07)' }}>
          {([10, 20, 50] as const).map((size, idx) => (
            <button
              key={size}
              onClick={() => { onPageSize(size); onPage(1); }}
              className="h-6 px-2.5 text-[0.46rem] tracking-[0.10em] transition-colors duration-100"
              style={{
                background: pageSize === size ? 'rgba(180,130,60,0.12)' : 'transparent',
                color:      pageSize === size ? GOLD : 'rgba(255,255,255,0.28)',
                borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.07)' : undefined,
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Right: page buttons + jump input */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ display: 'flex' }}>
          <PaginationBtn disabled={page === 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft  size={11} strokeWidth={2} />
            <span className="text-[0.46rem] tracking-[0.10em]">Prev</span>
          </PaginationBtn>

          {getPages().map((p, i) =>
            p === '...'
              ? (
                <span
                  key={`dots-${i}`}
                  className="flex items-center justify-center w-7 h-7 text-[0.46rem]"
                  style={{
                    color:      'rgba(255,255,255,0.20)',
                    border:     '1px solid rgba(255,255,255,0.06)',
                    marginLeft: '-1px',
                  }}
                >
                  …
                </span>
              ) : (
                <PaginationBtn key={p} active={p === page} onClick={() => onPage(p as number)}>
                  <span className="text-[0.48rem] tracking-[0.06em] tabular-nums">{p}</span>
                </PaginationBtn>
              )
          )}

          <PaginationBtn disabled={page === totalPages} onClick={() => onPage(page + 1)}>
            <span className="text-[0.46rem] tracking-[0.10em]">Next</span>
            <ChevronRight size={11} strokeWidth={2} />
          </PaginationBtn>
        </div>

        {/* Jump to page */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[0.46rem] tracking-[0.08em] whitespace-nowrap"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Go to
          </span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={e => setJumpValue(e.target.value)}
            onKeyDown={handleJump}
            placeholder="—"
            className="w-10 h-6 bg-transparent text-center text-[0.50rem] tracking-[0.06em] outline-none tabular-nums"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              color:  'rgba(255,255,255,0.55)',
            }}
          />
          <span
            className="text-[0.46rem] tracking-[0.08em]"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            / {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const ALL_ADMIN_PRODUCTS = buildAdminProducts();

export default function AdminProductsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Filter state
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [status,   setStatus]   = useState('All');
  const [stock,    setStock]    = useState('All');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort,     setSort]     = useState<SortKey>('newest');
  const [pageSize, setPageSize] = useState(20);
  const [page,     setPage]     = useState(1);

  const importRef = useRef<HTMLInputElement>(null);

  const filtered = applyFiltersAndSort(
    ALL_ADMIN_PRODUCTS, search, category, status, stock, priceMin, priceMax, sort,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const activeFilterCount = [
    category !== 'All',
    status   !== 'All',
    stock    !== 'All',
    priceMin !== '',
    priceMax !== '',
  ].filter(Boolean).length;

  // Auth check
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.status === 401 || res.status === 403) {
          router.push('/admin/login');
          return;
        }
        const { data } = await res.json() as { data?: AdminUser };
        if (!cancelled && data) setAdminUser(data);
      } catch {
        /* ignore — page still renders with static data */
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  // Reset to page 1 whenever the filtered result set changes
  useEffect(() => {
    setPage(1);
  }, [search, category, status, stock, priceMin, priceMax, sort, pageSize]);

  function clearFilters() {
    setCategory('All');
    setStatus('All');
    setStock('All');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: parse and upload CSV
    e.target.value = '';
  }

  const adminFullName  = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`     : '—';
  const adminShortName = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.` : '—';
  const adminRoleLabel = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>

      {/* Sidebar */}
      <AdminSidebar
        adminName={adminFullName}
        adminRole={adminRoleLabel}
        avatarUrl={adminUser?.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content — offset for desktop sidebar */}
      <div className="lg:pl-55 flex flex-col min-h-screen">

        {/* Top nav */}
        <AdminTopNav
          pageTitle="Products Management"
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        {/* Main */}
        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-5">

            {/* ── Page Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              {/* Title + count */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    Products Management
                  </h1>
                  <span
                    className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color:      'rgba(255,255,255,0.28)',
                      border:     '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {ALL_ADMIN_PRODUCTS.length} Products
                  </span>
                </div>
                <p
                  className="text-[0.54rem] tracking-[0.08em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Manage your fragrance catalogue, pricing, and inventory.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={importRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImport}
                />
                <HeaderButton
                  icon={<Upload size={12} strokeWidth={1.8} />}
                  label="Import Products"
                  onClick={() => importRef.current?.click()}
                />
                <HeaderButton
                  icon={<Download size={12} strokeWidth={1.8} />}
                  label="Export Products"
                  onClick={() => exportToCSV(filtered)}
                />
                <HeaderButton
                  icon={<Plus size={12} strokeWidth={2.2} />}
                  label="Add New Product"
                  accent
                  href="/admin/products/new"
                />
              </div>
            </div>

            {/* ── Search Bar ──────────────────────────────────────────────────── */}
            <div className="relative">
              <Search
                size={13}
                strokeWidth={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by product name, SKU, or category..."
                className="w-full h-10 pl-9 pr-9 text-[0.58rem] tracking-[0.06em] outline-none transition-all duration-150"
                style={{
                  background: '#1A1A1A',
                  border:     '1px solid rgba(255,255,255,0.06)',
                  color:      'rgba(255,255,255,0.78)',
                }}
                onFocus={e  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.14)'; }}
                onBlur={e   => {
                  e.currentTarget.style.border = search
                    ? '1px solid rgba(180,130,60,0.22)'
                    : '1px solid rgba(255,255,255,0.06)';
                }}
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{    opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.10 }}
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; }}
                    aria-label="Clear search"
                  >
                    <X size={12} strokeWidth={2} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Filter & Sort Bar ────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">

              {/* Filter dropdowns */}
              <FilterDropdown
                label="Category"
                value={category}
                options={CATEGORIES}
                onChange={setCategory}
              />
              <FilterDropdown
                label="Status"
                value={status}
                options={STATUSES}
                onChange={setStatus}
              />
              <FilterDropdown
                label="Stock"
                value={stock}
                options={STOCKS}
                onChange={setStock}
              />

              {/* Price range */}
              <div
                className="flex items-center gap-1 h-8 px-3"
                style={{
                  border:     '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <span
                  className="text-[0.50rem] tracking-[0.08em] shrink-0"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  ₦
                </span>
                <input
                  type="number"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="w-14 bg-transparent outline-none text-[0.56rem] tracking-[0.06em] tabular-nums"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                />
                <span
                  className="text-[0.44rem] shrink-0 px-0.5"
                  style={{ color: 'rgba(255,255,255,0.16)' }}
                >
                  —
                </span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="w-14 bg-transparent outline-none text-[0.56rem] tracking-[0.06em] tabular-nums"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                />
              </div>

              {/* Divider */}
              <div
                className="w-px h-5 mx-0.5 shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />

              {/* Sort */}
              <SortDropdown value={sort} onChange={setSort} />

              {/* Push active-filter info to the right */}
              <div className="flex-1" />

              {/* Active filter badge + clear */}
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{    opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] font-semibold uppercase"
                      style={{
                        background: 'rgba(180,130,60,0.10)',
                        color:      GOLD,
                        border:     '1px solid rgba(180,130,60,0.22)',
                      }}
                    >
                      {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                    </span>
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 h-7 px-3 text-[0.52rem] tracking-[0.10em] transition-colors duration-150"
                      style={{
                        color:      'rgba(255,255,255,0.32)',
                        border:     '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color  = 'rgba(255,255,255,0.62)';
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color  = 'rgba(255,255,255,0.32)';
                        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
                      }}
                    >
                      <X size={10} strokeWidth={2.2} />
                      Clear Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Products Table ───────────────────────────────────────────────── */}
            <div
              style={{
                border:     '1px solid rgba(255,255,255,0.06)',
                background: '#141414',
              }}
            >
              {/* Table meta row */}
              <div
                className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                {/* Page info */}
                <p
                  className="text-[0.50rem] tracking-[0.12em] shrink-0"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  Showing{' '}
                  <span style={{ color: 'rgba(255,255,255,0.50)' }}>
                    {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
                  </span>
                  {' '}of{' '}
                  <span style={{ color: 'rgba(255,255,255,0.50)' }}>{filtered.length}</span>
                  {' '}products
                </p>

                {/* Items per page */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[0.46rem] tracking-[0.10em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.18)' }}
                  >
                    Per page
                  </span>
                  <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {([10, 20, 50] as const).map((size, idx) => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className="h-6 px-2.5 text-[0.46rem] tracking-[0.10em] transition-colors duration-100"
                        style={{
                          background: pageSize === size ? 'rgba(180,130,60,0.12)' : 'transparent',
                          color:      pageSize === size ? GOLD : 'rgba(255,255,255,0.28)',
                          borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.07)' : undefined,
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {[
                        { label: 'Product',  cls: 'px-5' },
                        { label: 'Category', cls: 'px-4' },
                        { label: 'Status',   cls: 'px-4' },
                        { label: 'Stock',    cls: 'px-4' },
                        { label: 'Price',    cls: 'px-4' },
                        { label: 'Sold',     cls: 'px-4' },
                        { label: 'Actions',  cls: 'px-4' },
                      ].map(col => (
                        <th
                          key={col.label}
                          className={`${col.cls} py-3 text-left text-[0.46rem] tracking-[0.18em] uppercase font-semibold`}
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-14 text-center">
                          <p
                            className="text-[0.56rem] tracking-[0.10em]"
                            style={{ color: 'rgba(255,255,255,0.18)' }}
                          >
                            No products match your search or filters.
                          </p>
                          {(search || activeFilterCount > 0) && (
                            <button
                              onClick={() => { setSearch(''); clearFilters(); }}
                              className="mt-3 text-[0.52rem] tracking-[0.12em] underline underline-offset-2"
                              style={{ color: 'rgba(180,130,60,0.60)' }}
                            >
                              Clear all
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginated.map(product => (
                        <ProductRow key={product.id} product={product} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filtered.length > 0 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filtered.length}
                  onPage={setPage}
                  onPageSize={setPageSize}
                />
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Auth loading screen */}
      {authLoading && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center"
          style={{ background: '#0F0F0F' }}
        >
          <Loader2
            size={20}
            strokeWidth={1.8}
            className="animate-spin"
            style={{ color: GOLD }}
          />
        </div>
      )}
    </div>
  );
}
