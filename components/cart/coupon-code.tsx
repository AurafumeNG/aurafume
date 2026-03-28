'use client';

import { useState, useRef } from 'react';
import { Check, X, Loader2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';

export default function CouponCode() {
  const { appliedCoupon, couponStatus, applyCoupon, removeCoupon } = useCart();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleApply();
  }

  return (
    <section>
      {/* Heading */}
      <div className="flex items-center gap-2 mb-3">
        <Tag size={13} strokeWidth={1.8} className="text-muted-foreground" />
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
          Have a Promo Code?
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
            onKeyDown={handleKeyDown}
            placeholder="Enter code"
            disabled={isLoading || isSuccess}
            spellCheck={false}
            autoCapitalize="characters"
            aria-label="Promo code"
            aria-invalid={isError}
            className={`w-full h-10 px-3 border bg-background text-[0.78rem] tracking-[0.08em] uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/50 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isError
                ? 'border-destructive focus:border-destructive'
                : isSuccess
                  ? 'border-accent'
                  : 'border-border focus:border-foreground/40'
            }`}
          />

          {/* Success indicator inside input */}
          <AnimatePresence>
            {isSuccess && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center bg-accent text-accent-foreground"
              >
                <Check size={9} strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Apply / Remove button */}
        {isSuccess ? (
          <motion.button
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleRemove}
            aria-label="Remove promo code"
            className="h-10 px-4 flex items-center justify-center gap-1.5 border border-border text-[0.62rem] tracking-[0.18em] uppercase text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            <X size={11} strokeWidth={2.2} />
            Remove
          </motion.button>
        ) : (
          <button
            onClick={handleApply}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Apply promo code"
            className="h-10 px-5 flex items-center justify-center gap-2 bg-foreground text-background text-[0.62rem] tracking-[0.2em] uppercase hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 size={13} strokeWidth={2} className="animate-spin" />
            ) : (
              'Apply'
            )}
          </button>
        )}
      </div>

      {/* Feedback messages */}
      <div className="mt-2 min-h-[1.2rem]">
        <AnimatePresence mode="wait">

          {/* Success */}
          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[0.68rem] text-accent font-medium tracking-[0.04em]">
                  Code <span className="font-semibold">{appliedCoupon!.code}</span> applied —{' '}
                  {appliedCoupon!.label}
                </span>
              </div>
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[0.78rem] font-semibold text-accent tabular-nums"
              >
                −₦{appliedCoupon!.discountAmount.toLocaleString()}
              </motion.span>
            </motion.div>
          )}

          {/* Error */}
          {isError && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="text-[0.68rem] text-destructive tracking-[0.02em]"
              role="alert"
            >
              Invalid or expired code. Please try again.
            </motion.p>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
