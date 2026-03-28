'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, type CartItem } from '@/components/shop/cart-context';

const REVEAL_WIDTH   = 144; // 72px per button × 2
const SNAP_THRESHOLD = 48;  // px dragged left before snapping open
const VELOCITY_THRESHOLD = 0.3; // px/ms — quick flick to open

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const { removeFromCart, updateQty, saveForLater } = useCart();

  // Ref to the draggable card DOM node — we manipulate it directly
  // so React re-renders never interfere with the gesture
  const cardRef = useRef<HTMLDivElement>(null);

  // Persistent drag state — never triggers re-renders
  const isOpenRef        = useRef(false);
  const dragStartXRef    = useRef(0);
  const dragStartYRef    = useRef(0);
  const currentXRef      = useRef(0);   // live translateX during drag
  const touchStartMs     = useRef(0);
  const isHorizontalRef  = useRef<boolean | null>(null); // null = undecided

  // ── Snap helpers ──────────────────────────────────────────────
  function snapTo(targetX: number) {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)';
    el.style.transform  = `translateX(${targetX}px)`;
    currentXRef.current = targetX;
    isOpenRef.current   = targetX < -8;
  }

  function snapOpen()   { snapTo(-REVEAL_WIDTH); }
  function snapClosed() { snapTo(0); }

  // ── Touch handlers ────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    dragStartXRef.current   = touch.clientX;
    dragStartYRef.current   = touch.clientY;
    touchStartMs.current    = Date.now();
    isHorizontalRef.current = null; // direction not yet determined

    const el = cardRef.current;
    if (el) el.style.transition = 'none'; // instant follow during drag
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch  = e.touches[0];
    const dX     = touch.clientX - dragStartXRef.current;
    const dY     = touch.clientY - dragStartYRef.current;

    // Determine gesture direction on first significant movement
    if (isHorizontalRef.current === null) {
      if (Math.abs(dX) < 4 && Math.abs(dY) < 4) return; // too small to decide
      isHorizontalRef.current = Math.abs(dX) > Math.abs(dY);
    }

    // Only drive the card horizontally; let vertical touches scroll
    if (!isHorizontalRef.current) return;

    // Prevent page from scrolling during a horizontal drag
    e.preventDefault();

    const base = isOpenRef.current ? -REVEAL_WIDTH : 0;
    const newX = Math.min(0, Math.max(-REVEAL_WIDTH, base + dX));

    const el = cardRef.current;
    if (el) el.style.transform = `translateX(${newX}px)`;
    currentXRef.current = newX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // If direction was never determined (tap, no drag), close if open
    if (isHorizontalRef.current === null) {
      if (isOpenRef.current) snapClosed();
      return;
    }

    // Calculate velocity (px / ms). Negative = moving left.
    const elapsed  = Date.now() - touchStartMs.current;
    const totalDX  = e.changedTouches[0].clientX - dragStartXRef.current;
    const velocity = elapsed > 0 ? totalDX / elapsed : 0;

    const isQuickFlick = velocity < -VELOCITY_THRESHOLD;
    const isPastMid    = currentXRef.current < -SNAP_THRESHOLD;

    if (isPastMid || isQuickFlick) {
      snapOpen();
    } else {
      snapClosed();
    }
  }

  function handleTouchCancel() {
    // Restore whichever state was active before the cancelled gesture
    snapTo(isOpenRef.current ? -REVEAL_WIDTH : 0);
  }

  // ── Action handlers ───────────────────────────────────────────
  function handleSave() {
    snapClosed();
    setTimeout(() => saveForLater(item.productId, item.size), 350);
  }

  function handleRemove() {
    snapClosed();
    setTimeout(() => removeFromCart(item.productId, item.size), 350);
  }

  const subtotal = item.pricePerUnit * item.qty;

  return (
    // touch-action: pan-y lets vertical page scroll happen normally;
    // we call e.preventDefault() in onTouchMove only when horizontal
    <div className="relative overflow-hidden" style={{ touchAction: 'pan-y' }}>

      {/* ── Action strip (always in DOM, behind the card) ────── */}
      <div
        aria-hidden
        className="sm:hidden absolute inset-y-0 right-0 flex"
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          onClick={handleSave}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground"
        >
          <Heart size={18} strokeWidth={1.8} />
          <span className="text-[0.5rem] tracking-[0.14em] uppercase">Save</span>
        </button>

        <button
          onClick={handleRemove}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-destructive text-destructive-foreground"
        >
          <Trash2 size={18} strokeWidth={1.8} />
          <span className="text-[0.5rem] tracking-[0.14em] uppercase">Remove</span>
        </button>
      </div>

      {/* ── Draggable card ────────────────────────────────────── */}
      {/*
        Pure native touch events — no Framer Motion drag.
        We write transform directly to the DOM node so gesture
        updates happen at 60 fps without triggering React re-renders.
      */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="relative z-10 bg-background border border-border flex gap-4 p-4 select-none"
        style={{ transform: 'translateX(0)', willChange: 'transform' }}
      >
        {/* Product image → PDP */}
        <Link
          href={`/shop/${item.slug}`}
          onClick={() => { if (isOpenRef.current) snapClosed(); }}
          draggable={false}
          className="shrink-0"
        >
          <div className="relative w-20 h-26 overflow-hidden bg-muted">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="80px"
              className="object-cover"
              draggable={false}
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">

          {/* Name + unit price */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/shop/${item.slug}`}
              onClick={() => { if (isOpenRef.current) snapClosed(); }}
              draggable={false}
              className="flex-1 min-w-0"
            >
              <h3 className="text-[0.88rem] font-medium text-foreground leading-snug line-clamp-2">
                {item.name}
              </h3>
            </Link>
            <span className="text-[0.75rem] text-foreground/70 shrink-0 tabular-nums">
              ₦{item.pricePerUnit.toLocaleString()}
            </span>
          </div>

          {/* Scent family */}
          <p className="text-[0.58rem] tracking-[0.14em] uppercase text-muted-foreground truncate">
            {item.scentFamily}
          </p>

          {/* Size pill */}
          <span className="self-start inline-flex items-center h-5 px-2 border border-border text-[0.56rem] tracking-widest uppercase text-foreground/60">
            {item.size}
          </span>

          {/* Qty stepper + subtotal + desktop actions */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-1">

            {/* Stepper */}
            <div className="flex items-center">
              <button
                onClick={() => updateQty(item.productId, item.size, item.qty - 1)}
                aria-label="Decrease quantity"
                className="w-7 h-7 flex items-center justify-center border border-border text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Minus size={10} strokeWidth={2.2} />
              </button>

              <AnimatePresence mode="wait">
                <motion.span
                  key={item.qty}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="w-8 h-7 flex items-center justify-center border-t border-b border-border text-[0.78rem] tabular-nums"
                >
                  {item.qty}
                </motion.span>
              </AnimatePresence>

              <button
                onClick={() => updateQty(item.productId, item.size, item.qty + 1)}
                aria-label="Increase quantity"
                className="w-7 h-7 flex items-center justify-center border border-border text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Plus size={10} strokeWidth={2.2} />
              </button>
            </div>

            {/* Subtotal + desktop action icons */}
            <div className="flex items-center gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={subtotal}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="text-[0.84rem] font-medium text-foreground tabular-nums"
                >
                  ₦{subtotal.toLocaleString()}
                </motion.span>
              </AnimatePresence>

              {/* Desktop-only: always-visible action buttons */}
              <div className="hidden sm:flex items-center">
                <button
                  onClick={handleSave}
                  aria-label="Save for later"
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart size={14} strokeWidth={1.8} />
                </button>
                <button
                  onClick={handleRemove}
                  aria-label="Remove item"
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} strokeWidth={1.8} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
