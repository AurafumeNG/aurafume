'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Package,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import type { IOrder } from '@/models/Order';
import Image from 'next/image';

// ── Gold gradient ───────────────────────────────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Animated check ring ─────────────────────────────────────────────────────────

function SuccessRing() {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
      <motion.span
        className="absolute inset-0 rounded-full border border-accent/40"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1.35, opacity: 0 }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeOut',
          delay: 0.6,
        }}
      />
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

// ── Copy button ─────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no clipboard access */
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy"
      className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check size={13} strokeWidth={2.2} className="text-accent" />
      ) : (
        <Copy size={13} strokeWidth={1.8} />
      )}
      <span className="text-[0.55rem] tracking-[0.12em] uppercase">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

// ── Proof of payment uploader ───────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

async function uploadProofToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
  const preset    = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  fd.append('folder', 'aurafumeng/proofs');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: fd },
  );

  if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error('Cloudinary response missing secure_url');

  return data.secure_url;
}

function ProofUploader({ orderId }: { orderId: string }) {
  const inputRef                          = useRef<HTMLInputElement>(null);
  const [file, setFile]                   = useState<File | null>(null);
  const [preview, setPreview]             = useState<string | null>(null);
  const [uploadState, setUploadState]     = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg]           = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    if (!picked.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPG, PNG, WEBP, etc.).');
      return;
    }
    if (picked.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Please choose an image under 10 MB.');
      return;
    }

    setErrorMsg('');
    setUploadState('idle');
    setFile(picked);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(picked);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setUploadState('idle');
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleUpload() {
    if (!file) return;
    setUploadState('uploading');
    setErrorMsg('');

    try {
      // 1. Upload image to Cloudinary — get back a permanent URL
      const proofUrl = await uploadProofToCloudinary(file);

      // 2. Save the Cloudinary URL on the order
      const res = await fetch(`/api/orders/${orderId}/proof`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ proofUrl }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setErrorMsg(json.error ?? 'Upload failed. Please try again.');
        setUploadState('error');
        return;
      }

      setUploadState('success');
    } catch {
      setErrorMsg('Upload failed. Please check your connection and try again.');
      setUploadState('error');
    }
  }

  if (uploadState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 py-5"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ background: 'oklch(0.22 0.05 145)' }}>
          <Check size={22} strokeWidth={2.2} style={{ color: 'oklch(0.72 0.17 145)' }} />
        </div>
        <p className="text-[0.65rem] tracking-[0.08em] font-semibold text-foreground">
          Proof uploaded successfully
        </p>
        <p className="text-[0.58rem] tracking-[0.04em] text-muted-foreground text-center leading-relaxed max-w-[220px]">
          We&apos;ll review your payment and confirm your order shortly.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      <p className="text-[0.62rem] tracking-[0.16em] uppercase font-semibold text-foreground">
        Upload Proof of Payment
      </p>
      <p className="text-[0.60rem] leading-relaxed tracking-[0.03em] text-muted-foreground">
        Take a screenshot or photo of your transfer receipt and upload it below. We&apos;ll verify and confirm your order.
      </p>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.button
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-7 border border-dashed border-border/60 hover:border-accent/50 transition-colors duration-200 cursor-pointer"
          >
            <Upload size={18} strokeWidth={1.6} className="text-muted-foreground/50" />
            <span className="text-[0.58rem] tracking-[0.10em] uppercase text-muted-foreground/60">
              Tap to select image
            </span>
            <span className="text-[0.50rem] tracking-[0.06em] text-muted-foreground/35">
              JPG, PNG, WEBP · Max 4 MB
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Proof preview"
              className="w-full max-h-52 object-contain border border-border/50 bg-muted/10"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-background/80 border border-border/60 transition-colors hover:bg-background"
              aria-label="Remove"
            >
              <X size={12} strokeWidth={2} className="text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {errorMsg && (
        <p className="text-[0.56rem] tracking-[0.04em] leading-relaxed" style={{ color: 'oklch(0.65 0.20 25)' }}>
          {errorMsg}
        </p>
      )}

      {preview && (
        <button
          onClick={handleUpload}
          disabled={uploadState === 'uploading'}
          className="w-full flex items-center justify-center gap-2 h-11 text-[0.60rem] tracking-[0.18em] uppercase font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
        >
          {uploadState === 'uploading' ? (
            <>
              <Loader2 size={13} strokeWidth={2} className="animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload size={13} strokeWidth={2} />
              Submit Proof of Payment
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Bank transfer instructions ──────────────────────────────────────────────────

function BankTransferInstructions({ total, orderId }: { total?: number; orderId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.4 }}
      className="border border-border bg-background/60 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Clock size={14} strokeWidth={1.8} className="text-accent" />
        <span className="text-[0.62rem] tracking-[0.16em] uppercase font-semibold text-foreground">
          Complete Your Payment
        </span>
      </div>
      <p className="text-[0.65rem] leading-relaxed tracking-[0.04em] text-muted-foreground">
        Your order is reserved for{' '}
        <strong className="text-foreground">24 hours</strong>. Transfer{' '}
        {total ? (
          <strong className="text-foreground">₦{total.toLocaleString()}</strong>
        ) : (
          'the exact amount'
        )}{' '}
        to the account below, then upload your proof of payment here.
      </p>
      <div className="space-y-2">
        {[
          { label: 'Bank', value: 'Moniepoint' },
          { label: 'Account Number', value: '7014006235' },
          { label: 'Account Name', value: 'Vickscents and Cosmetics' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
          >
            <span className="text-[0.58rem] tracking-[0.14em] uppercase text-muted-foreground">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[0.7rem] font-semibold text-foreground tabular-nums">
                {value}
              </span>
              {label === 'Account Number' && <CopyButton text={value} />}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t border-border/40">
        <ProofUploader orderId={orderId} />
      </div>
    </motion.div>
  );
}

// ── Order items summary ─────────────────────────────────────────────────────────

function OrderItemsSummary({ order }: { order: IOrder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85, duration: 0.4 }}
      className="border border-border/60 divide-y divide-border/40"
    >
      {/* Items */}
      {order.items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {item.image && (
            <Image
              src={item.image}
              alt={item.name}
              width={40}
              height={40}
              className="object-cover shrink-0 bg-muted"
            />
          )}
          {!item.image && (
            <div className="w-10 h-10 shrink-0 bg-muted/40 flex items-center justify-center">
              <Package
                size={14}
                strokeWidth={1.5}
                className="text-muted-foreground/40"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[0.72rem] font-medium text-foreground truncate">
              {item.name}
            </p>
            <p className="text-[0.6rem] text-muted-foreground">
              {item.size} · qty {item.qty}
            </p>
          </div>
          <span className="text-[0.7rem] font-semibold tabular-nums shrink-0">
            ₦{(item.pricePerUnit * item.qty).toLocaleString()}
          </span>
        </div>
      ))}

      {/* Pricing breakdown */}
      <div className="px-4 py-3 space-y-1.5">
        <Row
          label="Subtotal"
          value={`₦${order.pricing.subtotal.toLocaleString()}`}
        />
        {order.pricing.discount > 0 && (
          <Row
            label={`Discount${order.pricing.couponLabel ? ` (${order.pricing.couponLabel})` : ''}`}
            value={`−₦${order.pricing.discount.toLocaleString()}`}
            accent
          />
        )}
        <Row
          label="Delivery"
          value={
            order.pricing.deliveryFee === 0
              ? 'Free'
              : `₦${order.pricing.deliveryFee.toLocaleString()}`
          }
        />
        {order.pricing.giftWrapFee > 0 && (
          <Row
            label="Gift wrap"
            value={`₦${order.pricing.giftWrapFee.toLocaleString()}`}
          />
        )}
        <div className="pt-1.5 border-t border-border/40">
          <Row
            label="Total"
            value={`₦${order.pricing.total.toLocaleString()}`}
            bold
          />
        </div>
      </div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-[0.6rem] tracking-widest uppercase ${bold ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
      <span
        className={`text-[0.7rem] tabular-nums ${bold ? 'font-bold text-foreground' : accent ? 'text-accent font-medium' : 'text-foreground'}`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Order skeleton ──────────────────────────────────────────────────────────────

function OrderSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-20 bg-muted/30 rounded" />
      <div className="h-32 bg-muted/20 rounded" />
    </div>
  );
}

// ── Inner page ──────────────────────────────────────────────────────────────────

function OrderConfirmationInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const reference = params.get('ref');
  const method = params.get('method');

  const isBankTransfer = method === 'bank-transfer';

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // Lookup key: prefer orderId, fall back to Paystack reference
  const lookupKey = orderId ?? reference;

  useEffect(() => {
    if (!lookupKey) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${lookupKey}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: { data?: IOrder } | null) => {
        if (res?.data) setOrder(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lookupKey]);

  // Derive display ID
  const displayRef = order?.orderNumber ?? reference ?? orderId ?? 'N/A';
  const displayLabel = reference ? 'Payment Reference' : 'Order Number';
  const orderTotal = order?.pricing.total;

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
            ? "We've reserved your order. Complete your bank transfer within 24 hours to confirm."
            : "Your payment was successful. We're preparing your order and will be in touch soon."}
        </p>
      </motion.div>

      {/* ── Reference / Order number ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="border border-border/60 bg-background/40 px-5 py-4 flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[0.52rem] tracking-[0.2em] uppercase text-muted-foreground">
            {displayLabel}
          </span>
          <p className="text-[0.78rem] font-semibold tracking-[0.06em] text-foreground tabular-nums">
            {displayRef}
          </p>
          {order?.contact && (
            <p className="text-[0.58rem] text-muted-foreground/70 tracking-[0.04em] pt-0.5">
              {order.contact.firstName} {order.contact.lastName} ·{' '}
              {order.contact.email}
            </p>
          )}
        </div>
        <CopyButton text={displayRef} />
      </motion.div>

      {/* ── Order items & pricing ── */}
      {loading && <OrderSkeleton />}
      {!loading && order && <OrderItemsSummary order={order} />}

      {/* ── Bank transfer instructions ── */}
      {isBankTransfer && <BankTransferInstructions total={orderTotal} orderId={lookupKey ?? ''} />}

      {/* ── What happens next (Paystack) ── */}
      {!isBankTransfer && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="space-y-3"
        >
          {[
            { step: '01', text: 'Order confirmation sent to your email' },
            { step: '02', text: 'Our team prepares and packages your order' },
            { step: '03', text: 'Shipped with tracking details via SMS/email' },
          ].map(({ step, text }) => (
            <div
              key={step}
              className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0"
            >
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

// ── Default export ──────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationInner />
    </Suspense>
  );
}
