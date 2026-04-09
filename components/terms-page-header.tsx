export default function TermsPageHeader() {
  return (
    <section className="py-20 px-6 sm:px-10 lg:px-16 text-center">
      <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase mb-4">
        Legal
      </p>
      <h1 className="font-heading text-4xl sm:text-5xl tracking-widest uppercase text-foreground mb-5">
        Terms &amp; Conditions
      </h1>
      <p className="text-[0.62rem] tracking-[0.12em] uppercase text-muted-foreground/40 mb-4">
        Last updated: April 9, 2026
      </p>
      <p className="text-muted-foreground text-[0.85rem] tracking-wide max-w-md mx-auto leading-relaxed">
        Please read these terms carefully before using our service.
      </p>
    </section>
  );
}
