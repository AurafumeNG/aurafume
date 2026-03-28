'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, GIFT_WRAP_FEE } from '@/components/shop/cart-context';

export default function StickyCheckoutBar() {
  const { items, cartTotal, appliedCoupon, giftOptions } = useCart();
  const [ctaVisible, setCtaVisible] = useState(false);

  // Watch the main CTA button — hide bar when it's on screen
  useEffect(() => {
    const cta = document.getElementById('checkout-cta');
    if (!cta) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(cta);
    return () => observer.disconnect();
  }, [
    // Re-run if items change — CTA may mount/unmount when cart becomes empty
    items.length,
  ]);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const wrapFee        = giftOptions.wrapping ? GIFT_WRAP_FEE : 0;
  const finalTotal     = cartTotal - discountAmount + wrapFee;

  // Never render when cart is empty
  if (items.length === 0) return null;

  return (
    // sm:hidden — desktop always has the main CTA in view
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom">
      <AnimatePresence>
        {!ctaVisible && (
          <motion.div
            key="sticky-bar"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* Separator */}
            <div className="h-px bg-border" />

            <div className="bg-background/95 backdrop-blur-md px-5 py-3 flex items-center justify-between gap-4"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
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
                {appliedCoupon && (
                  <span className="text-[0.52rem] tracking-[0.08em] text-accent">
                    {appliedCoupon.label} applied
                  </span>
                )}
              </div>

              {/* Checkout button */}
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 h-11 px-7 bg-foreground text-background text-[0.65rem] tracking-[0.22em] uppercase hover:bg-accent hover:text-accent-foreground active:scale-[0.97] transition-all"
              >
                Checkout
                <ArrowRight size={13} strokeWidth={1.8} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
