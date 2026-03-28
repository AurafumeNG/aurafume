'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Star, ShieldCheck } from 'lucide-react';

// ── Data ────────────────────────────────────────────────────────────
interface Review {
  id: number;
  name: string;
  initials: string;
  rating: number;
  quote: string;
  product: string;
  productHref: string;
  verified: boolean;
}

const reviews: Review[] = [
  {
    id: 1,
    name: 'Adaeze O.',
    initials: 'AO',
    rating: 5,
    quote:
      "I've never received so many compliments on a fragrance. Loving You Frozen is everything — warm, mysterious, and completely addictive. My bottle barely lasts a month.",
    product: 'Loving You Frozen',
    productHref: '/shop/loving-you-frozen',
    verified: true,
  },
  {
    id: 2,
    name: 'Emeka T.',
    initials: 'ET',
    rating: 5,
    quote:
      'Stronger For You Intense is the scent I did not know I needed. Incredibly long-lasting — I sprayed once in the morning and was still getting compliments at midnight.',
    product: 'Stronger For You Intense',
    productHref: '/shop/stronger-for-you-intense',
    verified: true,
  },
  {
    id: 3,
    name: 'Chisom B.',
    initials: 'CB',
    rating: 4,
    quote:
      "Al Oud is in a class of its own. Rich, smoky, and deeply refined. I wear it for every important meeting — it just commands presence in a way no other fragrance does.",
    product: 'Al Oud',
    productHref: '/shop/al-oud',
    verified: true,
  },
  {
    id: 4,
    name: 'Funmi A.',
    initials: 'FA',
    rating: 5,
    quote:
      "Bought Re'ad Lux on a whim and it became my signature within a week. Light enough for day, sophisticated enough for evenings. Perfectly Nigerian and perfectly global.",
    product: "Re'ad Lux",
    productHref: '/shop/read-lux',
    verified: true,
  },
  {
    id: 5,
    name: 'Tunde W.',
    initials: 'TW',
    rating: 5,
    quote:
      "Suger EDP surprised me — I expected sweet but got something far more complex. Fresh, warm, and deeply personal. AuraFume gets scent in a way most brands simply don't.",
    product: 'Suger EDP',
    productHref: '/shop/suger-edp',
    verified: true,
  },
];

const N = reviews.length;

// ── Star rating ─────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          strokeWidth={1.5}
          className={i < rating ? 'fill-accent text-accent' : 'fill-none text-foreground/15'}
        />
      ))}
    </div>
  );
}

// ── Review card ─────────────────────────────────────────────────────
function ReviewCard({ review, active }: { review: Review; active: boolean }) {
  return (
    <div
      className="flex flex-col h-full bg-background border border-border p-7 sm:p-8 transition-all duration-500 ease-out"
      style={{
        transform: active ? 'scale(1.02)' : 'scale(0.97)',
        opacity: active ? 1 : 0.45,
      }}
    >
      {/* Stars + verified */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <StarRating rating={review.rating} />
        {review.verified && (
          <div className="flex items-center gap-1.5 shrink-0">
            <ShieldCheck size={11} className="text-accent" />
            <span className="text-[0.55rem] tracking-[0.2em] uppercase text-accent">
              Verified Buyer
            </span>
          </div>
        )}
      </div>

      {/* Quote mark + body */}
      <div className="flex-1 mb-7">
        <span
          className="block font-heading text-[3.5rem] leading-none text-accent/25 -mt-2 mb-1 select-none"
          aria-hidden
        >
          &ldquo;
        </span>
        <p className="text-foreground/70 text-[0.88rem] leading-relaxed">
          {review.quote}
        </p>
      </div>

      {/* Avatar + name + product link */}
      <div className="flex items-center gap-3 pt-6 border-t border-border">
        <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
          <span className="text-[0.62rem] tracking-[0.08em] font-medium text-accent">
            {review.initials}
          </span>
        </div>
        <div>
          <p className="text-[0.8rem] font-medium text-foreground leading-none mb-1">
            {review.name}
          </p>
          <Link
            href={review.productHref}
            className="text-[0.6rem] tracking-[0.15em] uppercase text-muted-foreground hover:text-accent transition-colors duration-200"
          >
            {review.product}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────
const RESUME_DELAY = 6000;

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);

  // 3 visible indices: prev · active · next (circular)
  const prevIdx = (active - 1 + N) % N;
  const nextIdx = (active + 1) % N;

  // ── Auto-play ─────────────────────────────────────────────────────
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((p) => (p + 1) % N), 5000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(
    () => () => { if (pauseTimer.current) clearTimeout(pauseTimer.current); },
    [],
  );

  // ── Interaction helpers ───────────────────────────────────────────
  function pauseTemporarily() {
    setPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), RESUME_DELAY);
  }

  function navigate(dir: 'prev' | 'next') {
    pauseTemporarily();
    setActive((p) => dir === 'next' ? (p + 1) % N : (p - 1 + N) % N);
  }

  // ── Swipe ─────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    navigate(diff > 0 ? 'next' : 'prev');
  }

  return (
    <section
      className="bg-card py-20 md:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-accent text-[0.62rem] tracking-[0.35em] uppercase mb-3">
              Customer Stories
            </p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-tight">
              What Our Customers Say
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('prev')}
              aria-label="Previous review"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground/50 hover:border-accent hover:text-accent transition-all duration-200"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => navigate('next')}
              aria-label="Next review"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground/50 hover:border-accent hover:text-accent transition-all duration-200"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 3-card stage */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Prev — hidden on mobile */}
          <div className="hidden md:block">
            <ReviewCard review={reviews[prevIdx]} active={false} />
          </div>

          {/* Active — always visible */}
          <ReviewCard review={reviews[active]} active={true} />

          {/* Next — hidden on mobile */}
          <div className="hidden md:block">
            <ReviewCard review={reviews[nextIdx]} active={false} />
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => { pauseTemporarily(); setActive(i); }}
              aria-label={`Go to review ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-5 h-1.5 bg-accent'
                  : 'w-1.5 h-1.5 bg-foreground/20 hover:bg-foreground/40'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
