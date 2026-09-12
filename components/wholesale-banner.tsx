import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgePercent, ShieldCheck, Headset } from 'lucide-react';
import WholesaleContactActions from '@/components/wholesale-contact-actions';

const perks = [
  { icon: BadgePercent, label: 'Wholesale pricing'    },
  { icon: ShieldCheck,  label: '100% authentic stock' },
  { icon: Headset,      label: 'Personal support'     },
];

export default function WholesaleBanner() {
  return (
    <section id="wholesale" className="bg-card py-20 md:py-28 scroll-mt-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="relative grid grid-cols-1 lg:grid-cols-12 bg-primary overflow-hidden">

          {/* Gold top accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-accent/50 z-10" />

          {/* ── Image panel ── */}
          <div className="relative lg:col-span-5 aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:min-h-[560px]">
            <Image
              src="/images/image10.jpeg"
              alt="A selection of AuraFume fragrances available wholesale"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
            <div className="hidden lg:block absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-primary" />

            {/* Floating label */}
            <div className="absolute left-5 bottom-5 sm:left-8 sm:bottom-8 flex flex-col gap-1.5">
              <span className="self-start px-3 py-1.5 bg-accent text-accent-foreground text-[0.55rem] tracking-[0.3em] uppercase font-semibold">
                Wholesale
              </span>
              <span className="text-white/70 text-[0.62rem] tracking-[0.2em] uppercase">
                Retailers · Resellers · Gifting
              </span>
            </div>
          </div>

          {/* ── Content panel ── */}
          <div className="lg:col-span-7 flex items-center px-6 py-12 sm:px-12 sm:py-14 lg:px-14 lg:py-16">
            <div className="w-full max-w-xl">

              {/* Eyebrow */}
              <div className="flex items-center gap-4 mb-6">
                <span className="block h-px w-8 bg-accent shrink-0" />
                <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase">
                  We Also Sell Wholesale
                </p>
              </div>

              {/* Headline */}
              <h2 className="font-heading text-[clamp(2rem,4vw,3.1rem)] text-primary-foreground leading-[1.08] mb-5">
                Buying in bulk?
                <br />
                <em className="not-italic text-accent">Let&apos;s talk wholesale.</em>
              </h2>

              <p className="text-primary-foreground/55 text-[0.9rem] leading-relaxed mb-8 max-w-lg">
                Stock your store, supply your customers or plan corporate gifts with
                AuraFume. Wholesale buyers get special pricing on our fragrances —
                reach our team directly and we&apos;ll put a quote together for you.
              </p>

              {/* Perks */}
              <ul className="flex flex-wrap gap-x-6 gap-y-3 mb-9">
                {perks.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-primary-foreground/70 text-[0.62rem] tracking-[0.18em] uppercase"
                  >
                    <Icon size={14} strokeWidth={1.5} className="text-accent" />
                    {label}
                  </li>
                ))}
              </ul>

              {/* Contact */}
              <WholesaleContactActions tone="dark" />

              {/* Learn more */}
              <Link
                href="/wholesale"
                className="group relative inline-flex items-center gap-2.5 mt-8 pb-1 text-primary-foreground/60 hover:text-primary-foreground text-[0.66rem] tracking-[0.22em] uppercase transition-colors duration-300"
              >
                How wholesale works
                <span className="absolute bottom-0 left-0 h-px w-full bg-primary-foreground/15" />
                <span className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
