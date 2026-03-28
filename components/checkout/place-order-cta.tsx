'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, GIFT_WRAP_FEE } from '@/components/shop/cart-context';
import { useCheckout } from './checkout-context';

// Accent gold — matches --accent: oklch(0.75 0.08 75)
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';
const GOLD_DISABLED =
  'linear-gradient(135deg, oklch(0.80 0.05 75) 0%, oklch(0.82 0.04 77) 100%)';

// ── Shimmer overlay (decorative, renders over the button background) ────────────

function Shimmer() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      initial={{ left: '-6rem' }}
      animate={{ left: '110%' }}
      transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.8 }}
    />
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function PlaceOrderCta() {
  const { items, cartTotal, appliedCoupon, giftOptions } = useCart();
  const { contactSummary, addressSummary, deliveryOption, paymentMethod, deliveryFee } = useCheckout();

  const [isProcessing, setIsProcessing] = useState(false);

  // ── Derived total ──────────────────────────────────────────────────────────
  const discount   = appliedCoupon?.discountAmount ?? 0;
  const wrapFee    = giftOptions.wrapping ? GIFT_WRAP_FEE : 0;
  const finalTotal = cartTotal - discount + deliveryFee + wrapFee;

  // ── Readiness ──────────────────────────────────────────────────────────────
  const isReady =
    items.length > 0        &&
    !!contactSummary        &&
    !!addressSummary        &&
    !!deliveryOption        &&
    !!paymentMethod;

  const isDisabled = !isReady || isProcessing;

  // ── Handler (swap for real payment integration) ────────────────────────────
  async function handlePlaceOrder() {
    if (isDisabled) return;
    setIsProcessing(true);
    // TODO: call payment API / open Paystack modal here
    await new Promise(r => setTimeout(r, 2500));
    setIsProcessing(false);
    // TODO: router.push('/order-confirmation') after real success
  }

  return (
    <div className="space-y-3">

      {/* Incomplete-fields hint */}
      <AnimatePresence>
        {!isReady && items.length > 0 && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="text-center text-[0.62rem] tracking-[0.06em] text-muted-foreground/80 overflow-hidden"
          >
            Complete all required sections above to place your order.
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── CTA button ── */}
      <motion.button
        id="place-order-cta"
        type="button"
        onClick={handlePlaceOrder}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.985 } : undefined}
        className="relative w-full h-14 overflow-hidden flex items-center justify-center gap-3 transition-all duration-300 disabled:cursor-not-allowed"
        style={{
          background:   isDisabled ? GOLD_DISABLED : GOLD_GRADIENT,
          color:        'oklch(0.12 0 0)',
          opacity:      isDisabled && !isProcessing ? 0.55 : 1,
          boxShadow:    !isDisabled
            ? '0 4px 24px oklch(0.72 0.10 74 / 0.35), 0 1px 4px oklch(0.72 0.10 74 / 0.2)'
            : 'none',
        }}
      >
        {/* Shimmer — only when button is active and not loading */}
        {!isDisabled && !isProcessing && <Shimmer />}

        {/* Button content */}
        <AnimatePresence mode="wait" initial={false}>
          {isProcessing ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2.5"
            >
              <Loader2 size={16} strokeWidth={2} className="animate-spin" />
              <span className="text-[0.68rem] tracking-[0.28em] uppercase font-medium">
                Processing…
              </span>
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3"
            >
              <span className="text-[0.72rem] tracking-[0.28em] uppercase font-semibold">
                Place Order
              </span>
              <span className="text-[0.62rem] tracking-[0.04em] opacity-80 font-medium">
                ·
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={finalTotal}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="text-[0.8rem] font-bold tabular-nums"
                >
                  ₦{finalTotal.toLocaleString()}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Security reassurance */}
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground/60">
        <ShieldCheck size={11} strokeWidth={1.7} />
        <span className="text-[0.56rem] tracking-[0.12em] uppercase">
          256-bit SSL encryption · Secured by Paystack
        </span>
      </div>

    </div>
  );
}
