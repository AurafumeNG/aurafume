import Image from 'next/image';
import { Store, ShoppingBag, Gift, Sparkles, MapPin, Clock } from 'lucide-react';
import WholesaleContactActions from '@/components/wholesale-contact-actions';
import { WHOLESALE_PHONE_DISPLAY, WHOLESALE_EMAIL } from '@/lib/wholesale';

export const metadata = {
  title: 'Wholesale | AuraFume',
  description:
    `Buy AuraFume fragrances wholesale. Retailers, resellers and corporate buyers can call ${WHOLESALE_PHONE_DISPLAY} or email ${WHOLESALE_EMAIL} for wholesale pricing.`,
};

const audiences = [
  {
    icon:  Store,
    title: 'Retail Stores & Boutiques',
    body:  'Add AuraFume to your shelves and give your customers fragrances they will come back for.',
  },
  {
    icon:  ShoppingBag,
    title: 'Resellers & Online Vendors',
    body:  'Buy in quantity at wholesale prices and resell through your own store, page or network.',
  },
  {
    icon:  Gift,
    title: 'Corporate & Event Gifting',
    body:  'Memorable gifts for staff, clients, weddings and special occasions — ordered in bulk.',
  },
  {
    icon:  Sparkles,
    title: 'Salons, Spas & Hotels',
    body:  'Elevate your space and guest experience with a signature scent your clients remember.',
  },
];

const steps = [
  {
    title: 'Reach out',
    body:  `Call us on ${WHOLESALE_PHONE_DISPLAY} or send an email to ${WHOLESALE_EMAIL}.`,
  },
  {
    title: 'Tell us what you need',
    body:  'Share the fragrances, sizes and quantities you are interested in, plus your location.',
  },
  {
    title: 'Get your quote',
    body:  'Our team confirms availability and wholesale pricing, then arranges pickup or delivery.',
  },
];

export default function WholesalePage() {
  return (
    <>
      {/* ── Header ── */}
      <section className="px-6 sm:px-10 lg:px-16 pt-20 pb-16 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="block h-px w-10 bg-accent/70" />
            <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase">Wholesale</p>
            <span className="block h-px w-10 bg-accent/70" />
          </div>

          <h1 className="font-heading text-[clamp(2.2rem,5.5vw,3.8rem)] text-foreground leading-[1.08] mb-6">
            Wholesale &amp; <em className="not-italic text-accent">Bulk Orders</em>
          </h1>

          <p className="text-muted-foreground text-[0.9rem] leading-relaxed max-w-xl mx-auto mb-10">
            Beyond our retail store, AuraFume sells wholesale to businesses and bulk
            buyers. If you&apos;re looking to buy in quantity, contact our team directly
            for pricing and availability.
          </p>

          <div className="max-w-2xl mx-auto text-left">
            <WholesaleContactActions tone="light" />
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="bg-card px-6 sm:px-10 lg:px-16 py-20 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-14">
            <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase mb-3">Who It&apos;s For</p>
            <h2 className="font-heading text-[clamp(1.7rem,3.5vw,2.5rem)] text-foreground leading-tight">
              Built for businesses that buy in bulk
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {audiences.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group bg-background border border-border p-7 flex flex-col gap-5 hover:border-accent transition-colors duration-300"
              >
                <span className="w-11 h-11 flex items-center justify-center border border-border text-accent group-hover:border-accent transition-colors duration-300">
                  <Icon size={19} strokeWidth={1.5} />
                </span>
                <div className="space-y-2">
                  <h3 className="font-heading text-[1.05rem] text-foreground">{title}</h3>
                  <p className="text-[0.8rem] text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 sm:px-10 lg:px-16 py-20 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase mb-3">How It Works</p>
            <h2 className="font-heading text-[clamp(1.7rem,3.5vw,2.5rem)] text-foreground leading-tight">
              Three simple steps
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step, i) => (
              <li key={step.title} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps (desktop) */}
                {i < steps.length - 1 && (
                  <span className="hidden md:block absolute top-6 left-[calc(50%+2.5rem)] right-[calc(-50%+0.5rem)] h-px bg-border" />
                )}
                <span className="w-12 h-12 flex items-center justify-center border border-accent/60 text-accent font-heading text-lg mb-6">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-heading text-[1.15rem] text-foreground mb-2">{step.title}</h3>
                <p className="text-[0.82rem] text-muted-foreground leading-relaxed max-w-[260px] break-words">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 sm:px-10 lg:px-16 pb-24">
        <div className="max-w-7xl mx-auto relative grid grid-cols-1 lg:grid-cols-2 bg-primary overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-accent/50 z-10" />

          <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[440px]">
            <Image
              src="/images/image3.jpeg"
              alt="AuraFume fragrance with retail packaging"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="hidden lg:block absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-primary" />
            <div className="lg:hidden absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-primary" />
          </div>

          <div className="flex items-center px-6 py-12 sm:px-12 lg:px-14 lg:py-16">
            <div className="w-full max-w-lg">
              <div className="flex items-center gap-4 mb-6">
                <span className="block h-px w-8 bg-accent shrink-0" />
                <p className="text-accent text-[0.6rem] tracking-[0.35em] uppercase">Ready to Order?</p>
              </div>

              <h2 className="font-heading text-[clamp(1.9rem,3.5vw,2.8rem)] text-primary-foreground leading-[1.08] mb-5">
                Speak with our <em className="not-italic text-accent">wholesale team</em>
              </h2>

              <p className="text-primary-foreground/55 text-[0.88rem] leading-relaxed mb-8">
                Call or email us with what you need and we&apos;ll get back to you with
                wholesale pricing.
              </p>

              <WholesaleContactActions tone="dark" />

              <div className="mt-8 pt-7 border-t border-primary-foreground/10 flex flex-col sm:flex-row gap-4 sm:gap-8 text-primary-foreground/45 text-[0.72rem] leading-relaxed">
                <p className="flex items-start gap-2.5">
                  <MapPin size={14} strokeWidth={1.5} className="text-accent shrink-0 mt-0.5" />
                  Balogun Tradefair Complex, Lagos
                </p>
                <p className="flex items-start gap-2.5">
                  <Clock size={14} strokeWidth={1.5} className="text-accent shrink-0 mt-0.5" />
                  Mon–Sat, 9AM–6PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
