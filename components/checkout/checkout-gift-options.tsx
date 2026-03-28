'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useCart } from '@/components/shop/cart-context';
import GiftOptions from '@/components/cart/gift-options';

export default function CheckoutGiftOptions() {
  const { giftOptions } = useCart();

  return (
    <div className="space-y-2">
      {/* Carried-over notice — shown only when gift was already toggled on in the cart */}
      <AnimatePresence initial={false}>
        {giftOptions.isGift && (
          <motion.div
            key="carried-over"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border border-accent/40 bg-accent/[0.04]">
              <Sparkles size={11} strokeWidth={1.8} className="text-accent shrink-0" />
              <p className="text-[0.62rem] tracking-[0.06em] text-foreground/70">
                Gift settings from your cart have been carried over.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The full gift options UI — shared component, shared cart-context state */}
      <GiftOptions />
    </div>
  );
}
