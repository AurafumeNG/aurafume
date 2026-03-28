'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart, type CartItem } from '@/components/shop/cart-context';
import CartItemCard from './cart-item-card';

// ── Saved-for-later row ──────────────────────────────────────────────────────

function SavedItemRow({ item }: { item: CartItem }) {
  const { moveToCart, removeFromCart } = useCart();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      className="flex gap-4 p-4 border border-dashed border-border"
    >
      {/* Image */}
      <Link href={`/shop/${item.slug}`} className="shrink-0">
        <div className="relative w-14 h-[4.5rem] overflow-hidden bg-muted">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="56px"
            className="object-cover opacity-60"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <Link href={`/shop/${item.slug}`}>
          <p className="text-[0.82rem] font-medium text-foreground leading-snug line-clamp-1">
            {item.name}
          </p>
        </Link>
        <p className="text-[0.58rem] tracking-[0.14em] uppercase text-muted-foreground">
          {item.scentFamily}
        </p>
        <p className="text-[0.68rem] text-foreground/60 tabular-nums">
          {item.size} · ₦{item.pricePerUnit.toLocaleString()}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            onClick={() => moveToCart(item.productId, item.size)}
            className="h-7 px-3 text-[0.58rem] tracking-[0.16em] uppercase border border-foreground/40 text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Move to Cart
          </button>
          <button
            onClick={() => removeFromCart(item.productId, item.size)}
            aria-label="Remove saved item"
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      <div className="w-14 h-14 border border-border flex items-center justify-center mb-6">
        <ShoppingBag size={22} strokeWidth={1.4} className="text-muted-foreground" />
      </div>
      <h2 className="font-heading text-[1.1rem] tracking-[0.15em] uppercase text-foreground mb-2">
        Your Cart is Empty
      </h2>
      <p className="text-[0.8rem] text-muted-foreground max-w-[220px] leading-relaxed mb-8">
        Discover your signature scent and add it here.
      </p>
      <Link
        href="/shop"
        className="h-11 px-8 flex items-center justify-center text-[0.68rem] tracking-[0.22em] uppercase bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        Browse Fragrances
      </Link>
    </motion.div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
        {label}
      </h2>
      <span className="text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground tabular-nums">
        {count} {count === 1 ? 'item' : 'items'}
      </span>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function CartItemsList() {
  const { items, savedItems } = useCart();

  if (items.length === 0 && savedItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="space-y-10">

      {/* Active cart items */}
      {items.length > 0 && (
        <section>
          <SectionHeader label="In Your Cart" count={items.length} />

          {/* Swipe hint — mobile only */}
          <p className="sm:hidden text-[0.52rem] tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">
            Swipe left to save or remove
          </p>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map(item => (
                <motion.div
                  key={`${item.productId}-${item.size}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                >
                  <CartItemCard item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Saved for later */}
      {savedItems.length > 0 && (
        <section>
          <SectionHeader label="Saved for Later" count={savedItems.length} />

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {savedItems.map(item => (
                <SavedItemRow
                  key={`saved-${item.productId}-${item.size}`}
                  item={item}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

    </div>
  );
}
