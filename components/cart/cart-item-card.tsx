'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import { motion, useMotionValue, animate, AnimatePresence, type PanInfo } from 'motion/react';
import { useCart, type CartItem } from '@/components/shop/cart-context';

// Width of the revealed action strip (2 buttons × 72px)
const REVEAL_WIDTH  = 144;
const SNAP_THRESHOLD = 56; // how far left the user must drag before it snaps open

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const { removeFromCart, updateQty, saveForLater } = useCart();
  const x = useMotionValue(0);

  function snapTo(target: number) {
    animate(x, target, { type: 'spring', stiffness: 420, damping: 38 });
  }

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    // If already partially open and dragging right, close
    // If dragging left past threshold, snap open; otherwise snap closed
    const target = info.offset.x < -SNAP_THRESHOLD ? -REVEAL_WIDTH : 0;
    snapTo(target);
  }

  function closeReveal() {
    snapTo(0);
  }

  function handleSave() {
    snapTo(0);
    // small delay so the card visually closes before being removed from DOM
    setTimeout(() => saveForLater(item.productId, item.size), 180);
  }

  function handleRemove() {
    snapTo(0);
    setTimeout(() => removeFromCart(item.productId, item.size), 180);
  }

  const subtotal = item.pricePerUnit * item.qty;

  return (
    // Outer wrapper clips the action strip that sits behind the card
    <div className="relative overflow-hidden touch-pan-y">

      {/* ── Action strip (behind the draggable card) ────────────── */}
      {/* Only shown on mobile via the swipe gesture */}
      <div
        className="sm:hidden absolute right-0 top-0 bottom-0 flex"
        style={{ width: REVEAL_WIDTH }}
        aria-hidden
      >
        <button
          onClick={handleSave}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground active:opacity-80"
        >
          <Heart size={16} strokeWidth={1.8} />
          <span className="text-[0.52rem] tracking-[0.14em] uppercase">Save</span>
        </button>
        <button
          onClick={handleRemove}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-destructive text-destructive-foreground active:opacity-80"
        >
          <Trash2 size={16} strokeWidth={1.8} />
          <span className="text-[0.52rem] tracking-[0.14em] uppercase">Remove</span>
        </button>
      </div>

      {/* ── Draggable card ──────────────────────────────────────── */}
      <motion.div
        style={{ x }}
        // Drag only on mobile (sm+ will have explicit buttons)
        drag="x"
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={{ left: 0.05, right: 0.15 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        // Tapping the card when revealed snaps it closed
        onTap={() => {
          // Only close if the card is open; don't interfere with link taps
          if (x.get() < -8) closeReveal();
        }}
        className="relative z-10 bg-background border border-border flex gap-4 p-4 cursor-grab active:cursor-grabbing sm:cursor-default"
      >
        {/* Product image — links to PDP */}
        <Link
          href={`/shop/${item.slug}`}
          onClick={closeReveal}
          className="shrink-0 block"
          draggable={false}
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

        {/* Content column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">

          {/* Row: name + unit price */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/shop/${item.slug}`}
              onClick={closeReveal}
              draggable={false}
              className="flex-1 min-w-0"
            >
              <h3 className="text-[0.88rem] font-medium text-foreground leading-snug line-clamp-2">
                {item.name}
              </h3>
            </Link>
            <span className="text-[0.75rem] text-foreground/70 shrink-0 tabular-nums whitespace-nowrap">
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

          {/* Row: qty stepper + subtotal + desktop actions */}
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

            {/* Right: subtotal + desktop action buttons */}
            <div className="flex items-center gap-2">
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

              {/* Desktop-only explicit action buttons */}
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
