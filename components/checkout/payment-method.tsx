'use client';

import { useState } from 'react';
import { Check, Copy, Landmark, ShieldCheck, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PAYMENT_METHODS, type PaymentMethod, useCheckout } from './checkout-context';

// ── Bank transfer details ──────────────────────────────────────────────────────

const BANK = {
  name:    'Moniepoint',
  number:  '7014006235',
  account: 'Vickscents and Cosmetics',
} as const;

// ── Brand icons ────────────────────────────────────────────────────────────────

function BankIcon() {
  return (
    <span className="flex items-center justify-center w-9 h-9 border border-border shrink-0">
      <Landmark size={17} strokeWidth={1.6} className="text-muted-foreground" />
    </span>
  );
}

function PaystackIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="Paystack" className="shrink-0">
      <rect width="36" height="36" fill="#00C3F7" fillOpacity="0.1" />
      {/* Paystack "P" wordmark approximation */}
      <text x="7" y="22" fontFamily="'Arial Black', sans-serif" fontSize="13" fontWeight="900" fill="#00C3F7">
        PS
      </text>
    </svg>
  );
}

function MethodIcon({ id }: { id: PaymentMethod['id'] }) {
  return id === 'paystack' ? <PaystackIcon /> : <BankIcon />;
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : `Copy ${value}`}
      className="flex items-center gap-1.5 text-[0.6rem] tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-accent"
          >
            <Check size={12} strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={12} strokeWidth={1.8} />
          </motion.span>
        )}
      </AnimatePresence>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Bank transfer detail panel ─────────────────────────────────────────────────

function BankTransferDetails() {
  return (
    <motion.div
      key="bank-details"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-3 pt-3 border-t border-accent/30 space-y-3">

        {/* Account number */}
        <div>
          <p className="text-[0.56rem] tracking-[0.2em] uppercase text-muted-foreground mb-1">
            Account Number
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[1.05rem] font-semibold text-foreground tracking-[0.12em] tabular-nums font-mono">
              {BANK.number}
            </span>
            <CopyButton value={BANK.number} />
          </div>
        </div>

        {/* Bank + account name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[0.56rem] tracking-[0.2em] uppercase text-muted-foreground mb-1">
              Bank
            </p>
            <p className="text-[0.8rem] font-medium text-foreground">{BANK.name}</p>
          </div>
          <div>
            <p className="text-[0.56rem] tracking-[0.2em] uppercase text-muted-foreground mb-1">
              Account Name
            </p>
            <p className="text-[0.8rem] font-medium text-foreground leading-snug">
              {BANK.account}
            </p>
          </div>
        </div>

        {/* Instruction */}
        <p className="text-[0.64rem] tracking-[0.04em] text-muted-foreground/80 leading-relaxed pt-1 border-t border-border">
          Transfer the exact order total to the account above, then tap{' '}
          <span className="font-medium text-foreground">"Place Order"</span> below.
          Your order will be confirmed once payment is verified.
        </p>

      </div>
    </motion.div>
  );
}

// ── Paystack detail panel ──────────────────────────────────────────────────────

function PaystackDetails() {
  return (
    <motion.div
      key="paystack-details"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-3 pt-3 border-t border-accent/30 space-y-2">

        <div className="flex items-start gap-2">
          <ShieldCheck size={13} strokeWidth={1.7} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[0.68rem] tracking-[0.02em] text-foreground/75 leading-relaxed">
            You'll be redirected to a secure Paystack modal to complete payment
            with your card, bank account, transfer, or USSD.
          </p>
        </div>

        <div className="flex items-center gap-4 pt-1">
          {/* Accepted methods */}
          {['Visa', 'Mastercard', 'Verve'].map(brand => (
            <span
              key={brand}
              className="text-[0.54rem] tracking-[0.12em] uppercase text-muted-foreground/70 border border-border px-1.5 py-0.5"
            >
              {brand}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[0.54rem] tracking-[0.1em] uppercase text-muted-foreground/70 ml-auto">
            <ExternalLink size={9} strokeWidth={2} />
            Paystack
          </span>
        </div>

      </div>
    </motion.div>
  );
}

// ── Option card ────────────────────────────────────────────────────────────────

function MethodCard({
  method,
  selected,
  onSelect,
}: {
  method:   PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      layout
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      className={`cursor-pointer border-2 p-4 transition-colors duration-200 select-none ${
        selected
          ? 'border-accent bg-accent/[0.04]'
          : 'border-border hover:border-foreground/25'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">

        {/* Brand icon */}
        <MethodIcon id={method.id} />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-[0.84rem] font-medium transition-colors duration-200 ${
            selected ? 'text-foreground' : 'text-foreground/80'
          }`}>
            {method.label}
          </p>
          <p className="text-[0.66rem] tracking-[0.04em] text-muted-foreground mt-0.5">
            {method.desc}
          </p>
        </div>

        {/* Selection indicator */}
        <div className={`shrink-0 w-4 h-4 flex items-center justify-center border-2 transition-colors duration-200 ${
          selected ? 'bg-accent border-accent' : 'border-border'
        }`}>
          <AnimatePresence>
            {selected && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check size={9} strokeWidth={3} className="text-accent-foreground" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Detail panel — expands when selected */}
      <AnimatePresence initial={false}>
        {selected && (
          method.id === 'bank-transfer'
            ? <BankTransferDetails />
            : <PaystackDetails />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function PaymentMethodSelection() {
  const { paymentMethod, setPaymentMethod } = useCheckout();

  return (
    <section>
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-4">
        Payment Method
      </h2>

      <div className="space-y-3" role="radiogroup" aria-label="Payment method">
        {PAYMENT_METHODS.map(method => (
          <MethodCard
            key={method.id}
            method={method}
            selected={paymentMethod?.id === method.id}
            onSelect={() => setPaymentMethod(method)}
          />
        ))}
      </div>

      {/* Prompt */}
      <AnimatePresence>
        {!paymentMethod && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[0.62rem] tracking-[0.08em] text-muted-foreground/70 mt-3 text-center"
          >
            Please select a payment method to continue.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
