'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, type CartItem } from '@/components/shop/cart-context';

// ── Individual saved card ──────────────────────────────────────────────────────

function SavedCard({ item }: { item: CartItem }) {
  const { moveToCart, removeFromCart } = useCart();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative shrink-0 w-36 border border-border bg-background flex flex-col"
    >
      {/* Remove button */}
      <button
        onClick={() => removeFromCart(item.productId, item.size)}
        aria-label={`Remove ${item.name} from saved`}
        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 flex items-center justify-center bg-background/80 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        <X size={9} strokeWidth={2.5} />
      </button>

      {/* Image */}
      <Link href={`/shop/${item.slug}`} className="block shrink-0">
        <div className="relative w-full h-28 bg-muted overflow-hidden">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="144px"
            className="object-cover"
            draggable={false}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2.5 flex-1">
        <Link href={`/shop/${item.slug}`} className="block">
          <p className="text-[0.7rem] font-medium text-foreground leading-snug line-clamp-2">
            {item.name}
          </p>
        </Link>
        <p className="text-[0.58rem] tracking-[0.1em] text-muted-foreground uppercase truncate">
          {item.size}
        </p>
        <p className="text-[0.72rem] font-medium text-foreground tabular-nums mt-0.5">
          ₦{item.pricePerUnit.toLocaleString()}
        </p>

        {/* Move to cart */}
        <button
          onClick={() => moveToCart(item.productId, item.size)}
          className="mt-auto pt-2 w-full h-8 flex items-center justify-center gap-1.5 text-[0.58rem] tracking-[0.18em] uppercase bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ShoppingBag size={11} strokeWidth={1.8} />
          Move to Cart
        </button>
      </div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function SavedForLater() {
  const { savedItems } = useCart();

  if (savedItems.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
          Saved for Later
        </h2>
        <span className="text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground tabular-nums">
          {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 sm:-mx-8 sm:px-8 scrollbar-none">
        <AnimatePresence initial={false}>
          {savedItems.map(item => (
            <SavedCard key={`${item.productId}-${item.size}`} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
