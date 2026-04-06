'use client';

import { useState, useEffect, useCallback, useMemo, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Edit,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Minus,
  Settings,
  TrendingUp,
  TrendingDown,
  BarChart2,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Filter,
  Calendar,
  Bell,
  Save,
  ExternalLink,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import Image from 'next/image';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const VARIANT_COLORS = [
  GOLD,
  '#22c55e',
  '#60a5fa',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductVariant {
  size: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  barcode?: string;
}

interface ProductImage {
  url: string;
  publicId: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fragranceFamilies: string[];
  concentration: string;
  gender: string;
  images: ProductImage[];
  variants: ProductVariant[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  createdBy: string;
}

interface VariantStat {
  size: string;
  unitsSoldAllTime: number;
  revenueAllTime: number;
  unitsSold30d: number;
  velocity: number;
  daysLeft: number;
  lastRestocked: {
    date: string;
    qty: number;
    previousStock: number;
    newStock: number;
    by: string;
  } | null;
  lastSold: string | null;
}

interface ProductStats {
  totalStock: number;
  totalUnitsSoldAllTime: number;
  totalUnitsSold30d: number;
  totalRevenueAllTime: number;
  totalStockValue: number;
  avgDailySales: number;
  wishlisted: number;
  createdByName: string;
}

interface ChartDataPoint {
  date: string;
  byVariant: Record<string, { units: number; revenue: number }>;
}

interface Adjustment {
  _id: string;
  variantSize: string;
  variantSku: string;
  type: 'add' | 'remove' | 'set';
  adjustment: number;
  previousStock: number;
  newStock: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
  orderRef: string | null;
}

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNGN(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;
}

function relDate(iso: string | null): string {
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

function stockLabel(
  stock: number,
  threshold: number,
): 'Out of Stock' | 'Low Stock' | 'In Stock' {
  if (stock === 0) return 'Out of Stock';
  if (stock <= threshold) return 'Low Stock';
  return 'In Stock';
}

function margin(price: number, cost: number | undefined): string {
  if (!cost || cost === 0 || price === 0) return '—';
  return `${Math.round(((price - cost) / price) * 100)}%`;
}

function daysLeft(days: number, stock: number): string {
  if (stock === 0) return 'Out';
  if (days >= 9999) return '∞';
  return `~${days}d`;
}

function movementTypeLabel(
  type: 'add' | 'remove' | 'set',
  reason: string,
): string {
  if (type === 'add') return 'Restock';
  if (type === 'set') return 'Manual Adjustment';
  // remove — guess from reason
  if (/write.?off|damage|lost|stolen/i.test(reason)) return 'Write-off';
  if (/return/i.test(reason)) return 'Return';
  if (/ORD-/i.test(reason)) return 'Sale Deduction';
  return 'Manual Adjustment';
}

function movementTypeColor(
  type: 'add' | 'remove' | 'set',
  reason: string,
): string {
  const label = movementTypeLabel(type, reason);
  if (label === 'Restock') return '#22c55e';
  if (label === 'Sale Deduction') return '#ef4444';
  if (label === 'Write-off') return 'rgba(255,255,255,0.30)';
  if (label === 'Return') return '#f59e0b';
  return '#60a5fa';
}

function exportAdjCSV(items: Adjustment[]) {
  const headers = [
    'Date',
    'Variant',
    'Type',
    'Change',
    'Prev Stock',
    'New Stock',
    'Reference',
    'By',
    'Reason',
  ];
  const rows = items.map((a) => [
    fmtDateTime(a.createdAt),
    a.variantSize,
    movementTypeLabel(a.type, a.reason),
    a.type === 'add'
      ? `+${a.adjustment}`
      : a.type === 'set'
        ? a.newStock
        : `-${a.adjustment}`,
    a.previousStock,
    a.newStock,
    a.orderRef ?? '',
    a.adjustedBy,
    `"${a.reason}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `adjustments-${Date.now()}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ── SKU Copyable ───────────────────────────────────────────────────────────────

function CopySku({ sku }: { sku: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(sku).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  if (!sku) return <span style={{ color: 'rgba(255,255,255,0.20)' }}>—</span>;
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 group"
      title="Copy SKU"
    >
      <span
        className="font-mono text-[0.46rem]"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {sku}
      </span>
      {copied ? (
        <Check size={9} style={{ color: '#22c55e' }} />
      ) : (
        <Copy
          size={9}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        />
      )}
    </button>
  );
}

// ── Restock Modal ──────────────────────────────────────────────────────────────

function RestockModal({
  productId,
  productName,
  variants,
  defaultSize,
  onClose,
  onSuccess,
}: {
  productId: string;
  productName: string;
  variants: ProductVariant[];
  defaultSize: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [size, setSize] = useState(defaultSize || variants[0]?.size || '');
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const variant = variants.find((v) => v.size === size);
  const current = variant?.stock ?? 0;
  const numQty = parseInt(qty, 10);
  const isValid = !isNaN(numQty) && numQty >= 0;
  const newStock = isValid
    ? mode === 'add'
      ? current + numQty
      : numQty
    : null;

  async function submit() {
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
      onSuccess();
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
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-[0.48rem] tracking-[0.18em] uppercase mb-1"
              style={{ color: GOLD }}
            >
              Restock
            </p>
            <h2
              className="text-[0.68rem] tracking-[0.10em] font-semibold"
              style={{ color: 'rgba(255,255,255,0.88)' }}
            >
              {productName}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.30)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Variant select */}
        <div className="space-y-1.5">
          <label
            className="text-[0.44rem] tracking-[0.12em] uppercase"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Variant
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none"
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.80)',
            }}
          >
            {variants.map((v) => (
              <option key={v.size} value={v.size}>
                {v.size} — Current: {v.stock}
              </option>
            ))}
          </select>
        </div>

        {/* Mode toggle */}
        <div
          className="flex"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['add', 'set'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-1.5 text-[0.46rem] tracking-[0.14em] uppercase font-semibold transition-all"
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
            className="w-full px-3 py-2 text-sm outline-none"
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
                style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.54rem' }}
              >
                {current}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
              <span
                className="text-[0.64rem] font-semibold"
                style={{
                  color: variant
                    ? stockColor(newStock, variant.lowStockThreshold)
                    : '#22c55e',
                }}
              >
                {newStock}
              </span>
              {newStock !== current && (
                <span
                  style={{
                    color: newStock > current ? '#22c55e' : '#ef4444',
                    fontSize: '0.44rem',
                  }}
                >
                  ({newStock > current ? '+' : ''}
                  {newStock - current})
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
            Reason / Source (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Supplier Lagos Batch #42"
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
            className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase"
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.40)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!isValid || loading}
            className="flex-1 py-2 text-[0.46rem] tracking-[0.14em] uppercase font-semibold flex items-center justify-center gap-1.5"
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

// ── Sales Performance Chart ────────────────────────────────────────────────────

function SalesChart({
  data,
  variantSizes,
  period,
  metric,
}: {
  data: ChartDataPoint[];
  variantSizes: string[];
  period: 7 | 30 | 90 | 'all';
  metric: 'units' | 'revenue';
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const slice = useMemo(() => {
    if (period === 'all') return data;
    const cutoff = new Date(Date.now() - (period as number) * 86400000)
      .toISOString()
      .split('T')[0];
    return data.filter((d) => d.date >= cutoff);
  }, [data, period]);

  if (slice.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-40 gap-2"
        style={{ color: 'rgba(255,255,255,0.18)' }}
      >
        <BarChart2 size={28} strokeWidth={1.2} />
        <span className="text-[0.46rem] tracking-widest uppercase">
          No sales data for this period
        </span>
      </div>
    );
  }

  const W = 680;
  const H = 160;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 10;
  const PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Compute max value
  const maxVal = Math.max(
    1,
    ...slice.flatMap((d) =>
      variantSizes.map((s) => {
        const vd = d.byVariant[s];
        return vd ? (metric === 'units' ? vd.units : vd.revenue) : 0;
      }),
    ),
  );

  // X positions
  const xScale = (i: number) =>
    PAD_L + (i / Math.max(slice.length - 1, 1)) * chartW;
  const yScale = (val: number) => PAD_T + chartH - (val / maxVal) * chartH;

  // Build path strings per variant
  function buildPath(size: string): string {
    const pts = slice.map((d, i) => {
      const vd = d.byVariant[size];
      const val = vd ? (metric === 'units' ? vd.units : vd.revenue) : 0;
      return `${xScale(i).toFixed(1)},${yScale(val).toFixed(1)}`;
    });
    return `M ${pts.join(' L ')}`;
  }

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: yScale(f * maxVal),
    val: f * maxVal,
  }));

  // X-axis labels (every N points)
  const xStep = Math.max(1, Math.floor(slice.length / 6));
  const xLabels = slice
    .map((d, i) => ({ i, date: d.date }))
    .filter((_, i) => i % xStep === 0 || i === slice.length - 1);

  const hovered = hoveredIdx !== null ? slice[hoveredIdx] : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        onMouseLeave={() => setHoveredIdx(null)}
        style={{ overflow: 'visible' }}
      >
        {/* Gridlines */}
        {yTicks.map((t) => (
          <g key={t.y}>
            <line
              x1={PAD_L}
              y1={t.y}
              x2={W - PAD_R}
              y2={t.y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 4}
              y={t.y + 3}
              textAnchor="end"
              fontSize={7}
              fill="rgba(255,255,255,0.22)"
            >
              {metric === 'revenue' ? fmtNGN(t.val) : Math.round(t.val)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map(({ i, date }) => (
          <text
            key={date}
            x={xScale(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize={7}
            fill="rgba(255,255,255,0.22)"
          >
            {date.slice(5)}
          </text>
        ))}

        {/* Lines per variant */}
        {variantSizes.map((size, ci) => (
          <path
            key={size}
            d={buildPath(size)}
            fill="none"
            stroke={VARIANT_COLORS[ci % VARIANT_COLORS.length]}
            strokeWidth={1.5}
            strokeOpacity={0.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Data points + hover detection */}
        {slice.map((d, i) => (
          <rect
            key={d.date}
            x={xScale(i) - 8}
            y={PAD_T}
            width={16}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoveredIdx(i)}
          />
        ))}

        {/* Hover line */}
        {hoveredIdx !== null && (
          <line
            x1={xScale(hoveredIdx)}
            y1={PAD_T}
            x2={xScale(hoveredIdx)}
            y2={PAD_T + chartH}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        )}

        {/* Dots on hover */}
        {hoveredIdx !== null &&
          variantSizes.map((size, ci) => {
            const vd = slice[hoveredIdx]?.byVariant[size];
            const val = vd ? (metric === 'units' ? vd.units : vd.revenue) : 0;
            return (
              <circle
                key={size}
                cx={xScale(hoveredIdx)}
                cy={yScale(val)}
                r={3}
                fill={VARIANT_COLORS[ci % VARIANT_COLORS.length]}
              />
            );
          })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="mx-auto mt-2 flex flex-wrap gap-3 justify-center px-3 py-2"
          style={{
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: 400,
          }}
        >
          <span
            className="text-[0.46rem] tracking-wider"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {hovered.date}
          </span>
          {variantSizes.map((size, ci) => {
            const vd = hovered.byVariant[size];
            const val = vd ? (metric === 'units' ? vd.units : vd.revenue) : 0;
            return (
              <span key={size} className="text-[0.46rem] tracking-wider">
                <span
                  style={{ color: VARIANT_COLORS[ci % VARIANT_COLORS.length] }}
                >
                  ●
                </span>{' '}
                {size}:{' '}
                <span style={{ color: 'rgba(255,255,255,0.70)' }}>
                  {metric === 'revenue' ? fmtNGN(val) : val}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 px-1">
        {variantSizes.map((size, ci) => (
          <div key={size} className="flex items-center gap-1.5">
            <div
              className="w-3 h-0.5 rounded"
              style={{ background: VARIANT_COLORS[ci % VARIANT_COLORS.length] }}
            />
            <span
              className="text-[0.44rem] tracking-wider"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {size}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section Card wrapper ───────────────────────────────────────────────────────

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
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
        <h2
          className="text-[0.56rem] tracking-[0.18em] uppercase font-semibold"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProductInventoryDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const router = useRouter();
  // console.log(productId, 'product Id');
  // Auth
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Main data
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [variantStats, setVariantStats] = useState<VariantStat[]>([]);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Adjustments
  const [adjItems, setAdjItems] = useState<Adjustment[]>([]);
  const [adjTotal, setAdjTotal] = useState(0);
  const [adjPage, setAdjPage] = useState(1);
  const [adjTotalPages, setAdjTotalPages] = useState(1);
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjType, setAdjType] = useState('');
  const [adjVariant, setAdjVariant] = useState('');
  const [adjFrom, setAdjFrom] = useState('');
  const [adjTo, setAdjTo] = useState('');

  // Chart
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90 | 'all'>(30);
  const [chartMetric, setChartMetric] = useState<'units' | 'revenue'>('units');

  // Restock modal
  const [restockModal, setRestockModal] = useState<{
    open: boolean;
    defaultSize: string;
  }>({ open: false, defaultSize: '' });

  // Manual adjustment form
  const [adjFormVariant, setAdjFormVariant] = useState('');
  const [adjFormType, setAdjFormType] = useState<
    'add' | 'remove' | 'set' | 'writeoff'
  >('remove');
  const [adjFormQty, setAdjFormQty] = useState('');
  const [adjFormReason, setAdjFormReason] = useState('');
  const [adjFormReasonOther, setAdjFormReasonOther] = useState('');
  const [adjFormNote, setAdjFormNote] = useState('');
  const [adjFormLoading, setAdjFormLoading] = useState(false);
  const [adjFormError, setAdjFormError] = useState('');
  const [adjFormSuccess, setAdjFormSuccess] = useState('');

  // Threshold settings
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [threshSaving, setThreshSaving] = useState(false);
  const [threshSaved, setThreshSaved] = useState(false);

  // Inline threshold editing
  const [editThresh, setEditThresh] = useState<string | null>(null); // variantSize

  // Restock history (subset of adjustments)
  const restockHistory = useMemo(
    () => adjItems.filter((a) => a.type === 'add'),
    [adjItems],
  );

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

  // ── Fetch main data ───────────────────────────────────────────────────────────

  const fetchMain = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}`);
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          product: Product;
          variantStats: VariantStat[];
          productStats: ProductStats;
          chartData: ChartDataPoint[];
        };
      };
      if (json.success && json.data) {
        setProduct(json.data.product);
        setVariantStats(json.data.variantStats);
        setProductStats(json.data.productStats);
        setChartData(json.data.chartData);
        // Init thresholds
        const t: Record<string, number> = {};
        for (const v of json.data.product.variants) {
          t[v.size] = v.lowStockThreshold;
          setAdjFormVariant(v.size); // default to first
        }
        setThresholds(t);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchMain();
  }, [fetchMain]);

  // ── Fetch adjustments ─────────────────────────────────────────────────────────

  const fetchAdj = useCallback(
    async (page: number) => {
      setAdjLoading(true);
      try {
        const sp = new URLSearchParams({ page: String(page), limit: '20' });
        if (adjType) sp.set('type', adjType);
        if (adjVariant) sp.set('variantSize', adjVariant);
        if (adjFrom) sp.set('from', adjFrom);
        if (adjTo) sp.set('to', adjTo);
        const res = await fetch(
          `/api/admin/inventory/${productId}/adjustments?${sp}`,
        );
        const json = (await res.json()) as {
          success?: boolean;
          data?: {
            items: Adjustment[];
            total: number;
            page: number;
            totalPages: number;
          };
        };
        if (json.success && json.data) {
          setAdjItems(
            page === 1
              ? json.data.items
              : (prev) => [...prev, ...json.data!.items],
          );
          setAdjTotal(json.data.total);
          setAdjPage(json.data.page);
          setAdjTotalPages(json.data.totalPages);
        }
      } catch {
        /* ignore */
      } finally {
        setAdjLoading(false);
      }
    },
    [productId, adjType, adjVariant, adjFrom, adjTo],
  );

  useEffect(() => {
    if (!loading) {
      setAdjItems([]);
      fetchAdj(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAdj, loading]);

  // ── Manual adjustment submit ──────────────────────────────────────────────────

  async function submitManualAdj() {
    const numQty = parseInt(adjFormQty, 10);
    if (isNaN(numQty) || numQty < 0) {
      setAdjFormError('Enter a valid quantity.');
      return;
    }
    const finalReason =
      adjFormReason === 'Other' ? adjFormReasonOther : adjFormReason;
    if (!finalReason.trim()) {
      setAdjFormError('Reason is required.');
      return;
    }

    const apiType: 'add' | 'remove' | 'set' =
      adjFormType === 'add'
        ? 'add'
        : adjFormType === 'set'
          ? 'set'
          : adjFormType === 'writeoff'
            ? 'remove'
            : 'remove';

    setAdjFormLoading(true);
    setAdjFormError('');
    setAdjFormSuccess('');
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/stock-adjustments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantSize: adjFormVariant,
            type: apiType,
            qty: numQty,
            reason: adjFormNote
              ? `${finalReason} — ${adjFormNote}`
              : finalReason,
          }),
        },
      );
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setAdjFormSuccess('Adjustment applied successfully.');
      setAdjFormQty('');
      setAdjFormNote('');
      setAdjFormReasonOther('');
      fetchMain();
      fetchAdj(1);
    } catch (e) {
      setAdjFormError(e instanceof Error ? e.message : 'Server error');
    } finally {
      setAdjFormLoading(false);
    }
  }

  // ── Save thresholds ───────────────────────────────────────────────────────────

  async function saveThresholds() {
    if (!product) return;
    setThreshSaving(true);
    const updatedVariants = product.variants.map((v) => ({
      ...v,
      lowStockThreshold: thresholds[v.size] ?? v.lowStockThreshold,
    }));
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: updatedVariants }),
      });
      if (res.ok) {
        setThreshSaved(true);
        setTimeout(() => setThreshSaved(false), 2000);
        fetchMain();
      }
    } catch {
      /* ignore */
    } finally {
      setThreshSaving(false);
      setEditThresh(null);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const adminFullName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName}`
    : '';
  const adminShortName = adminUser?.firstName ?? '';
  const adminRoleLabel =
    adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';
  const variantSizes = product?.variants.map((v) => v.size) ?? [];

  // Manual adjustment preview
  const adjPreviewVariant = product?.variants.find(
    (v) => v.size === adjFormVariant,
  );
  const adjNumQty = parseInt(adjFormQty, 10);
  const adjIsValidQty =
    !isNaN(adjNumQty) && adjNumQty >= 0 && adjPreviewVariant !== undefined;
  const adjPreviewNew = adjIsValidQty
    ? adjFormType === 'add'
      ? adjPreviewVariant!.stock + adjNumQty
      : adjFormType === 'set'
        ? adjNumQty
        : adjFormType === 'writeoff'
          ? Math.max(0, adjPreviewVariant!.stock - adjNumQty)
          : Math.max(0, adjPreviewVariant!.stock - adjNumQty)
    : null;
  const adjPreviewDelta =
    adjPreviewNew !== null
      ? adjPreviewNew - (adjPreviewVariant?.stock ?? 0)
      : null;

  // Stats for chart summary
  const bestVariant = useMemo(() => {
    if (!variantStats.length) return null;
    const totalAll = variantStats.reduce((s, v) => s + v.unitsSoldAllTime, 0);
    const best = variantStats.reduce((a, b) =>
      a.unitsSoldAllTime > b.unitsSoldAllTime ? a : b,
    );
    const pct =
      totalAll > 0 ? Math.round((best.unitsSoldAllTime / totalAll) * 100) : 0;
    return { size: best.size, pct };
  }, [variantStats]);

  const bestDay = useMemo(() => {
    if (!chartData.length) return null;
    let maxUnits = 0;
    let maxDate = '';
    for (const d of chartData) {
      const total = variantSizes.reduce(
        (s, sz) => s + (d.byVariant[sz]?.units ?? 0),
        0,
      );
      if (total > maxUnits) {
        maxUnits = total;
        maxDate = d.date;
      }
    }
    return maxUnits > 0 ? { date: maxDate, units: maxUnits } : null;
  }, [chartData, variantSizes]);

  if (authLoading || (loading && !product)) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: '#0F0F0F' }}
      >
        <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: '#0F0F0F' }}
      >
        <AlertTriangle size={32} style={{ color: '#ef4444' }} />
        <p style={{ color: 'rgba(255,255,255,0.50)' }}>Product not found</p>
        <Link
          href="/admin/inventory"
          className="text-[0.50rem] tracking-widest uppercase"
          style={{ color: GOLD }}
        >
          ← Back to Inventory
        </Link>
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
          pageTitle="Inventory Detail"
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-5">
            {/* ── Page Header ──────────────────────────────────────────────────── */}
            <div>
              {/* Back link */}
              <Link
                href="/admin/inventory"
                className="inline-flex items-center gap-1.5 mb-4 text-[0.46rem] tracking-[0.14em] uppercase transition-colors"
                style={{ color: 'rgba(255,255,255,0.30)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.30)';
                }}
              >
                <ArrowLeft size={10} strokeWidth={1.8} /> Inventory Overview
              </Link>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {product.images[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="object-cover flex-shrink-0"
                      style={{ border: '1px solid rgba(255,255,255,0.10)' }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 flex items-center justify-center flex-shrink-0"
                      style={{
                        background: '#1A1A1A',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Package
                        size={20}
                        style={{ color: 'rgba(255,255,255,0.20)' }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h1
                      className="text-xl font-bold tracking-tight leading-tight"
                      style={{ color: 'rgba(255,255,255,0.90)' }}
                    >
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status badge */}
                      <span
                        className="inline-flex items-center h-5 px-2 text-[0.42rem] tracking-[0.12em] uppercase font-semibold"
                        style={{
                          background:
                            product.status === 'published'
                              ? 'rgba(34,197,94,0.12)'
                              : product.status === 'draft'
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(239,68,68,0.10)',
                          color:
                            product.status === 'published'
                              ? '#22c55e'
                              : product.status === 'draft'
                                ? 'rgba(255,255,255,0.40)'
                                : '#ef4444',
                          border: `1px solid ${product.status === 'published' ? 'rgba(34,197,94,0.25)' : product.status === 'draft' ? 'rgba(255,255,255,0.10)' : 'rgba(239,68,68,0.20)'}`,
                        }}
                      >
                        {product.status}
                      </span>
                      {/* Category */}
                      {product.fragranceFamilies[0] && (
                        <span
                          className="inline-flex items-center h-5 px-2 text-[0.42rem] tracking-[0.10em] uppercase"
                          style={{
                            background: 'rgba(180,130,60,0.08)',
                            color: GOLD,
                            border: '1px solid rgba(180,130,60,0.20)',
                          }}
                        >
                          {product.fragranceFamilies[0]}
                        </span>
                      )}
                      {product.concentration && (
                        <span
                          className="text-[0.46rem] tracking-widest"
                          style={{ color: 'rgba(255,255,255,0.28)' }}
                        >
                          {product.concentration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => fetchMain()}
                    className="flex items-center gap-1.5 h-8 px-3 text-[0.44rem] tracking-[0.12em] uppercase transition-colors"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <RefreshCw
                      size={9}
                      className={loading ? 'animate-spin' : ''}
                    />{' '}
                    Refresh
                  </button>
                  <button
                    onClick={() =>
                      setRestockModal({
                        open: true,
                        defaultSize: variantSizes[0] ?? '',
                      })
                    }
                    className="flex items-center gap-1.5 h-8 px-3 text-[0.44rem] tracking-[0.12em] uppercase font-semibold transition-all"
                    style={{
                      background: 'rgba(180,130,60,0.12)',
                      border: '1px solid rgba(180,130,60,0.25)',
                      color: GOLD,
                    }}
                  >
                    <Plus size={9} /> Restock All Variants
                  </button>
                  <Link
                    href={`/admin/products/${product.slug}/edit`}
                    className="flex items-center gap-1.5 h-8 px-3 text-[0.44rem] tracking-[0.12em] uppercase transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <Edit size={9} /> Edit Product
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Stats Bar ────────────────────────────────────────────────────── */}
            {productStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  {
                    label: 'Total Stock',
                    value: `${productStats.totalStock} units`,
                    sub: 'Across All Variants',
                  },
                  {
                    label: 'Units Sold',
                    value: `${productStats.totalUnitsSoldAllTime} units`,
                    sub: 'All Time',
                  },
                  {
                    label: 'Units Sold (30d)',
                    value: `${productStats.totalUnitsSold30d} units`,
                    sub: 'Last 30 Days',
                  },
                  {
                    label: 'Revenue Generated',
                    value: fmtNGN(productStats.totalRevenueAllTime),
                    sub: 'All Time Revenue',
                  },
                  {
                    label: 'Stock Value',
                    value: fmtNGN(productStats.totalStockValue),
                    sub: 'At Cost Price',
                  },
                  {
                    label: 'Avg Daily Sales',
                    value: `~${productStats.avgDailySales} units`,
                    sub: 'Per Day (30d avg)',
                  },
                ].map(({ label, value, sub }) => (
                  <div
                    key={label}
                    className="px-4 py-3 space-y-1.5"
                    style={{
                      background: '#141414',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <p
                      className="text-[0.42rem] tracking-[0.14em] uppercase"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-base font-bold leading-none"
                      style={{ color: GOLD }}
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
            )}

            {/* ── Variants Stock Overview ───────────────────────────────────────── */}
            <SectionCard
              title="Stock by Variant"
              action={
                <button
                  onClick={() =>
                    setRestockModal({
                      open: true,
                      defaultSize: variantSizes[0] ?? '',
                    })
                  }
                  className="flex items-center gap-1.5 h-7 px-3 text-[0.44rem] tracking-[0.12em] uppercase font-semibold"
                  style={{
                    background: 'rgba(180,130,60,0.10)',
                    border: '1px solid rgba(180,130,60,0.22)',
                    color: GOLD,
                  }}
                >
                  <Plus size={9} /> Restock All
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {product.variants.map((v) => {
                  const stat = variantStats.find((s) => s.size === v.size);
                  const color = stockColor(v.stock, v.lowStockThreshold);
                  const label = stockLabel(v.stock, v.lowStockThreshold);
                  const margin_ = margin(v.price, v.costPrice);
                  const maxStock = Math.max(
                    v.stock,
                    stat?.lastRestocked?.newStock ?? 0,
                    v.lowStockThreshold * 4,
                    1,
                  );
                  const barPct = Math.round((v.stock / maxStock) * 100);

                  return (
                    <div
                      key={v.size}
                      className="p-4 space-y-3"
                      style={{
                        background: '#181818',
                        border: `1px solid ${v.stock === 0 ? 'rgba(239,68,68,0.20)' : v.stock <= v.lowStockThreshold ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 text-[0.50rem] tracking-wider font-semibold"
                            style={{
                              background: 'rgba(180,130,60,0.12)',
                              color: GOLD,
                              border: '1px solid rgba(180,130,60,0.22)',
                            }}
                          >
                            {v.size}
                          </span>
                          <CopySku sku={v.sku} />
                        </div>
                        <span
                          className="flex items-center h-5 px-1.5 text-[0.40rem] tracking-[0.10em] uppercase font-semibold"
                          style={{
                            background: `${color}18`,
                            color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {label}
                        </span>
                      </div>

                      {/* Current stock + bar */}
                      <div>
                        <p
                          className="text-2xl font-bold leading-none"
                          style={{ color }}
                        >
                          {v.stock}{' '}
                          <span
                            className="text-sm font-normal"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                          >
                            units
                          </span>
                        </p>
                        <div
                          className="mt-2 h-1.5 w-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${barPct}%`,
                              background: color,
                              opacity: 0.65,
                            }}
                          />
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                          { label: 'Price', value: fmtNGN(v.price) },
                          {
                            label: 'Cost Price',
                            value: v.costPrice ? fmtNGN(v.costPrice) : '—',
                          },
                          { label: 'Profit Margin', value: margin_ },
                          {
                            label: 'Stock Value',
                            value: v.costPrice
                              ? fmtNGN(v.costPrice * v.stock)
                              : '—',
                          },
                          {
                            label: 'Sold (All Time)',
                            value: `${stat?.unitsSoldAllTime ?? 0} units`,
                          },
                          {
                            label: 'Sold (30d)',
                            value: `${stat?.unitsSold30d ?? 0} units`,
                          },
                          {
                            label: 'Velocity',
                            value: stat?.velocity
                              ? `~${stat.velocity}/day`
                              : '—',
                          },
                          {
                            label: 'Days Until Out',
                            value: stat
                              ? daysLeft(stat.daysLeft, v.stock)
                              : '—',
                          },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p
                              className="text-[0.40rem] tracking-widest uppercase"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              {label}
                            </p>
                            <p
                              className="text-[0.52rem] mt-0.5"
                              style={{ color: 'rgba(255,255,255,0.65)' }}
                            >
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Threshold row */}
                      <div
                        className="flex items-center justify-between py-2"
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        {editThresh === v.size ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[0.42rem] tracking-widest uppercase"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              Alert at
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={thresholds[v.size] ?? v.lowStockThreshold}
                              onChange={(e) => {
                                const n = parseInt(e.target.value, 10);
                                if (!isNaN(n))
                                  setThresholds((p) => ({ ...p, [v.size]: n }));
                              }}
                              className="w-12 px-1.5 py-0.5 text-center text-xs outline-none"
                              style={{
                                background: '#0F0F0F',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: 'rgba(255,255,255,0.80)',
                              }}
                              autoFocus
                            />
                            <span
                              className="text-[0.42rem]"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              units
                            </span>
                            <button
                              onClick={saveThresholds}
                              disabled={threshSaving}
                              className="flex items-center gap-1 px-2 py-0.5 text-[0.40rem] tracking-wider uppercase"
                              style={{
                                background: 'rgba(180,130,60,0.12)',
                                color: GOLD,
                                border: '1px solid rgba(180,130,60,0.22)',
                              }}
                            >
                              {threshSaving ? (
                                <Loader2 size={8} className="animate-spin" />
                              ) : (
                                <Save size={8} />
                              )}
                              Save
                            </button>
                            <button
                              onClick={() => setEditThresh(null)}
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              <X size={9} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[0.42rem] tracking-widest uppercase"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              Alert at{' '}
                              {thresholds[v.size] ?? v.lowStockThreshold} units
                            </span>
                            <button
                              onClick={() => setEditThresh(v.size)}
                              className="text-[0.40rem] tracking-widest uppercase underline"
                              style={{ color: 'rgba(255,255,255,0.22)' }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        {threshSaved && editThresh === null && (
                          <span
                            className="text-[0.40rem] tracking-wider"
                            style={{ color: '#22c55e' }}
                          >
                            Saved
                          </span>
                        )}
                      </div>

                      {/* Last events */}
                      <div
                        className="space-y-1.5 text-[0.44rem]"
                        style={{ color: 'rgba(255,255,255,0.30)' }}
                      >
                        {stat?.lastRestocked ? (
                          <p>
                            <span style={{ color: 'rgba(255,255,255,0.20)' }}>
                              Last Restocked:{' '}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                              {fmtDate(stat.lastRestocked.date)}
                            </span>
                            {' — '}
                            <span style={{ color: '#22c55e' }}>
                              +{stat.lastRestocked.qty} units
                            </span>
                            {' by '}
                            <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                              {stat.lastRestocked.by}
                            </span>
                          </p>
                        ) : (
                          <p>
                            Last Restocked:{' '}
                            <span style={{ color: 'rgba(255,255,255,0.20)' }}>
                              —
                            </span>
                          </p>
                        )}
                        <p>
                          Last Sold:{' '}
                          <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                            {relDate(stat?.lastSold ?? null)}
                          </span>
                        </p>
                      </div>

                      {/* Card actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() =>
                            setRestockModal({ open: true, defaultSize: v.size })
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[0.44rem] tracking-[0.10em] uppercase font-semibold transition-all"
                          style={{
                            background: 'rgba(34,197,94,0.10)',
                            color: '#22c55e',
                            border: '1px solid rgba(34,197,94,0.22)',
                          }}
                        >
                          <Plus size={9} /> Restock
                        </button>
                        <button
                          onClick={() => {
                            setAdjFormVariant(v.size);
                            document
                              .getElementById('manual-adj-section')
                              ?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[0.44rem] tracking-[0.10em] uppercase transition-all"
                          style={{
                            border: '1px solid rgba(255,255,255,0.10)',
                            color: 'rgba(255,255,255,0.40)',
                          }}
                        >
                          <Settings size={9} /> Adjust Stock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* ── Sales Performance Chart ───────────────────────────────────────── */}
            <SectionCard
              title="Sales Performance"
              action={
                <div className="flex items-center gap-2">
                  {/* Metric toggle */}
                  <div
                    className="flex"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {(['units', 'revenue'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setChartMetric(m)}
                        className="px-3 py-1 text-[0.42rem] tracking-[0.10em] uppercase transition-all"
                        style={{
                          background:
                            chartMetric === m
                              ? 'rgba(180,130,60,0.14)'
                              : 'transparent',
                          color:
                            chartMetric === m ? GOLD : 'rgba(255,255,255,0.30)',
                          borderRight:
                            m === 'units'
                              ? '1px solid rgba(255,255,255,0.08)'
                              : undefined,
                        }}
                      >
                        {m === 'units' ? 'Units' : 'Revenue'}
                      </button>
                    ))}
                  </div>
                  {/* Period toggle */}
                  <div
                    className="flex"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {([7, 30, 90, 'all'] as const).map((p, idx, arr) => (
                      <button
                        key={p}
                        onClick={() => setChartPeriod(p)}
                        className="px-2.5 py-1 text-[0.42rem] tracking-[0.10em] uppercase transition-all"
                        style={{
                          background:
                            chartPeriod === p
                              ? 'rgba(180,130,60,0.14)'
                              : 'transparent',
                          color:
                            chartPeriod === p ? GOLD : 'rgba(255,255,255,0.30)',
                          borderRight:
                            idx < arr.length - 1
                              ? '1px solid rgba(255,255,255,0.08)'
                              : undefined,
                        }}
                      >
                        {p === 'all' ? 'All' : `${p}d`}
                      </button>
                    ))}
                  </div>
                </div>
              }
            >
              <SalesChart
                data={chartData}
                variantSizes={variantSizes}
                period={chartPeriod}
                metric={chartMetric}
              />

              {/* Summary cards below chart */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                <div
                  className="px-4 py-3"
                  style={{
                    background: '#181818',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <p
                    className="text-[0.42rem] tracking-[0.12em] uppercase mb-1"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    Best Selling Variant
                  </p>
                  <p
                    className="text-[0.60rem] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.80)' }}
                  >
                    {bestVariant
                      ? `${bestVariant.size} — ${bestVariant.pct}% of sales`
                      : '—'}
                  </p>
                </div>
                <div
                  className="px-4 py-3"
                  style={{
                    background: '#181818',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <p
                    className="text-[0.42rem] tracking-[0.12em] uppercase mb-1"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    Best Sales Day
                  </p>
                  <p
                    className="text-[0.60rem] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.80)' }}
                  >
                    {bestDay ? `${bestDay.date} — ${bestDay.units} units` : '—'}
                  </p>
                </div>
                <div
                  className="px-4 py-3"
                  style={{
                    background: '#181818',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <p
                    className="text-[0.42rem] tracking-[0.12em] uppercase mb-1"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    Average Daily Sales
                  </p>
                  <p
                    className="text-[0.60rem] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.80)' }}
                  >
                    {productStats
                      ? `${productStats.avgDailySales} units/day`
                      : '—'}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* ── Stock Movement History ────────────────────────────────────────── */}
            <SectionCard
              title="Stock Movement History"
              action={
                <button
                  onClick={() => exportAdjCSV(adjItems)}
                  className="flex items-center gap-1.5 h-7 px-3 text-[0.44rem] tracking-[0.12em] uppercase"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <Download size={9} /> Export
                </button>
              }
            >
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Type filter tabs */}
                {[
                  { label: 'All', value: '' },
                  { label: 'Restocks', value: 'add' },
                  { label: 'Removals', value: 'remove' },
                  { label: 'Adjustments', value: 'set' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setAdjType(value);
                      setAdjItems([]);
                    }}
                    className="h-7 px-3 text-[0.44rem] tracking-[0.10em] uppercase transition-all"
                    style={{
                      background:
                        adjType === value
                          ? 'rgba(180,130,60,0.10)'
                          : 'transparent',
                      color:
                        adjType === value ? GOLD : 'rgba(255,255,255,0.28)',
                      border: `1px solid ${adjType === value ? 'rgba(180,130,60,0.22)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {label}
                  </button>
                ))}

                {/* Variant filter */}
                <select
                  value={adjVariant}
                  onChange={(e) => {
                    setAdjVariant(e.target.value);
                    setAdjItems([]);
                  }}
                  className="h-7 px-2 text-[0.44rem] tracking-wider uppercase outline-none"
                  style={{
                    background: '#0F0F0F',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <option value="">All Variants</option>
                  {variantSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {/* Date range */}
                <input
                  type="date"
                  value={adjFrom}
                  onChange={(e) => {
                    setAdjFrom(e.target.value);
                    setAdjItems([]);
                  }}
                  className="h-7 px-2 text-[0.44rem] outline-none"
                  style={{
                    background: '#0F0F0F',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                />
                <span
                  className="self-center text-[0.44rem]"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  to
                </span>
                <input
                  type="date"
                  value={adjTo}
                  onChange={(e) => {
                    setAdjTo(e.target.value);
                    setAdjItems([]);
                  }}
                  className="h-7 px-2 text-[0.44rem] outline-none"
                  style={{
                    background: '#0F0F0F',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                />

                <span
                  className="self-center text-[0.44rem]"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  {adjTotal} record{adjTotal !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              {adjLoading && adjItems.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{ color: GOLD }}
                  />
                </div>
              ) : adjItems.length === 0 ? (
                <p
                  className="py-8 text-center text-[0.48rem] tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  No movement records
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[0.48rem] tracking-wider">
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {[
                          'Date & Time',
                          'Variant',
                          'Type',
                          'Change',
                          'Before',
                          'After',
                          'Reference',
                          'By',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left font-normal uppercase tracking-[0.12em] whitespace-nowrap"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adjItems.map((adj, i) => {
                        const typeLabel = movementTypeLabel(
                          adj.type,
                          adj.reason,
                        );
                        const typeColor = movementTypeColor(
                          adj.type,
                          adj.reason,
                        );
                        const delta =
                          adj.type === 'add'
                            ? `+${adj.adjustment}`
                            : adj.type === 'set'
                              ? `→${adj.newStock}`
                              : `-${adj.adjustment}`;
                        const deltaColor =
                          adj.type === 'add'
                            ? '#22c55e'
                            : adj.type === 'set'
                              ? '#60a5fa'
                              : '#ef4444';
                        return (
                          <tr
                            key={adj._id}
                            style={{
                              borderBottom:
                                i < adjItems.length - 1
                                  ? '1px solid rgba(255,255,255,0.04)'
                                  : undefined,
                            }}
                          >
                            <td
                              className="px-3 py-3 whitespace-nowrap"
                              style={{ color: 'rgba(255,255,255,0.45)' }}
                            >
                              {fmtDateTime(adj.createdAt)}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className="px-1.5 py-0.5 text-[0.40rem] tracking-wider"
                                style={{
                                  background: 'rgba(180,130,60,0.10)',
                                  color: GOLD,
                                }}
                              >
                                {adj.variantSize}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span
                                className="px-1.5 py-0.5 text-[0.40rem] tracking-wider"
                                style={{
                                  background: `${typeColor}18`,
                                  color: typeColor,
                                }}
                              >
                                {typeLabel}
                              </span>
                            </td>
                            <td
                              className="px-3 py-3 font-semibold"
                              style={{ color: deltaColor }}
                            >
                              {delta}
                            </td>
                            <td
                              className="px-3 py-3"
                              style={{ color: 'rgba(255,255,255,0.35)' }}
                            >
                              {adj.previousStock}
                            </td>
                            <td
                              className="px-3 py-3 font-semibold"
                              style={{ color: 'rgba(255,255,255,0.70)' }}
                            >
                              {adj.newStock}
                            </td>
                            <td className="px-3 py-3 max-w-[160px]">
                              {adj.orderRef ? (
                                <span
                                  className="font-mono text-[0.44rem]"
                                  style={{ color: GOLD }}
                                >
                                  #{adj.orderRef}
                                </span>
                              ) : (
                                <span
                                  className="truncate block text-[0.44rem]"
                                  style={{ color: 'rgba(255,255,255,0.30)' }}
                                  title={adj.reason}
                                >
                                  {adj.reason || '—'}
                                </span>
                              )}
                            </td>
                            <td
                              className="px-3 py-3 whitespace-nowrap"
                              style={{ color: 'rgba(255,255,255,0.40)' }}
                            >
                              {adj.adjustedBy}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Load More */}
              {adjPage < adjTotalPages && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => fetchAdj(adjPage + 1)}
                    disabled={adjLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-[0.46rem] tracking-[0.12em] uppercase"
                    style={{
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {adjLoading && (
                      <Loader2 size={9} className="animate-spin" />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </SectionCard>

            {/* ── Restock History ───────────────────────────────────────────────── */}
            <SectionCard
              title="Restock History"
              action={
                <button
                  onClick={() =>
                    setRestockModal({
                      open: true,
                      defaultSize: variantSizes[0] ?? '',
                    })
                  }
                  className="flex items-center gap-1.5 h-7 px-3 text-[0.44rem] tracking-[0.12em] uppercase font-semibold"
                  style={{
                    background: 'rgba(34,197,94,0.10)',
                    border: '1px solid rgba(34,197,94,0.22)',
                    color: '#22c55e',
                  }}
                >
                  <Plus size={9} /> Add Restock
                </button>
              }
            >
              {restockHistory.length === 0 ? (
                <p
                  className="py-6 text-center text-[0.48rem] tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  No restock records yet.
                </p>
              ) : (
                <div className="space-y-0">
                  {restockHistory.map((adj, i) => (
                    <div key={adj._id} className="relative flex gap-4 pb-6">
                      {/* Timeline line */}
                      {i < restockHistory.length - 1 && (
                        <div
                          className="absolute left-[11px] top-5 bottom-0 w-px"
                          style={{ background: 'rgba(255,255,255,0.07)' }}
                        />
                      )}
                      {/* Dot */}
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{
                          background: 'rgba(34,197,94,0.15)',
                          border: '1px solid rgba(34,197,94,0.30)',
                        }}
                      >
                        <Plus
                          size={9}
                          style={{ color: '#22c55e' }}
                          strokeWidth={2}
                        />
                      </div>

                      <div className="flex-1 min-w-0 pb-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p
                              className="text-[0.50rem] tracking-[0.06em]"
                              style={{ color: 'rgba(255,255,255,0.65)' }}
                            >
                              <span
                                className="font-semibold text-[0.56rem]"
                                style={{ color: '#22c55e' }}
                              >
                                +{adj.adjustment} units
                              </span>{' '}
                              <span
                                className="px-1.5 py-0.5 text-[0.40rem]"
                                style={{
                                  background: 'rgba(180,130,60,0.10)',
                                  color: GOLD,
                                }}
                              >
                                {adj.variantSize}
                              </span>
                            </p>
                            <p
                              className="text-[0.46rem] mt-1"
                              style={{ color: 'rgba(255,255,255,0.35)' }}
                            >
                              {adj.previousStock} → {adj.newStock} units
                              {adj.reason && (
                                <span
                                  style={{ color: 'rgba(255,255,255,0.25)' }}
                                >
                                  {' '}
                                  · {adj.reason}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className="text-[0.44rem]"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              {fmtDateTime(adj.createdAt)}
                            </p>
                            <p
                              className="text-[0.44rem] mt-0.5"
                              style={{ color: 'rgba(255,255,255,0.35)' }}
                            >
                              by {adj.adjustedBy}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* ── Manual Stock Adjustment ───────────────────────────────────────── */}
            <div id="manual-adj-section">
              <SectionCard title="Manual Stock Adjustment">
                <p
                  className="text-[0.48rem] mb-5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  Use for inventory count corrections, damaged stock, samples,
                  or returns. All adjustments are logged and cannot be undone.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    {/* Variant select */}
                    <div className="space-y-1.5">
                      <label
                        className="text-[0.44rem] tracking-[0.12em] uppercase"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        Select Variant
                      </label>
                      <select
                        value={adjFormVariant}
                        onChange={(e) => setAdjFormVariant(e.target.value)}
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={{
                          background: '#0F0F0F',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: 'rgba(255,255,255,0.80)',
                        }}
                      >
                        {product.variants.map((v) => (
                          <option key={v.size} value={v.size}>
                            {v.size} — Stock: {v.stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Adjustment type */}
                    <div className="space-y-1.5">
                      <label
                        className="text-[0.44rem] tracking-[0.12em] uppercase"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        Adjustment Type
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          [
                            {
                              value: 'add',
                              label: 'Add Stock',
                              color: '#22c55e',
                            },
                            {
                              value: 'remove',
                              label: 'Remove Stock',
                              color: '#ef4444',
                            },
                            {
                              value: 'set',
                              label: 'Set Exact Stock',
                              color: '#60a5fa',
                            },
                            {
                              value: 'writeoff',
                              label: 'Write-off (damaged)',
                              color: 'rgba(255,255,255,0.30)',
                            },
                          ] as const
                        ).map(({ value, label, color }) => (
                          <button
                            key={value}
                            onClick={() => setAdjFormType(value)}
                            className="px-3 py-2 text-left text-[0.44rem] tracking-wider uppercase transition-all"
                            style={{
                              background:
                                adjFormType === value
                                  ? `${color}18`
                                  : 'transparent',
                              border: `1px solid ${adjFormType === value ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                              color:
                                adjFormType === value
                                  ? color
                                  : 'rgba(255,255,255,0.30)',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1.5">
                      <label
                        className="text-[0.44rem] tracking-[0.12em] uppercase"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={adjFormQty}
                        onChange={(e) => setAdjFormQty(e.target.value)}
                        placeholder={
                          adjFormType === 'set'
                            ? 'New exact stock level'
                            : 'Units'
                        }
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={{
                          background: '#0F0F0F',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: 'rgba(255,255,255,0.85)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Reason dropdown */}
                    <div className="space-y-1.5">
                      <label
                        className="text-[0.44rem] tracking-[0.12em] uppercase"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        Reason (required)
                      </label>
                      <select
                        value={adjFormReason}
                        onChange={(e) => setAdjFormReason(e.target.value)}
                        className="w-full px-3 py-2 text-sm outline-none"
                        style={{
                          background: '#0F0F0F',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: adjFormReason
                            ? 'rgba(255,255,255,0.80)'
                            : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        <option value="" disabled>
                          Select reason…
                        </option>
                        {[
                          'Inventory Count Correction',
                          'Damaged Stock',
                          'Lost / Stolen',
                          'Sample Used',
                          'Supplier Return',
                          'Other',
                        ].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {adjFormReason === 'Other' && (
                        <input
                          type="text"
                          value={adjFormReasonOther}
                          onChange={(e) =>
                            setAdjFormReasonOther(e.target.value)
                          }
                          placeholder="Describe the reason…"
                          className="w-full px-3 py-2 text-sm outline-none mt-1.5"
                          style={{
                            background: '#0F0F0F',
                            border: '1px solid rgba(255,255,255,0.10)',
                            color: 'rgba(255,255,255,0.85)',
                          }}
                        />
                      )}
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                      <label
                        className="text-[0.44rem] tracking-[0.12em] uppercase"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        Internal Note (optional)
                      </label>
                      <textarea
                        rows={2}
                        value={adjFormNote}
                        onChange={(e) => setAdjFormNote(e.target.value)}
                        placeholder="Additional detail…"
                        className="w-full px-3 py-2 text-sm outline-none resize-none"
                        style={{
                          background: '#0F0F0F',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: 'rgba(255,255,255,0.85)',
                        }}
                      />
                    </div>

                    {/* Preview */}
                    {adjPreviewNew !== null && adjPreviewDelta !== null && (
                      <div
                        className="flex items-center justify-between px-3 py-2.5"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <span
                          className="text-[0.44rem] tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.28)' }}
                        >
                          Preview
                        </span>
                        <div className="flex items-center gap-2 text-[0.50rem]">
                          <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {adjPreviewVariant?.stock}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.20)' }}>
                            →
                          </span>
                          <span
                            className="font-semibold"
                            style={{
                              color: adjPreviewVariant
                                ? stockColor(
                                    adjPreviewNew,
                                    adjPreviewVariant.lowStockThreshold,
                                  )
                                : '#22c55e',
                            }}
                          >
                            {adjPreviewNew}
                          </span>
                          <span
                            style={{
                              color:
                                adjPreviewDelta >= 0 ? '#22c55e' : '#ef4444',
                              fontSize: '0.44rem',
                            }}
                          >
                            ({adjPreviewDelta >= 0 ? '+' : ''}
                            {adjPreviewDelta})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Warning */}
                    <div
                      className="flex items-start gap-2 px-3 py-2.5"
                      style={{
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.15)',
                      }}
                    >
                      <AlertTriangle
                        size={10}
                        strokeWidth={1.8}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: '#f59e0b' }}
                      />
                      <p
                        className="text-[0.44rem] leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        All manual adjustments are logged and cannot be undone.
                      </p>
                    </div>

                    {adjFormError && (
                      <p
                        className="text-[0.48rem] tracking-wider"
                        style={{ color: '#ef4444' }}
                      >
                        {adjFormError}
                      </p>
                    )}
                    {adjFormSuccess && (
                      <p
                        className="text-[0.48rem] tracking-wider"
                        style={{ color: '#22c55e' }}
                      >
                        {adjFormSuccess}
                      </p>
                    )}

                    <button
                      onClick={submitManualAdj}
                      disabled={adjFormLoading}
                      className="w-full py-2.5 text-[0.48rem] tracking-[0.14em] uppercase font-semibold flex items-center justify-center gap-1.5"
                      style={{
                        background: adjFormLoading
                          ? 'rgba(96,165,250,0.08)'
                          : 'rgba(96,165,250,0.14)',
                        color: adjFormLoading
                          ? 'rgba(96,165,250,0.40)'
                          : '#60a5fa',
                        border: `1px solid rgba(96,165,250,${adjFormLoading ? '0.12' : '0.30'})`,
                        cursor: adjFormLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {adjFormLoading && (
                        <Loader2 size={10} className="animate-spin" />
                      )}
                      Apply Adjustment
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* ── Low Stock Alert Settings ──────────────────────────────────────── */}
            <SectionCard
              title="Alert Settings"
              action={
                <button
                  onClick={saveThresholds}
                  disabled={threshSaving}
                  className="flex items-center gap-1.5 h-7 px-3 text-[0.44rem] tracking-[0.12em] uppercase font-semibold"
                  style={{
                    background: threshSaving
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(180,130,60,0.12)',
                    border: `1px solid ${threshSaving ? 'rgba(255,255,255,0.08)' : 'rgba(180,130,60,0.25)'}`,
                    color: threshSaving ? 'rgba(255,255,255,0.25)' : GOLD,
                  }}
                >
                  {threshSaving ? (
                    <Loader2 size={9} className="animate-spin" />
                  ) : (
                    <Save size={9} />
                  )}
                  {threshSaved ? 'Saved!' : 'Save Settings'}
                </button>
              }
            >
              <div className="space-y-6">
                {/* Per-variant thresholds */}
                <div>
                  <p
                    className="text-[0.44rem] tracking-[0.12em] uppercase mb-3"
                    style={{ color: 'rgba(255,255,255,0.30)' }}
                  >
                    Low Stock Thresholds
                  </p>
                  <div className="space-y-2">
                    {product.variants.map((v) => {
                      const thr = thresholds[v.size] ?? v.lowStockThreshold;
                      const color = stockColor(v.stock, thr);
                      const pct =
                        thr > 0
                          ? Math.min(
                              100,
                              Math.round((v.stock / (thr * 3)) * 100),
                            )
                          : 100;
                      return (
                        <div
                          key={v.size}
                          className="flex items-center gap-4 px-4 py-3"
                          style={{
                            background: '#181818',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <span
                            className="w-12 text-[0.50rem] font-semibold"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                          >
                            {v.size}
                          </span>

                          {/* Threshold input */}
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[0.42rem] tracking-widest uppercase"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              Alert at
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={thr}
                              onChange={(e) => {
                                const n = parseInt(e.target.value, 10);
                                if (!isNaN(n) && n >= 0)
                                  setThresholds((p) => ({ ...p, [v.size]: n }));
                              }}
                              className="w-14 px-2 py-1 text-center text-sm outline-none"
                              style={{
                                background: '#0F0F0F',
                                border: '1px solid rgba(255,255,255,0.10)',
                                color: 'rgba(255,255,255,0.80)',
                              }}
                            />
                            <span
                              className="text-[0.42rem]"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              units
                            </span>
                          </div>

                          {/* Current vs threshold bar */}
                          <div className="flex-1 flex items-center gap-2">
                            <div
                              className="flex-1 h-1 overflow-hidden"
                              style={{ background: 'rgba(255,255,255,0.06)' }}
                            >
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background: color,
                                  opacity: 0.65,
                                }}
                              />
                            </div>
                            <span
                              className="text-[0.44rem] w-16 text-right"
                              style={{ color }}
                            >
                              {v.stock} / {thr}
                            </span>
                          </div>

                          {/* Auto-alert toggle */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[0.40rem] tracking-widest uppercase"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              Auto-alert
                            </span>
                            <div
                              className="relative cursor-pointer"
                              onClick={() => {}}
                              title="Configure notification infrastructure to enable"
                            >
                              <div
                                className="w-7 h-3.5 rounded-full transition-colors"
                                style={{
                                  background:
                                    v.stock <= thr
                                      ? 'rgba(180,130,60,0.35)'
                                      : 'rgba(255,255,255,0.10)',
                                }}
                              />
                              <div
                                className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all"
                                style={{
                                  background: 'rgba(255,255,255,0.60)',
                                  left: v.stock <= thr ? '15px' : '2px',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alert frequency */}
                <div>
                  <p
                    className="text-[0.44rem] tracking-[0.12em] uppercase mb-3"
                    style={{ color: 'rgba(255,255,255,0.30)' }}
                  >
                    Alert Frequency
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'once',
                        label: 'Alert once when threshold is crossed',
                      },
                      {
                        value: 'daily',
                        label: 'Alert daily while below threshold',
                      },
                      { value: 'every', label: 'Alert every restock needed' },
                    ].map(({ value, label }) => (
                      <label
                        key={value}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            border: `1px solid ${value === 'once' ? GOLD : 'rgba(255,255,255,0.18)'}`,
                            background:
                              value === 'once'
                                ? 'rgba(180,130,60,0.20)'
                                : 'transparent',
                          }}
                        >
                          {value === 'once' && (
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: GOLD }}
                            />
                          )}
                        </div>
                        <span
                          className="text-[0.48rem] tracking-wider"
                          style={{
                            color:
                              value === 'once'
                                ? 'rgba(255,255,255,0.70)'
                                : 'rgba(255,255,255,0.35)',
                          }}
                        >
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Note about notification infrastructure */}
                <p
                  className="text-[0.44rem] tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  Email notification delivery requires notification
                  infrastructure configuration. Threshold values are saved
                  immediately.
                </p>
              </div>
            </SectionCard>

            {/* ── Product Information Summary ───────────────────────────────────── */}
            <SectionCard
              title="Product Information"
              action={
                <Link
                  href={`/admin/products/${product.slug}/edit`}
                  className="flex items-center gap-1.5 h-7 px-3 text-[0.44rem] tracking-[0.12em] uppercase transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  Edit Product <ExternalLink size={8} />
                </Link>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
                {[
                  { label: 'Product Name', value: product.name },
                  {
                    label: 'Category',
                    value: product.fragranceFamilies.join(', ') || '—',
                  },
                  {
                    label: 'Concentration',
                    value: product.concentration || '—',
                  },
                  { label: 'Gender', value: product.gender || '—' },
                  { label: 'Status', value: product.status },
                  { label: 'Date Added', value: fmtDate(product.createdAt) },
                  {
                    label: 'Created By',
                    value: productStats?.createdByName ?? '—',
                  },
                  {
                    label: 'Wishlist Count',
                    value: productStats
                      ? `${productStats.wishlisted} wishlisted`
                      : '—',
                  },
                  {
                    label: 'Total Variants',
                    value: `${product.variants.length} variants`,
                  },
                  {
                    label: 'SKUs',
                    value:
                      product.variants
                        .map((v) => v.sku)
                        .filter(Boolean)
                        .join(', ') || '—',
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p
                      className="text-[0.40rem] tracking-widest uppercase mb-1"
                      style={{ color: 'rgba(255,255,255,0.22)' }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-[0.52rem]"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </main>
      </div>

      {/* ── Restock Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {restockModal.open && (
          <RestockModal
            key="restock"
            productId={productId}
            productName={product.name}
            variants={product.variants}
            defaultSize={restockModal.defaultSize}
            onClose={() => setRestockModal({ open: false, defaultSize: '' })}
            onSuccess={() => {
              setRestockModal({ open: false, defaultSize: '' });
              fetchMain();
              setAdjItems([]);
              fetchAdj(1);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
