'use client';

import Image from 'next/image';
import { Plus, ShoppingBag, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useCart } from '@/components/shop/cart-context';
import type { PDPProduct, RelatedProduct } from './types';

interface CompleteTheSetProps {
  mainProduct: PDPProduct;
  bundleProducts: RelatedProduct[];
}

/** The main product and the bundle suggestions share just these fields. */
type BundleEntry = Pick<RelatedProduct, 'id' | 'slug' | 'name' | 'scentFamily' | 'image' | 'variants'>;

function mainAsBundleEntry(p: PDPProduct): BundleEntry {
  return {
    id:          p.id,
    slug:        p.slug,
    name:        p.name,
    scentFamily: p.scentFamily,
    image:       p.images[0] ?? '',
    variants:    p.variants,
  };
}

function BundleItem({ product, isMain }: { product: BundleEntry; isMain?: boolean }) {
  const firstInStock = product.variants.find(v => v.stock > 0) ?? product.variants[0];
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <div className="relative w-full max-w-[100px] aspect-square overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="100px"
          className="object-cover"
        />
        {isMain && (
          <div className="absolute inset-0 ring-1 ring-inset ring-foreground/20" />
        )}
      </div>
      <div className="text-center min-w-0 w-full">
        <p className="text-[0.6rem] tracking-[0.12em] uppercase text-muted-foreground truncate">
          {product.scentFamily.split(' · ')[0]}
        </p>
        <p className="text-[0.72rem] text-foreground leading-snug line-clamp-2 mt-0.5">
          {product.name}
        </p>
        <p className="text-[0.68rem] text-foreground/70 mt-1">
          ₦{firstInStock.price.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function CompleteTheSet({ mainProduct, bundleProducts }: CompleteTheSetProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (bundleProducts.length === 0) return null;

  const allProducts: BundleEntry[] = [mainAsBundleEntry(mainProduct), ...bundleProducts];

  const combinedPrice = allProducts.reduce((sum, p) => {
    const variant = p.variants.find(v => v.stock > 0) ?? p.variants[0];
    return sum + variant.price;
  }, 0);

  function handleAddAll() {
    if (added) return;
    allProducts.forEach(p => {
      const variant = p.variants.find(v => v.stock > 0) ?? p.variants[0];
      addToCart({
        productId:    p.id,
        slug:         p.slug,
        name:         p.name,
        scentFamily:  p.scentFamily,
        image:        p.image,
        size:         variant.size,
        pricePerUnit: variant.price,
        qty:          1,
      });
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-5">
        Complete the Set
      </h3>

      <div className="border border-border p-5">
        {/* Product row */}
        <div className="flex items-start gap-3 mb-5">
          {allProducts.map((product, i) => (
            <div key={product.id} className="contents">
              {i > 0 && (
                <div className="flex items-center self-center shrink-0 mt-[-1.5rem]">
                  <Plus size={14} strokeWidth={1.5} className="text-muted-foreground" />
                </div>
              )}
              <BundleItem product={product} isMain={i === 0} />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-4" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.58rem] tracking-[0.15em] uppercase text-muted-foreground">
              Bundle total
            </p>
            <p className="text-[1rem] font-medium text-foreground mt-0.5">
              ₦{combinedPrice.toLocaleString()}
            </p>
            <p className="text-[0.58rem] text-muted-foreground mt-0.5">
              {allProducts.length} items · 1 each
            </p>
          </div>

          <motion.button
            onClick={handleAddAll}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-2 h-11 px-5 text-[0.65rem] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${
              added
                ? 'bg-foreground text-background'
                : 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {added ? (
              <><Check size={13} strokeWidth={2.5} /> Added</>
            ) : (
              <><ShoppingBag size={13} strokeWidth={1.8} /> Add All to Cart</>
            )}
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
