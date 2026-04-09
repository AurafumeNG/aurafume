import Image from 'next/image';

export default function AboutHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic background */}
      <Image
        src="/images/image5.jpeg"
        alt="AuraFume — born from a passion for luxury fragrance"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Layered overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/75 via-foreground/50 to-foreground/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/40 via-transparent to-foreground/20" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        {/* Eyebrow with flanking lines */}
        <div
          className="flex items-center gap-4 mb-8"
          style={{ animation: 'fadeUp 0.9s ease both' }}
        >
          <span className="block h-px w-10 bg-accent/70" />
          <p className="text-accent text-[0.6rem] tracking-[0.4em] uppercase">
            Our Story
          </p>
          <span className="block h-px w-10 bg-accent/70" />
        </div>

        {/* Headline */}
        <h1
          className="font-heading text-[clamp(2.6rem,7vw,5.5rem)] text-white leading-[1.05] mb-8"
          style={{ animation: 'fadeUp 0.9s 0.12s ease both' }}
        >
          Born from a passion
          <br />
          for <em className="not-italic text-accent">luxury fragrance</em>
        </h1>

        {/* Subtext */}
        <p
          className="text-white/55 text-[0.88rem] sm:text-[0.95rem] leading-relaxed max-w-md"
          style={{ animation: 'fadeUp 0.9s 0.22s ease both' }}
        >
          A Lagos story told through scent — every bottle a chapter,
          every fragrance an identity.
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
        style={{ animation: 'fadeUp 0.9s 0.4s ease both' }}
      >
        <span className="text-white/30 text-[0.55rem] tracking-[0.35em] uppercase">Scroll</span>
        <span className="relative flex flex-col items-center">
          <span className="block w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
          <span className="block w-px h-3 bg-white/20 animate-bounce mt-0.5" />
        </span>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
