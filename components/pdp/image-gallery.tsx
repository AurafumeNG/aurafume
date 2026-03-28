'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  badge?: string;
}

const BADGE_STYLES: Record<string, string> = {
  'New':         'bg-accent text-accent-foreground',
  'Best Seller': 'bg-primary text-primary-foreground',
  'Low Stock':   'bg-destructive/80 text-white',
};

const SWIPE_THRESHOLD  = 50;
const DOUBLE_TAP_DELAY = 320; // ms

export default function ImageGallery({ images, productName, badge }: ImageGalleryProps) {
  const [[index, direction], setPage] = useState([0, 0]);
  const [isZoomed, setIsZoomed]       = useState(false);
  const lastTapAt = useRef(0);

  const clampedIndex = Math.max(0, Math.min(index, images.length - 1));

  const navigate = useCallback((newIndex: number, dir: number) => {
    setIsZoomed(false);
    setPage([newIndex, dir]);
  }, []);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (isZoomed) return;
    if (info.offset.x < -SWIPE_THRESHOLD && clampedIndex < images.length - 1) {
      navigate(clampedIndex + 1, 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && clampedIndex > 0) {
      navigate(clampedIndex - 1, -1);
    }
  }

  function handleImageTap() {
    const now = Date.now();
    if (now - lastTapAt.current < DOUBLE_TAP_DELAY) {
      setIsZoomed(z => !z);
    }
    lastTapAt.current = now;
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  return (
    <div className="flex flex-col gap-3">

      {/* ── Main carousel ────────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-card select-none">

        {/* Slides */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={clampedIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            drag={isZoomed ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            onClick={handleImageTap}
            className="absolute inset-0 cursor-zoom-in touch-pan-y"
            style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
          >
            <motion.div
              className="w-full h-full"
              animate={{ scale: isZoomed ? 2.2 : 1 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              style={{ transformOrigin: 'center center' }}
            >
              <Image
                src={images[clampedIndex]}
                alt={`${productName} — view ${clampedIndex + 1}`}
                fill
                priority={clampedIndex === 0}
                className="object-cover object-center pointer-events-none"
                sizes="(max-width: 768px) 100vw, 50vw"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Badge */}
        {badge && (
          <span className={`absolute top-4 left-4 z-10 text-[0.58rem] tracking-[0.18em] uppercase px-3 py-1.5 ${BADGE_STYLES[badge] ?? ''}`}>
            {badge}
          </span>
        )}

        {/* Zoom hint */}
        <AnimatePresence>
          {isZoomed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-foreground/60 text-background text-[0.58rem] tracking-[0.18em] uppercase px-3 py-1.5 backdrop-blur-sm pointer-events-none"
            >
              Double tap to zoom out
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
          {images.map((_, i) => (
            <motion.span
              key={i}
              animate={{ width: i === clampedIndex ? 16 : 6, opacity: i === clampedIndex ? 1 : 0.4 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="h-[3px] rounded-full bg-white"
            />
          ))}
        </div>

        {/* Arrow buttons (desktop) */}
        {clampedIndex > 0 && (
          <button
            onClick={() => navigate(clampedIndex - 1, -1)}
            aria-label="Previous image"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-background/70 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {clampedIndex < images.length - 1 && (
          <button
            onClick={() => navigate(clampedIndex + 1, 1)}
            aria-label="Next image"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center bg-background/70 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Counter (mobile) */}
        <div className="absolute top-4 right-4 z-10 sm:hidden bg-foreground/40 backdrop-blur-sm text-white text-[0.6rem] tracking-[0.12em] tabular-nums px-2 py-0.5">
          {clampedIndex + 1} / {images.length}
        </div>
      </div>

      {/* ── Thumbnail strip (desktop only) ───────────────────────── */}
      <div className="hidden sm:flex gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => navigate(i, i > clampedIndex ? 1 : -1)}
            aria-label={`View image ${i + 1}`}
            aria-current={i === clampedIndex}
            className={`relative shrink-0 w-16 h-20 overflow-hidden transition-all duration-200 ${
              i === clampedIndex
                ? 'ring-1 ring-foreground'
                : 'opacity-50 hover:opacity-80'
            }`}
          >
            <Image
              src={src}
              alt={`${productName} thumbnail ${i + 1}`}
              fill
              className="object-cover object-center"
              sizes="64px"
            />
          </button>
        ))}
      </div>

    </div>
  );
}
