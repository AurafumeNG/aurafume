'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  Copy,
  Check,
  Eye,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Archive,
  Plus,
  Tag,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Types ──────────────────────────────────────────────────────────────────────

type PromoStatus = 'active' | 'scheduled' | 'expired' | 'disabled';
type PromoType = 'pct' | 'flat' | 'free-shipping' | 'buy-x-get-y';
type PromoEligibility = 'all' | 'first-order' | 'specific' | 'min-spend';
type PromoUsage = 'unused' | 'partial' | 'full';
type PromoExpiry = 'this-week' | 'this-month' | 'no-expiry';
type SortKey =
  | 'newest'
  | 'oldest'
  | 'most-used'
  | 'least-used'
  | 'expiry-soonest'
  | 'expiry-latest'
  | 'discount-desc'
  | 'discount-asc';

interface AdminPromoCode {
  _id: string;
  code: string;
  description: string;
  type: PromoType;
  value: number;
  label: string;
  minOrderAmount: number;
  firstOrderOnly: boolean;
  perCustomerLimit: number | null;
  maxUses: number | null;
  usedCount: number;
  revenueImpact: number;
  status: PromoStatus;
  validFrom: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromoStats {
  total: number;
  active: number;
  expired: number;
  scheduled: number;
  totalUsesThisMonth: number;
  discountThisMonth: number;
  topCode: string;
}

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

// ── Options ────────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-used', label: 'Most Used' },
  { value: 'least-used', label: 'Least Used' },
  { value: 'expiry-soonest', label: 'Expiry: Soonest' },
  { value: 'expiry-latest', label: 'Expiry: Latest' },
  { value: 'discount-desc', label: 'Discount: High–Low' },
  { value: 'discount-asc', label: 'Discount: Low–High' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
  { value: 'disabled', label: 'Disabled' },
] as const;

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'pct', label: 'Percentage' },
  { value: 'flat', label: 'Fixed Amount' },
  { value: 'free-shipping', label: 'Free Shipping' },
  { value: 'buy-x-get-y', label: 'Buy X Get Y' },
] as const;

const ELIGIBILITY_OPTIONS = [
  { value: '', label: 'All Eligibility' },
  { value: 'all', label: 'All Customers' },
  { value: 'first-order', label: 'First Order Only' },
  { value: 'specific', label: 'Specific Customers' },
  { value: 'min-spend', label: 'Minimum Spend' },
] as const;

const USAGE_OPTIONS = [
  { value: '', label: 'All Usage' },
  { value: 'unused', label: 'Unused' },
  { value: 'partial', label: 'Partially Used' },
  { value: 'full', label: 'Fully Used' },
] as const;

const EXPIRY_OPTIONS = [
  { value: '', label: 'All Expiry' },
  { value: 'this-week', label: 'Expiring This Week' },
  { value: 'this-month', label: 'Expiring This Month' },
  { value: 'no-expiry', label: 'No Expiry' },
] as const;

const BULK_ACTIONS = [
  { value: 'enable', label: 'Enable Selected' },
  { value: 'disable', label: 'Disable Selected' },
  { value: 'archive', label: 'Archive Selected (no usage only)' },
  { value: 'export', label: 'Export Selected as CSV' },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(iso: string | null) {
  if (!iso) return 'No Expiry';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDiscountLabel(code: AdminPromoCode): string {
  if (code.type === 'pct') return `${code.value}%`;
  if (code.type === 'flat') return `${formatNaira(code.value)} off`;
  if (code.type === 'free-shipping') return 'Free';
  return `Buy ${code.value} Get 1`;
}

function exportCodesToCSV(codes: AdminPromoCode[]) {
  const headers = [
    'Code',
    'Description',
    'Type',
    'Value',
    'Min Order (₦)',
    'First Order Only',
    'Max Uses/Customer',
    'Max Uses',
    'Used Count',
    'Revenue Impact (₦)',
    'Status',
    'Valid From',
    'Expires At',
    'Created At',
  ];
  const rows = codes.map((c) => [
    c.code,
    `"${c.description}"`,
    c.type,
    c.value,
    c.minOrderAmount ?? 0,
    c.firstOrderOnly ? 'Yes' : 'No',
    c.perCustomerLimit ?? 'Unlimited',
    c.maxUses ?? 'Unlimited',
    c.usedCount,
    c.revenueImpact,
    c.status,
    formatDate(c.validFrom),
    formatDate(c.expiresAt),
    formatDate(c.createdAt),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `aurafumeng-promo-codes-${Date.now()}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ── FilterDropdown ─────────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== '' && value !== 'All';
  const currentLabel = options.find((o) => o.value === value)?.label ?? label;
  const displayLabel = active ? `${label}: ${currentLabel}` : label;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-[0.56rem] tracking-[0.10em] transition-colors duration-150"
        style={{
          border: `1px solid ${active ? 'rgba(180,130,60,0.30)' : 'rgba(255,255,255,0.08)'}`,
          background: active
            ? 'rgba(180,130,60,0.08)'
            : 'rgba(255,255,255,0.02)',
          color: active ? GOLD : 'rgba(255,255,255,0.45)',
        }}
      >
        <span>{displayLabel}</span>
        <ChevronDown
          size={11}
          strokeWidth={2}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[180px] py-1"
            style={{
              background: '#1E1E1E',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
            }}
          >
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                  style={{
                    color: selected ? GOLD : 'rgba(255,255,255,0.52)',
                    background: selected
                      ? 'rgba(180,130,60,0.08)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.78)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.52)';
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

// ── SortDropdown ───────────────────────────────────────────────────────────────

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort';

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-[0.56rem] tracking-[0.10em] transition-colors duration-150"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        <span>{currentLabel}</span>
        <ChevronDown
          size={11}
          strokeWidth={2}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-[calc(100%+4px)] right-0 z-50 min-w-[190px] py-1"
            style={{
              background: '#1E1E1E',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
            }}
          >
            {SORT_OPTIONS.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                  style={{
                    color: selected ? GOLD : 'rgba(255,255,255,0.52)',
                    background: selected
                      ? 'rgba(180,130,60,0.08)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.78)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.52)';
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

// ── HeaderButton ───────────────────────────────────────────────────────────────

function HeaderButton({
  icon,
  label,
  accent,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const cls =
    'flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150';
  const style = accent
    ? {
        background: hovered ? 'rgba(180,130,60,0.22)' : 'rgba(180,130,60,0.12)',
        color: GOLD,
        border: `1px solid ${hovered ? 'rgba(180,130,60,0.45)' : 'rgba(180,130,60,0.28)'}`,
      }
    : {
        background: hovered
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(255,255,255,0.02)',
        color: hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      };

  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button
      onClick={onClick}
      className={cls}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

type StatColor =
  | 'neutral'
  | 'amber'
  | 'red'
  | 'green'
  | 'gold'
  | 'gray'
  | 'blue';

function StatCard({
  value,
  label,
  sub,
  color,
  onClick,
}: {
  value: string;
  label: string;
  sub: string;
  color: StatColor;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const colorMap: Record<StatColor, { accent: string; dot: string }> = {
    neutral: {
      accent: 'rgba(255,255,255,0.55)',
      dot: 'rgba(255,255,255,0.20)',
    },
    amber: { accent: 'rgba(250,204,21,0.85)', dot: 'rgba(234,179,8,0.60)' },
    red: { accent: 'rgba(239,68,68,0.85)', dot: 'rgba(239,68,68,0.60)' },
    green: { accent: 'rgba(74,222,128,0.85)', dot: 'rgba(34,197,94,0.55)' },
    gold: { accent: GOLD, dot: 'rgba(180,130,60,0.50)' },
    gray: { accent: 'rgba(156,163,175,0.75)', dot: 'rgba(107,114,128,0.55)' },
    blue: { accent: 'rgba(96,165,250,0.85)', dot: 'rgba(59,130,246,0.55)' },
  };

  const c = colorMap[color];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && onClick ? 'rgba(255,255,255,0.025)' : '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.12s, border-color 0.12s',
        flex: '1 1 150px',
        minWidth: '130px',
        padding: '16px 18px',
      }}
    >
      <p
        className="text-[1.05rem] font-semibold tracking-tight tabular-nums leading-none"
        style={{ color: c.accent }}
      >
        {value}
      </p>
      <p
        className="mt-1.5 text-[0.56rem] tracking-[0.04em] font-medium"
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-[0.44rem] tracking-[0.08em]"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        {sub}
      </p>
      {onClick && (
        <p
          className="mt-2 text-[0.44rem] tracking-[0.10em] uppercase"
          style={{ color: c.dot }}
        >
          Click to filter →
        </p>
      )}
    </div>
  );
}

// ── Checkbox ───────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-center justify-center w-4 h-4 shrink-0 transition-colors duration-100"
      style={{ color: checked ? GOLD : 'rgba(255,255,255,0.20)' }}
    >
      {checked ? (
        <CheckSquare size={14} strokeWidth={1.8} />
      ) : (
        <Square size={14} strokeWidth={1.5} />
      )}
    </button>
  );
}

// ── PromoTypeBadge ─────────────────────────────────────────────────────────────

function PromoTypeBadge({ type }: { type: PromoType }) {
  const cfg: Record<
    PromoType,
    { label: string; bg: string; color: string; border: string }
  > = {
    pct: {
      label: 'Percentage Off',
      bg: 'rgba(139,92,246,0.10)',
      color: 'rgba(167,139,250,0.85)',
      border: 'rgba(139,92,246,0.22)',
    },
    flat: {
      label: 'Fixed Amount Off',
      bg: 'rgba(59,130,246,0.10)',
      color: 'rgba(96,165,250,0.85)',
      border: 'rgba(59,130,246,0.22)',
    },
    'free-shipping': {
      label: 'Free Shipping',
      bg: 'rgba(20,184,166,0.10)',
      color: 'rgba(45,212,191,0.85)',
      border: 'rgba(20,184,166,0.22)',
    },
    'buy-x-get-y': {
      label: 'Buy X Get Y',
      bg: 'rgba(249,115,22,0.10)',
      color: 'rgba(251,146,60,0.85)',
      border: 'rgba(249,115,22,0.22)',
    },
  };
  const c = cfg[type];
  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.44rem] tracking-[0.10em] uppercase font-semibold whitespace-nowrap"
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

// ── PromoStatusPill ────────────────────────────────────────────────────────────

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
      {c.label}
    </span>
  );
}

// ── UsageBar ───────────────────────────────────────────────────────────────────

function UsageBar({ used, max }: { used: number; max: number | null }) {
  const pct = max && max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const full = max !== null && used >= max;
  const color = full
    ? 'rgba(239,68,68,0.75)'
    : pct > 70
      ? 'rgba(250,204,21,0.75)'
      : 'rgba(74,222,128,0.70)';

  return (
    <div className="space-y-1 min-w-[90px]">
      <p
        className="text-[0.50rem] tracking-[0.06em] tabular-nums"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        {used.toLocaleString()} / {max === null ? '∞' : max.toLocaleString()}{' '}
        uses
      </p>
      {max !== null && (
        <div
          className="h-1 w-full"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      )}
    </div>
  );
}

// ── CodeCopyButton ─────────────────────────────────────────────────────────────

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy code"
      className="flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-100"
      style={{
        color: copied ? 'rgba(74,222,128,0.80)' : 'rgba(255,255,255,0.22)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,0.58)';
      }}
      onMouseLeave={(e) => {
        if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,0.22)';
      }}
    >
      {copied ? (
        <Check size={11} strokeWidth={2.2} />
      ) : (
        <Copy size={11} strokeWidth={1.8} />
      )}
    </button>
  );
}

// ── ConditionTags ──────────────────────────────────────────────────────────────

function ConditionTags({ code }: { code: AdminPromoCode }) {
  const tags: string[] = [];
  if (code.minOrderAmount) tags.push(`Min ${formatNaira(code.minOrderAmount)}`);
  if (code.firstOrderOnly) tags.push('First order');
  if (code.perCustomerLimit != null)
    tags.push(`Max ${code.perCustomerLimit}/customer`);
  if (!tags.length)
    return (
      <span
        className="text-[0.46rem]"
        style={{ color: 'rgba(255,255,255,0.20)' }}
      >
        —
      </span>
    );
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center h-4 px-1.5 text-[0.42rem] tracking-[0.08em] whitespace-nowrap"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.38)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ── PaginationBtn ──────────────────────────────────────────────────────────────

function PaginationBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-0.5 h-7 px-2.5 transition-colors duration-100"
      style={{
        background: active ? 'rgba(180,130,60,0.14)' : 'transparent',
        color: active
          ? GOLD
          : disabled
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(255,255,255,0.38)',
        border: `1px solid ${active ? 'rgba(180,130,60,0.28)' : 'rgba(255,255,255,0.06)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        marginLeft: '-1px',
      }}
    >
      {children}
    </button>
  );
}

// ── PromoCodeRow ───────────────────────────────────────────────────────────────

function PromoCodeRow({
  code,
  selected,
  onToggle,
  onToggleStatus,
  onDuplicate,
  onArchive,
}: {
  code: AdminPromoCode;
  selected: boolean;
  onToggle: () => void;
  onToggleStatus: (id: string, enable: boolean) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}) {
  const [hovered, setHovered] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    right: number;
  }>({ top: 0, right: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!actionsOpen) return;
    function handle(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node))
        setActionsOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [actionsOpen]);

  function openActions() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setActionsOpen((o) => !o);
  }

  async function handleToggleStatus() {
    setToggling(true);
    await onToggleStatus(code._id, code.status === 'disabled');
    setToggling(false);
  }

  async function handleDuplicate() {
    setDuplicating(true);
    await onDuplicate(code._id);
    setDuplicating(false);
  }

  async function handleArchive() {
    setArchiving(true);
    await onArchive(code._id);
    setArchiving(false);
  }

  const canArchive = code.usedCount === 0;

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected
          ? 'rgba(180,130,60,0.04)'
          : hovered
            ? 'rgba(255,255,255,0.015)'
            : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.10s',
      }}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-8">
        <Checkbox checked={selected} onChange={onToggle} />
      </td>

      {/* Code */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[0.56rem] tracking-[0.12em] font-bold font-mono whitespace-nowrap"
            style={{ color: 'rgba(255,255,255,0.88)' }}
          >
            {code.code}
          </span>
          <CodeCopyButton code={code.code} />
        </div>
      </td>

      {/* Description */}
      <td className="px-4 py-3 max-w-[160px]">
        <p
          className="text-[0.52rem] tracking-[0.04em] line-clamp-2"
          style={{ color: 'rgba(255,255,255,0.42)' }}
        >
          {code.description || '—'}
        </p>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <PromoTypeBadge type={code.type} />
      </td>

      {/* Discount Value */}
      <td className="px-4 py-3">
        <p
          className="text-[0.56rem] tracking-[0.04em] font-semibold tabular-nums whitespace-nowrap"
          style={{ color: GOLD }}
        >
          {getDiscountLabel(code)}
        </p>
      </td>

      {/* Conditions */}
      <td className="px-4 py-3">
        <ConditionTags code={code} />
      </td>

      {/* Usage */}
      <td className="px-4 py-3">
        <UsageBar used={code.usedCount} max={code.maxUses} />
      </td>

      {/* Revenue Impact */}
      <td className="px-4 py-3">
        <p
          className="text-[0.52rem] tracking-[0.04em] tabular-nums whitespace-nowrap"
          style={{ color: 'rgba(239,68,68,0.72)' }}
        >
          {code.revenueImpact > 0 ? `−${formatNaira(code.revenueImpact)}` : '—'}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <PromoStatusPill status={code.status} />
      </td>

      {/* Valid From */}
      <td className="px-4 py-3">
        <p
          className="text-[0.50rem] tracking-[0.04em] whitespace-nowrap"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          {formatDate(code.validFrom)}
        </p>
      </td>

      {/* Expires */}
      <td className="px-4 py-3">
        <p
          className="text-[0.50rem] tracking-[0.04em] whitespace-nowrap"
          style={{
            color: code.expiresAt
              ? 'rgba(255,255,255,0.38)'
              : 'rgba(255,255,255,0.18)',
          }}
        >
          {code.expiresAt ? formatDate(code.expiresAt) : 'No Expiry'}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* View Analytics */}
          <Link
            href={`/admin/promos/${code._id}`}
            title="View analytics"
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{
              color: 'rgba(255,255,255,0.28)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.72)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            <Eye size={12} strokeWidth={1.8} />
          </Link>

          {/* Edit */}
          <Link
            href={`/admin/promos/${code._id}/edit`}
            title="Edit promo code"
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{
              color: 'rgba(255,255,255,0.28)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = GOLD;
              e.currentTarget.style.background = 'rgba(180,130,60,0.06)';
              e.currentTarget.style.borderColor = 'rgba(180,130,60,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            <Edit2 size={12} strokeWidth={1.8} />
          </Link>

          {/* More Actions dropdown */}
          <div ref={actionsRef}>
            <button
              ref={triggerRef}
              onClick={openActions}
              title="More actions"
              className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
              style={{
                color: actionsOpen ? GOLD : 'rgba(255,255,255,0.28)',
                background: actionsOpen
                  ? 'rgba(180,130,60,0.06)'
                  : 'transparent',
                border: `1px solid ${actionsOpen ? 'rgba(180,130,60,0.18)' : 'rgba(255,255,255,0.06)'}`,
              }}
              onMouseEnter={(e) => {
                if (!actionsOpen) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.72)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                }
              }}
              onMouseLeave={(e) => {
                if (!actionsOpen) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }
              }}
            >
              <ChevronDown size={11} strokeWidth={1.8} />
            </button>
            <AnimatePresence>
              {actionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="fixed z-[200] py-1 min-w-[170px]"
                  style={{
                    top: dropdownPos.top,
                    right: dropdownPos.right,
                    background: '#1C1C1C',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.50)',
                  }}
                >
                  {/* Duplicate */}
                  <button
                    onClick={() => {
                      handleDuplicate();
                      setActionsOpen(false);
                    }}
                    disabled={duplicating}
                    className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.54rem] tracking-[0.08em] transition-colors duration-100"
                    style={{
                      color: 'rgba(255,255,255,0.52)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.80)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.52)';
                    }}
                  >
                    {duplicating ? (
                      <Loader2
                        size={11}
                        strokeWidth={1.8}
                        className="animate-spin shrink-0"
                      />
                    ) : (
                      <Copy size={11} strokeWidth={1.8} className="shrink-0" />
                    )}
                    Duplicate
                  </button>

                  {/* Disable / Enable */}
                  <button
                    onClick={() => {
                      handleToggleStatus();
                      setActionsOpen(false);
                    }}
                    disabled={toggling || code.status === 'expired'}
                    className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.54rem] tracking-[0.08em] transition-colors duration-100"
                    style={{
                      color: 'rgba(255,255,255,0.52)',
                      background: 'transparent',
                      cursor:
                        code.status === 'expired' ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (code.status !== 'expired') {
                        e.currentTarget.style.background =
                          'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.80)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.52)';
                    }}
                  >
                    {toggling ? (
                      <Loader2
                        size={11}
                        strokeWidth={1.8}
                        className="animate-spin shrink-0"
                      />
                    ) : code.status === 'disabled' ? (
                      <ToggleRight
                        size={11}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />
                    ) : (
                      <ToggleLeft
                        size={11}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />
                    )}
                    {code.status === 'disabled' ? 'Enable' : 'Disable'}
                  </button>

                  {/* Archive */}
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      marginTop: '4px',
                      paddingTop: '4px',
                    }}
                  >
                    <button
                      onClick={() => {
                        if (canArchive) {
                          handleArchive();
                          setActionsOpen(false);
                        }
                      }}
                      disabled={!canArchive || archiving}
                      className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.54rem] tracking-[0.08em] transition-colors duration-100"
                      style={{
                        color: canArchive
                          ? 'rgba(239,68,68,0.62)'
                          : 'rgba(255,255,255,0.18)',
                        background: 'transparent',
                        cursor: !canArchive ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (canArchive) {
                          e.currentTarget.style.background =
                            'rgba(239,68,68,0.06)';
                          e.currentTarget.style.color = 'rgba(239,68,68,0.85)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = canArchive
                          ? 'rgba(239,68,68,0.62)'
                          : 'rgba(255,255,255,0.18)';
                      }}
                    >
                      {archiving ? (
                        <Loader2
                          size={11}
                          strokeWidth={1.8}
                          className="animate-spin shrink-0"
                        />
                      ) : (
                        <Archive
                          size={11}
                          strokeWidth={1.8}
                          className="shrink-0"
                        />
                      )}
                      Archive
                      {!canArchive && (
                        <span
                          className="text-[0.40rem] ml-auto"
                          style={{ color: 'rgba(255,255,255,0.18)' }}
                        >
                          has usage
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminPromosPage() {
  const router = useRouter();

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [codes, setCodes] = useState<AdminPromoCode[]>([]);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [codesLoading, setCodesLoading] = useState(true);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEligibility, setFilterEligibility] = useState('');
  const [filterUsage, setFilterUsage] = useState('');
  const [filterExpiry, setFilterExpiry] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Selection + bulk ────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const activeFilterCount = [
    filterStatus !== '',
    filterType !== '',
    filterEligibility !== '',
    filterUsage !== '',
    filterExpiry !== '',
  ].filter(Boolean).length;

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.status === 401 || res.status === 403) {
          router.push('/admin/login');
          return;
        }
        const { data } = (await res.json()) as { data?: AdminUser };
        if (!cancelled && data) setAdminUser(data);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ── Fetch codes ─────────────────────────────────────────────────────────────
  const fetchCodes = useCallback(async () => {
    setCodesLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      ...(search && { q: search }),
      ...(filterStatus && { status: filterStatus }),
      ...(filterType && { type: filterType }),
      ...(filterEligibility && { eligibility: filterEligibility }),
      ...(filterUsage && { usage: filterUsage }),
      ...(filterExpiry && { expiry: filterExpiry }),
    });
    try {
      const res = await fetch(`/api/admin/promos?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { codes: AdminPromoCode[]; total: number; stats: PromoStats };
      };
      if (json.data) {
        setCodes(json.data.codes);
        setTotalItems(json.data.total);
        setStats(json.data.stats);
      }
    } catch {
      /* ignore */
    } finally {
      setCodesLoading(false);
    }
  }, [
    page,
    pageSize,
    sort,
    search,
    filterStatus,
    filterType,
    filterEligibility,
    filterUsage,
    filterExpiry,
  ]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);
  useEffect(() => {
    setPage(1);
  }, [
    search,
    filterStatus,
    filterType,
    filterEligibility,
    filterUsage,
    filterExpiry,
    sort,
    pageSize,
  ]);

  // ── Bulk dropdown close on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!bulkOpen) return;
    function handle(e: MouseEvent) {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node))
        setBulkOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [bulkOpen]);

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const allOnPageSelected =
    codes.length > 0 && codes.every((c) => selected.has(c._id));

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        codes.forEach((c) => next.delete(c._id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        codes.forEach((c) => next.add(c._id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function handleToggleStatus(id: string, enable: boolean) {
    try {
      const res = await fetch(`/api/admin/promos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: enable ? 'active' : 'disabled' }),
      });
      if (!res.ok) return;
      setCodes((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, status: enable ? 'active' : 'disabled' } : c,
        ),
      );
    } catch {
      /* ignore */
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/admin/promos/${id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) return;
      fetchCodes();
    } catch {
      /* ignore */
    }
  }

  async function handleArchive(id: string) {
    try {
      const res = await fetch(`/api/admin/promos/${id}/archive`, {
        method: 'PATCH',
      });
      if (!res.ok) return;
      setCodes((prev) => prev.filter((c) => c._id !== id));
      setTotalItems((n) => n - 1);
    } catch {
      /* ignore */
    }
  }

  // ── Bulk apply ────────────────────────────────────────────────────────────────
  async function applyBulk() {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);

    if (bulkAction === 'export') {
      const toExport = codes.filter((c) => ids.includes(c._id));
      exportCodesToCSV(toExport);
      setSelected(new Set());
      setBulkAction('');
      return;
    }

    setBulkLoading(true);
    if (bulkAction === 'enable') {
      await Promise.all(ids.map((id) => handleToggleStatus(id, true)));
    } else if (bulkAction === 'disable') {
      await Promise.all(ids.map((id) => handleToggleStatus(id, false)));
    } else if (bulkAction === 'archive') {
      const archivable = codes.filter(
        (c) => ids.includes(c._id) && c.usedCount === 0,
      );
      await Promise.all(archivable.map((c) => handleArchive(c._id)));
    }
    setBulkLoading(false);
    setSelected(new Set());
    setBulkAction('');
  }

  // ── Clear filters ─────────────────────────────────────────────────────────────
  function clearFilters() {
    setFilterStatus('');
    setFilterType('');
    setFilterEligibility('');
    setFilterUsage('');
    setFilterExpiry('');
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  const [jumpValue, setJumpValue] = useState('');
  function handleJump(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) setPage(n);
    setJumpValue('');
  }
  function getPages(): (number | '...')[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  const adminFullName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName}`
    : '—';
  const adminShortName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName[0]}.`
    : '—';
  const adminRoleLabel =
    adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  if (authLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: '#0F0F0F' }}
      >
        <Loader2
          size={20}
          strokeWidth={1.8}
          className="animate-spin"
          style={{ color: GOLD }}
        />
      </div>
    );
  }

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

      {/* Content */}
      <div className="lg:pl-55 flex flex-col min-h-screen">
        <AdminTopNav
          pageTitle="Promo Codes"
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-5">
            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    Promo Codes Management
                  </h1>
                  <span
                    className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.28)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {stats ? stats.total : '—'} Promo Codes
                  </span>
                </div>
                <p
                  className="text-[0.54rem] tracking-[0.08em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Create, manage, and track all discount codes and their
                  performance.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <HeaderButton
                  icon={<Download size={12} strokeWidth={1.8} />}
                  label="Export Report"
                  onClick={() => exportCodesToCSV(codes)}
                />
                <HeaderButton
                  icon={<Plus size={12} strokeWidth={2} />}
                  label="Create Promo Code"
                  accent
                  href="/admin/promos/new"
                />
              </div>
            </div>

            {/* ── Key Stats Bar ─────────────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
              <StatCard
                value={stats ? String(stats.active) : '—'}
                label="Currently Active"
                sub="Live promo codes"
                color="green"
                onClick={() => {
                  setFilterStatus('active');
                  setPage(1);
                }}
              />
              <StatCard
                value={stats ? String(stats.expired) : '—'}
                label="Expired"
                sub="Past their end date"
                color="gray"
                onClick={() => {
                  setFilterStatus('expired');
                  setPage(1);
                }}
              />
              <StatCard
                value={stats ? String(stats.scheduled) : '—'}
                label="Scheduled (Not Yet Active)"
                sub="Future start date"
                color="blue"
                onClick={() => {
                  setFilterStatus('scheduled');
                  setPage(1);
                }}
              />
              <StatCard
                value={stats ? stats.totalUsesThisMonth.toLocaleString() : '—'}
                label="Code Uses This Month"
                sub="Total redemptions"
                color="gold"
              />
              <StatCard
                value={stats ? formatNaira(stats.discountThisMonth) : '—'}
                label="Discount Given This Month"
                sub="Revenue impact"
                color="amber"
              />
              <StatCard
                value={stats?.topCode ?? '—'}
                label="Most Used This Month"
                sub="Top performing code"
                color="neutral"
              />
            </div>

            {/* ── Search Bar ────────────────────────────────────────────────── */}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code name or description..."
                className="w-full h-10 pl-9 pr-9 text-[0.58rem] tracking-[0.06em] outline-none transition-all duration-150"
                style={{
                  background: '#1A1A1A',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.78)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border =
                    '1px solid rgba(255,255,255,0.14)';
                }}
                onBlur={(e) => {
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
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'rgba(255,255,255,0.62)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')
                    }
                    aria-label="Clear search"
                  >
                    <X size={12} strokeWidth={2} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Filter & Sort Bar ─────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label="Status"
                value={filterStatus}
                options={STATUS_OPTIONS}
                onChange={setFilterStatus}
              />
              <FilterDropdown
                label="Type"
                value={filterType}
                options={TYPE_OPTIONS}
                onChange={setFilterType}
              />
              <FilterDropdown
                label="Eligibility"
                value={filterEligibility}
                options={ELIGIBILITY_OPTIONS}
                onChange={setFilterEligibility}
              />
              <FilterDropdown
                label="Usage"
                value={filterUsage}
                options={USAGE_OPTIONS}
                onChange={setFilterUsage}
              />
              <FilterDropdown
                label="Expiry"
                value={filterExpiry}
                options={EXPIRY_OPTIONS}
                onChange={setFilterExpiry}
              />

              {/* Divider */}
              <div
                className="w-px h-5 mx-0.5 shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />

              <SortDropdown value={sort} onChange={setSort} />

              <div className="flex-1" />

              {/* Active filter badge + clear */}
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] font-semibold uppercase"
                      style={{
                        background: 'rgba(180,130,60,0.10)',
                        color: GOLD,
                        border: '1px solid rgba(180,130,60,0.22)',
                      }}
                    >
                      {activeFilterCount} filter
                      {activeFilterCount !== 1 ? 's' : ''} active
                    </span>
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 h-7 px-3 text-[0.52rem] tracking-[0.10em] transition-colors duration-150"
                      style={{
                        color: 'rgba(255,255,255,0.32)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.62)';
                        e.currentTarget.style.border =
                          '1px solid rgba(255,255,255,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.32)';
                        e.currentTarget.style.border =
                          '1px solid rgba(255,255,255,0.06)';
                      }}
                    >
                      <X size={10} strokeWidth={2.2} />
                      Clear Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Bulk Actions Bar ──────────────────────────────────────────── */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 flex-wrap px-4 py-3"
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid rgba(180,130,60,0.18)',
                  }}
                >
                  <span
                    className="text-[0.52rem] tracking-[0.08em] font-medium"
                    style={{ color: GOLD }}
                  >
                    {selected.size} {selected.size === 1 ? 'code' : 'codes'}{' '}
                    selected
                  </span>

                  {/* Bulk action dropdown */}
                  <div className="relative" ref={bulkRef}>
                    <button
                      onClick={() => setBulkOpen((o) => !o)}
                      className="flex items-center gap-1.5 h-8 px-3 text-[0.54rem] tracking-[0.10em] transition-colors duration-150"
                      style={{
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.52)',
                      }}
                    >
                      <span>
                        {bulkAction
                          ? BULK_ACTIONS.find((a) => a.value === bulkAction)
                              ?.label
                          : 'Choose Action'}
                      </span>
                      <ChevronDown
                        size={11}
                        strokeWidth={2}
                        style={{
                          transform: bulkOpen
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 0.15s',
                        }}
                      />
                    </button>
                    <AnimatePresence>
                      {bulkOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[240px] py-1"
                          style={{
                            background: '#1E1E1E',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
                          }}
                        >
                          {BULK_ACTIONS.map((action) => {
                            const sel = action.value === bulkAction;
                            return (
                              <button
                                key={action.value}
                                onClick={() => {
                                  setBulkAction(action.value);
                                  setBulkOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                                style={{
                                  color: sel ? GOLD : 'rgba(255,255,255,0.52)',
                                  background: sel
                                    ? 'rgba(180,130,60,0.08)'
                                    : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  if (!sel) {
                                    e.currentTarget.style.background =
                                      'rgba(255,255,255,0.04)';
                                    e.currentTarget.style.color =
                                      'rgba(255,255,255,0.78)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!sel) {
                                    e.currentTarget.style.background =
                                      'transparent';
                                    e.currentTarget.style.color =
                                      'rgba(255,255,255,0.52)';
                                  }
                                }}
                              >
                                <span
                                  className="text-[0.48rem] shrink-0 w-3 text-center"
                                  style={{ color: GOLD, opacity: sel ? 1 : 0 }}
                                >
                                  ✓
                                </span>
                                {action.label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Apply */}
                  <button
                    onClick={applyBulk}
                    disabled={!bulkAction || bulkLoading}
                    className="flex items-center gap-1.5 h-8 px-4 text-[0.52rem] tracking-[0.12em] uppercase transition-colors duration-150"
                    style={{
                      background: bulkAction
                        ? 'rgba(180,130,60,0.14)'
                        : 'rgba(255,255,255,0.02)',
                      color: bulkAction ? GOLD : 'rgba(255,255,255,0.20)',
                      border: `1px solid ${bulkAction ? 'rgba(180,130,60,0.28)' : 'rgba(255,255,255,0.06)'}`,
                      cursor:
                        !bulkAction || bulkLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {bulkLoading ? (
                      <Loader2
                        size={11}
                        strokeWidth={1.8}
                        className="animate-spin"
                      />
                    ) : null}
                    Apply
                  </button>

                  {/* Deselect all */}
                  <button
                    onClick={() => {
                      setSelected(new Set());
                      setBulkAction('');
                    }}
                    className="text-[0.50rem] tracking-[0.10em] underline underline-offset-2 transition-colors duration-100"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')
                    }
                  >
                    Deselect All
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Promo Codes Table ─────────────────────────────────────────── */}
            <div
              style={{
                border: '1px solid rgba(255,255,255,0.06)',
                background: '#141414',
              }}
            >
              {/* Table meta row */}
              <div
                className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p
                  className="text-[0.50rem] tracking-[0.12em] shrink-0"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  Showing{' '}
                  <span style={{ color: 'rgba(255,255,255,0.50)' }}>
                    {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, totalItems)}
                  </span>{' '}
                  of{' '}
                  <span style={{ color: 'rgba(255,255,255,0.50)' }}>
                    {totalItems}
                  </span>{' '}
                  codes
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[0.46rem] tracking-[0.10em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.18)' }}
                  >
                    Per page
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {([10, 20, 50] as const).map((size, idx) => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className="h-6 px-2.5 text-[0.46rem] tracking-[0.10em] transition-colors duration-100"
                        style={{
                          background:
                            pageSize === size
                              ? 'rgba(180,130,60,0.12)'
                              : 'transparent',
                          color:
                            pageSize === size ? GOLD : 'rgba(255,255,255,0.28)',
                          borderLeft:
                            idx > 0
                              ? '1px solid rgba(255,255,255,0.07)'
                              : undefined,
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: '1100px' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {/* Select all */}
                      <th className="px-4 py-3 w-8">
                        <Checkbox
                          checked={allOnPageSelected}
                          onChange={toggleAll}
                        />
                      </th>
                      {[
                        { label: 'Code' },
                        { label: 'Description' },
                        { label: 'Type' },
                        { label: 'Discount' },
                        { label: 'Conditions' },
                        { label: 'Usage' },
                        { label: 'Revenue Impact' },
                        { label: 'Status' },
                        { label: 'Valid From' },
                        { label: 'Expires' },
                        { label: 'Actions' },
                      ].map((col) => (
                        <th
                          key={col.label}
                          className="px-4 py-3 text-left text-[0.46rem] tracking-[0.18em] uppercase font-semibold whitespace-nowrap"
                          style={{ color: 'rgba(255,255,255,0.20)' }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {codesLoading ? (
                      <tr>
                        <td colSpan={12} className="px-5 py-14 text-center">
                          <Loader2
                            size={18}
                            strokeWidth={1.8}
                            className="animate-spin inline-block"
                            style={{ color: GOLD }}
                          />
                        </td>
                      </tr>
                    ) : codes.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-5 py-14 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Tag
                              size={24}
                              strokeWidth={1.2}
                              style={{ color: 'rgba(255,255,255,0.12)' }}
                            />
                            <p
                              className="text-[0.56rem] tracking-[0.10em]"
                              style={{ color: 'rgba(255,255,255,0.18)' }}
                            >
                              No promo codes match your search or filters.
                            </p>
                            {(search || activeFilterCount > 0) && (
                              <button
                                onClick={() => {
                                  setSearch('');
                                  clearFilters();
                                }}
                                className="text-[0.52rem] tracking-[0.12em] underline underline-offset-2"
                                style={{ color: 'rgba(180,130,60,0.60)' }}
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      codes.map((code) => (
                        <PromoCodeRow
                          key={code._id}
                          code={code}
                          selected={selected.has(code._id)}
                          onToggle={() => toggleOne(code._id)}
                          onToggleStatus={handleToggleStatus}
                          onDuplicate={handleDuplicate}
                          onArchive={handleArchive}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <div
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 flex-wrap"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <p
                      className="text-[0.50rem] tracking-[0.12em] shrink-0"
                      style={{ color: 'rgba(255,255,255,0.22)' }}
                    >
                      Showing{' '}
                      <span style={{ color: 'rgba(255,255,255,0.50)' }}>
                        {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}–
                        {Math.min(page * pageSize, totalItems)}
                      </span>{' '}
                      of{' '}
                      <span style={{ color: 'rgba(255,255,255,0.50)' }}>
                        {totalItems}
                      </span>{' '}
                      codes
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div style={{ display: 'flex' }}>
                      <PaginationBtn
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft size={11} strokeWidth={2} />
                        <span className="text-[0.46rem] tracking-[0.10em]">
                          Prev
                        </span>
                      </PaginationBtn>
                      {getPages().map((p, i) =>
                        p === '...' ? (
                          <span
                            key={`dots-${i}`}
                            className="flex items-center justify-center w-7 h-7 text-[0.46rem]"
                            style={{
                              color: 'rgba(255,255,255,0.20)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              marginLeft: '-1px',
                            }}
                          >
                            …
                          </span>
                        ) : (
                          <PaginationBtn
                            key={p}
                            active={p === page}
                            onClick={() => setPage(p as number)}
                          >
                            <span className="text-[0.48rem] tracking-[0.06em] tabular-nums">
                              {p}
                            </span>
                          </PaginationBtn>
                        ),
                      )}
                      <PaginationBtn
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        <span className="text-[0.46rem] tracking-[0.10em]">
                          Next
                        </span>
                        <ChevronRight size={11} strokeWidth={2} />
                      </PaginationBtn>
                    </div>
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
                        onChange={(e) => setJumpValue(e.target.value)}
                        onKeyDown={handleJump}
                        placeholder="—"
                        className="w-10 h-6 bg-transparent text-center text-[0.50rem] tracking-[0.06em] outline-none tabular-nums"
                        style={{
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
