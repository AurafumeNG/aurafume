import Link from 'next/link';
import { ArrowRight, Boxes } from 'lucide-react';
import {
  WHOLESALE_PHONE_DISPLAY,
  WHOLESALE_PHONE_TEL,
  WHOLESALE_EMAIL,
  WHOLESALE_MAILTO,
} from '@/lib/wholesale';

/** Compact wholesale prompt for secondary pages (e.g. Contact). */
export default function WholesaleCallout() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 pb-20">
      <div className="relative max-w-5xl mx-auto bg-primary px-8 py-10 sm:px-10 sm:py-12 flex flex-col md:flex-row md:items-center justify-between gap-8 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-accent/50" />

        <div className="flex items-start gap-5 max-w-xl">
          <span className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center border border-primary-foreground/15 text-accent">
            <Boxes size={20} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-accent text-[0.58rem] tracking-[0.32em] uppercase mb-2">
              Wholesale Buyers
            </p>
            <h2 className="font-heading text-xl sm:text-2xl text-primary-foreground leading-snug mb-2">
              We also sell wholesale
            </h2>
            <p className="text-[0.8rem] text-primary-foreground/55 leading-relaxed">
              Call{' '}
              <a href={WHOLESALE_PHONE_TEL} className="text-primary-foreground hover:text-accent transition-colors whitespace-nowrap">
                {WHOLESALE_PHONE_DISPLAY}
              </a>{' '}
              or email{' '}
              <a href={WHOLESALE_MAILTO} className="text-primary-foreground hover:text-accent transition-colors break-all">
                {WHOLESALE_EMAIL}
              </a>{' '}
              for wholesale pricing and availability.
            </p>
          </div>
        </div>

        <Link
          href="/wholesale"
          className="shrink-0 self-start md:self-auto inline-flex items-center gap-2.5 h-11 px-7 border border-primary-foreground/20 text-[0.6rem] tracking-[0.22em] uppercase font-medium text-primary-foreground hover:border-accent hover:text-accent transition-colors duration-200"
        >
          Wholesale Details
          <ArrowRight size={13} strokeWidth={1.8} />
        </Link>
      </div>
    </section>
  );
}
