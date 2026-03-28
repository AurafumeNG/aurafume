import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/image6.jpeg"
        alt="AuraFume luxury fragrance"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Layered overlays for depth and text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/60 to-foreground/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-32">
        <div className="max-w-lg">
          {/* Eyebrow */}
          <p
            className="text-accent text-[0.65rem] tracking-[0.35em] uppercase mb-7"
            style={{ animation: 'fadeUp 0.8s ease both' }}
          >
            Luxury Unisex Fragrance
          </p>

          {/* Headline */}
          <h1
            className="font-heading text-[clamp(3.5rem,9vw,6.5rem)] text-white leading-[1.0] mb-7"
            style={{ animation: 'fadeUp 0.8s 0.1s ease both' }}
          >
            Wear
            <br />
            Your
            <br />
            <em className="not-italic text-accent">Aura.</em>
          </h1>

          {/* Subheading — brand story teaser */}
          <p
            className="text-white/65 text-[0.95rem] md:text-base leading-relaxed mb-10 max-w-xs"
            style={{ animation: 'fadeUp 0.8s 0.2s ease both' }}
          >
            Each bottle holds a world — crafted from the rarest notes,
            designed to tell your story without a single word.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4"
            style={{ animation: 'fadeUp 0.8s 0.3s ease both' }}
          >
            {/* Primary */}
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-9 py-3.5 bg-accent text-accent-foreground text-[0.7rem] tracking-[0.2em] uppercase font-medium transition-all duration-300 hover:bg-accent/80 hover:tracking-[0.28em]"
            >
              Explore Collection
            </Link>

            {/* Secondary */}
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-9 py-3.5 border border-white/30 text-white text-[0.7rem] tracking-[0.2em] uppercase font-medium transition-all duration-300 hover:border-accent hover:text-accent"
            >
              Discover Our Story
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 pointer-events-none">
        <span className="text-white/30 text-[0.6rem] tracking-[0.3em] uppercase">Scroll</span>
        <span className="block w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-bounce" />
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
