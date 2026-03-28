'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  notes: string;
  price: number;
  image: string;
  badge?: string;
  href: string;
}

export function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="group flex flex-col">
      {/* Image container */}
      <Link href={product.href} className="relative block overflow-hidden bg-card aspect-3/4">
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

        {/* Quick-add overlay — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleQuickAdd}
            aria-label={`Quick add ${product.name} to cart`}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 text-[0.68rem] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${
              added
                ? 'bg-foreground text-background'
                : 'bg-primary/95 text-primary-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {added ? (
              <>
                <Check size={13} strokeWidth={2.5} />
                Added
              </>
            ) : (
              <>
                <ShoppingBag size={13} />
                Quick Add
              </>
            )}
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
  );
}
