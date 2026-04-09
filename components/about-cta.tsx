import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

export default function AboutCta() {
  return (
    <section className="relative overflow-hidden min-h-[520px] flex items-center">
      {/* Background image */}
      <Image
        src="/images/image11.jpeg"
        alt="AuraFume luxury fragrance collection"
        fill
        className="object-cover object-center"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/88 via-foreground/65 to-foreground/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

      {/* Gold top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-accent/40" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24">
        <div className="max-w-xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-4 mb-8">
            <span className="block h-px w-8 bg-accent/70 shrink-0" />
            <p className="text-accent text-[0.58rem] tracking-[0.38em] uppercase">
              The Collection
            </p>
          </div>

          {/* Heading */}
          <h2 className="font-heading text-[clamp(2.4rem,5.5vw,4rem)] text-white leading-[1.08] mb-6">
            Experience
            <br />
            the <em className="not-italic text-accent">difference</em>
          </h2>

          {/* Subtext */}
          <p className="text-white/55 text-[0.88rem] sm:text-[0.94rem] leading-relaxed mb-10 max-w-sm">
            Discover our full collection of luxury fragrances — curated for those
            who understand that a great scent is never an accident.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              style={{ background: GOLD_GRADIENT }}
              className="inline-flex items-center justify-center gap-2.5 h-12 px-8 text-[0.62rem] tracking-[0.25em] uppercase font-semibold text-background hover:opacity-90 transition-opacity duration-200"
            >
              Shop Now
              <ArrowRight size={13} strokeWidth={2} />
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2.5 h-12 px-8 border border-white/25 text-white text-[0.62rem] tracking-[0.25em] uppercase font-medium hover:border-accent hover:text-accent transition-colors duration-200"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
