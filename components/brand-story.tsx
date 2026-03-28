'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// ── Count-up hook ──────────────────────────────────────────────────
function useCountUp(
  target: number,
  duration: number,
  active: boolean,
  delay: number = 0,
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      function step(ts: number) {
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [active, target, duration, delay]);

  return count;
}

// ── Stat counter ───────────────────────────────────────────────────
interface StatDef {
  value: number;
  suffix: string;
  label: string;
}

const stats: StatDef[] = [
  { value: 500,   suffix: '+', label: 'Fragrances'      },
  { value: 10000, suffix: '+', label: 'Happy Customers' },
  { value: 100,   suffix: '%', label: 'Authentic'       },
];

function StatCounter({
  stat,
  active,
  delay,
}: {
  stat: StatDef;
  active: boolean;
  delay: number;
}) {
  const count = useCountUp(stat.value, 1600, active, delay);
  const display = count >= 1000 ? count.toLocaleString('en-NG') : count;

  return (
    <div className="flex flex-col gap-2">
      <p className="font-heading text-[clamp(1.7rem,3vw,2.4rem)] text-primary-foreground leading-none">
        {display}{stat.suffix}
      </p>
      <p className="text-primary-foreground/40 text-[0.58rem] tracking-[0.28em] uppercase">
        {stat.label}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function BrandStory() {
  const textRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-primary grid grid-cols-1 lg:grid-cols-2 lg:min-h-[700px]">

      {/* ── Left: full-bleed image ── */}
      <div className="relative aspect-[4/3] lg:aspect-auto">
        <Image
          src="/images/image6.jpeg"
          alt="AuraFume — a statement, not just a scent"
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {/* Subtle right-edge feather to blend into text panel on desktop */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-primary" />
      </div>

      {/* ── Right: text panel ── */}
      <div className="bg-primary flex items-center px-8 py-14 sm:px-12 lg:px-16 lg:py-24">
        {/* Slide-in wrapper — observed for IntersectionObserver */}
        <div
          ref={textRef}
          className={`flex flex-col max-w-lg transition-all duration-700 ease-out ${
            visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
          }`}
        >

          {/* Eyebrow */}
          <div className="flex items-center gap-4 mb-7">
            <span className="block h-px w-8 bg-accent shrink-0" />
            <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase">
              Our Philosophy
            </p>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-[clamp(2.2rem,4.5vw,3.6rem)] text-primary-foreground leading-[1.05] mb-8">
            Scent is not a
            <br />
            luxury — it is
            <br />
            <em className="not-italic text-accent">an identity.</em>
          </h2>

          {/* Body copy */}
          <div className="flex flex-col gap-4 text-primary-foreground/55 text-[0.9rem] leading-relaxed mb-10">
            <p>
              At AuraFume, we believe fragrance is the most intimate form
              of self-expression. Every note we choose is deliberate — an
              invisible signature that speaks before you do.
            </p>
            <p>
              Born in Lagos, worn worldwide. We source the rarest botanicals
              and ancient resins, then craft them into something unmistakably
              Nigerian — bold, warm, and deeply human.
            </p>
            <p>
              Every bottle we release carries a single promise: that you
              will never go unnoticed.
            </p>
          </div>

          {/* CTA — animated underline */}
          <Link
            href="/about"
            className="group relative self-start inline-flex items-center gap-2.5 text-primary-foreground/70 hover:text-primary-foreground text-[0.72rem] tracking-[0.22em] uppercase transition-colors duration-300 pb-1"
          >
            Read Our Story
            {/* Base underline */}
            <span className="absolute bottom-0 left-0 h-px w-full bg-primary-foreground/15" />
            {/* Animated gold underline */}
            <span className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full" />
            <ArrowRight
              size={13}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>

          {/* ── Stats ── */}
          <div
            className={`grid grid-cols-3 gap-6 mt-12 pt-10 border-t border-primary-foreground/10 transition-all duration-700 ease-out delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {stats.map((stat, i) => (
              <StatCounter
                key={stat.label}
                stat={stat}
                active={visible}
                delay={i * 180}
              />
            ))}
          </div>

        </div>
      </div>

    </section>
  );
}
