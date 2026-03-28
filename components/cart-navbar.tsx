'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';

export default function CartNavBar() {
  const router = useRouter();
  const { cartCount } = useCart();
  const [scrolled, setScrolled]           = useState(false);
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleShare() {
    const url   = typeof window !== 'undefined' ? window.location.href : '';
    const title = 'My AuraFume Cart';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback('copied');
        setTimeout(() => setShareFeedback('idle'), 2000);
      } catch {
        // clipboard unavailable
      }
    }
  }

  const itemLabel = cartCount === 1 ? '1 item' : `${cartCount} items`;

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

        {/* Left — back */}
        <div className="flex items-center">
          {/* Mobile: router.back() */}
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="sm:hidden flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>

          {/* Desktop: back to Shop with label */}
          <Link
            href="/shop"
            aria-label="Back to Shop"
            className="hidden sm:flex items-center gap-1 -ml-1 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span className="text-[0.62rem] tracking-[0.2em] uppercase">
              Shop
            </span>
          </Link>
        </div>

        {/* Center — title + item count */}
        <div className="flex flex-col items-center justify-center gap-0.5">
          <h1 className="font-heading text-[0.9rem] tracking-[0.22em] uppercase text-foreground leading-none">
            My Cart
          </h1>

          <AnimatePresence mode="wait">
            {cartCount > 0 ? (
              <motion.p
                key={cartCount}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
                className="text-[0.52rem] tracking-[0.18em] uppercase text-muted-foreground leading-none tabular-nums"
              >
                {itemLabel}
              </motion.p>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[0.52rem] tracking-[0.18em] uppercase text-muted-foreground leading-none"
              >
                Empty
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right — share */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleShare}
            aria-label={shareFeedback === 'copied' ? 'Cart link copied' : 'Share cart'}
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
        </div>

      </div>
    </motion.header>
  );
}
