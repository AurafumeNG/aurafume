'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Copy, Check, ArrowRight } from 'lucide-react';

// ── Gold gradient (matches checkout palette) ────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Animated check mark ─────────────────────────────────────────────────────────

function SuccessRing() {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
      {/* Pulsing outer ring */}
      <motion.span
        className="absolute inset-0 rounded-full border border-accent/40"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1.35, opacity: 0 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
      />
      {/* Inner filled circle */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full"
        style={{ background: GOLD_GRADIENT }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.25, ease: 'easeOut' }}
        >
          <CheckCircle2 size={36} strokeWidth={1.6} color="oklch(0.12 0 0)" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Copy reference button ───────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no clipboard access */ }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy reference"
      className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
    >
      {copied
        ? <Check size={13} strokeWidth={2.2} className="text-accent" />
        : <Copy size={13} strokeWidth={1.8} />
      }
      <span className="text-[0.55rem] tracking-[0.12em] uppercase">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

// ── Bank transfer instructions ──────────────────────────────────────────────────

function BankTransferInstructions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.4 }}
      className="border border-border bg-background/60 p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Clock size={14} strokeWidth={1.8} className="text-accent" />
        <span className="text-[0.62rem] tracking-[0.16em] uppercase font-semibold text-foreground">
          Complete Your Payment
        </span>
      </div>
      <p className="text-[0.65rem] leading-relaxed tracking-[0.04em] text-muted-foreground">
        Your order is reserved for <strong className="text-foreground">24 hours</strong>. Transfer the exact amount to the account below and send proof of payment to our WhatsApp.
      </p>
      <div className="space-y-2 pt-1">
        {[
          { label: 'Bank',           value: 'Moniepoint'                  },
          { label: 'Account Number', value: '7014006235'                  },
          { label: 'Account Name',   value: 'Vickscents and Cosmetics'    },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
            <span className="text-[0.58rem] tracking-[0.14em] uppercase text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[0.7rem] font-semibold text-foreground tabular-nums">{value}</span>
              {label === 'Account Number' && <CopyButton text={value} />}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Inner page (uses useSearchParams — must be inside Suspense) ─────────────────

function OrderConfirmationInner() {
  const params    = useSearchParams();
  const reference = params.get('ref');
  const method    = params.get('method');
  const isBankTransfer = method === 'bank-transfer' || (!reference && !method);

  // Generate a short order ID for display (bank transfer has no Paystack ref)
  const [orderId] = useState(() =>
    reference ?? `ORD-${Date.now().toString(36).toUpperCase().slice(-8)}`,
  );

  // Replace history entry so back button goes to home, not checkout
  useEffect(() => {
    window.history.replaceState(
      null,
      '',
      reference ? `/order-confirmation?ref=${reference}` : '/order-confirmation',
    );
  }, [reference]);

  return (
    <div className="max-w-lg mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-10">

      {/* ── Success ring ── */}
      <SuccessRing />

      {/* ── Headline ── */}
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <h1 className="font-heading text-2xl sm:text-3xl tracking-[0.12em] uppercase text-foreground">
          {isBankTransfer ? 'Order Reserved' : 'Payment Confirmed'}
        </h1>
        <p className="text-[0.68rem] tracking-[0.08em] leading-relaxed text-muted-foreground max-w-xs mx-auto">
          {isBankTransfer
            ? 'We\'ve reserved your order. Complete your bank transfer within 24 hours to confirm.'
            : 'Your payment was successful. We\'re preparing your order and will be in touch soon.'
          }
        </p>
      </motion.div>

      {/* ── Reference / Order ID ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="border border-border/60 bg-background/40 px-5 py-4 flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[0.52rem] tracking-[0.2em] uppercase text-muted-foreground">
            {reference ? 'Payment Reference' : 'Order ID'}
          </span>
          <p className="text-[0.78rem] font-semibold tracking-[0.06em] text-foreground tabular-nums">
            {orderId}
          </p>
        </div>
        <CopyButton text={orderId} />
      </motion.div>

      {/* ── Bank transfer instructions (conditional) ── */}
      {isBankTransfer && <BankTransferInstructions />}

      {/* ── What happens next (Paystack) ── */}
      {!isBankTransfer && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="space-y-3"
        >
          {[
            { step: '01', text: 'Order confirmation sent to your email'      },
            { step: '02', text: 'Our team prepares and packages your order'  },
            { step: '03', text: 'Shipped with tracking details via SMS/email' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
              <span
                className="shrink-0 text-[0.52rem] tracking-[0.2em] font-semibold w-7 text-center"
                style={{ color: 'oklch(0.72 0.10 74)' }}
              >
                {step}
              </span>
              <span className="text-[0.65rem] tracking-[0.06em] leading-relaxed text-muted-foreground">
                {text}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── CTAs ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link
          href="/shop"
          className="flex-1 flex items-center justify-center gap-2 h-12 text-[0.62rem] tracking-[0.2em] uppercase font-semibold transition-all duration-200"
          style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
        >
          Continue Shopping
          <ArrowRight size={13} strokeWidth={2} />
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center h-12 text-[0.62rem] tracking-[0.2em] uppercase font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-200"
        >
          Back to Home
        </Link>
      </motion.div>

      {/* ── Fine print ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="text-center text-[0.54rem] tracking-[0.08em] text-muted-foreground/50 leading-relaxed"
      >
        Questions? Reach us on WhatsApp or email hello@aurafume.com
      </motion.p>

    </div>
  );
}

// ── Default export — wraps inner page in Suspense ───────────────────────────────

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationInner />
    </Suspense>
  );
}
