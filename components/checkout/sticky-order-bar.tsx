'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, GIFT_WRAP_FEE } from '@/components/shop/cart-context';
import { useCheckout } from './checkout-context';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';
const GOLD_DISABLED =
  'linear-gradient(135deg, oklch(0.80 0.05 75) 0%, oklch(0.82 0.04 77) 100%)';

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator() {
  return (
    <div className="flex items-center justify-between px-5 py-1.5 border-t border-border bg-background/80">
      {/* Dot track */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map(n => (
          <span
            key={n}
            className={`block rounded-full transition-all duration-300 ${
              n === 2
                ? 'w-4 h-1.5 bg-accent'          // current step — wider pill
                : 'w-1.5 h-1.5 bg-border'         // other steps — small dot
            }`}
          />
        ))}
      </div>
      <span className="text-[0.54rem] tracking-[0.2em] uppercase text-muted-foreground">
        Step 2 of 3
      </span>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function StickyOrderBar() {
  const { items, cartTotal, appliedCoupon, giftOptions } = useCart();
  const { contactSummary, addressSummary, deliveryOption, paymentMethod, deliveryFee } = useCheckout();

  const [ctaVisible, setCtaVisible] = useState(false);

  // Observe the main Place Order CTA — hide bar when it enters the viewport
  useEffect(() => {
    const cta = document.getElementById('place-order-cta');
    if (!cta) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.6 },
    );
    observer.observe(cta);
    return () => observer.disconnect();
  }, [items.length]);

  const discount   = appliedCoupon?.discountAmount ?? 0;
  const wrapFee    = giftOptions.wrapping ? GIFT_WRAP_FEE : 0;
  const finalTotal = cartTotal - discount + deliveryFee + wrapFee;

  const isReady =
    items.length > 0 &&
    !!contactSummary  &&
    !!addressSummary  &&
    !!deliveryOption  &&
    !!paymentMethod;

  // No cart items → no bar at all
  if (items.length === 0) return null;

  function scrollToCta() {
    const el = document.getElementById('place-order-cta');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // sm:hidden — desktop CTA always visible; bottom-16 sits above the h-16 BottomNavBar
  return (
    <div className="sm:hidden fixed bottom-16 inset-x-0 z-40">
      <AnimatePresence>
        {!ctaVisible && (
          <motion.div
            key="sticky-order-bar"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Step indicator strip */}
            <StepIndicator />

            {/* Separator */}
            <div className="h-px bg-border" />

            {/* Bar */}
            <div
              className="bg-background/95 backdrop-blur-md px-5 flex items-center justify-between gap-4"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))', paddingTop: '0.75rem' }}
            >
              {/* Total */}
              <div className="flex flex-col">
                <span className="text-[0.52rem] tracking-[0.18em] uppercase text-muted-foreground">
                  Total
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={finalTotal}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.15 }}
                    className="text-[1.05rem] font-semibold text-foreground tabular-nums leading-tight"
                  >
                    ₦{finalTotal.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
                {!deliveryOption && (
                  <span className="text-[0.5rem] tracking-[0.06em] text-muted-foreground/60">
                    excl. delivery
                  </span>
                )}
              </div>

              {/* Place Order button */}
              <motion.button
                whileTap={isReady ? { scale: 0.97 } : undefined}
                onClick={scrollToCta}
                disabled={!isReady}
                className="flex items-center justify-center h-11 px-6 text-[0.64rem] tracking-[0.2em] uppercase font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isReady ? GOLD_GRADIENT : GOLD_DISABLED,
                  color: 'oklch(0.12 0 0)',
                  boxShadow: isReady
                    ? '0 2px 16px oklch(0.72 0.10 74 / 0.3)'
                    : 'none',
                }}
              >
                Place Order
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
