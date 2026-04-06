'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Loader2,
  CheckSquare,
  Square,
  Copy,
  Check,
  Eye,
  X,
  Image as ImageIcon,
  Calendar,
  Filter,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import Image from 'next/image';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

type TabKey = 'pending' | 'verified' | 'rejected' | 'all';
type SortKey = 'oldest' | 'newest' | 'amount-desc' | 'amount-asc';
type TimeElapsed = 'all' | 'under6' | '6to12' | '12to24' | 'over24';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BankTransfer {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    initials: string;
  };
  amount: number;
  reference: string;
  placedAt: string;
  proofUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  rejectedAt?: string;
  actionedBy?: string;
  rejectionReason?: string;
  minutesElapsed: number;
}

interface TransferStats {
  pendingCount: number;
  verifiedToday: number;
  rejectedToday: number;
  totalPendingAmount: number;
  totalVerifiedMonth: number;
}

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatNairaFull(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' at ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24)
    return m > 0 ? `${h}h ${m}m ago` : `${h} hour${h !== 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d !== 1 ? 's' : ''} ago`;
}

function getUrgencyColor(minutes: number): string {
  if (minutes < 360) return 'rgba(251,191,36,1)'; // amber  < 6h
  if (minutes < 720) return 'rgba(249,115,22,1)'; // orange 6–12h
  if (minutes < 1440) return 'rgba(239,68,68,1)'; // red    12–24h
  return 'rgba(185,28,28,1)'; // dark red > 24h
}

function getUrgencyBg(minutes: number): string {
  if (minutes < 360) return 'rgba(251,191,36,0.10)';
  if (minutes < 720) return 'rgba(249,115,22,0.10)';
  if (minutes < 1440) return 'rgba(239,68,68,0.10)';
  return 'rgba(185,28,28,0.12)';
}

function deadlineMinutesLeft(minutes: number) {
  return Math.max(0, 24 * 60 - minutes);
}

function exportTransfersToCSV(transfers: BankTransfer[]) {
  const headers = [
    'Order #',
    'Customer',
    'Email',
    'Phone',
    'Amount (₦)',
    'Reference',
    'Status',
    'Date Placed',
    'Date Actioned',
    'Actioned By',
  ];
  const rows = transfers.map((t) => [
    t.orderNumber,
    `"${t.customer.name}"`,
    t.customer.email,
    t.customer.phone,
    t.amount,
    t.reference,
    t.status,
    formatDatetime(t.placedAt),
    t.verifiedAt
      ? formatDatetime(t.verifiedAt)
      : t.rejectedAt
        ? formatDatetime(t.rejectedAt)
        : 'Pending',
    t.actionedBy ?? '—',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `bank-transfers-${Date.now()}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-100"
      style={{
        color: copied ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.22)',
      }}
      title="Copy"
    >
      {copied ? (
        <Check size={11} strokeWidth={2.5} />
      ) : (
        <Copy size={11} strokeWidth={1.8} />
      )}
    </button>
  );
}

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
  const active = value !== '' && value !== 'all';
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
            className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[160px] py-1"
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

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  color,
  urgent,
}: {
  value: string;
  label: string;
  color: 'red' | 'green' | 'amber' | 'gold' | 'neutral';
  urgent?: boolean;
}) {
  const colorMap = {
    red: {
      text: 'rgba(239,68,68,0.92)',
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.14)',
    },
    green: {
      text: 'rgba(34,197,94,0.92)',
      bg: 'rgba(34,197,94,0.06)',
      border: 'rgba(34,197,94,0.14)',
    },
    amber: {
      text: 'rgba(251,191,36,0.92)',
      bg: 'rgba(251,191,36,0.06)',
      border: 'rgba(251,191,36,0.14)',
    },
    gold: {
      text: GOLD,
      bg: 'rgba(180,130,60,0.06)',
      border: 'rgba(180,130,60,0.14)',
    },
    neutral: {
      text: 'rgba(255,255,255,0.78)',
      bg: 'rgba(255,255,255,0.02)',
      border: 'rgba(255,255,255,0.07)',
    },
  };
  const c = colorMap[color];

  return (
    <div
      className="flex-1 min-w-[140px] px-4 py-3.5 relative"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {urgent && (
        <span
          className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: c.text }}
        />
      )}
      <p
        className="text-[1.0rem] font-semibold tabular-nums leading-none"
        style={{ color: c.text }}
      >
        {value}
      </p>
      <p
        className="mt-1.5 text-[0.48rem] tracking-[0.12em] uppercase"
        style={{ color: 'rgba(255,255,255,0.32)' }}
      >
        {label}
      </p>
    </div>
  );
}

// ── BankAccountModal ───────────────────────────────────────────────────────────

function BankAccountModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm p-6"
        style={{
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Building2 size={16} strokeWidth={1.6} style={{ color: GOLD }} />
            <p
              className="text-[0.62rem] tracking-[0.16em] uppercase font-semibold"
              style={{ color: 'rgba(255,255,255,0.80)' }}
            >
              Bank Account Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
            style={{
              color: 'rgba(255,255,255,0.30)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')
            }
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-4 mb-5">
          {[
            { label: 'Bank Name', value: 'GTBank', copyable: false },
            {
              label: 'Account Name',
              value: 'Aurafumeng Perfumes Ltd',
              copyable: false,
            },
            { label: 'Account Number', value: '0123456789', copyable: true },
          ].map(({ label, value, copyable }) => (
            <div
              key={label}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '12px',
              }}
            >
              <p
                className="text-[0.44rem] tracking-[0.16em] uppercase mb-1"
                style={{ color: 'rgba(255,255,255,0.24)' }}
              >
                {label}
              </p>
              <div className="flex items-center gap-2">
                <p
                  className="text-[0.60rem] tracking-[0.06em] font-medium"
                  style={{ color: 'rgba(255,255,255,0.78)' }}
                >
                  {value}
                </p>
                {copyable && <CopyButton text={value} />}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mb-5 px-3 py-2.5 text-[0.50rem] tracking-[0.04em] leading-relaxed"
          style={{
            background: 'rgba(180,130,60,0.06)',
            border: '1px solid rgba(180,130,60,0.15)',
            color: 'rgba(255,255,255,0.40)',
          }}
        >
          Customers transfer to this account and use their order number as
          narration.
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex-1 h-9 text-[0.52rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
            style={{
              background: 'rgba(180,130,60,0.14)',
              border: '1px solid rgba(180,130,60,0.28)',
              color: GOLD,
            }}
            onClick={() => navigator.clipboard.writeText('0123456789')}
          >
            Copy Account Number
          </button>
          <Link
            href="/admin/settings"
            className="flex items-center justify-center h-9 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-100 whitespace-nowrap"
            style={{
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Edit Details
          </Link>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-100"
            style={{
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── ConfirmModal ───────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ duration: 0.16 }}
        className="w-full max-w-xs p-5"
        style={{
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="text-[0.62rem] tracking-[0.10em] font-semibold mb-1.5"
          style={{ color: 'rgba(255,255,255,0.82)' }}
        >
          {title}
        </p>
        <p
          className="text-[0.52rem] tracking-[0.04em] leading-relaxed mb-4"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          {message}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 h-8 text-[0.50rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
            style={{ background: confirmColor, color: '#fff', border: 'none' }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 h-8 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
            style={{
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── RejectReasonModal ──────────────────────────────────────────────────────────

function RejectReasonModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ duration: 0.16 }}
        className="w-full max-w-xs p-5"
        style={{
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="text-[0.62rem] tracking-[0.10em] font-semibold mb-1.5"
          style={{ color: 'rgba(255,255,255,0.82)' }}
        >
          Reject Payment
        </p>
        <p
          className="text-[0.52rem] tracking-[0.04em] leading-relaxed mb-3"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          Provide a reason for rejecting this payment.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason..."
          rows={3}
          className="w-full px-3 py-2 text-[0.54rem] tracking-[0.04em] outline-none resize-none mb-3"
          style={{
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.72)',
          }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (reason.trim()) onConfirm(reason.trim());
            }}
            disabled={!reason.trim()}
            className="flex-1 h-8 text-[0.50rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
            style={{
              background: reason.trim()
                ? 'rgba(239,68,68,0.85)'
                : 'rgba(239,68,68,0.25)',
              color: '#fff',
              cursor: reason.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Reject Payment
          </button>
          <button
            onClick={onCancel}
            className="flex-1 h-8 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-100"
            style={{
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PendingCard ────────────────────────────────────────────────────────────────

function PendingCard({
  transfer,
  selected,
  onToggle,
  onVerify,
  onReject,
}: {
  transfer: BankTransfer;
  selected: boolean;
  onToggle: () => void;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const urgencyColor = getUrgencyColor(transfer.minutesElapsed);
  const urgencyBg = getUrgencyBg(transfer.minutesElapsed);
  const minsLeft = deadlineMinutesLeft(transfer.minutesElapsed);
  const hoursLeft = Math.floor(minsLeft / 60);
  const isCritical = transfer.minutesElapsed >= 1440;

  return (
    <div
      className="p-4 transition-colors duration-150 relative"
      style={{
        background: selected ? 'rgba(180,130,60,0.04)' : '#181818',
        border: `1px solid ${selected ? 'rgba(180,130,60,0.22)' : urgencyBg}`,
        borderLeft: `3px solid ${urgencyColor}`,
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          <Checkbox checked={selected} onChange={onToggle} />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/admin/bank-transfers/${transfer._id}`}
                className="text-[0.60rem] tracking-[0.08em] font-semibold hover:underline"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                {transfer.orderNumber}
              </Link>
              {isCritical && (
                <span
                  className="text-[0.40rem] tracking-[0.14em] uppercase font-semibold px-1.5 py-0.5"
                  style={{
                    background: 'rgba(185,28,28,0.15)',
                    color: 'rgba(185,28,28,0.95)',
                    border: '1px solid rgba(185,28,28,0.25)',
                  }}
                >
                  CRITICAL
                </span>
              )}
            </div>
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.44rem] tracking-[0.10em]"
              style={{
                background: urgencyBg,
                color: urgencyColor,
                border: `1px solid ${urgencyColor}30`,
              }}
            >
              <Clock size={9} strokeWidth={2} />⏱{' '}
              {formatElapsed(transfer.minutesElapsed)}
            </div>
          </div>
        </div>
        <p
          className="text-[0.85rem] font-semibold tabular-nums shrink-0"
          style={{ color: urgencyColor }}
        >
          {formatNairaFull(transfer.amount)}
        </p>
      </div>

      {/* Card Body */}
      <div className="mb-3 space-y-1.5 pl-6">
        {/* Customer */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[0.40rem] font-bold tracking-wide"
            style={{ background: 'rgba(180,130,60,0.15)', color: GOLD }}
          >
            {transfer.customer.initials}
          </div>
          <div>
            <p
              className="text-[0.54rem] tracking-[0.04em] font-medium"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              {transfer.customer.name}
            </p>
            <p
              className="text-[0.46rem] tracking-[0.04em]"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              {transfer.customer.email} · {transfer.customer.phone}
            </p>
          </div>
        </div>

        {/* Reference */}
        <div className="flex items-center gap-1.5">
          <p
            className="text-[0.44rem] tracking-[0.10em] uppercase"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Ref:
          </p>
          <p
            className="text-[0.52rem] tracking-[0.06em] font-mono"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {transfer.reference}
          </p>
          <CopyButton text={transfer.reference} />
        </div>

        {/* Date placed */}
        <div className="flex items-center gap-1.5">
          <Calendar
            size={9}
            strokeWidth={1.8}
            style={{ color: 'rgba(255,255,255,0.22)' }}
          />
          <p
            className="text-[0.46rem] tracking-[0.04em]"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Placed: {formatDatetime(transfer.placedAt)}
          </p>
        </div>

        {/* Deadline */}
        {minsLeft > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle
              size={9}
              strokeWidth={2}
              style={{ color: urgencyColor }}
            />
            <p
              className="text-[0.46rem] tracking-[0.06em]"
              style={{ color: urgencyColor }}
            >
              {hoursLeft > 0
                ? `${hoursLeft}h ${minsLeft % 60}m`
                : `${minsLeft}m`}{' '}
              left before 24hr deadline
            </p>
          </div>
        )}
        {minsLeft === 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle
              size={9}
              strokeWidth={2}
              style={{ color: 'rgba(185,28,28,0.95)' }}
            />
            <p
              className="text-[0.46rem] tracking-[0.06em]"
              style={{ color: 'rgba(185,28,28,0.95)' }}
            >
              Past 24hr deadline
            </p>
          </div>
        )}

        {/* Proof of payment */}
        <div className="mt-2">
          <p
            className="text-[0.44rem] tracking-[0.10em] uppercase mb-1.5"
            style={{ color: 'rgba(255,255,255,0.20)' }}
          >
            Proof of Payment
          </p>
          {transfer.proofUrl ? (
            <div className="flex items-center gap-2.5">
              <div
                className="relative w-10 h-14 shrink-0 overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#111',
                }}
              >
                <Image
                  src={transfer.proofUrl}
                  alt="Proof"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <a
                  href={transfer.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[0.46rem] tracking-[0.08em] underline"
                  style={{ color: GOLD }}
                >
                  <Eye size={10} strokeWidth={1.8} /> View Full Size
                </a>
                <a
                  href={transfer.proofUrl}
                  download
                  className="flex items-center gap-1 text-[0.46rem] tracking-[0.08em]"
                  style={{ color: 'rgba(255,255,255,0.38)' }}
                >
                  <Download size={10} strokeWidth={1.8} /> Download
                </a>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-2 text-[0.46rem] tracking-[0.06em]"
              style={{
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.15)',
                color: 'rgba(251,191,36,0.80)',
              }}
            >
              <ImageIcon size={10} strokeWidth={1.8} />
              No proof uploaded by customer
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center gap-2 pl-6">
        <button
          onClick={() => onVerify(transfer._id)}
          className="flex-1 h-8 text-[0.50rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
          style={{
            background: 'rgba(34,197,94,0.14)',
            border: '1px solid rgba(34,197,94,0.28)',
            color: 'rgba(34,197,94,0.92)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(34,197,94,0.22)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(34,197,94,0.14)')
          }
        >
          <span className="flex items-center justify-center gap-1.5">
            <CheckCircle2 size={11} strokeWidth={2} />
            Confirm Payment
          </span>
        </button>
        <button
          onClick={() => onReject(transfer._id)}
          className="h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
          style={{
            border: '1px solid rgba(239,68,68,0.28)',
            color: 'rgba(239,68,68,0.80)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span className="flex items-center gap-1.5">
            <XCircle size={11} strokeWidth={2} />
            Reject
          </span>
        </button>
        <Link
          href={`/admin/bank-transfers/${transfer._id}`}
          className="h-8 px-3 flex items-center text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-100"
          style={{
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.32)',
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

// ── VerifiedCard ───────────────────────────────────────────────────────────────

function VerifiedCard({ transfer }: { transfer: BankTransfer }) {
  const verifiedMs = transfer.verifiedAt
    ? new Date(transfer.verifiedAt).getTime() -
      new Date(transfer.placedAt).getTime()
    : 0;
  const verifiedHrs = Math.floor(verifiedMs / (1000 * 60 * 60));
  const verifiedMins = Math.floor(
    (verifiedMs % (1000 * 60 * 60)) / (1000 * 60),
  );

  return (
    <div
      className="p-4"
      style={{
        background: '#181818',
        border: '1px solid rgba(34,197,94,0.12)',
        borderLeft: '3px solid rgba(34,197,94,0.60)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p
            className="text-[0.58rem] tracking-[0.08em] font-semibold"
            style={{ color: 'rgba(255,255,255,0.82)' }}
          >
            {transfer.orderNumber}
          </p>
          <p
            className="mt-0.5 text-[0.48rem] tracking-[0.04em]"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            {transfer.customer.name} · {transfer.customer.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p
            className="text-[0.72rem] font-semibold tabular-nums"
            style={{ color: 'rgba(34,197,94,0.88)' }}
          >
            {formatNairaFull(transfer.amount)}
          </p>
          <span
            className="text-[0.40rem] tracking-[0.14em] uppercase px-1.5 py-0.5 font-semibold"
            style={{
              background: 'rgba(34,197,94,0.10)',
              color: 'rgba(34,197,94,0.88)',
              border: '1px solid rgba(34,197,94,0.22)',
            }}
          >
            Verified
          </span>
        </div>
      </div>
      <div
        className="space-y-1 text-[0.46rem] tracking-[0.04em]"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      >
        <div className="flex items-center gap-1.5">
          <p>
            Ref:{' '}
            <span
              className="font-mono"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              {transfer.reference}
            </span>
          </p>
          <CopyButton text={transfer.reference} />
        </div>
        {transfer.verifiedAt && (
          <p>Verified: {formatDatetime(transfer.verifiedAt)}</p>
        )}
        <p>By: {transfer.actionedBy ?? '—'}</p>
        {verifiedMs > 0 && (
          <p style={{ color: 'rgba(34,197,94,0.65)' }}>
            Verified in {verifiedHrs}h {verifiedMins}min
          </p>
        )}
      </div>
      <div className="mt-3">
        <Link
          href={`/admin/bank-transfers/${transfer._id}`}
          className="text-[0.46rem] tracking-[0.10em] uppercase underline"
          style={{ color: GOLD }}
        >
          View Order
        </Link>
      </div>
    </div>
  );
}

// ── RejectedCard ───────────────────────────────────────────────────────────────

function RejectedCard({ transfer }: { transfer: BankTransfer }) {
  return (
    <div
      className="p-4"
      style={{
        background: '#181818',
        border: '1px solid rgba(239,68,68,0.12)',
        borderLeft: '3px solid rgba(239,68,68,0.55)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p
            className="text-[0.58rem] tracking-[0.08em] font-semibold"
            style={{ color: 'rgba(255,255,255,0.82)' }}
          >
            {transfer.orderNumber}
          </p>
          <p
            className="mt-0.5 text-[0.48rem] tracking-[0.04em]"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            {transfer.customer.name} · {transfer.customer.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p
            className="text-[0.72rem] font-semibold tabular-nums"
            style={{ color: 'rgba(239,68,68,0.80)' }}
          >
            {formatNairaFull(transfer.amount)}
          </p>
          <span
            className="text-[0.40rem] tracking-[0.14em] uppercase px-1.5 py-0.5 font-semibold"
            style={{
              background: 'rgba(239,68,68,0.10)',
              color: 'rgba(239,68,68,0.80)',
              border: '1px solid rgba(239,68,68,0.22)',
            }}
          >
            Rejected
          </span>
        </div>
      </div>
      <div
        className="space-y-1 text-[0.46rem] tracking-[0.04em]"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      >
        <div className="flex items-center gap-1.5">
          <p>
            Ref:{' '}
            <span
              className="font-mono"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              {transfer.reference}
            </span>
          </p>
          <CopyButton text={transfer.reference} />
        </div>
        {transfer.rejectedAt && (
          <p>Rejected: {formatDatetime(transfer.rejectedAt)}</p>
        )}
        <p>By: {transfer.actionedBy ?? '—'}</p>
        {transfer.rejectionReason && (
          <p
            className="mt-1 leading-relaxed"
            style={{ color: 'rgba(239,68,68,0.70)' }}
          >
            Reason: {transfer.rejectionReason}
          </p>
        )}
      </div>
      <div className="mt-3">
        <Link
          href={`/admin/bank-transfers/${transfer._id}`}
          className="text-[0.46rem] tracking-[0.10em] uppercase underline"
          style={{ color: GOLD }}
        >
          View Order
        </Link>
      </div>
    </div>
  );
}

// ── AllTransfersTable ──────────────────────────────────────────────────────────

function AllTransfersTable({
  transfers,
  selected,
  onToggleAll,
  onToggleOne,
  allSelected,
  onVerify,
  onReject,
}: {
  transfers: BankTransfer[];
  selected: Set<string>;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  allSelected: boolean;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const STATUS_BADGE: Record<
    BankTransfer['status'],
    { label: string; color: string; bg: string; border: string }
  > = {
    pending: {
      label: 'Pending',
      color: 'rgba(251,191,36,0.88)',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.20)',
    },
    verified: {
      label: 'Verified',
      color: 'rgba(34,197,94,0.88)',
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.20)',
    },
    rejected: {
      label: 'Rejected',
      color: 'rgba(239,68,68,0.80)',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.20)',
    },
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-[0.50rem] tracking-[0.06em]">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <th className="py-2.5 px-3 text-left w-8">
              <Checkbox checked={allSelected} onChange={onToggleAll} />
            </th>
            {[
              'Order ID',
              'Customer',
              'Amount',
              'Reference',
              'Proof',
              'Status',
              'Date Placed',
              'Date Actioned',
              'Actioned By',
              'Actions',
            ].map((h) => (
              <th
                key={h}
                className="py-2.5 px-3 text-left whitespace-nowrap text-[0.44rem] uppercase tracking-[0.12em]"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transfers.map((t, i) => {
            const badge = STATUS_BADGE[t.status];
            return (
              <tr
                key={t._id}
                style={{
                  background:
                    i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <td className="py-2.5 px-3">
                  <Checkbox
                    checked={selected.has(t._id)}
                    onChange={() => onToggleOne(t._id)}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <p
                    className="font-semibold"
                    style={{ color: 'rgba(255,255,255,0.78)' }}
                  >
                    {t.orderNumber}
                  </p>
                </td>
                <td className="py-2.5 px-3">
                  <p style={{ color: 'rgba(255,255,255,0.70)' }}>
                    {t.customer.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.30)' }}>
                    {t.customer.email}
                  </p>
                </td>
                <td
                  className="py-2.5 px-3 tabular-nums font-semibold"
                  style={{ color: 'rgba(255,255,255,0.80)' }}
                >
                  {formatNairaFull(t.amount)}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span
                      className="font-mono"
                      style={{ color: 'rgba(255,255,255,0.52)' }}
                    >
                      {t.reference}
                    </span>
                    <CopyButton text={t.reference} />
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  {t.proofUrl ? (
                    <a
                      href={t.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div
                        className="w-7 h-10 overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.proofUrl}
                          alt="proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </a>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.22)' }}>
                      None
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className="px-2 py-0.5 text-[0.40rem] tracking-[0.10em] uppercase font-semibold"
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                </td>
                <td
                  className="py-2.5 px-3 whitespace-nowrap"
                  style={{ color: 'rgba(255,255,255,0.38)' }}
                >
                  {formatDatetime(t.placedAt)}
                </td>
                <td
                  className="py-2.5 px-3 whitespace-nowrap"
                  style={{ color: 'rgba(255,255,255,0.38)' }}
                >
                  {t.verifiedAt
                    ? formatDatetime(t.verifiedAt)
                    : t.rejectedAt
                      ? formatDatetime(t.rejectedAt)
                      : '—'}
                </td>
                <td
                  className="py-2.5 px-3"
                  style={{ color: 'rgba(255,255,255,0.38)' }}
                >
                  {t.actionedBy ?? '—'}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/bank-transfers/${t._id}`}
                      className="h-6 px-2 flex items-center text-[0.40rem] tracking-[0.10em] uppercase transition-colors duration-100"
                      style={{
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.32)',
                      }}
                    >
                      <Eye size={9} strokeWidth={1.8} />
                    </Link>
                    {t.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onVerify(t._id)}
                          className="h-6 px-2 flex items-center gap-1 text-[0.40rem] tracking-[0.08em] uppercase transition-colors duration-100"
                          style={{
                            border: '1px solid rgba(34,197,94,0.22)',
                            color: 'rgba(34,197,94,0.75)',
                            background: 'rgba(34,197,94,0.06)',
                          }}
                        >
                          <CheckCircle2 size={9} strokeWidth={2} /> Verify
                        </button>
                        <button
                          onClick={() => onReject(t._id)}
                          className="h-6 px-2 flex items-center gap-1 text-[0.40rem] tracking-[0.08em] uppercase transition-colors duration-100"
                          style={{
                            border: '1px solid rgba(239,68,68,0.22)',
                            color: 'rgba(239,68,68,0.70)',
                            background: 'rgba(239,68,68,0.06)',
                          }}
                        >
                          <XCircle size={9} strokeWidth={2} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {transfers.length === 0 && (
        <div className="py-12 text-center">
          <p
            className="text-[0.54rem] tracking-[0.10em]"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            No transfers found
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function BankTransfersPage() {
  const router = useRouter();

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [stats, setStats] = useState<TransferStats | null>(null);
  const [transfersLoading, setTransfersLoading] = useState(true);

  // ── Filters ───────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>('pending');
  const [dateRange, setDateRange] = useState('all');
  const [timeElapsed, setTimeElapsed] = useState<TimeElapsed>('all');
  const [sort, setSort] = useState<SortKey>('oldest');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  // ── Selection ─────────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);

  // ── Modals ────────────────────────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{
    id: string;
    action: 'verify';
  } | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // ── Auth check ────────────────────────────────────────────────────────────────
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

  // ── Fetch transfers ────────────────────────────────────────────────────────────
  const fetchTransfers = useCallback(async () => {
    setTransfersLoading(true);
    try {
      const res = await fetch('/api/admin/bank-transfers');
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { transfers: BankTransfer[]; stats: TransferStats };
      };
      if (json.data) {
        setTransfers(json.data.transfers);
        setStats(json.data.stats);
      }
    } catch {
      /* ignore */
    } finally {
      setTransfersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchTransfers();
  }, [authLoading, fetchTransfers]);

  // ── Bulk dropdown close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bulkOpen) return;
    function handle(e: MouseEvent) {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node))
        setBulkOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [bulkOpen]);

  // ── Filtered + sorted transfers ───────────────────────────────────────────────
  const filtered = useCallback((): BankTransfer[] => {
    let list = [...transfers];

    // Tab filter
    if (tab !== 'all') list = list.filter((t) => t.status === tab);

    // Time elapsed filter
    if (timeElapsed !== 'all') {
      list = list.filter((t) => {
        if (timeElapsed === 'under6') return t.minutesElapsed < 360;
        if (timeElapsed === '6to12')
          return t.minutesElapsed >= 360 && t.minutesElapsed < 720;
        if (timeElapsed === '12to24')
          return t.minutesElapsed >= 720 && t.minutesElapsed < 1440;
        if (timeElapsed === 'over24') return t.minutesElapsed >= 1440;
        return true;
      });
    }

    // Amount range
    if (amountMin !== '')
      list = list.filter((t) => t.amount >= Number(amountMin));
    if (amountMax !== '')
      list = list.filter((t) => t.amount <= Number(amountMax));

    // Sort
    list.sort((a, b) => {
      if (sort === 'oldest')
        return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
      if (sort === 'newest')
        return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
      if (sort === 'amount-desc') return b.amount - a.amount;
      if (sort === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [transfers, tab, timeElapsed, amountMin, amountMax, sort]);

  const displayTransfers = filtered();

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const allSelected =
    displayTransfers.length > 0 &&
    displayTransfers.every((t) => selected.has(t._id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        displayTransfers.forEach((t) => next.delete(t._id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        displayTransfers.forEach((t) => next.add(t._id));
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
  function handleVerify(id: string) {
    setConfirmModal({ id, action: 'verify' });
  }
  function handleReject(id: string) {
    setRejectModal(id);
  }

  async function confirmVerify() {
    if (!confirmModal) return;
    try {
      await fetch(`/api/admin/bank-transfers/${confirmModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
    } catch {
      /* ignore */
    }
    setConfirmModal(null);
    fetchTransfers();
  }

  async function confirmReject(reason: string) {
    if (!rejectModal) return;
    try {
      await fetch(`/api/admin/bank-transfers/${rejectModal}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
      });
    } catch {
      /* ignore */
    }
    setRejectModal(null);
    fetchTransfers();
  }

  async function applyBulk() {
    const ids = Array.from(selected).filter(
      (id) => transfers.find((t) => t._id === id)?.status === 'pending',
    );
    const action = bulkAction === 'verify-all' ? 'verify' : 'reject';
    const rejectionReason = 'Bulk rejected.';

    await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/bank-transfers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            action === 'verify' ? { action } : { action, rejectionReason },
          ),
        }).catch(() => {}),
      ),
    );

    setSelected(new Set());
    setBulkAction('');
    setBulkConfirm(false);
    fetchTransfers();
  }

  function clearFilters() {
    setDateRange('all');
    setTimeElapsed('all');
    setAmountMin('');
    setAmountMax('');
    setSort('oldest');
  }

  const activeFilterCount = [
    dateRange !== 'all',
    timeElapsed !== 'all',
    amountMin !== '',
    amountMax !== '',
    sort !== 'oldest',
  ].filter(Boolean).length;

  const pendingCount = transfers.filter((t) => t.status === 'pending').length;
  const oldestPendingMins = transfers
    .filter((t) => t.status === 'pending')
    .reduce((max, t) => Math.max(max, t.minutesElapsed), 0);

  const adminFullName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName}`
    : '—';
  const adminShortName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName[0]}.`
    : '—';
  const adminRoleLabel =
    adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  const DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ] as const;

  const TIME_ELAPSED_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'under6', label: 'Under 6 hrs' },
    { value: '6to12', label: '6–12 hrs' },
    { value: '12to24', label: '12–24 hrs' },
    { value: 'over24', label: 'Over 24 hrs' },
  ] as const;

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'oldest', label: 'Oldest First (Most Urgent)' },
    { value: 'newest', label: 'Newest First' },
    { value: 'amount-desc', label: 'Amount: High–Low' },
    { value: 'amount-asc', label: 'Amount: Low–High' },
  ];

  const TABS: { key: TabKey; label: string; count?: number; color?: string }[] =
    [
      {
        key: 'pending',
        label: 'Pending',
        count: transfers.filter((t) => t.status === 'pending').length,
        color: 'rgba(239,68,68,0.85)',
      },
      {
        key: 'verified',
        label: 'Verified',
        count: transfers.filter((t) => t.status === 'verified').length,
        color: 'rgba(34,197,94,0.85)',
      },
      {
        key: 'rejected',
        label: 'Rejected',
        count: transfers.filter((t) => t.status === 'rejected').length,
        color: 'rgba(239,68,68,0.70)',
      },
      { key: 'all', label: 'All Transfers', count: transfers.length },
    ];

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
      {/* Modals */}
      <AnimatePresence>
        {bankModalOpen && (
          <BankAccountModal onClose={() => setBankModalOpen(false)} />
        )}
        {confirmModal && (
          <ConfirmModal
            title="Confirm Payment"
            message={`Are you sure you want to verify this bank transfer? This will mark the order as paid.`}
            confirmLabel="Yes, Confirm Payment"
            confirmColor="rgba(34,197,94,0.85)"
            onConfirm={confirmVerify}
            onCancel={() => setConfirmModal(null)}
          />
        )}
        {rejectModal !== null && (
          <RejectReasonModal
            onConfirm={confirmReject}
            onCancel={() => setRejectModal(null)}
          />
        )}
        {bulkConfirm && (
          <ConfirmModal
            title={
              bulkAction === 'verify-all'
                ? 'Confirm All Selected'
                : 'Reject All Selected'
            }
            message={`This will ${bulkAction === 'verify-all' ? 'verify' : 'reject'} ${selected.size} selected transfer${selected.size !== 1 ? 's' : ''}. This action cannot be undone.`}
            confirmLabel={
              bulkAction === 'verify-all' ? 'Verify All' : 'Reject All'
            }
            confirmColor={
              bulkAction === 'verify-all'
                ? 'rgba(34,197,94,0.85)'
                : 'rgba(239,68,68,0.85)'
            }
            onConfirm={applyBulk}
            onCancel={() => setBulkConfirm(false)}
          />
        )}
      </AnimatePresence>

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
          pageTitle="Bank Transfer Verification"
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-5">
            {/* ── A1: Page Header ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    Bank Transfer Verification
                  </h1>
                  <span
                    className="flex items-center h-5 px-2 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
                    style={{
                      background:
                        pendingCount > 0
                          ? 'rgba(239,68,68,0.10)'
                          : 'rgba(255,255,255,0.04)',
                      color:
                        pendingCount > 0
                          ? 'rgba(239,68,68,0.85)'
                          : 'rgba(255,255,255,0.28)',
                      border: `1px solid ${pendingCount > 0 ? 'rgba(239,68,68,0.20)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {pendingCount} Pending Verification
                    {pendingCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <p
                  className="text-[0.54rem] tracking-[0.08em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  Review and verify pending bank transfer payments.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => exportTransfersToCSV(transfers)}
                  className="flex items-center gap-1.5 h-8 px-3 text-[0.52rem] tracking-[0.10em] uppercase font-semibold transition-colors duration-150"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.72)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  }}
                >
                  <Download size={12} strokeWidth={1.8} /> Export Report
                </button>
                <button
                  onClick={() => setBankModalOpen(true)}
                  className="flex items-center gap-1.5 h-8 px-3 text-[0.52rem] tracking-[0.10em] uppercase font-semibold transition-colors duration-150"
                  style={{
                    border: `1px solid rgba(180,130,60,0.28)`,
                    background: 'rgba(180,130,60,0.08)',
                    color: GOLD,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(180,130,60,0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(180,130,60,0.08)';
                  }}
                >
                  <Building2 size={12} strokeWidth={1.8} /> Bank Account Details
                </button>
              </div>
            </div>

            {/* ── A2: Key Stats Bar ──────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
              <StatCard
                value={stats ? String(stats.pendingCount) : '—'}
                label="Awaiting Review"
                color="red"
                urgent={!!(stats && stats.pendingCount > 0)}
              />
              <StatCard
                value={stats ? String(stats.verifiedToday) : '—'}
                label="Confirmed Today"
                color="green"
              />
              <StatCard
                value={stats ? String(stats.rejectedToday) : '—'}
                label="Rejected Today"
                color="red"
              />
              <StatCard
                value={stats ? formatNaira(stats.totalPendingAmount) : '—'}
                label="Awaiting Confirmation"
                color="amber"
              />
              <StatCard
                value={stats ? formatNaira(stats.totalVerifiedMonth) : '—'}
                label="Confirmed This Month"
                color="gold"
              />
            </div>

            {/* ── A3: Urgent Alert Banner ────────────────────────────────── */}
            <AnimatePresence>
              {pendingCount > 0 && !alertDismissed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between gap-4 px-4 py-3 overflow-hidden"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.20)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle
                      size={14}
                      strokeWidth={1.8}
                      style={{ color: 'rgba(239,68,68,0.80)', flexShrink: 0 }}
                    />
                    <p
                      className="text-[0.52rem] tracking-[0.06em] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      You have{' '}
                      <span
                        style={{
                          color: 'rgba(239,68,68,0.88)',
                          fontWeight: 600,
                        }}
                      >
                        {pendingCount} unverified bank transfer
                        {pendingCount !== 1 ? 's' : ''}
                      </span>
                      .
                      {oldestPendingMins > 0 &&
                        ` Oldest is ${formatElapsed(oldestPendingMins)}.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setTab('pending')}
                      className="h-7 px-3 text-[0.48rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-100"
                      style={{
                        background: 'rgba(239,68,68,0.18)',
                        border: '1px solid rgba(239,68,68,0.30)',
                        color: 'rgba(239,68,68,0.88)',
                      }}
                    >
                      Review Now →
                    </button>
                    <button
                      onClick={() => setAlertDismissed(true)}
                      className="flex items-center justify-center w-6 h-6 transition-colors duration-100"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      <X size={11} strokeWidth={2} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── A4: Filter Tabs ───────────────────────────────────────── */}
            <div className="overflow-x-auto">
              <div
                className="flex gap-0 min-w-max"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                {TABS.map(({ key, label, count, color }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setTab(key);
                        setSelected(new Set());
                      }}
                      className="relative flex items-center gap-2 px-4 py-2.5 text-[0.52rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
                      style={{
                        color: active
                          ? 'rgba(255,255,255,0.85)'
                          : 'rgba(255,255,255,0.32)',
                      }}
                    >
                      {label}
                      {count !== undefined && (
                        <span
                          className="flex items-center justify-center h-4 min-w-4 px-1 text-[0.38rem] font-bold"
                          style={{
                            background:
                              active && color
                                ? `${color}20`
                                : 'rgba(255,255,255,0.06)',
                            color:
                              active && color
                                ? color
                                : 'rgba(255,255,255,0.32)',
                            border: `1px solid ${active && color ? `${color}30` : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {count}
                        </span>
                      )}
                      {active && (
                        <motion.div
                          layoutId="tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-[2px]"
                          style={{ background: color ?? GOLD }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── A5: Secondary Filter & Sort Bar ──────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
              <FilterDropdown
                label="Date Range"
                value={dateRange}
                options={DATE_RANGE_OPTIONS}
                onChange={setDateRange}
              />
              <FilterDropdown
                label="Time Elapsed"
                value={timeElapsed}
                options={TIME_ELAPSED_OPTIONS}
                onChange={(v) => setTimeElapsed(v as TimeElapsed)}
              />
              <FilterDropdown
                label="Sort"
                value={sort}
                options={SORT_OPTIONS}
                onChange={(v) => setSort(v as SortKey)}
              />

              {/* Amount range */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Min ₦"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="h-8 w-20 px-2 text-[0.52rem] tracking-[0.04em] outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.60)',
                  }}
                />
                <span
                  className="text-[0.48rem]"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                >
                  –
                </span>
                <input
                  type="number"
                  placeholder="Max ₦"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="h-8 w-20 px-2 text-[0.52rem] tracking-[0.04em] outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.60)',
                  }}
                />
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 h-8 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-100"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <X size={10} strokeWidth={2} /> Clear Filters
                  <span
                    className="ml-0.5 flex items-center justify-center w-4 h-4 text-[0.38rem] font-bold rounded-sm"
                    style={{ background: 'rgba(180,130,60,0.18)', color: GOLD }}
                  >
                    {activeFilterCount}
                  </span>
                </button>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                <Filter
                  size={10}
                  strokeWidth={1.8}
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                />
                <span
                  className="text-[0.46rem] tracking-[0.08em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {displayTransfers.length} result
                  {displayTransfers.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* ── A9: Bulk Actions Bar ──────────────────────────────────── */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 px-4 py-2.5 overflow-hidden"
                  style={{
                    background: 'rgba(180,130,60,0.06)',
                    border: '1px solid rgba(180,130,60,0.16)',
                  }}
                >
                  <span
                    className="text-[0.52rem] tracking-[0.08em] font-semibold"
                    style={{ color: GOLD }}
                  >
                    {selected.size} transfer{selected.size !== 1 ? 's' : ''}{' '}
                    selected
                  </span>

                  <div className="flex items-center gap-2 ml-auto">
                    <div className="relative" ref={bulkRef}>
                      <button
                        onClick={() => setBulkOpen((o) => !o)}
                        className="flex items-center gap-1.5 h-7 px-3 text-[0.48rem] tracking-[0.10em] uppercase transition-colors duration-150"
                        style={{
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.02)',
                          color: 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {bulkAction === 'verify-all'
                          ? 'Confirm All'
                          : bulkAction === 'reject-all'
                            ? 'Reject All'
                            : 'Bulk Action'}
                        <ChevronDown
                          size={10}
                          strokeWidth={2}
                          style={{
                            transform: bulkOpen ? 'rotate(180deg)' : '',
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
                            className="absolute bottom-[calc(100%+4px)] left-0 z-50 min-w-[180px] py-1"
                            style={{
                              background: '#1E1E1E',
                              border: '1px solid rgba(255,255,255,0.08)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
                            }}
                          >
                            {[
                              {
                                value: 'verify-all',
                                label: 'Confirm All Selected',
                              },
                              {
                                value: 'reject-all',
                                label: 'Reject All Selected',
                              },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setBulkAction(opt.value);
                                  setBulkOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-[7px] text-left text-[0.52rem] tracking-[0.08em] transition-colors duration-100"
                                style={{
                                  color:
                                    bulkAction === opt.value
                                      ? GOLD
                                      : 'rgba(255,255,255,0.52)',
                                  background:
                                    bulkAction === opt.value
                                      ? 'rgba(180,130,60,0.08)'
                                      : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  if (bulkAction !== opt.value) {
                                    e.currentTarget.style.background =
                                      'rgba(255,255,255,0.04)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (bulkAction !== opt.value) {
                                    e.currentTarget.style.background =
                                      'transparent';
                                  }
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={() => {
                        if (bulkAction) setBulkConfirm(true);
                      }}
                      disabled={!bulkAction}
                      className="h-7 px-3 text-[0.48rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-150"
                      style={{
                        background: bulkAction
                          ? 'rgba(180,130,60,0.14)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${bulkAction ? 'rgba(180,130,60,0.28)' : 'rgba(255,255,255,0.07)'}`,
                        color: bulkAction ? GOLD : 'rgba(255,255,255,0.20)',
                        cursor: bulkAction ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Apply
                    </button>

                    <button
                      onClick={() => setSelected(new Set())}
                      className="text-[0.46rem] tracking-[0.10em] uppercase transition-colors duration-100"
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                    >
                      Deselect All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Content Area ──────────────────────────────────────────── */}
            {transfersLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2
                  size={18}
                  strokeWidth={1.8}
                  className="animate-spin"
                  style={{ color: GOLD }}
                />
              </div>
            )}
            <AnimatePresence mode="wait">
              {/* A6: Pending Transfers */}
              {!transfersLoading && tab === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {displayTransfers.length === 0 ? (
                    <div
                      className="py-16 text-center"
                      style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <CheckCircle2
                        size={28}
                        strokeWidth={1.2}
                        className="mx-auto mb-3"
                        style={{ color: 'rgba(34,197,94,0.35)' }}
                      />
                      <p
                        className="text-[0.58rem] tracking-[0.10em]"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        No pending transfers
                      </p>
                      <p
                        className="mt-1 text-[0.48rem] tracking-[0.06em]"
                        style={{ color: 'rgba(255,255,255,0.14)' }}
                      >
                        All bank transfers have been reviewed.
                      </p>
                    </div>
                  ) : (
                    displayTransfers.map((t) => (
                      <PendingCard
                        key={t._id}
                        transfer={t}
                        selected={selected.has(t._id)}
                        onToggle={() => toggleOne(t._id)}
                        onVerify={handleVerify}
                        onReject={handleReject}
                      />
                    ))
                  )}
                </motion.div>
              )}

              {/* A7: Verified Transfers */}
              {!transfersLoading && tab === 'verified' && (
                <motion.div
                  key="verified"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {displayTransfers.length === 0 ? (
                    <div
                      className="py-16 text-center"
                      style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <p
                        className="text-[0.54rem] tracking-[0.10em]"
                        style={{ color: 'rgba(255,255,255,0.18)' }}
                      >
                        No verified transfers
                      </p>
                    </div>
                  ) : (
                    displayTransfers.map((t) => (
                      <VerifiedCard key={t._id} transfer={t} />
                    ))
                  )}
                </motion.div>
              )}

              {/* A8: Rejected Transfers */}
              {!transfersLoading && tab === 'rejected' && (
                <motion.div
                  key="rejected"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {displayTransfers.length === 0 ? (
                    <div
                      className="py-16 text-center"
                      style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <p
                        className="text-[0.54rem] tracking-[0.10em]"
                        style={{ color: 'rgba(255,255,255,0.18)' }}
                      >
                        No rejected transfers
                      </p>
                    </div>
                  ) : (
                    displayTransfers.map((t) => (
                      <RejectedCard key={t._id} transfer={t} />
                    ))
                  )}
                </motion.div>
              )}

              {/* A10: All Transfers Table */}
              {!transfersLoading && tab === 'all' && (
                <motion.div
                  key="all"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: '#181818',
                  }}
                >
                  <AllTransfersTable
                    transfers={displayTransfers}
                    selected={selected}
                    onToggleAll={toggleAll}
                    onToggleOne={toggleOne}
                    allSelected={allSelected}
                    onVerify={handleVerify}
                    onReject={handleReject}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
