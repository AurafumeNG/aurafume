export default function ContactMapEmbed() {
  // Address: Shop 17/18 Canaan Line, Rivers 2 Plaza, Balogun Tradefair Complex, Lagos
  const embedSrc =
    'https://maps.google.com/maps?q=Balogun+Tradefair+Complex+Lagos+Nigeria&output=embed&z=16';

  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Label */}
        <p className="text-[0.55rem] tracking-[0.28em] uppercase text-muted-foreground/50 mb-6">
          Find Us
        </p>

        {/* Store info strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <p className="font-heading text-sm tracking-widest uppercase text-foreground">
              AuraFume — Lagos Store
            </p>
            <p className="text-[0.68rem] text-muted-foreground mt-0.5">
              Shop 17/18 Canaan Line, Rivers 2 Plaza, Balogun Tradefair Complex, Lagos
            </p>
          </div>
          <p className="text-[0.62rem] tracking-wide text-muted-foreground/50 shrink-0">
            Mon–Sat &nbsp;·&nbsp; 9AM–6PM
          </p>
        </div>

        {/* Map iframe */}
        <div className="relative w-full overflow-hidden border border-border" style={{ height: 420 }}>
          <iframe
            src={embedSrc}
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(30%) contrast(1.05)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="AuraFume store location — Balogun Tradefair Complex, Lagos"
          />
        </div>
      </div>
    </section>
  );
}
