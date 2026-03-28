import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSectionAlt() {
  return (
    <section className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* ── Left panel: dark content column ── */}
      <div className="relative overflow-hidden flex flex-col justify-between bg-primary px-10 md:px-16 lg:px-20 pt-28 pb-16 w-full md:w-[46%] flex-shrink-0">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-4"
          style={{ animation: 'fadeUp 0.7s ease both' }}
        >
          {/* <span className="block h-px w-10 bg-accent flex-shrink-0" /> */}
          {/* <span className="text-accent text-[0.6rem] tracking-[0.35em] uppercase">
            Est. 2022 · AuraFume
          </span> */}
        </div>

        {/* Main content block */}
        <div className="flex flex-col gap-8 py-14 md:py-0">
          {/* Headline */}
          <h1
            className="font-heading text-[clamp(2.6rem,5vw,4.6rem)] text-white leading-[1.06]"
            style={{ animation: 'fadeUp 0.7s 0.1s ease both' }}
          >
            Scent is the
            <br />
            language of
            <br />
            <em className="not-italic text-accent">desire.</em>
          </h1>

          {/* Subheading */}
          <p
            className="text-white/50 text-sm leading-relaxed max-w-[17rem]"
            style={{ animation: 'fadeUp 0.7s 0.2s ease both' }}
          >
            Born from rare botanicals and ancient resins — AuraFume is a
            statement, not just a scent. Unisex. Unapologetic. Unforgettable.
          </p>

          {/* CTAs — text + animated line + arrow */}
          <div
            className="flex flex-col gap-5"
            style={{ animation: 'fadeUp 0.7s 0.3s ease both' }}
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 text-accent text-[0.68rem] tracking-[0.25em] uppercase font-medium w-fit"
            >
              Shop Now
              <span className="block h-px w-8 bg-accent transition-all duration-300 group-hover:w-12" />
              <ArrowRight
                size={12}
                className="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
              />
            </Link>

            <Link
              href="/about"
              className="group inline-flex items-center gap-3 text-white/35 text-[0.68rem] tracking-[0.25em] uppercase font-medium hover:text-white/60 transition-colors w-fit"
            >
              Discover Our Story
              <span className="block h-px w-5 bg-white/25 transition-all duration-300 group-hover:w-9 group-hover:bg-white/40" />
            </Link>
          </div>
        </div>

        {/* Bottom tagline */}
        <p
          className="text-white/18 text-[0.58rem] tracking-[0.3em] uppercase"
          style={{ animation: 'fadeUp 0.7s 0.4s ease both' }}
        >
          Crafted for those who refuse to be forgotten
        </p>

        {/* Ghost wordmark — spans full panel width */}
        <span
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 font-heading text-[17vw] md:text-[8.5vw] whitespace-nowrap leading-none text-center text-white/2.5 select-none pointer-events-none"
          aria-hidden
        >
          AURAFUME
        </span>
      </div>

      {/* ── Right panel: image ── */}
      <div className="relative hidden md:block flex-1">
        <Image
          src="/images/image7.jpeg"
          alt="AuraFume luxury fragrance editorial"
          fill
          className="object-cover object-top"
          priority
        />

        {/* Left-edge feather to blend with dark panel */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-primary to-transparent" />

        {/* Bottom-edge darkening */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary/30 to-transparent" />

        {/* Floating circular badge */}
        <div
          className="absolute bottom-10 right-10 w-[5.5rem] h-[5.5rem] rounded-full border border-accent/50 flex flex-col items-center justify-center text-center bg-primary/70 backdrop-blur-sm"
          style={{ animation: 'fadeUp 0.7s 0.5s ease both' }}
        >
          <span className="text-accent text-[0.5rem] tracking-[0.18em] uppercase leading-snug">
            New
            <br />
            Collection
          </span>
          <span className="text-white/30 text-[0.48rem] mt-1">2025</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
