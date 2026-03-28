'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, GIFT_WRAP_FEE } from '@/components/shop/cart-context';
import { useCheckout } from './checkout-context';

// ── Computed totals ────────────────────────────────────────────────────────────

function useTotals() {
  const { cartTotal, appliedCoupon, giftOptions } = useCart();
  const { deliveryFee } = useCheckout();

  const discount  = appliedCoupon?.discountAmount ?? 0;
  const wrapFee   = giftOptions.wrapping ? GIFT_WRAP_FEE : 0;
  const total     = cartTotal - discount + deliveryFee + wrapFee;

  return { cartTotal, discount, deliveryFee, wrapFee, total, appliedCoupon, giftOptions };
}

// ── Item row ───────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: { name: string; image: string; size: string; qty: number; pricePerUnit: number } }) {
  return (
    <div className="flex items-center gap-3">
      {/* Thumbnail + qty badge */}
      <div className="relative shrink-0 w-12 h-16 bg-muted overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="48px"
          className="object-cover"
        />
        {/* Qty badge */}
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-foreground text-background text-[0.46rem] font-semibold tabular-nums leading-none">
          {item.qty}
        </span>
      </div>

      {/* Name + size */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.78rem] font-medium text-foreground leading-snug line-clamp-2">
          {item.name}
        </p>
        <p className="text-[0.62rem] tracking-[0.1em] uppercase text-muted-foreground mt-0.5">
          {item.size}
        </p>
      </div>

      {/* Line price */}
      <span className="text-[0.78rem] font-medium text-foreground tabular-nums shrink-0">
        ₦{(item.pricePerUnit * item.qty).toLocaleString()}
      </span>
    </div>
  );
}

// ── Divider line item ──────────────────────────────────────────────────────────

function Line({
  label, value, accent, dimmed, large,
}: {
  label: string; value: string;
  accent?: boolean; dimmed?: boolean; large?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`${large ? 'text-[0.82rem] font-semibold text-foreground' : dimmed ? 'text-[0.7rem] text-muted-foreground' : 'text-[0.72rem] text-foreground/75'}`}>
        {label}
      </span>
      <span className={`tabular-nums shrink-0 ${
        large   ? 'text-[0.98rem] font-bold text-foreground'
        : accent ? 'text-[0.72rem] font-medium text-accent'
        : dimmed ? 'text-[0.7rem] text-muted-foreground'
        : 'text-[0.72rem] text-foreground/75'
      }`}>
        {value}
      </span>
    </div>
  );
}

// ── Shared summary body ────────────────────────────────────────────────────────

function SummaryBody() {
  const { items } = useCart();
  const { cartTotal, discount, deliveryFee, wrapFee, total, appliedCoupon, giftOptions } = useTotals();
  const { deliveryOption } = useCheckout();

  return (
    <div className="space-y-5">

      {/* Item list */}
      {items.length > 0 ? (
        <div className="space-y-3.5">
          {items.map(item => (
            <ItemRow key={`${item.productId}-${item.size}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-[0.72rem] text-muted-foreground/70 text-center py-3">
          Your cart is empty.
        </p>
      )}

      {/* Edit cart */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-[0.6rem] tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground transition-colors"
      >
        <Pencil size={10} strokeWidth={1.8} />
        Edit Cart
      </Link>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Totals */}
      <div className="space-y-2">

        <Line label="Subtotal" value={`₦${cartTotal.toLocaleString()}`} />

        {/* Discount */}
        <AnimatePresence initial={false}>
          {appliedCoupon && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Line
                label={`Promo — ${appliedCoupon.code}`}
                value={`−₦${discount.toLocaleString()}`}
                accent
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery fee */}
        <Line
          label={deliveryOption ? `Delivery — ${deliveryOption.label}` : 'Delivery'}
          value={
            !deliveryOption
              ? 'Select method above'
              : deliveryFee === 0
                ? 'Free'
                : `₦${deliveryFee.toLocaleString()}`
          }
          dimmed={!deliveryOption}
        />

        {/* Gift wrap */}
        <AnimatePresence initial={false}>
          {giftOptions.wrapping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Line label="Gift wrapping" value={`+₦${wrapFee.toLocaleString()}`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Total */}
      <div className="border-t border-border pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={total}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
          >
            <Line label="Total" value={`₦${total.toLocaleString()}`} large />
          </motion.div>
        </AnimatePresence>
        {!deliveryOption && (
          <p className="text-[0.54rem] tracking-[0.06em] text-muted-foreground/60 mt-1 text-right">
            excl. delivery
          </p>
        )}
      </div>

    </div>
  );
}

// ── Mobile: collapsible ────────────────────────────────────────────────────────

export function MobileOrderSummary() {
  const [open, setOpen] = useState(false);
  const { total } = useTotals();

  return (
    <div className="border-b border-border">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-[0.7rem] tracking-[0.14em] uppercase text-foreground font-medium">
          {open ? 'Hide' : 'Show'} Order Summary
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            className="inline-flex"
          >
            <ChevronDown size={13} strokeWidth={2} />
          </motion.span>
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={total}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="text-[0.82rem] font-semibold text-foreground tabular-nums"
          >
            ₦{total.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-border bg-card/40">
              <SummaryBody />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Desktop: always expanded ───────────────────────────────────────────────────

export function DesktopOrderSummary() {
  return (
    <div className="border border-border p-5 bg-card/30">
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-5">
        Order Summary
      </h2>
      <SummaryBody />
    </div>
  );
}
