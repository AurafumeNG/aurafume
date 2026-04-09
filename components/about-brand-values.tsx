'use client';

import { useEffect, useRef, useState } from 'react';
import { Gem, BadgeCheck, Users, Leaf } from 'lucide-react';

const GOLD = 'oklch(0.72 0.10 74)';

const VALUES = [
  {
    icon:        Gem,
    title:       'Quality',
    description: 'We stock only the finest, fully authentic fragrances — sourced directly from authorised distributors. If we wouldn\'t wear it, we won\'t sell it.',
  },
  {
    icon:        BadgeCheck,
    title:       'Authenticity',
    description: 'Real fragrances. Real stories. Every bottle is verified genuine — because your trust is worth more than any margin.',
  },
  {
    icon:        Users,
    title:       'Accessibility',
    description: 'Luxury should not be a privilege. We keep our prices honest so that world-class scent is a choice available to everyone.',
  },
  {
    icon:        Leaf,
    title:       'Sustainability',
    description: 'Conscious luxury — we choose partners who respect sourcing ethics, minimise waste, and take responsibility for their environmental footprint.',
  },
] as const;

export default function AboutBrandValues() {
  const ref     = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="py-24 px-6 sm:px-10 lg:px-16 bg-muted/5">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-accent text-[0.58rem] tracking-[0.38em] uppercase mb-4">
            Our Principles
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-widest uppercase text-foreground">
            What We Stand For
          </h2>
        </div>

        {/* Grid */}
        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className={`border border-border/60 p-8 flex flex-col gap-5 group hover:border-accent/40 transition-all duration-300 ${
                  vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDuration: '600ms', transitionDelay: `${i * 120}ms` }}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 flex items-center justify-center border border-border/50 group-hover:border-accent/40 transition-colors duration-300"
                  style={{ color: GOLD }}
                >
                  <Icon size={20} strokeWidth={1.4} />
                </div>

                {/* Title */}
                <h3 className="font-heading text-base tracking-widest uppercase text-foreground">
                  {v.title}
                </h3>

                {/* Description */}
                <p className="text-[0.75rem] text-muted-foreground leading-relaxed tracking-wide flex-1">
                  {v.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
