'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function AboutBrandStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[680px]">

      {/* ── Left: editorial image ── */}
      <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
        <Image
          src="/images/image7.jpeg"
          alt="AuraFume — the craft of luxury fragrance"
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {/* Subtle right feather on desktop */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-background" />
      </div>

      {/* ── Right: text panel ── */}
      <div
        ref={ref}
        className={`flex items-center px-8 py-16 sm:px-12 lg:px-16 xl:px-20 bg-background transition-all duration-800 ease-out ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`}
        style={{ transitionDuration: '700ms' }}
      >
        <div className="max-w-lg">
          {/* Eyebrow */}
          <div className="flex items-center gap-4 mb-7">
            <span className="block h-px w-8 bg-accent shrink-0" />
            <p className="text-accent text-[0.58rem] tracking-[0.35em] uppercase">
              Who We Are
            </p>
          </div>

          {/* Heading */}
          <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-[1.1] mb-8">
            A scent house
            <br />
            built on <em className="not-italic text-accent">truth</em>
          </h2>

          {/* Body copy */}
          <div className="space-y-5 text-[0.85rem] text-muted-foreground leading-relaxed mb-10">
            <p>
              AuraFume was founded in 2020 in the heart of Lagos by fragrance lovers who were tired
              of choosing between authenticity and affordability. The luxury fragrance market had
              long been out of reach for most Nigerians — we changed that.
            </p>
            <p>
              We source directly from authorised distributors and brands, cutting out the layers of
              middlemen that inflate prices beyond reason. Every bottle on our shelves is genuine.
              Every fragrance we sell is one we&apos;d wear ourselves — that&apos;s our only
              standard.
            </p>
            <p>
              Our mission is simple: to make world-class fragrance accessible to anyone with the
              taste to appreciate it. We believe scent is the most personal form of self-expression,
              and everyone deserves a signature that&apos;s entirely their own.
            </p>

            {/* Mission callout */}
            <blockquote className="border-l-2 border-accent pl-5 py-1 mt-2">
              <p className="text-foreground/75 text-[0.9rem] italic leading-relaxed">
                &ldquo;Our vision is a Nigeria where luxury fragrance is not a privilege,
                but a choice — available to every person who values what they leave
                behind in a room.&rdquo;
              </p>
            </blockquote>
          </div>

          {/* Divider with founding detail */}
          <div className="flex items-center gap-5 pt-8 border-t border-border/40">
            <div>
              <p className="font-heading text-2xl text-foreground leading-none mb-1">2020</p>
              <p className="text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground/50">
                Founded in Lagos
              </p>
            </div>
            <div className="w-px h-10 bg-border/50 shrink-0" />
            <div>
              <p className="font-heading text-2xl text-foreground leading-none mb-1">100%</p>
              <p className="text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground/50">
                Authentic Fragrances
              </p>
            </div>
            <div className="w-px h-10 bg-border/50 shrink-0" />
            <div>
              <p className="font-heading text-2xl text-foreground leading-none mb-1">NG</p>
              <p className="text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground/50">
                Born &amp; Operated
              </p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
