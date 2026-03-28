'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart, Share2, Check, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';

interface PDPNavBarProps {
  wishlisted: boolean;
  onWishlistToggle: () => void;
  productName?: string;
  productUrl?: string;
}

export default function PDPNavBar({
  wishlisted,
  onWishlistToggle,
  productName,
  productUrl,
}: PDPNavBarProps) {
  const { cartCount: _cartCount } = useCart();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Defer cartCount to client-only to avoid SSR/localStorage hydration mismatch
  const cartCount = mounted ? _cartCount : 0;
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'copied'>('idle');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleShare() {
    const url  = productUrl ?? window.location.href;
    const title = productName ? `${productName} — AuraFume` : 'AuraFume Fragrance';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback('copied');
        setTimeout(() => setShareFeedback('idle'), 2000);
      } catch {
        // clipboard not available
      }
    }
  }

  return (
    <motion.header
      className={`fixed top-0 inset-x-0 z-50 h-14 bg-background/90 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center">

        {/* Left — back to Shop */}
        <div className="flex items-center">
          <Link
            href="/shop"
            aria-label="Back to Shop"
            className="flex items-center gap-1 -ml-1 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span className="hidden sm:inline text-[0.62rem] tracking-[0.2em] uppercase">
              Shop
            </span>
          </Link>
        </div>

        {/* Center — page title */}
        <div className="flex justify-center">
          <h1 className="font-heading text-[0.9rem] tracking-[0.22em] uppercase text-foreground leading-none">
            Product Details
          </h1>
        </div>

        {/* Right — wishlist + share + cart */}
        <div className="flex items-center justify-end gap-0.5">

          {/* Wishlist toggle */}
          <motion.button
            onClick={onWishlistToggle}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={wishlisted}
            whileTap={{ scale: 0.82 }}
            className="flex items-center justify-center w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={wishlisted ? 'filled' : 'empty'}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Heart
                  size={18}
                  strokeWidth={1.8}
                  className={`transition-colors ${
                    wishlisted ? 'fill-accent text-accent' : ''
                  }`}
                />
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Share */}
          <button
            onClick={handleShare}
            aria-label={shareFeedback === 'copied' ? 'Link copied' : 'Share product'}
            className="flex items-center justify-center w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {shareFeedback === 'copied' ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-accent"
                >
                  <Check size={17} strokeWidth={2.2} />
                </motion.span>
              ) : (
                <motion.span
                  key="share"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Share2 size={17} strokeWidth={1.8} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount > 1 ? 's' : ''}` : ''}`}
            className="relative flex items-center justify-center w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ShoppingCart size={18} strokeWidth={1.8} />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] font-bold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center leading-none tabular-nums"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </motion.span>
            )}
          </Link>

        </div>
      </div>
    </motion.header>
  );
}
