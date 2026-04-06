'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRouter }          from 'next/navigation';
import Link                   from 'next/link';
import Image                  from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Eye,
  Download,
  AlertTriangle,
  Package,
  User,
  MapPin,
  Truck,
  Banknote,
  FileText,
  Trash2,
  Send,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Image as ImageIcon,
  ChevronRight,
  Phone,
  Mail,
  CheckSquare,
  Square,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav  from '@/components/admin/AdminTopNav';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Types ──────────────────────────────────────────────────────────────────────

type TransferStatus = 'pending' | 'verified' | 'rejected';

interface OrderItem {
  name:         string;
  size:         string;
  qty:          number;
  pricePerUnit: number;
  image?:       string;
}

interface TransferDetail {
  _id:         string;
  orderNumber: string;
  userId?:     string;
  contact: {
    firstName: string;
    lastName:  string;
    email:     string;
    phone:     string;
  };
  shippingAddress: {
    street:     string;
    apt?:       string;
    city:       string;
    state:      string;
    postalCode?: string;
    country:    string;
  };
  items:   OrderItem[];
  gift:    { isGift: boolean; wrapping: boolean; giftWrapFee?: number; message?: string };
  pricing: {
    subtotal:    number;
    discount:    number;
    couponLabel?: string;
    deliveryFee: number;
    giftWrapFee: number;
    total:       number;
  };
  delivery: { option: string; label: string; duration: string };
  payment: {
    method:           string;
    status:           string;
    proofUrl?:        string;
    verifiedAt?:      string;
    rejectedAt?:      string;
    actionedBy?:      string;
    rejectionReason?: string;
  };
  status:    string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent:  number;
}

interface CustomerProfile {
  _id:         string;
  firstName:   string;
  lastName:    string;
  email:       string;
  phone?:      string;
  isVerified:  boolean;
  isSuspended?: boolean;
  avatar?:     string;
}

interface TransferNote {
  _id:       string;
  adminId:   string;
  adminName: string;
  content:   string;
  createdAt: string;
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
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeShort(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function getTransferStatus(paymentStatus: string): TransferStatus {
  if (paymentStatus === 'paid')   return 'verified';
  if (paymentStatus === 'failed') return 'rejected';
  return 'pending';
}

function minutesSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
}

function formatElapsedLong(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} minute${m !== 1 ? 's' : ''}`;
  return m > 0 ? `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}` : `${h} hour${h !== 1 ? 's' : ''}`;
}

function getUrgencyColor(minutes: number) {
  if (minutes < 360)  return 'rgba(251,191,36,1)';
  if (minutes < 720)  return 'rgba(249,115,22,1)';
  if (minutes < 1440) return 'rgba(239,68,68,1)';
  return 'rgba(185,28,28,1)';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`p-5 md:p-6 ${className}`}
      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span style={{ color: GOLD }}>{icon}</span>
      <h2 className="text-[0.58rem] tracking-[0.22em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
        {label}
      </h2>
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[0.50rem] tracking-[0.12em] uppercase shrink-0 pt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</span>
      {children ?? <span className="text-[0.60rem] tracking-[0.04em] text-right" style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</span>}
    </div>
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
      className="flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-100"
      style={{ color: copied ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.22)' }}
    >
      {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={1.8} />}
    </button>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button onClick={onChange} className="flex items-start gap-2.5 w-full text-left group">
      <span className="shrink-0 mt-0.5 transition-colors duration-100" style={{ color: checked ? 'rgba(34,197,94,0.88)' : 'rgba(255,255,255,0.22)' }}>
        {checked ? <CheckSquare size={14} strokeWidth={1.8} /> : <Square size={14} strokeWidth={1.5} />}
      </span>
      <span className="text-[0.58rem] tracking-[0.04em] leading-relaxed transition-colors duration-100" style={{ color: checked ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
    </button>
  );
}

// ── Image Lightbox ─────────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [zoom,   setZoom]   = useState(1);
  const [rotate, setRotate] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset({ x: startRef.current.ox + e.clientX - startRef.current.x, y: startRef.current.oy + e.clientY - startRef.current.y });
  }
  function onMouseUp() { setDragging(false); }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[90] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-[0.52rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>Proof of Payment</p>
        <div className="flex items-center gap-2">
          {[
            { icon: <ZoomOut size={13} strokeWidth={1.8} />,  act: () => setZoom((z) => Math.max(0.3, z - 0.25)), tip: 'Zoom out' },
            { icon: <ZoomIn size={13} strokeWidth={1.8} />,   act: () => setZoom((z) => Math.min(5, z + 0.25)),   tip: 'Zoom in'  },
            { icon: <RotateCw size={13} strokeWidth={1.8} />, act: () => setRotate((r) => r + 90),                tip: 'Rotate'   },
            { icon: <Download size={13} strokeWidth={1.8} />, act: () => { const a = document.createElement('a'); a.href = src; a.download = 'proof.jpg'; a.click(); }, tip: 'Download' },
          ].map(({ icon, act, tip }, i) => (
            <button
              key={i}
              onClick={act}
              title={tip}
              className="flex items-center justify-center w-8 h-8 transition-colors duration-100"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
            >
              {icon}
            </button>
          ))}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 transition-colors duration-100"
            style={{ border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.70)' }}
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Proof of payment"
          draggable={false}
          style={{ transform: `translate(${offset.x}px,${offset.y}px) rotate(${rotate}deg) scale(${zoom})`, transition: dragging ? 'none' : 'transform 0.15s ease', maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }}
        />
      </div>
      <p className="text-center py-2 text-[0.46rem] tracking-[0.10em]" style={{ color: 'rgba(255,255,255,0.20)' }}>
        Scroll to zoom · Drag to pan · {Math.round(zoom * 100)}%
      </p>
    </motion.div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────

function ConfirmModal({
  transfer,
  checksCount,
  onConfirm,
  onCancel,
}: {
  transfer:    TransferDetail;
  checksCount: number;
  onConfirm:   (note: string) => Promise<void>;
  onCancel:    () => void;
}) {
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await onConfirm(note);
    setLoading(false);
  }

  const customerName = `${transfer.contact.firstName} ${transfer.contact.lastName}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md p-6 space-y-5"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.09)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Heading */}
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={16} strokeWidth={1.6} style={{ color: 'rgba(34,197,94,0.85)', flexShrink: 0 }} />
          <p className="text-[0.64rem] tracking-[0.14em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Confirm Bank Transfer Payment
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-1.5 px-3 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Order',    value: transfer.orderNumber },
            { label: 'Customer', value: customerName },
            { label: 'Amount',   value: formatNaira(transfer.pricing.total) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[0.48rem] tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</span>
              <span className="text-[0.58rem] tracking-[0.04em] font-semibold" style={{ color: label === 'Amount' ? GOLD : 'rgba(255,255,255,0.72)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Checklist reminder */}
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
          <CheckCircle2 size={12} strokeWidth={2} style={{ color: 'rgba(34,197,94,0.80)', flexShrink: 0 }} />
          <p className="text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(34,197,94,0.75)' }}>
            All {checksCount} verification checks completed
          </p>
        </div>

        {/* Note to customer */}
        <div className="space-y-2">
          <p className="text-[0.50rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Note to Customer <span style={{ color: 'rgba(255,255,255,0.18)' }}>(Optional)</span>
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g., Thank you for your patience. Your order is now being processed."
            className="w-full px-3 py-2.5 text-[0.56rem] tracking-[0.04em] leading-relaxed outline-none resize-none"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)' }}
          />
        </div>

        {/* What happens next */}
        <div className="space-y-1.5 px-3 py-3" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[0.46rem] tracking-[0.14em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.22)' }}>What happens next</p>
          {[
            'Order status → "Confirmed"',
            'Customer receives confirmation email automatically',
            'Order appears in processing queue',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[0.40rem] mt-1" style={{ color: 'rgba(34,197,94,0.60)' }}>●</span>
              <p className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.38)' }}>{s}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handle}
            disabled={loading}
            className="w-full h-10 flex items-center justify-center gap-2 text-[0.54rem] tracking-[0.16em] uppercase font-semibold transition-colors duration-150 disabled:opacity-60"
            style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)', color: 'rgba(34,197,94,0.92)' }}
          >
            {loading ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <CheckCircle2 size={13} strokeWidth={2} />}
            {loading ? 'Confirming…' : 'Confirm Payment'}
          </button>
          <button
            onClick={onCancel}
            className="w-full h-9 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
            style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.32)' }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Reject Modal ───────────────────────────────────────────────────────────────

const REJECTION_REASONS = [
  'Payment Not Received',
  'Incorrect Amount Received',
  'Wrong Reference / Narration',
  'Suspicious Transaction',
  'Duplicate Payment',
  'Other',
];

function RejectModal({
  transfer,
  onConfirm,
  onCancel,
}: {
  transfer:  TransferDetail;
  onConfirm: (reason: string, note: string) => Promise<void>;
  onCancel:  () => void;
}) {
  const [reason,  setReason]  = useState('');
  const [other,   setOther]   = useState('');
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);

  const finalReason = reason === 'Other' ? other.trim() : reason;
  const canSubmit   = finalReason.length > 0;

  async function handle() {
    if (!canSubmit) return;
    setLoading(true);
    await onConfirm(finalReason, note);
    setLoading(false);
  }

  const customerName = `${transfer.contact.firstName} ${transfer.contact.lastName}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md p-6 space-y-5"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.09)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Heading */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <XCircle size={16} strokeWidth={1.6} style={{ color: 'rgba(239,68,68,0.85)', flexShrink: 0 }} />
            <p className="text-[0.64rem] tracking-[0.14em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Reject Bank Transfer Payment
            </p>
          </div>
          <p className="text-[0.54rem] tracking-[0.04em] ml-6" style={{ color: 'rgba(239,68,68,0.65)' }}>
            This will cancel the order and notify the customer.
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-1.5 px-3 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Order',    value: transfer.orderNumber },
            { label: 'Customer', value: customerName },
            { label: 'Amount',   value: formatNaira(transfer.pricing.total) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[0.48rem] tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</span>
              <span className="text-[0.58rem] tracking-[0.04em] font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Rejection reason */}
        <div className="space-y-2">
          <p className="text-[0.50rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Rejection Reason <span style={{ color: 'rgba(239,68,68,0.60)' }}>*</span>
          </p>
          <div className="space-y-1.5">
            {REJECTION_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[0.54rem] tracking-[0.04em] transition-colors duration-100"
                style={{
                  background: reason === r ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.01)',
                  border:     `1px solid ${reason === r ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.06)'}`,
                  color:      reason === r ? 'rgba(239,68,68,0.88)' : 'rgba(255,255,255,0.45)',
                }}
              >
                <span className="text-[0.40rem] shrink-0" style={{ color: reason === r ? 'rgba(239,68,68,0.80)' : 'transparent' }}>●</span>
                {r}
              </button>
            ))}
          </div>
          {reason === 'Other' && (
            <input
              type="text"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Describe the reason…"
              className="w-full h-9 px-3 text-[0.56rem] tracking-[0.04em] outline-none"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)' }}
            />
          )}
        </div>

        {/* Note to customer */}
        <div className="space-y-2">
          <p className="text-[0.50rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Note to Customer <span style={{ color: 'rgba(255,255,255,0.18)' }}>(Optional)</span>
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g., We could not find this payment. Please try again or contact support."
            className="w-full px-3 py-2.5 text-[0.56rem] tracking-[0.04em] leading-relaxed outline-none resize-none"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)' }}
          />
        </div>

        {/* What happens next */}
        <div className="space-y-1.5 px-3 py-3" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[0.46rem] tracking-[0.14em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.22)' }}>What happens next</p>
          {[
            'Order status → "Cancelled"',
            'Customer receives rejection email automatically',
            'Customer is advised to retry or contact support',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[0.40rem] mt-1" style={{ color: 'rgba(239,68,68,0.50)' }}>●</span>
              <p className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.38)' }}>{s}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handle}
            disabled={loading || !canSubmit}
            className="w-full h-10 flex items-center justify-center gap-2 text-[0.54rem] tracking-[0.16em] uppercase font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.32)', color: 'rgba(239,68,68,0.88)' }}
          >
            {loading ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <XCircle size={13} strokeWidth={2} />}
            {loading ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
          <button
            onClick={onCancel}
            className="w-full h-9 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
            style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.32)' }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function BankTransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }  = use(params);
  const router  = useRouter();

  // ── State ─────────────────────────────────────────────────────────────────────
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [adminUser,    setAdminUser]    = useState<AdminUser | null>(null);
  const [transfer,     setTransfer]     = useState<TransferDetail | null>(null);
  const [custStats,    setCustStats]    = useState<CustomerStats | null>(null);
  const [custProfile,  setCustProfile]  = useState<CustomerProfile | null>(null);
  const [notes,        setNotes]        = useState<TransferNote[]>([]);
  const [loading,      setLoading]      = useState(true);

  // ── Checklist ────────────────────────────────────────────────────────────────
  const [checks, setChecks] = useState([false, false, false, false]);
  const allChecked = checks.every(Boolean);

  // ── Modals ────────────────────────────────────────────────────────────────────
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ── Admin notes ───────────────────────────────────────────────────────────────
  const [noteContent,  setNoteContent]  = useState('');
  const [noteLoading,  setNoteLoading]  = useState(false);

  // ── Auth check ────────────────────────────────────────────────────────────────
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

  // ── Fetch transfer ─────────────────────────────────────────────────────────────
  const fetchTransfer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bank-transfers/${id}`);
      if (!res.ok) { router.push('/admin/bank-transfers'); return; }
      const json = (await res.json()) as {
        data?: {
          order:           TransferDetail;
          customerStats:   CustomerStats;
          customerProfile: CustomerProfile | null;
          notes:           TransferNote[];
        };
      };
      if (json.data) {
        setTransfer(json.data.order);
        setCustStats(json.data.customerStats);
        setCustProfile(json.data.customerProfile);
        setNotes(json.data.notes);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!authLoading) fetchTransfer();
  }, [authLoading, fetchTransfer]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function handleConfirm(customerNote: string) {
    await fetch(`/api/admin/bank-transfers/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'verify', customerNote }),
    });
    setConfirmOpen(false);
    fetchTransfer();
  }

  async function handleReject(reason: string, customerNote: string) {
    await fetch(`/api/admin/bank-transfers/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'reject', rejectionReason: reason, customerNote }),
    });
    setRejectOpen(false);
    fetchTransfer();
  }

  async function addNote() {
    if (!noteContent.trim()) return;
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/admin/bank-transfers/${id}/notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: noteContent.trim() }),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: TransferNote };
        if (json.data) setNotes((prev) => [...prev, json.data!]);
        setNoteContent('');
      }
    } catch { /* ignore */ } finally {
      setNoteLoading(false);
    }
  }

  async function deleteNote(noteId: string) {
    try {
      await fetch(`/api/admin/bank-transfers/${id}/notes`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ noteId }),
      });
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch { /* ignore */ }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const transferStatus  = transfer ? getTransferStatus(transfer.payment.status) : 'pending';
  const isPending       = transferStatus === 'pending';
  const minutesElapsed  = transfer ? minutesSince(transfer.createdAt) : 0;
  const urgencyColor    = getUrgencyColor(minutesElapsed);
  const deadlineMins    = Math.max(0, 24 * 60 - minutesElapsed);
  const deadlineHrs     = Math.floor(deadlineMins / 60);
  const deadlineMinsRem = deadlineMins % 60;
  const progressPct     = Math.min(100, (minutesElapsed / (24 * 60)) * 100);

  const adminFullName  = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`     : '—';
  const adminShortName = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.` : '—';
  const adminRoleLabel = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  const STATUS_CONFIG = {
    pending:  { label: 'Pending Verification', color: 'rgba(251,191,36,0.90)', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' },
    verified: { label: 'Verified',             color: 'rgba(34,197,94,0.90)',  bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)'  },
    rejected: { label: 'Rejected',             color: 'rgba(239,68,68,0.90)',  bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)'  },
  };
  const sc = STATUS_CONFIG[transferStatus];

  // Verification history events
  const historyEvents = transfer ? (() => {
    const events: { icon: React.ReactNode; text: string; sub?: string; time: string; actor: string }[] = [];
    events.push({ icon: <FileText size={12} strokeWidth={1.8} />, text: 'Order placed by customer', time: `${formatDateShort(transfer.createdAt)} · ${formatTimeShort(transfer.createdAt)}`, actor: 'System' });
    if (transfer.payment.proofUrl) {
      events.push({ icon: <ImageIcon size={12} strokeWidth={1.8} />, text: 'Proof of payment uploaded by customer', time: '—', actor: 'Customer' });
    }
    if (transfer.payment.verifiedAt) {
      events.push({ icon: <CheckCircle2 size={12} strokeWidth={1.8} />, text: `Payment confirmed by ${transfer.payment.actionedBy ?? 'Admin'}`, time: `${formatDateShort(transfer.payment.verifiedAt)} · ${formatTimeShort(transfer.payment.verifiedAt)}`, actor: transfer.payment.actionedBy ?? 'Admin' });
      events.push({ icon: <Mail size={12} strokeWidth={1.8} />, text: 'Confirmation email sent to customer', time: `${formatDateShort(transfer.payment.verifiedAt)} · ${formatTimeShort(transfer.payment.verifiedAt)}`, actor: 'System' });
      events.push({ icon: <RefreshCw size={12} strokeWidth={1.8} />, text: 'Order status updated to Confirmed', time: `${formatDateShort(transfer.payment.verifiedAt)} · ${formatTimeShort(transfer.payment.verifiedAt)}`, actor: 'System' });
    }
    if (transfer.payment.rejectedAt) {
      events.push({ icon: <XCircle size={12} strokeWidth={1.8} />, text: `Payment rejected by ${transfer.payment.actionedBy ?? 'Admin'}`, sub: transfer.payment.rejectionReason ? `Reason: ${transfer.payment.rejectionReason}` : undefined, time: `${formatDateShort(transfer.payment.rejectedAt)} · ${formatTimeShort(transfer.payment.rejectedAt)}`, actor: transfer.payment.actionedBy ?? 'Admin' });
      events.push({ icon: <Mail size={12} strokeWidth={1.8} />, text: 'Rejection email sent to customer', time: `${formatDateShort(transfer.payment.rejectedAt)} · ${formatTimeShort(transfer.payment.rejectedAt)}`, actor: 'System' });
      events.push({ icon: <RefreshCw size={12} strokeWidth={1.8} />, text: 'Order status updated to Cancelled', time: `${formatDateShort(transfer.payment.rejectedAt)} · ${formatTimeShort(transfer.payment.rejectedAt)}`, actor: 'System' });
    }
    return events;
  })() : [];

  // ── Loading / Auth ────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} strokeWidth={1.8} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3" style={{ background: '#0F0F0F' }}>
        <p className="text-[0.60rem] tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>Transfer not found</p>
        <Link href="/admin/bank-transfers" className="text-[0.52rem] tracking-[0.10em] uppercase" style={{ color: GOLD }}>← Back to list</Link>
      </div>
    );
  }

  const customerName = `${transfer.contact.firstName} ${transfer.contact.lastName}`;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      {/* Modals */}
      <AnimatePresence>
        {lightboxOpen && transfer.payment.proofUrl && (
          <ImageLightbox src={transfer.payment.proofUrl} onClose={() => setLightboxOpen(false)} />
        )}
        {confirmOpen && (
          <ConfirmModal
            transfer={transfer}
            checksCount={checks.length}
            onConfirm={handleConfirm}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
        {rejectOpen && (
          <RejectModal
            transfer={transfer}
            onConfirm={handleReject}
            onCancel={() => setRejectOpen(false)}
          />
        )}
      </AnimatePresence>

      <AdminSidebar adminName={adminFullName} adminRole={adminRoleLabel} avatarUrl={adminUser?.avatar} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-55 flex flex-col min-h-screen">
        <AdminTopNav pageTitle="Transfer Verification" adminName={adminShortName} avatarUrl={adminUser?.avatar} onMenuToggle={() => setSidebarOpen((o) => !o)} />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-5 max-w-6xl">

            {/* ── A1: Page Header ──────────────────────────────────────────── */}
            <div className="space-y-4">
              {/* Back link */}
              <Link
                href="/admin/bank-transfers"
                className="inline-flex items-center gap-1.5 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
                style={{ color: 'rgba(255,255,255,0.28)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
              >
                <ArrowLeft size={11} strokeWidth={2} /> Bank Transfers List
              </Link>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      Transfer Verification
                    </h1>
                    <span className="text-[0.58rem] tracking-[0.08em] font-semibold tabular-nums" style={{ color: GOLD }}>
                      #{transfer.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Status badge */}
                    <span
                      className="inline-flex items-center h-7 px-3 text-[0.54rem] tracking-[0.14em] uppercase font-semibold"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                    >
                      {sc.label}
                    </span>

                    {/* Urgency (pending only) */}
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <div
                          className="inline-flex items-center gap-1.5 h-7 px-3 text-[0.50rem] tracking-[0.10em]"
                          style={{ background: `${urgencyColor}14`, color: urgencyColor, border: `1px solid ${urgencyColor}30` }}
                        >
                          <Clock size={10} strokeWidth={2} />
                          Waiting {formatElapsedLong(minutesElapsed)}
                        </div>
                        {deadlineMins > 0 && (
                          <span className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                            {deadlineHrs}h {deadlineMinsRem}m before 24hr mark
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons (pending only) */}
                {isPending && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRejectOpen(true)}
                      className="h-9 px-4 flex items-center gap-1.5 text-[0.52rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
                      style={{ border: '1px solid rgba(239,68,68,0.28)', color: 'rgba(239,68,68,0.80)', background: 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <XCircle size={12} strokeWidth={2} /> Reject Payment
                    </button>
                    <button
                      onClick={() => allChecked && setConfirmOpen(true)}
                      disabled={!allChecked}
                      className="h-9 px-5 flex items-center gap-1.5 text-[0.52rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
                      style={{ background: 'rgba(34,197,94,0.16)', border: '1px solid rgba(34,197,94,0.32)', color: 'rgba(34,197,94,0.92)' }}
                      title={allChecked ? undefined : 'Complete the verification checklist first'}
                    >
                      <CheckCircle2 size={12} strokeWidth={2} /> Confirm Payment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── A2: Urgency Timeline Bar ──────────────────────────────── */}
            {isPending && (
              <SectionCard>
                <div className="space-y-3">
                  {/* Bar */}
                  <div className="relative">
                    {/* Track */}
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:      `${progressPct}%`,
                          background: progressPct < 25
                            ? 'linear-gradient(90deg, rgba(34,197,94,0.8), rgba(251,191,36,0.8))'
                            : progressPct < 50
                            ? 'linear-gradient(90deg, rgba(251,191,36,0.8), rgba(249,115,22,0.8))'
                            : 'linear-gradient(90deg, rgba(249,115,22,0.8), rgba(239,68,68,0.9))',
                        }}
                      />
                    </div>
                    {/* Marker dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500"
                      style={{ left: `calc(${progressPct}% - 6px)`, background: '#0F0F0F', borderColor: urgencyColor, boxShadow: `0 0 6px ${urgencyColor}` }}
                    />
                  </div>
                  {/* Tick labels */}
                  <div className="flex justify-between text-[0.42rem] tracking-[0.10em] uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>
                    {['0 hrs', '6 hrs', '12 hrs', '18 hrs', '24 hrs'].map((t) => <span key={t}>{t}</span>)}
                  </div>
                  <p className="text-[0.54rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Order placed {formatElapsedLong(minutesElapsed)} ago.
                    {deadlineMins > 0
                      ? ` Verify before the 24-hour mark to maintain customer trust.`
                      : ' This transfer is past the 24-hour mark.'}
                  </p>
                </div>
              </SectionCard>
            )}

            {/* ── Main grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

              {/* ── Left column ─────────────────────────────────────────── */}
              <div className="space-y-5">

                {/* A3: Transfer Information */}
                <SectionCard>
                  <SectionHeading icon={<Banknote size={14} strokeWidth={1.6} />} label="Transfer Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                    {/* Left column */}
                    <div>
                      <InfoRow label="Order Number">
                        <Link
                          href={`/admin/orders/${transfer._id}`}
                          className="flex items-center gap-1 text-[0.58rem] tracking-[0.04em] font-semibold"
                          style={{ color: GOLD }}
                        >
                          {transfer.orderNumber} <ChevronRight size={10} strokeWidth={2} />
                        </Link>
                      </InfoRow>
                      <InfoRow label="Invoice Number" value={`INV-${transfer.orderNumber.replace('ORD-', '')}`} />
                      <InfoRow label="Payment Reference">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[0.58rem] tracking-[0.04em] font-mono" style={{ color: 'rgba(255,255,255,0.72)' }}>{transfer.orderNumber}</span>
                          <CopyButton text={transfer.orderNumber} />
                        </div>
                      </InfoRow>
                      <InfoRow label="Amount to Verify">
                        <span className="text-[0.72rem] font-semibold tabular-nums" style={{ color: GOLD }}>{formatNaira(transfer.pricing.total)}</span>
                      </InfoRow>
                      <InfoRow label="Date Order Placed" value={formatDateTime(transfer.createdAt)} />
                      <InfoRow label="Time Elapsed" value={formatElapsedLong(minutesElapsed)} />
                    </div>
                    {/* Right column */}
                    <div>
                      <InfoRow label="Your Bank Name" value="Moniepoint" />
                      <InfoRow label="Your Account Name" value="Vickscents and Cosmetics" />
                      <InfoRow label="Your Account Number">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[0.58rem] tracking-[0.04em] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.72)' }}>7014006235</span>
                          <CopyButton text="7014006235" />
                        </div>
                      </InfoRow>
                      <InfoRow label="Expected Narration">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[0.58rem] tracking-[0.04em] font-mono" style={{ color: 'rgba(255,255,255,0.72)' }}>{transfer.orderNumber}</span>
                          <CopyButton text={transfer.orderNumber} />
                        </div>
                      </InfoRow>
                      <InfoRow label="Verification Deadline">
                        <span className="text-[0.56rem] tracking-[0.04em]" style={{ color: deadlineMins < 180 ? 'rgba(239,68,68,0.80)' : 'rgba(255,255,255,0.60)' }}>
                          {formatDateTime(new Date(new Date(transfer.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString())}
                        </span>
                      </InfoRow>
                    </div>
                  </div>
                </SectionCard>

                {/* A4: Proof of Payment */}
                <SectionCard>
                  <SectionHeading icon={<ImageIcon size={14} strokeWidth={1.6} />} label="Proof of Payment" />
                  {transfer.payment.proofUrl ? (
                    <div className="space-y-4">
                      {/* Preview */}
                      <div
                        className="relative overflow-hidden cursor-pointer group"
                        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}
                        onClick={() => setLightboxOpen(true)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={transfer.payment.proofUrl}
                          alt="Proof of payment"
                          className="w-full max-h-64 object-contain"
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: 'rgba(0,0,0,0.50)' }}
                        >
                          <div className="flex items-center gap-2 px-3 py-1.5 text-[0.48rem] tracking-[0.12em] uppercase font-semibold" style={{ background: 'rgba(0,0,0,0.70)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <Eye size={11} strokeWidth={1.8} /> View Full Size
                          </div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLightboxOpen(true)}
                          className="flex items-center gap-1.5 h-8 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-100"
                          style={{ border: `1px solid rgba(180,130,60,0.28)`, background: 'rgba(180,130,60,0.08)', color: GOLD }}
                        >
                          <Eye size={11} strokeWidth={1.8} /> View Full Size
                        </button>
                        <a
                          href={transfer.payment.proofUrl}
                          download
                          className="flex items-center gap-1.5 h-8 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-100"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.40)' }}
                        >
                          <Download size={11} strokeWidth={1.8} /> Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div
                        className="flex flex-col gap-2 p-4"
                        style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)' }}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={13} strokeWidth={1.8} style={{ color: 'rgba(251,191,36,0.80)', flexShrink: 0 }} />
                          <p className="text-[0.56rem] tracking-[0.06em] font-semibold" style={{ color: 'rgba(251,191,36,0.85)' }}>
                            No proof of payment uploaded by customer
                          </p>
                        </div>
                        <p className="text-[0.52rem] tracking-[0.04em] leading-relaxed ml-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          You can still verify if you&apos;ve confirmed the transfer directly in your bank app or statement.
                        </p>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* A5: Verification Checklist (pending only) */}
                {isPending && (
                  <SectionCard>
                    <SectionHeading icon={<CheckSquare size={14} strokeWidth={1.6} />} label="Verification Checklist" />
                    <div className="space-y-3.5">
                      {[
                        'I have checked my bank statement / app',
                        `The amount received matches — ${formatNaira(transfer.pricing.total)}`,
                        `The narration / reference matches — ${transfer.orderNumber}`,
                        'The transfer was made by the account holder or an authorised person',
                      ].map((label, i) => (
                        <Checkbox
                          key={i}
                          checked={checks[i]}
                          onChange={() => setChecks((prev) => prev.map((v, j) => j === i ? !v : v))}
                          label={label}
                        />
                      ))}
                    </div>
                    <div
                      className="mt-5 flex items-start gap-2 px-3 py-3"
                      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.14)' }}
                    >
                      <AlertTriangle size={11} strokeWidth={1.8} style={{ color: 'rgba(239,68,68,0.60)', flexShrink: 0, marginTop: 2 }} />
                      <p className="text-[0.50rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.32)' }}>
                        Once confirmed, the order will be automatically processed. This action cannot be undone.
                      </p>
                    </div>
                    {!allChecked && (
                      <p className="mt-3 text-[0.48rem] tracking-[0.08em] text-center" style={{ color: 'rgba(255,255,255,0.22)' }}>
                        Complete all {checks.filter((c) => !c).length} remaining check{checks.filter((c) => !c).length !== 1 ? 's' : ''} to enable confirmation
                      </p>
                    )}
                  </SectionCard>
                )}

                {/* A6: Customer Information */}
                <SectionCard>
                  <SectionHeading icon={<User size={14} strokeWidth={1.6} />} label="Customer Information" />
                  <div className="flex items-start gap-4 mb-4">
                    {custProfile?.avatar ? (
                      <Image src={custProfile.avatar} alt={customerName} width={44} height={44} className="rounded-full shrink-0 object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[0.55rem] font-bold" style={{ background: 'rgba(180,130,60,0.15)', color: GOLD }}>
                        {transfer.contact.firstName.charAt(0)}{transfer.contact.lastName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-[0.64rem] tracking-[0.04em] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{customerName}</p>
                      <a href={`mailto:${transfer.contact.email}`} className="flex items-center gap-1 mt-0.5 text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        <Mail size={10} strokeWidth={1.8} /> {transfer.contact.email}
                      </a>
                      <a href={`tel:${transfer.contact.phone}`} className="flex items-center gap-1 mt-0.5 text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        <Phone size={10} strokeWidth={1.8} /> {transfer.contact.phone}
                      </a>
                    </div>
                    {custProfile && (
                      <div className="ml-auto shrink-0">
                        <span
                          className="inline-flex items-center h-5 px-2 text-[0.40rem] tracking-[0.12em] uppercase font-semibold"
                          style={
                            custProfile.isSuspended
                              ? { background: 'rgba(239,68,68,0.10)', color: 'rgba(239,68,68,0.80)', border: '1px solid rgba(239,68,68,0.22)' }
                              : custProfile.isVerified
                              ? { background: 'rgba(34,197,94,0.10)', color: 'rgba(34,197,94,0.80)', border: '1px solid rgba(34,197,94,0.22)' }
                              : { background: 'rgba(251,191,36,0.10)', color: 'rgba(251,191,36,0.80)', border: '1px solid rgba(251,191,36,0.22)' }
                          }
                        >
                          {custProfile.isSuspended ? 'Suspended' : custProfile.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    )}
                  </div>

                  {custStats && (
                    <div className="flex items-center gap-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p className="text-[0.62rem] font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.78)' }}>{custStats.totalOrders}</p>
                        <p className="text-[0.44rem] tracking-[0.10em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Total Orders</p>
                      </div>
                      <div>
                        <p className="text-[0.62rem] font-semibold tabular-nums" style={{ color: GOLD }}>{formatNaira(custStats.totalSpent)}</p>
                        <p className="text-[0.44rem] tracking-[0.10em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Lifetime Spent</p>
                      </div>
                    </div>
                  )}

                  {custProfile && (
                    <div className="mt-4">
                      <Link
                        href={`/admin/customers/${custProfile._id}`}
                        className="inline-flex items-center gap-1.5 text-[0.50rem] tracking-[0.12em] uppercase"
                        style={{ color: GOLD }}
                      >
                        View Customer Profile <ChevronRight size={10} strokeWidth={2} />
                      </Link>
                    </div>
                  )}
                </SectionCard>

                {/* A7: Order Summary */}
                <SectionCard>
                  <SectionHeading icon={<Package size={14} strokeWidth={1.6} />} label="Order Summary" />
                  <div className="space-y-0" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    {transfer.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {item.image ? (
                          <Image src={item.image} alt={item.name} width={36} height={36} className="object-cover shrink-0" style={{ background: '#1a1a1a' }} />
                        ) : (
                          <div className="w-9 h-9 shrink-0 flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                            <Package size={13} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.20)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.58rem] tracking-[0.04em] font-medium truncate" style={{ color: 'rgba(255,255,255,0.72)' }}>{item.name}</p>
                          <p className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>{item.size} · qty {item.qty}</p>
                        </div>
                        <p className="text-[0.58rem] font-semibold tabular-nums shrink-0" style={{ color: 'rgba(255,255,255,0.60)' }}>
                          {formatNaira(item.pricePerUnit * item.qty)}
                        </p>
                      </div>
                    ))}
                    <div className="px-4 py-3 space-y-1.5">
                      <div className="flex justify-between text-[0.52rem] tracking-[0.06em]">
                        <span style={{ color: 'rgba(255,255,255,0.30)' }}>Subtotal</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>{formatNaira(transfer.pricing.subtotal)}</span>
                      </div>
                      {transfer.pricing.discount > 0 && (
                        <div className="flex justify-between text-[0.52rem] tracking-[0.06em]">
                          <span style={{ color: 'rgba(255,255,255,0.30)' }}>Discount{transfer.pricing.couponLabel ? ` (${transfer.pricing.couponLabel})` : ''}</span>
                          <span style={{ color: 'rgba(34,197,94,0.70)' }}>−{formatNaira(transfer.pricing.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[0.52rem] tracking-[0.06em]">
                        <span style={{ color: 'rgba(255,255,255,0.30)' }}>Delivery</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>{transfer.pricing.deliveryFee === 0 ? 'Free' : formatNaira(transfer.pricing.deliveryFee)}</span>
                      </div>
                      {transfer.pricing.giftWrapFee > 0 && (
                        <div className="flex justify-between text-[0.52rem] tracking-[0.06em]">
                          <span style={{ color: 'rgba(255,255,255,0.30)' }}>Gift Wrapping</span>
                          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{formatNaira(transfer.pricing.giftWrapFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-[0.54rem] tracking-[0.10em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>Total</span>
                        <span className="text-[0.70rem] font-bold tabular-nums" style={{ color: GOLD }}>{formatNaira(transfer.pricing.total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/admin/orders/${transfer._id}`}
                      className="inline-flex items-center gap-1.5 text-[0.50rem] tracking-[0.12em] uppercase"
                      style={{ color: GOLD }}
                    >
                      View Full Order <ChevronRight size={10} strokeWidth={2} />
                    </Link>
                  </div>
                </SectionCard>

                {/* A8: Delivery Information */}
                <SectionCard>
                  <SectionHeading icon={<Truck size={14} strokeWidth={1.6} />} label="Delivery Information" />
                  <div className="space-y-0">
                    <InfoRow label="Recipient" value={customerName} />
                    <InfoRow label="Address">
                      <div className="text-right">
                        <p className="text-[0.58rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                          {transfer.shippingAddress.street}{transfer.shippingAddress.apt ? `, ${transfer.shippingAddress.apt}` : ''}
                        </p>
                        <p className="text-[0.54rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {transfer.shippingAddress.city}, {transfer.shippingAddress.state}
                        </p>
                        <p className="text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                          {transfer.shippingAddress.country}
                        </p>
                      </div>
                    </InfoRow>
                    <InfoRow label="Phone" value={transfer.contact.phone} />
                    <InfoRow label="Delivery Method" value={transfer.delivery.label} />
                    <InfoRow label="Estimated Duration" value={transfer.delivery.duration} />
                  </div>
                  <div
                    className="mt-4 flex items-start gap-2 px-3 py-2.5"
                    style={{ background: 'rgba(180,130,60,0.05)', border: '1px solid rgba(180,130,60,0.14)' }}
                  >
                    <MapPin size={11} strokeWidth={1.8} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
                    <p className="text-[0.50rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.32)' }}>
                      Delivery begins after payment is confirmed. Estimated {transfer.delivery.duration} after confirmation.
                    </p>
                  </div>
                </SectionCard>

              </div>{/* /left column */}

              {/* ── Right column ─────────────────────────────────────────── */}
              <div className="space-y-5">

                {/* A10: Verification History */}
                {(transferStatus === 'verified' || transferStatus === 'rejected' || historyEvents.length > 0) && (
                  <SectionCard>
                    <SectionHeading icon={<Clock size={14} strokeWidth={1.6} />} label="Verification History" />
                    <div className="space-y-0">
                      {historyEvents.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: i < historyEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div
                            className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5"
                            style={{
                              background: transferStatus === 'verified' ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                              color:      transferStatus === 'verified' ? 'rgba(34,197,94,0.80)' : 'rgba(239,68,68,0.80)',
                            }}
                          >
                            {ev.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.54rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{ev.text}</p>
                            {ev.sub && <p className="mt-0.5 text-[0.48rem] tracking-[0.04em]" style={{ color: 'rgba(239,68,68,0.60)' }}>{ev.sub}</p>}
                            <p className="mt-0.5 text-[0.44rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>{ev.time}</p>
                          </div>
                        </div>
                      ))}
                      {historyEvents.length === 0 && (
                        <p className="text-[0.52rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.20)' }}>No history yet.</p>
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* A11: Admin Notes */}
                <SectionCard>
                  <SectionHeading icon={<MessageSquare size={14} strokeWidth={1.6} />} label="Admin Notes" />

                  {/* Existing notes */}
                  {notes.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {notes.map((note) => (
                        <div
                          key={note._id}
                          className="px-3 py-3 space-y-1.5"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[0.56rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                              {note.content}
                            </p>
                            {(adminUser?._id === note.adminId || adminUser?.role === 'superadmin') && (
                              <button
                                onClick={() => deleteNote(note._id)}
                                className="shrink-0 flex items-center justify-center w-5 h-5 transition-colors duration-100"
                                style={{ color: 'rgba(255,255,255,0.18)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(239,68,68,0.65)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
                              >
                                <Trash2 size={11} strokeWidth={1.8} />
                              </button>
                            )}
                          </div>
                          <p className="text-[0.44rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                            {note.adminName} · {formatDateTime(note.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-4 text-[0.52rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.20)' }}>No notes yet.</p>
                  )}

                  {/* Add note */}
                  <div className="space-y-2">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      placeholder="Add an internal note about this transfer…"
                      className="w-full px-3 py-2.5 text-[0.54rem] tracking-[0.04em] leading-relaxed outline-none resize-none"
                      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)' }}
                    />
                    <button
                      onClick={addNote}
                      disabled={noteLoading || !noteContent.trim()}
                      className="w-full flex items-center justify-center gap-1.5 h-8 text-[0.50rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'rgba(180,130,60,0.10)', border: '1px solid rgba(180,130,60,0.22)', color: GOLD }}
                    >
                      {noteLoading ? <Loader2 size={11} strokeWidth={2} className="animate-spin" /> : <Send size={11} strokeWidth={1.8} />}
                      {noteLoading ? 'Saving…' : 'Add Note'}
                    </button>
                  </div>
                </SectionCard>

              </div>{/* /right column */}
            </div>{/* /grid */}

          </div>
        </main>
      </div>
    </div>
  );
}
