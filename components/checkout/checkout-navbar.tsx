'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function CheckoutNavBar() {
  const router  = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 h-14 bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      <div className="h-full max-w-2xl mx-auto px-4 sm:px-8 grid grid-cols-3 items-center">

        {/* Left — back to cart */}
        <div className="flex items-center">
          {/* Mobile: browser back */}
          <button
            onClick={() => router.back()}
            aria-label="Back to cart"
            className="sm:hidden flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>

          {/* Desktop: explicit link with label */}
          <Link
            href="/cart"
            aria-label="Return to cart"
            className="hidden sm:flex items-center gap-1 -ml-1 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={20}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span className="text-[0.62rem] tracking-[0.2em] uppercase">
              Cart
            </span>
          </Link>
        </div>

        {/* Center — page title only, no subtitle */}
        <div className="flex items-center justify-center">
          <h1 className="font-heading text-[0.9rem] tracking-[0.22em] uppercase text-foreground leading-none">
            Checkout
          </h1>
        </div>

        {/* Right — lock icon (security signal, not interactive) */}
        <div className="flex items-center justify-end">
          <span
            aria-label="Secure checkout"
            className="flex items-center justify-center w-9 h-9 text-muted-foreground/60"
          >
            <Lock size={15} strokeWidth={1.7} />
          </span>
        </div>

      </div>
    </motion.header>
  );
}
