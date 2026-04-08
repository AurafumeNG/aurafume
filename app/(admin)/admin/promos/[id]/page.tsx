'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Tag,
  Copy,
  Check,
  Edit2,
  Download,
  ToggleLeft,
  ToggleRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Users,
  ShoppingBag,
  AlertTriangle,
  Clock,
  Activity,
  Eye,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Package,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import Image from 'next/image';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';
const GOLD_BG = 'rgba(180,130,60,';

// ── Types ──────────────────────────────────────────────────────────────────────

type PromoStatus =
  | 'draft'
  | 'active'
  | 'scheduled'
  | 'disabled'
  | 'archived'
  | 'expired';
type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type TimelineWindow = '7' | '30' | 'all';
type TimelineMetric = 'uses' | 'discount' | 'revenue';

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface PromoCode {
  _id: string;
  code: string;
  description: string;
  label: string;
  status: PromoStatus;
  type: string;
  value: number;
  hasPctCap: boolean;
  pctCap: number;
  freeShippingStandard: boolean;
  freeShippingExpress: boolean;
  buyX: number;
  getY: number;
  getDiscount: string;
  getCustomPct: number;
  applyTo: string;
  maxUses: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  singleUse: boolean;
  validFrom: string;
  expiresAt: string | null;
  minOrderAmount: number;
  firstOrderOnly: boolean;
  newCustomersOnly: boolean;
  specificCustomerEmails: string[];
  combinableWithCodes: boolean;
  combinableWithSales: boolean;
  revenueImpact: number;
  createdAt: string;
  updatedAt: string;
}

interface Kpi {
  totalUses: number;
  totalDiscount: number;
  totalRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
  uniqueCustomers: number;
  usesTrend: number;
  prevUses: number;
}

interface TimelineRow {
  date: string;
  uses: number;
  discount: number;
  revenue: number;
}

interface Segments {
  newCustomers: number;
  returningCustomers: number;
  verifiedCustomers: number;
  unverifiedCustomers: number;
  paystackOrders: number;
  bankTransferOrders: number;
  newPct: number;
  verifiedPct: number;
  paystackPct: number;
  bankPct: number;
  total: number;
  totalOrders: number;
}

interface TopProduct {
  _id: string;
  name: string;
  image: string;
  slug: string;
  size: string;
  count: number;
  revenue: number;
}

interface OrderRow {
  _id: string;
  orderNumber: string;
  contact: { firstName: string; lastName: string; email: string };
  orderTotal: number;
  discountApplied: number;
  finalAmount: number;
  date: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

interface CustomerRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateUsed: string;
  orderAmount: number;
  discountReceived: number;
  userId?: string;
}

interface ActivityEvent {
  id: string;
  label: string;
  actor: string;
  isSystem: boolean;
  date: string;
}

interface Analytics {
  coupon: PromoCode;
  kpi: Kpi;
  timeline: TimelineRow[];
  peakDay: {
    date: string;
    uses: number;
    discount: number;
    revenue: number;
  } | null;
  avgDailyUses: string;
  segments: Segments;
  topProducts: TopProduct[];
  orders: { list: OrderRow[]; total: number; page: number; pageSize: number };
  customers: {
    list: CustomerRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  failedApplications: unknown[];
  activityLog: ActivityEvent[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' at ' +
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  );
}

function discountLabel(code: PromoCode): string {
  if (code.type === 'pct')
    return `${code.value}% off${code.applyTo !== 'order' ? ' selected items' : ' entire order'}${code.hasPctCap && code.pctCap > 0 ? ` (max ${formatNaira(code.pctCap)})` : ''}`;
  if (code.type === 'flat')
    return `${formatNaira(code.value)} off entire order`;
  if (code.type === 'free-shipping') return 'Free delivery';
  const off =
    code.getDiscount === 'free'
      ? '100% off'
      : code.getDiscount === 'half'
        ? '50% off'
        : `${code.getCustomPct}% off`;
  return `Buy ${code.buyX} get ${code.getY} at ${off}`;
}

function conditionsSummary(code: PromoCode): string {
  const parts: string[] = [];
  if (code.minOrderAmount > 0)
    parts.push(`Min spend ${formatNaira(code.minOrderAmount)}`);
  if (code.firstOrderOnly) parts.push('First order only');
  if (code.newCustomersOnly) parts.push('New customers only');
  if (code.specificCustomerEmails?.length > 0)
    parts.push(`${code.specificCustomerEmails.length} specific customers`);
  return parts.join(' · ') || 'No restrictions';
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-5 md:p-6 ${className}`}
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <span style={{ color: GOLD }}>{icon}</span>
        <h2
          className="text-[0.58rem] tracking-[0.22em] uppercase font-semibold"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          {label}
        </h2>
      </div>
      {action}
    </div>
  );
}

function PromoStatusPill({ status }: { status: PromoStatus }) {
  const cfg: Record<
    PromoStatus,
    { label: string; bg: string; color: string; border: string }
  > = {
    active: {
      label: 'Active',
      bg: 'rgba(34,197,94,0.09)',
      color: 'rgba(74,222,128,0.88)',
      border: 'rgba(34,197,94,0.18)',
    },
    scheduled: {
      label: 'Scheduled',
      bg: 'rgba(59,130,246,0.10)',
      color: 'rgba(96,165,250,0.85)',
      border: 'rgba(59,130,246,0.22)',
    },
    expired: {
      label: 'Expired',
      bg: 'rgba(255,255,255,0.04)',
      color: 'rgba(156,163,175,0.70)',
      border: 'rgba(255,255,255,0.10)',
    },
    disabled: {
      label: 'Disabled',
      bg: 'rgba(239,68,68,0.08)',
      color: 'rgba(239,68,68,0.72)',
      border: 'rgba(239,68,68,0.18)',
    },
    draft: {
      label: 'Draft',
      bg: 'rgba(255,255,255,0.04)',
      color: 'rgba(255,255,255,0.40)',
      border: 'rgba(255,255,255,0.10)',
    },
    archived: {
      label: 'Archived',
      bg: 'rgba(255,255,255,0.03)',
      color: 'rgba(255,255,255,0.22)',
      border: 'rgba(255,255,255,0.07)',
    },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {c.label}
    </span>
  );
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  const cfg: Record<
    OrderStatus,
    { bg: string; color: string; border: string }
  > = {
    pending: {
      bg: 'rgba(234,179,8,0.09)',
      color: 'rgba(250,204,21,0.85)',
      border: 'rgba(234,179,8,0.22)',
    },
    confirmed: {
      bg: 'rgba(99,102,241,0.10)',
      color: 'rgba(129,140,248,0.85)',
      border: 'rgba(99,102,241,0.22)',
    },
    processing: {
      bg: 'rgba(59,130,246,0.10)',
      color: 'rgba(96,165,250,0.88)',
      border: 'rgba(59,130,246,0.22)',
    },
    shipped: { bg: `${GOLD_BG}0.10)`, color: GOLD, border: `${GOLD_BG}0.24)` },
    delivered: {
      bg: 'rgba(34,197,94,0.09)',
      color: 'rgba(74,222,128,0.88)',
      border: 'rgba(34,197,94,0.18)',
    },
    cancelled: {
      bg: 'rgba(239,68,68,0.08)',
      color: 'rgba(239,68,68,0.72)',
      border: 'rgba(239,68,68,0.18)',
    },
  };
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
}

function GhostBtn({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const [h, setH] = useState(false);
  const c = danger
    ? {
        bg: h ? 'rgba(239,68,68,0.10)' : 'transparent',
        color: h ? 'rgba(239,68,68,0.90)' : 'rgba(239,68,68,0.60)',
        border: h
          ? '1px solid rgba(239,68,68,0.28)'
          : '1px solid rgba(239,68,68,0.18)',
      }
    : {
        bg: h ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        color: h ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.42)',
        border: `1px solid ${h ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      };
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="flex items-center gap-1.5 h-8 px-3 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
      style={{ ...c, cursor: 'pointer' }}
    >
      {icon}
      {label}
    </button>
  );
}

function GoldBtn({
  icon,
  label,
  onClick,
  loading,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150"
      style={{
        background: h ? `${GOLD_BG}0.22)` : `${GOLD_BG}0.12)`,
        color: GOLD,
        border: `1px solid ${h ? `${GOLD_BG}0.45)` : `${GOLD_BG}0.28)`}`,
        cursor: 'pointer',
      }}
    >
      {loading ? (
        <Loader2 size={11} strokeWidth={2} className="animate-spin" />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}

// ── CopyCodeButton ─────────────────────────────────────────────────────────────

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="flex items-center gap-1.5 h-7 px-2.5 text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-150"
      style={{
        background: copied ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
        color: copied ? 'rgba(74,222,128,0.80)' : 'rgba(255,255,255,0.30)',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {copied ? (
        <Check size={10} strokeWidth={2.5} />
      ) : (
        <Copy size={10} strokeWidth={1.8} />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Mini line chart (SVG, no deps) ─────────────────────────────────────────────

function MiniLineChart({
  data,
  metric,
  height = 120,
}: {
  data: TimelineRow[];
  metric: TimelineMetric;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <p
          className="text-[0.48rem] tracking-[0.10em] uppercase"
          style={{ color: 'rgba(255,255,255,0.14)' }}
        >
          No data for this period
        </p>
      </div>
    );
  }

  const values = data.map((r) =>
    metric === 'uses' ? r.uses : metric === 'discount' ? r.discount : r.revenue,
  );
  const maxVal = Math.max(...values, 1);
  const width = 800;
  const pad = { top: 12, right: 16, bottom: 28, left: 12 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const step = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const pts = values.map((v, i) => ({
    x: pad.left + i * step,
    y: pad.top + chartH - (v / maxVal) * chartH,
  }));

  const pathD = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + chartH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.top + chartH).toFixed(1)} Z`;

  // X-axis labels — show at most 6
  const labelStep = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((r, i) => ({
      i,
      label: new Date(r.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      }),
    }))
    .filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    val: number;
    date: string;
  } | null>(null);

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width;
          const idx = Math.round((relX - pad.left) / step);
          if (idx >= 0 && idx < pts.length) {
            setTooltip({
              x: pts[idx].x,
              y: pts[idx].y,
              val: values[idx],
              date: data[idx].date,
            });
          }
        }}
      >
        <defs>
          <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(180,130,60,0.22)" />
            <stop offset="100%" stopColor="rgba(180,130,60,0.00)" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill="url(#chartArea)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={GOLD}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={GOLD} opacity="0.7" />
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={pts[i].x}
            y={height - 4}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(255,255,255,0.22)"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Tooltip vertical line */}
        {tooltip && (
          <line
            x1={tooltip.x}
            y1={pad.top}
            x2={tooltip.x}
            y2={pad.top + chartH}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}
      </svg>

      {/* Tooltip bubble */}
      {tooltip && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5"
          style={{
            top: Math.max(4, tooltip.y - 44),
            left: `${(tooltip.x / 800) * 100}%`,
            transform: 'translateX(-50%)',
            background: '#1E1E1E',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.50)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <p
            className="text-[0.42rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {formatDate(tooltip.date)}
          </p>
          <p
            className="text-[0.54rem] font-semibold tabular-nums"
            style={{ color: GOLD }}
          >
            {metric === 'uses' ? tooltip.val : formatNaira(tooltip.val)}
          </p>
        </div>
      )}
    </div>
  );
}

// ── DonutChart ─────────────────────────────────────────────────────────────────

function DonutChart({
  slices,
  title,
}: {
  slices: { label: string; value: number; pct: number; color: string }[];
  title: string;
}) {
  const R = 36;
  const cx = 48;
  const cy = 48;
  const circ = 2 * Math.PI * R;
  let cumPct = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0">
        <svg viewBox="0 0 96 96" width="96" height="96">
          {slices.map((s, i) => {
            const offset = circ * (1 - cumPct / 100);
            const dash = circ * (s.pct / 100);
            cumPct += s.pct;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={offset}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '48px 48px',
                }}
              />
            );
          })}
          {/* Centre hole */}
          <circle cx={cx} cy={cy} r="24" fill="#141414" />
        </svg>
      </div>
      <div className="space-y-2 min-w-0">
        <p
          className="text-[0.46rem] tracking-[0.14em] uppercase font-medium mb-2"
          style={{ color: 'rgba(255,255,255,0.28)' }}
        >
          {title}
        </p>
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span
              className="text-[0.50rem] tracking-[0.04em] flex-1"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {s.label}
            </span>
            <span
              className="text-[0.52rem] font-semibold tabular-nums"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PromoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const [window_, setWindow_] = useState<TimelineWindow>('30');
  const [metric, setMetric] = useState<TimelineMetric>('uses');
  const [ordersPage, setOrdersPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [ordersData, setOrdersData] = useState<Analytics['orders'] | null>(
    null,
  );
  const [customersData, setCustomersData] = useState<
    Analytics['customers'] | null
  >(null);

  // Auth
  useEffect(() => {
    fetch('/api/admin/me')
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          router.push('/admin/login');
          return;
        }
        const { data: me } = (await r.json()) as { data?: AdminUser };
        if (me) setAdminUser(me);
      })
      .catch(() => {});
  }, [router]);

  // Initial load
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/promos/${id}/analytics?window=${window_}&metric=${metric}&ordersPage=1&customersPage=1`,
      );
      if (!res.ok) {
        router.push('/admin/promos');
        return;
      }
      const json = (await res.json()) as { data?: Analytics };
      if (json.data) {
        setData(json.data);
        setOrdersData(json.data.orders);
        setCustomersData(json.data.customers);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id, window_, metric, router]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  // Load more orders
  async function loadMoreOrders() {
    const nextPage = ordersPage + 1;
    setOrdersLoading(true);
    try {
      const res = await fetch(
        `/api/admin/promos/${id}/analytics?window=${window_}&metric=${metric}&ordersPage=${nextPage}&customersPage=${customersPage}`,
      );
      const json = (await res.json()) as { data?: Analytics };
      if (json.data?.orders) {
        setOrdersData((prev) =>
          prev
            ? {
                ...json.data!.orders,
                list: [...prev.list, ...json.data!.orders.list],
              }
            : json.data!.orders,
        );
        setOrdersPage(nextPage);
      }
    } catch {
      /* ignore */
    } finally {
      setOrdersLoading(false);
    }
  }

  // Load more customers
  async function loadMoreCustomers() {
    const nextPage = customersPage + 1;
    setCustomersLoading(true);
    try {
      const res = await fetch(
        `/api/admin/promos/${id}/analytics?window=${window_}&metric=${metric}&ordersPage=${ordersPage}&customersPage=${nextPage}`,
      );
      const json = (await res.json()) as { data?: Analytics };
      if (json.data?.customers) {
        setCustomersData((prev) =>
          prev
            ? {
                ...json.data!.customers,
                list: [...prev.list, ...json.data!.customers.list],
              }
            : json.data!.customers,
        );
        setCustomersPage(nextPage);
      }
    } catch {
      /* ignore */
    } finally {
      setCustomersLoading(false);
    }
  }

  // Toggle status
  async function handleToggleStatus() {
    if (!data?.coupon) return;
    setToggling(true);
    const enable =
      data.coupon.status === 'disabled' || data.coupon.status === 'draft';
    try {
      const res = await fetch(`/api/admin/promos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: enable ? 'active' : 'disabled' }),
      });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                coupon: {
                  ...prev.coupon,
                  status: enable ? 'active' : 'disabled',
                },
              }
            : prev,
        );
      }
    } catch {
      /* ignore */
    } finally {
      setToggling(false);
    }
  }

  // Duplicate
  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/admin/promos/${id}/duplicate`, {
        method: 'POST',
      });
      const json = (await res.json()) as { data?: { id: string } };
      if (json.data?.id) router.push(`/admin/promos/${json.data.id}/edit`);
    } catch {
      /* ignore */
    } finally {
      setDuplicating(false);
    }
  }

  // Export CSV
  function handleExport() {
    if (!data?.coupon) return;
    const code = data.coupon;
    const lines = [
      'Code,Description,Type,Discount,Total Uses,Total Discount,Total Revenue,Status',
      `${code.code},"${code.description}",${code.type},${discountLabel(code)},${data.kpi.totalUses},${data.kpi.totalDiscount},${data.kpi.totalRevenue},${code.status}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `promo-${code.code}-report.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  const adminFullName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName}`
    : '—';
  const adminShortName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName[0]}.`
    : '—';
  const adminRoleLabel =
    adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  if (loading) {
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
            pageTitle="Promo Code"
            adminName={adminShortName}
            avatarUrl={adminUser?.avatar}
            onMenuToggle={() => setSidebarOpen((o) => !o)}
          />
          <main className="flex-1 pt-14 flex items-center justify-center">
            <Loader2
              size={20}
              strokeWidth={1.8}
              className="animate-spin"
              style={{ color: GOLD }}
            />
          </main>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const {
    coupon,
    kpi,
    timeline,
    peakDay,
    avgDailyUses,
    segments,
    topProducts,
    activityLog,
  } = data;
  const isActive = coupon.status === 'active';
  const isExpired =
    coupon.status === 'expired' ||
    (coupon.expiresAt && new Date(coupon.expiresAt) < new Date());
  const usagePct = coupon.maxUses
    ? Math.round((coupon.usedCount / coupon.maxUses) * 100)
    : null;
  const usesTrendUp = kpi.usesTrend > 0;
  const usesTrendFlat = kpi.usesTrend === 0;

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
          pageTitle={coupon.code}
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-5">
            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2.5">
                {/* Back link */}
                <Link
                  href="/admin/promos"
                  className="inline-flex items-center gap-1.5 transition-colors duration-150"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')
                  }
                >
                  <ArrowLeft size={13} strokeWidth={2} />
                  <span className="text-[0.52rem] tracking-[0.14em] uppercase font-medium">
                    Promo Codes
                  </span>
                </Link>
                {/* Title row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="text-[1.10rem] tracking-[0.14em] font-bold font-mono leading-none"
                    style={{ color: 'rgba(255,255,255,0.90)' }}
                  >
                    {coupon.code}
                  </span>
                  <PromoStatusPill status={coupon.status as PromoStatus} />
                  <CopyCodeButton code={coupon.code} />
                </div>
                {coupon.description && (
                  <p
                    className="text-[0.54rem] tracking-[0.06em]"
                    style={{ color: 'rgba(255,255,255,0.30)' }}
                  >
                    {coupon.description}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap sm:pt-1">
                <GhostBtn
                  icon={<Download size={12} strokeWidth={1.8} />}
                  label="Export Report"
                  onClick={handleExport}
                />
                <GhostBtn
                  icon={
                    duplicating ? (
                      <Loader2
                        size={11}
                        strokeWidth={1.8}
                        className="animate-spin"
                      />
                    ) : (
                      <RefreshCw size={11} strokeWidth={1.8} />
                    )
                  }
                  label="Duplicate"
                  onClick={handleDuplicate}
                />
                <GhostBtn
                  icon={
                    toggling ? (
                      <Loader2
                        size={11}
                        strokeWidth={1.8}
                        className="animate-spin"
                      />
                    ) : isActive ? (
                      <ToggleLeft size={13} strokeWidth={1.8} />
                    ) : (
                      <ToggleRight size={13} strokeWidth={1.8} />
                    )
                  }
                  label={isActive ? 'Disable' : 'Enable'}
                  onClick={handleToggleStatus}
                  danger={isActive}
                />
                <GoldBtn
                  icon={<Edit2 size={12} strokeWidth={1.8} />}
                  label="Edit Code"
                  onClick={() => router.push(`/admin/promos/${id}/edit`)}
                />
              </div>
            </div>

            {/* ── Code Summary Card ─────────────────────────────────────────── */}
            <div
              className="relative overflow-hidden p-5 md:p-6"
              style={{
                background: '#141414',
                border: `1px solid ${isActive ? 'rgba(180,130,60,0.22)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {/* Accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{
                  background: isActive ? GOLD : 'rgba(255,255,255,0.10)',
                }}
              />
              <div className="pl-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    {/* Discount line */}
                    <p
                      className="text-[0.70rem] tracking-[0.06em] font-semibold"
                      style={{ color: GOLD }}
                    >
                      {discountLabel(coupon)}
                    </p>
                    {/* Conditions */}
                    <p
                      className="text-[0.52rem] tracking-[0.04em]"
                      style={{ color: 'rgba(255,255,255,0.42)' }}
                    >
                      {conditionsSummary(coupon)}
                    </p>
                    {/* Validity */}
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={11}
                        strokeWidth={1.5}
                        style={{
                          color: 'rgba(255,255,255,0.25)',
                          flexShrink: 0,
                        }}
                      />
                      <p
                        className="text-[0.50rem] tracking-[0.04em]"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        {formatDate(coupon.validFrom)}
                        {coupon.expiresAt
                          ? ` → ${formatDate(coupon.expiresAt)}`
                          : ' → No expiry'}
                      </p>
                    </div>
                    {/* Per customer */}
                    {coupon.perCustomerLimit && (
                      <p
                        className="text-[0.48rem] tracking-[0.06em]"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        Max {coupon.perCustomerLimit} use
                        {coupon.perCustomerLimit !== 1 ? 's' : ''} per customer
                      </p>
                    )}
                  </div>

                  {/* Usage block */}
                  <div className="shrink-0 min-w-[180px]">
                    <div className="flex items-baseline justify-between mb-2">
                      <p
                        className="text-[0.48rem] tracking-[0.10em] uppercase"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        Usage
                      </p>
                      <p
                        className="text-[0.52rem] tabular-nums font-semibold"
                        style={{ color: 'rgba(255,255,255,0.60)' }}
                      >
                        {coupon.usedCount} / {coupon.maxUses ?? '∞'}
                        {usagePct !== null && ` (${usagePct}%)`}
                      </p>
                    </div>
                    {coupon.maxUses && (
                      <div
                        className="h-1.5 w-full mb-1"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, usagePct ?? 0)}%`,
                            background:
                              (usagePct ?? 0) >= 90
                                ? 'rgba(239,68,68,0.75)'
                                : (usagePct ?? 0) >= 70
                                  ? 'rgba(250,204,21,0.75)'
                                  : 'rgba(74,222,128,0.70)',
                          }}
                        />
                      </div>
                    )}
                    <div className="mt-3">
                      <PromoStatusPill status={coupon.status as PromoStatus} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Key Performance Stats ─────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
              {/* Total Uses */}
              <div
                className="flex-1 min-w-32.5 p-4"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-[1.05rem] font-semibold tabular-nums leading-none"
                  style={{ color: GOLD }}
                >
                  {kpi.totalUses.toLocaleString()}
                </p>
                <p
                  className="mt-1.5 text-[0.52rem] tracking-[0.04em] font-medium"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Times Applied
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  {usesTrendFlat ? (
                    <Minus
                      size={10}
                      strokeWidth={2}
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    />
                  ) : usesTrendUp ? (
                    <TrendingUp
                      size={10}
                      strokeWidth={2}
                      style={{ color: 'rgba(74,222,128,0.75)' }}
                    />
                  ) : (
                    <TrendingDown
                      size={10}
                      strokeWidth={2}
                      style={{ color: 'rgba(239,68,68,0.70)' }}
                    />
                  )}
                  <span
                    className="text-[0.44rem] tracking-[0.06em]"
                    style={{
                      color: usesTrendFlat
                        ? 'rgba(255,255,255,0.22)'
                        : usesTrendUp
                          ? 'rgba(74,222,128,0.75)'
                          : 'rgba(239,68,68,0.70)',
                    }}
                  >
                    {usesTrendFlat
                      ? 'No change'
                      : `${usesTrendUp ? '+' : ''}${kpi.usesTrend} vs prior period`}
                  </span>
                </div>
              </div>
              {/* Total Discount */}
              <div
                className="flex-1 min-w-[130px] p-4"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-[1.05rem] font-semibold tabular-nums leading-none"
                  style={{ color: 'rgba(239,68,68,0.80)' }}
                >
                  {formatNaira(kpi.totalDiscount)}
                </p>
                <p
                  className="mt-1.5 text-[0.52rem] tracking-[0.04em] font-medium"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Total Discount Given
                </p>
                <p
                  className="mt-0.5 text-[0.44rem]"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  Revenue impact
                </p>
              </div>
              {/* Revenue */}
              <div
                className="flex-1 min-w-[130px] p-4"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-[1.05rem] font-semibold tabular-nums leading-none"
                  style={{ color: 'rgba(74,222,128,0.85)' }}
                >
                  {formatNaira(kpi.totalRevenue)}
                </p>
                <p
                  className="mt-1.5 text-[0.52rem] tracking-[0.04em] font-medium"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Revenue from Orders
                </p>
                <p
                  className="mt-0.5 text-[0.44rem]"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  Orders using this code
                </p>
              </div>
              {/* Avg Order Value */}
              <div
                className="flex-1 min-w-[130px] p-4"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-[1.05rem] font-semibold tabular-nums leading-none"
                  style={{ color: 'rgba(250,204,21,0.85)' }}
                >
                  {formatNaira(kpi.avgOrderValue)}
                </p>
                <p
                  className="mt-1.5 text-[0.52rem] tracking-[0.04em] font-medium"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Avg Order Value
                </p>
                <p
                  className="mt-0.5 text-[0.44rem]"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  With this code applied
                </p>
              </div>
              {/* Conversion Rate */}
              <div
                className="flex-1 min-w-[130px] p-4"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-[1.05rem] font-semibold tabular-nums leading-none"
                  style={{ color: 'rgba(96,165,250,0.85)' }}
                >
                  {kpi.conversionRate}%
                </p>
                <p
                  className="mt-1.5 text-[0.52rem] tracking-[0.04em] font-medium"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Conversion Rate
                </p>
                <p
                  className="mt-0.5 text-[0.44rem]"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  Applied → Delivered
                </p>
              </div>
              {/* Unique Customers */}
              <div
                className="flex-1 min-w-[130px] p-4"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-[1.05rem] font-semibold tabular-nums leading-none"
                  style={{ color: 'rgba(167,139,250,0.85)' }}
                >
                  {kpi.uniqueCustomers}
                </p>
                <p
                  className="mt-1.5 text-[0.52rem] tracking-[0.04em] font-medium"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Unique Customers
                </p>
                <p
                  className="mt-0.5 text-[0.44rem]"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  Who used this code
                </p>
              </div>
            </div>

            {/* ── Two-column layout ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
              {/* ── LEFT column ──────────────────────────────────────────────── */}
              <div className="space-y-5">
                {/* ── Usage Over Time ────────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<BarChart2 size={14} strokeWidth={1.8} />}
                    label="Usage Over Time"
                  />

                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {/* Window toggle */}
                    <div
                      className="flex"
                      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {(
                        [
                          ['7', '7 Days'],
                          ['30', '30 Days'],
                          ['all', 'All Time'],
                        ] as [TimelineWindow, string][]
                      ).map(([val, lbl], i) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setWindow_(val)}
                          className="h-7 px-3 text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-100"
                          style={{
                            background:
                              window_ === val
                                ? `${GOLD_BG}0.12)`
                                : 'transparent',
                            color:
                              window_ === val ? GOLD : 'rgba(255,255,255,0.32)',
                            borderLeft:
                              i > 0
                                ? '1px solid rgba(255,255,255,0.07)'
                                : undefined,
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    {/* Metric toggle */}
                    <div
                      className="flex"
                      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {(
                        [
                          ['uses', 'Uses'],
                          ['discount', 'Discount'],
                          ['revenue', 'Revenue'],
                        ] as [TimelineMetric, string][]
                      ).map(([val, lbl], i) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setMetric(val)}
                          className="h-7 px-3 text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-100"
                          style={{
                            background:
                              metric === val
                                ? `${GOLD_BG}0.12)`
                                : 'transparent',
                            color:
                              metric === val ? GOLD : 'rgba(255,255,255,0.32)',
                            borderLeft:
                              i > 0
                                ? '1px solid rgba(255,255,255,0.07)'
                                : undefined,
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <MiniLineChart data={timeline} metric={metric} height={140} />

                  {/* Summary below chart */}
                  <div
                    className="flex flex-wrap gap-5 mt-4 pt-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {peakDay && (
                      <div>
                        <p
                          className="text-[0.44rem] tracking-[0.10em] uppercase mb-1"
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                        >
                          Peak Day
                        </p>
                        <p
                          className="text-[0.54rem] tracking-[0.04em] font-medium"
                          style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                          {formatDate(peakDay.date)} — {peakDay.uses} use
                          {peakDay.uses !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    <div>
                      <p
                        className="text-[0.44rem] tracking-[0.10em] uppercase mb-1"
                        style={{ color: 'rgba(255,255,255,0.20)' }}
                      >
                        Avg Daily Uses
                      </p>
                      <p
                        className="text-[0.54rem] tracking-[0.04em] font-medium"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                      >
                        {avgDailyUses} uses/day
                      </p>
                    </div>
                    {coupon.expiresAt && !isExpired && (
                      <div>
                        <p
                          className="text-[0.44rem] tracking-[0.10em] uppercase mb-1"
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                        >
                          Days Remaining
                        </p>
                        <p
                          className="text-[0.54rem] tracking-[0.04em] font-medium"
                          style={{ color: GOLD }}
                        >
                          {Math.max(
                            0,
                            Math.ceil(
                              (new Date(coupon.expiresAt).getTime() -
                                Date.now()) /
                                86400000,
                            ),
                          )}{' '}
                          days
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* ── Top Products ───────────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<Package size={14} strokeWidth={1.8} />}
                    label="Top Products Ordered with This Code"
                  />
                  {topProducts.length === 0 ? (
                    <p
                      className="text-[0.52rem] tracking-[0.08em]"
                      style={{ color: 'rgba(255,255,255,0.18)' }}
                    >
                      No product data yet.
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {topProducts.map((p, idx) => (
                        <div
                          key={p._id}
                          className="flex items-center gap-4 py-3.5"
                          style={{
                            borderBottom:
                              idx < topProducts.length - 1
                                ? '1px solid rgba(255,255,255,0.04)'
                                : undefined,
                          }}
                        >
                          {/* Rank */}
                          <span
                            className="text-[0.52rem] font-semibold tabular-nums w-5 shrink-0 text-center"
                            style={{
                              color:
                                idx === 0 ? GOLD : 'rgba(255,255,255,0.22)',
                            }}
                          >
                            {idx + 1}
                          </span>
                          {/* Thumbnail */}
                          {p.image ? (
                            <Image
                              src={p.image}
                              alt={p.name}
                              width={36}
                              height={36}
                              className="object-cover shrink-0"
                              style={{
                                border: '1px solid rgba(255,255,255,0.06)',
                              }}
                            />
                          ) : (
                            <div
                              className="w-9 h-9 flex items-center justify-center shrink-0"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                              }}
                            >
                              <Package
                                size={14}
                                strokeWidth={1.5}
                                style={{ color: 'rgba(255,255,255,0.18)' }}
                              />
                            </div>
                          )}
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[0.54rem] tracking-[0.04em] font-medium truncate"
                              style={{ color: 'rgba(255,255,255,0.75)' }}
                            >
                              {p.name}
                            </p>
                            {p.size && (
                              <p
                                className="text-[0.44rem] tracking-[0.06em] mt-0.5"
                                style={{ color: 'rgba(255,255,255,0.28)' }}
                              >
                                {p.size}
                              </p>
                            )}
                          </div>
                          {/* Stats */}
                          <div className="text-right shrink-0">
                            <p
                              className="text-[0.52rem] tabular-nums font-semibold"
                              style={{ color: 'rgba(255,255,255,0.65)' }}
                            >
                              {p.count}× ordered
                            </p>
                            <p
                              className="text-[0.44rem] tabular-nums mt-0.5"
                              style={{ color: 'rgba(255,255,255,0.28)' }}
                            >
                              {formatNaira(p.revenue)}
                            </p>
                          </div>
                          {/* Link */}
                          <Link
                            href={`/admin/products`}
                            className="flex items-center justify-center w-7 h-7 shrink-0 transition-colors duration-100"
                            style={{
                              color: 'rgba(255,255,255,0.22)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                'rgba(255,255,255,0.65)';
                              e.currentTarget.style.borderColor =
                                'rgba(255,255,255,0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                'rgba(255,255,255,0.22)';
                              e.currentTarget.style.borderColor =
                                'rgba(255,255,255,0.06)';
                            }}
                          >
                            <Eye size={12} strokeWidth={1.8} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* ── Orders Table ───────────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<ShoppingBag size={14} strokeWidth={1.8} />}
                    label="Orders Using This Code"
                    action={
                      <Link
                        href={`/admin/orders?couponCode=${coupon.code}`}
                        className="flex items-center gap-1 text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-100"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = GOLD)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            'rgba(255,255,255,0.28)')
                        }
                      >
                        View All <ChevronRight size={10} strokeWidth={2} />
                      </Link>
                    }
                  />
                  {!ordersData || ordersData.list.length === 0 ? (
                    <p
                      className="text-[0.52rem] tracking-[0.08em]"
                      style={{ color: 'rgba(255,255,255,0.18)' }}
                    >
                      No orders yet.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: '640px' }}>
                          <thead>
                            <tr
                              style={{
                                borderBottom:
                                  '1px solid rgba(255,255,255,0.04)',
                              }}
                            >
                              {[
                                'Order',
                                'Customer',
                                'Order Total',
                                'Discount',
                                'Final Amount',
                                'Date',
                                'Status',
                                '',
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-3 py-2.5 text-left text-[0.44rem] tracking-[0.14em] uppercase font-semibold"
                                  style={{ color: 'rgba(255,255,255,0.18)' }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ordersData.list.map((o) => (
                              <tr
                                key={o._id}
                                style={{
                                  borderBottom:
                                    '1px solid rgba(255,255,255,0.03)',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    'rgba(255,255,255,0.015)')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    'transparent')
                                }
                              >
                                <td className="px-3 py-3">
                                  <Link
                                    href={`/admin/orders/${o._id}`}
                                    className="text-[0.52rem] tracking-[0.06em] font-medium transition-colors duration-100"
                                    style={{ color: GOLD }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.textDecoration =
                                        'underline')
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.textDecoration =
                                        'none')
                                    }
                                  >
                                    {o.orderNumber}
                                  </Link>
                                </td>
                                <td className="px-3 py-3">
                                  <p
                                    className="text-[0.52rem] tracking-[0.04em]"
                                    style={{ color: 'rgba(255,255,255,0.65)' }}
                                  >
                                    {o.contact.firstName} {o.contact.lastName}
                                  </p>
                                  <p
                                    className="text-[0.44rem] tracking-[0.04em] mt-0.5"
                                    style={{ color: 'rgba(255,255,255,0.28)' }}
                                  >
                                    {o.contact.email}
                                  </p>
                                </td>
                                <td
                                  className="px-3 py-3 tabular-nums text-[0.52rem]"
                                  style={{ color: 'rgba(255,255,255,0.50)' }}
                                >
                                  {formatNaira(o.orderTotal)}
                                </td>
                                <td
                                  className="px-3 py-3 tabular-nums text-[0.52rem]"
                                  style={{ color: 'rgba(239,68,68,0.70)' }}
                                >
                                  −{formatNaira(o.discountApplied)}
                                </td>
                                <td
                                  className="px-3 py-3 tabular-nums text-[0.52rem] font-semibold"
                                  style={{ color: 'rgba(255,255,255,0.72)' }}
                                >
                                  {formatNaira(o.finalAmount)}
                                </td>
                                <td
                                  className="px-3 py-3 text-[0.50rem]"
                                  style={{ color: 'rgba(255,255,255,0.35)' }}
                                >
                                  {formatDate(o.date)}
                                </td>
                                <td className="px-3 py-3">
                                  <OrderStatusPill status={o.status} />
                                </td>
                                <td className="px-3 py-3">
                                  <Link
                                    href={`/admin/orders/${o._id}`}
                                    className="flex items-center justify-center w-6 h-6 transition-colors duration-100"
                                    style={{
                                      color: 'rgba(255,255,255,0.22)',
                                      border:
                                        '1px solid rgba(255,255,255,0.06)',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color =
                                        'rgba(255,255,255,0.65)';
                                      e.currentTarget.style.borderColor =
                                        'rgba(255,255,255,0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color =
                                        'rgba(255,255,255,0.22)';
                                      e.currentTarget.style.borderColor =
                                        'rgba(255,255,255,0.06)';
                                    }}
                                  >
                                    <Eye size={11} strokeWidth={1.8} />
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Load more */}
                      {ordersData.list.length < ordersData.total && (
                        <div className="mt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={loadMoreOrders}
                            disabled={ordersLoading}
                            className="flex items-center gap-2 h-8 px-5 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'rgba(255,255,255,0.38)',
                              cursor: ordersLoading ? 'wait' : 'pointer',
                            }}
                          >
                            {ordersLoading ? (
                              <Loader2
                                size={11}
                                strokeWidth={1.8}
                                className="animate-spin"
                              />
                            ) : (
                              <ChevronDown size={11} strokeWidth={2} />
                            )}
                            Load More (
                            {ordersData.total - ordersData.list.length}{' '}
                            remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </SectionCard>

                {/* ── Customers Table ────────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<Users size={14} strokeWidth={1.8} />}
                    label="Customers Who Used This Code"
                    action={
                      <GhostBtn
                        icon={<Download size={11} strokeWidth={1.8} />}
                        label="Export List"
                        onClick={() => {
                          if (!customersData) return;
                          const csv = [
                            'Name,Email,Date Used,Order Amount,Discount Received',
                            ...customersData.list.map(
                              (c) =>
                                `"${c.firstName} ${c.lastName}",${c.email},${formatDate(c.dateUsed)},${c.orderAmount},${c.discountReceived}`,
                            ),
                          ].join('\n');
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          Object.assign(document.createElement('a'), {
                            href: url,
                            download: `${coupon.code}-customers.csv`,
                          }).click();
                          URL.revokeObjectURL(url);
                        }}
                      />
                    }
                  />
                  {!customersData || customersData.list.length === 0 ? (
                    <p
                      className="text-[0.52rem] tracking-[0.08em]"
                      style={{ color: 'rgba(255,255,255,0.18)' }}
                    >
                      No customers yet.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-0">
                        {customersData.list.map((c) => (
                          <div
                            key={c.email}
                            className="flex items-center gap-3 py-3"
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            {/* Avatar */}
                            <div
                              className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 text-[0.52rem] font-semibold"
                              style={{
                                background: `${GOLD_BG}0.14)`,
                                color: GOLD,
                                border: `1px solid ${GOLD_BG}0.24)`,
                              }}
                            >
                              {getInitials(c.firstName, c.lastName)}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[0.54rem] tracking-[0.04em] font-medium truncate"
                                style={{ color: 'rgba(255,255,255,0.72)' }}
                              >
                                {c.firstName} {c.lastName}
                              </p>
                              <p
                                className="text-[0.44rem] tracking-[0.04em] mt-0.5 truncate"
                                style={{ color: 'rgba(255,255,255,0.30)' }}
                              >
                                {c.email}
                              </p>
                            </div>
                            {/* Date */}
                            <div className="text-right shrink-0">
                              <p
                                className="text-[0.48rem] tracking-[0.04em]"
                                style={{ color: 'rgba(255,255,255,0.35)' }}
                              >
                                {formatDate(c.dateUsed)}
                              </p>
                              <p
                                className="text-[0.44rem] tabular-nums mt-0.5"
                                style={{ color: 'rgba(255,255,255,0.25)' }}
                              >
                                {formatNaira(c.orderAmount)} → −
                                {formatNaira(c.discountReceived)}
                              </p>
                            </div>
                            {/* Link */}
                            {c.userId && (
                              <Link
                                href={`/admin/customers/${c.userId}`}
                                className="flex items-center justify-center w-7 h-7 shrink-0 transition-colors duration-100"
                                style={{
                                  color: 'rgba(255,255,255,0.22)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = GOLD;
                                  e.currentTarget.style.borderColor = `${GOLD_BG}0.22)`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color =
                                    'rgba(255,255,255,0.22)';
                                  e.currentTarget.style.borderColor =
                                    'rgba(255,255,255,0.06)';
                                }}
                              >
                                <Eye size={11} strokeWidth={1.8} />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Load more */}
                      {customersData.list.length < customersData.total && (
                        <div className="mt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={loadMoreCustomers}
                            disabled={customersLoading}
                            className="flex items-center gap-2 h-8 px-5 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'rgba(255,255,255,0.38)',
                              cursor: customersLoading ? 'wait' : 'pointer',
                            }}
                          >
                            {customersLoading ? (
                              <Loader2
                                size={11}
                                strokeWidth={1.8}
                                className="animate-spin"
                              />
                            ) : (
                              <ChevronDown size={11} strokeWidth={2} />
                            )}
                            Load More (
                            {customersData.total - customersData.list.length}{' '}
                            remaining)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </SectionCard>

                {/* ── Failed Applications ────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<AlertTriangle size={14} strokeWidth={1.8} />}
                    label="Failed Application Attempts"
                  />
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <AlertTriangle
                      size={13}
                      strokeWidth={1.5}
                      style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0 }}
                    />
                    <p
                      className="text-[0.50rem] tracking-[0.06em]"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      Failed application logging requires a dedicated event
                      store. Connect a{' '}
                      <code className="font-mono">PromoApplicationLog</code>{' '}
                      model to populate this section.
                    </p>
                  </div>
                </SectionCard>
              </div>

              {/* ── RIGHT column ─────────────────────────────────────────────── */}
              <div className="space-y-5">
                {/* ── Customer Breakdown ─────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<Users size={14} strokeWidth={1.8} />}
                    label="Customer Breakdown"
                  />
                  <div className="space-y-6">
                    <DonutChart
                      title="New vs Returning"
                      slices={[
                        {
                          label: 'New customers',
                          value: segments.newCustomers,
                          pct: segments.newPct,
                          color: 'rgba(74,222,128,0.75)',
                        },
                        {
                          label: 'Returning customers',
                          value: segments.returningCustomers,
                          pct: 100 - segments.newPct,
                          color: 'rgba(255,255,255,0.12)',
                        },
                      ]}
                    />
                    <DonutChart
                      title="Account Verification"
                      slices={[
                        {
                          label: 'Verified',
                          value: segments.verifiedCustomers,
                          pct: segments.verifiedPct,
                          color: 'rgba(96,165,250,0.75)',
                        },
                        {
                          label: 'Unverified',
                          value: segments.unverifiedCustomers,
                          pct: 100 - segments.verifiedPct,
                          color: 'rgba(255,255,255,0.12)',
                        },
                      ]}
                    />
                    <DonutChart
                      title="Payment Method"
                      slices={[
                        {
                          label: 'Paystack',
                          value: segments.paystackOrders,
                          pct: segments.paystackPct,
                          color: GOLD,
                        },
                        {
                          label: 'Bank Transfer',
                          value: segments.bankTransferOrders,
                          pct: 100 - segments.paystackPct,
                          color: 'rgba(255,255,255,0.12)',
                        },
                      ]}
                    />
                  </div>
                </SectionCard>

                {/* ── Activity Log ───────────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<Activity size={14} strokeWidth={1.8} />}
                    label="Activity Log"
                  />
                  {activityLog.length === 0 ? (
                    <p
                      className="text-[0.52rem] tracking-[0.08em]"
                      style={{ color: 'rgba(255,255,255,0.18)' }}
                    >
                      No activity recorded.
                    </p>
                  ) : (
                    <div className="relative pl-5">
                      {/* Vertical line */}
                      <div
                        className="absolute left-[7px] top-0 bottom-0 w-px"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      />
                      <div className="space-y-5">
                        {activityLog.map((event, idx) => (
                          <div key={event.id} className="relative">
                            {/* Dot */}
                            <div
                              className="absolute left-[-15px] top-[3px] w-[10px] h-[10px] flex items-center justify-center"
                              style={{ zIndex: 1 }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background: event.isSystem
                                    ? 'rgba(250,204,21,0.60)'
                                    : GOLD,
                                }}
                              />
                            </div>
                            <p
                              className="text-[0.54rem] tracking-[0.04em] font-medium leading-snug"
                              style={{ color: 'rgba(255,255,255,0.70)' }}
                            >
                              {event.label}
                            </p>
                            <p
                              className="mt-0.5 text-[0.44rem] tracking-[0.04em]"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              {event.isSystem ? 'System' : event.actor} ·{' '}
                              {formatDateTime(event.date)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p
                    className="mt-5 text-[0.42rem] tracking-[0.08em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.14)' }}
                  >
                    Immutable — activity log cannot be modified
                  </p>
                </SectionCard>

                {/* ── Code details card ──────────────────────────────────────── */}
                <SectionCard>
                  <SectionHeading
                    icon={<Tag size={14} strokeWidth={1.8} />}
                    label="Code Details"
                  />
                  <div className="space-y-0">
                    {[
                      {
                        label: 'Code',
                        value: (
                          <span className="font-mono font-bold">
                            {coupon.code}
                          </span>
                        ),
                      },
                      { label: 'Type', value: coupon.type },
                      { label: 'Discount', value: discountLabel(coupon) },
                      { label: 'Apply To', value: coupon.applyTo },
                      {
                        label: 'Max Uses',
                        value: coupon.maxUses ?? 'Unlimited',
                      },
                      {
                        label: 'Per Customer',
                        value: coupon.perCustomerLimit ?? 'Unlimited',
                      },
                      {
                        label: 'Single Use',
                        value: coupon.singleUse ? 'Yes' : 'No',
                      },
                      {
                        label: 'Valid From',
                        value: formatDate(coupon.validFrom),
                      },
                      {
                        label: 'Expires',
                        value: coupon.expiresAt
                          ? formatDate(coupon.expiresAt)
                          : 'No expiry',
                      },
                      {
                        label: 'Combinable',
                        value: coupon.combinableWithCodes
                          ? 'With other codes'
                          : 'Not stackable',
                      },
                      {
                        label: 'On Sale Items',
                        value: coupon.combinableWithSales
                          ? 'Allowed'
                          : 'Not allowed',
                      },
                      { label: 'Created', value: formatDate(coupon.createdAt) },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-4 py-2.5"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <span
                          className="text-[0.46rem] tracking-[0.14em] uppercase shrink-0 pt-0.5"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-[0.54rem] tracking-[0.04em] text-right"
                          style={{ color: 'rgba(255,255,255,0.65)' }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
