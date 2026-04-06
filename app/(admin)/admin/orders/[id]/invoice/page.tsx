'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, Mail, Loader2, Check } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const BRAND = {
  name:    'AuraFume',
  tagline: 'Luxury Fragrances',
  address: '14 Admiralty Way, Lekki Phase 1',
  city:    'Lagos, Nigeria',
  email:   'hello@aurafume.com',
  phone:   '+234 800 000 0000',
  website: 'www.aurafume.com',
  rc:      'RC-1234567',
} as const;

const GOLD        = '#c5a76d';
const GOLD_LIGHT  = '#e8c87a';
const INK         = '#0d0d0d';
const INK_MID     = '#1a1a1a';
const INK_SOFT    = '#2a2a2a';
const RULE        = '#2e2e2e';
const TEXT_BASE   = '#e8e8e8';
const TEXT_MUTED  = '#777';
const TEXT_DIM    = '#555';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus   = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type PaymentMethod = 'bank-transfer' | 'paystack';

interface OrderItem {
  name:        string;
  scentFamily: string;
  size:        string;
  pricePerUnit: number;
  qty:         number;
}

interface OrderDetail {
  _id:         string;
  orderNumber: string;
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
  items: OrderItem[];
  gift: {
    isGift:   boolean;
    wrapping: boolean;
    hidePrice: boolean;
  };
  pricing: {
    subtotal:     number;
    discount:     number;
    couponCode?:  string;
    couponLabel?: string;
    deliveryFee:  number;
    giftWrapFee:  number;
    total:        number;
  };
  delivery: {
    label:    string;
    duration: string;
  };
  payment: {
    method:       PaymentMethod;
    status:       PaymentStatus;
    paystackRef?: string;
    paidAt?:      string;
    amountPaid?:  number;
  };
  status:    OrderStatus;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function invoiceNumber(orderNumber: string) {
  return orderNumber.replace('ORD-', 'INV-');
}

// ── Action Bar ─────────────────────────────────────────────────────────────────
// Sticky top bar — excluded from print

function ActionBar({ orderId, order }: { orderId: string; order: OrderDetail }) {
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSend() {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div
      className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-5 h-14"
      style={{
        background:   INK_MID,
        borderBottom: `1px solid ${RULE}`,
        boxShadow:    '0 2px 16px rgba(0,0,0,0.40)',
      }}
    >
      {/* Left — back link */}
      <Link
        href={`/admin/orders/${orderId}`}
        className="flex items-center gap-1.5 text-[0.50rem] tracking-[0.14em] uppercase transition-colors duration-100 shrink-0"
        style={{ color: TEXT_MUTED }}
        onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_BASE)}
        onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_MUTED)}
      >
        <ArrowLeft size={12} strokeWidth={2} />
        Back to Order
      </Link>

      {/* Center — invoice label */}
      <div className="hidden sm:flex flex-col items-center">
        <p className="text-[0.46rem] tracking-[0.22em] uppercase font-semibold" style={{ color: TEXT_MUTED }}>
          Invoice
        </p>
        <p className="text-[0.54rem] tracking-[0.08em] font-semibold" style={{ color: GOLD }}>
          {invoiceNumber(order.orderNumber)}
        </p>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 shrink-0">
        <BarBtn
          icon={<Printer size={12} strokeWidth={1.8} />}
          label="Print"
          onClick={() => window.print()}
        />
        <BarBtn
          icon={<Download size={12} strokeWidth={1.8} />}
          label="Download PDF"
          onClick={() => window.print()}
        />
        <BarBtn
          icon={
            sending ? <Loader2 size={12} strokeWidth={1.8} className="animate-spin" />
            : sent   ? <Check   size={12} strokeWidth={2.5} style={{ color: 'rgba(74,222,128,0.85)' }} />
            :           <Mail    size={12} strokeWidth={1.8} />
          }
          label={sent ? 'Sent!' : 'Send to Customer'}
          onClick={handleSend}
          highlight={sent}
        />
      </div>
    </div>
  );
}

function BarBtn({
  icon, label, onClick, highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 h-8 px-3 text-[0.46rem] tracking-[0.12em] uppercase transition-colors duration-100"
      style={{
        background:  highlight ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
        color:       highlight ? 'rgba(74,222,128,0.85)' : TEXT_MUTED,
        border:      `1px solid ${highlight ? 'rgba(74,222,128,0.22)' : RULE}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background   = `rgba(197,167,109,0.10)`;
        e.currentTarget.style.color        = GOLD;
        e.currentTarget.style.borderColor  = `rgba(197,167,109,0.28)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background   = highlight ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)';
        e.currentTarget.style.color        = highlight ? 'rgba(74,222,128,0.85)' : TEXT_MUTED;
        e.currentTarget.style.borderColor  = highlight ? 'rgba(74,222,128,0.22)' : RULE;
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ── Invoice Document ───────────────────────────────────────────────────────────

function InvoiceDocument({ order }: { order: OrderDetail }) {
  const invNum     = invoiceNumber(order.orderNumber);
  const invDate    = formatDate(order.createdAt);
  const customerName = `${order.contact.firstName} ${order.contact.lastName}`;
  const addr       = order.shippingAddress;
  const p          = order.pricing;
  const isPaid     = order.payment.status === 'paid';
  const ref        = order.payment.method === 'paystack'
    ? (order.payment.paystackRef ?? '—')
    : order.orderNumber;

  const rows: { label: string; value: number; sub?: string; green?: boolean; show: boolean }[] = [
    { label: 'Subtotal',  value: p.subtotal,    show: true },
    { label: p.couponCode ? `Discount (${p.couponCode})` : 'Discount', value: -p.discount, green: true, show: p.discount > 0 },
    { label: 'Delivery',  value: p.deliveryFee, show: true },
    { label: 'Gift Wrap', value: p.giftWrapFee, show: p.giftWrapFee > 0 },
  ];

  return (
    <div
      id="invoice-doc"
      style={{
        background:  INK,
        color:       TEXT_BASE,
        fontFamily:  `'Helvetica Neue', Helvetica, Arial, sans-serif`,
        minHeight:   '297mm',
        maxWidth:    '210mm',
        margin:      '0 auto',
        padding:     '48px 52px 64px',
        boxSizing:   'border-box',
      }}
    >
      {/* ── Header band ──────────────────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          paddingBottom:  '32px',
          borderBottom:   `1px solid ${RULE}`,
          marginBottom:   '36px',
        }}
      >
        {/* Brand mark */}
        <div>
          <p style={{ margin: 0, fontSize: '10px', letterSpacing: '0.38em', textTransform: 'uppercase', fontWeight: 700, color: GOLD }}>
            {BRAND.name}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: TEXT_DIM }}>
            {BRAND.tagline}
          </p>
        </div>

        {/* Invoice meta */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_BASE }}>
            Invoice
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '11px', letterSpacing: '0.10em', color: GOLD, fontWeight: 600 }}>
            {invNum}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '10px', letterSpacing: '0.06em', color: TEXT_MUTED }}>
            Date: {invDate}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '10px', letterSpacing: '0.06em', color: TEXT_DIM }}>
            Order: {order.orderNumber}
          </p>
        </div>
      </div>

      {/* ── Bill To / Bill From ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginBottom: '40px',
        }}
      >
        {/* Bill To */}
        <div>
          <p style={{ margin: '0 0 12px', fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 600, color: TEXT_DIM }}>
            Bill To
          </p>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: TEXT_BASE, letterSpacing: '0.03em' }}>
            {customerName}
          </p>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: TEXT_MUTED, letterSpacing: '0.02em', lineHeight: 1.6 }}>
            {addr.street}{addr.apt ? `, ${addr.apt}` : ''}
          </p>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: TEXT_MUTED, letterSpacing: '0.02em', lineHeight: 1.6 }}>
            {addr.city}, {addr.state}{addr.postalCode ? ` ${addr.postalCode}` : ''}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: '11px', color: TEXT_MUTED, letterSpacing: '0.02em', lineHeight: 1.6 }}>
            {addr.country}
          </p>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: TEXT_DIM, letterSpacing: '0.02em' }}>
            {order.contact.email}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: TEXT_DIM, letterSpacing: '0.02em' }}>
            {order.contact.phone}
          </p>
        </div>

        {/* Bill From */}
        <div>
          <p style={{ margin: '0 0 12px', fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 600, color: TEXT_DIM }}>
            Bill From
          </p>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: TEXT_BASE, letterSpacing: '0.03em' }}>
            {BRAND.name}
          </p>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: TEXT_MUTED, letterSpacing: '0.02em', lineHeight: 1.6 }}>
            {BRAND.address}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: '11px', color: TEXT_MUTED, letterSpacing: '0.02em', lineHeight: 1.6 }}>
            {BRAND.city}
          </p>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: TEXT_DIM, letterSpacing: '0.02em' }}>
            {BRAND.email}
          </p>
          <p style={{ margin: '0 0 2px', fontSize: '11px', color: TEXT_DIM, letterSpacing: '0.02em' }}>
            {BRAND.phone}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '10px', color: TEXT_DIM, letterSpacing: '0.06em' }}>
            RC: {BRAND.rc}
          </p>
        </div>
      </div>

      {/* ── Items Table ───────────────────────────────────────────────────── */}
      <table
        style={{
          width:           '100%',
          borderCollapse:  'collapse',
          marginBottom:    '0',
          fontSize:        '11px',
        }}
      >
        <thead>
          <tr style={{ background: INK_SOFT }}>
            {[
              { label: 'Item',       align: 'left',  flex: '3' },
              { label: 'Size',       align: 'left',  flex: '1' },
              { label: 'Qty',        align: 'center', flex: '0.6' },
              { label: 'Unit Price', align: 'right', flex: '1' },
              { label: 'Total',      align: 'right', flex: '1' },
            ].map((col) => (
              <th
                key={col.label}
                style={{
                  padding:       '10px 14px',
                  textAlign:     col.align as 'left' | 'right' | 'center',
                  fontSize:      '9px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontWeight:    600,
                  color:         TEXT_DIM,
                  borderBottom:  `1px solid ${RULE}`,
                  borderTop:     `1px solid ${RULE}`,
                  whiteSpace:    'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr
              key={i}
              style={{ borderBottom: `1px solid ${RULE}` }}
            >
              <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: TEXT_BASE, letterSpacing: '0.02em' }}>
                  {item.name}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '10px', color: GOLD, letterSpacing: '0.06em' }}>
                  {item.scentFamily}
                </p>
              </td>
              <td style={{ padding: '12px 14px', verticalAlign: 'top', color: TEXT_MUTED, fontSize: '11px', letterSpacing: '0.04em' }}>
                {item.size}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'top', color: TEXT_MUTED, fontSize: '11px' }}>
                {item.qty}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'top', color: TEXT_MUTED, fontSize: '11px', letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {formatNaira(item.pricePerUnit)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', verticalAlign: 'top', color: TEXT_BASE, fontSize: '12px', fontWeight: 500, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {formatNaira(item.pricePerUnit * item.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Pricing summary ───────────────────────────────────────────────── */}
      <div
        style={{
          display:       'flex',
          justifyContent: 'flex-end',
          marginBottom:  '40px',
        }}
      >
        <div style={{ minWidth: '260px' }}>
          {rows.filter((r) => r.show).map((row) => (
            <div
              key={row.label}
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '6px 14px',
                borderBottom:   `1px solid ${RULE}`,
              }}
            >
              <span style={{ fontSize: '10px', letterSpacing: '0.06em', color: TEXT_DIM }}>
                {row.label}
              </span>
              <span
                style={{
                  fontSize:           '11px',
                  letterSpacing:      '0.02em',
                  color:              row.green ? 'rgba(74,222,128,0.75)' : TEXT_MUTED,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.value < 0 ? `−${formatNaira(Math.abs(row.value))}` : formatNaira(row.value)}
              </span>
            </div>
          ))}

          {/* Grand total */}
          <div
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              padding:        '12px 14px',
              background:     INK_SOFT,
              borderBottom:   `2px solid ${GOLD}`,
            }}
          >
            <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: TEXT_BASE }}>
              Grand Total
            </span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT_BASE, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {formatNaira(p.total)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Payment Information ───────────────────────────────────────────── */}
      <div
        style={{
          display:       'flex',
          gap:           '40px',
          paddingTop:    '28px',
          paddingBottom: '28px',
          borderTop:     `1px solid ${RULE}`,
          borderBottom:  `1px solid ${RULE}`,
          marginBottom:  '40px',
          alignItems:    'flex-start',
        }}
      >
        {/* Payment details */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 14px', fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 600, color: TEXT_DIM }}>
            Payment Information
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              {[
                {
                  label: 'Method',
                  value: order.payment.method === 'paystack' ? 'Paystack' : 'Bank Transfer',
                },
                {
                  label: 'Reference',
                  value: ref,
                  mono: true,
                },
                {
                  label: 'Payment Date',
                  value: order.payment.paidAt ? formatDateTime(order.payment.paidAt) : '—',
                },
                {
                  label: 'Gateway',
                  value: order.payment.method === 'paystack' ? 'Paystack' : 'Manual Verification',
                },
              ].map((row) => (
                <tr key={row.label}>
                  <td style={{ padding: '4px 0', color: TEXT_DIM, letterSpacing: '0.06em', verticalAlign: 'top', width: '130px' }}>
                    {row.label}
                  </td>
                  <td
                    style={{
                      padding:        '4px 0',
                      color:          TEXT_MUTED,
                      letterSpacing:  row.mono ? '0.06em' : '0.02em',
                      fontFamily:     row.mono ? 'monospace' : 'inherit',
                      verticalAlign:  'top',
                    }}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment status stamp */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '16px 28px',
            border:         `2px solid ${isPaid ? 'rgba(74,222,128,0.40)' : 'rgba(251,191,36,0.40)'}`,
            transform:      'rotate(-4deg)',
            userSelect:     'none',
          }}
        >
          <p
            style={{
              margin:        0,
              fontSize:      '18px',
              fontWeight:    900,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color:         isPaid ? 'rgba(74,222,128,0.70)' : 'rgba(251,191,36,0.70)',
            }}
          >
            {order.payment.status.toUpperCase()}
          </p>
          {order.payment.paidAt && isPaid && (
            <p style={{ margin: '4px 0 0', fontSize: '9px', letterSpacing: '0.08em', color: TEXT_DIM, textAlign: 'center' }}>
              {formatDate(order.payment.paidAt)}
            </p>
          )}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '28px' }}>
        {/* Thank you */}
        <p
          style={{
            margin:        '0 0 10px',
            fontSize:      '13px',
            fontWeight:    300,
            letterSpacing: '0.12em',
            textAlign:     'center',
            color:         TEXT_BASE,
          }}
        >
          Thank you for your purchase.
        </p>

        {/* Divider */}
        <div style={{ width: '40px', height: '1px', background: GOLD, margin: '12px auto 16px' }} />

        {/* Return policy */}
        <p
          style={{
            margin:        '0 0 8px',
            fontSize:      '10px',
            letterSpacing: '0.04em',
            textAlign:     'center',
            color:         TEXT_DIM,
            lineHeight:    1.7,
            maxWidth:      '480px',
            marginLeft:    'auto',
            marginRight:   'auto',
          }}
        >
          Items may be returned within 7 days of delivery in original, unopened condition.
          To initiate a return, contact us at{' '}
          <span style={{ color: TEXT_MUTED }}>{BRAND.email}</span>.
        </p>

        {/* Contact row */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'center',
            gap:            '32px',
            marginTop:      '20px',
          }}
        >
          {[
            { label: 'Email',   value: BRAND.email   },
            { label: 'Phone',   value: BRAND.phone   },
            { label: 'Website', value: BRAND.website },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: TEXT_DIM }}>
                {item.label}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '10px', letterSpacing: '0.04em', color: TEXT_MUTED }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom brand line */}
        <p
          style={{
            margin:        '28px 0 0',
            fontSize:      '9px',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            textAlign:     'center',
            color:         TEXT_DIM,
          }}
        >
          {BRAND.name} &middot; {BRAND.rc} &middot; Lagos, Nigeria
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router  = useRouter();

  const [order,   setOrder]   = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Auth + fetch order
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Verify admin session
      const auth = await fetch('/api/admin/me');
      if (auth.status === 401 || auth.status === 403) {
        router.push('/admin/login');
        return;
      }

      // Fetch order
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) { setError('Order not found.'); setLoading(false); return; }
      const json = (await res.json()) as { data?: OrderDetail };
      if (!cancelled && json.data) setOrder(json.data);
      if (!cancelled) setLoading(false);
    }
    load().catch(() => { if (!cancelled) { setError('Failed to load order.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: INK }}>
        <Loader2 size={20} strokeWidth={1.8} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: INK }}>
        <p className="text-[0.58rem] tracking-[0.08em]" style={{ color: TEXT_MUTED }}>{error || 'Order not found.'}</p>
        <Link href="/admin/orders" className="text-[0.50rem] tracking-[0.12em] uppercase underline" style={{ color: GOLD }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          #invoice-doc {
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 24px 32px !important;
            min-height: unset !important;
            color: #111 !important;
            background: #fff !important;
          }
        }
        @page {
          margin: 12mm 10mm;
          size: A4;
        }
      `}</style>

      {/* Action bar (hidden when printing) */}
      <ActionBar orderId={id} order={order} />

      {/* Page canvas */}
      <div
        className="min-h-screen pt-14"
        style={{ background: '#0a0a0a' }}
      >
        <div
          className="mx-auto my-8"
          style={{
            maxWidth:  '860px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.60)',
          }}
        >
          <InvoiceDocument order={order} />
        </div>

        {/* Bottom padding so content clears the viewport */}
        <div className="h-16 no-print" />
      </div>
    </>
  );
}
