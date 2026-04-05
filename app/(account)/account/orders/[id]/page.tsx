'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Check,
  Clock,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Building2,
  Download,
  ShoppingBag,
  X,
  RotateCcw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';
import { useCart } from '@/components/shop/cart-context';
// import { MOCK_ORDERS } from '../page';
import type { Order, OrderStatus } from '@/components/account/orders-list';

const ADDR_DEFAULT: import('@/components/account/orders-list').OrderAddress = {
  name: 'Promise Udo',
  phone: '+234 816 476 3362',
  street: '14 Admiralty Way',
  apt: 'Flat 3B',
  city: 'Lekki',
  state: 'Lagos',
  country: 'Nigeria',
};

// MOCK ORDERS

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-00183',
    date: new Date('2024-11-20'),
    status: 'delivered',
    subtotal: 299000,
    deliveryFee: 3000,
    discount: 0,
    total: 302000,
    paymentMethod: 'paystack',
    deliveryAddress: ADDR_DEFAULT,
    items: [
      {
        productId: 'stronger-for-you-intense',
        name: 'Stronger For You Intense',
        image: '/images/image3.jpeg',
        size: '100ml',
        qty: 1,
        price: 265000,
      },
      {
        productId: 'oud-imperiale',
        name: 'Oud Impériale',
        image: '/images/image8.jpeg',
        size: '50ml',
        qty: 1,
        price: 34000,
      },
    ],
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-00201',
    date: new Date('2024-12-03'),
    status: 'shipped',
    subtotal: 149500,
    deliveryFee: 3000,
    discount: 14950,
    total: 137550,
    trackingNumber: 'GIG-20241203-XY7',
    couponCode: 'AURA10',
    paymentMethod: 'paystack',
    deliveryAddress: ADDR_DEFAULT,
    items: [
      {
        productId: 'loving-you-frozen',
        name: 'Loving You Frozen',
        image: '/images/image5.jpeg',
        size: '50ml',
        qty: 1,
        price: 149500,
      },
    ],
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-00012',
    date: new Date('2025-01-08'),
    status: 'processing',
    subtotal: 268000,
    deliveryFee: 5500,
    discount: 0,
    total: 273500,
    paymentMethod: 'bank-transfer',
    deliveryAddress: ADDR_DEFAULT,
    items: [
      {
        productId: 'aurore-blanche',
        name: 'Aurore Blanche',
        image: '/images/image7.jpeg',
        size: '50ml',
        qty: 1,
        price: 134000,
      },
      {
        productId: 'rose-oud',
        name: 'Rose Oud',
        image: '/images/image4.jpeg',
        size: '30ml',
        qty: 2,
        price: 67000,
      },
    ],
  },
  {
    id: '4',
    orderNumber: 'ORD-2025-00031',
    date: new Date('2025-01-22'),
    status: 'pending',
    subtotal: 89500,
    deliveryFee: 3000,
    discount: 0,
    total: 92500,
    paymentMethod: 'paystack',
    deliveryAddress: ADDR_DEFAULT,
    items: [
      {
        productId: 'loving-you-frozen-30ml',
        name: 'Loving You Frozen',
        image: '/images/image5.jpeg',
        size: '30ml',
        qty: 1,
        price: 89500,
      },
    ],
  },
  {
    id: '5',
    orderNumber: 'ORD-2024-00157',
    date: new Date('2024-10-14'),
    status: 'cancelled',
    subtotal: 175000,
    deliveryFee: 5500,
    discount: 0,
    total: 180500,
    paymentMethod: 'paystack',
    deliveryAddress: ADDR_DEFAULT,
    items: [
      {
        productId: 'stronger-for-you-absolute',
        name: 'Stronger For You Absolute',
        image: '/images/image11.jpeg',
        size: '50ml',
        qty: 1,
        price: 175000,
      },
    ],
  },
];

// ── Palette ─────────────────────────────────────────────────────────────────────
const GOLD = 'oklch(0.72 0.10 74)';
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Status config ───────────────────────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending Payment',
    className: 'bg-amber-500/10  text-amber-600  border-amber-500/20',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-500/10   text-blue-600   border-blue-500/20',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-500/10  text-green-600  border-green-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10    text-red-600    border-red-500/20',
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STATUS_META[status];
  return (
    <span
      className={`inline-flex text-[0.48rem] tracking-[0.14em] uppercase font-semibold px-2.5 py-1 border ${className}`}
    >
      {label}
    </span>
  );
}

// ── Status timeline ─────────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Payment Confirmed', icon: Check },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
] as const;

const STATUS_STEP: Record<OrderStatus, number> = {
  pending: 1,
  processing: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 0,
};

function StatusTimeline({ status }: { status: OrderStatus }) {
  const completedCount = STATUS_STEP[status];
  const isCancelled = status === 'cancelled';

  return (
    <div className="relative">
      {/* Vertical spine */}
      <div className="absolute left-[18px] top-5 bottom-5 w-px bg-border/60" />

      <div className="space-y-0">
        {TIMELINE_STEPS.map(({ key, label, icon: Icon }, i) => {
          const stepNum = i + 1;
          const completed = !isCancelled && stepNum <= completedCount;
          const current = !isCancelled && stepNum === completedCount;

          return (
            <div key={key} className="flex items-start gap-4 py-3 relative">
              {/* Circle */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-300"
                style={{
                  background: completed ? GOLD_GRADIENT : 'transparent',
                  borderColor: completed
                    ? 'transparent'
                    : isCancelled
                      ? 'oklch(0.55 0.18 25 / 0.3)'
                      : 'oklch(0.35 0 0)',
                  boxShadow: current
                    ? `0 0 0 3px oklch(0.72 0.10 74 / 0.25)`
                    : 'none',
                }}
              >
                <Icon
                  size={14}
                  strokeWidth={completed ? 2.2 : 1.6}
                  style={{
                    color: completed
                      ? 'oklch(0.12 0 0)'
                      : isCancelled
                        ? 'oklch(0.55 0.18 25 / 0.5)'
                        : 'oklch(0.45 0 0)',
                  }}
                />
              </motion.div>

              {/* Label */}
              <div className="pt-1.5">
                <p
                  className={`text-[0.62rem] tracking-[0.1em] uppercase font-medium transition-colors ${
                    completed ? 'text-foreground' : 'text-muted-foreground/40'
                  }`}
                >
                  {label}
                </p>
                {current && !isCancelled && (
                  <p
                    className="text-[0.52rem] tracking-[0.06em] mt-0.5"
                    style={{ color: GOLD }}
                  >
                    Current status
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Cancelled override */}
        {isCancelled && (
          <div className="flex items-start gap-4 py-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 border-red-400/40 bg-red-500/10">
              <X size={14} strokeWidth={2.2} className="text-red-500" />
            </div>
            <div className="pt-1.5">
              <p className="text-[0.62rem] tracking-[0.1em] uppercase font-medium text-red-500">
                Order Cancelled
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      <h2 className="text-[0.52rem] tracking-[0.28em] uppercase text-muted-foreground/50 font-medium px-1">
        {title}
      </h2>
      <div className="border border-border/60 bg-background/40">{children}</div>
    </motion.div>
  );
}

// ── Invoice generator ───────────────────────────────────────────────────────────

function generateInvoiceHTML(order: Order): string {
  const date = order.date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const rows = order.items
    .map(
      (i) =>
        `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #222;">${i.name} (${i.size})</td>
      <td style="padding:8px 0;border-bottom:1px solid #222;text-align:center;">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right;">₦${(i.price * i.qty).toLocaleString()}</td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Invoice – #${order.orderNumber}</title>
<style>
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
<p class="muted">Order #${order.orderNumber} &nbsp;·&nbsp; ${date}</p>
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
<div class="row"><span class="muted">Subtotal</span><span>₦${order.subtotal.toLocaleString()}</span></div>
<div class="row"><span class="muted">Delivery</span><span>₦${order.deliveryFee.toLocaleString()}</span></div>
${order.discount > 0 ? `<div class="row"><span class="muted">Discount (${order.couponCode})</span><span>−₦${order.discount.toLocaleString()}</span></div>` : ''}
<div class="row total"><span>Total Paid</span><span>₦${order.total.toLocaleString()}</span></div>
<br><br><p class="muted">AuraFume · Lagos, Nigeria · hello@aurafume.com</p>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;
}

function handleDownloadInvoice(order: Order) {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Confirm dialog ──────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="w-full max-w-sm border border-border bg-background p-6 space-y-5"
      >
        <div className="space-y-1.5">
          <h3 className="text-[0.64rem] tracking-[0.2em] uppercase font-medium text-foreground">
            {title}
          </h3>
          <p className="text-[0.6rem] tracking-[0.04em] leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 border border-border text-[0.58rem] tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-11 flex items-center justify-center gap-2 text-[0.58rem] tracking-[0.16em] uppercase font-semibold transition-opacity disabled:opacity-60 ${confirmClass}`}
          >
            {loading && (
              <Loader2 size={12} strokeWidth={2} className="animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Toast ───────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 inset-x-4 z-50 flex justify-center pointer-events-none"
    >
      <div className="px-5 py-3 border border-border bg-background/95 backdrop-blur-sm shadow-lg max-w-xs">
        <p className="text-[0.6rem] tracking-[0.08em] text-foreground text-center">
          {message}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const order = MOCK_ORDERS.find((o) => o.id === id);

  const [dialog, setDialog] = useState<'cancel' | 'return' | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function handleReorder() {
    if (!order) return;
    order.items.forEach((item) => {
      addToCart({
        productId: item.productId,
        slug: item.productId,
        name: item.name,
        scentFamily: '',
        image: item.image,
        size: item.size,
        pricePerUnit: item.price,
        qty: item.qty,
      });
    });
    showToast(
      `${order.items.length} item${order.items.length > 1 ? 's' : ''} added to your cart`,
    );
  }

  async function handleCancelConfirm() {
    setDialogLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // swap for real API
    setDialogLoading(false);
    setDialog(null);
    showToast('Order cancellation request submitted');
  }

  async function handleReturnConfirm() {
    setDialogLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // swap for real API
    setDialogLoading(false);
    setDialog(null);
    showToast(
      "Return & refund request submitted. We'll be in touch within 24 hours.",
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-32 text-center px-8">
        <Package
          size={32}
          strokeWidth={1.3}
          className="text-muted-foreground/30"
        />
        <div className="space-y-1.5">
          <p className="text-[0.62rem] tracking-[0.22em] uppercase text-foreground">
            Order not found
          </p>
          <p className="text-[0.58rem] tracking-[0.06em] text-muted-foreground/60">
            This order doesn't exist or may have been removed.
          </p>
        </div>
        <Link
          href="/account/orders"
          className="text-[0.58rem] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  const formattedDate = order.date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const canCancel = order.status === 'pending' || order.status === 'processing';
  const canReturn = order.status === 'delivered';

  return (
    <>
      {/* ── Sticky nav ── */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="h-full max-w-xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center">
          <button
            onClick={() => router.back()}
            aria-label="Back to orders"
            className="flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>
          <div className="flex items-center justify-center">
            <h1 className="font-heading text-[0.85rem] tracking-[0.22em] uppercase text-foreground leading-none">
              Order Details
            </h1>
          </div>
          <div />
        </div>
      </header>

      {/* ── Content ── */}
      <div className="pt-14 max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Order header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="font-heading text-lg tracking-[0.08em] text-foreground">
              #{order.orderNumber}
            </p>
            <p className="text-[0.56rem] tracking-[0.1em] text-muted-foreground/60">
              Placed on {formattedDate}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </motion.div>

        {/* ── Timeline ── */}
        <Section title="Order Progress">
          <div className="px-4 py-5">
            <StatusTimeline status={order.status} />
          </div>
        </Section>

        {/* ── Items ── */}
        <Section title="Items Ordered">
          <div className="divide-y divide-border/40">
            {order.items.map((item, i) => (
              <div
                key={item.productId + i}
                className="flex items-center gap-4 px-4 py-4"
              >
                <div className="relative w-14 h-14 shrink-0 bg-muted/30 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.66rem] tracking-[0.06em] font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-[0.54rem] tracking-[0.08em] text-muted-foreground/60 mt-0.5">
                    {item.size} · ×{item.qty}
                  </p>
                </div>
                <p className="text-[0.72rem] font-semibold tabular-nums text-foreground shrink-0">
                  ₦{(item.price * item.qty).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Delivery address ── */}
        {order.deliveryAddress && (
          <Section title="Delivery Address">
            <div className="px-4 py-4 flex items-start gap-3">
              <MapPin
                size={15}
                strokeWidth={1.7}
                className="mt-0.5 shrink-0"
                style={{ color: GOLD }}
              />
              <div className="space-y-0.5">
                <p className="text-[0.65rem] tracking-[0.06em] font-medium text-foreground">
                  {order.deliveryAddress.name}
                </p>
                <p className="text-[0.6rem] tracking-[0.04em] leading-relaxed text-muted-foreground/70">
                  {order.deliveryAddress.street}
                  {order.deliveryAddress.apt &&
                    `, ${order.deliveryAddress.apt}`}
                  {', '}
                  {order.deliveryAddress.city}
                  {', '}
                  {order.deliveryAddress.state}
                  {', '}
                  {order.deliveryAddress.country}
                </p>
                <p className="text-[0.56rem] tracking-[0.06em] text-muted-foreground/50 pt-0.5">
                  {order.deliveryAddress.phone}
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* ── Payment method ── */}
        {order.paymentMethod && (
          <Section title="Payment Method">
            <div className="px-4 py-4 flex items-center gap-3">
              {order.paymentMethod === 'paystack' ? (
                <CreditCard
                  size={15}
                  strokeWidth={1.7}
                  style={{ color: GOLD }}
                />
              ) : (
                <Building2
                  size={15}
                  strokeWidth={1.7}
                  style={{ color: GOLD }}
                />
              )}
              <p className="text-[0.65rem] tracking-[0.06em] text-foreground">
                {order.paymentMethod === 'paystack'
                  ? 'Paystack (Card / Bank / USSD)'
                  : 'Bank Transfer'}
              </p>
            </div>
          </Section>
        )}

        {/* ── Price breakdown ── */}
        <Section title="Price Breakdown">
          <div className="px-4 py-4 space-y-3">
            {[
              {
                label: 'Subtotal',
                value: `₦${order.subtotal.toLocaleString()}`,
                muted: false,
              },
              {
                label: 'Delivery',
                value: `₦${order.deliveryFee.toLocaleString()}`,
                muted: false,
              },
              ...(order.discount > 0
                ? [
                    {
                      label: `Discount${order.couponCode ? ` (${order.couponCode})` : ''}`,
                      value: `−₦${order.discount.toLocaleString()}`,
                      muted: false,
                      accent: true,
                    },
                  ]
                : []),
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[0.58rem] tracking-[0.1em] text-muted-foreground/70">
                  {label}
                </span>
                <span
                  className={`text-[0.68rem] tabular-nums ${accent ? 'text-green-600 font-medium' : 'text-foreground'}`}
                >
                  {value}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <span className="text-[0.58rem] tracking-[0.16em] uppercase font-semibold text-foreground">
                Total Paid
              </span>
              <span className="text-[0.9rem] font-bold tabular-nums text-foreground">
                ₦{order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </Section>

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-3 pt-1"
        >
          {/* Download Invoice */}
          <button
            onClick={() => handleDownloadInvoice(order)}
            className="w-full h-12 flex items-center justify-center gap-2.5 border border-border/70 text-[0.58rem] tracking-[0.2em] uppercase font-medium text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors duration-200"
          >
            <Download size={14} strokeWidth={1.8} />
            Download Invoice
          </button>

          {/* Reorder */}
          <button
            onClick={handleReorder}
            className="w-full h-12 flex items-center justify-center gap-2.5 text-[0.6rem] tracking-[0.22em] uppercase font-semibold transition-opacity duration-200"
            style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
          >
            <ShoppingBag size={14} strokeWidth={2} />
            Reorder
          </button>

          {/* Cancel (pending / processing only) */}
          {canCancel && (
            <button
              onClick={() => setDialog('cancel')}
              className="w-full h-12 flex items-center justify-center gap-2.5 border border-red-400/30 bg-red-500/6 text-[0.58rem] tracking-[0.2em] uppercase font-medium text-red-500 hover:bg-red-500/10 transition-colors duration-200"
            >
              <X size={14} strokeWidth={2} />
              Cancel Order
            </button>
          )}

          {/* Return / Refund (delivered only) */}
          {canReturn && (
            <button
              onClick={() => setDialog('return')}
              className="w-full h-12 flex items-center justify-center gap-2.5 border border-border/60 text-[0.58rem] tracking-[0.2em] uppercase font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-200"
            >
              <RotateCcw size={14} strokeWidth={1.8} />
              Request Return / Refund
            </button>
          )}
        </motion.div>
      </div>

      {/* ── Dialogs ── */}
      <AnimatePresence>
        {dialog === 'cancel' && (
          <ConfirmDialog
            title="Cancel this order?"
            body="This will submit a cancellation request. Refunds for paid orders are processed within 3–5 business days."
            confirmLabel="Yes, Cancel"
            confirmClass="bg-red-500 text-white hover:bg-red-600"
            loading={dialogLoading}
            onConfirm={handleCancelConfirm}
            onCancel={() => setDialog(null)}
          />
        )}
        {dialog === 'return' && (
          <ConfirmDialog
            title="Request a return or refund?"
            body="We accept returns within 7 days of delivery. Our team will review your request and contact you within 24 hours."
            confirmLabel="Submit Request"
            confirmClass="bg-foreground text-background hover:opacity-90"
            loading={dialogLoading}
            onConfirm={handleReturnConfirm}
            onCancel={() => setDialog(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} />}
      </AnimatePresence>
    </>
  );
}
