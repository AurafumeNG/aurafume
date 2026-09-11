'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number, active: boolean, delay = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      const start = performance.now();
      function step(ts: number) {
        const progress = Math.min((ts - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(id);
  }, [active, target, duration, delay]);

  return count;
}

// ── Stat ──────────────────────────────────────────────────────────────────────
function Stat({
  value,
  suffix,
  label,
  sublabel,
  active,
  delay,
}: {
  value:    number;
  suffix:   string;
  label:    string;
  sublabel: string;
  active:   boolean;
  delay:    number;
}) {
  const count   = useCountUp(value, 1800, active, delay);
  const display = count >= 1000 ? count.toLocaleString('en-NG') : count;

  return (
    <div className="flex flex-col items-center text-center gap-3 px-8 py-12 sm:py-16">
      <p className="font-heading text-[clamp(3.5rem,8vw,6rem)] text-primary-foreground leading-none">
        {display}
        <span className="text-accent">{suffix}</span>
      </p>
      <p className="font-heading text-base sm:text-lg tracking-widest uppercase text-primary-foreground/80">
        {label}
      </p>
      <p className="text-[0.68rem] text-primary-foreground/35 tracking-wide max-w-[14rem]">
        {sublabel}
      </p>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export interface SocialProofStats {
  customerCount: number;
  productCount:  number;
}

export default function AboutSocialProof({ stats }: { stats: SocialProofStats }) {
  const ref     = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  const STATS = [
    {
      value:    stats.customerCount,
      // Only round up to a "+" once the number is large enough for it to mean something
      suffix:   stats.customerCount >= 100 ? '+' : '',
      label:    'Happy Customers',
      sublabel: 'Nigerians who trust us with their signature scent',
    },
    {
      value:    stats.productCount,
      suffix:   '',
      label:    'Signature Fragrances',
      sublabel: 'Carefully curated, fully authenticated, ready to wear',
    },
  ];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Subtle background texture */}
      <Image
        src="/images/image9.jpeg"
        alt=""
        fill
        className="object-cover object-center opacity-10"
        aria-hidden
      />
      <div className="absolute inset-0 bg-primary/80" />

      {/* Gold top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-accent/30" />

      <div
        ref={ref}
        className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-primary-foreground/10"
      >
        {STATS.map((s, i) => (
          <Stat
            key={s.label}
            value={s.value}
            suffix={s.suffix}
            label={s.label}
            sublabel={s.sublabel}
            active={vis}
            delay={i * 250}
          />
        ))}
      </div>

      {/* Gold bottom accent */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-accent/30" />
    </section>
  );
}
