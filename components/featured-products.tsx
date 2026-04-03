'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard, type Product } from './product-card';

const products: Product[] = [
  {
    id: 'loving-you-frozen',
    name: 'Loving You Frozen',
    notes: 'Floral · Musky · Amber',
    price: 149500,
    image: '/images/image5.jpeg',
    badge: 'Best Seller',
    href: '/shop/loving-you-frozen',
    sizes: ['30ml', '50ml', '100ml'],
  },
  {
    id: 'stronger-for-you-intense',
    name: 'Stronger For You Intense',
    notes: 'Woody · Spicy · Warm',
    price: 175000,
    image: '/images/image3.jpeg',
    href: '/shop/stronger-for-you-intense',
    sizes: ['50ml', '100ml'],
  },
  {
    id: 'stronger-for-you-absolute',
    name: 'Stronger For You Absolute',
    notes: 'Oriental · Resinous · Bold',
    price: 185000,
    image: '/images/image11.jpeg',
    badge: 'New',
    href: '/shop/stronger-for-you-absolute',
    sizes: ['50ml', '100ml'],
  },
  {
    id: 'suger-edp',
    name: 'Suger EDP',
    notes: 'Fresh · Green · Earthy',
    price: 139500,
    image: '/images/image1.jpeg',
    href: '/shop/suger-edp',
    sizes: ['30ml', '50ml'],
  },
];

export default function FeaturedProducts() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section header */}
        <motion.div
          className="flex items-end justify-between mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div>
            <p className="text-accent text-[0.62rem] tracking-[0.35em] uppercase mb-3">
              Curated for You
            </p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-tight">
              Featured Fragrances
            </h2>
          </div>

          <Link
            href="/shop"
            className="group hidden sm:inline-flex items-center gap-2.5 text-foreground/50 text-[0.68rem] tracking-[0.2em] uppercase hover:text-foreground transition-colors"
          >
            View All
            <span className="block h-px w-6 bg-foreground/30 transition-all duration-300 group-hover:w-10 group-hover:bg-foreground" />
            <ArrowRight
              size={12}
              className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
            />
          </Link>
        </motion.div>

        {/* Grid — 4 columns desktop, horizontal scroll on mobile */}
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 md:grid md:grid-cols-4 md:gap-6 scrollbar-none">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              className="min-w-[72vw] sm:min-w-[44vw] md:min-w-0 snap-start"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {/* Mobile "View All" */}
        <motion.div
          className="mt-10 flex justify-center sm:hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 text-foreground/60 text-[0.68rem] tracking-[0.25em] uppercase hover:text-foreground transition-colors"
          >
            View All Fragrances
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
