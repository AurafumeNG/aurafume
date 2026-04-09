'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import QuickAddSheet, { type QuickAddProduct } from '@/components/shop/quick-add-sheet';

export type { QuickAddProduct };

export default function NotFoundPopularProducts({
  products,
}: {
  products: QuickAddProduct[];
}) {
  const [sheetProduct, setSheetProduct] = useState<QuickAddProduct | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);

  function openSheet(product: QuickAddProduct) {
    setSheetProduct(product);
    setSheetOpen(true);
  }

  if (!products.length) return null;

  return (
    <>
      <section className="py-16 px-6 sm:px-10 lg:px-16 border-t border-border/30">
        <p className="text-[0.55rem] tracking-[0.28em] uppercase text-muted-foreground/50 mb-2 text-center">
          While You&apos;re Here
        </p>
        <h2 className="font-heading text-xl sm:text-2xl tracking-widest uppercase text-foreground text-center mb-10">
          You Might Like These
        </h2>

        {/* Horizontally scrollable strip */}
        <div className="flex gap-5 overflow-x-auto scrollbar-none pb-2 -mx-6 px-6 sm:-mx-10 sm:px-10 lg:-mx-16 lg:px-16">
          {products.map((product) => (
            <article
              key={product.id}
              className="group shrink-0 w-52 sm:w-60 flex flex-col"
            >
              {/* Image */}
              <Link
                href={product.href}
                className="relative block overflow-hidden bg-card aspect-3/4 mb-3.5"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="240px"
                />

                {/* Quick-add overlay */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <button
                    onClick={(e) => { e.preventDefault(); openSheet(product); }}
                    aria-label={`Quick add ${product.name}`}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[0.62rem] tracking-[0.2em] uppercase font-medium bg-primary/95 text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                  >
                    <ShoppingBag size={12} />
                    Quick Add
                  </button>
                </div>
              </Link>

              {/* Meta */}
              <p className="text-muted-foreground text-[0.55rem] tracking-[0.2em] uppercase leading-none mb-1.5">
                {product.scentFamily}
              </p>
              <div className="flex items-start justify-between gap-2">
                <Link href={product.href}>
                  <h3 className="font-heading text-[0.88rem] text-foreground leading-snug line-clamp-2 hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <span className="text-[0.8rem] text-foreground/75 shrink-0 tabular-nums mt-0.5">
                  ₦{product.price.toLocaleString('en-NG')}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <QuickAddSheet
        product={sheetProduct}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
