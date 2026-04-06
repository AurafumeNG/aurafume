'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart2,
  RefreshCw,
  Bell,
  Plus,
  Minus,
  Eye,
  Filter,
  ArrowUp,
  ArrowDown,
  Settings,
  CheckSquare,
  Square,
  Upload,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import Image from 'next/image';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Types ──────────────────────────────────────────────────────────────────────

interface InventoryVariant {
  size: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  costPrice: number;
  stockValue: number;
  unitsSold: number;
  velocity: number; // per day
  daysLeft: number; // 9999 = infinite, 0 = out of stock
  lastRestocked: string | null;
  lastSold: string | null;
}

interface InventoryProduct {
  _id: string;
  name: string;
  slug: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  image: string;
  variants: InventoryVariant[];
}

interface InventoryStats {
  totalSkus: number;
  outOfStock: number;
  lowStock: number;
  wellStocked: number;
  stockValue: number;
  todayMovements: number;
}

interface ChartPoint {
  date: string;
  added: number;
  removed: number;
}

interface FlatRow {
  productId: string;
  productName: string;
  productSlug: string;
  productCategory: string;
  productStatus: 'draft' | 'published' | 'archived';
  productImage: string;
  key: string; // `${productId}::${size}`
  size: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  costPrice: number;
  stockValue: number;
  unitsSold: number;
  velocity: number;
  daysLeft: number;
  lastRestocked: string | null;
  lastSold: string | null;
}

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

type StockFilter = 'all' | 'out' | 'low' | 'well';
type SortKey =
  | 'name'
  | 'stock-asc'
  | 'stock-desc'
  | 'value-desc'
  | 'velocity-desc'
  | 'daysLeft-asc';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-NG');
}

function fmtNGN(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function stockColor(stock: number, threshold: number): string {
  if (stock === 0) return '#ef4444';
  if (stock <= threshold) return '#f59e0b';
  return '#22c55e';
}

function stockLabel(stock: number, threshold: number): string {
  if (stock === 0) return 'Out';
  if (stock <= threshold) return 'Low';
  return 'Good';
}

function daysLeftLabel(daysLeft: number, stock: number): string {
  if (stock === 0) return 'Out';
  if (daysLeft >= 9999) return '∞';
  return `${daysLeft}d`;
}

function exportCSV(rows: FlatRow[]) {
  const headers = [
    'Product',
    'Category',
    'Status',
    'Size',
    'SKU',
    'Stock',
    'Threshold',
    'Cost (₦)',
    'Value (₦)',
    'Units Sold (30d)',
    'Velocity (/day)',
    'Days Left',
    'Last Restocked',
    'Last Sold',
  ];
  const data = rows.map((r) => [
    `"${r.productName}"`,
    r.productCategory,
    r.productStatus,
    r.size,
    r.sku,
    r.stock,
    r.lowStockThreshold,
    r.costPrice,
    r.stockValue,
    r.unitsSold,
    r.velocity,
    r.daysLeft >= 9999 ? 'Infinite' : r.daysLeft,
    r.lastRestocked ? new Date(r.lastRestocked).toLocaleDateString() : '',
    r.lastSold ? new Date(r.lastSold).toLocaleDateString() : '',
  ]);
  const csv = [headers, ...data].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `aurafumeng-inventory-${Date.now()}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Stock Movement Chart ───────────────────────────────────────────────────────

function StockChart({
  data,
  period,
}: {
  data: ChartPoint[];
  period: 7 | 30 | 90;
}) {
  const cutoff = new Date(Date.now() - period * 86400000)
    .toISOString()
    .split('T')[0];
  const slice = useMemo(
    () => data.filter((d) => d.date >= cutoff),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, period],
  );

  if (slice.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-32"
        style={{ color: 'rgba(255,255,255,0.18)' }}
      >
        <BarChart2 size={28} strokeWidth={1.2} />
        <span className="ml-2 text-xs tracking-widest uppercase">
          No movement data
        </span>
      </div>
    );
  }

  const maxVal = Math.max(...slice.map((d) => Math.max(d.added, d.removed)), 1);
  const H = 110;
  const barW = Math.max(
    3,
    Math.min(14, Math.floor(580 / (slice.length * 2.8))),
  );
  const gap = Math.max(2, Math.floor(barW * 0.4));
  const groupW = barW * 2 + gap + 4;
  const totalW = Math.max(620, slice.length * groupW + 20);

  return (
    <div
      className="overflow-x-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}
    >
      <svg width={totalW} height={H + 24} style={{ display: 'block' }}>
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            y1={Math.round(H - f * H)}
            x2={totalW}
            y2={Math.round(H - f * H)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {slice.map((d, i) => {
          const addedH = maxVal > 0 ? Math.round((d.added / maxVal) * H) : 0;
          const removedH =
            maxVal > 0 ? Math.round((d.removed / maxVal) * H) : 0;
          const x = 10 + i * groupW;
          const showLabel =
            period <= 7 ||
            (period === 30 && i % 5 === 0) ||
            (period === 90 && i % 15 === 0);
          return (
            <g key={d.date}>
              {/* Added bar */}
              <rect
                x={x}
                y={H - addedH}
                width={barW}
                height={Math.max(addedH, 1)}
                fill="rgba(34,197,94,0.55)"
                rx={1}
              />
              {/* Removed bar */}
              <rect
                x={x + barW + gap}
                y={H - removedH}
                width={barW}
                height={Math.max(removedH, 1)}
                fill="rgba(245,158,11,0.55)"
                rx={1}
              />
              {showLabel && (
                <text
                  x={x + barW}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize={8}
                  fill="rgba(255,255,255,0.22)"
                >
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 px-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: 'rgba(34,197,94,0.55)' }}
          />
          <span
            className="text-[0.46rem] tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Restocked
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: 'rgba(245,158,11,0.55)' }}
          />
          <span
            className="text-[0.46rem] tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Removed / Sold
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Restock Modal ──────────────────────────────────────────────────────────────

function RestockModal({
  productId,
  productName,
  size,
  currentStock,
  onClose,
  onSuccess,
}: {
  productId: string;
  productName: string;
  size: string;
  currentStock: number;
  onClose: () => void;
  onSuccess: (productId: string, size: string, newStock: number) => void;
}) {
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numQty = parseInt(qty, 10);
  const isValid = !isNaN(numQty) && numQty >= 0;
  const newStock = isValid
    ? mode === 'add'
      ? currentStock + numQty
      : numQty
    : null;
  const delta = newStock !== null ? newStock - currentStock : null;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/stock-adjustments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantSize: size,
            type: mode,
            qty: numQty,
            reason,
          }),
        },
      );
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      onSuccess(productId, size, newStock!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm p-6 space-y-5"
        style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.70)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-[0.48rem] tracking-[0.18em] uppercase mb-1"
              style={{ color: GOLD }}
            >
              Restock
            </p>
            <h2
              className="text-[0.70rem] tracking-[0.12em] font-semibold"
              style={{ color: 'rgba(255,255,255,0.88)' }}
            >
              {productName}
            </h2>
            <p
              className="text-[0.50rem] tracking-[0.10em] mt-0.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {size} · Current stock:{' '}
              <span style={{ color: 'rgba(255,255,255,0.60)' }}>
                {currentStock}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'rgba(255,255,255,0.30)' }}
            className="hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div
          className="flex"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['add', 'set'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-1.5 text-[0.46rem] tracking-[0.14em] uppercase font-semibold transition-all duration-150"
              style={{
                background:
                  mode === m ? 'rgba(180,130,60,0.14)' : 'transparent',
                color: mode === m ? GOLD : 'rgba(255,255,255,0.35)',
                borderRight:
                  m === 'add' ? '1px solid rgba(255,255,255,0.08)' : undefined,
              }}
            >
              {m === 'add' ? 'Add Units' : 'Set Exact'}
            </button>
          ))}
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <label
            className="text-[0.44rem] tracking-[0.12em] uppercase"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {mode === 'add' ? 'Units to Add' : 'New Stock Level'}
          </label>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 text-sm outline-none transition-all"
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.85)',
            }}
          />
        </div>

        {/* Preview */}
        {newStock !== null && (
          <div
            className="flex items-center justify-between px-3 py-2.5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="text-[0.46rem] tracking-[0.12em] uppercase"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              New Stock
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-[0.54rem]"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                {currentStock}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
              <span
                className="text-[0.64rem] font-semibold"
                style={{ color: stockColor(newStock, 5) }}
              >
                {newStock}
              </span>
              {delta !== null && delta !== 0 && (
                <span
                  className="text-[0.44rem]"
                  style={{ color: delta > 0 ? '#22c55e' : '#ef4444' }}
                >
                  ({delta > 0 ? '+' : ''}
                  {delta})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-1.5">
          <label
            className="text-[0.44rem] tracking-[0.12em] uppercase"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Received new shipment"
            className="w-full px-3 py-2 text-sm outline-none"
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.85)',
            }}
          />
        </div>

        {error && (
          <p
            className="text-[0.48rem] tracking-wider"
            style={{ color: '#ef4444' }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase transition-colors"
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.40)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              background:
                !isValid || loading
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(180,130,60,0.18)',
              color: !isValid || loading ? 'rgba(255,255,255,0.20)' : GOLD,
              border: `1px solid ${!isValid || loading ? 'rgba(255,255,255,0.06)' : 'rgba(180,130,60,0.30)'}`,
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading && <Loader2 size={10} className="animate-spin" />}
            Confirm Restock
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Bulk Restock Modal ─────────────────────────────────────────────────────────

function BulkRestockModal({
  rows,
  onClose,
  onSuccess,
}: {
  rows: FlatRow[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleQtyChange(key: string, val: string) {
    setQuantities((prev) => ({ ...prev, [key]: val }));
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').slice(1); // skip header
      const updates: Record<string, string> = {};
      for (const line of lines) {
        const [sku, qty] = line.split(',');
        const match = rows.find((r) => r.sku === sku?.trim());
        if (match && qty?.trim()) updates[match.key] = qty.trim();
      }
      setQuantities((prev) => ({ ...prev, ...updates }));
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    const targets = rows.filter((r) => {
      const q = parseInt(quantities[r.key] ?? '', 10);
      return !isNaN(q) && q >= 0;
    });
    if (targets.length === 0) {
      setError('Enter quantities for at least one row.');
      return;
    }
    setLoading(true);
    setError('');
    setProgress(0);
    let done = 0;
    const errors: string[] = [];
    for (const row of targets) {
      try {
        const qty = parseInt(quantities[row.key]!, 10);
        const res = await fetch(
          `/api/admin/products/${row.productId}/stock-adjustments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              variantSize: row.size,
              type: mode,
              qty,
              reason,
            }),
          },
        );
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          errors.push(
            `${row.productName} (${row.size}): ${j.error ?? 'Failed'}`,
          );
        }
      } catch {
        errors.push(`${row.productName} (${row.size}): Network error`);
      }
      done++;
      setProgress(Math.round((done / targets.length) * 100));
    }
    setLoading(false);
    if (errors.length > 0) {
      setError(errors.slice(0, 3).join('; '));
      return;
    }
    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl flex flex-col max-h-[90vh]"
        style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.70)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <p
              className="text-[0.48rem] tracking-[0.18em] uppercase mb-0.5"
              style={{ color: GOLD }}
            >
              Bulk Restock
            </p>
            <h2
              className="text-[0.68rem] tracking-[0.10em] font-semibold"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {rows.length} variant{rows.length !== 1 ? 's' : ''} selected
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.30)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-3 px-6 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="flex"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['add', 'set'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1 text-[0.44rem] tracking-[0.12em] uppercase transition-all"
                style={{
                  background:
                    mode === m ? 'rgba(180,130,60,0.14)' : 'transparent',
                  color: mode === m ? GOLD : 'rgba(255,255,255,0.35)',
                  borderRight:
                    m === 'add'
                      ? '1px solid rgba(255,255,255,0.08)'
                      : undefined,
                }}
              >
                {m === 'add' ? 'Add' : 'Set'}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 px-2.5 py-1 text-xs outline-none"
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.70)',
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[0.44rem] tracking-[0.10em] uppercase transition-colors"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            <Upload size={10} /> CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSV}
          />
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-[0.50rem] tracking-wider">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Product', 'Size', 'Current', 'Qty', 'Preview'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-normal uppercase tracking-[0.12em]"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const q = parseInt(quantities[row.key] ?? '', 10);
                const preview =
                  !isNaN(q) && q >= 0
                    ? mode === 'add'
                      ? row.stock + q
                      : q
                    : null;
                return (
                  <tr
                    key={row.key}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td
                      className="px-4 py-2"
                      style={{ color: 'rgba(255,255,255,0.70)' }}
                    >
                      <p style={{ color: 'rgba(255,255,255,0.70)' }}>
                        {row.productName}
                      </p>
                    </td>
                    <td
                      className="px-4 py-2"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      {row.size}
                    </td>
                    <td
                      className="px-4 py-2"
                      style={{
                        color: stockColor(row.stock, row.lowStockThreshold),
                      }}
                    >
                      {row.stock}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        value={quantities[row.key] ?? ''}
                        onChange={(e) =>
                          handleQtyChange(row.key, e.target.value)
                        }
                        placeholder="—"
                        className="w-16 px-2 py-0.5 text-center outline-none"
                        style={{
                          background: '#0F0F0F',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: 'rgba(255,255,255,0.80)',
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      {preview !== null ? (
                        <span
                          style={{
                            color: stockColor(preview, row.lowStockThreshold),
                          }}
                        >
                          {preview}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.18)' }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Progress */}
        {loading && (
          <div className="px-6 pt-2">
            <div
              className="h-0.5 w-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, background: GOLD }}
              />
            </div>
            <p
              className="text-[0.44rem] tracking-wider mt-1"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              {progress}% complete
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {error && (
            <p
              className="text-[0.48rem] tracking-wider mb-2"
              style={{ color: '#ef4444' }}
            >
              {error}
            </p>
          )}
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.40)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase font-semibold flex items-center justify-center gap-1.5"
              style={{
                background: loading
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(180,130,60,0.18)',
                color: loading ? 'rgba(255,255,255,0.20)' : GOLD,
                border: `1px solid ${loading ? 'rgba(255,255,255,0.06)' : 'rgba(180,130,60,0.30)'}`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading && <Loader2 size={10} className="animate-spin" />}
              Apply Restock
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Alert Thresholds Modal ─────────────────────────────────────────────────────

function AlertThresholdsModal({
  products,
  onClose,
  onSaved,
}: {
  products: InventoryProduct[];
  onClose: () => void;
  onSaved: () => void;
}) {
  type ThresholdMap = Record<string, Record<string, number>>; // productId -> size -> threshold
  const [thresholds, setThresholds] = useState<ThresholdMap>(() => {
    const map: ThresholdMap = {};
    for (const p of products) {
      map[p._id] = {};
      for (const v of p.variants) {
        map[p._id][v.size] = v.lowStockThreshold;
      }
    }
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [globalDefault, setGlobalDefault] = useState('5');

  function applyGlobal() {
    const val = parseInt(globalDefault, 10);
    if (isNaN(val) || val < 0) return;
    setThresholds((prev) => {
      const next = { ...prev };
      for (const pid of Object.keys(next)) {
        next[pid] = { ...next[pid] };
        for (const size of Object.keys(next[pid])) {
          next[pid][size] = val;
        }
      }
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    setError('');
    const errors: string[] = [];
    for (const product of products) {
      const updated = product.variants.map((v) => ({
        ...v,
        lowStockThreshold:
          thresholds[product._id]?.[v.size] ?? v.lowStockThreshold,
      }));
      try {
        const res = await fetch(`/api/admin/products/${product._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variants: updated }),
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          errors.push(`${product.name}: ${j.error ?? 'Failed'}`);
        }
      } catch {
        errors.push(`${product.name}: Network error`);
      }
    }
    setLoading(false);
    if (errors.length > 0) {
      setError(errors.slice(0, 2).join('; '));
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-xl flex flex-col max-h-[88vh]"
        style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.70)',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <p
              className="text-[0.48rem] tracking-[0.18em] uppercase mb-0.5"
              style={{ color: GOLD }}
            >
              Alert Thresholds
            </p>
            <h2
              className="text-[0.68rem] tracking-[0.10em] font-semibold"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Low Stock Warnings
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.30)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Global default */}
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p
            className="text-[0.44rem] tracking-[0.12em] uppercase mb-2"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Global Default — applies to all variants
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={globalDefault}
              onChange={(e) => setGlobalDefault(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-sm outline-none"
              style={{
                background: '#0F0F0F',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.80)',
              }}
            />
            <button
              onClick={applyGlobal}
              className="px-3 py-1.5 text-[0.46rem] tracking-[0.12em] uppercase transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.50)',
              }}
            >
              Apply to All
            </button>
          </div>
        </div>

        {/* Per-variant table */}
        <div className="overflow-y-auto flex-1">
          {products.map((p) => (
            <div
              key={p._id}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div
                className="px-6 py-2"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <p
                  className="text-[0.50rem] tracking-[0.10em] font-semibold"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  {p.name}
                </p>
              </div>
              {p.variants.map((v) => (
                <div
                  key={v.size}
                  className="flex items-center justify-between px-6 py-2.5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <div>
                    <p
                      className="text-[0.48rem] tracking-[0.08em]"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {v.size}
                    </p>
                    <p
                      className="text-[0.42rem] mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Stock: {v.stock}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={thresholds[p._id]?.[v.size] ?? v.lowStockThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 0) {
                        setThresholds((prev) => ({
                          ...prev,
                          [p._id]: { ...(prev[p._id] ?? {}), [v.size]: val },
                        }));
                      }
                    }}
                    className="w-16 px-2 py-1 text-center text-sm outline-none"
                    style={{
                      background: '#0F0F0F',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.80)',
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          className="px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {error && (
            <p
              className="text-[0.48rem] tracking-wider mb-2"
              style={{ color: '#ef4444' }}
            >
              {error}
            </p>
          )}
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.40)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase font-semibold flex items-center justify-center gap-1.5"
              style={{
                background: loading
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(180,130,60,0.18)',
                color: loading ? 'rgba(255,255,255,0.20)' : GOLD,
                border: `1px solid ${loading ? 'rgba(255,255,255,0.06)' : 'rgba(180,130,60,0.30)'}`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading && <Loader2 size={10} className="animate-spin" />}
              Save Thresholds
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const router = useRouter();

  // Auth
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [variantSizes, setVariantSizes] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStockStatus, setFilterStockStatus] =
    useState<StockFilter>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVariantSize, setFilterVariantSize] = useState('all');
  const [filterProductStatus, setFilterProductStatus] = useState<
    'all' | 'published' | 'draft' | 'archived'
  >('all');
  const [sortBy, setSortBy] = useState<SortKey>('name');

  // Selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Modals
  const [restockModal, setRestockModal] = useState<{
    productId: string;
    productName: string;
    size: string;
    currentStock: number;
  } | null>(null);
  const [bulkRestockOpen, setBulkRestockOpen] = useState(false);
  const [alertThreshOpen, setAlertThreshOpen] = useState(false);

  // Chart
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(30);

  // Alerts collapsed
  const [outCollapsed, setOutCollapsed] = useState(false);
  const [lowCollapsed, setLowCollapsed] = useState(false);

  // ── Auth ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/me')
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push('/admin/login');
          return;
        }
        const { data } = (await res.json()) as { data?: AdminUser };
        if (!cancelled && data) setAdminUser(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ── Fetch inventory ───────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await fetch('/api/admin/inventory');
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          stats: InventoryStats;
          products: InventoryProduct[];
          chartData: ChartPoint[];
          categories: string[];
          variantSizes: string[];
        };
      };
      if (json.success && json.data) {
        setStats(json.data.stats);
        setProducts(json.data.products);
        setChartData(json.data.chartData);
        setCategories(json.data.categories);
        setVariantSizes(json.data.variantSizes);
      }
    } catch {
      /* ignore */
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // ── Flatten + filter + sort rows ─────────────────────────────────────────────

  const allRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    for (const p of products) {
      for (const v of p.variants) {
        rows.push({
          productId: p._id,
          productName: p.name,
          productSlug: p.slug,
          productCategory: p.category,
          productStatus: p.status,
          productImage: p.image,
          key: `${p._id}::${v.size}`,
          size: v.size,
          sku: v.sku,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          costPrice: v.costPrice,
          stockValue: v.stockValue,
          unitsSold: v.unitsSold,
          velocity: v.velocity,
          daysLeft: v.daysLeft,
          lastRestocked: v.lastRestocked,
          lastSold: v.lastSold,
        });
      }
    }
    return rows;
  }, [products]);

  const filteredRows = useMemo<FlatRow[]>(() => {
    let rows = allRows;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.productName.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          r.size.toLowerCase().includes(q),
      );
    }

    // Stock status
    if (filterStockStatus !== 'all') {
      rows = rows.filter((r) => {
        if (filterStockStatus === 'out') return r.stock === 0;
        if (filterStockStatus === 'low')
          return r.stock > 0 && r.stock <= r.lowStockThreshold;
        if (filterStockStatus === 'well') return r.stock > r.lowStockThreshold;
        return true;
      });
    }

    // Category
    if (filterCategory !== 'all') {
      rows = rows.filter((r) => r.productCategory === filterCategory);
    }

    // Variant size
    if (filterVariantSize !== 'all') {
      rows = rows.filter((r) => r.size === filterVariantSize);
    }

    // Product status
    if (filterProductStatus !== 'all') {
      rows = rows.filter((r) => r.productStatus === filterProductStatus);
    }

    // Sort
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.productName.localeCompare(b.productName);
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        case 'value-desc':
          return b.stockValue - a.stockValue;
        case 'velocity-desc':
          return b.velocity - a.velocity;
        case 'daysLeft-asc':
          return a.daysLeft - b.daysLeft;
        default:
          return 0;
      }
    });

    return rows;
  }, [
    allRows,
    search,
    filterStockStatus,
    filterCategory,
    filterVariantSize,
    filterProductStatus,
    sortBy,
  ]);

  const outOfStockRows = useMemo(
    () => allRows.filter((r) => r.stock === 0),
    [allRows],
  );
  const lowStockRows = useMemo(
    () =>
      allRows
        .filter((r) => r.stock > 0 && r.stock <= r.lowStockThreshold)
        .slice(0, 5),
    [allRows],
  );
  const topMovers = useMemo(
    () =>
      [...allRows]
        .sort((a, b) => b.velocity - a.velocity)
        .filter((r) => r.velocity > 0)
        .slice(0, 5),
    [allRows],
  );
  const deadStock = useMemo(
    () => allRows.filter((r) => r.stock > 0 && r.unitsSold === 0).slice(0, 8),
    [allRows],
  );

  const selectedBulkRows = useMemo(
    () => filteredRows.filter((r) => selectedRows.has(r.key)),
    [filteredRows, selectedRows],
  );

  // ── Selection helpers ─────────────────────────────────────────────────────────

  function toggleRow(key: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (filteredRows.every((r) => selectedRows.has(r.key))) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRows.map((r) => r.key)));
    }
  }

  function clearSelection() {
    setSelectedRows(new Set());
  }

  const allSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedRows.has(r.key));
  const someSelected = filteredRows.some((r) => selectedRows.has(r.key));

  // Optimistic update after restock
  function handleRestockSuccess(
    productId: string,
    size: string,
    newStock: number,
  ) {
    setProducts((prev) =>
      prev.map((p) => {
        if (p._id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map((v) =>
            v.size === size ? { ...v, stock: newStock } : v,
          ),
        };
      }),
    );
    setRestockModal(null);
    // Also refresh stats
    if (stats) {
      fetchInventory();
    }
  }

  // ── Derived display values ────────────────────────────────────────────────────

  const adminFullName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName}`
    : '';
  const adminShortName = adminUser?.firstName ?? '';
  const adminRoleLabel =
    adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  if (authLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: '#0F0F0F' }}
      >
        <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      <AdminSidebar
        adminName={adminFullName}
        adminRole={adminRoleLabel}
        avatarUrl={adminUser?.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-55 flex flex-col min-h-screen">
        <AdminTopNav
          pageTitle="Inventory"
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-5">
            {/* ── Page Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    Inventory Overview
                  </h1>
                  {stats && (
                    <span
                      className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.28)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {products.length} Products · {stats.totalSkus} Variants
                    </span>
                  )}
                </div>
                <p
                  className="text-[0.54rem] tracking-[0.08em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Stock levels, movements, and restocking
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => fetchInventory()}
                  disabled={dataLoading}
                  className="flex items-center gap-1.5 h-8 px-3 text-[0.46rem] tracking-[0.12em] uppercase transition-colors"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <RefreshCw
                    size={10}
                    strokeWidth={1.8}
                    className={dataLoading ? 'animate-spin' : ''}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => exportCSV(filteredRows)}
                  className="flex items-center gap-1.5 h-8 px-3 text-[0.46rem] tracking-[0.12em] uppercase transition-colors"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <Download size={10} strokeWidth={1.8} /> Export CSV
                </button>
                <button
                  onClick={() => setAlertThreshOpen(true)}
                  className="flex items-center gap-1.5 h-8 px-3 text-[0.46rem] tracking-[0.12em] uppercase font-semibold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  <Bell size={10} strokeWidth={1.8} /> Alert Thresholds
                </button>
              </div>
            </div>

            {/* ── Stats Bar ────────────────────────────────────────────────────── */}
            {dataLoading && !stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse"
                    style={{
                      background: '#141414',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  {
                    label: 'Total SKUs',
                    value: fmt(stats.totalSkus),
                    sub: 'across all variants',
                    color: 'rgba(255,255,255,0.75)',
                    icon: Package,
                  },
                  {
                    label: 'Out of Stock',
                    value: fmt(stats.outOfStock),
                    sub: 'variants depleted',
                    color: '#ef4444',
                    icon: AlertTriangle,
                  },
                  {
                    label: 'Low Stock',
                    value: fmt(stats.lowStock),
                    sub: 'below threshold',
                    color: '#f59e0b',
                    icon: TrendingDown,
                  },
                  {
                    label: 'Well Stocked',
                    value: fmt(stats.wellStocked),
                    sub: 'above threshold',
                    color: '#22c55e',
                    icon: TrendingUp,
                  },
                  {
                    label: 'Stock Value',
                    value: fmtNGN(stats.stockValue),
                    sub: 'at cost price',
                    color: GOLD,
                    icon: BarChart2,
                  },
                  {
                    label: "Today's Moves",
                    value: fmt(stats.todayMovements),
                    sub: 'adjustments today',
                    color: 'rgba(255,255,255,0.55)',
                    icon: RefreshCw,
                  },
                ].map(({ label, value, sub, color, icon: Icon }) => (
                  <div
                    key={label}
                    className="px-4 py-3 space-y-2"
                    style={{
                      background: '#141414',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className="text-[0.42rem] tracking-[0.14em] uppercase"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {label}
                      </p>
                      <Icon
                        size={11}
                        strokeWidth={1.6}
                        style={{ color: 'rgba(255,255,255,0.14)' }}
                      />
                    </div>
                    <p
                      className="text-lg font-semibold leading-none"
                      style={{ color }}
                    >
                      {value}
                    </p>
                    <p
                      className="text-[0.40rem] tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.20)' }}
                    >
                      {sub}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* ── Critical Alerts (Out of Stock) ────────────────────────────── */}
            {outOfStockRows.length > 0 && (
              <div
                style={{
                  border: '1px solid rgba(239,68,68,0.25)',
                  background: 'rgba(239,68,68,0.04)',
                }}
              >
                <button
                  onClick={() => setOutCollapsed((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} style={{ color: '#ef4444' }} />
                    <span
                      className="text-[0.52rem] tracking-[0.14em] uppercase font-semibold"
                      style={{ color: '#ef4444' }}
                    >
                      Critical — Out of Stock
                    </span>
                    <span
                      className="flex items-center h-4 px-1.5 text-[0.40rem] tracking-wider font-semibold"
                      style={{
                        background: 'rgba(239,68,68,0.20)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.30)',
                      }}
                    >
                      {outOfStockRows.length}
                    </span>
                  </div>
                  {outCollapsed ? (
                    <ChevronDown
                      size={12}
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                    />
                  ) : (
                    <ChevronUp
                      size={12}
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {!outCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                        style={{ borderTop: '1px solid rgba(239,68,68,0.12)' }}
                      >
                        {outOfStockRows.map((r) => (
                          <div
                            key={r.key}
                            className="flex items-center justify-between px-3 py-2.5 mt-2"
                            style={{
                              background: 'rgba(0,0,0,0.30)',
                              border: '1px solid rgba(239,68,68,0.15)',
                            }}
                          >
                            <div>
                              <p
                                className="text-[0.52rem] tracking-[0.06em]"
                                style={{ color: 'rgba(255,255,255,0.70)' }}
                              >
                                {r.productName}
                              </p>
                              <p
                                className="text-[0.44rem] mt-0.5"
                                style={{ color: 'rgba(255,255,255,0.28)' }}
                              >
                                {r.size} · SKU: {r.sku || '—'}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setRestockModal({
                                  productId: r.productId,
                                  productName: r.productName,
                                  size: r.size,
                                  currentStock: r.stock,
                                })
                              }
                              className="flex items-center gap-1 px-2 py-1 text-[0.42rem] tracking-wider uppercase transition-all"
                              style={{
                                background: 'rgba(239,68,68,0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.25)',
                              }}
                            >
                              <Plus size={8} /> Restock
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Low Stock Warnings ────────────────────────────────────────── */}
            {lowStockRows.length > 0 && (
              <div
                style={{
                  border: '1px solid rgba(245,158,11,0.20)',
                  background: 'rgba(245,158,11,0.03)',
                }}
              >
                <button
                  onClick={() => setLowCollapsed((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                    <span
                      className="text-[0.52rem] tracking-[0.14em] uppercase font-semibold"
                      style={{ color: '#f59e0b' }}
                    >
                      Low Stock Warnings
                    </span>
                    <span
                      className="flex items-center h-4 px-1.5 text-[0.40rem] tracking-wider font-semibold"
                      style={{
                        background: 'rgba(245,158,11,0.18)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245,158,11,0.28)',
                      }}
                    >
                      {lowStockRows.length}
                    </span>
                  </div>
                  {lowCollapsed ? (
                    <ChevronDown
                      size={12}
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                    />
                  ) : (
                    <ChevronUp
                      size={12}
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {!lowCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{ borderTop: '1px solid rgba(245,158,11,0.10)' }}
                      >
                        {lowStockRows.map((r) => (
                          <div
                            key={r.key}
                            className="flex items-center justify-between px-5 py-3"
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {r.productImage ? (
                                <Image
                                  src={r.productImage}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                  style={{
                                    border: '1px solid rgba(255,255,255,0.07)',
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 flex items-center justify-center"
                                  style={{
                                    background: 'rgba(255,255,255,0.04)',
                                  }}
                                >
                                  <Package
                                    size={12}
                                    style={{ color: 'rgba(255,255,255,0.20)' }}
                                  />
                                </div>
                              )}
                              <div>
                                <p
                                  className="text-[0.52rem] tracking-[0.06em]"
                                  style={{ color: 'rgba(255,255,255,0.70)' }}
                                >
                                  {r.productName}
                                </p>
                                <p
                                  className="text-[0.44rem] mt-0.5"
                                  style={{ color: 'rgba(255,255,255,0.28)' }}
                                >
                                  {r.size}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Stock bar */}
                              <div className="hidden sm:flex items-center gap-2">
                                <div
                                  className="w-24 h-1.5 overflow-hidden"
                                  style={{
                                    background: 'rgba(255,255,255,0.06)',
                                  }}
                                >
                                  <div
                                    className="h-full transition-all"
                                    style={{
                                      width: `${Math.min(100, Math.round((r.stock / Math.max(r.lowStockThreshold, r.stock)) * 100))}%`,
                                      background: stockColor(
                                        r.stock,
                                        r.lowStockThreshold,
                                      ),
                                      opacity: 0.7,
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-[0.46rem]"
                                  style={{ color: '#f59e0b' }}
                                >
                                  {r.stock} / {r.lowStockThreshold}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setRestockModal({
                                    productId: r.productId,
                                    productName: r.productName,
                                    size: r.size,
                                    currentStock: r.stock,
                                  })
                                }
                                className="flex items-center gap-1 px-2 py-1 text-[0.42rem] tracking-wider uppercase transition-all"
                                style={{
                                  background: 'rgba(245,158,11,0.12)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245,158,11,0.22)',
                                }}
                              >
                                <Plus size={8} /> Restock
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Stock Movement Chart ──────────────────────────────────────── */}
            <div
              style={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2">
                  <BarChart2
                    size={13}
                    strokeWidth={1.6}
                    style={{ color: GOLD }}
                  />
                  <p
                    className="text-[0.52rem] tracking-[0.14em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.70)' }}
                  >
                    Stock Movements
                  </p>
                </div>
                <div
                  className="flex"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {([7, 30, 90] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className="px-3 py-1 text-[0.44rem] tracking-[0.10em] uppercase transition-all"
                      style={{
                        background:
                          chartPeriod === p
                            ? 'rgba(180,130,60,0.14)'
                            : 'transparent',
                        color:
                          chartPeriod === p ? GOLD : 'rgba(255,255,255,0.30)',
                        borderRight:
                          p !== 90
                            ? '1px solid rgba(255,255,255,0.08)'
                            : undefined,
                      }}
                    >
                      {p}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4">
                <StockChart data={chartData} period={chartPeriod} />
              </div>
            </div>

            {/* ── Top Movers + Dead Stock ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Movers */}
              <div
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <TrendingUp
                    size={12}
                    strokeWidth={1.6}
                    style={{ color: '#22c55e' }}
                  />
                  <p
                    className="text-[0.50rem] tracking-[0.14em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.60)' }}
                  >
                    Top Movers (30d)
                  </p>
                </div>
                {topMovers.length === 0 ? (
                  <p
                    className="px-5 py-6 text-[0.48rem] tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.20)' }}
                  >
                    No movement data yet.
                  </p>
                ) : (
                  <div>
                    {topMovers.map((r, i) => (
                      <div
                        key={r.key}
                        className="flex items-center justify-between px-5 py-2.5"
                        style={{
                          borderBottom:
                            i < topMovers.length - 1
                              ? '1px solid rgba(255,255,255,0.04)'
                              : undefined,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[0.44rem] w-4 text-center"
                            style={{ color: 'rgba(255,255,255,0.20)' }}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p
                              className="text-[0.50rem] tracking-[0.06em]"
                              style={{ color: 'rgba(255,255,255,0.70)' }}
                            >
                              {r.productName}
                            </p>
                            <p
                              className="text-[0.42rem] mt-0.5"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              {r.size}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-[0.54rem] font-semibold"
                            style={{ color: '#22c55e' }}
                          >
                            {r.velocity}/day
                          </p>
                          <p
                            className="text-[0.42rem]"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                          >
                            {r.unitsSold} sold
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dead Stock */}
              <div
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <TrendingDown
                    size={12}
                    strokeWidth={1.6}
                    style={{ color: 'rgba(255,255,255,0.30)' }}
                  />
                  <p
                    className="text-[0.50rem] tracking-[0.14em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.60)' }}
                  >
                    Slow / Dead Stock
                  </p>
                </div>
                {deadStock.length === 0 ? (
                  <p
                    className="px-5 py-6 text-[0.48rem] tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.20)' }}
                  >
                    All variants have had recent movement.
                  </p>
                ) : (
                  <div>
                    {deadStock.map((r, i) => (
                      <div
                        key={r.key}
                        className="flex items-center justify-between px-5 py-2.5"
                        style={{
                          borderBottom:
                            i < deadStock.length - 1
                              ? '1px solid rgba(255,255,255,0.04)'
                              : undefined,
                        }}
                      >
                        <div>
                          <p
                            className="text-[0.50rem] tracking-[0.06em]"
                            style={{ color: 'rgba(255,255,255,0.55)' }}
                          >
                            {r.productName}
                          </p>
                          <p
                            className="text-[0.42rem] mt-0.5"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                          >
                            {r.size} · {r.stock} in stock
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-[0.48rem]"
                            style={{ color: 'rgba(255,255,255,0.30)' }}
                          >
                            0 sold (30d)
                          </p>
                          <p
                            className="text-[0.42rem] mt-0.5"
                            style={{ color: 'rgba(255,255,255,0.20)' }}
                          >
                            Last: {relativeDate(r.lastSold)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Search + Filters ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative max-w-sm">
                <Search
                  size={12}
                  strokeWidth={1.8}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product, SKU, or size…"
                  className="w-full pl-8 pr-8 py-2 text-[0.52rem] tracking-wider outline-none"
                  style={{
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Filter row */}
              <div className="flex flex-wrap gap-2 items-center">
                <Filter
                  size={10}
                  strokeWidth={1.8}
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                />

                {/* Stock status */}
                {(['all', 'out', 'low', 'well'] as StockFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStockStatus(s)}
                    className="h-7 px-3 text-[0.44rem] tracking-[0.12em] uppercase transition-all"
                    style={{
                      background:
                        filterStockStatus === s
                          ? 'rgba(180,130,60,0.12)'
                          : 'transparent',
                      color:
                        filterStockStatus === s
                          ? GOLD
                          : 'rgba(255,255,255,0.30)',
                      border: `1px solid ${filterStockStatus === s ? 'rgba(180,130,60,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {s === 'all'
                      ? 'All'
                      : s === 'out'
                        ? 'Out of Stock'
                        : s === 'low'
                          ? 'Low Stock'
                          : 'Well Stocked'}
                  </button>
                ))}

                <div
                  className="h-4 w-px"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />

                {/* Category */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-7 px-2 text-[0.44rem] tracking-wider uppercase outline-none"
                  style={{
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Variant size */}
                <select
                  value={filterVariantSize}
                  onChange={(e) => setFilterVariantSize(e.target.value)}
                  className="h-7 px-2 text-[0.44rem] tracking-wider uppercase outline-none"
                  style={{
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <option value="all">All Sizes</option>
                  {variantSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {/* Product status */}
                <select
                  value={filterProductStatus}
                  onChange={(e) =>
                    setFilterProductStatus(
                      e.target.value as typeof filterProductStatus,
                    )
                  }
                  className="h-7 px-2 text-[0.44rem] tracking-wider uppercase outline-none"
                  style={{
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>

                <div
                  className="h-4 w-px"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="h-7 px-2 text-[0.44rem] tracking-wider uppercase outline-none"
                  style={{
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <option value="name">Name A–Z</option>
                  <option value="stock-asc">Stock: Low–High</option>
                  <option value="stock-desc">Stock: High–Low</option>
                  <option value="value-desc">Value: High–Low</option>
                  <option value="velocity-desc">Velocity: Fast–Slow</option>
                  <option value="daysLeft-asc">Days Left: Urgent first</option>
                </select>

                {/* Results count */}
                <span
                  className="ml-auto text-[0.44rem] tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  {filteredRows.length} row
                  {filteredRows.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* ── Bulk Actions Bar ──────────────────────────────────────────── */}
            <AnimatePresence>
              {someSelected && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between px-4 py-2.5 flex-wrap gap-2"
                  style={{
                    background: 'rgba(180,130,60,0.08)',
                    border: '1px solid rgba(180,130,60,0.20)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare size={11} style={{ color: GOLD }} />
                    <span
                      className="text-[0.48rem] tracking-[0.10em]"
                      style={{ color: GOLD }}
                    >
                      {selectedRows.size} variant
                      {selectedRows.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBulkRestockOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[0.44rem] tracking-[0.12em] uppercase font-semibold"
                      style={{
                        background: 'rgba(180,130,60,0.16)',
                        color: GOLD,
                        border: '1px solid rgba(180,130,60,0.30)',
                      }}
                    >
                      <Package size={9} /> Bulk Restock
                    </button>
                    <button
                      onClick={() => exportCSV(selectedBulkRows)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[0.44rem] tracking-[0.12em] uppercase"
                      style={{
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.40)',
                      }}
                    >
                      <Download size={9} /> Export
                    </button>
                    <button
                      onClick={clearSelection}
                      className="flex items-center gap-1 px-2 py-1.5 text-[0.44rem] tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      <X size={9} /> Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Inventory Table ───────────────────────────────────────────── */}
            <div
              style={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {dataLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2
                    size={20}
                    className="animate-spin"
                    style={{ color: GOLD }}
                  />
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Package
                    size={28}
                    strokeWidth={1.2}
                    style={{ color: 'rgba(255,255,255,0.12)' }}
                  />
                  <p
                    className="text-[0.52rem] tracking-[0.12em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.20)' }}
                  >
                    No variants match your filters
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-[0.48rem] tracking-wider"
                    style={{ borderCollapse: 'separate', borderSpacing: 0 }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {/* Checkbox */}
                        <th className="pl-4 pr-2 py-3 w-8">
                          <button
                            onClick={toggleAll}
                            style={{
                              color: someSelected
                                ? GOLD
                                : 'rgba(255,255,255,0.20)',
                            }}
                          >
                            {allSelected ? (
                              <CheckSquare size={12} strokeWidth={1.8} />
                            ) : (
                              <Square size={12} strokeWidth={1.8} />
                            )}
                          </button>
                        </th>
                        {[
                          { label: 'Product', sortable: false },
                          { label: 'Category', sortable: false },
                          { label: 'Size', sortable: false },
                          { label: 'SKU', sortable: false },
                          { label: 'Stock', sortable: true, key: 'stock' },
                          { label: 'Threshold', sortable: false },
                          { label: 'Level', sortable: false },
                          { label: 'Cost', sortable: false },
                          { label: 'Value', sortable: true, key: 'value' },
                          { label: 'Sold 30d', sortable: false },
                          { label: '/day', sortable: true, key: 'velocity' },
                          {
                            label: 'Days Left',
                            sortable: true,
                            key: 'daysLeft',
                          },
                          { label: 'Restocked', sortable: false },
                          { label: 'Last Sold', sortable: false },
                          { label: '', sortable: false },
                        ].map(({ label, sortable, key }) => (
                          <th
                            key={label || 'actions'}
                            onClick={
                              sortable
                                ? () => {
                                    const k = key as string;
                                    if (k === 'stock')
                                      setSortBy(
                                        sortBy === 'stock-asc'
                                          ? 'stock-desc'
                                          : 'stock-asc',
                                      );
                                    if (k === 'value') setSortBy('value-desc');
                                    if (k === 'velocity')
                                      setSortBy('velocity-desc');
                                    if (k === 'daysLeft')
                                      setSortBy('daysLeft-asc');
                                  }
                                : undefined
                            }
                            className={`px-3 py-3 text-left font-normal uppercase tracking-[0.12em] whitespace-nowrap${sortable ? ' cursor-pointer' : ''}`}
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                          >
                            <span className="flex items-center gap-1">
                              {label}
                              {sortable && (
                                <ArrowDown
                                  size={8}
                                  strokeWidth={1.6}
                                  style={{ opacity: 0.4 }}
                                />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, idx) => {
                        const isSelected = selectedRows.has(row.key);
                        const color = stockColor(
                          row.stock,
                          row.lowStockThreshold,
                        );
                        const barPct =
                          row.lowStockThreshold > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (row.stock / (row.lowStockThreshold * 3)) *
                                    100,
                                ),
                              )
                            : row.stock > 0
                              ? 100
                              : 0;
                        return (
                          <tr
                            key={row.key}
                            style={{
                              borderBottom:
                                idx < filteredRows.length - 1
                                  ? '1px solid rgba(255,255,255,0.04)'
                                  : undefined,
                              background: isSelected
                                ? 'rgba(180,130,60,0.05)'
                                : 'transparent',
                            }}
                          >
                            {/* Checkbox */}
                            <td className="pl-4 pr-2 py-3">
                              <button
                                onClick={() => toggleRow(row.key)}
                                style={{
                                  color: isSelected
                                    ? GOLD
                                    : 'rgba(255,255,255,0.18)',
                                }}
                              >
                                {isSelected ? (
                                  <CheckSquare size={11} strokeWidth={1.8} />
                                ) : (
                                  <Square size={11} strokeWidth={1.8} />
                                )}
                              </button>
                            </td>

                            {/* Product */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5 min-w-[140px]">
                                {row.productImage ? (
                                  <Image
                                    src={row.productImage}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="object-cover shrink-0"
                                    style={{
                                      border:
                                        '1px solid rgba(255,255,255,0.07)',
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center"
                                    style={{
                                      background: 'rgba(255,255,255,0.04)',
                                      border:
                                        '1px solid rgba(255,255,255,0.06)',
                                    }}
                                  >
                                    <Package
                                      size={10}
                                      style={{
                                        color: 'rgba(255,255,255,0.18)',
                                      }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <p
                                    className="text-[0.52rem] tracking-[0.04em] leading-tight"
                                    style={{ color: 'rgba(255,255,255,0.75)' }}
                                  >
                                    {row.productName}
                                  </p>
                                  <span
                                    className="inline-flex mt-0.5 px-1 text-[0.38rem] tracking-widest uppercase"
                                    style={{
                                      background:
                                        row.productStatus === 'published'
                                          ? 'rgba(34,197,94,0.10)'
                                          : row.productStatus === 'draft'
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'rgba(239,68,68,0.10)',
                                      color:
                                        row.productStatus === 'published'
                                          ? '#22c55e'
                                          : row.productStatus === 'draft'
                                            ? 'rgba(255,255,255,0.30)'
                                            : '#ef4444',
                                    }}
                                  >
                                    {row.productStatus}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td
                              className="px-3 py-3 whitespace-nowrap"
                              style={{ color: 'rgba(255,255,255,0.35)' }}
                            >
                              {row.productCategory}
                            </td>

                            {/* Size */}
                            <td
                              className="px-3 py-3 whitespace-nowrap font-medium"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                              {row.size}
                            </td>

                            {/* SKU */}
                            <td
                              className="px-3 py-3 whitespace-nowrap font-mono"
                              style={{
                                color: 'rgba(255,255,255,0.28)',
                                fontSize: '0.48rem',
                              }}
                            >
                              {row.sku || '—'}
                            </td>

                            {/* Stock */}
                            <td className="px-3 py-3">
                              <span
                                className="font-semibold text-[0.60rem]"
                                style={{ color }}
                              >
                                {row.stock}
                              </span>
                              <span
                                className="ml-1.5 px-1 text-[0.38rem] tracking-widest uppercase"
                                style={{
                                  background: `${color}18`,
                                  color,
                                }}
                              >
                                {stockLabel(row.stock, row.lowStockThreshold)}
                              </span>
                            </td>

                            {/* Threshold */}
                            <td
                              className="px-3 py-3 text-center"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              {row.lowStockThreshold}
                            </td>

                            {/* Stock bar */}
                            <td className="px-3 py-3">
                              <div
                                className="w-16 h-1 overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.06)' }}
                              >
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${barPct}%`,
                                    background: color,
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                            </td>

                            {/* Cost */}
                            <td
                              className="px-3 py-3 whitespace-nowrap"
                              style={{ color: 'rgba(255,255,255,0.35)' }}
                            >
                              {row.costPrice > 0 ? fmtNGN(row.costPrice) : '—'}
                            </td>

                            {/* Stock value */}
                            <td
                              className="px-3 py-3 whitespace-nowrap font-semibold"
                              style={{
                                color:
                                  row.stockValue > 0
                                    ? GOLD
                                    : 'rgba(255,255,255,0.18)',
                              }}
                            >
                              {row.stockValue > 0
                                ? fmtNGN(row.stockValue)
                                : '—'}
                            </td>

                            {/* Units sold */}
                            <td
                              className="px-3 py-3 text-center"
                              style={{ color: 'rgba(255,255,255,0.45)' }}
                            >
                              {row.unitsSold > 0 ? (
                                row.unitsSold
                              ) : (
                                <span
                                  style={{ color: 'rgba(255,255,255,0.18)' }}
                                >
                                  0
                                </span>
                              )}
                            </td>

                            {/* Velocity */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              {row.velocity > 0 ? (
                                <span
                                  className="flex items-center gap-0.5"
                                  style={{ color: '#22c55e' }}
                                >
                                  <ArrowUp size={8} strokeWidth={2} />
                                  {row.velocity}
                                </span>
                              ) : (
                                <span
                                  style={{ color: 'rgba(255,255,255,0.18)' }}
                                >
                                  —
                                </span>
                              )}
                            </td>

                            {/* Days left */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span
                                style={{
                                  color:
                                    row.stock === 0
                                      ? '#ef4444'
                                      : row.daysLeft < 7
                                        ? '#ef4444'
                                        : row.daysLeft < 30
                                          ? '#f59e0b'
                                          : row.daysLeft >= 9999
                                            ? 'rgba(255,255,255,0.25)'
                                            : '#22c55e',
                                  fontWeight:
                                    row.daysLeft < 7 ? 600 : undefined,
                                }}
                              >
                                {daysLeftLabel(row.daysLeft, row.stock)}
                              </span>
                            </td>

                            {/* Last restocked */}
                            <td
                              className="px-3 py-3 whitespace-nowrap"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              {relativeDate(row.lastRestocked)}
                            </td>

                            {/* Last sold */}
                            <td
                              className="px-3 py-3 whitespace-nowrap"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              {relativeDate(row.lastSold)}
                            </td>

                            {/* Actions */}
                            <td className="pl-2 pr-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    setRestockModal({
                                      productId: row.productId,
                                      productName: row.productName,
                                      size: row.size,
                                      currentStock: row.stock,
                                    })
                                  }
                                  title="Restock"
                                  className="flex items-center justify-center w-6 h-6 transition-all"
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.28)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = GOLD;
                                    e.currentTarget.style.borderColor =
                                      'rgba(180,130,60,0.30)';
                                    e.currentTarget.style.background =
                                      'rgba(180,130,60,0.08)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color =
                                      'rgba(255,255,255,0.28)';
                                    e.currentTarget.style.borderColor =
                                      'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.background =
                                      'transparent';
                                  }}
                                >
                                  <Plus size={10} strokeWidth={1.8} />
                                </button>
                                <Link
                                  href={`/admin/inventory/${row.productId}`}
                                  title="View product"
                                  className="flex items-center justify-center w-6 h-6 transition-all"
                                  style={{
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.28)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color =
                                      'rgba(255,255,255,0.72)';
                                    e.currentTarget.style.background =
                                      'rgba(255,255,255,0.04)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color =
                                      'rgba(255,255,255,0.28)';
                                    e.currentTarget.style.background =
                                      'transparent';
                                  }}
                                >
                                  <Eye size={10} strokeWidth={1.8} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}

      <AnimatePresence>
        {restockModal && (
          <RestockModal
            key="restock"
            productId={restockModal.productId}
            productName={restockModal.productName}
            size={restockModal.size}
            currentStock={restockModal.currentStock}
            onClose={() => setRestockModal(null)}
            onSuccess={handleRestockSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkRestockOpen && (
          <BulkRestockModal
            key="bulk-restock"
            rows={selectedBulkRows}
            onClose={() => setBulkRestockOpen(false)}
            onSuccess={() => {
              setBulkRestockOpen(false);
              clearSelection();
              fetchInventory();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alertThreshOpen && (
          <AlertThresholdsModal
            key="alert-thresh"
            products={products}
            onClose={() => setAlertThreshOpen(false)}
            onSaved={() => {
              setAlertThreshOpen(false);
              fetchInventory();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
