'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { ShopProduct, ViewMode } from './types';

// ── Star rating ──────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => {
          const filled = rating >= i;
          const half   = !filled && rating >= i - 0.5;
          return (
            <span key={i} className="relative inline-block">
              <Star size={10} className="text-border" fill="currentColor" />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? '100%' : '50%' }}
                >
                  <Star size={10} className="text-accent" fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-[0.6rem] text-muted-foreground tabular-nums">({count})</span>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  'New':         'bg-accent text-accent-foreground',
  'Best Seller': 'bg-primary text-primary-foreground',
  'Low Stock':   'bg-destructive/80 text-white',
};

// ── Card ─────────────────────────────────────────────────────────────
export default function ShopProductCard({
  product,
  viewMode = 'grid',
  onQuickAdd,
}: {
  product: ShopProduct;
  viewMode: ViewMode;
  onQuickAdd: (product: ShopProduct) => void;
}) {
  const [wishlisted, setWishlisted] = useState(false);

  // ── LIST layout ──────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <article className="group flex gap-4 sm:gap-6 bg-card border border-border/50 hover:border-border transition-colors duration-200">
        <Link
          href={product.href}
          className="relative shrink-0 w-28 sm:w-36 aspect-3/4 overflow-hidden bg-card block"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            sizes="144px"
          />
          {product.badge && (
            <span className={`absolute top-2 left-2 text-[0.52rem] tracking-[0.16em] uppercase px-2 py-0.5 ${BADGE_STYLES[product.badge]}`}>
              {product.badge}
            </span>
          )}
        </Link>

        <div className="flex flex-col justify-between py-4 pr-4 flex-1 min-w-0">
          <div className="space-y-1.5">
            <p className="text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground">
              {product.scentFamily}
            </p>
            <Link href={product.href}>
              <h3 className="font-heading text-[clamp(1rem,2vw,1.2rem)] text-foreground leading-tight hover:text-accent transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>

          <div className="flex items-center justify-between gap-3 mt-3">
            <span className="text-sm font-medium text-foreground tabular-nums">
              ₦{product.price.toLocaleString('en-NG')}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setWishlisted(v => !v)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className="w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
              >
                <Heart
                  size={15}
                  strokeWidth={1.8}
                  className={wishlisted ? 'fill-accent text-accent' : ''}
                />
              </button>

              <button
                onClick={() => onQuickAdd(product)}
                className="flex items-center gap-1.5 h-8 px-3.5 text-[0.6rem] tracking-[0.18em] uppercase bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              >
                <ShoppingBag size={11} />
                Add to Bag
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ── GRID layout ──────────────────────────────────────────────────
  return (
    <article className="group flex flex-col">
      <Link href={product.href} className="relative block overflow-hidden bg-card aspect-3/4">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {product.badge && (
          <span className={`absolute top-3 left-3 text-[0.52rem] tracking-[0.16em] uppercase px-2.5 py-1 z-10 ${BADGE_STYLES[product.badge]}`}>
            {product.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); setWishlisted(v => !v); }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
        >
          <Heart
            size={14}
            strokeWidth={1.8}
            className={`transition-colors ${wishlisted ? 'fill-accent text-accent' : 'text-foreground/70'}`}
          />
        </button>

        {/* Quick-add — slides up on hover/tap */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={e => { e.preventDefault(); onQuickAdd(product); }}
            aria-label={`Quick add ${product.name}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-[0.65rem] tracking-[0.2em] uppercase font-medium bg-primary/95 text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            <ShoppingBag size={12} />
            Quick Add
          </button>
        </div>
      </Link>

      <div className="pt-3.5 flex flex-col gap-1.5">
        <p className="text-muted-foreground text-[0.58rem] tracking-[0.2em] uppercase leading-none">
          {product.scentFamily}
        </p>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-[0.92rem] text-foreground leading-snug line-clamp-2">
            {product.name}
          </h3>
          <span className="text-[0.82rem] text-foreground/80 shrink-0 tabular-nums mt-px">
            ₦{product.price.toLocaleString('en-NG')}
          </span>
        </div>
        <StarRating rating={product.rating} count={product.reviewCount} />
      </div>
    </article>
  );
}
