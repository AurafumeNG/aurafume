'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter }                         from 'next/navigation';
import Link                                  from 'next/link';
import Image                                 from 'next/image';
import { AnimatePresence, motion }           from 'motion/react';
import {
  ArrowLeft,
  Mail,
  Download,
  ShieldBan,
  ShieldCheck,
  BadgeCheck,
  AlertCircle,
  Phone,
  Calendar,
  Clock,
  ShoppingBag,
  Heart,
  TrendingUp,
  Star,
  MapPin,
  Package,
  CreditCard,
  Banknote,
  Eye,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  User,
  Lock,
  Activity,
  MessageSquare,
  BarChart2,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav  from '@/components/admin/AdminTopNav';
import type { ApiResponse } from '@/types/auth';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD     = 'oklch(0.53 0.09 70)';
const GOLD_BG  = 'rgba(180,130,60,';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus   = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type PaymentMethod = 'bank-transfer' | 'paystack';

interface CustomerProfile {
  _id:         string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phone?:      string;
  isVerified:  boolean;
  isSuspended?: boolean;
  provider:    'local' | 'google';
  avatar?:     string;
  role:        string;
  wishlist:    string[];
  addresses:   Address[];
  createdAt:   string;
  updatedAt:   string;
}

interface Address {
  _id?:      string;
  label:     string;
  street:    string;
  apt?:      string;
  city:      string;
  state:     string;
  postalCode: string;
  country:   string;
  isDefault: boolean;
}

interface CustomerStats {
  totalOrders:    number;
  totalSpent:     number;
  avgOrderValue:  number;
  wishlistCount:  number;
  lastOrderDate:  string | null;
  favoriteCategory: string | null;
}

interface BehaviourStats {
  fragranceCategories: { name: string; count: number }[];
  preferredSizes:      { size: string; count: number }[];
  paymentMethods:      { method: string; count: number; percentage: number }[];
  orderFrequencyDays:  number | null;
  peakShoppingDay:     string | null;
  promoCodes:          { code: string; label?: string; discount: number }[];
  totalDiscount:       number;
}

interface AdminOrderItem {
  name:         string;
  scentFamily:  string;
  image:        string;
  size:         string;
  pricePerUnit: number;
  qty:          number;
}

interface CustomerOrder {
  _id:         string;
  orderNumber: string;
  status:      OrderStatus;
  items:       AdminOrderItem[];
  pricing:     { subtotal: number; discount: number; deliveryFee: number; total: number; couponCode?: string };
  payment:     { method: PaymentMethod; status: PaymentStatus };
  delivery:    { label: string };
  createdAt:   string;
  updatedAt:   string;
}

interface WishlistProduct {
  _id:      string;
  name:     string;
  slug:     string;
  images:   { url: string; publicId: string }[];
  variants: { size: string; price: number; stock: number }[];
  status:   string;
}

interface AdminNoteRecord {
  _id:       string;
  adminName: string;
  content:   string;
  createdAt: string;
}

interface ActivityEvent {
  id:       string;
  type:     string;
  label:    string;
  actor:    string;
  isSystem: boolean;
  date:     string;
}

interface AdminUser {
  _id:       string;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ── Shared UI Primitives ───────────────────────────────────────────────────────

function SectionHeading({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <span style={{ color: GOLD }}>{icon}</span>
        <h2 className="text-[0.58rem] tracking-[0.22em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {label}
        </h2>
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 md:p-6 ${className}`} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[0.48rem] tracking-[0.14em] uppercase shrink-0 pt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
        {label}
      </span>
      <span className={`text-[0.58rem] tracking-[0.04em] text-right ${mono ? 'font-mono' : ''}`} style={{ color: 'rgba(255,255,255,0.72)' }}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg: Record<OrderStatus, { bg: string; text: string; border: string }> = {
    pending:    { bg: 'rgba(234,179,8,0.09)',  text: 'rgba(250,204,21,0.85)', border: 'rgba(234,179,8,0.22)'  },
    confirmed:  { bg: 'rgba(99,102,241,0.10)', text: 'rgba(129,140,248,0.85)', border: 'rgba(99,102,241,0.22)' },
    processing: { bg: 'rgba(59,130,246,0.10)', text: 'rgba(96,165,250,0.88)', border: 'rgba(59,130,246,0.22)' },
    shipped:    { bg: `${GOLD_BG}0.10)`,        text: GOLD,                    border: `${GOLD_BG}0.24)`        },
    delivered:  { bg: 'rgba(34,197,94,0.09)',  text: 'rgba(74,222,128,0.88)', border: 'rgba(34,197,94,0.18)'  },
    cancelled:  { bg: 'rgba(239,68,68,0.08)',  text: 'rgba(239,68,68,0.72)',  border: 'rgba(239,68,68,0.18)'  },
  };
  const c = cfg[status];
  return (
    <span className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cfg: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
    pending:  { bg: 'rgba(234,179,8,0.09)',  text: 'rgba(250,204,21,0.75)', border: 'rgba(234,179,8,0.18)'     },
    paid:     { bg: 'rgba(34,197,94,0.09)',  text: 'rgba(74,222,128,0.82)', border: 'rgba(34,197,94,0.16)'     },
    failed:   { bg: 'rgba(239,68,68,0.08)',  text: 'rgba(239,68,68,0.70)',  border: 'rgba(239,68,68,0.16)'     },
    refunded: { bg: 'rgba(255,255,255,0.04)', text: 'rgba(255,255,255,0.38)', border: 'rgba(255,255,255,0.10)' },
  };
  const c = cfg[status];
  return (
    <span className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

function GhostButton({ icon, label, danger, onClick, disabled }: {
  icon:      React.ReactNode;
  label:     string;
  danger?:   boolean;
  onClick?:  () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const dangerColor = danger
    ? { bg: hovered ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.05)', color: 'rgba(239,68,68,0.78)', border: `rgba(239,68,68,${hovered ? '0.28' : '0.18'})` }
    : { bg: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', color: hovered ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.45)', border: `rgba(255,255,255,${hovered ? '0.12' : '0.07'})` };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1.5 h-7 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-150"
      style={{ background: dangerColor.bg, color: dangerColor.color, border: `1px solid ${dangerColor.border}`, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      {icon}
      {label}
    </button>
  );
}

function GoldButton({ icon, label, onClick, loading, disabled }: {
  icon?:     React.ReactNode;
  label:     string;
  onClick?:  () => void;
  loading?:  boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150"
      style={{
        background: hovered ? `${GOLD_BG}0.22)` : `${GOLD_BG}0.12)`,
        color:      GOLD,
        border:     `1px solid ${hovered ? `${GOLD_BG}0.45)` : `${GOLD_BG}0.28)`}`,
        cursor:     (disabled || loading) ? 'not-allowed' : 'pointer',
        opacity:    disabled ? 0.5 : 1,
      }}
    >
      {loading ? <Loader2 size={11} strokeWidth={2} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ── Confirmation Modal ─────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmDanger,
  loading,
  onConfirm,
  onCancel,
  children,
}: {
  title:          string;
  message?:       string;
  confirmLabel:   string;
  confirmDanger?: boolean;
  loading?:       boolean;
  onConfirm:      () => void;
  onCancel:       () => void;
  children?:      React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px]"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.70)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <AlertTriangle size={16} strokeWidth={1.8} style={{ color: confirmDanger ? 'rgba(239,68,68,0.70)' : GOLD, marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-[0.65rem] tracking-[0.08em] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</p>
            {message && <p className="mt-1.5 text-[0.54rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>{message}</p>}
          </div>
        </div>
        {children && <div className="px-6 pb-4">{children}</div>}
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onCancel}
            className="flex items-center h-8 px-4 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
            style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-4 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
            style={{
              background: confirmDanger ? 'rgba(239,68,68,0.12)' : `${GOLD_BG}0.14)`,
              color:      confirmDanger ? 'rgba(239,68,68,0.85)' : GOLD,
              border:     `1px solid ${confirmDanger ? 'rgba(239,68,68,0.28)' : `${GOLD_BG}0.28)`}`,
              cursor:     loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading && <Loader2 size={10} strokeWidth={2} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Email Composer Modal ───────────────────────────────────────────────────────

function EmailComposerModal({ toEmail, toName, onClose }: { toEmail: string; toName: string; onClose: () => void }) {
  const [subject,  setSubject]  = useState('');
  const [body,     setBody]     = useState('');
  const [template, setTemplate] = useState('custom');
  const [sending,  setSending]  = useState(false);

  const TEMPLATES = ['Custom', 'Order Update', 'Promotional', 'Support Reply'] as const;

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[560px]"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.70)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[0.60rem] tracking-[0.20em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Email Customer</p>
            <p className="mt-0.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>To: {toName} &lt;{toEmail}&gt;</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8" style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
            <X size={13} strokeWidth={2} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Template selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TEMPLATES.map((t) => {
              const active = template === t.toLowerCase().replace(' ', '-');
              return (
                <button
                  key={t}
                  onClick={() => setTemplate(t.toLowerCase().replace(' ', '-'))}
                  className="h-6 px-2.5 text-[0.46rem] tracking-[0.10em] uppercase transition-colors duration-100"
                  style={{
                    background: active ? `${GOLD_BG}0.12)` : 'rgba(255,255,255,0.02)',
                    color:      active ? GOLD : 'rgba(255,255,255,0.35)',
                    border:     `1px solid ${active ? `${GOLD_BG}0.25)` : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-[0.46rem] tracking-[0.16em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Subject</label>
            <input
              type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject…"
              className="w-full h-9 px-3 text-[0.58rem] tracking-[0.04em] outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.78)' }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = `${GOLD_BG}0.35)`)}
              onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <div>
            <label className="block text-[0.46rem] tracking-[0.16em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Message</label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" rows={6}
              className="w-full px-3 py-2.5 text-[0.58rem] tracking-[0.04em] outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.78)' }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = `${GOLD_BG}0.35)`)}
              onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} className="flex items-center h-8 px-4 text-[0.52rem] tracking-[0.10em] uppercase" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.07)' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; }}>
            Cancel
          </button>
          <button
            onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-1.5 h-8 px-4 text-[0.52rem] tracking-[0.10em] uppercase"
            style={{ background: `${GOLD_BG}0.14)`, color: GOLD, border: `1px solid ${GOLD_BG}0.28)`, cursor: (sending || !subject.trim() || !body.trim()) ? 'not-allowed' : 'pointer', opacity: (!subject.trim() || !body.trim()) ? 0.5 : 1 }}
          >
            {sending ? <Loader2 size={11} strokeWidth={2} className="animate-spin" /> : <Mail size={11} strokeWidth={2} />}
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();

  // ── Admin auth ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [customer,         setCustomer]         = useState<CustomerProfile | null>(null);
  const [stats,            setStats]            = useState<CustomerStats | null>(null);
  const [behaviour,        setBehaviour]        = useState<BehaviourStats | null>(null);
  const [orders,           setOrders]           = useState<CustomerOrder[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [notes,            setNotes]            = useState<AdminNoteRecord[]>([]);
  const [activityLog,      setActivityLog]      = useState<ActivityEvent[]>([]);
  const [dataLoading,      setDataLoading]      = useState(true);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [emailOpen,        setEmailOpen]        = useState(false);
  const [editingProfile,   setEditingProfile]   = useState(false);
  const [profileEdit,      setProfileEdit]      = useState({ firstName: '', lastName: '', phone: '' });
  const [profileSaving,    setProfileSaving]    = useState(false);
  const [orderTab,         setOrderTab]         = useState<'all' | OrderStatus>('all');
  const [ordersVisible,    setOrdersVisible]    = useState(5);
  const [activityVisible,  setActivityVisible]  = useState(10);
  const [noteInput,        setNoteInput]        = useState('');
  const [noteAdding,       setNoteAdding]       = useState(false);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [suspendModal,     setSuspendModal]     = useState(false);
  const [suspendReason,    setSuspendReason]    = useState('');
  const [suspendNote,      setSuspendNote]      = useState('');
  const [suspendLoading,   setSuspendLoading]   = useState(false);
  const [unsuspendModal,   setUnsuspendModal]   = useState(false);
  const [verifyModal,      setVerifyModal]      = useState(false);
  const [verifyLoading,    setVerifyLoading]    = useState(false);
  const [resetModal,       setResetModal]       = useState(false);
  const [deleteModal,      setDeleteModal]      = useState<1 | 2 | 3 | null>(null);
  const [deleteEmailInput, setDeleteEmailInput] = useState('');
  const [deletePinInput,   setDeletePinInput]   = useState('');
  const [deleteLoading,    setDeleteLoading]    = useState(false);

  const SUSPEND_REASONS = ['Fraudulent Activity', 'Chargeback Abuse', 'Policy Violation', 'Spam', 'Other'];

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

  // ── Fetch customer data ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setDataLoading(true);
      try {
        const res  = await fetch(`/api/admin/customers/${id}`);
        if (res.status === 404) { router.push('/admin/customers'); return; }
        const json = (await res.json()) as ApiResponse<{
          customer:        CustomerProfile;
          stats:           CustomerStats;
          behaviour:       BehaviourStats;
          orders:          CustomerOrder[];
          wishlistProducts: WishlistProduct[];
          notes:           AdminNoteRecord[];
          activityLog:     ActivityEvent[];
        }>;
        if (!cancelled && json.data) {
          setCustomer(json.data.customer);
          setStats(json.data.stats);
          setBehaviour(json.data.behaviour);
          setOrders(json.data.orders);
          setWishlistProducts(json.data.wishlistProducts);
          setNotes(json.data.notes);
          setActivityLog(json.data.activityLog);
          setProfileEdit({
            firstName: json.data.customer.firstName,
            lastName:  json.data.customer.lastName,
            phone:     json.data.customer.phone ?? '',
          });
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, router]);

  // ── Profile save ─────────────────────────────────────────────────────────────
  async function handleProfileSave() {
    setProfileSaving(true);
    const res  = await fetch(`/api/admin/customers/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'update_profile', ...profileEdit }),
    });
    const json = (await res.json()) as ApiResponse<{ firstName: string; lastName: string; phone?: string }>;
    if (json.data && customer) {
      setCustomer({ ...customer, firstName: json.data.firstName, lastName: json.data.lastName, phone: json.data.phone });
    }
    setProfileSaving(false);
    setEditingProfile(false);
  }

  // ── Suspend / unsuspend ──────────────────────────────────────────────────────
  async function handleSuspend() {
    setSuspendLoading(true);
    await fetch(`/api/admin/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'suspend' }) });
    if (customer) setCustomer({ ...customer, isSuspended: true });
    setSuspendLoading(false);
    setSuspendModal(false);
  }

  async function handleUnsuspend() {
    setSuspendLoading(true);
    await fetch(`/api/admin/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unsuspend' }) });
    if (customer) setCustomer({ ...customer, isSuspended: false });
    setSuspendLoading(false);
    setUnsuspendModal(false);
  }

  // ── Verify email ─────────────────────────────────────────────────────────────
  async function handleVerify() {
    setVerifyLoading(true);
    await fetch(`/api/admin/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_email' }) });
    if (customer) setCustomer({ ...customer, isVerified: true });
    setVerifyLoading(false);
    setVerifyModal(false);
  }

  // ── Add note ──────────────────────────────────────────────────────────────────
  async function handleAddNote() {
    if (!noteInput.trim()) return;
    setNoteAdding(true);
    const res  = await fetch(`/api/admin/customers/${id}/notes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: noteInput.trim() }),
    });
    const json = (await res.json()) as ApiResponse<AdminNoteRecord>;
    if (json.data) setNotes((prev) => [json.data!, ...prev]);
    setNoteInput('');
    setNoteAdding(false);
  }

  async function handleDeleteNote(noteId: string) {
    await fetch(`/api/admin/customers/${id}/notes`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ noteId }),
    });
    setNotes((prev) => prev.filter((n) => n._id !== noteId));
  }

  // ── Delete account ────────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeleteLoading(true);
    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
    setDeleteLoading(false);
    if ((await res.json() as ApiResponse).success) {
      router.push('/admin/customers');
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} strokeWidth={1.5} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (!customer) return null;

  const fullName     = `${customer.firstName} ${customer.lastName}`;
  const initials     = getInitials(customer.firstName, customer.lastName);
  const accountStatus: 'suspended' | 'verified' | 'unverified' = customer.isSuspended ? 'suspended' : customer.isVerified ? 'verified' : 'unverified';
  const statusCfg    = {
    suspended:  { label: 'Suspended',  bg: 'rgba(239,68,68,0.08)',  color: 'rgba(239,68,68,0.72)',   border: 'rgba(239,68,68,0.18)'  },
    verified:   { label: 'Verified',   bg: 'rgba(34,197,94,0.09)',  color: 'rgba(74,222,128,0.88)',  border: 'rgba(34,197,94,0.18)'  },
    unverified: { label: 'Unverified', bg: 'rgba(234,179,8,0.09)',  color: 'rgba(250,204,21,0.85)',  border: 'rgba(234,179,8,0.22)'  },
  }[accountStatus];

  const filteredOrders  = orderTab === 'all' ? orders : orders.filter((o) => o.status === orderTab);
  const visibleOrders   = filteredOrders.slice(0, ordersVisible);
  const maxBehavCount   = behaviour?.fragranceCategories[0]?.count ?? 1;

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
          pageTitle="Customer Profile"
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
                <Link
                  href="/admin/customers"
                  className="flex items-center gap-1.5 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >
                  <ArrowLeft size={12} strokeWidth={2} />
                  Customers
                </Link>
                <span style={{ color: 'rgba(255,255,255,0.14)' }}>/</span>
                <span className="text-[0.52rem] tracking-[0.10em] uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Customer Profile
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <GhostButton icon={<Mail size={11} strokeWidth={2} />} label="Send Email" onClick={() => setEmailOpen(true)} />
                <GhostButton icon={<Download size={11} strokeWidth={2} />} label="Export Data" />
                {customer.isSuspended
                  ? <GhostButton icon={<ShieldCheck size={11} strokeWidth={2} />} label="Unsuspend" onClick={() => setUnsuspendModal(true)} />
                  : <GhostButton icon={<ShieldBan size={11} strokeWidth={2} />} label="Suspend Account" danger onClick={() => setSuspendModal(true)} />
                }
              </div>
            </div>

            {/* ── Profile Header Card ──────────────────────────────────────── */}
            <Card>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar */}
                {customer.avatar
                  ? <Image src={customer.avatar} alt={fullName} width={64} height={64} className="w-16 h-16 object-cover shrink-0" style={{ border: `2px solid ${GOLD_BG}0.22)` }} />
                  : (
                    <div className="flex items-center justify-center w-16 h-16 shrink-0 text-[1.1rem] font-semibold" style={{ background: `${GOLD_BG}0.12)`, color: GOLD, border: `2px solid ${GOLD_BG}0.22)` }}>
                      {initials}
                    </div>
                  )
                }

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[0.90rem] tracking-[0.06em] font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {fullName}
                    </h1>
                    <span
                      className="inline-flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
                      style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Mail size={11} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.28)' }} />
                      <span className="text-[0.54rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.55)' }}>{customer.email}</span>
                      {customer.isVerified
                        ? <BadgeCheck size={11} strokeWidth={2} style={{ color: 'rgba(74,222,128,0.75)' }} />
                        : <AlertCircle size={11} strokeWidth={2} style={{ color: 'rgba(250,204,21,0.70)' }} />
                      }
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.28)' }} />
                        <span className="text-[0.54rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.55)' }}>{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={10} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.22)' }} />
                      <span className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Joined {formatDate(customer.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.22)' }} />
                      <span className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Last seen {formatDateShort(customer.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-[0.42rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>Customer ID</p>
                  <p className="mt-0.5 text-[0.50rem] font-mono" style={{ color: 'rgba(255,255,255,0.30)' }}>{customer._id.slice(-8).toUpperCase()}</p>
                  <p className="mt-2 text-[0.42rem] tracking-[0.10em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>{customer.provider === 'google' ? 'Google OAuth' : 'Email/Password'}</p>
                </div>
              </div>
            </Card>

            {/* ── Lifetime Stats Bar ───────────────────────────────────────── */}
            {stats && (
              <div className="flex flex-wrap gap-3">
                {[
                  { value: String(stats.totalOrders), label: 'Orders Placed', icon: <ShoppingBag size={14} strokeWidth={1.8} />, color: 'rgba(255,255,255,0.80)' },
                  { value: formatNaira(stats.totalSpent), label: 'Lifetime Value', icon: <TrendingUp size={14} strokeWidth={1.8} />, color: GOLD },
                  { value: formatNaira(stats.avgOrderValue), label: 'Per Order', icon: <BarChart2 size={14} strokeWidth={1.8} />, color: 'rgba(96,165,250,0.88)' },
                  { value: String(stats.wishlistCount), label: 'Saved Products', icon: <Heart size={14} strokeWidth={1.8} />, color: 'rgba(249,115,22,0.85)' },
                  { value: stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : '—', label: 'Most Recent Order', icon: <Clock size={14} strokeWidth={1.8} />, color: 'rgba(255,255,255,0.65)' },
                  { value: stats.favoriteCategory ?? '—', label: 'Most Purchased', icon: <Star size={14} strokeWidth={1.8} />, color: 'rgba(250,204,21,0.85)' },
                ].map(({ value, label, icon, color }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 p-4"
                    style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', flex: '1 1 130px', minWidth: '120px' }}
                  >
                    <div style={{ color: 'rgba(255,255,255,0.25)' }}>{icon}</div>
                    <p className="text-[1.05rem] font-semibold tracking-tight tabular-nums leading-none" style={{ color }}>{value}</p>
                    <p className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.42)' }}>{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Main content grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Order History */}
                <Card>
                  <SectionHeading
                    icon={<Package size={14} strokeWidth={1.8} />}
                    label="Order History"
                    action={
                      <Link
                        href={`/admin/orders?customerId=${id}`}
                        className="flex items-center gap-1 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-150"
                        style={{ color: GOLD }}
                      >
                        View All Orders <ChevronRight size={10} strokeWidth={2} />
                      </Link>
                    }
                  />

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 mb-4 flex-wrap">
                    {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((tab) => {
                      const active = orderTab === tab;
                      const count  = tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
                      return (
                        <button
                          key={tab}
                          onClick={() => { setOrderTab(tab); setOrdersVisible(5); }}
                          className="flex items-center gap-1 h-6 px-2.5 text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-100"
                          style={{
                            background: active ? `${GOLD_BG}0.12)` : 'rgba(255,255,255,0.02)',
                            color:      active ? GOLD : 'rgba(255,255,255,0.38)',
                            border:     `1px solid ${active ? `${GOLD_BG}0.25)` : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          {tab === 'all' ? 'All' : tab}
                          {count > 0 && (
                            <span className="text-[0.40rem] px-1" style={{ background: active ? `${GOLD_BG}0.18)` : 'rgba(255,255,255,0.06)', color: active ? GOLD : 'rgba(255,255,255,0.30)', border: `1px solid ${active ? `${GOLD_BG}0.20)` : 'rgba(255,255,255,0.06)'}` }}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {filteredOrders.length === 0 ? (
                    <p className="py-8 text-center text-[0.54rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>No orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {visibleOrders.map((order) => (
                        <div
                          key={order._id}
                          className="p-3 transition-colors duration-100"
                          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[0.58rem] tracking-[0.06em] font-mono font-semibold" style={{ color: GOLD }}>{order.orderNumber}</span>
                                <StatusBadge status={order.status} />
                                <PaymentStatusBadge status={order.payment.status} />
                              </div>
                              <p className="mt-0.5 text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                                {formatDateShort(order.createdAt)} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {order.payment.method === 'bank-transfer' ? 'Bank Transfer' : 'Paystack'}
                              </p>
                              <p className="mt-1 text-[0.44rem] tracking-[0.04em] line-clamp-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
                                {order.items.map((i) => i.name).join(', ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-[0.62rem] tracking-[0.04em] font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.78)' }}>
                                {formatNaira(order.pricing.total)}
                              </p>
                              <Link
                                href={`/admin/orders/${order._id}`}
                                className="flex items-center justify-center w-6 h-6 transition-colors duration-100"
                                style={{ color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.06)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                              >
                                <Eye size={11} strokeWidth={1.8} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredOrders.length > ordersVisible && (
                    <button
                      onClick={() => setOrdersVisible((v) => v + 5)}
                      className="w-full mt-3 py-2 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-100"
                      style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                    >
                      Load More ({filteredOrders.length - ordersVisible} remaining)
                    </button>
                  )}
                </Card>

                {/* Purchase Behaviour */}
                {behaviour && (
                  <Card>
                    <SectionHeading icon={<BarChart2 size={14} strokeWidth={1.8} />} label="Purchase Behaviour" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Fragrance Categories */}
                      {behaviour.fragranceCategories.length > 0 && (
                        <div>
                          <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Favourite Categories</p>
                          <div className="space-y-2">
                            {behaviour.fragranceCategories.map(({ name, count }) => (
                              <div key={name}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.62)' }}>{name}</span>
                                  <span className="text-[0.46rem] tracking-[0.06em] tabular-nums" style={{ color: 'rgba(255,255,255,0.30)' }}>{count} orders</span>
                                </div>
                                <div className="h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                  <div className="h-full" style={{ width: `${Math.round((count / maxBehavCount) * 100)}%`, background: `${GOLD_BG}0.65)`, transition: 'width 0.4s ease' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preferred Sizes */}
                      {behaviour.preferredSizes.length > 0 && (
                        <div>
                          <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Preferred Sizes</p>
                          <div className="flex flex-wrap gap-1.5">
                            {behaviour.preferredSizes.map(({ size, count }) => (
                              <span
                                key={size}
                                className="inline-flex items-center gap-1 h-6 px-2.5 text-[0.50rem] tracking-[0.08em]"
                                style={{ background: `${GOLD_BG}0.08)`, color: GOLD, border: `1px solid ${GOLD_BG}0.18)` }}
                              >
                                {size}
                                <span className="text-[0.40rem]" style={{ color: `${GOLD_BG}0.60)` }}>×{count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment Methods */}
                      {behaviour.paymentMethods.length > 0 && (
                        <div>
                          <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Payment Methods</p>
                          <div className="space-y-1.5">
                            {behaviour.paymentMethods.map(({ method, percentage }) => (
                              <div key={method}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.62)' }}>
                                    {method === 'bank-transfer' ? 'Bank Transfer' : 'Paystack'}
                                  </span>
                                  <span className="text-[0.46rem] tabular-nums" style={{ color: 'rgba(255,255,255,0.30)' }}>{percentage}%</span>
                                </div>
                                <div className="h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                  <div className="h-full" style={{ width: `${percentage}%`, background: method === 'bank-transfer' ? 'rgba(99,102,241,0.65)' : `${GOLD_BG}0.65)`, transition: 'width 0.4s ease' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insights */}
                      <div className="space-y-3">
                        <p className="text-[0.46rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.22)' }}>Insights</p>
                        {behaviour.orderFrequencyDays !== null && (
                          <div className="flex items-start gap-2">
                            <RefreshCw size={11} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.22)', marginTop: 1, flexShrink: 0 }} />
                            <p className="text-[0.52rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
                              Places an order every <span style={{ color: GOLD }}>~{behaviour.orderFrequencyDays} days</span> on average
                            </p>
                          </div>
                        )}
                        {behaviour.peakShoppingDay && (
                          <div className="flex items-start gap-2">
                            <Calendar size={11} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.22)', marginTop: 1, flexShrink: 0 }} />
                            <p className="text-[0.52rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
                              Most orders placed on <span style={{ color: GOLD }}>{behaviour.peakShoppingDay}s</span>
                            </p>
                          </div>
                        )}
                        {behaviour.promoCodes.length > 0 && (
                          <div className="flex items-start gap-2">
                            <FileText size={11} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.22)', marginTop: 1, flexShrink: 0 }} />
                            <div>
                              <p className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                                Used codes: {behaviour.promoCodes.map((p) => p.code).join(', ')}
                              </p>
                              <p className="mt-0.5 text-[0.48rem] tracking-[0.04em]" style={{ color: 'rgba(74,222,128,0.65)' }}>
                                Total discount received — {formatNaira(behaviour.totalDiscount)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Wishlist */}
                <Card>
                  <SectionHeading icon={<Heart size={14} strokeWidth={1.8} />} label="Saved Wishlist Items" />
                  {wishlistProducts.length === 0 ? (
                    <p className="py-8 text-center text-[0.54rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>No wishlist items.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {wishlistProducts.map((product) => {
                        const img          = product.images?.[0]?.url;
                        const lowestPrice  = Math.min(...(product.variants?.map((v) => v.price) ?? [0]));
                        const inStock      = product.variants?.some((v) => v.stock > 0) ?? false;
                        return (
                          <div key={product._id} className="flex flex-col gap-2" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="relative aspect-square overflow-hidden" style={{ background: '#1A1A1A' }}>
                              {img
                                ? <Image src={img} alt={product.name} fill className="object-cover" />
                                : <div className="absolute inset-0 flex items-center justify-center"><Package size={20} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.10)' }} /></div>
                              }
                              {!inStock && (
                                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                                  <span className="text-[0.44rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(239,68,68,0.85)' }}>Out of stock</span>
                                </div>
                              )}
                            </div>
                            <div className="px-2 pb-2">
                              <p className="text-[0.54rem] tracking-[0.04em] font-medium line-clamp-1" style={{ color: 'rgba(255,255,255,0.72)' }}>{product.name}</p>
                              <p className="mt-0.5 text-[0.50rem] tabular-nums" style={{ color: GOLD }}>from {formatNaira(lowestPrice)}</p>
                              <Link
                                href={`/admin/products/${product._id}`}
                                className="mt-1.5 flex items-center gap-1 text-[0.44rem] tracking-[0.10em] uppercase transition-colors duration-100"
                                style={{ color: 'rgba(255,255,255,0.28)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
                              >
                                View Product <ChevronRight size={9} strokeWidth={2} />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Activity Log */}
                <Card>
                  <SectionHeading icon={<Activity size={14} strokeWidth={1.8} />} label="Activity Log" />
                  <div className="space-y-0">
                    {activityLog.slice(0, activityVisible).map((event, i) => {
                      const isLast = i === Math.min(activityVisible, activityLog.length) - 1;
                      const iconMap: Record<string, React.ReactNode> = {
                        account_created:  <User size={11} strokeWidth={1.8} />,
                        email_verified:   <BadgeCheck size={11} strokeWidth={1.8} />,
                        order_placed:     <ShoppingBag size={11} strokeWidth={1.8} />,
                        order_shipped:    <Package size={11} strokeWidth={1.8} />,
                        order_delivered:  <CheckCircle2 size={11} strokeWidth={1.8} />,
                        note_added:       <MessageSquare size={11} strokeWidth={1.8} />,
                        account_suspended: <ShieldBan size={11} strokeWidth={1.8} />,
                      };
                      const icon   = iconMap[event.type] ?? <Activity size={11} strokeWidth={1.8} />;
                      const iconColor = event.type === 'account_suspended' ? 'rgba(239,68,68,0.70)' : event.isSystem ? 'rgba(255,255,255,0.25)' : GOLD;
                      return (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="flex items-center justify-center w-6 h-6 mt-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: iconColor, borderRadius: '50%' }}>
                              {icon}
                            </div>
                            {!isLast && <div className="flex-1 w-px mt-1 mb-1" style={{ background: 'rgba(255,255,255,0.06)' }} />}
                          </div>
                          <div className={`flex items-start justify-between gap-3 w-full ${isLast ? 'pb-0' : 'pb-3'}`}>
                            <div>
                              <p className="text-[0.54rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.65)' }}>{event.label}</p>
                              <p className="mt-0.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>by {event.actor}</p>
                            </div>
                            <p className="text-[0.44rem] tracking-[0.04em] shrink-0 pt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{formatDateShort(event.date)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {activityLog.length > activityVisible && (
                    <button
                      onClick={() => setActivityVisible((v) => v + 10)}
                      className="w-full mt-4 py-2 text-[0.52rem] tracking-[0.10em] uppercase"
                      style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                    >
                      Load More
                    </button>
                  )}
                </Card>
              </div>

              {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
              <div className="space-y-6">

                {/* Personal Information */}
                <Card>
                  <SectionHeading
                    icon={<User size={14} strokeWidth={1.8} />}
                    label="Personal Information"
                    action={
                      editingProfile
                        ? <div className="flex items-center gap-1.5">
                            <GhostButton icon={<X size={10} strokeWidth={2} />} label="Cancel" onClick={() => { setEditingProfile(false); setProfileEdit({ firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone ?? '' }); }} />
                            <GoldButton icon={<Save size={10} strokeWidth={2} />} label="Save" loading={profileSaving} onClick={handleProfileSave} />
                          </div>
                        : <GhostButton icon={<Pencil size={10} strokeWidth={2} />} label="Edit" onClick={() => setEditingProfile(true)} />
                    }
                  />

                  {editingProfile ? (
                    <div className="space-y-3">
                      {[
                        { label: 'First Name', key: 'firstName' as const, value: profileEdit.firstName },
                        { label: 'Last Name',  key: 'lastName'  as const, value: profileEdit.lastName  },
                        { label: 'Phone',      key: 'phone'     as const, value: profileEdit.phone     },
                      ].map(({ label, key, value }) => (
                        <div key={key}>
                          <label className="block text-[0.44rem] tracking-[0.14em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setProfileEdit((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full h-8 px-3 text-[0.58rem] tracking-[0.04em] outline-none"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.78)' }}
                            onFocus={(e)  => (e.currentTarget.style.borderColor = `${GOLD_BG}0.35)`)}
                            onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-[0.44rem] tracking-[0.14em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Email (read-only)</label>
                        <input
                          type="text" value={customer.email} readOnly
                          className="w-full h-8 px-3 text-[0.58rem] tracking-[0.04em] outline-none cursor-not-allowed"
                          style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.30)' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y-0">
                      <InfoRow label="First Name"   value={customer.firstName} />
                      <InfoRow label="Last Name"    value={customer.lastName} />
                      <InfoRow label="Email"        value={customer.email} />
                      <InfoRow label="Phone"        value={customer.phone ?? <span style={{ color: 'rgba(255,255,255,0.22)' }}>Not provided</span>} />
                      <InfoRow label="Account"      value={customer.provider === 'google' ? 'Google OAuth' : 'Email / Password'} />
                      <InfoRow label="Joined"       value={formatDate(customer.createdAt)} />
                      <InfoRow
                        label="Email Verified"
                        value={
                          <span style={{ color: customer.isVerified ? 'rgba(74,222,128,0.85)' : 'rgba(250,204,21,0.75)' }}>
                            {customer.isVerified ? 'Yes' : 'No'}
                          </span>
                        }
                      />
                    </div>
                  )}
                </Card>

                {/* Saved Addresses */}
                <Card>
                  <SectionHeading icon={<MapPin size={14} strokeWidth={1.8} />} label="Saved Addresses" />
                  {(!customer.addresses || customer.addresses.length === 0) ? (
                    <p className="py-4 text-center text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>No saved addresses.</p>
                  ) : (
                    <div className="space-y-3">
                      {customer.addresses.map((addr, i) => (
                        <div key={i} className="p-3" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[0.52rem] tracking-[0.08em] font-medium uppercase" style={{ color: 'rgba(255,255,255,0.65)' }}>{addr.label || 'Address'}</span>
                            {addr.isDefault && (
                              <span className="text-[0.42rem] tracking-[0.12em] uppercase px-1.5 py-0.5" style={{ background: `${GOLD_BG}0.10)`, color: GOLD, border: `1px solid ${GOLD_BG}0.20)` }}>Default</span>
                            )}
                          </div>
                          <p className="text-[0.52rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {addr.street}{addr.apt ? `, ${addr.apt}` : ''}<br />
                            {addr.city}, {addr.state} {addr.postalCode}<br />
                            {addr.country}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Communication */}
                <Card>
                  <SectionHeading
                    icon={<Mail size={14} strokeWidth={1.8} />}
                    label="Communication"
                    action={<GoldButton icon={<Mail size={10} strokeWidth={2} />} label="Send Email" onClick={() => setEmailOpen(true)} />}
                  />

                  {/* Email timeline (derived from order events) */}
                  <div className="space-y-3 mb-4">
                    {orders.length === 0 ? (
                      <p className="py-3 text-center text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>No email history.</p>
                    ) : (
                      orders.slice(0, 4).flatMap((o) => {
                        const events: { label: string; date: string; status: string }[] = [
                          { label: `Order ${o.orderNumber} confirmation`, date: o.createdAt, status: 'Sent' },
                        ];
                        if (o.status === 'shipped' || o.status === 'delivered') {
                          events.push({ label: `Order ${o.orderNumber} shipped`, date: o.updatedAt, status: 'Sent' });
                        }
                        if (o.status === 'delivered') {
                          events.push({ label: `Order ${o.orderNumber} delivered`, date: o.updatedAt, status: 'Delivered' });
                        }
                        return events;
                      }).slice(0, 6).map((ev, i) => (
                        <div key={i} className="flex items-start gap-2.5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div className="flex items-center justify-center w-5 h-5 shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '50%' }}>
                            <Mail size={10} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.25)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.52rem] tracking-[0.04em] line-clamp-1" style={{ color: 'rgba(255,255,255,0.62)' }}>{ev.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[0.42rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>{formatDateShort(ev.date)}</p>
                              <span className="text-[0.40rem] tracking-[0.10em] uppercase px-1" style={{ background: 'rgba(34,197,94,0.07)', color: 'rgba(74,222,128,0.65)', border: '1px solid rgba(34,197,94,0.12)' }}>{ev.status}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Admin Notes */}
                <Card>
                  <SectionHeading icon={<MessageSquare size={14} strokeWidth={1.8} />} label="Admin Notes" />

                  {/* Add note */}
                  <div className="mb-4">
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add an internal note about this customer…"
                      rows={3}
                      className="w-full px-3 py-2 text-[0.56rem] tracking-[0.04em] outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.70)' }}
                      onFocus={(e)  => (e.currentTarget.style.borderColor = `${GOLD_BG}0.30)`)}
                      onBlur={(e)   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                    />
                    <div className="flex justify-end mt-1.5">
                      <GoldButton icon={<Plus size={10} strokeWidth={2} />} label="Add Note" loading={noteAdding} disabled={!noteInput.trim()} onClick={handleAddNote} />
                    </div>
                  </div>

                  {/* Notes list */}
                  {notes.length === 0 ? (
                    <p className="py-3 text-center text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>No notes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note._id} className="p-3" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[0.54rem] tracking-[0.04em] leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{note.content}</p>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-100"
                              style={{ color: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.06)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(239,68,68,0.65)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                            >
                              <Trash2 size={10} strokeWidth={1.8} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[0.44rem] tracking-[0.06em]" style={{ color: GOLD }}>{note.adminName}</span>
                            <span style={{ color: 'rgba(255,255,255,0.14)' }}>·</span>
                            <span className="text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDateTime(note.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Security & Account */}
                <Card>
                  <SectionHeading icon={<Lock size={14} strokeWidth={1.8} />} label="Account & Security" />

                  <div className="mb-5">
                    <InfoRow label="Account Status" value={<span style={{ color: statusCfg.color }}>{statusCfg.label}</span>} />
                    <InfoRow label="Email Verified" value={<span style={{ color: customer.isVerified ? 'rgba(74,222,128,0.85)' : 'rgba(250,204,21,0.75)' }}>{customer.isVerified ? 'Yes' : 'No'}</span>} />
                    <InfoRow label="Provider"       value={customer.provider === 'google' ? 'Google OAuth' : 'Email / Password'} />
                    <InfoRow label="Member Since"   value={formatDate(customer.createdAt)} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[0.44rem] tracking-[0.16em] uppercase mb-2.5" style={{ color: 'rgba(255,255,255,0.20)' }}>Admin Actions</p>

                    {!customer.isVerified && (
                      <GhostButton icon={<BadgeCheck size={11} strokeWidth={2} />} label="Verify Email Manually" onClick={() => setVerifyModal(true)} />
                    )}

                    <GhostButton icon={<RefreshCw size={11} strokeWidth={2} />} label="Reset Password" onClick={() => setResetModal(true)} />

                    {customer.isSuspended
                      ? <GhostButton icon={<ShieldCheck size={11} strokeWidth={2} />} label="Unsuspend Account" onClick={() => setUnsuspendModal(true)} />
                      : <GhostButton icon={<ShieldBan size={11} strokeWidth={2} />} label="Suspend Account" danger onClick={() => setSuspendModal(true)} />
                    }

                    {adminUser?.role === 'superadmin' && stats?.totalOrders === 0 && (
                      <GhostButton
                        icon={<Trash2 size={11} strokeWidth={2} />}
                        label="Delete Account"
                        danger
                        onClick={() => setDeleteModal(1)}
                      />
                    )}
                  </div>
                </Card>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <AnimatePresence>

        {/* Email composer */}
        {emailOpen && (
          <EmailComposerModal
            toEmail={customer.email}
            toName={fullName}
            onClose={() => setEmailOpen(false)}
          />
        )}

        {/* Suspend */}
        {suspendModal && (
          <ConfirmModal
            title="Suspend this account?"
            message="The customer will not be able to log in while suspended and will receive a suspension notification email."
            confirmLabel="Confirm Suspension"
            confirmDanger
            loading={suspendLoading}
            onConfirm={handleSuspend}
            onCancel={() => setSuspendModal(false)}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-[0.44rem] tracking-[0.14em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Reason</label>
                <select
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full h-8 px-2 text-[0.56rem] tracking-[0.04em] outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', colorScheme: 'dark' }}
                >
                  <option value="">Select a reason…</option>
                  {SUSPEND_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.44rem] tracking-[0.14em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Note (optional)</label>
                <textarea
                  value={suspendNote}
                  onChange={(e) => setSuspendNote(e.target.value)}
                  placeholder="Additional context…"
                  rows={2}
                  className="w-full px-2.5 py-2 text-[0.56rem] tracking-[0.04em] outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}
                />
              </div>
            </div>
          </ConfirmModal>
        )}

        {/* Unsuspend */}
        {unsuspendModal && (
          <ConfirmModal
            title="Unsuspend this account?"
            message="The customer will regain full access and receive an account restored notification email."
            confirmLabel="Unsuspend Account"
            loading={suspendLoading}
            onConfirm={handleUnsuspend}
            onCancel={() => setUnsuspendModal(false)}
          />
        )}

        {/* Verify email */}
        {verifyModal && (
          <ConfirmModal
            title="Manually verify email?"
            message="This will mark the account as verified without requiring the customer to click an email link. Use only for support scenarios."
            confirmLabel="Verify Account"
            loading={verifyLoading}
            onConfirm={handleVerify}
            onCancel={() => setVerifyModal(false)}
          />
        )}

        {/* Reset password */}
        {resetModal && (
          <ConfirmModal
            title="Send password reset email?"
            message={`A password reset link will be sent to ${customer.email}.`}
            confirmLabel="Send Reset Email"
            loading={false}
            onConfirm={() => setResetModal(false)}
            onCancel={() => setResetModal(false)}
          />
        )}

        {/* Delete — step 1 */}
        {deleteModal === 1 && (
          <ConfirmModal
            title="Delete this account?"
            message="This action is irreversible. All customer data will be permanently deleted in compliance with GDPR. This cannot be undone."
            confirmLabel="Continue →"
            confirmDanger
            onConfirm={() => setDeleteModal(2)}
            onCancel={() => setDeleteModal(null)}
          />
        )}

        {/* Delete — step 2: type email */}
        {deleteModal === 2 && (
          <ConfirmModal
            title="Confirm by typing customer email"
            confirmLabel="Continue →"
            confirmDanger
            onConfirm={() => deleteEmailInput === customer.email ? setDeleteModal(3) : undefined}
            onCancel={() => setDeleteModal(null)}
          >
            <div>
              <label className="block text-[0.44rem] tracking-[0.14em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Type <span style={{ color: 'rgba(239,68,68,0.75)' }}>{customer.email}</span> to confirm
              </label>
              <input
                type="email"
                value={deleteEmailInput}
                onChange={(e) => setDeleteEmailInput(e.target.value)}
                placeholder={customer.email}
                className="w-full h-8 px-3 text-[0.56rem] tracking-[0.04em] outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.72)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)')}
                onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          </ConfirmModal>
        )}

        {/* Delete — step 3: final confirm */}
        {deleteModal === 3 && (
          <ConfirmModal
            title="Final confirmation — delete account"
            message="All data for this customer will be permanently erased. There is no recovery."
            confirmLabel="Permanently Delete"
            confirmDanger
            loading={deleteLoading}
            onConfirm={handleDeleteAccount}
            onCancel={() => setDeleteModal(null)}
          >
            <div>
              <label className="block text-[0.44rem] tracking-[0.14em] uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Admin PIN</label>
              <input
                type="password"
                value={deletePinInput}
                onChange={(e) => setDeletePinInput(e.target.value)}
                placeholder="Enter your admin PIN…"
                className="w-full h-8 px-3 text-[0.56rem] tracking-[0.04em] outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.72)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)')}
                onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          </ConfirmModal>
        )}

      </AnimatePresence>
    </div>
  );
}
