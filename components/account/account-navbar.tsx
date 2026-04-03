'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface AccountNavBarProps {
  title?: string;
}

export default function AccountNavBar({ title = 'My Account' }: AccountNavBarProps) {
  const router = useRouter();
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
      <div className="h-full max-w-xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center">

        {/* Left — back */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>
        </div>

        {/* Center — title */}
        <div className="flex items-center justify-center">
          <h1 className="font-heading text-[0.88rem] tracking-[0.22em] uppercase text-foreground leading-none">
            {title}
          </h1>
        </div>

        {/* Right — settings */}
        <div className="flex items-center justify-end">
          <Link
            href="/account/settings"
            aria-label="Account settings"
            className="flex items-center justify-center w-9 h-9 text-foreground/60 hover:text-foreground transition-colors"
          >
            <Settings size={17} strokeWidth={1.7} />
          </Link>
        </div>

      </div>
    </motion.header>
  );
}
