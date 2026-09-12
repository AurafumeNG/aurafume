'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, GIFT_WRAP_FEE } from '@/components/shop/cart-context';

// ── Constants ──────────────────────────────────────────────────────────────────
const FREE_DELIVERY_THRESHOLD = 200_000; // must match delivery-progress.tsx

// ── Payment brand marks (inline SVG) ──────────────────────────────────────────

function PaystackMark() {
  return (
    <svg
      width="54"
      height="22"
      viewBox="0 0 54 22"
      fill="none"
      aria-label="Paystack"
    >
      <rect width="54" height="22" rx="3" fill="#00C3F7" fillOpacity="0.12" />
      {/* wordmark simplified */}
      <text
        x="5"
        y="15"
        fontFamily="'Arial', sans-serif"
        fontSize="8.5"
        fontWeight="700"
        fill="#00C3F7"
        letterSpacing="0.01em"
      >
        Paystack
      </text>
    </svg>
  );
}

function VisaMark() {
  return (
    <svg
      width="40"
      height="22"
      viewBox="0 0 40 22"
      fill="none"
      aria-label="Visa"
    >
      <rect width="40" height="22" rx="3" fill="#1A1F71" fillOpacity="0.08" />
      <text
        x="6"
        y="15.5"
        fontFamily="'Arial', sans-serif"
        fontSize="11"
        fontWeight="800"
        fontStyle="italic"
        fill="#1A1F71"
        letterSpacing="-0.01em"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg
      width="36"
      height="22"
      viewBox="0 0 36 22"
      fill="none"
      aria-label="Mastercard"
    >
      <rect width="36" height="22" rx="3" fill="transparent" />
      <circle cx="14" cy="11" r="8" fill="#EB001B" />
      <circle cx="22" cy="11" r="8" fill="#F79E1B" />
      {/* overlap */}
      <path d="M18 4.6a8 8 0 0 1 0 12.8A8 8 0 0 1 18 4.6Z" fill="#FF5F00" />
    </svg>
  );
}

function VerveMark() {
  return (
    <svg
      width="42"
      height="22"
      viewBox="0 0 42 22"
      fill="none"
      aria-label="Verve"
    >
      <rect width="42" height="22" rx="3" fill="#014A92" fillOpacity="0.08" />
      <text
        x="5"
        y="15"
        fontFamily="'Arial', sans-serif"
        fontSize="9.5"
        fontWeight="700"
        fill="#014A92"
        letterSpacing="0.04em"
      >
        VERVE
      </text>
    </svg>
  );
}

// ── Payment row ────────────────────────────────────────────────────────────────

function PaymentIcons() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <PaystackMark />
        <VisaMark />
        <MastercardMark />
        <VerveMark />
      </div>

      {/* <p className="text-[0.54rem] tracking-[0.12em] uppercase text-muted-foreground/60">
        Secure & encrypted checkout
      </p> */}
    </div>
  );
}

// ── Line item ──────────────────────────────────────────────────────────────────

function Line({
  label,
  value,
  sub,
  accent,
  large,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${large ? 'pt-1' : ''}`}
    >
      <div className="flex flex-col">
        <span
          className={`${large ? 'text-[0.78rem] font-semibold text-foreground' : 'text-[0.72rem] text-foreground/70'} tracking-[0.02em]`}
        >
          {label}
        </span>
        {sub && (
          <span className="text-[0.58rem] tracking-[0.06em] text-muted-foreground/70 mt-0.5">
            {sub}
          </span>
        )}
      </div>
      <span
        className={`tabular-nums shrink-0 ${
          large
            ? 'text-[0.92rem] font-semibold text-foreground'
            : accent
              ? 'text-[0.72rem] font-medium text-accent'
              : 'text-[0.72rem] text-foreground/70'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function OrderSummary() {
  const { items, cartTotal, appliedCoupon, giftOptions } = useCart();

  if (items.length === 0) return null;

  const isFreeShipping = appliedCoupon?.type === 'free-shipping';
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const wrapFee = giftOptions.wrapping ? GIFT_WRAP_FEE : 0;
  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : null; // null = not yet known
  const finalTotal = cartTotal - discountAmount + wrapFee;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* ── Summary card ── */}
      <div className="border border-border p-4 space-y-2.5">
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-3">
          Order Summary
        </h2>

        {/* Subtotal */}
        <Line label="Subtotal" value={`₦${cartTotal.toLocaleString()}`} />

        {/* Discount */}
        <AnimatePresence>
          {appliedCoupon && !isFreeShipping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <Line
                label={`Promo: ${appliedCoupon.code}`}
                value={`−₦${discountAmount.toLocaleString()}`}
                sub={appliedCoupon.label}
                accent
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift wrapping */}
        <AnimatePresence>
          {giftOptions.wrapping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <Line
                label="Gift wrapping"
                value={`+₦${GIFT_WRAP_FEE.toLocaleString()}`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery */}
        <Line
          label="Delivery"
          value={
            isFreeShipping || deliveryFee === 0
              ? 'Free'
              : 'Calculated at checkout'
          }
          sub={
            isFreeShipping
              ? `${appliedCoupon!.code} applied`
              : deliveryFee !== 0
                ? `Free over ₦${FREE_DELIVERY_THRESHOLD.toLocaleString()}`
                : undefined
          }
          accent={isFreeShipping}
        />

        {/* Divider */}
        <div className="border-t border-border pt-2.5">
          {/* Animated total */}
          <AnimatePresence mode="wait">
            <motion.div
              key={finalTotal}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18 }}
            >
              <Line
                label="Total"
                value={`₦${finalTotal.toLocaleString()}`}
                large
              />
            </motion.div>
          </AnimatePresence>
          {deliveryFee !== 0 && (
            <p className="text-[0.55rem] tracking-[0.08em] text-muted-foreground/60 mt-1 text-right">
              excl. delivery
            </p>
          )}
        </div>
      </div>

      {/* ── Main CTA ── */}
      <Link
        id="checkout-cta"
        href="/checkout"
        className="mt-3 flex w-full h-12 items-center justify-center gap-2 bg-foreground text-background text-[0.72rem] tracking-[0.24em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        Proceed to Checkout
        <ArrowRight size={14} strokeWidth={1.8} />
      </Link>

      {/* ── Payment icons ── */}
      <div className="mt-4">
        <PaymentIcons />
      </div>

      {/* ── Continue shopping ── */}
      <div className="mt-5 flex justify-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-[0.64rem] tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft
            size={12}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          Continue Shopping
        </Link>
      </div>
    </motion.section>
  );
}
