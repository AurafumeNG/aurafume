'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Check } from 'lucide-react';
import { motion } from 'motion/react';

// ── Types ───────────────────────────────────────────────────────────
interface SizeOption {
  label: string;
  price: number;
}

interface Arrival {
  id: string;
  name: string;
  descriptor: string;
  notes: string;
  image: string;
  sizes: SizeOption[];
}

// ── Data ────────────────────────────────────────────────────────────
const arrivals: Arrival[] = [
  {
    id: 'oud-imperiale',
    name: 'Oud Impériale',
    descriptor: 'A sovereign darkness',
    notes: 'Oud · Black Rose · Amber · Incense',
    image: '/images/image8.jpeg',
    sizes: [
      { label: '15ml', price: 55000 },
      { label: '50ml', price: 145000 },
      { label: '100ml', price: 235000 },
    ],
  },
  {
    id: 'aurore-blanche',
    name: 'Aurore Blanche',
    descriptor: 'Light caught at dawn',
    notes: 'White Musk · Magnolia · Cedarwood',
    image: '/images/image7.jpeg',
    sizes: [
      { label: '15ml', price: 48000 },
      { label: '50ml', price: 132000 },
      { label: '100ml', price: 215000 },
    ],
  },
  {
    id: 'vetiver-noir',
    name: 'Vétiver Noir',
    descriptor: 'Earth and smoke, unfiltered',
    notes: 'Vetiver · Smoke · Leather · Dry Wood',
    image: '/images/image11.jpeg',
    sizes: [
      { label: '15ml', price: 52000 },
      { label: '50ml', price: 138000 },
      { label: '100ml', price: 224000 },
    ],
  },
];

const SECTION_LAUNCH = 'April 2026';

// ── Arrival card ────────────────────────────────────────────────────
function ArrivalCard({ arrival, index }: { arrival: Arrival; index: number }) {
  const [selectedSize, setSelectedSize] = useState(1); // default 50ml
  const [added, setAdded] = useState(false);

  const price = arrival.sizes[selectedSize].price;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <motion.article
      className="flex flex-col"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay: index * 0.12 }}
    >
      {/* Image + Quick-add overlay */}
      <div className="group relative overflow-hidden bg-card aspect-[3/4]">
        <Image
          src={arrival.image}
          alt={arrival.name}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 90vw, (max-width: 1280px) 33vw, 380px"
        />

        {/* New badge */}
        <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-[0.58rem] tracking-[0.18em] uppercase px-2.5 py-1 z-10">
          New
        </span>

        {/* Descriptor overlay */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-foreground/60 to-transparent pointer-events-none" />
        <p className="absolute bottom-5 left-5 text-white/80 text-[0.72rem] tracking-[0.14em] italic leading-snug">
          {arrival.descriptor}
        </p>

        {/* Quick-add — slides up from bottom on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAdd}
            aria-label={`Add ${arrival.name} to bag`}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 text-[0.68rem] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${
              added
                ? 'bg-foreground text-background'
                : 'bg-primary/95 text-primary-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {added ? (
              <><Check size={13} strokeWidth={2.5} />Added</>
            ) : (
              <><ShoppingBag size={13} />Add to Bag</>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="pt-4 flex flex-col gap-3">
        <div>
          <p className="text-muted-foreground text-[0.62rem] tracking-[0.2em] uppercase mb-1.5">
            {arrival.notes}
          </p>
          <h3 className="font-heading text-[clamp(1.2rem,2vw,1.5rem)] text-foreground leading-tight">
            {arrival.name}
          </h3>
        </div>

        {/* Size selector + price */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {arrival.sizes.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setSelectedSize(i)}
                className={`px-3 py-1.5 text-[0.6rem] tracking-[0.18em] uppercase border transition-all duration-200 ${
                  selectedSize === i
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-foreground/45 hover:border-foreground/30 hover:text-foreground/70'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <span className="text-sm text-foreground/80 tabular-nums shrink-0 transition-all duration-200">
            ₦{price.toLocaleString('en-NG')}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ── Main component ──────────────────────────────────────────────────
export default function NewArrivals() {
  return (
    <section className="bg-card py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-accent text-[0.62rem] tracking-[0.35em] uppercase">
                Just Dropped
              </p>
              <span className="inline-block bg-primary text-primary-foreground text-[0.55rem] tracking-[0.18em] uppercase px-2.5 py-1">
                {SECTION_LAUNCH}
              </span>
            </div>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-tight">
              New Arrivals
            </h2>
          </div>

          <p className="text-muted-foreground text-[0.82rem] leading-relaxed max-w-xs sm:text-right">
            Three new additions to the AuraFume family — each one a study in restraint and precision.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {arrivals.map((arrival, i) => (
            <ArrivalCard key={arrival.id} arrival={arrival} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
