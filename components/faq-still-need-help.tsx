import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';

const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

export default function FaqStillNeedHelp() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-24">
      <div className="max-w-3xl mx-auto border border-border/60 px-10 py-14 flex flex-col items-center text-center gap-8">
        <div className="space-y-3">
          <h2 className="font-heading text-2xl sm:text-3xl tracking-widest uppercase text-foreground">
            Still Have Questions?
          </h2>
          <p className="text-[0.78rem] text-muted-foreground tracking-wide leading-relaxed max-w-xs mx-auto">
            Our team is happy to help. Reach us via email or WhatsApp.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2.5 h-12 px-8 border border-border/60 text-[0.6rem] tracking-[0.22em] uppercase font-medium text-foreground hover:border-foreground/60 hover:text-foreground transition-colors duration-200"
          >
            <Mail size={14} strokeWidth={1.7} />
            Contact Us
          </Link>

          <Link
            href="https://wa.me/2348012345678"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: GOLD_GRADIENT }}
            className="inline-flex items-center justify-center gap-2.5 h-12 px-8 text-[0.6rem] tracking-[0.22em] uppercase font-medium text-background hover:opacity-90 transition-opacity duration-200"
          >
            <MessageCircle size={14} strokeWidth={1.7} />
            WhatsApp Support
          </Link>
        </div>

        <p className="text-[0.6rem] text-muted-foreground/40 tracking-wide">
          Mon–Sat &nbsp;·&nbsp; 9AM–6PM WAT
        </p>
      </div>
    </section>
  );
}
