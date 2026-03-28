'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import {
  motion,
  useMotionValue,
  animate,
  AnimatePresence,
  type PanInfo,
} from 'motion/react';
import { useCart, type CartItem } from '@/components/shop/cart-context';

const REVEAL_WIDTH   = 144; // 72px per button × 2
const SNAP_THRESHOLD = 52;  // minimum drag (px) to snap open
const QUICK_SWIPE_V  = -350; // px/s — velocity to treat as intentional swipe

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const { removeFromCart, updateQty, saveForLater } = useCart();

  const x = useMotionValue(0);

  // Track open state in a ref so it's never stale in event closures
  const isOpenRef = useRef(false);

  // Clamp x within [−REVEAL_WIDTH, 0] during drag (no dragConstraints used)
  function handleDrag() {
    const cur = x.get();
    if (cur > 0)             x.set(0);
    if (cur < -REVEAL_WIDTH) x.set(-REVEAL_WIDTH);
  }

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    // Project from wherever the card was before this gesture started
    const base      = isOpenRef.current ? -REVEAL_WIDTH : 0;
    const projected = Math.min(0, Math.max(-REVEAL_WIDTH, base + info.offset.x));

    const shouldReveal = projected < -SNAP_THRESHOLD || info.velocity.x < QUICK_SWIPE_V;
    isOpenRef.current  = shouldReveal;

    // Defer so Framer's internal drag-end cleanup finishes first,
    // preventing its internal spring from overriding our animate() call
    requestAnimationFrame(() => {
      animate(x, shouldReveal ? -REVEAL_WIDTH : 0, {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      });
    });
  }

  function snapClosed() {
    isOpenRef.current = false;
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
  }

  function handleSave() {
    snapClosed();
    setTimeout(() => saveForLater(item.productId, item.size), 220);
  }

  function handleRemove() {
    snapClosed();
    setTimeout(() => removeFromCart(item.productId, item.size), 220);
  }

  const subtotal = item.pricePerUnit * item.qty;

  return (
    <div
      className="relative overflow-hidden"
      // pan-y lets the page scroll vertically while we capture horizontal drag
      style={{ touchAction: 'pan-y' }}
    >
      {/* ── Action strip ─────────────────────────────────────────── */}
      {/* Absolute behind the card; revealed when card slides left. Mobile only. */}
      <div
        aria-hidden
        className="sm:hidden absolute right-0 top-0 bottom-0 flex"
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          onClick={handleSave}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground active:brightness-95"
        >
          <Heart size={17} strokeWidth={1.8} />
          <span className="text-[0.5rem] tracking-[0.14em] uppercase">Save</span>
        </button>

        <button
          onClick={handleRemove}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-destructive text-destructive-foreground active:brightness-95"
        >
          <Trash2 size={17} strokeWidth={1.8} />
          <span className="text-[0.5rem] tracking-[0.14em] uppercase">Remove</span>
        </button>
      </div>

      {/* ── Draggable card ──────────────────────────────────────── */}
      <motion.div
        style={{ x }}
        drag="x"
        // No dragConstraints — we clamp in onDrag so there is no
        // internal correction spring that can fight our animate() call
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        // Tapping the card while open closes it
        onTap={() => { if (isOpenRef.current) snapClosed(); }}
        className="relative z-10 bg-background border border-border flex gap-4 p-4 cursor-grab active:cursor-grabbing sm:cursor-default"
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
                  className="w-8 h-7 flex items-center justify-center border-t border-b border-border text-[0.78rem] tabular-nums select-none"
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

              {/* Desktop-only explicit buttons */}
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
      </motion.div>
    </div>
  );
}
