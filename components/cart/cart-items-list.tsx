'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';
import CartItemCard from './cart-item-card';

// ── Empty state ───────────────────────────────────────────────────────────────

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
      <p className="text-[0.8rem] text-muted-foreground max-w-55 leading-relaxed mb-8">
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

// ── Main export ───────────────────────────────────────────────────────────────

export default function CartItemsList() {
  const { items } = useCart();

  if (items.length === 0) return <EmptyCart />;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
          In Your Cart
        </h2>
        <span className="text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground tabular-nums">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Swipe hint — mobile only */}
      <p className="sm:hidden text-[0.52rem] tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">
        Swipe left to save or remove
      </p>

      {/* Item cards */}
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
  );
}
