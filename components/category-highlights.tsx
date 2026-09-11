'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export interface Category {
  id: string;
  name: string;
  descriptor: string;
  image: string;
  href: string;
}

function Tile({
  category,
  sizes,
  textSize = 'text-2xl',
  className = '',
}: {
  category: Category;
  sizes: string;
  textSize?: string;
  className?: string;
}) {
  return (
    <Link
      href={category.href}
      className={`group relative block overflow-hidden ${className}`}
    >
      <Image
        src={category.image}
        alt={`${category.name} fragrances`}
        fill
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        sizes={sizes}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/15 to-transparent transition-all duration-300 group-hover:from-foreground/90" />

      {/* Text block */}
      <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-accent text-[0.55rem] tracking-[0.28em] uppercase leading-none">
            {category.descriptor}
          </p>
          <h3 className={`font-heading text-white leading-none ${textSize}`}>
            {category.name}
          </h3>
        </div>
        <ArrowRight
          size={15}
          className="shrink-0 mb-0.5 text-accent opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
        />
      </div>
    </Link>
  );
}

export default function CategoryHighlights({
  categories,
}: {
  categories: Category[];
}) {
  // The mosaic needs at least a featured tile plus one companion to read as a grid
  if (categories.length < 2) return null;

  const [featured, ...rest] = categories.slice(0, 5);

  return (
    <section className="bg-card py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Section header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-accent text-[0.62rem] tracking-[0.35em] uppercase mb-3">
            Find Your Signature
          </p>
          <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-tight">
            Shop by Scent
          </h2>
        </motion.div>

        {/* Mosaic — lg: featured left + 2×2 right | mobile: stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:h-[660px]">

          {/* Featured tile — tall, fills full left column */}
          <motion.div
            className="h-[380px] lg:h-full"
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <Tile
              category={featured}
              sizes="(max-width: 1024px) 100vw, 50vw"
              textSize="text-4xl lg:text-5xl"
              className="h-full"
            />
          </motion.div>

          {/* 2×2 grid — right column */}
          <div
            className={`grid gap-3 h-[360px] lg:h-full ${
              rest.length > 2 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'
            }`}
          >
            {rest.map((cat, i) => (
              <motion.div
                key={cat.id}
                className="h-full"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
              >
                <Tile
                  category={cat}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  textSize="text-xl lg:text-2xl"
                  className="h-full"
                />
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
