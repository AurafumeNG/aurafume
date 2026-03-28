'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface ShopNavBarProps {
  cartCount?: number;
  onSearchOpen?: () => void;
}

export default function ShopNavBar({ cartCount = 0, onSearchOpen }: ShopNavBarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

        {/* Left — back arrow (mobile) · logo (desktop) */}
        <div className="flex items-center">
          {/* Mobile: back button */}
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="sm:hidden flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={22} strokeWidth={1.8} />
          </button>

          {/* Desktop: logo */}
          <Link href="/" className="hidden sm:block">
            <Image
              src="/logo/aurafumeng-logo.png"
              alt="AuraFume"
              width={110}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center — page title */}
        <div className="flex justify-center">
          <h1 className="font-heading text-[0.9rem] tracking-[0.22em] uppercase text-foreground leading-none">
            Shop
          </h1>
        </div>

        {/* Right — search + cart */}
        <div className="flex items-center justify-end gap-3.5">
          <button
            onClick={onSearchOpen}
            aria-label="Search"
            className="flex items-center justify-center w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
          >
            <Search size={18} strokeWidth={1.8} />
          </button>

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
