'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Package, MapPin, Search } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  name:      string;
  image:     string;
  size:      string;
  qty:       number;
  price:     number;
}

export interface OrderAddress {
  street:  string;
  apt?:    string;
  city:    string;
  state:   string;
  country: string;
  name:    string;
  phone:   string;
}

export interface Order {
  id:              string;
  orderNumber:     string;
  date:            Date;
  items:           OrderItem[];
  subtotal:        number;
  deliveryFee:     number;
  discount:        number;
  total:           number;
  status:          OrderStatus;
  trackingNumber?: string;
  deliveryAddress?: OrderAddress;
  paymentMethod?:  'paystack' | 'bank-transfer';
  couponCode?:     string;
}

// ── Status badge ────────────────────────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending:    { label: 'Pending Payment', className: 'bg-amber-500/12  text-amber-600  border-amber-500/20'  },
  processing: { label: 'Processing',      className: 'bg-blue-500/12   text-blue-600   border-blue-500/20'   },
  shipped:    { label: 'Shipped',          className: 'bg-violet-500/12 text-violet-600 border-violet-500/20' },
  delivered:  { label: 'Delivered',        className: 'bg-green-500/12  text-green-600  border-green-500/20'  },
  cancelled:  { label: 'Cancelled',        className: 'bg-red-500/12    text-red-600    border-red-500/20'    },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STATUS_META[status];
  return (
    <span className={`inline-flex items-center text-[0.48rem] tracking-[0.14em] uppercase font-semibold px-2.5 py-1 border ${className}`}>
      {label}
    </span>
  );
}

// ── Thumbnails ──────────────────────────────────────────────────────────────────

function Thumbnails({ items }: { items: OrderItem[] }) {
  const visible = items.slice(0, 3);
  const overflow = items.length - 3;

  return (
    <div className="flex items-center">
      {visible.map((item, i) => (
        <div
          key={item.productId + i}
          className="relative w-11 h-11 border-2 border-background overflow-hidden bg-muted/40 shrink-0"
          style={{ marginLeft: i === 0 ? 0 : '-10px', zIndex: visible.length - i }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Fallback initial */}
          <span className="absolute inset-0 flex items-center justify-center text-[0.55rem] font-bold text-muted-foreground/50 bg-muted/30">
            {item.name.charAt(0)}
          </span>
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="relative w-11 h-11 border-2 border-background bg-muted/60 flex items-center justify-center shrink-0"
          style={{ marginLeft: '-10px' }}
        >
          <span className="text-[0.52rem] font-bold text-muted-foreground">+{overflow}</span>
        </div>
      )}
    </div>
  );
}

// ── Order card ──────────────────────────────────────────────────────────────────

function OrderCard({ order, index }: { order: Order; index: number }) {
  const formattedDate = order.date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const itemSummary = order.items.length === 1
    ? `${order.items[0].name} · ${order.items[0].size} · ×${order.items[0].qty}`
    : `${order.items[0].name} + ${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}`;

  const canTrack = order.status === 'processing' || order.status === 'shipped';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="border border-border/60 bg-background/40 overflow-hidden"
    >
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/40">
        <div className="space-y-1">
          <p className="text-[0.62rem] tracking-[0.12em] uppercase font-semibold text-foreground">
            #{order.orderNumber}
          </p>
          <p className="text-[0.54rem] tracking-[0.06em] text-muted-foreground/60">
            {formattedDate}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* ── Products row ── */}
      <div className="flex items-center gap-4 px-4 py-3.5 border-b border-border/40">
        <Thumbnails items={order.items} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] tracking-[0.06em] text-foreground leading-snug truncate">
            {itemSummary}
          </p>
          {order.items.length > 1 && (
            <p className="text-[0.52rem] tracking-[0.06em] text-muted-foreground/50 mt-0.5">
              {order.items.reduce((s, i) => s + i.qty, 0)} items total
            </p>
          )}
        </div>
      </div>

      {/* ── Footer row ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Total */}
        <div>
          <p className="text-[0.48rem] tracking-[0.16em] uppercase text-muted-foreground/50 mb-0.5">Total paid</p>
          <p className="text-[0.8rem] font-semibold tabular-nums text-foreground">
            ₦{order.total.toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canTrack && (
            <Link
              href={`/account/orders/${order.id}/track`}
              className="flex items-center gap-1.5 h-8 px-3 border border-border/70 text-[0.54rem] tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-150"
            >
              <MapPin size={11} strokeWidth={1.8} />
              Track
            </Link>
          )}
          <Link
            href={`/account/orders/${order.id}`}
            className="flex items-center gap-1.5 h-8 px-3 text-[0.54rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150"
            style={{ background: 'oklch(0.72 0.10 74 / 0.12)', color: 'oklch(0.65 0.11 72)' }}
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty states ────────────────────────────────────────────────────────────────

function EmptySearch({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <Search size={28} strokeWidth={1.3} className="text-muted-foreground/30" />
      <div className="space-y-1">
        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-foreground">No results</p>
        <p className="text-[0.58rem] tracking-[0.04em] text-muted-foreground/60">
          No orders match &ldquo;{query}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

function EmptyFilter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <Package size={28} strokeWidth={1.3} className="text-muted-foreground/30" />
      <p className="text-[0.58rem] tracking-[0.06em] text-muted-foreground/60">
        No orders in this category
      </p>
    </motion.div>
  );
}

// ── Orders list ─────────────────────────────────────────────────────────────────

interface OrdersListProps {
  orders:      Order[];
  searchQuery: string;
}

export default function OrdersList({ orders, searchQuery }: OrdersListProps) {
  const q = searchQuery.trim().toLowerCase();

  const filtered = q
    ? orders.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.items.some(i => i.name.toLowerCase().includes(q)),
      )
    : orders;

  if (orders.length === 0) return <EmptyFilter />;
  if (filtered.length === 0) return <EmptySearch query={searchQuery} />;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {filtered.map((order, i) => (
          <OrderCard key={order.id} order={order} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
