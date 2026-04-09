'use client';

import { useEffect, useRef, useState } from 'react';

const MILESTONES = [
  {
    year: '2020',
    label: 'Founded in Lagos',
    body: 'AuraFume opened its first physical location at Balogun Tradefair Complex — a small shop with a big ambition: authentic luxury fragrance for everyone.',
  },
  {
    year: '2021',
    label: 'First 100 Customers',
    body: 'Word spread fast. Within our first year we built a loyal community of fragrance lovers who trusted our commitment to authenticity over everything.',
  },
  {
    year: '2022',
    label: 'Expanded to 100 Fragrances',
    body: 'We curated our first structured collection — 10 signature fragrances spanning florals, orientals, and bold woody accords chosen for longevity and character.',
  },
  {
    year: '2023',
    label: '1,000 Happy Customers',
    body: 'A milestone that matters. Over a thousand customers trusted AuraFume with their signature scent — each one a reaffirmation of why we do what we do.',
  },
  {
    year: '2026',
    label: 'Launched Online Store',
    body: 'Taking AuraFume nationwide. Our e-commerce platform brought the shop to every corner of Nigeria — with delivery, reviews, and the same guarantee of authenticity.',
  },
] as const;

// ── Desktop: vertical alternating timeline ────────────────────────────────────
function DesktopTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="hidden lg:block relative max-w-3xl mx-auto">
      {/* Central spine */}
      <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-border/40" />

      <div className="space-y-0">
        {MILESTONES.map((m, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={m.year}
              className={`relative flex items-start gap-0 ${
                vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{
                transitionDuration: '600ms',
                transitionDelay: `${i * 150}ms`,
                transition: 'all 0.6s ease-out',
              }}
            >
              {isLeft ? (
                <>
                  {/* Left card */}
                  <div className="w-1/2 pr-10 pb-14 text-right">
                    <p className="font-heading text-2xl text-accent mb-1">
                      {m.year}
                    </p>
                    <h3 className="font-heading text-sm tracking-widest uppercase text-foreground mb-2">
                      {m.label}
                    </h3>
                    <p className="text-[0.75rem] text-muted-foreground leading-relaxed">
                      {m.body}
                    </p>
                  </div>

                  {/* Central dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1 w-3 h-3 rounded-full border-2 border-accent bg-background z-10" />

                  {/* Right spacer */}
                  <div className="w-1/2" />
                </>
              ) : (
                <>
                  {/* Left spacer */}
                  <div className="w-1/2" />

                  {/* Central dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1 w-3 h-3 rounded-full border-2 border-accent bg-background z-10" />

                  {/* Right card */}
                  <div className="w-1/2 pl-10 pb-14">
                    <p className="font-heading text-2xl text-accent mb-1">
                      {m.year}
                    </p>
                    <h3 className="font-heading text-sm tracking-widest uppercase text-foreground mb-2">
                      {m.label}
                    </h3>
                    <p className="text-[0.75rem] text-muted-foreground leading-relaxed">
                      {m.body}
                    </p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mobile: horizontal scrollable cards ───────────────────────────────────────
function MobileTimeline() {
  return (
    <div className="lg:hidden flex gap-5 overflow-x-auto scrollbar-none pb-4 -mx-6 px-6 sm:-mx-10 sm:px-10">
      {MILESTONES.map((m, i) => (
        <div
          key={m.year}
          className="shrink-0 w-64 border border-border/60 p-6 flex flex-col gap-3"
        >
          <p className="font-heading text-3xl text-accent leading-none">
            {m.year}
          </p>
          <div className="w-8 h-px bg-accent/40" />
          <h3 className="font-heading text-xs tracking-widest uppercase text-foreground leading-snug">
            {m.label}
          </h3>
          <p className="text-[0.72rem] text-muted-foreground leading-relaxed flex-1">
            {m.body}
          </p>
          <p className="text-[0.5rem] tracking-[0.2em] text-muted-foreground/30 uppercase">
            {String(i + 1).padStart(2, '0')} /{' '}
            {String(MILESTONES.length).padStart(2, '0')}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function AboutTimeline() {
  return (
    <section className="py-24 px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16 lg:mb-20">
          <p className="text-accent text-[0.58rem] tracking-[0.38em] uppercase mb-4">
            Since 2020
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-widest uppercase text-foreground">
            Our Journey
          </h2>
        </div>

        <MobileTimeline />
        <DesktopTimeline />
      </div>
    </section>
  );
}
