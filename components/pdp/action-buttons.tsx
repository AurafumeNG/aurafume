'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';

interface ActionButtonsProps {
  productId: string;
  productSlug: string;
  selectedSize: string;
  quantity: number;
  isOutOfStock: boolean;
}

export default function ActionButtons({
  productId,
  productSlug,
  selectedSize,
  quantity,
  isOutOfStock,
}: ActionButtonsProps) {
  const { addToCart } = useCart();
  const router        = useRouter();
  const [addState, setAddState] = useState<'idle' | 'added'>('idle');

  function handleAddToCart() {
    if (isOutOfStock || addState === 'added') return;
    addToCart(productId, selectedSize, quantity);
    setAddState('added');
    setTimeout(() => setAddState('idle'), 2000);
  }

  function handleBuyNow() {
    if (isOutOfStock) return;
    addToCart(productId, selectedSize, quantity);
    router.push('/cart');
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Add to Cart */}
      <motion.button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        whileTap={!isOutOfStock ? { scale: 0.97 } : undefined}
        className={`relative w-full h-14 flex items-center justify-center gap-2.5 text-[0.72rem] tracking-[0.25em] uppercase font-medium transition-all duration-300 ${
          isOutOfStock
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : addState === 'added'
              ? 'bg-foreground text-background'
              : 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.97]'
        }`}
      >
        <AnimatePresence mode="wait">
          {addState === 'added' ? (
            <motion.span
              key="added"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <Check size={16} strokeWidth={2.5} />
              Added to Cart
            </motion.span>
          ) : isOutOfStock ? (
            <motion.span
              key="oos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2.5"
            >
              Out of Stock
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <ShoppingBag size={16} strokeWidth={1.8} />
              Add to Cart
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Buy Now */}
      <motion.button
        onClick={handleBuyNow}
        disabled={isOutOfStock}
        whileTap={!isOutOfStock ? { scale: 0.97 } : undefined}
        className={`w-full h-14 flex items-center justify-center gap-2.5 text-[0.72rem] tracking-[0.25em] uppercase font-medium border transition-all duration-200 ${
          isOutOfStock
            ? 'border-border text-foreground/20 cursor-not-allowed'
            : 'border-foreground text-foreground hover:bg-foreground hover:text-background'
        }`}
      >
        <Zap size={15} strokeWidth={1.8} />
        Buy Now
      </motion.button>

    </div>
  );
}
