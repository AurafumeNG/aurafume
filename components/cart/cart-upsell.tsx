'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '@/components/shop/cart-context';
import { PRODUCTS } from '@/components/pdp/product-data';

// ── Individual upsell card ─────────────────────────────────────────────────────

function UpsellCard({ slug }: { slug: string }) {
  const { addToCart } = useCart();
  const product = PRODUCTS[slug];
  if (!product) return null;

  const firstVariant = product.variants[0];
  const image = product.images[0];

  function handleQuickAdd() {
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      scentFamily: product.scentFamily,
      image,
      size: firstVariant.size,
      pricePerUnit: firstVariant.price,
      qty: 1,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="shrink-0 w-36 border border-border bg-background flex flex-col"
    >
      {/* Image */}
      <Link href={`/shop/${slug}`} className="block shrink-0">
        <div className="relative w-full h-28 bg-muted overflow-hidden">
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-500 hover:scale-105"
            draggable={false}
          />
          {product.badge && (
            <span className="absolute top-1.5 left-1.5 text-[0.44rem] tracking-[0.18em] uppercase px-1.5 py-0.5 bg-foreground text-background">
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2.5 flex-1">
        <Link href={`/shop/${slug}`} className="block">
          <p className="text-[0.7rem] font-medium text-foreground leading-snug line-clamp-2">
            {product.name}
          </p>
        </Link>
        <p className="text-[0.56rem] tracking-widest text-muted-foreground uppercase truncate">
          {product.scentFamily.split(' · ')[0]}
        </p>
        <p className="text-[0.72rem] font-medium text-foreground tabular-nums mt-0.5">
          from ₦{firstVariant.price.toLocaleString()}
        </p>

        {/* Quick add */}
        <button
          onClick={handleQuickAdd}
          disabled={firstVariant.stock === 0}
          aria-label={`Quick add ${product.name}`}
          className="mt-auto pt-2 w-full h-8 flex items-center justify-center gap-1.5 text-[0.58rem] tracking-[0.18em] uppercase border border-foreground text-foreground hover:bg-foreground hover:text-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ShoppingBag size={11} strokeWidth={1.8} />
          Quick Add
        </button>
      </div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function CartUpsell() {
  const { items, savedItems } = useCart();

  // Collect related slugs from all cart items, deduplicate, exclude already in cart/saved
  const cartAndSavedSlugs = new Set([
    ...items.map(i => i.slug),
    ...savedItems.map(i => i.slug),
  ]);

  const upsellSlugs = Array.from(
    new Set(
      items.flatMap(item => {
        const product = PRODUCTS[item.slug];
        return product?.relatedSlugs ?? [];
      }),
    ),
  ).filter(slug => !cartAndSavedSlugs.has(slug) && slug in PRODUCTS);

  if (upsellSlugs.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header */}
      <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground mb-3">
        You May Also Like
      </h2>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 sm:-mx-8 sm:px-8 scrollbar-none">
        {upsellSlugs.map(slug => (
          <UpsellCard key={slug} slug={slug} />
        ))}
      </div>
    </motion.section>
  );
}
