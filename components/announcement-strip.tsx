'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const messages = [
  {
    text: 'Free shipping on all orders over ₦50,000',
    cta: 'Shop Now',
    href: '/shop',
  },
  {
    text: 'New arrivals just dropped — explore the latest collection',
    cta: 'View New',
    href: '/collections',
  },
  {
    text: 'Use code AURA15 for 15% off your first order',
    cta: 'Claim Offer',
    href: '/shop',
  },
];

export default function AnnouncementStrip({ onDismiss }: { onDismiss: () => void }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true); // controls fade
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function advance() {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % messages.length);
      setVisible(true);
    }, 300);
  }

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(advance, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  function handleDismiss() {
    sessionStorage.setItem('announcement-dismissed', '1');
    onDismiss();
  }

  const msg = messages[index];

  return (
    <div
      className="relative w-full flex items-center justify-center border-b border-[#C6A77B]/20"
      style={{ height: 36, backgroundColor: '#111111' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Message */}
      <div
        className="flex items-center gap-2.5 px-10 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span
          className="text-[#C6A77B] uppercase tracking-[0.1em] leading-none"
          style={{ fontSize: 12 }}
        >
          {msg.text}
        </span>

        <span className="text-[#C6A77B]/30 text-[10px] leading-none select-none">·</span>

        <Link
          href={msg.href}
          className="text-[#C6A77B] uppercase tracking-[0.1em] underline underline-offset-2 decoration-[#C6A77B]/40 hover:decoration-[#C6A77B] transition-all leading-none shrink-0"
          style={{ fontSize: 12 }}
        >
          {msg.cta}
        </Link>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-4 text-[#C6A77B]/50 hover:text-[#C6A77B] transition-colors"
      >
        <X size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}
