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

// ── Paystack V2 Inline JS loader ────────────────────────────────────────────────

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(); return; }
    if (typeof (window as unknown as PaystackWindow).PaystackPop === 'function') { resolve(); return; }

    const existing = document.getElementById('paystack-inline-js');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject());
      return;
    }

    const script = document.createElement('script');
    script.id    = 'paystack-inline-js';
    script.src   = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    script.onload  = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

interface PaystackTransaction {
  reference: string;
  trans:     string;
  status:    string;
  message:   string;
}

interface PaystackConfig {
  key:       string;
  email:     string;
  amount:    number;
  ref?:      string;
  currency?: string;
  label?:    string;
  metadata?: Record<string, unknown>;
  onSuccess: (transaction: PaystackTransaction) => void;
  onCancel:  () => void;
  onError?:  (error: { message: string }) => void;
}

interface PaystackWindow extends Window {
  PaystackPop?: new () => { newTransaction: (config: PaystackConfig) => void };
}

// ── Order creation payload ──────────────────────────────────────────────────────

interface CreateOrderPayload {
  contact:         { firstName: string; lastName: string; email: string; phone: string };
  shippingAddress: { street: string; apt: string; city: string; state: string; country: string };
  items:           Array<{
    productId: string; slug: string; name: string; scentFamily: string;
    image: string; size: string; pricePerUnit: number; qty: number;
  }>;
  gift:            { isGift: boolean; message: string; wrapping: boolean; hidePrice: boolean };
  delivery:        { option: string; label: string; duration: string; notes?: string };
  payment:         { method: 'bank-transfer' | 'paystack'; paystackRef?: string };
  couponCode?:     string;
  cartTotal:       number;
  deliveryFee:     number;
  giftWrapFee:     number;
}

async function createOrder(payload: CreateOrderPayload): Promise<{ orderId: string; orderNumber: string }> {
  const res = await fetch('/api/orders', {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });
  const data = await res.json() as { orderId?: string; orderNumber?: string; error?: string };
  if (!res.ok || !data.orderId) {
    throw new Error(data.error ?? 'Failed to create order.');
  }
  return { orderId: data.orderId, orderNumber: data.orderNumber! };
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

  // ── Derived totals ────────────────────────────────────────────────────────────
  const isFreeShipping = appliedCoupon?.type === 'free-shipping';
  const discount       = isFreeShipping ? deliveryFee : (appliedCoupon?.discountAmount ?? 0);
  const effectiveDelivery = isFreeShipping ? 0 : deliveryFee;
  const wrapFee        = giftOptions.wrapping ? GIFT_WRAP_FEE : 0;
  const finalTotal     = cartTotal - discount + effectiveDelivery + wrapFee;

  // ── Readiness ─────────────────────────────────────────────────────────────────
  const isReady =
    items.length > 0  &&
    !!contactSummary  &&
    !!addressSummary  &&
    !!deliveryOption  &&
    !!paymentMethod;

  const isDisabled = !isReady || isProcessing;

  // ── Build the shared order payload ───────────────────────────────────────────

  function buildPayload(paystackRef?: string): CreateOrderPayload {
    return {
      contact: {
        firstName: contactSummary?.firstName ?? '',
        lastName:  contactSummary?.lastName  ?? '',
        email:     contactSummary?.email     ?? '',
        phone:     contactSummary?.phone     ?? '',
      },
      shippingAddress: {
        street:  addressSummary?.street  ?? '',
        apt:     addressSummary?.apt     ?? '',
        city:    addressSummary?.city    ?? '',
        state:   addressSummary?.state   ?? '',
        country: addressSummary?.country ?? '',
      },
      items: items.map(i => ({
        productId:    i.productId,
        slug:         i.slug,
        name:         i.name,
        scentFamily:  i.scentFamily,
        image:        i.image,
        size:         i.size,
        pricePerUnit: i.pricePerUnit,
        qty:          i.qty,
      })),
      gift: {
        isGift:    giftOptions.isGift,
        message:   giftOptions.message,
        wrapping:  giftOptions.wrapping,
        hidePrice: giftOptions.hidePrice,
      },
      delivery: {
        option:   deliveryOption?.id ?? '',
        label:    deliveryOption?.label ?? '',
        duration: deliveryOption?.duration ?? '',
      },
      payment: {
        method:      paymentMethod?.id ?? 'bank-transfer',
        paystackRef,
      },
      couponCode:  appliedCoupon?.code,
      cartTotal,
      deliveryFee,
      giftWrapFee: wrapFee,
    };
  }

  // ── Paystack flow ─────────────────────────────────────────────────────────────

  async function handlePaystack() {
    try {
      await loadPaystackScript();
    } catch {
      setErrorMsg('Payment gateway failed to load. Check your connection and try again.');
      return;
    }

    const PaystackPop = (window as unknown as PaystackWindow).PaystackPop;
    if (!PaystackPop) {
      setErrorMsg('Payment gateway unavailable. Please refresh the page and try again.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setErrorMsg('Payment is not configured. Please contact support.');
      return;
    }

    // Generate reference first so we can store it with the order
    const reference = `aura_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Create the order in DB before opening the payment modal
    setIsProcessing(true);
    let orderId: string;
    try {
      ({ orderId } = await createOrder(buildPayload(reference)));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
      setIsProcessing(false);
      return;
    }
    setIsProcessing(false);

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key:      publicKey,
      email:    contactSummary?.email ?? '',
      amount:   finalTotal * 100,   // kobo
      ref:      reference,
      currency: 'NGN',
      label:    `${contactSummary?.firstName ?? ''} ${contactSummary?.lastName ?? ''}`,
      metadata: {
        orderId,
        custom_fields: [
          { display_name: 'Customer',  variable_name: 'customer',  value: `${contactSummary?.firstName ?? ''} ${contactSummary?.lastName ?? ''}` },
          { display_name: 'Phone',     variable_name: 'phone',     value: contactSummary?.phone     ?? '' },
          { display_name: 'Address',   variable_name: 'address',   value: `${addressSummary?.street ?? ''}, ${addressSummary?.city ?? ''}, ${addressSummary?.state ?? ''}` },
          { display_name: 'Delivery',  variable_name: 'delivery',  value: deliveryOption?.label     ?? '' },
        ],
      },

      onSuccess: (transaction: PaystackTransaction) => {
        clearCart();
        router.push(`/order-confirmation?orderId=${orderId}&ref=${transaction.reference}`);
      },

      onCancel: () => {
        // User dismissed — order stays in DB as 'pending', no error shown
      },

      onError: (error: { message: string }) => {
        setErrorMsg(`Payment error: ${error.message}. Please try again.`);
      },
    });
  }

  // ── Bank transfer flow ────────────────────────────────────────────────────────

  async function handleBankTransfer() {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const { orderId } = await createOrder(buildPayload());
      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}&method=bank-transfer`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
      setIsProcessing(false);
    }
  }

  // ── Dispatcher ────────────────────────────────────────────────────────────────

  async function handlePlaceOrder() {
    if (isDisabled) return;
    setErrorMsg(null);
    if (paymentMethod?.id === 'paystack') {
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

      {/* Error message */}
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
        {!isDisabled && !isProcessing && <Shimmer />}

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
