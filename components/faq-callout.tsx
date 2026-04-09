import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FaqCallout() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-20">
      <div className="max-w-5xl mx-auto border border-border/60 bg-muted/5 px-10 py-12 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="text-center sm:text-left max-w-md">
          <h2 className="font-heading text-xl tracking-widest uppercase text-foreground mb-2">
            Looking for Quick Answers?
          </h2>
          <p className="text-[0.75rem] text-muted-foreground leading-relaxed tracking-wide">
            Check our FAQ page first — you might find your answer instantly.
          </p>
        </div>

        <Link
          href="/faq"
          className="shrink-0 inline-flex items-center gap-2.5 h-11 px-7 border border-border/60 text-[0.6rem] tracking-[0.22em] uppercase font-medium text-foreground hover:border-accent hover:text-accent transition-colors duration-200"
        >
          View FAQs
          <ArrowRight size={13} strokeWidth={1.8} />
        </Link>
      </div>
    </section>
  );
}
