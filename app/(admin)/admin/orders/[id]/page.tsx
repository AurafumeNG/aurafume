'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  ChevronDown,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  X,
  AlertTriangle,
  Package,
  CreditCard,
  Banknote,
  MapPin,
  Truck,
  User,
  Gift,
  FileText,
  Clock,
  Trash2,
  RotateCcw,
  CheckCircle2,
  CircleDot,
  Circle,
  Tag,
  Phone,
  ChevronRight,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import Image from 'next/image';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';
const GOLD_BG = 'rgba(180,130,60,';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type PaymentMethod = 'bank-transfer' | 'paystack';

interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  scentFamily: string;
  image: string;
  size: string;
  pricePerUnit: number;
  qty: number;
}

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  userId?: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    apt?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  items: OrderItem[];
  gift: {
    isGift: boolean;
    message?: string;
    wrapping: boolean;
    hidePrice: boolean;
  };
  pricing: {
    subtotal: number;
    discount: number;
    couponCode?: string;
    couponLabel?: string;
    deliveryFee: number;
    giftWrapFee: number;
    total: number;
  };
  delivery: {
    option: string;
    label: string;
    duration: string;
    notes?: string;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    paystackRef?: string;
    paidAt?: string;
    amountPaid?: number;
  };
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

interface TrackingInfo {
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

interface AdminNote {
  id: string;
  content: string;
  adminName: string;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  actor: string;
  isSystem: boolean;
  createdAt: string;
}

interface RefundRecord {
  id: string;
  amount: number;
  type: 'full' | 'partial';
  method: 'original' | 'store-credit';
  reason: string;
  note?: string;
  processedBy: string;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
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

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeShort(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}


// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: 'rgba(251,191,36,0.10)',
    text: 'rgba(251,191,36,0.90)',
    border: 'rgba(251,191,36,0.25)',
  },
  confirmed: {
    bg: 'rgba(96,165,250,0.10)',
    text: 'rgba(96,165,250,0.90)',
    border: 'rgba(96,165,250,0.25)',
  },
  processing: {
    bg: 'rgba(139,92,246,0.10)',
    text: 'rgba(139,92,246,0.90)',
    border: 'rgba(139,92,246,0.25)',
  },
  shipped: { bg: `${GOLD_BG}0.12)`, text: GOLD, border: `${GOLD_BG}0.30)` },
  delivered: {
    bg: 'rgba(74,222,128,0.10)',
    text: 'rgba(74,222,128,0.90)',
    border: 'rgba(74,222,128,0.25)',
  },
  cancelled: {
    bg: 'rgba(239,68,68,0.10)',
    text: 'rgba(239,68,68,0.90)',
    border: 'rgba(239,68,68,0.25)',
  },
};

const PAYMENT_STATUS_COLOR: Record<
  PaymentStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: 'rgba(251,191,36,0.10)',
    text: 'rgba(251,191,36,0.90)',
    border: 'rgba(251,191,36,0.25)',
  },
  paid: {
    bg: 'rgba(74,222,128,0.10)',
    text: 'rgba(74,222,128,0.90)',
    border: 'rgba(74,222,128,0.25)',
  },
  failed: {
    bg: 'rgba(239,68,68,0.10)',
    text: 'rgba(239,68,68,0.90)',
    border: 'rgba(239,68,68,0.25)',
  },
  refunded: {
    bg: 'rgba(96,165,250,0.10)',
    text: 'rgba(96,165,250,0.90)',
    border: 'rgba(96,165,250,0.25)',
  },
};

const TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Payment Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const CANCEL_REASONS = [
  'Customer Request',
  'Item Out of Stock',
  'Payment Failed',
  'Fraudulent Order',
  'Other',
];

const REFUND_REASONS = [
  'Damaged Item',
  'Wrong Item Sent',
  'Customer Changed Mind',
  'Item Not Received',
  'Other',
];

const COURIER_OPTIONS = ['DHL', 'GIG Logistics', 'Kwik', 'RedStar', 'Other'];

// ── Small reusable UI pieces ───────────────────────────────────────────────────

function SectionHeading({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span style={{ color: GOLD }}>{icon}</span>
      <h2
        className="text-[0.58rem] tracking-[0.22em] uppercase font-semibold"
        style={{ color: 'rgba(255,255,255,0.70)' }}
      >
        {label}
      </h2>
    </div>
  );
}

function Card({
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

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center h-6 px-3 text-[0.52rem] tracking-[0.14em] uppercase font-semibold"
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const c = PAYMENT_STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center justify-center w-6 h-6 transition-colors duration-100 shrink-0"
      style={{
        color: copied ? 'rgba(74,222,128,0.80)' : 'rgba(255,255,255,0.28)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,0.60)';
      }}
      onMouseLeave={(e) => {
        if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
      }}
      title="Copy"
    >
      {copied ? (
        <Check size={10} strokeWidth={2.5} />
      ) : (
        <Copy size={10} strokeWidth={1.8} />
      )}
    </button>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-2"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <span
        className="text-[0.50rem] tracking-[0.10em] uppercase shrink-0"
        style={{ color: 'rgba(255,255,255,0.28)' }}
      >
        {label}
      </span>
      <span
        className={`text-[0.56rem] tracking-[0.04em] text-right ${mono ? 'font-mono' : ''}`}
        style={{ color: 'rgba(255,255,255,0.72)' }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  confirmDanger = false,
  loading = false,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  confirmDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-[420px] p-6"
        style={{
          background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3
            className="text-[0.64rem] tracking-[0.12em] uppercase font-semibold"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')
            }
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        {body && (
          <p
            className="text-[0.56rem] tracking-[0.04em] mb-5 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {body}
          </p>
        )}
        {children}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.40)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')
            }
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
            style={{
              background: confirmDanger
                ? 'rgba(239,68,68,0.14)'
                : `${GOLD_BG}0.14)`,
              color: confirmDanger ? 'rgba(239,68,68,0.90)' : GOLD,
              border: `1px solid ${confirmDanger ? 'rgba(239,68,68,0.28)' : `${GOLD_BG}0.28)`}`,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading && (
              <Loader2 size={11} strokeWidth={1.8} className="animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label
        className="block text-[0.46rem] tracking-[0.14em] uppercase mb-1.5"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-3 text-[0.54rem] tracking-[0.04em] outline-none appearance-none"
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'rgba(255,255,255,0.72)',
      }}
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ModalTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-3 py-2 text-[0.54rem] tracking-[0.04em] outline-none resize-none leading-relaxed"
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'rgba(255,255,255,0.72)',
      }}
    />
  );
}

function ModalInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-8 px-3 text-[0.54rem] tracking-[0.04em] outline-none"
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'rgba(255,255,255,0.72)',
      }}
    />
  );
}

// ── Page Header ────────────────────────────────────────────────────────────────

function PageHeader({
  order,
  onPrintInvoice,
}: {
  order: OrderDetail;
  onPrintInvoice: () => void;
}) {
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSendEmail() {
    setEmailSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setEmailSending(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pt-1 mb-6">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-[0.50rem] tracking-[0.12em] uppercase mb-3 transition-colors duration-100"
          style={{ color: 'rgba(255,255,255,0.30)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')
          }
        >
          <ArrowLeft size={11} strokeWidth={2} />
          Orders
        </Link>
        <h1
          className="text-[0.80rem] tracking-[0.18em] uppercase font-semibold"
          style={{ color: 'rgba(255,255,255,0.88)' }}
        >
          Order <span style={{ color: GOLD }}>{order.orderNumber}</span>
        </h1>
        <p
          className="mt-1 text-[0.52rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.32)' }}
        >
          Placed on {formatDateTime(order.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <ActionBtn
          icon={<Printer size={12} strokeWidth={1.8} />}
          label="Print Invoice"
          onClick={onPrintInvoice}
        />
        <ActionBtn
          icon={<Download size={12} strokeWidth={1.8} />}
          label="Export PDF"
          onClick={onPrintInvoice}
        />
        <ActionBtn
          icon={
            emailSending ? (
              <Loader2 size={12} strokeWidth={1.8} className="animate-spin" />
            ) : emailSent ? (
              <Check size={12} strokeWidth={2} />
            ) : (
              <Mail size={12} strokeWidth={1.8} />
            )
          }
          label={emailSent ? 'Sent!' : 'Send Email Update'}
          onClick={handleSendEmail}
          highlight={emailSent}
        />
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 h-8 px-3 text-[0.48rem] tracking-[0.12em] uppercase transition-colors duration-100"
      style={{
        background: highlight ? `${GOLD_BG}0.12)` : 'rgba(255,255,255,0.03)',
        color: highlight ? GOLD : 'rgba(255,255,255,0.50)',
        border: `1px solid ${highlight ? `${GOLD_BG}0.28)` : 'rgba(255,255,255,0.08)'}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${GOLD_BG}0.08)`;
        e.currentTarget.style.color = GOLD;
        e.currentTarget.style.borderColor = `${GOLD_BG}0.22)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = highlight
          ? `${GOLD_BG}0.12)`
          : 'rgba(255,255,255,0.03)';
        e.currentTarget.style.color = highlight
          ? GOLD
          : 'rgba(255,255,255,0.50)';
        e.currentTarget.style.borderColor = highlight
          ? `${GOLD_BG}0.28)`
          : 'rgba(255,255,255,0.08)';
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Status Bar ─────────────────────────────────────────────────────────────────

function StatusBar({
  order,
  onStatusChange,
}: {
  order: OrderDetail;
  onStatusChange: (status: OrderStatus, note: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const nexts = NEXT_STATUSES[order.status];

  async function confirm() {
    if (!target) return;
    setLoading(true);
    await onStatusChange(target, note);
    setLoading(false);
    setTarget(null);
    setNote('');
  }

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p
                className="text-[0.44rem] tracking-[0.16em] uppercase mb-2"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                Current Status
              </p>
              <StatusBadge status={order.status} />
            </div>
            <div
              className="hidden sm:block w-px h-8"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
            <div className="hidden sm:block">
              <p
                className="text-[0.44rem] tracking-[0.10em] uppercase"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                Last Updated
              </p>
              <p
                className="mt-1 text-[0.52rem] tracking-[0.04em]"
                style={{ color: 'rgba(255,255,255,0.50)' }}
              >
                {formatDateShort(order.updatedAt)}
              </p>
            </div>
          </div>

          {nexts.length > 0 && (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
                style={{
                  background: `${GOLD_BG}0.12)`,
                  color: GOLD,
                  border: `1px solid ${GOLD_BG}0.28)`,
                }}
              >
                Update Status
                <ChevronDown
                  size={11}
                  strokeWidth={2}
                  style={{
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 z-20 py-1 min-w-[160px]"
                    style={{
                      background: '#1C1C1C',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.50)',
                    }}
                  >
                    {nexts.map((s) => {
                      const c = STATUS_COLOR[s];
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            setTarget(s);
                            setOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-100"
                          style={{ color: 'rgba(255,255,255,0.50)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = c.text;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color =
                              'rgba(255,255,255,0.50)';
                          }}
                        >
                          <span style={{ color: c.text }}>→</span> {s}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {nexts.length === 0 && (
            <p
              className="text-[0.48rem] tracking-[0.10em] uppercase"
              style={{ color: 'rgba(255,255,255,0.20)' }}
            >
              No further updates
            </p>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {target && (
          <ConfirmModal
            title={`Update status to "${target}"?`}
            body="This will update the order status and optionally notify the customer."
            confirmLabel="Confirm Update"
            loading={loading}
            onConfirm={confirm}
            onClose={() => {
              setTarget(null);
              setNote('');
            }}
          >
            <ModalField label="Note for this update (optional)">
              <ModalTextarea
                value={note}
                onChange={setNote}
                placeholder="Add a note for this status update…"
              />
            </ModalField>
          </ConfirmModal>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Status Timeline ────────────────────────────────────────────────────────────

function StatusTimeline({ order }: { order: OrderDetail }) {
  const currentIdx =
    order.status === 'cancelled' ? -1 : STATUS_ORDER.indexOf(order.status);

  if (order.status === 'cancelled') {
    return (
      <Card>
        <SectionHeading
          icon={<Clock size={14} strokeWidth={1.8} />}
          label="Order Timeline"
        />
        <div
          className="flex items-center gap-3 p-4"
          style={{
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <X
            size={16}
            strokeWidth={2}
            style={{ color: 'rgba(239,68,68,0.70)' }}
          />
          <div>
            <p
              className="text-[0.56rem] tracking-[0.06em] font-semibold"
              style={{ color: 'rgba(239,68,68,0.80)' }}
            >
              Order Cancelled
            </p>
            <p
              className="mt-0.5 text-[0.48rem] tracking-[0.04em]"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              {formatDateTime(order.updatedAt)}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeading
        icon={<Clock size={14} strokeWidth={1.8} />}
        label="Order Timeline"
      />
      <div className="relative">
        {/* Connector line */}
        <div
          className="absolute top-4 left-4 right-4 h-px"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div className="flex items-start justify-between relative">
          {TIMELINE_STEPS.map((step, i) => {
            const done = i <= currentIdx;
            const current = i === currentIdx;
            const c = done ? STATUS_COLOR[step.key] : null;
            return (
              <div
                key={step.key}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div
                  className="relative z-10 flex items-center justify-center w-8 h-8 transition-all duration-200"
                  style={{
                    background: done
                      ? (c?.bg ?? 'transparent')
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${done ? (c?.border ?? 'transparent') : 'rgba(255,255,255,0.10)'}`,
                  }}
                >
                  {done ? (
                    current ? (
                      <CircleDot
                        size={14}
                        strokeWidth={1.8}
                        style={{ color: c?.text }}
                      />
                    ) : (
                      <CheckCircle2
                        size={14}
                        strokeWidth={1.8}
                        style={{ color: c?.text }}
                      />
                    )
                  ) : (
                    <Circle
                      size={14}
                      strokeWidth={1.5}
                      style={{ color: 'rgba(255,255,255,0.18)' }}
                    />
                  )}
                </div>
                <div className="text-center px-1">
                  <p
                    className="text-[0.46rem] tracking-[0.08em] font-medium"
                    style={{
                      color: done
                        ? 'rgba(255,255,255,0.72)'
                        : 'rgba(255,255,255,0.22)',
                    }}
                  >
                    {step.label}
                  </p>
                  {current && (
                    <p
                      className="mt-0.5 text-[0.40rem] tracking-[0.04em]"
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                    >
                      {formatDateShort(order.updatedAt)}
                      <br />
                      {formatTimeShort(order.updatedAt)}
                    </p>
                  )}
                  {i === 0 && (
                    <p
                      className="mt-0.5 text-[0.40rem] tracking-[0.04em]"
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                    >
                      {formatDateShort(order.createdAt)}
                      <br />
                      {formatTimeShort(order.createdAt)}
                    </p>
                  )}
                  {!done && i !== 0 && (
                    <p
                      className="mt-0.5 text-[0.40rem] tracking-[0.04em]"
                      style={{ color: 'rgba(255,255,255,0.18)' }}
                    >
                      Awaiting
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ── Payment Information ────────────────────────────────────────────────────────

function PaymentBlock({ order }: { order: OrderDetail }) {
  const { payment } = order;
  const ref =
    payment.method === 'paystack'
      ? (payment.paystackRef ?? '—')
      : order.orderNumber;

  return (
    <Card>
      <SectionHeading
        icon={<CreditCard size={14} strokeWidth={1.8} />}
        label="Payment Information"
      />
      <div className="space-y-0">
        <InfoRow
          label="Method"
          value={
            <span className="flex items-center gap-1.5">
              {payment.method === 'paystack' ? (
                <>
                  <CreditCard
                    size={11}
                    strokeWidth={1.8}
                    style={{ color: GOLD }}
                  />{' '}
                  Paystack
                </>
              ) : (
                <>
                  <Banknote
                    size={11}
                    strokeWidth={1.8}
                    style={{ color: GOLD }}
                  />{' '}
                  Bank Transfer
                </>
              )}
            </span>
          }
        />
        <InfoRow
          label="Status"
          value={<PaymentStatusBadge status={payment.status} />}
        />
        <InfoRow
          label="Amount Paid"
          value={
            payment.amountPaid != null
              ? formatNaira(payment.amountPaid)
              : formatNaira(order.pricing.total)
          }
        />
        <InfoRow
          label="Reference"
          value={
            <span className="flex items-center gap-1.5">
              <span className="font-mono">{ref}</span>
              <CopyButton text={ref} />
            </span>
          }
        />
        {payment.paidAt && (
          <InfoRow label="Paid At" value={formatDateTime(payment.paidAt)} />
        )}
        <InfoRow
          label="Gateway"
          value={
            payment.method === 'paystack' ? 'Paystack' : 'Manual Verification'
          }
        />
      </div>
    </Card>
  );
}

// ── Order Items ────────────────────────────────────────────────────────────────

function OrderItemsBlock({ order }: { order: OrderDetail }) {
  const { pricing, items } = order;
  return (
    <Card>
      <SectionHeading
        icon={<Package size={14} strokeWidth={1.8} />}
        label="Order Items"
      />
      <div className="space-y-0">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Thumbnail */}
            <a
              href={`/products/${item.slug}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
            >
              <div
                className="relative w-12 h-12 flex items-center justify-center overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Package
                    size={18}
                    strokeWidth={1.5}
                    style={{ color: 'rgba(255,255,255,0.18)' }}
                  />
                )}
              </div>
            </a>
            <div className="flex-1 min-w-0">
              <a
                href={`/products/${item.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <p
                  className="text-[0.58rem] tracking-[0.04em] font-medium hover:underline"
                  style={{ color: 'rgba(255,255,255,0.80)' }}
                >
                  {item.name}
                </p>
              </a>
              <p
                className="mt-0.5 text-[0.46rem] tracking-[0.08em]"
                style={{ color: GOLD }}
              >
                <Tag size={9} strokeWidth={1.8} className="inline mr-1" />
                {item.scentFamily}
              </p>
              <p
                className="mt-0.5 text-[0.46rem] tracking-[0.06em]"
                style={{ color: 'rgba(255,255,255,0.30)' }}
              >
                {item.size} · qty {item.qty} · {formatNaira(item.pricePerUnit)}{' '}
                each
              </p>
            </div>
            <p
              className="text-[0.58rem] tracking-[0.04em] font-semibold tabular-nums shrink-0"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              {formatNaira(item.pricePerUnit * item.qty)}
            </p>
          </div>
        ))}
      </div>

      {/* Pricing breakdown */}
      <div className="mt-4 space-y-1.5">
        {[
          { label: 'Subtotal', val: pricing.subtotal, show: true },
          {
            label: `Discount${pricing.couponCode ? ` (${pricing.couponCode})` : ''}`,
            val: -pricing.discount,
            show: pricing.discount > 0,
          },
          { label: 'Delivery', val: pricing.deliveryFee, show: true },
          {
            label: 'Gift Wrap',
            val: pricing.giftWrapFee,
            show: pricing.giftWrapFee > 0,
          },
        ]
          .filter((r) => r.show)
          .map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-1"
            >
              <span
                className="text-[0.50rem] tracking-[0.08em]"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {row.label}
              </span>
              <span
                className="text-[0.52rem] tracking-[0.04em] tabular-nums"
                style={{
                  color:
                    row.val < 0
                      ? 'rgba(74,222,128,0.75)'
                      : 'rgba(255,255,255,0.55)',
                }}
              >
                {row.val < 0
                  ? `−${formatNaira(Math.abs(row.val))}`
                  : formatNaira(row.val)}
              </span>
            </div>
          ))}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span
            className="text-[0.56rem] tracking-[0.10em] font-semibold uppercase"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Grand Total
          </span>
          <span
            className="text-[0.74rem] tracking-[0.04em] font-semibold tabular-nums"
            style={{ color: 'rgba(255,255,255,0.88)' }}
          >
            {formatNaira(pricing.total)}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Delivery Information ───────────────────────────────────────────────────────

function DeliveryBlock({ order }: { order: OrderDetail }) {
  const { shippingAddress: addr, contact, delivery } = order;
  const fullAddress = [
    addr.street,
    addr.apt,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card>
      <SectionHeading
        icon={<MapPin size={14} strokeWidth={1.8} />}
        label="Delivery Information"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address */}
        <div>
          <p
            className="text-[0.44rem] tracking-[0.16em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Delivery Address
          </p>
          <p
            className="text-[0.58rem] tracking-[0.04em] font-medium"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            {contact.firstName} {contact.lastName}
          </p>
          <p
            className="mt-1 text-[0.54rem] tracking-[0.04em] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {addr.street}
            {addr.apt ? `, ${addr.apt}` : ''}
            <br />
            {addr.city}, {addr.state}
            {addr.postalCode ? ` ${addr.postalCode}` : ''}
            <br />
            {addr.country}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Phone
              size={10}
              strokeWidth={1.8}
              style={{ color: 'rgba(255,255,255,0.28)' }}
            />
            <a
              href={`tel:${contact.phone}`}
              className="text-[0.52rem] tracking-[0.04em]"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              {contact.phone}
            </a>
          </div>
          <CopyButton text={fullAddress} />
        </div>

        {/* Delivery Method */}
        <div>
          <p
            className="text-[0.44rem] tracking-[0.16em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Delivery Method
          </p>
          <p
            className="text-[0.58rem] tracking-[0.04em] font-medium"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            {delivery.label}
          </p>
          <p
            className="mt-1 text-[0.52rem] tracking-[0.04em]"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Est. {delivery.duration}
          </p>
          <p
            className="mt-1 text-[0.52rem] tracking-[0.04em]"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {formatNaira(order.pricing.deliveryFee)} delivery fee
          </p>
          {delivery.notes && (
            <div
              className="mt-3 p-2.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p
                className="text-[0.44rem] tracking-[0.12em] uppercase mb-1"
                style={{ color: 'rgba(255,255,255,0.20)' }}
              >
                Delivery Note
              </p>
              <p
                className="text-[0.52rem] tracking-[0.04em] leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.50)' }}
              >
                {delivery.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Shipment Tracking ─────────────────────────────────────────────────────────

function TrackingBlock({ order }: { order: OrderDetail }) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [courier, setCourier] = useState('');
  const [trackNum, setTrackNum] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [saving, setSaving] = useState(false);

  if (!['shipped', 'delivered'].includes(order.status)) return null;

  async function save() {
    if (!courier || !trackNum) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setTracking({
      courier,
      trackingNumber: trackNum,
      trackingUrl: trackUrl || undefined,
    });
    setSaving(false);
    setEditing(false);
  }

  return (
    <Card>
      <SectionHeading
        icon={<Truck size={14} strokeWidth={1.8} />}
        label="Shipment Tracking"
      />
      {!tracking ? (
        <div>
          {!editing ? (
            <div className="flex flex-col items-start gap-3">
              <p
                className="text-[0.52rem] tracking-[0.04em]"
                style={{ color: 'rgba(255,255,255,0.30)' }}
              >
                No tracking information added yet.
              </p>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 h-8 px-3 text-[0.48rem] tracking-[0.12em] uppercase transition-colors duration-100"
                style={{
                  background: `${GOLD_BG}0.10)`,
                  color: GOLD,
                  border: `1px solid ${GOLD_BG}0.25)`,
                }}
              >
                Add Tracking Info
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-sm">
              <ModalField label="Courier">
                <ModalSelect
                  value={courier}
                  onChange={setCourier}
                  options={COURIER_OPTIONS}
                />
              </ModalField>
              <ModalField label="Tracking Number">
                <ModalInput
                  value={trackNum}
                  onChange={setTrackNum}
                  placeholder="e.g. DHL-1234567890"
                />
              </ModalField>
              <ModalField label="Tracking URL (optional)">
                <ModalInput
                  value={trackUrl}
                  onChange={setTrackUrl}
                  placeholder="https://track.dhl.com/…"
                />
              </ModalField>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={save}
                  disabled={!courier || !trackNum || saving}
                  className="flex items-center gap-1.5 h-8 px-4 text-[0.48rem] tracking-[0.12em] uppercase"
                  style={{
                    background: `${GOLD_BG}0.14)`,
                    color: GOLD,
                    border: `1px solid ${GOLD_BG}0.28)`,
                    opacity: !courier || !trackNum ? 0.5 : 1,
                  }}
                >
                  {saving && <Loader2 size={11} className="animate-spin" />}
                  Save Tracking Info
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[0.48rem] tracking-[0.10em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-[0.58rem] tracking-[0.06em] font-semibold"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                {tracking.courier}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="font-mono text-[0.54rem]"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  {tracking.trackingNumber}
                </span>
                <CopyButton text={tracking.trackingNumber} />
              </div>
              {tracking.trackingUrl && (
                <a
                  href={tracking.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-[0.50rem] tracking-[0.08em] uppercase"
                  style={{ color: GOLD }}
                >
                  Track Package <ExternalLink size={10} strokeWidth={1.8} />
                </a>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-[0.48rem] tracking-[0.10em] uppercase"
              style={{ color: 'rgba(255,255,255,0.28)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')
              }
            >
              Edit
            </button>
          </div>
          {editing && (
            <div
              className="space-y-3 max-w-sm pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <ModalField label="Courier">
                <ModalSelect
                  value={courier || tracking.courier}
                  onChange={setCourier}
                  options={COURIER_OPTIONS}
                />
              </ModalField>
              <ModalField label="Tracking Number">
                <ModalInput
                  value={trackNum || tracking.trackingNumber}
                  onChange={setTrackNum}
                  placeholder="Tracking number"
                />
              </ModalField>
              <ModalField label="Tracking URL (optional)">
                <ModalInput
                  value={trackUrl || (tracking.trackingUrl ?? '')}
                  onChange={setTrackUrl}
                  placeholder="https://…"
                />
              </ModalField>
              <div className="flex gap-2">
                <button
                  onClick={save}
                  className="flex items-center gap-1.5 h-8 px-4 text-[0.48rem] tracking-[0.12em] uppercase"
                  style={{
                    background: `${GOLD_BG}0.14)`,
                    color: GOLD,
                    border: `1px solid ${GOLD_BG}0.28)`,
                  }}
                >
                  {saving && <Loader2 size={11} className="animate-spin" />}{' '}
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[0.48rem] tracking-[0.10em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Customer Information ───────────────────────────────────────────────────────

function CustomerBlock({ order }: { order: OrderDetail }) {
  const { contact } = order;
  const name = `${contact.firstName} ${contact.lastName}`;
  const initials =
    `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();

  return (
    <Card>
      <SectionHeading
        icon={<User size={14} strokeWidth={1.8} />}
        label="Customer Information"
      />
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 flex items-center justify-center text-[0.64rem] font-semibold shrink-0"
          style={{
            background: `${GOLD_BG}0.15)`,
            color: GOLD,
            border: `1px solid ${GOLD_BG}0.28)`,
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p
            className="text-[0.60rem] tracking-[0.04em] font-semibold"
            style={{ color: 'rgba(255,255,255,0.82)' }}
          >
            {name}
          </p>
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1 text-[0.54rem] tracking-[0.04em] hover:underline"
            style={{ color: 'rgba(255,255,255,0.42)' }}
          >
            <Mail size={10} strokeWidth={1.8} /> {contact.email}
          </a>
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-1 text-[0.54rem] tracking-[0.04em] hover:underline"
            style={{ color: 'rgba(255,255,255,0.42)' }}
          >
            <Phone size={10} strokeWidth={1.8} /> {contact.phone}
          </a>
        </div>
      </div>
      {order.userId && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Link
            href={`/admin/customers/${order.userId}`}
            className="inline-flex items-center gap-1 text-[0.50rem] tracking-[0.10em] uppercase"
            style={{ color: GOLD }}
          >
            View Customer Profile <ChevronRight size={11} strokeWidth={2} />
          </Link>
        </div>
      )}
    </Card>
  );
}

// ── Gift Information ───────────────────────────────────────────────────────────

function GiftBlock({ order }: { order: OrderDetail }) {
  if (!order.gift?.isGift) return null;
  const { gift } = order;

  return (
    <Card>
      <SectionHeading
        icon={<Gift size={14} strokeWidth={1.8} />}
        label="Gift Information"
      />
      <div className="space-y-0">
        <InfoRow label="Gift Wrapping" value={gift.wrapping ? 'Yes' : 'No'} />
        <InfoRow label="Price Hidden" value={gift.hidePrice ? 'Yes' : 'No'} />
      </div>
      {gift.message && (
        <div
          className="mt-4 p-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${GOLD_BG}0.18)`,
            borderLeft: `3px solid ${GOLD}`,
          }}
        >
          <p
            className="text-[0.44rem] tracking-[0.14em] uppercase mb-2"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Gift Message
          </p>
          <p
            className="text-[0.56rem] tracking-[0.04em] leading-relaxed italic"
            style={{ color: 'rgba(255,255,255,0.60)' }}
          >
            "{gift.message}"
          </p>
        </div>
      )}
    </Card>
  );
}

// ── Order Notes ────────────────────────────────────────────────────────────────

function NotesBlock({ order }: { order: OrderDetail }) {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  async function addNote() {
    if (!newNote.trim()) return;
    setAdding(true);
    await new Promise((r) => setTimeout(r, 500));
    setNotes((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        content: newNote.trim(),
        adminName: 'Admin',
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewNote('');
    setAdding(false);
  }

  return (
    <Card>
      <SectionHeading
        icon={<FileText size={14} strokeWidth={1.8} />}
        label="Order Notes"
      />
      <div className="space-y-5">
        {/* Customer notes */}
        <div>
          <p
            className="text-[0.44rem] tracking-[0.16em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Customer Notes
          </p>
          {order.delivery.notes ? (
            <div
              className="p-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p
                className="text-[0.54rem] tracking-[0.04em] leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {order.delivery.notes}
              </p>
            </div>
          ) : (
            <p
              className="text-[0.52rem] tracking-[0.04em]"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              No notes from customer.
            </p>
          )}
        </div>

        {/* Admin notes */}
        <div>
          <p
            className="text-[0.44rem] tracking-[0.16em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Admin Notes
          </p>
          {notes.length > 0 && (
            <div className="space-y-2 mb-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-3"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex-1">
                    <p
                      className="text-[0.54rem] tracking-[0.04em] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.62)' }}
                    >
                      {n.content}
                    </p>
                    <p
                      className="mt-1.5 text-[0.44rem] tracking-[0.08em]"
                      style={{ color: 'rgba(255,255,255,0.22)' }}
                    >
                      {n.adminName} · {formatDateShort(n.createdAt)}{' '}
                      {formatTimeShort(n.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotes((prev) => prev.filter((x) => x.id !== n.id))
                    }
                    className="shrink-0 transition-colors duration-100"
                    style={{ color: 'rgba(255,255,255,0.18)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = 'rgba(239,68,68,0.60)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')
                    }
                  >
                    <Trash2 size={12} strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <ModalTextarea
              value={newNote}
              onChange={setNewNote}
              placeholder="Add an internal note visible only to admins…"
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim() || adding}
              className="flex items-center gap-1.5 h-8 px-4 text-[0.48rem] tracking-[0.12em] uppercase transition-all duration-100"
              style={{
                background: `${GOLD_BG}0.10)`,
                color: GOLD,
                border: `1px solid ${GOLD_BG}0.22)`,
                opacity: !newNote.trim() ? 0.4 : 1,
              }}
            >
              {adding && <Loader2 size={11} className="animate-spin" />}
              Add Note
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Activity Log ───────────────────────────────────────────────────────────────

function ActivityLog({ order }: { order: OrderDetail }) {
  const baseEntries: ActivityEntry[] = [
    {
      id: '1',
      action: 'Order placed by customer',
      actor: 'Customer',
      isSystem: false,
      createdAt: order.createdAt,
    },
    ...(order.payment.status === 'paid'
      ? [
          {
            id: '2',
            action: `Payment confirmed via ${order.payment.method === 'paystack' ? 'Paystack' : 'bank transfer'}`,
            actor: 'System',
            isSystem: true,
            createdAt: order.payment.paidAt ?? order.createdAt,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <SectionHeading
        icon={<Clock size={14} strokeWidth={1.8} />}
        label="Activity Log"
      />
      <div className="relative">
        <div
          className="absolute top-0 bottom-0 left-[11px] w-px"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div className="space-y-4 pl-7">
          {baseEntries.map((entry) => (
            <div key={entry.id} className="relative">
              <div
                className="absolute -left-[24px] top-0.5 w-5 h-5 flex items-center justify-center"
                style={{
                  background: entry.isSystem
                    ? 'rgba(96,165,250,0.10)'
                    : `${GOLD_BG}0.10)`,
                  border: `1px solid ${entry.isSystem ? 'rgba(96,165,250,0.22)' : `${GOLD_BG}0.22)`}`,
                }}
              >
                {entry.isSystem ? (
                  <CircleDot
                    size={9}
                    strokeWidth={1.8}
                    style={{ color: 'rgba(96,165,250,0.70)' }}
                  />
                ) : (
                  <User size={9} strokeWidth={1.8} style={{ color: GOLD }} />
                )}
              </div>
              <p
                className="text-[0.54rem] tracking-[0.04em]"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                {entry.action}
              </p>
              <p
                className="mt-0.5 text-[0.44rem] tracking-[0.08em]"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {entry.actor} · {formatDateTime(entry.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Refund & Cancellation ─────────────────────────────────────────────────────

function RedBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
      style={{
        background: 'rgba(239,68,68,0.06)',
        color: 'rgba(239,68,68,0.75)',
        border: '1px solid rgba(239,68,68,0.20)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
        e.currentTarget.style.color = 'rgba(239,68,68,0.92)';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
        e.currentTarget.style.color = 'rgba(239,68,68,0.75)';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)';
      }}
    >
      {icon} {label}
    </button>
  );
}

function RefundCancellationBlock({
  order,
  onStatusChange,
}: {
  order: OrderDetail;
  onStatusChange: (status: OrderStatus, note: string) => Promise<void>;
}) {
  // ── modal open states ──
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  // ── cancel fields ──
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // ── refund fields ──
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState<'original' | 'store-credit'>(
    'original',
  );
  const [refundReason, setRefundReason] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refunding, setRefunding] = useState(false);

  // ── refund history (local until API exists) ──
  const [refundHistory, setRefundHistory] = useState<RefundRecord[]>([]);

  const canCancel = ['pending', 'confirmed', 'processing'].includes(
    order.status,
  );
  const canRefund =
    order.payment.status === 'paid' &&
    ['delivered', 'cancelled'].includes(order.status);

  if (!canCancel && !canRefund && refundHistory.length === 0) return null;

  // ── helpers ──
  function resetCancel() {
    setCancelReason('');
    setCancelNote('');
  }
  function resetRefund() {
    setRefundType('full');
    setRefundAmount('');
    setRefundMethod('original');
    setRefundReason('');
    setRefundNote('');
  }

  const partialAmt = parseFloat(refundAmount) || 0;
  const refundAmountFinal =
    refundType === 'full' ? order.pricing.total : partialAmt;
  const refundValid =
    refundReason !== '' &&
    (refundType === 'full' ||
      (partialAmt > 0 && partialAmt <= order.pricing.total));

  async function handleCancel() {
    if (!cancelReason) return;
    setCancelling(true);
    await onStatusChange('cancelled', cancelNote);
    setCancelling(false);
    setCancelOpen(false);
    resetCancel();
  }

  async function handleRefund() {
    if (!refundValid) return;
    setRefunding(true);
    await new Promise((r) => setTimeout(r, 900));
    const record: RefundRecord = {
      id: String(Date.now()),
      amount: refundAmountFinal,
      type: refundType,
      method: refundMethod,
      reason: refundReason,
      note: refundNote || undefined,
      processedBy: 'Admin',
      createdAt: new Date().toISOString(),
    };
    setRefundHistory((prev) => [record, ...prev]);
    setRefunding(false);
    setRefundOpen(false);
    resetRefund();
  }

  const totalRefunded = refundHistory.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <Card>
        <SectionHeading
          icon={<RotateCcw size={14} strokeWidth={1.8} />}
          label="Refund & Cancellation"
        />

        {/* ── Action buttons ── */}
        {(canCancel || canRefund) && (
          <div className="flex flex-wrap gap-3 mb-5">
            {canCancel && (
              <RedBtn
                icon={<X size={11} strokeWidth={2} />}
                label="Cancel Order"
                onClick={() => setCancelOpen(true)}
              />
            )}
            {canRefund && (
              <RedBtn
                icon={<RotateCcw size={11} strokeWidth={2} />}
                label="Issue Refund"
                onClick={() => setRefundOpen(true)}
              />
            )}
          </div>
        )}

        {/* ── Refund history ── */}
        {refundHistory.length > 0 && (
          <div>
            {(canCancel || canRefund) && (
              <div
                className="mb-4"
                style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }}
              />
            )}
            <p
              className="text-[0.44rem] tracking-[0.16em] uppercase mb-3"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              Refund History
              {totalRefunded > 0 && (
                <span
                  className="ml-2 normal-case tracking-normal"
                  style={{ color: 'rgba(74,222,128,0.70)' }}
                >
                  — {formatNaira(totalRefunded)} total refunded
                </span>
              )}
            </p>
            <div style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Header */}
              <div
                className="grid text-[0.42rem] tracking-[0.14em] uppercase px-4 py-2.5"
                style={{
                  gridTemplateColumns: '1fr 1fr 1fr 2fr',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.22)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <span>Amount</span>
                <span>Date</span>
                <span>Processed By</span>
                <span>Reason</span>
              </div>
              {refundHistory.map((r) => (
                <div
                  key={r.id}
                  className="grid items-start px-4 py-3 text-[0.52rem] tracking-[0.04em]"
                  style={{
                    gridTemplateColumns: '1fr 1fr 1fr 2fr',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: 'rgba(74,222,128,0.80)',
                        fontWeight: 600,
                      }}
                    >
                      {formatNaira(r.amount)}
                    </span>
                    <span
                      className="ml-1.5 text-[0.42rem] tracking-[0.10em] uppercase px-1.5 py-px"
                      style={{
                        background:
                          r.type === 'full'
                            ? 'rgba(96,165,250,0.10)'
                            : 'rgba(251,191,36,0.10)',
                        color:
                          r.type === 'full'
                            ? 'rgba(96,165,250,0.80)'
                            : 'rgba(251,191,36,0.80)',
                        border: `1px solid ${r.type === 'full' ? 'rgba(96,165,250,0.20)' : 'rgba(251,191,36,0.20)'}`,
                      }}
                    >
                      {r.type}
                    </span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {formatDateShort(r.createdAt)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.50)' }}>
                    {r.processedBy}
                  </span>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {r.reason}
                    </span>
                    {r.note && (
                      <p
                        className="mt-0.5 text-[0.44rem] leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {r.note}
                      </p>
                    )}
                    <span
                      className="mt-1 inline-block text-[0.42rem] tracking-[0.10em] uppercase px-1.5 py-px"
                      style={{
                        background:
                          r.method === 'original'
                            ? 'rgba(180,130,60,0.08)'
                            : 'rgba(139,92,246,0.10)',
                        color:
                          r.method === 'original'
                            ? GOLD
                            : 'rgba(167,139,250,0.80)',
                        border: `1px solid ${r.method === 'original' ? `${GOLD_BG}0.20)` : 'rgba(167,139,250,0.20)'}`,
                      }}
                    >
                      {r.method === 'original'
                        ? 'Original method'
                        : 'Store credit'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Cancel modal ── */}
      <AnimatePresence>
        {cancelOpen && (
          <ConfirmModal
            title="Cancel this order?"
            body="The order will be cancelled and the customer will be notified by email automatically."
            confirmLabel="Confirm Cancellation"
            confirmDanger
            loading={cancelling}
            onConfirm={handleCancel}
            onClose={() => {
              setCancelOpen(false);
              resetCancel();
            }}
          >
            <ModalField label="Cancellation Reason *">
              <ModalSelect
                value={cancelReason}
                onChange={setCancelReason}
                options={CANCEL_REASONS}
              />
            </ModalField>
            <ModalField label="Additional Note (optional)">
              <ModalTextarea
                value={cancelNote}
                onChange={setCancelNote}
                placeholder="Any additional context for the team…"
              />
            </ModalField>
            {!cancelReason && (
              <p
                className="text-[0.46rem] tracking-[0.06em]"
                style={{ color: 'rgba(239,68,68,0.60)' }}
              >
                Please select a reason to continue.
              </p>
            )}
          </ConfirmModal>
        )}
      </AnimatePresence>

      {/* ── Refund modal ── */}
      <AnimatePresence>
        {refundOpen && (
          <ConfirmModal
            title="Issue a Refund"
            body="Refunds are processed manually. Confirm the details below and process through your payment provider."
            confirmLabel="Process Refund"
            confirmDanger
            loading={refunding}
            onConfirm={handleRefund}
            onClose={() => {
              setRefundOpen(false);
              resetRefund();
            }}
          >
            {/* Refund type */}
            <ModalField label="Refund Type">
              <div className="flex gap-2">
                {(['full', 'partial'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setRefundType(t)}
                    className="h-7 px-3 text-[0.46rem] tracking-[0.10em] uppercase transition-colors duration-100"
                    style={{
                      background:
                        refundType === t
                          ? 'rgba(239,68,68,0.10)'
                          : 'transparent',
                      color:
                        refundType === t
                          ? 'rgba(239,68,68,0.85)'
                          : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${refundType === t ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.10)'}`,
                    }}
                  >
                    {t === 'full'
                      ? `Full Refund — ${formatNaira(order.pricing.total)}`
                      : 'Partial Refund'}
                  </button>
                ))}
              </div>
            </ModalField>

            {/* Partial amount input */}
            {refundType === 'partial' && (
              <ModalField
                label={`Refund Amount (₦) — max ${formatNaira(order.pricing.total)}`}
              >
                <ModalInput
                  value={refundAmount}
                  onChange={setRefundAmount}
                  placeholder="Enter amount"
                  type="number"
                />
                {partialAmt > order.pricing.total && (
                  <p
                    className="mt-1 text-[0.44rem] tracking-[0.06em]"
                    style={{ color: 'rgba(239,68,68,0.70)' }}
                  >
                    Amount exceeds order total.
                  </p>
                )}
              </ModalField>
            )}

            {/* Refund method */}
            <ModalField label="Refund Method">
              <div className="flex gap-2">
                {(
                  [
                    {
                      value: 'original',
                      label: 'Original Payment Method',
                      disabled: false,
                    },
                    {
                      value: 'store-credit',
                      label: 'Store Credit (Phase 2)',
                      disabled: true,
                    },
                  ] as {
                    value: 'original' | 'store-credit';
                    label: string;
                    disabled: boolean;
                  }[]
                ).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      if (!m.disabled) setRefundMethod(m.value);
                    }}
                    disabled={m.disabled}
                    className="h-7 px-3 text-[0.46rem] tracking-[0.08em] uppercase transition-colors duration-100"
                    style={{
                      background:
                        refundMethod === m.value
                          ? `${GOLD_BG}0.10)`
                          : 'transparent',
                      color: m.disabled
                        ? 'rgba(255,255,255,0.18)'
                        : refundMethod === m.value
                          ? GOLD
                          : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${refundMethod === m.value ? `${GOLD_BG}0.25)` : 'rgba(255,255,255,0.10)'}`,
                      cursor: m.disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </ModalField>

            {/* Reason */}
            <ModalField label="Reason *">
              <ModalSelect
                value={refundReason}
                onChange={setRefundReason}
                options={REFUND_REASONS}
              />
            </ModalField>

            {/* Internal note */}
            <ModalField label="Internal Note (optional)">
              <ModalTextarea
                value={refundNote}
                onChange={setRefundNote}
                placeholder="Internal note visible only to admins…"
              />
            </ModalField>

            {/* Summary line */}
            {refundValid && (
              <div
                className="flex items-center justify-between px-3 py-2 mt-1"
                style={{
                  background: 'rgba(74,222,128,0.05)',
                  border: '1px solid rgba(74,222,128,0.15)',
                }}
              >
                <span
                  className="text-[0.46rem] tracking-[0.10em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  Refund total
                </span>
                <span
                  className="text-[0.60rem] tracking-[0.04em] font-semibold"
                  style={{ color: 'rgba(74,222,128,0.85)' }}
                >
                  {formatNaira(refundAmountFinal)}
                </span>
              </div>
            )}
          </ConfirmModal>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Danger Zone ────────────────────────────────────────────────────────────────

function DangerZone({
  order,
  onDelete,
}: {
  order: OrderDetail;
  onDelete: () => Promise<void>;
}) {
  const isDeletable =
    order.status === 'cancelled' && order.payment.status !== 'paid';
  if (!isDeletable) return null;

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [inputVal, setInputVal] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (inputVal !== order.orderNumber) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  return (
    <div
      className="p-5 md:p-6"
      style={{
        background: 'rgba(239,68,68,0.03)',
        border: '1px solid rgba(239,68,68,0.18)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle
          size={14}
          strokeWidth={1.8}
          style={{ color: 'rgba(239,68,68,0.70)' }}
        />
        <h2
          className="text-[0.58rem] tracking-[0.22em] uppercase font-semibold"
          style={{ color: 'rgba(239,68,68,0.70)' }}
        >
          Danger Zone
        </h2>
      </div>
      <p
        className="text-[0.54rem] tracking-[0.04em] mb-4 leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        Permanently delete this order. This action cannot be undone. Only
        cancelled orders with no payments can be deleted.
      </p>

      {step === 0 && (
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase"
          style={{
            background: 'rgba(239,68,68,0.06)',
            color: 'rgba(239,68,68,0.70)',
            border: '1px solid rgba(239,68,68,0.18)',
          }}
        >
          <Trash2 size={11} strokeWidth={1.8} /> Delete Order
        </button>
      )}

      {step === 1 && (
        <div className="space-y-3 max-w-sm">
          <div
            className="flex items-start gap-2 p-3"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <AlertTriangle
              size={13}
              strokeWidth={1.8}
              style={{
                color: 'rgba(239,68,68,0.70)',
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <p
              className="text-[0.52rem] tracking-[0.04em] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              Are you sure you want to delete order{' '}
              <strong style={{ color: 'rgba(255,255,255,0.72)' }}>
                {order.orderNumber}
              </strong>
              ? This is irreversible.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase"
              style={{
                background: 'rgba(239,68,68,0.12)',
                color: 'rgba(239,68,68,0.85)',
                border: '1px solid rgba(239,68,68,0.28)',
              }}
            >
              Yes, Continue
            </button>
            <button
              onClick={() => setStep(0)}
              className="h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 max-w-sm">
          <p
            className="text-[0.52rem] tracking-[0.04em]"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Type{' '}
            <strong
              style={{
                color: 'rgba(255,255,255,0.70)',
                fontFamily: 'monospace',
              }}
            >
              {order.orderNumber}
            </strong>{' '}
            to confirm deletion.
          </p>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={order.orderNumber}
            className="w-full h-8 px-3 font-mono text-[0.54rem] tracking-[0.04em] outline-none"
            style={{
              background: '#111',
              border: `1px solid ${inputVal === order.orderNumber ? 'rgba(239,68,68,0.40)' : 'rgba(255,255,255,0.10)'}`,
              color: 'rgba(255,255,255,0.72)',
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={inputVal !== order.orderNumber || deleting}
              className="flex items-center gap-1.5 h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase transition-all"
              style={{
                background:
                  inputVal === order.orderNumber
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(239,68,68,0.04)',
                color:
                  inputVal === order.orderNumber
                    ? 'rgba(239,68,68,0.90)'
                    : 'rgba(239,68,68,0.30)',
                border: '1px solid rgba(239,68,68,0.28)',
              }}
            >
              {deleting && <Loader2 size={11} className="animate-spin" />}
              <Trash2 size={11} strokeWidth={1.8} /> Delete Permanently
            </button>
            <button
              onClick={() => {
                setStep(0);
                setInputVal('');
              }}
              className="h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Fetch order ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${id}`);
        if (!res.ok) {
          setError('Order not found.');
          return;
        }
        const json = (await res.json()) as { data?: OrderDetail };
        if (!cancelled && json.data) setOrder(json.data);
      } catch {
        setError('Failed to load order.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, authLoading]);

  async function handleStatusChange(status: OrderStatus, _note: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrder((prev) =>
        prev ? { ...prev, status, updatedAt: new Date().toISOString() } : prev,
      );
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/orders');
  }

  const adminFullName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName}`
    : '—';
  const adminShortName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName[0]}.`
    : '—';
  const adminRoleLabel =
    adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  if (authLoading || loading) {
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

  if (error || !order) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: '#0F0F0F' }}
      >
        <p
          className="text-[0.60rem] tracking-[0.10em]"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          {error || 'Order not found.'}
        </p>
        <Link
          href="/admin/orders"
          className="text-[0.50rem] tracking-[0.12em] uppercase underline"
          style={{ color: GOLD }}
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  function handlePrintInvoice() {
    router.push(`/admin/orders/${id}/invoice`);
  }

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
          pageTitle={`Order ${order.orderNumber}`}
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 max-w-[1400px]">
            <PageHeader order={order} onPrintInvoice={handlePrintInvoice} />

            {/* Two-column layout */}
            <div className="flex flex-col xl:flex-row gap-5">
              {/* ── Left column (main) ──────────────────────────────────── */}
              <div className="flex-1 min-w-0 space-y-5">
                <StatusBar order={order} onStatusChange={handleStatusChange} />
                <StatusTimeline order={order} />
                <OrderItemsBlock order={order} />
                <DeliveryBlock order={order} />
                <TrackingBlock order={order} />
                <NotesBlock order={order} />
                <ActivityLog order={order} />
                <RefundCancellationBlock
                  order={order}
                  onStatusChange={handleStatusChange}
                />
                <DangerZone order={order} onDelete={handleDelete} />
              </div>

              {/* ── Right column (sidebar) ──────────────────────────────── */}
              <div className="xl:w-[320px] shrink-0 space-y-5">
                <PaymentBlock order={order} />
                <CustomerBlock order={order} />
                <GiftBlock order={order} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
