'use client';

import { useState, useEffect, type RefObject } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';

interface StickyActionBarProps {
  price: number;
  quantity: number;
  productId: string;
  selectedSize: string;
  isOutOfStock: boolean;
  observeRef: RefObject<HTMLDivElement | null>;
}

export default function StickyActionBar({
  price,
  quantity,
  productId,
  selectedSize,
  isOutOfStock,
  observeRef,
}: StickyActionBarProps) {
  const { addToCart } = useCart();
  const [mounted, setMounted]       = useState(false);
  const [actionInView, setActionInView] = useState(true); // assume in view until observed
  const [addState, setAddState]     = useState<'idle' | 'added'>('idle');

  // Slide in after a short delay so it doesn't flash immediately on load
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Watch whether the main action buttons are visible
  useEffect(() => {
    const el = observeRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActionInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [observeRef]);

  function handleAdd() {
    if (isOutOfStock || addState === 'added') return;
    addToCart(productId, selectedSize, quantity);
    setAddState('added');
    setTimeout(() => setAddState('idle'), 2000);
  }

  const visible = mounted && !actionInView && !isOutOfStock;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-bar"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          // sits above bottom nav on mobile (h-16 = 64px), flush to bottom on desktop
          className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-5 sm:px-8 py-3">

            {/* Price block */}
            <div>
              <p className="text-[0.55rem] tracking-[0.2em] uppercase text-muted-foreground leading-none mb-1">
                {quantity > 1 ? `${quantity} × ₦${price.toLocaleString()}` : 'Price'}
              </p>
              <motion.p
                key={price * quantity}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[1.05rem] font-medium text-foreground leading-none"
              >
                ₦{(price * quantity).toLocaleString()}
              </motion.p>
            </div>

            {/* Add to cart */}
            <motion.button
              onClick={handleAdd}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 max-w-[200px] h-11 flex items-center justify-center gap-2 text-[0.68rem] tracking-[0.22em] uppercase font-medium transition-colors duration-200 ${
                addState === 'added'
                  ? 'bg-foreground text-background'
                  : 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <AnimatePresence mode="wait">
                {addState === 'added' ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    Added
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingBag size={14} strokeWidth={1.8} />
                    Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
