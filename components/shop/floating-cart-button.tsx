'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';
import { useCart } from './cart-context';

export default function FloatingCartButton() {
  const { cartCount, lastAddedAt } = useCart();
  const controls = useAnimation();

  // Bounce when an item is added
  useEffect(() => {
    if (lastAddedAt === 0) return;
    controls.start({
      scale: [1, 1.3, 0.88, 1.12, 1],
      transition: { duration: 0.5, ease: 'easeOut' },
    });
  }, [lastAddedAt, controls]);

  return (
    <motion.div
      animate={controls}
      // Initial mount animation
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="fixed bottom-[76px] right-4 z-40 sm:bottom-6 sm:right-6"
    >
      <Link
        href="/cart"
        aria-label={`Cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background shadow-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 active:scale-95"
      >
        <ShoppingCart size={20} strokeWidth={1.8} />

        {/* Badge */}
        {cartCount > 0 && (
          <motion.span
            key={cartCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center leading-none tabular-nums"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </motion.span>
        )}
      </Link>
    </motion.div>
  );
}
