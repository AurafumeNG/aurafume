'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter }                                 from 'next/navigation';
import Link                                          from 'next/link';
import {
  Users,
  Download,
  Mail,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  Eye,
  ShieldBan,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav  from '@/components/admin/AdminTopNav';
import type { ApiResponse } from '@/types/auth';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

type CustomerStatus = 'verified' | 'unverified' | 'suspended';
type SortKey = 'newest' | 'oldest' | 'orders-desc' | 'orders-asc' | 'spent-desc' | 'spent-asc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',       label: 'Newest First'      },
  { value: 'oldest',       label: 'Oldest First'      },
  { value: 'orders-desc',  label: 'Most Orders'       },
  { value: 'orders-asc',   label: 'Least Orders'      },
  { value: 'spent-desc',   label: 'Highest Spent'     },
  { value: 'spent-asc',    label: 'Lowest Spent'      },
  { value: 'name-asc',     label: 'Name: A–Z'         },
  { value: 'name-desc',    label: 'Name: Z–A'         },
];

const BULK_ACTIONS = [
  { value: 'email',    label: 'Send Email to Selected'    },
  { value: 'verify',   label: 'Verify Selected Accounts'  },
  { value: 'suspend',  label: 'Suspend Selected Accounts' },
  { value: 'export',   label: 'Export Selected as CSV'    },
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminCustomer {
  _id:           string;
  firstName:     string;
  lastName:      string;
  email:         string;
  phone?:        string;
  isVerified:    boolean;
  isSuspended?:  boolean;
  avatar?:       string;
  createdAt:     string;
  totalOrders:   number;
  totalSpent:    number;
  lastOrderDate?: string;
}

interface CustomerStats {
  total:           number;
  newThisMonth:    number;
  lastMonthNew:    number;
  suspended:       number;
  activeCustomers: number;
  avgLTV:          number;
}

interface AdminUser {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function exportCustomersToCSV(customers: AdminCustomer[]) {
  const headers = ['Name', 'Email', 'Phone', 'Status', 'Total Orders', 'Total Spent (₦)', 'Last Order', 'Date Joined'];
  const rows = customers.map((c) => [
    `"${c.firstName} ${c.lastName}"`,
    c.email,
    c.phone ?? '',
    c.isSuspended ? 'Suspended' : c.isVerified ? 'Verified' : 'Unverified',
    c.totalOrders,
    c.totalSpent,
    c.lastOrderDate ? formatDate(c.lastOrderDate) : '',
    formatDate(c.createdAt),
  ]);
  const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `aurafumeng-customers-${Date.now()}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Checkbox ───────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center justify-center w-4 h-4 shrink-0 transition-colors duration-100"
      style={{ color: checked ? GOLD : 'rgba(255,255,255,0.20)' }}
    >
      {checked ? <CheckSquare size={14} strokeWidth={1.8} /> : <Square size={14} strokeWidth={1.5} />}
    </button>
  );
}

// ── FilterDropdown ─────────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label:    string;
  value:    string;
  options:  readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);
  const active           = value !== '' && value !== 'all';
  const currentLabel     = options.find((o) => o.value === value)?.label ?? label;
  const displayLabel     = active ? `${label}: ${currentLabel}` : label;

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
        onClick={() => setOpen((o) => !o)}
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
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[160px] py-1"
            style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.55)' }}
          >
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                  style={{ color: selected ? GOLD : 'rgba(255,255,255,0.52)', background: selected ? 'rgba(180,130,60,0.08)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; } }}
                  onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; } }}
                >
                  <span className="text-[0.48rem] shrink-0 w-3 text-center" style={{ color: GOLD, opacity: selected ? 1 : 0 }}>✓</span>
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

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const currentLabel    = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort';

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
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-[0.56rem] tracking-[0.10em] transition-colors duration-150"
        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.45)' }}
      >
        <span>{currentLabel}</span>
        <ChevronDown size={11} strokeWidth={2} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-[calc(100%+4px)] right-0 z-50 min-w-[180px] py-1"
            style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.55)' }}
          >
            {SORT_OPTIONS.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                  style={{ color: selected ? GOLD : 'rgba(255,255,255,0.52)', background: selected ? 'rgba(180,130,60,0.08)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; } }}
                  onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; } }}
                >
                  <span className="text-[0.48rem] shrink-0 w-3 text-center" style={{ color: GOLD, opacity: selected ? 1 : 0 }}>✓</span>
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

function HeaderButton({ icon, label, accent, onClick }: { icon: React.ReactNode; label: string; accent?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const cls   = 'flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150';
  const style = accent
    ? { background: hovered ? 'rgba(180,130,60,0.22)' : 'rgba(180,130,60,0.12)', color: GOLD, border: `1px solid ${hovered ? 'rgba(180,130,60,0.45)' : 'rgba(180,130,60,0.28)'}` }
    : { background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', color: hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)', border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}` };
  return (
    <button onClick={onClick} className={cls} style={style} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {icon}
      {label}
    </button>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ value, label, trend, trendPositive, color }: {
  value:          string;
  label:          string;
  trend?:         string;
  trendPositive?: boolean;
  color:          'neutral' | 'blue' | 'red' | 'gold' | 'green';
}) {
  const colorMap = {
    neutral: 'rgba(255,255,255,0.80)',
    blue:    'rgba(96,165,250,0.88)',
    red:     'rgba(239,68,68,0.85)',
    gold:    GOLD,
    green:   'rgba(74,222,128,0.88)',
  }[color];

  return (
    <div
      className="flex flex-col gap-2 p-4"
      style={{
        background: '#141414',
        border:     '1px solid rgba(255,255,255,0.06)',
        flex:       '1 1 160px',
        minWidth:   '140px',
      }}
    >
      <p className="text-[1.10rem] font-semibold tracking-tight tabular-nums leading-none" style={{ color: colorMap }}>
        {value}
      </p>
      <p className="text-[0.56rem] tracking-[0.04em] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {label}
      </p>
      {trend && (
        <p
          className="flex items-center gap-0.5 text-[0.44rem] tracking-[0.08em]"
          style={{ color: trendPositive ? 'rgba(74,222,128,0.80)' : 'rgba(239,68,68,0.75)' }}
        >
          <TrendingUp size={9} strokeWidth={2} />
          {trend}
        </p>
      )}
    </div>
  );
}

// ── Customer Status Badge ──────────────────────────────────────────────────────

function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const cfg: Record<CustomerStatus, { label: string; bg: string; color: string; border: string }> = {
    verified:   { label: 'Verified',   bg: 'rgba(34,197,94,0.09)',  color: 'rgba(74,222,128,0.88)',  border: 'rgba(34,197,94,0.18)'  },
    unverified: { label: 'Unverified', bg: 'rgba(234,179,8,0.09)',  color: 'rgba(250,204,21,0.85)',  border: 'rgba(234,179,8,0.22)'  },
    suspended:  { label: 'Suspended',  bg: 'rgba(239,68,68,0.08)',  color: 'rgba(239,68,68,0.72)',   border: 'rgba(239,68,68,0.18)'  },
  };
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
}

// ── PaginationBtn ──────────────────────────────────────────────────────────────

function PaginationBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-0.5 h-7 px-2.5 transition-colors duration-100"
      style={{
        background: active ? 'rgba(180,130,60,0.14)' : 'transparent',
        color:      active ? GOLD : disabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.38)',
        border:     `1px solid ${active ? 'rgba(180,130,60,0.28)' : 'rgba(255,255,255,0.06)'}`,
        cursor:     disabled ? 'not-allowed' : 'pointer',
        marginLeft: '-1px',
      }}
    >
      {children}
    </button>
  );
}

// ── Customer Row ───────────────────────────────────────────────────────────────

function CustomerRow({
  customer,
  selected,
  onToggle,
  onEmailClick,
  onToggleSuspend,
}: {
  customer:        AdminCustomer;
  selected:        boolean;
  onToggle:        () => void;
  onEmailClick:    (c: AdminCustomer) => void;
  onToggleSuspend: (c: AdminCustomer) => Promise<void>;
}) {
  const [hovered,    setHovered]    = useState(false);
  const [suspending, setSuspending] = useState(false);

  const status: CustomerStatus = customer.isSuspended
    ? 'suspended'
    : customer.isVerified
      ? 'verified'
      : 'unverified';

  const initials = getInitials(customer.firstName, customer.lastName);

  async function handleSuspendToggle() {
    setSuspending(true);
    await onToggleSuspend(customer);
    setSuspending(false);
  }

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   selected ? 'rgba(180,130,60,0.03)' : hovered ? 'rgba(255,255,255,0.018)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition:   'background 0.10s',
      }}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-8">
        <Checkbox checked={selected} onChange={onToggle} />
      </td>

      {/* Customer — avatar + name + email */}
      <td className="px-4 py-3 min-w-[200px]">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-7 h-7 shrink-0 text-[0.52rem] font-semibold tracking-wide"
            style={{ background: 'rgba(180,130,60,0.12)', color: GOLD, border: '1px solid rgba(180,130,60,0.18)' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[0.60rem] tracking-[0.04em] font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
              {customer.firstName} {customer.lastName}
            </p>
            <p className="mt-0.5 text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {customer.email}
            </p>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 min-w-[120px]">
        <p className="text-[0.56rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {customer.phone ?? <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <CustomerStatusBadge status={status} />
      </td>

      {/* Total Orders */}
      <td className="px-4 py-3">
        <p className="text-[0.58rem] tracking-[0.04em] tabular-nums font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {customer.totalOrders}
        </p>
      </td>

      {/* Total Spent */}
      <td className="px-4 py-3">
        <p className="text-[0.60rem] tracking-[0.04em] tabular-nums font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
          {formatNaira(customer.totalSpent)}
        </p>
      </td>

      {/* Last Order */}
      <td className="px-4 py-3">
        <p className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
        </p>
      </td>

      {/* Date Joined */}
      <td className="px-4 py-3">
        <p className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {formatDate(customer.createdAt)}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* View */}
          <Link
            href={`/admin/customers/${customer._id}`}
            title="View customer"
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{ color: 'rgba(255,255,255,0.28)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <Eye size={12} strokeWidth={1.8} />
          </Link>

          {/* Email */}
          <button
            onClick={() => onEmailClick(customer)}
            title="Send email"
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{ color: 'rgba(255,255,255,0.28)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <Mail size={12} strokeWidth={1.8} />
          </button>

          {/* Suspend / Unsuspend */}
          <button
            onClick={handleSuspendToggle}
            disabled={suspending}
            title={customer.isSuspended ? 'Unsuspend' : 'Suspend'}
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{
              color:       customer.isSuspended ? 'rgba(74,222,128,0.70)' : 'rgba(255,255,255,0.28)',
              background:  customer.isSuspended ? 'rgba(34,197,94,0.06)' : 'transparent',
              border:      `1px solid ${customer.isSuspended ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)'}`,
              cursor:      suspending ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!suspending && !customer.isSuspended) {
                e.currentTarget.style.color       = 'rgba(239,68,68,0.72)';
                e.currentTarget.style.background  = 'rgba(239,68,68,0.06)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!suspending && !customer.isSuspended) {
                e.currentTarget.style.color       = 'rgba(255,255,255,0.28)';
                e.currentTarget.style.background  = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }
            }}
          >
            {suspending
              ? <Loader2 size={12} strokeWidth={1.8} className="animate-spin" />
              : customer.isSuspended
                ? <ShieldCheck size={12} strokeWidth={1.8} />
                : <ShieldBan   size={12} strokeWidth={1.8} />
            }
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Email Composer Modal ───────────────────────────────────────────────────────

function EmailComposerModal({
  recipients,
  onClose,
}: {
  recipients: AdminCustomer[];
  onClose:    () => void;
}) {
  const [subject, setSubject] = useState('');
  const [body,    setBody]    = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    // Email sending logic would go here — placeholder
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.70)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[560px]"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.70)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[0.60rem] tracking-[0.20em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Email Composer
            </p>
            <p className="mt-0.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.30)' }}>
              {recipients.length === 1
                ? `To: ${recipients[0].firstName} ${recipients[0].lastName}`
                : `To: ${recipients.length} customers`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 transition-colors duration-100"
            style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-[0.46rem] tracking-[0.16em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              className="w-full h-9 px-3 text-[0.58rem] tracking-[0.04em] outline-none transition-colors duration-150"
              style={{
                background:   'rgba(255,255,255,0.03)',
                border:       '1px solid rgba(255,255,255,0.08)',
                color:        'rgba(255,255,255,0.78)',
              }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = 'rgba(180,130,60,0.35)')}
              onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-[0.46rem] tracking-[0.16em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              rows={6}
              className="w-full px-3 py-2.5 text-[0.58rem] tracking-[0.04em] outline-none transition-colors duration-150 resize-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border:     '1px solid rgba(255,255,255,0.08)',
                color:      'rgba(255,255,255,0.78)',
              }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = 'rgba(180,130,60,0.35)')}
              onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onClose}
            className="flex items-center h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150"
            style={{
              background: sending ? 'rgba(180,130,60,0.10)' : 'rgba(180,130,60,0.14)',
              color:      GOLD,
              border:     '1px solid rgba(180,130,60,0.28)',
              cursor:     (sending || !subject.trim() || !body.trim()) ? 'not-allowed' : 'pointer',
              opacity:    (!subject.trim() || !body.trim()) ? 0.5 : 1,
            }}
          >
            {sending ? <Loader2 size={11} strokeWidth={2} className="animate-spin" /> : <Mail size={11} strokeWidth={2} />}
            {sending ? 'Sending…' : 'Send Email'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminCustomersPage() {
  const router = useRouter();

  // ── Admin auth ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [customers,        setCustomers]        = useState<AdminCustomer[]>([]);
  const [stats,            setStats]            = useState<CustomerStats | null>(null);
  const [totalItems,       setTotalItems]       = useState(0);
  const [customersLoading, setCustomersLoading] = useState(true);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ordersFilter, setOrdersFilter] = useState('all');
  const [spentFilter,  setSpentFilter]  = useState('all');
  const [dateRange,    setDateRange]    = useState('all');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [location,     setLocation]     = useState('all');
  const [sort,         setSort]         = useState<SortKey>('newest');
  const [page,         setPage]         = useState(1);
  const pageSize = 20;

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef                        = useRef<HTMLDivElement>(null);

  // ── Selection + bulk ────────────────────────────────────────────────────────
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkAction,  setBulkAction]  = useState('');
  const [bulkOpen,    setBulkOpen]    = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const bulkRef                       = useRef<HTMLDivElement>(null);

  // ── Email composer ───────────────────────────────────────────────────────────
  const [emailRecipients, setEmailRecipients] = useState<AdminCustomer[]>([]);
  const [emailOpen,       setEmailOpen]       = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const activeFilterCount = [
    statusFilter !== 'all' && statusFilter !== '',
    ordersFilter !== 'all' && ordersFilter !== '',
    spentFilter  !== 'all' && spentFilter  !== '',
    dateRange    !== 'all' && dateRange    !== '',
    location     !== 'all' && location    !== '',
  ].filter(Boolean).length;

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return; }
        const { data } = (await res.json()) as { data?: AdminUser };
        if (!cancelled && data) setAdminUser(data);
      } catch { /* ignore */ } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  // ── Fetch customers ──────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      sort,
      q:        search,
      status:   statusFilter === 'all' ? '' : statusFilter,
      orders:   ordersFilter === 'all' ? '' : ordersFilter,
      spent:    spentFilter  === 'all' ? '' : spentFilter,
      dateRange,
      dateFrom,
      dateTo,
      location: location === 'all' ? '' : location,
    });
    try {
      const res  = await fetch(`/api/admin/customers?${params}`);
      const json = (await res.json()) as ApiResponse<{
        customers: AdminCustomer[];
        total:     number;
        stats:     CustomerStats;
      }>;
      if (json.data) {
        setCustomers(json.data.customers);
        setTotalItems(json.data.total);
        setStats(json.data.stats);
      }
    } catch { /* ignore */ } finally {
      setCustomersLoading(false);
    }
  }, [page, pageSize, sort, search, statusFilter, ordersFilter, spentFilter, dateRange, dateFrom, dateTo, location]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, ordersFilter, spentFilter, dateRange, location, sort]);

  // Outside click: date picker
  useEffect(() => {
    if (!datePickerOpen) return;
    function handle(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) setDatePickerOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [datePickerOpen]);

  // Outside click: bulk dropdown
  useEffect(() => {
    if (!bulkOpen) return;
    function handle(e: MouseEvent) {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) setBulkOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [bulkOpen]);

  // ── Selection helpers ────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === customers.length && customers.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(customers.map((c) => c._id)));
    }
  }

  // ── Toggle suspend ───────────────────────────────────────────────────────────
  async function handleToggleSuspend(customer: AdminCustomer) {
    const action = customer.isSuspended ? 'unsuspend' : 'suspend';
    await fetch('/api/admin/customers', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: customer._id, action }),
    });
    setCustomers((prev) =>
      prev.map((c) => c._id === customer._id ? { ...c, isSuspended: action === 'suspend' } : c),
    );
  }

  // ── Bulk apply ───────────────────────────────────────────────────────────────
  async function handleBulkApply() {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);

    if (bulkAction === 'export') {
      const targets = customers.filter((c) => selected.has(c._id));
      exportCustomersToCSV(targets);
      setSelected(new Set());
      return;
    }

    if (bulkAction === 'email') {
      const targets = customers.filter((c) => selected.has(c._id));
      setEmailRecipients(targets);
      setEmailOpen(true);
      return;
    }

    setBulkLoading(true);
    await fetch('/api/admin/customers', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ids, action: bulkAction }),
    });
    setBulkLoading(false);
    setSelected(new Set());
    setBulkAction('');
    fetchCustomers();
  }

  // ── Clear all filters ────────────────────────────────────────────────────────
  function clearFilters() {
    setStatusFilter('all');
    setOrdersFilter('all');
    setSpentFilter('all');
    setDateRange('all');
    setDateFrom('');
    setDateTo('');
    setLocation('all');
    setSearch('');
  }

  // ── Month-over-month trend ───────────────────────────────────────────────────
  const newThisMonthTrend = stats
    ? stats.lastMonthNew > 0
      ? `+${Math.round(((stats.newThisMonth - stats.lastMonthNew) / stats.lastMonthNew) * 100)}% vs last month`
      : 'No comparison data'
    : '';

  const allSelected = customers.length > 0 && selected.size === customers.length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} strokeWidth={1.5} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      <AdminSidebar
        adminName={adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : ''}
        adminRole={adminUser?.role ?? ''}
        avatarUrl={adminUser?.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingOrders={0}
        pendingTransfers={0}
      />

      <div className="lg:pl-55 flex flex-col min-h-screen">
        <AdminTopNav
          pageTitle="Customers"
          adminName={adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : ''}
          avatarUrl={adminUser?.avatar}
          notifCount={0}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-6">

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9"
                  style={{ background: 'rgba(180,130,60,0.10)', border: '1px solid rgba(180,130,60,0.18)' }}
                >
                  <Users size={16} strokeWidth={1.8} style={{ color: GOLD }} />
                </div>
                <div>
                  <h1 className="text-[0.80rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    Customers Management
                  </h1>
                  <p className="mt-0.5 text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {stats ? `${stats.total.toLocaleString()} Customers` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HeaderButton
                  icon={<Download size={11} strokeWidth={2} />}
                  label="Export Customers"
                  onClick={() => exportCustomersToCSV(customers)}
                />
                <HeaderButton
                  icon={<Mail size={11} strokeWidth={2} />}
                  label="Send Mass Email"
                  accent
                  onClick={() => {
                    setEmailRecipients(customers);
                    setEmailOpen(true);
                  }}
                />
              </div>
            </div>

            {/* ── Key Stats Bar ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3">
              <StatCard
                value={stats ? stats.total.toLocaleString() : '—'}
                label="Registered Accounts"
                trend={stats ? `+24 this week` : undefined}
                trendPositive
                color="neutral"
              />
              <StatCard
                value={stats ? String(stats.newThisMonth) : '—'}
                label="New Customers"
                trend={stats ? newThisMonthTrend : undefined}
                trendPositive={stats ? stats.newThisMonth >= stats.lastMonthNew : undefined}
                color="green"
              />
              <StatCard
                value={stats ? stats.activeCustomers.toLocaleString() : '—'}
                label="Placed at least 1 order"
                color="blue"
              />
              <StatCard
                value={stats ? String(stats.suspended) : '—'}
                label="Suspended Accounts"
                color="red"
              />
              <StatCard
                value={stats ? formatNaira(stats.avgLTV) : '—'}
                label="Per Customer"
                color="gold"
              />
            </div>

            {/* ── Search Bar ───────────────────────────────────────────────── */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search size={13} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.25)' }} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone number..."
                className="w-full h-10 pl-9 pr-9 text-[0.58rem] tracking-[0.04em] outline-none transition-colors duration-150"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border:     '1px solid rgba(255,255,255,0.07)',
                  color:      'rgba(255,255,255,0.78)',
                }}
                onFocus={(e)  => (e.currentTarget.style.borderColor = 'rgba(180,130,60,0.30)')}
                onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 transition-colors duration-100"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
                >
                  <X size={11} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* ── Filter & Sort Bar ────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label="Status"
                value={statusFilter}
                options={[
                  { value: 'all',        label: 'All'         },
                  { value: 'active',     label: 'Active'      },
                  { value: 'verified',   label: 'Verified'    },
                  { value: 'unverified', label: 'Unverified'  },
                  { value: 'suspended',  label: 'Suspended'   },
                ]}
                onChange={setStatusFilter}
              />
              <FilterDropdown
                label="Orders"
                value={ordersFilter}
                options={[
                  { value: 'all',  label: 'All Orders'  },
                  { value: 'none', label: 'No Orders'   },
                  { value: '1-5',  label: '1–5 Orders'  },
                  { value: '5+',   label: '5+ Orders'   },
                ]}
                onChange={setOrdersFilter}
              />
              <FilterDropdown
                label="Spent"
                value={spentFilter}
                options={[
                  { value: 'all',       label: 'All'           },
                  { value: 'under-10k', label: 'Under ₦10k'    },
                  { value: '10k-50k',   label: '₦10k – ₦50k'   },
                  { value: '50k-100k',  label: '₦50k – ₦100k'  },
                  { value: '100k+',     label: '₦100k+'        },
                ]}
                onChange={setSpentFilter}
              />

              {/* Date Joined — with custom range */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setDatePickerOpen((o) => !o)}
                  className="flex items-center gap-1.5 h-8 px-3 text-[0.56rem] tracking-[0.10em] transition-colors duration-150"
                  style={{
                    border:     `1px solid ${dateRange !== 'all' ? 'rgba(180,130,60,0.30)' : 'rgba(255,255,255,0.08)'}`,
                    background: dateRange !== 'all' ? 'rgba(180,130,60,0.08)' : 'rgba(255,255,255,0.02)',
                    color:      dateRange !== 'all' ? GOLD : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <span>
                    {dateRange === 'all'    ? 'Date Joined'
                    : dateRange === 'today' ? 'Date: Today'
                    : dateRange === 'week'  ? 'Date: This Week'
                    : dateRange === 'month' ? 'Date: This Month'
                    : `Date: ${dateFrom} – ${dateTo}`}
                  </span>
                  <ChevronDown
                    size={11}
                    strokeWidth={2}
                    style={{ transform: datePickerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
                  />
                </button>
                <AnimatePresence>
                  {datePickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[200px] py-1"
                      style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.55)' }}
                    >
                      {(['all', 'today', 'week', 'month', 'custom'] as const).map((opt) => {
                        const labels = { all: 'All Time', today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom Range' };
                        const selected = opt === dateRange;
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              setDateRange(opt);
                              if (opt !== 'custom') setDatePickerOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                            style={{ color: selected ? GOLD : 'rgba(255,255,255,0.52)', background: selected ? 'rgba(180,130,60,0.08)' : 'transparent' }}
                            onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; } }}
                            onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; } }}
                          >
                            <span className="text-[0.48rem] shrink-0 w-3 text-center" style={{ color: GOLD, opacity: selected ? 1 : 0 }}>✓</span>
                            {labels[opt]}
                          </button>
                        );
                      })}
                      {dateRange === 'custom' && (
                        <div className="px-3 py-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <label className="block text-[0.42rem] tracking-[0.14em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>From</label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="w-full h-7 px-2 text-[0.54rem] outline-none"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)', colorScheme: 'dark' }}
                            />
                          </div>
                          <div>
                            <label className="block text-[0.42rem] tracking-[0.14em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>To</label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="w-full h-7 px-2 text-[0.54rem] outline-none"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)', colorScheme: 'dark' }}
                            />
                          </div>
                          <button
                            onClick={() => setDatePickerOpen(false)}
                            className="w-full h-7 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
                            style={{ background: 'rgba(180,130,60,0.12)', color: GOLD, border: '1px solid rgba(180,130,60,0.24)' }}
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Location */}
              <FilterDropdown
                label="Location"
                value={location}
                options={[
                  { value: 'all', label: 'All States' },
                  ...NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
                ]}
                onChange={setLocation}
              />

              {/* Sort */}
              <div className="ml-auto flex items-center gap-2">
                <SortDropdown value={sort} onChange={setSort} />

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 h-8 px-3 text-[0.54rem] tracking-[0.10em] transition-colors duration-150"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.40)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    <X size={10} strokeWidth={2} />
                    Clear Filters
                    <span
                      className="flex items-center justify-center w-4 h-4 text-[0.42rem] font-bold"
                      style={{ background: 'rgba(180,130,60,0.16)', color: GOLD, border: '1px solid rgba(180,130,60,0.24)' }}
                    >
                      {activeFilterCount}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Bulk Actions Bar (visible only when rows are selected) ─── */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14 }}
                  className="flex flex-wrap items-center gap-3 px-4 py-2.5"
                  style={{ background: 'rgba(180,130,60,0.06)', border: '1px solid rgba(180,130,60,0.16)' }}
                >
                  <CheckSquare size={13} strokeWidth={1.8} style={{ color: GOLD, flexShrink: 0 }} />
                  <span className="text-[0.56rem] tracking-[0.06em] font-medium" style={{ color: GOLD }}>
                    {selected.size} {selected.size === 1 ? 'customer' : 'customers'} selected
                  </span>

                  {/* Bulk action dropdown */}
                  <div className="relative" ref={bulkRef}>
                    <button
                      onClick={() => setBulkOpen((o) => !o)}
                      className="flex items-center gap-1.5 h-7 px-3 text-[0.52rem] tracking-[0.08em] transition-colors duration-150"
                      style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.52)' }}
                    >
                      <span>{bulkAction ? BULK_ACTIONS.find((a) => a.value === bulkAction)?.label : 'Select action'}</span>
                      <ChevronDown size={10} strokeWidth={2} style={{ transform: bulkOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                    </button>
                    <AnimatePresence>
                      {bulkOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[220px] py-1"
                          style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.55)' }}
                        >
                          {BULK_ACTIONS.map((act) => {
                            const sel = act.value === bulkAction;
                            return (
                              <button
                                key={act.value}
                                onClick={() => { setBulkAction(act.value); setBulkOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.54rem] tracking-[0.06em] transition-colors duration-100"
                                style={{ color: sel ? GOLD : 'rgba(255,255,255,0.52)', background: sel ? 'rgba(180,130,60,0.08)' : 'transparent' }}
                                onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; } }}
                                onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; } }}
                              >
                                <span className="text-[0.48rem] shrink-0 w-3 text-center" style={{ color: GOLD, opacity: sel ? 1 : 0 }}>✓</span>
                                {act.label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Apply */}
                  <button
                    onClick={handleBulkApply}
                    disabled={!bulkAction || bulkLoading}
                    className="flex items-center gap-1.5 h-7 px-3 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
                    style={{
                      background: 'rgba(180,130,60,0.14)',
                      color:      GOLD,
                      border:     '1px solid rgba(180,130,60,0.28)',
                      cursor:     (!bulkAction || bulkLoading) ? 'not-allowed' : 'pointer',
                      opacity:    !bulkAction ? 0.5 : 1,
                    }}
                  >
                    {bulkLoading ? <Loader2 size={10} strokeWidth={2} className="animate-spin" /> : null}
                    Apply
                  </button>

                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-[0.50rem] tracking-[0.08em] transition-colors duration-100 ml-auto"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
                  >
                    Deselect All
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Customers Table ──────────────────────────────────────────── */}
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
              <table className="w-full min-w-[900px] border-collapse">
                {/* Head */}
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="px-4 py-3 w-8 text-left">
                      <Checkbox checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    {[
                      { label: 'Customer',     sortKey: undefined              },
                      { label: 'Phone',        sortKey: undefined              },
                      { label: 'Status',       sortKey: undefined              },
                      { label: 'Total Orders', sortKey: 'orders-desc' as SortKey },
                      { label: 'Total Spent',  sortKey: 'spent-desc'  as SortKey },
                      { label: 'Last Order',   sortKey: undefined              },
                      { label: 'Date Joined',  sortKey: 'newest'      as SortKey },
                      { label: 'Actions',      sortKey: undefined              },
                    ].map(({ label, sortKey }) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-left text-[0.44rem] tracking-[0.14em] uppercase font-semibold"
                        style={{ color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap' }}
                      >
                        {sortKey ? (
                          <button
                            onClick={() => setSort(sort === sortKey ? (sortKey.replace('-desc', '-asc').replace('-asc', '-desc') as SortKey) : sortKey)}
                            className="flex items-center gap-1 transition-colors duration-100"
                            style={{ color: sort === sortKey || sort === sortKey.replace('-desc', '-asc') ? GOLD : 'rgba(255,255,255,0.28)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = sort === sortKey ? GOLD : 'rgba(255,255,255,0.28)')}
                          >
                            {label}
                            <ChevronDown size={9} strokeWidth={2} style={{ transform: sort === sortKey ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.15s' }} />
                          </button>
                        ) : label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {customersLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={14} strokeWidth={1.8} className="animate-spin" style={{ color: GOLD }} />
                          <span className="text-[0.54rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.28)' }}>Loading customers…</span>
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <p className="text-[0.58rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          {search || activeFilterCount > 0 ? 'No customers match your filters.' : 'No customers yet.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <CustomerRow
                        key={customer._id}
                        customer={customer}
                        selected={selected.has(customer._id)}
                        onToggle={() => toggleSelect(customer._id)}
                        onEmailClick={(c) => { setEmailRecipients([c]); setEmailOpen(true); }}
                        onToggleSuspend={handleToggleSuspend}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ───────────────────────────────────────────────── */}
            {!customersLoading && customers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems.toLocaleString()} customers
                </p>
                <div className="flex items-center" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <PaginationBtn disabled={page <= 1} onClick={() => setPage(1)}>
                    <ChevronLeft size={10} strokeWidth={2} /><ChevronLeft size={10} strokeWidth={2} style={{ marginLeft: '-4px' }} />
                  </PaginationBtn>
                  <PaginationBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={10} strokeWidth={2} />
                  </PaginationBtn>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }
                    return (
                      <PaginationBtn key={p} active={p === page} onClick={() => setPage(p)}>
                        <span className="text-[0.50rem]">{p}</span>
                      </PaginationBtn>
                    );
                  })}

                  <PaginationBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight size={10} strokeWidth={2} />
                  </PaginationBtn>
                  <PaginationBtn disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                    <ChevronRight size={10} strokeWidth={2} /><ChevronRight size={10} strokeWidth={2} style={{ marginLeft: '-4px' }} />
                  </PaginationBtn>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Email Composer Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {emailOpen && (
          <EmailComposerModal
            recipients={emailRecipients}
            onClose={() => { setEmailOpen(false); setEmailRecipients([]); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
