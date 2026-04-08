'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard, type Product } from './product-card';

export default function FeaturedProducts({ products = [] }: { products?: Product[] }) {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/wishlist')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setWishlistedIds(new Set(json.data as string[]));
      })
      .catch(() => {});
  }, []);
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
        {products.length > 0 ? (
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
                <ProductCard product={product} initialWishlisted={wishlistedIds.has(product.id)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-12 text-center">
            No featured products yet.
          </p>
        )}

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
