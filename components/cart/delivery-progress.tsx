'use client';

import { Truck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';

// Must match the trust badge: "Free delivery over ₦200,000"
const FREE_DELIVERY_THRESHOLD = 200_000;

export default function DeliveryProgress() {
  const { cartTotal } = useCart();

  const remaining  = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);
  const pct        = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100);
  const isUnlocked = remaining === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`border transition-colors duration-500 ${
        isUnlocked ? 'border-accent/60 bg-accent/5' : 'border-border bg-background'
      } px-4 py-3.5`}
    >
      {/* Top row: icon + message */}
      <div className="flex items-center gap-2.5 mb-3">

        {/* Truck icon — bounces slightly when unlocked */}
        <motion.div
          animate={isUnlocked ? { x: [0, 4, 0] } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`shrink-0 transition-colors duration-300 ${
            isUnlocked ? 'text-accent' : 'text-muted-foreground'
          }`}
        >
          <Truck size={16} strokeWidth={1.8} />
        </motion.div>

        {/* Message — swaps between states */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {isUnlocked ? (
              <motion.div
                key="unlocked"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-[0.72rem] tracking-[0.04em] text-foreground font-medium">
                  You've unlocked free delivery!
                </span>
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-4 h-4 bg-accent text-accent-foreground shrink-0"
                >
                  <Check size={9} strokeWidth={3} />
                </motion.span>
              </motion.div>
            ) : (
              <motion.p
                key="progress"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[0.72rem] tracking-[0.02em] text-foreground leading-snug"
              >
                You&apos;re{' '}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={remaining}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.18 }}
                    className="font-medium tabular-nums"
                  >
                    ₦{remaining.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
                {' '}away from{' '}
                <span className="font-medium">free delivery</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Percentage — right-aligned */}
        {!isUnlocked && (
          <AnimatePresence mode="wait">
            <motion.span
              key={Math.round(pct)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[0.6rem] tracking-[0.1em] tabular-nums text-muted-foreground shrink-0"
            >
              {Math.round(pct)}%
            </motion.span>
          </AnimatePresence>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-border overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 transition-colors duration-500 ${
            isUnlocked ? 'bg-accent' : 'bg-foreground'
          }`}
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
        />

        {/* Shimmer on the fill when unlocked */}
        {isUnlocked && (
          <motion.div
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ left: '-4rem' }}
            animate={{ left: '110%' }}
            transition={{ duration: 0.7, ease: 'easeInOut', delay: 0.3 }}
          />
        )}
      </div>

      {/* Sub-label */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[0.54rem] tracking-[0.1em] uppercase text-muted-foreground/70">
          {isUnlocked ? 'Free delivery applied' : `₦${cartTotal.toLocaleString()} spent`}
        </span>
        {!isUnlocked && (
          <span className="text-[0.54rem] tracking-[0.1em] uppercase text-muted-foreground/70 tabular-nums">
            ₦{FREE_DELIVERY_THRESHOLD.toLocaleString()} goal
          </span>
        )}
      </div>
    </motion.div>
  );
}
