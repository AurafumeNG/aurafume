'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, GIFT_WRAP_FEE } from '@/components/shop/cart-context';
import { useCheckout } from './checkout-context';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';
const GOLD_DISABLED =
  'linear-gradient(135deg, oklch(0.80 0.05 75) 0%, oklch(0.82 0.04 77) 100%)';

// ── Paystack inline script loader ───────────────────────────────────────────────

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(); return; }
    if ((window as PaystackWindow).PaystackPop) { resolve(); return; }

    const existing = document.getElementById('paystack-inline-js');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject());
      return;
    }

    const script = document.createElement('script');
    script.id  = 'paystack-inline-js';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload  = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

interface PaystackWindow extends Window {
  PaystackPop?: {
    setup: (config: PaystackConfig) => { openIframe: () => void };
  };
}

interface PaystackConfig {
  key:       string;
  email:     string;
  amount:    number;
  ref:       string;
  currency:  string;
  label:     string;
  metadata?: Record<string, unknown>;
  onSuccess: (response: { reference: string }) => void;
  onClose:   () => void;
}

// ── Shimmer overlay ─────────────────────────────────────────────────────────────

function Shimmer() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 w-24 bg-linear-to-r from-transparent via-white/20 to-transparent"
      initial={{ left: '-6rem' }}
      animate={{ left: '110%' }}
      transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.8 }}
    />
  );
}

// ── Main export ─────────────────────────────────────────────────────────────────

export default function PlaceOrderCta() {
  const router = useRouter();
  const { items, cartTotal, appliedCoupon, giftOptions, clearCart } = useCart();
  const { contactSummary, addressSummary, deliveryOption, paymentMethod, deliveryFee } = useCheckout();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  // Pre-load Paystack script the moment Paystack is selected as payment method
  useEffect(() => {
    if (paymentMethod?.id === 'paystack') {
      loadPaystackScript().catch(() => {});
    }
  }, [paymentMethod?.id]);

  // ── Derived total ────────────────────────────────────────────────────────────
  const discount   = appliedCoupon?.discountAmount ?? 0;
  const wrapFee    = giftOptions.wrapping ? GIFT_WRAP_FEE : 0;
  const finalTotal = cartTotal - discount + deliveryFee + wrapFee;

  // ── Readiness ────────────────────────────────────────────────────────────────
  const isReady =
    items.length > 0  &&
    !!contactSummary  &&
    !!addressSummary  &&
    !!deliveryOption  &&
    !!paymentMethod;

  const isDisabled = !isReady || isProcessing;

  // ── Paystack flow ────────────────────────────────────────────────────────────

  async function handlePaystack() {
    try {
      await loadPaystackScript();
    } catch {
      setErrorMsg('Payment gateway failed to load. Check your connection and try again.');
      return;
    }

    const pop = (window as PaystackWindow).PaystackPop;
    if (!pop) {
      setErrorMsg('Payment gateway unavailable. Please refresh the page and try again.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setErrorMsg('Payment is not configured. Please contact support.');
      return;
    }

    const reference = `aura_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const handler = pop.setup({
      key:      publicKey,
      email:    contactSummary!.email,
      amount:   finalTotal * 100,   // Paystack expects kobo
      ref:      reference,
      currency: 'NGN',
      label:    `${contactSummary!.firstName} ${contactSummary!.lastName}`,
      metadata: {
        custom_fields: [
          { display_name: 'Customer',  variable_name: 'customer',  value: `${contactSummary!.firstName} ${contactSummary!.lastName}` },
          { display_name: 'Phone',     variable_name: 'phone',     value: contactSummary!.phone },
          { display_name: 'Address',   variable_name: 'address',   value: `${addressSummary!.street}, ${addressSummary!.city}, ${addressSummary!.state}` },
          { display_name: 'Delivery',  variable_name: 'delivery',  value: deliveryOption!.label },
        ],
      },

      onSuccess: (response) => {
        // Paystack's onSuccess is the authoritative client-side signal —
        // redirect immediately. Backend verification happens via the webhook.
        clearCart();
        router.push(`/order-confirmation?ref=${response.reference}`);
      },

      onClose: () => {
        // User dismissed popup — no error state, just remain on checkout
      },
    });

    handler.openIframe();
  }

  // ── Bank transfer flow ───────────────────────────────────────────────────────

  async function handleBankTransfer() {
    setIsProcessing(true);
    setErrorMsg(null);
    // Simulate order creation (swap for real API call)
    await new Promise(r => setTimeout(r, 900));
    clearCart();
    router.push('/order-confirmation?method=bank-transfer');
  }

  // ── Dispatcher ───────────────────────────────────────────────────────────────

  async function handlePlaceOrder() {
    if (isDisabled) return;
    setErrorMsg(null);
    if (paymentMethod!.id === 'paystack') {
      await handlePaystack();
    } else {
      await handleBankTransfer();
    }
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

      {/* Error message (post-payment failure) */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="flex items-start gap-2 p-3 bg-destructive/8 border border-destructive/20 overflow-hidden"
          >
            <AlertCircle size={13} strokeWidth={2} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-[0.6rem] tracking-[0.04em] leading-relaxed text-destructive">
              {errorMsg}
            </p>
          </motion.div>
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
          background:  isDisabled ? GOLD_DISABLED : GOLD_GRADIENT,
          color:       'oklch(0.12 0 0)',
          opacity:     isDisabled && !isProcessing ? 0.55 : 1,
          boxShadow:   !isDisabled
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
                {paymentMethod?.id === 'paystack' ? 'Pay with Paystack' : 'Place Order'}
              </span>
              <span className="text-[0.62rem] opacity-80 font-medium">·</span>
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
