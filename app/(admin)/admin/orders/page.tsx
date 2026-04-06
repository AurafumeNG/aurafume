'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter }                                 from 'next/navigation';
import Link                                          from 'next/link';
import {
  Download,
  Printer,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  Eye,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar  from '@/components/admin/AdminSidebar';
import AdminTopNav   from '@/components/admin/AdminTopNav';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type PaymentMethod = 'bank-transfer' | 'paystack';
type SortKey = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc' | 'name-asc';
type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';

interface AdminOrder {
  _id:         string;
  orderNumber: string;
  contact: {
    firstName: string;
    lastName:  string;
    email:     string;
    phone:     string;
  };
  pricing: {
    subtotal:    number;
    discount:    number;
    deliveryFee: number;
    total:       number;
  };
  delivery: {
    option: string;
    label:  string;
  };
  payment: {
    method:  PaymentMethod;
    status:  PaymentStatus;
    paidAt?: string;
  };
  status:    OrderStatus;
  items:     { name: string; qty: number; size: string; pricePerUnit: number }[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalOrders:          number;
  pendingOrders:        number;
  pendingBankTransfers: number;
  todayOrders:          number;
  totalRevenue:         number;
}

interface AdminUser {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

const STATUS_TABS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all',        label: 'All'        },
  { value: 'pending',    label: 'Pending'    },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped',    label: 'Shipped'    },
  { value: 'delivered',  label: 'Delivered'  },
  { value: 'cancelled',  label: 'Cancelled'  },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',       label: 'Newest First'       },
  { value: 'oldest',       label: 'Oldest First'       },
  { value: 'amount-desc',  label: 'Amount: High–Low'   },
  { value: 'amount-asc',   label: 'Amount: Low–High'   },
  { value: 'name-asc',     label: 'Customer: A–Z'      },
];

const BULK_ACTIONS: { value: string; label: string }[] = [
  { value: 'processing', label: 'Mark as Processing'           },
  { value: 'shipped',    label: 'Mark as Shipped'              },
  { value: 'delivered',  label: 'Mark as Delivered'            },
  { value: 'cancelled',  label: 'Mark as Cancelled'            },
  { value: 'export',     label: 'Export Selected as CSV'       },
  { value: 'print',      label: 'Print Selected Invoices'      },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function exportOrdersToCSV(orders: AdminOrder[]) {
  const headers = [
    'Order #', 'Customer', 'Email', 'Phone', 'Items', 'Subtotal (₦)',
    'Delivery (₦)', 'Total (₦)', 'Payment Method', 'Payment Status',
    'Order Status', 'Delivery Option', 'Date',
  ];
  const rows = orders.map((o) => [
    o.orderNumber,
    `"${o.contact.firstName} ${o.contact.lastName}"`,
    o.contact.email,
    o.contact.phone,
    o.items.reduce((s, i) => s + i.qty, 0),
    o.pricing.subtotal,
    o.pricing.deliveryFee,
    o.pricing.total,
    o.payment.method,
    o.payment.status,
    o.status,
    `"${o.delivery.label}"`,
    formatDate(o.createdAt),
  ]);
  const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `aurafumeng-orders-${Date.now()}.csv`,
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
  label:   string;
  value:   string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const active          = value !== 'All' && value !== '';
  const currentLabel    = options.find((o) => o.value === value)?.label ?? label;
  const displayLabel    = active ? `${label}: ${currentLabel}` : label;

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
            className="absolute top-[calc(100%+4px)] right-0 z-50 min-w-[170px] py-1"
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

function HeaderButton({
  icon,
  label,
  accent,
  onClick,
}: {
  icon:    React.ReactNode;
  label:   string;
  accent?: boolean;
  onClick?: () => void;
}) {
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

function StatCard({
  value,
  label,
  sub,
  color,
  urgent,
  onClick,
}: {
  value:   string;
  label:   string;
  sub:     string;
  color:   'neutral' | 'amber' | 'red' | 'green' | 'gold';
  urgent?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const colorMap = {
    neutral: { accent: 'rgba(255,255,255,0.55)', dot: 'rgba(255,255,255,0.20)' },
    amber:   { accent: 'rgba(250,204,21,0.85)',  dot: 'rgba(234,179,8,0.60)'   },
    red:     { accent: 'rgba(239,68,68,0.85)',   dot: 'rgba(239,68,68,0.60)'   },
    green:   { accent: 'rgba(74,222,128,0.85)',  dot: 'rgba(34,197,94,0.55)'   },
    gold:    { accent: GOLD,                      dot: 'rgba(180,130,60,0.50)'  },
  }[color];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && onClick ? 'rgba(255,255,255,0.025)' : '#141414',
        border:     `1px solid ${urgent ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)'}`,
        cursor:     onClick ? 'pointer' : 'default',
        transition: 'background 0.12s, border-color 0.12s',
        flex:       '1 1 160px',
        minWidth:   '140px',
        padding:    '16px 18px',
      }}
    >
      {urgent && (
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ background: colorMap.dot }}
          />
          <span className="text-[0.44rem] tracking-[0.12em] uppercase font-semibold" style={{ color: 'rgba(239,68,68,0.60)' }}>
            Urgent
          </span>
        </div>
      )}
      <p className="text-[1.05rem] font-semibold tracking-tight tabular-nums leading-none" style={{ color: colorMap.accent }}>
        {value}
      </p>
      <p className="mt-1.5 text-[0.56rem] tracking-[0.04em] font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {label}
      </p>
      <p className="mt-0.5 text-[0.44rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
        {sub}
      </p>
      {onClick && (
        <p className="mt-2 text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: colorMap.dot }}>
          Click to filter →
        </p>
      )}
    </div>
  );
}

// ── Order Status Pill ──────────────────────────────────────────────────────────

function OrderStatusPill({ status }: { status: OrderStatus }) {
  const cfg: Record<OrderStatus, { label: string; bg: string; color: string; border: string }> = {
    pending:    { label: 'Pending',    bg: 'rgba(234,179,8,0.09)',  color: 'rgba(250,204,21,0.85)', border: 'rgba(234,179,8,0.22)'  },
    confirmed:  { label: 'Confirmed',  bg: 'rgba(99,102,241,0.10)', color: 'rgba(129,140,248,0.85)', border: 'rgba(99,102,241,0.22)' },
    processing: { label: 'Processing', bg: 'rgba(59,130,246,0.10)', color: 'rgba(96,165,250,0.88)', border: 'rgba(59,130,246,0.22)' },
    shipped:    { label: 'Shipped',    bg: 'rgba(180,130,60,0.10)', color: GOLD,                    border: 'rgba(180,130,60,0.24)' },
    delivered:  { label: 'Delivered',  bg: 'rgba(34,197,94,0.09)', color: 'rgba(74,222,128,0.88)', border: 'rgba(34,197,94,0.18)'  },
    cancelled:  { label: 'Cancelled',  bg: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.72)',  border: 'rgba(239,68,68,0.18)'  },
  };
  const c = cfg[status];
  return (
    <span className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

// ── Payment Status Pill ────────────────────────────────────────────────────────

function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const cfg: Record<PaymentStatus, { label: string; bg: string; color: string; border: string }> = {
    pending:  { label: 'Pending',  bg: 'rgba(234,179,8,0.09)',  color: 'rgba(250,204,21,0.75)', border: 'rgba(234,179,8,0.18)'  },
    paid:     { label: 'Paid',     bg: 'rgba(34,197,94,0.09)', color: 'rgba(74,222,128,0.82)', border: 'rgba(34,197,94,0.16)'  },
    failed:   { label: 'Failed',   bg: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.70)',  border: 'rgba(239,68,68,0.16)'  },
    refunded: { label: 'Refunded', bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.38)', border: 'rgba(255,255,255,0.10)' },
  };
  const c = cfg[status];
  return (
    <span className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

// ── Payment Method Badge ───────────────────────────────────────────────────────

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const isBank = method === 'bank-transfer';
  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.44rem] tracking-[0.10em] uppercase font-medium"
      style={{
        background: isBank ? 'rgba(99,102,241,0.07)' : 'rgba(180,130,60,0.07)',
        color:      isBank ? 'rgba(129,140,248,0.70)' : 'rgba(180,130,60,0.65)',
        border:     `1px solid ${isBank ? 'rgba(99,102,241,0.15)' : 'rgba(180,130,60,0.16)'}`,
      }}
    >
      {isBank ? 'Bank Transfer' : 'Paystack'}
    </span>
  );
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

// ── Admin Invoice HTML ─────────────────────────────────────────────────────────

function generateAdminInvoiceHTML(order: AdminOrder): string {
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const rows = order.items
    .map((i) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #222;">${i.name} (${i.size})</td>
      <td style="padding:8px 0;border-bottom:1px solid #222;text-align:center;">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right;">₦${(i.pricePerUnit * i.qty).toLocaleString()}</td>
    </tr>`)
    .join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Invoice – ${order.orderNumber}</title><style>
  body{margin:0;padding:40px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0a0a;color:#f0f0f0;}
  h1{font-size:11px;letter-spacing:.4em;text-transform:uppercase;color:#c5a76d;margin:0 0 40px;}
  h2{font-size:20px;font-weight:300;letter-spacing:.15em;text-transform:uppercase;margin:0 0 6px;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  .muted{color:#666;font-size:11px;letter-spacing:.1em;}
  .row{display:flex;justify-content:space-between;padding:6px 0;font-size:12px;}
  .total{border-top:1px solid #333;padding-top:10px;font-weight:600;font-size:14px;}
  @media print{body{background:#fff;color:#111;}h1{color:#b8932a;}}
</style></head><body>
<h1>AuraFume</h1>
<h2>Invoice</h2>
<p class="muted">Order ${order.orderNumber} &nbsp;·&nbsp; ${date}</p>
<br>
<table>
  <thead><tr>
    <th style="text-align:left;padding-bottom:8px;border-bottom:1px solid #333;font-size:10px;letter-spacing:.2em;text-transform:uppercase;">Item</th>
    <th style="text-align:center;padding-bottom:8px;border-bottom:1px solid #333;font-size:10px;letter-spacing:.2em;text-transform:uppercase;">Qty</th>
    <th style="text-align:right;padding-bottom:8px;border-bottom:1px solid #333;font-size:10px;letter-spacing:.2em;text-transform:uppercase;">Amount</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<br>
<div class="row"><span class="muted">Subtotal</span><span>₦${order.pricing.subtotal.toLocaleString()}</span></div>
<div class="row"><span class="muted">Delivery</span><span>₦${order.pricing.deliveryFee.toLocaleString()}</span></div>
${order.pricing.discount > 0 ? `<div class="row"><span class="muted">Discount</span><span>−₦${order.pricing.discount.toLocaleString()}</span></div>` : ''}
<div class="row total"><span>Total</span><span>₦${order.pricing.total.toLocaleString()}</span></div>
<br><br><p class="muted">AuraFume · Lagos, Nigeria · hello@aurafume.com</p>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;
}

// ── Order Row ──────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  selected,
  onToggle,
  onStatusChange,
}: {
  order:          AdminOrder;
  selected:       boolean;
  onToggle:       () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const [hovered,        setHovered]        = useState(false);
  const [statusOpen,     setStatusOpen]     = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusOpen) return;
    function handle(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [statusOpen]);

  async function handleStatusSelect(s: OrderStatus) {
    setStatusOpen(false);
    setStatusUpdating(true);
    await onStatusChange(order._id, s);
    setStatusUpdating(false);
  }

  function handleInvoice() {
    const html = generateAdminInvoiceHTML(order);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const customerName = `${order.contact.firstName} ${order.contact.lastName}`;
  const itemCount    = order.items.reduce((s, i) => s + i.qty, 0);

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

      {/* Order # + Date */}
      <td className="px-4 py-3 min-w-[120px]">
        <p className="text-[0.60rem] tracking-[0.06em] font-mono font-medium" style={{ color: GOLD }}>
          {order.orderNumber}
        </p>
        <p className="mt-0.5 text-[0.44rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
        </p>
      </td>

      {/* Customer */}
      <td className="px-4 py-3 min-w-[160px]">
        <p className="text-[0.60rem] tracking-[0.04em] font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
          {customerName}
        </p>
        <p className="mt-0.5 text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
          {order.contact.email}
        </p>
      </td>

      {/* Items */}
      <td className="px-4 py-3">
        <p className="text-[0.56rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.50)' }}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
        <p className="mt-0.5 text-[0.44rem] tracking-[0.04em] line-clamp-1" style={{ color: 'rgba(255,255,255,0.20)' }}>
          {order.items.map((i) => i.name).join(', ')}
        </p>
      </td>

      {/* Total */}
      <td className="px-4 py-3">
        <p className="text-[0.62rem] tracking-[0.04em] font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.80)' }}>
          {formatNaira(order.pricing.total)}
        </p>
        {order.pricing.discount > 0 && (
          <p className="mt-0.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(74,222,128,0.60)' }}>
            −{formatNaira(order.pricing.discount)} off
          </p>
        )}
      </td>

      {/* Payment */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <PaymentMethodBadge method={order.payment.method} />
          <PaymentStatusPill  status={order.payment.status} />
        </div>
      </td>

      {/* Delivery */}
      <td className="px-4 py-3">
        <p className="text-[0.52rem] tracking-[0.04em] line-clamp-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {order.delivery.label}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <OrderStatusPill status={order.status} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* View — opens order detail page */}
          <Link
            href={`/admin/orders/${order._id}`}
            title="View order detail"
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{ color: 'rgba(255,255,255,0.28)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <Eye size={12} strokeWidth={1.8} />
          </Link>

          {/* Update Status — inline dropdown */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => setStatusOpen((o) => !o)}
              title="Update status"
              className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
              style={{ color: statusOpen ? GOLD : 'rgba(255,255,255,0.28)', background: statusOpen ? 'rgba(180,130,60,0.08)' : 'transparent', border: `1px solid ${statusOpen ? 'rgba(180,130,60,0.20)' : 'rgba(255,255,255,0.06)'}` }}
              onMouseEnter={(e) => { if (!statusOpen) { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; } }}
              onMouseLeave={(e) => { if (!statusOpen) { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; } }}
            >
              {statusUpdating
                ? <Loader2 size={11} strokeWidth={1.8} className="animate-spin" />
                : <ChevronDown size={11} strokeWidth={1.8} />
              }
            </button>
            {statusOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-[100] py-1 min-w-[130px]"
                style={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 24px rgba(0,0,0,0.50)' }}
              >
                {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusSelect(s)}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-100"
                    style={{ color: 'rgba(255,255,255,0.45)', background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                  >
                    <span style={{ color: GOLD, opacity: 0.7 }}>→</span> {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Invoice — opens print view in new tab */}
          <button
            onClick={handleInvoice}
            title="Open invoice"
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{ color: 'rgba(255,255,255,0.28)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <FileText size={12} strokeWidth={1.8} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── PaginationBtn ──────────────────────────────────────────────────────────────

function PaginationBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
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

// ── Order Detail Drawer ────────────────────────────────────────────────────────

function OrderDetailDrawer({
  order,
  onClose,
  onStatusChange,
}: {
  order:          AdminOrder | null;
  onClose:        () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const NEXT_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const customerName = `${order.contact.firstName} ${order.contact.lastName}`;

  async function handleStatus(s: OrderStatus) {
    setUpdating(true);
    await onStatusChange(order!._id, s);
    setUpdating(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-start justify-end"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="h-full w-full max-w-[480px] overflow-y-auto"
        style={{ background: '#141414', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[0.60rem] tracking-[0.20em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Order Details
            </p>
            <p className="mt-0.5 text-[0.70rem] tracking-[0.06em] font-semibold" style={{ color: GOLD }}>
              {order.orderNumber}
            </p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 transition-colors duration-100" style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
            <X size={13} strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + Update */}
          <div>
            <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Order Status</p>
            <div className="flex items-center gap-2 flex-wrap">
              <OrderStatusPill status={order.status} />
              {updating && <Loader2 size={12} strokeWidth={1.8} className="animate-spin" style={{ color: GOLD }} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {NEXT_STATUSES.filter((s) => s !== order.status).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  disabled={updating}
                  className="h-6 px-2.5 text-[0.46rem] tracking-[0.10em] uppercase transition-colors duration-100"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.40)', cursor: updating ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={(e) => { if (!updating) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
                >
                  → {s}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Customer</p>
            <p className="text-[0.58rem] tracking-[0.04em] font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>{customerName}</p>
            <p className="mt-0.5 text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{order.contact.email}</p>
            <p className="mt-0.5 text-[0.50rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.28)' }}>{order.contact.phone}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Items</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-[0.56rem] tracking-[0.04em] font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>{item.name}</p>
                    <p className="mt-0.5 text-[0.44rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.28)' }}>{item.size} · qty {item.qty}</p>
                  </div>
                  <p className="text-[0.56rem] tracking-[0.04em] tabular-nums shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {formatNaira(item.pricePerUnit * item.qty)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Pricing</p>
            <div className="space-y-1.5">
              {[
                { label: 'Subtotal',  val: order.pricing.subtotal },
                { label: 'Discount',  val: -order.pricing.discount, hide: order.pricing.discount === 0 },
                { label: 'Delivery',  val: order.pricing.deliveryFee },
              ].filter((r) => !r.hide).map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <p className="text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.label}</p>
                  <p className="text-[0.52rem] tracking-[0.04em] tabular-nums" style={{ color: row.val < 0 ? 'rgba(74,222,128,0.70)' : 'rgba(255,255,255,0.50)' }}>
                    {row.val < 0 ? '−' : ''}{formatNaira(Math.abs(row.val))}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[0.52rem] tracking-[0.08em] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Total</p>
                <p className="text-[0.62rem] tracking-[0.04em] font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.85)' }}>{formatNaira(order.pricing.total)}</p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Payment</p>
            <div className="flex items-center gap-2 flex-wrap">
              <PaymentMethodBadge method={order.payment.method} />
              <PaymentStatusPill  status={order.payment.status} />
            </div>
            {order.payment.paidAt && (
              <p className="mt-1.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Paid {formatDate(order.payment.paidAt)}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-6">
            <div>
              <p className="text-[0.44rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>Placed</p>
              <p className="mt-1 text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.42)' }}>{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-[0.44rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>Updated</p>
              <p className="mt-1 text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.42)' }}>{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const router = useRouter();

  // ── Admin auth ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [orders,        setOrders]        = useState<AdminOrder[]>([]);
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [statusCounts,  setStatusCounts]  = useState<Record<string, number>>({});
  const [totalItems,    setTotalItems]    = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [statusTab,     setStatusTab]     = useState<'all' | OrderStatus>('all');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [dateRange,     setDateRange]     = useState<DateRange>('all');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [amountMin,     setAmountMin]     = useState('');
  const [amountMax,     setAmountMax]     = useState('');
  const [sort,          setSort]          = useState<SortKey>('newest');
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(20);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // ── Selection + bulk ────────────────────────────────────────────────────────
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkAction,  setBulkAction]  = useState('');
  const [bulkOpen,    setBulkOpen]    = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const bulkRef                       = useRef<HTMLDivElement>(null);

  // ── Detail drawer ────────────────────────────────────────────────────────────
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const activeFilterCount = [
    paymentMethod !== '',
    paymentStatus !== '',
    dateRange     !== 'all',
    amountMin     !== '',
    amountMax     !== '',
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

  // ── Fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      sort,
      ...(search        && { q:             search        }),
      ...(statusTab !== 'all' && { status:  statusTab     }),
      ...(paymentMethod && { paymentMethod               }),
      ...(paymentStatus && { paymentStatus               }),
      ...(dateRange !== 'all' && { dateRange              }),
      ...(dateFrom      && { dateFrom                    }),
      ...(dateTo        && { dateTo                      }),
      ...(amountMin     && { amountMin                   }),
      ...(amountMax     && { amountMax                   }),
    });

    try {
      const res  = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: {
          orders:       AdminOrder[];
          total:        number;
          statusCounts: Record<string, number>;
          stats:        Stats;
        };
      };
      if (json.data) {
        setOrders(json.data.orders);
        setTotalItems(json.data.total);
        setStatusCounts(json.data.statusCounts);
        setStats(json.data.stats);
      }
    } catch { /* ignore */ } finally {
      setOrdersLoading(false);
    }
  }, [page, pageSize, sort, search, statusTab, paymentMethod, paymentStatus, dateRange, dateFrom, dateTo, amountMin, amountMax]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusTab, paymentMethod, paymentStatus, dateRange, dateFrom, dateTo, amountMin, amountMax, sort, pageSize]);

  // ── Bulk dropdown close on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!bulkOpen) return;
    function handle(e: MouseEvent) { if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) setBulkOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [bulkOpen]);

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const allOnPageSelected = orders.length > 0 && orders.every((o) => selected.has(o._id));

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected((prev) => { const next = new Set(prev); orders.forEach((o) => next.delete(o._id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); orders.forEach((o) => next.add(o._id)); return next; });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  // ── Bulk apply ────────────────────────────────────────────────────────────────
  async function applyBulk() {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);

    if (bulkAction === 'export') {
      const toExport = orders.filter((o) => ids.includes(o._id));
      exportOrdersToCSV(toExport);
      return;
    }
    if (bulkAction === 'print') {
      window.print();
      return;
    }

    // Status update
    const VALID_STATUS_ACTIONS = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!VALID_STATUS_ACTIONS.includes(bulkAction)) return;

    setBulkLoading(true);
    await Promise.all(ids.map((id) => handleStatusChange(id, bulkAction as OrderStatus)));
    setBulkLoading(false);
    setSelected(new Set());
    setBulkAction('');
  }

  // ── Status change (single) ───────────────────────────────────────────────────
  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status: newStatus } : o));
      if (detailOrder?._id === id) setDetailOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch { /* ignore */ }
  }

  // ── Clear filters ─────────────────────────────────────────────────────────────
  function clearFilters() {
    setPaymentMethod('');
    setPaymentStatus('');
    setDateRange('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  }

  // ── Pagination pages ──────────────────────────────────────────────────────────
  const [jumpValue, setJumpValue] = useState('');
  function handleJump(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) setPage(n);
    setJumpValue('');
  }
  function getPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    pages.push(1);
    if (left  > 2)           pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  // ── Names ─────────────────────────────────────────────────────────────────────
  const adminFullName  = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`         : '—';
  const adminShortName = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.`     : '—';
  const adminRoleLabel = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} strokeWidth={1.8} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  const DATE_RANGE_OPTIONS = [
    { value: 'all',    label: 'All Time'   },
    { value: 'today',  label: 'Today'      },
    { value: 'week',   label: 'This Week'  },
    { value: 'month',  label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ] as const;

  const PAYMENT_METHOD_OPTIONS = [
    { value: '',              label: 'All Methods'     },
    { value: 'paystack',      label: 'Paystack'        },
    { value: 'bank-transfer', label: 'Bank Transfer'   },
  ] as const;

  const PAYMENT_STATUS_OPTIONS = [
    { value: '',         label: 'All Statuses' },
    { value: 'paid',     label: 'Paid'         },
    { value: 'pending',  label: 'Pending'      },
    { value: 'failed',   label: 'Failed'       },
    { value: 'refunded', label: 'Refunded'     },
  ] as const;

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
          pageTitle="Orders Management"
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
                  <h1 className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Orders Management
                  </h1>
                  <span
                    className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {stats ? stats.totalOrders : '—'} Orders
                  </span>
                </div>
                <p className="text-[0.54rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Manage, track, and fulfil customer orders.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <HeaderButton
                  icon={<RefreshCw size={12} strokeWidth={1.8} />}
                  label="Refresh"
                  onClick={fetchOrders}
                />
                <HeaderButton
                  icon={<Download size={12} strokeWidth={1.8} />}
                  label="Export Orders"
                  onClick={() => exportOrdersToCSV(orders)}
                />
                <HeaderButton
                  icon={<Printer size={12} strokeWidth={1.8} />}
                  label="Print All"
                  onClick={() => window.print()}
                />
              </div>
            </div>

            {/* ── Key Stats Bar ─────────────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
              <StatCard
                value={stats ? String(stats.totalOrders) : '—'}
                label="Total Orders"
                sub="All Time"
                color="neutral"
              />
              <StatCard
                value={stats ? String(stats.pendingOrders) : '—'}
                label="Pending Orders"
                sub="Awaiting Processing"
                color="amber"
                onClick={() => { setStatusTab('pending'); setPage(1); }}
              />
              <StatCard
                value={stats ? String(stats.pendingBankTransfers) : '—'}
                label="Pending Bank Transfers"
                sub="Awaiting Verification"
                color="red"
                urgent={!!(stats && stats.pendingBankTransfers > 0)}
                onClick={() => { setPaymentMethod('bank-transfer'); setPaymentStatus('pending'); setPage(1); }}
              />
              <StatCard
                value={stats ? String(stats.todayOrders) : '—'}
                label="Today's Orders"
                sub="Placed Today"
                color="green"
              />
              <StatCard
                value={stats ? formatNaira(stats.totalRevenue) : '—'}
                label="Total Revenue"
                sub="All Time Revenue"
                color="gold"
              />
            </div>

            {/* ── Search Bar ────────────────────────────────────────────────── */}
            <div className="relative">
              <Search size={13} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.22)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number, customer name, or email..."
                className="w-full h-10 pl-9 pr-9 text-[0.58rem] tracking-[0.06em] outline-none transition-all duration-150"
                style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)' }}
                onFocus={(e)  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.14)'; }}
                onBlur={(e)   => { e.currentTarget.style.border = search ? '1px solid rgba(180,130,60,0.22)' : '1px solid rgba(255,255,255,0.06)'; }}
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.62)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
                    aria-label="Clear search"
                  >
                    <X size={12} strokeWidth={2} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Status Tabs ───────────────────────────────────────────────── */}
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-0" style={{ minWidth: 'max-content' }}>
                {STATUS_TABS.map((tab) => {
                  const count   = tab.value === 'all' ? (stats?.totalOrders ?? 0) : (statusCounts[tab.value] ?? 0);
                  const active  = statusTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => { setStatusTab(tab.value); setPage(1); }}
                      className="flex items-center gap-1.5 h-9 px-4 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150 whitespace-nowrap"
                      style={{
                        borderBottom: `2px solid ${active ? GOLD : 'transparent'}`,
                        color:        active ? GOLD : 'rgba(255,255,255,0.32)',
                        background:   active ? 'rgba(180,130,60,0.04)' : 'transparent',
                      }}
                    >
                      {tab.label}
                      <span
                        className="flex items-center justify-center min-w-[18px] h-4 px-1 text-[0.40rem] tracking-[0.06em] font-semibold"
                        style={{
                          background: active ? 'rgba(180,130,60,0.20)' : 'rgba(255,255,255,0.07)',
                          color:      active ? GOLD : 'rgba(255,255,255,0.28)',
                          border:     `1px solid ${active ? 'rgba(180,130,60,0.25)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginTop: '-1px' }} />
            </div>

            {/* ── Secondary Filters + Sort ──────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label="Payment Method"
                value={paymentMethod}
                options={PAYMENT_METHOD_OPTIONS}
                onChange={setPaymentMethod}
              />
              <FilterDropdown
                label="Payment Status"
                value={paymentStatus}
                options={PAYMENT_STATUS_OPTIONS}
                onChange={setPaymentStatus}
              />

              {/* Date Range */}
              <div className="relative" ref={undefined}>
                <FilterDropdown
                  label="Date Range"
                  value={dateRange}
                  options={DATE_RANGE_OPTIONS}
                  onChange={(v) => {
                    setDateRange(v as DateRange);
                    if (v === 'custom') setDatePickerOpen(true);
                    else { setDateFrom(''); setDateTo(''); setDatePickerOpen(false); }
                  }}
                />
              </div>

              {/* Custom date picker */}
              <AnimatePresence>
                {dateRange === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-8 px-2 text-[0.52rem] tracking-[0.06em] outline-none"
                      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', colorScheme: 'dark' }}
                    />
                    <span className="text-[0.44rem]" style={{ color: 'rgba(255,255,255,0.20)' }}>—</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-8 px-2 text-[0.52rem] tracking-[0.06em] outline-none"
                      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', colorScheme: 'dark' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Amount Range */}
              <div className="flex items-center gap-1 h-8 px-3" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-[0.50rem] tracking-[0.08em] shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }}>₦</span>
                <input type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} placeholder="Min" className="w-14 bg-transparent outline-none text-[0.56rem] tracking-[0.06em] tabular-nums" style={{ color: 'rgba(255,255,255,0.55)' }} />
                <span className="text-[0.44rem] shrink-0 px-0.5" style={{ color: 'rgba(255,255,255,0.16)' }}>—</span>
                <input type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} placeholder="Max" className="w-14 bg-transparent outline-none text-[0.56rem] tracking-[0.06em] tabular-nums" style={{ color: 'rgba(255,255,255,0.55)' }} />
              </div>

              {/* Divider */}
              <div className="w-px h-5 mx-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

              <SortDropdown value={sort} onChange={setSort} />

              <div className="flex-1" />

              {/* Active filter badge + clear */}
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }} className="flex items-center gap-2">
                    <span className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] font-semibold uppercase" style={{ background: 'rgba(180,130,60,0.10)', color: GOLD, border: '1px solid rgba(180,130,60,0.22)' }}>
                      {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                    </span>
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 h-7 px-3 text-[0.52rem] tracking-[0.10em] transition-colors duration-150"
                      style={{ color: 'rgba(255,255,255,0.32)', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.32)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; }}
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
                  style={{ background: '#1A1A1A', border: '1px solid rgba(180,130,60,0.18)' }}
                >
                  <span className="text-[0.52rem] tracking-[0.08em] font-medium" style={{ color: GOLD }}>
                    {selected.size} {selected.size === 1 ? 'order' : 'orders'} selected
                  </span>

                  {/* Bulk action dropdown */}
                  <div className="relative" ref={bulkRef}>
                    <button
                      onClick={() => setBulkOpen((o) => !o)}
                      className="flex items-center gap-1.5 h-8 px-3 text-[0.54rem] tracking-[0.10em] transition-colors duration-150"
                      style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.52)' }}
                    >
                      <span>{bulkAction ? BULK_ACTIONS.find((a) => a.value === bulkAction)?.label : 'Choose Action'}</span>
                      <ChevronDown size={11} strokeWidth={2} style={{ transform: bulkOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
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
                          {BULK_ACTIONS.map((action) => {
                            const sel = action.value === bulkAction;
                            return (
                              <button
                                key={action.value}
                                onClick={() => { setBulkAction(action.value); setBulkOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.56rem] tracking-[0.08em] transition-colors duration-100"
                                style={{ color: sel ? GOLD : 'rgba(255,255,255,0.52)', background: sel ? 'rgba(180,130,60,0.08)' : 'transparent' }}
                                onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; } }}
                                onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; } }}
                              >
                                <span className="text-[0.48rem] shrink-0 w-3 text-center" style={{ color: GOLD, opacity: sel ? 1 : 0 }}>✓</span>
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
                      background: bulkAction ? 'rgba(180,130,60,0.14)' : 'rgba(255,255,255,0.02)',
                      color:      bulkAction ? GOLD : 'rgba(255,255,255,0.20)',
                      border:     `1px solid ${bulkAction ? 'rgba(180,130,60,0.28)' : 'rgba(255,255,255,0.06)'}`,
                      cursor:     !bulkAction || bulkLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {bulkLoading ? <Loader2 size={11} strokeWidth={1.8} className="animate-spin" /> : null}
                    Apply
                  </button>

                  {/* Deselect all */}
                  <button
                    onClick={() => { setSelected(new Set()); setBulkAction(''); }}
                    className="text-[0.50rem] tracking-[0.10em] underline underline-offset-2 transition-colors duration-100"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
                  >
                    Deselect All
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Orders Table ──────────────────────────────────────────────── */}
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#141414' }}>
              {/* Table meta row */}
              <div className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[0.50rem] tracking-[0.12em] shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Showing{' '}
                  <span style={{ color: 'rgba(255,255,255,0.50)' }}>
                    {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)}
                  </span>{' '}
                  of{' '}
                  <span style={{ color: 'rgba(255,255,255,0.50)' }}>{totalItems}</span>{' '}
                  orders
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[0.46rem] tracking-[0.10em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>Per page</span>
                  <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {([10, 20, 50] as const).map((size, idx) => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className="h-6 px-2.5 text-[0.46rem] tracking-[0.10em] transition-colors duration-100"
                        style={{ background: pageSize === size ? 'rgba(180,130,60,0.12)' : 'transparent', color: pageSize === size ? GOLD : 'rgba(255,255,255,0.28)', borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.07)' : undefined }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {/* Select all */}
                      <th className="px-4 py-3 w-8">
                        <Checkbox checked={allOnPageSelected} onChange={toggleAll} />
                      </th>
                      {[
                        { label: 'Order',    cls: 'px-4' },
                        { label: 'Customer', cls: 'px-4' },
                        { label: 'Items',    cls: 'px-4' },
                        { label: 'Total',    cls: 'px-4' },
                        { label: 'Payment',  cls: 'px-4' },
                        { label: 'Delivery', cls: 'px-4' },
                        { label: 'Status',   cls: 'px-4' },
                        { label: 'Actions',  cls: 'px-4' },
                      ].map((col) => (
                        <th key={col.label} className={`${col.cls} py-3 text-left text-[0.46rem] tracking-[0.18em] uppercase font-semibold`} style={{ color: 'rgba(255,255,255,0.20)' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-14 text-center">
                          <Loader2 size={18} strokeWidth={1.8} className="animate-spin inline-block" style={{ color: GOLD }} />
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-14 text-center">
                          <p className="text-[0.56rem] tracking-[0.10em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                            No orders match your search or filters.
                          </p>
                          {(search || activeFilterCount > 0 || statusTab !== 'all') && (
                            <button
                              onClick={() => { setSearch(''); clearFilters(); setStatusTab('all'); }}
                              className="mt-3 text-[0.52rem] tracking-[0.12em] underline underline-offset-2"
                              style={{ color: 'rgba(180,130,60,0.60)' }}
                            >
                              Clear all
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <OrderRow
                          key={order._id}
                          order={order}
                          selected={selected.has(order._id)}
                          onToggle={() => toggleOne(order._id)}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[0.50rem] tracking-[0.12em] shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }}>
                      Showing{' '}
                      <span style={{ color: 'rgba(255,255,255,0.50)' }}>{totalItems === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)}</span>
                      {' '}of{' '}
                      <span style={{ color: 'rgba(255,255,255,0.50)' }}>{totalItems}</span>{' '}
                      orders
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div style={{ display: 'flex' }}>
                      <PaginationBtn disabled={page === 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft size={11} strokeWidth={2} />
                        <span className="text-[0.46rem] tracking-[0.10em]">Prev</span>
                      </PaginationBtn>
                      {getPages().map((p, i) =>
                        p === '...' ? (
                          <span key={`dots-${i}`} className="flex items-center justify-center w-7 h-7 text-[0.46rem]" style={{ color: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.06)', marginLeft: '-1px' }}>…</span>
                        ) : (
                          <PaginationBtn key={p} active={p === page} onClick={() => setPage(p as number)}>
                            <span className="text-[0.48rem] tracking-[0.06em] tabular-nums">{p}</span>
                          </PaginationBtn>
                        ),
                      )}
                      <PaginationBtn disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        <span className="text-[0.46rem] tracking-[0.10em]">Next</span>
                        <ChevronRight size={11} strokeWidth={2} />
                      </PaginationBtn>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.46rem] tracking-[0.08em] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.22)' }}>Go to</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpValue}
                        onChange={(e) => setJumpValue(e.target.value)}
                        onKeyDown={handleJump}
                        placeholder="—"
                        className="w-10 h-6 bg-transparent text-center text-[0.50rem] tracking-[0.06em] outline-none tabular-nums"
                        style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
                      />
                      <span className="text-[0.46rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>/ {totalPages}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Order Detail Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailOrder && (
          <OrderDetailDrawer
            order={detailOrder}
            onClose={() => setDetailOrder(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
