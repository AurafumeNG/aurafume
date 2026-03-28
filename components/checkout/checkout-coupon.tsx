'use client';

import { useState, useRef } from 'react';
import { Check, X, Loader2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';

export default function CheckoutCoupon() {
  const { appliedCoupon, couponStatus, applyCoupon, removeCoupon } = useCart();

  // Snapshot on mount — hide entire section if coupon was already applied from the cart page
  const [preApplied] = useState(() => appliedCoupon !== null);

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  if (preApplied) return null;

  const isLoading = couponStatus === 'loading';
  const isSuccess = couponStatus === 'success' && appliedCoupon !== null;
  const isError   = couponStatus === 'error';

  async function handleApply() {
    const code = inputValue.trim();
    if (!code || isLoading) return;
    await applyCoupon(code);
  }

  function handleRemove() {
    removeCoupon();
    setInputValue('');
    inputRef.current?.focus();
  }

  return (
    <section>
      {/* Heading */}
      <div className="flex items-center gap-2 mb-3">
        <Tag size={13} strokeWidth={1.8} className="text-muted-foreground" />
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
          Promo Code
        </h2>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Enter promo code"
            disabled={isLoading || isSuccess}
            spellCheck={false}
            autoCapitalize="characters"
            aria-label="Promo code"
            aria-invalid={isError}
            className={`w-full h-12 px-3 border bg-background text-[0.82rem] tracking-[0.08em] uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/40 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isError
                ? 'border-destructive focus:border-destructive'
                : isSuccess
                  ? 'border-accent'
                  : 'border-border focus-within:border-foreground/50'
            }`}
          />

          {/* Inline success tick */}
          <AnimatePresence>
            {isSuccess && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.18 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center bg-accent text-accent-foreground"
              >
                <Check size={9} strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Apply / Remove */}
        <AnimatePresence mode="wait" initial={false}>
          {isSuccess ? (
            <motion.button
              key="remove"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}
              onClick={handleRemove}
              aria-label="Remove promo code"
              className="h-12 px-4 flex items-center justify-center gap-1.5 border border-border text-[0.62rem] tracking-[0.18em] uppercase text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
            >
              <X size={11} strokeWidth={2.2} />
              Remove
            </motion.button>
          ) : (
            <motion.button
              key="apply"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}
              onClick={handleApply}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Apply promo code"
              className="h-12 px-5 flex items-center justify-center gap-2 bg-foreground text-background text-[0.62rem] tracking-[0.22em] uppercase hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                : 'Apply'
              }
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <div className="mt-2 min-h-5">
        <AnimatePresence mode="wait">

          {isSuccess && (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between"
            >
              <span className="text-[0.68rem] text-accent font-medium">
                <span className="font-semibold">{appliedCoupon!.code}</span> — {appliedCoupon!.label}
              </span>
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 }}
                className="text-[0.76rem] font-semibold text-accent tabular-nums"
              >
                −₦{appliedCoupon!.discountAmount.toLocaleString()}
              </motion.span>
            </motion.div>
          )}

          {isError && (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[0.68rem] text-destructive"
              role="alert"
            >
              Code invalid or expired. Please try again.
            </motion.p>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
