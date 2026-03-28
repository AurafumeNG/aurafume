'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useCart } from '@/components/shop/cart-context';
import { PRODUCTS } from './product-data';

interface RelatedProductsProps {
  slugs: string[];
}

function RelatedCard({ slug }: { slug: string }) {
  const product = PRODUCTS[slug];
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const firstInStock = product.variants.find(v => v.stock > 0) ?? product.variants[0];

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (added) return;
    addToCart(product.id, firstInStock.size, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Link href={`/shop/${slug}`} className="group block shrink-0 w-[160px]">
      {/* Image */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted mb-3">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="160px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute top-2 left-2 text-[0.52rem] tracking-[0.15em] uppercase px-2 py-0.5 bg-background/90 text-foreground border border-border">
            {product.badge}
          </span>
        )}
      </div>

      {/* Info */}
      <p className="text-[0.62rem] tracking-[0.14em] uppercase text-muted-foreground mb-0.5 truncate">
        {product.scentFamily.split(' · ')[0]}
      </p>
      <p className="text-[0.82rem] text-foreground leading-snug mb-1 line-clamp-2">
        {product.name}
      </p>
      <p className="text-[0.78rem] text-foreground/80 mb-3">
        From ₦{firstInStock.price.toLocaleString()}
      </p>

      {/* Quick add */}
      <motion.button
        onClick={handleQuickAdd}
        whileTap={{ scale: 0.96 }}
        disabled={firstInStock.stock === 0}
        className={`w-full h-9 flex items-center justify-center gap-1.5 text-[0.6rem] tracking-[0.18em] uppercase border transition-colors duration-200 ${
          firstInStock.stock === 0
            ? 'border-border text-muted-foreground cursor-not-allowed'
            : added
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-foreground hover:border-foreground'
        }`}
      >
        {added ? (
          <><Check size={11} strokeWidth={2.5} /> Added</>
        ) : firstInStock.stock === 0 ? (
          'Out of Stock'
        ) : (
          <><ShoppingBag size={11} strokeWidth={1.8} /> Quick Add</>
        )}
      </motion.button>
    </Link>
  );
}

export default function RelatedProducts({ slugs }: RelatedProductsProps) {
  const valid = slugs.filter(s => !!PRODUCTS[s]);
  if (valid.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-5">
        You May Also Like
      </h3>

      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
        {valid.map((slug, i) => (
          <motion.div
            key={slug}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.08, ease: 'easeOut' }}
          >
            <RelatedCard slug={slug} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
