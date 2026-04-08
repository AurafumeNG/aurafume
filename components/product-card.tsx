'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';
import QuickAddSheet from '@/components/shop/quick-add-sheet';

async function toggleWishlist(
  productId: string,
): Promise<{ wishlisted: boolean } | null | 'unauthenticated'> {
  try {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) return 'unauthenticated';
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export interface Product {
  id: string;
  name: string;
  notes: string;
  price: number;
  image: string;
  badge?: string;
  href: string;
  sizes: string[];
}

export function ProductCard({
  product,
  initialWishlisted = false,
}: {
  product: Product;
  initialWishlisted?: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistPending, setWishlistPending] = useState(false);

  const sheetProduct = {
    id: product.id,
    name: product.name,
    scentFamily: product.notes,
    image: product.image,
    href: product.href,
    price: product.price,
    sizes: product.sizes,
  };

  async function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    if (wishlistPending) return;
    setWishlistPending(true);
    setWishlisted((v) => !v);
    const result = await toggleWishlist(product.id);
    if (result === 'unauthenticated') {
      setWishlisted((v) => !v); // revert
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    } else if (result === null) {
      setWishlisted((v) => !v); // revert on error
    } else {
      setWishlisted(result.wishlisted);
    }
    setWishlistPending(false);
  }

  return (
    <>
      <article className="group flex flex-col">
        {/* Image container */}
        <Link
          href={product.href}
          className="relative block overflow-hidden bg-card aspect-3/4"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 75vw, 25vw"
          />

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[0.58rem] tracking-[0.18em] uppercase px-2.5 py-1">
              {product.badge}
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlistToggle}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            disabled={wishlistPending}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background disabled:opacity-50"
          >
            <Heart
              size={14}
              strokeWidth={1.8}
              className={`transition-colors ${wishlisted ? 'fill-accent text-accent' : 'text-foreground/70'}`}
            />
          </button>

          {/* Quick-add overlay — slides up on hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              onClick={(e) => {
                e.preventDefault();
                setSheetOpen(true);
              }}
              aria-label={`Quick add ${product.name} to cart`}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 text-[0.68rem] tracking-[0.2em] uppercase font-medium transition-colors duration-200 bg-primary/95 text-primary-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ShoppingBag size={13} />
              Quick Add
            </button>
          </div>
        </Link>

        {/* Info */}
        <div className="pt-4 flex flex-col gap-1">
          <p className="text-muted-foreground text-[0.62rem] tracking-[0.2em] uppercase">
            {product.notes}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-heading text-base text-foreground leading-snug">
              {product.name}
            </h3>
            <span className="text-sm text-foreground/80 shrink-0">
              ₦{product.price.toLocaleString('en-NG')}
            </span>
          </div>
        </div>
      </article>

      <QuickAddSheet
        product={sheetProduct}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
