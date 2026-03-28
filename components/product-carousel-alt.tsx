'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Check, ArrowLeft, ArrowRight, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
type Gender = 'him' | 'her' | 'unisex';

interface Product {
  id: string;
  name: string;
  notes: string;
  gender: Gender;
  price: number;
  frontImage: string;
  backImage: string;
  badge?: string;
  href: string;
}

// ── Data ───────────────────────────────────────────────────────────
const products: Product[] = [
  {
    id: 'loving-you-frozen',
    name: 'Loving You Frozen',
    notes: 'Floral · Musky · Amber',
    gender: 'her',
    price: 149500,
    frontImage: '/images/image5.jpeg',
    backImage: '/images/image2.jpeg',
    badge: 'Best Seller',
    href: '/shop/loving-you-frozen',
  },
  {
    id: 'stronger-intense',
    name: 'Stronger For You Intense',
    notes: 'Woody · Spicy · Warm',
    gender: 'him',
    price: 175000,
    frontImage: '/images/image3.jpeg',
    backImage: '/images/image3.jpeg',
    badge: 'Best Seller',
    href: '/shop/stronger-for-you-intense',
  },
  {
    id: 'stronger-absolute',
    name: 'Stronger For You Absolute',
    notes: 'Oriental · Resinous · Bold',
    gender: 'him',
    price: 185000,
    frontImage: '/images/image11.jpeg',
    backImage: '/images/image4.jpeg',
    badge: 'New',
    href: '/shop/stronger-for-you-absolute',
  },
  {
    id: 'suger-edp',
    name: 'Suger EDP',
    notes: 'Fresh · Green · Earthy',
    gender: 'unisex',
    price: 139500,
    frontImage: '/images/image1.jpeg',
    backImage: '/images/image6.jpeg',
    badge: 'Best Seller',
    href: '/shop/suger-edp',
  },
  {
    id: 'read-lux',
    name: "Re'ad Lux",
    notes: 'Citrus · Floral · Musk',
    gender: 'her',
    price: 195000,
    frontImage: '/images/image7.jpeg',
    backImage: '/images/image7.jpeg',
    badge: 'New',
    href: '/shop/read-lux',
  },
  {
    id: 'al-oud',
    name: 'Al Oud',
    notes: 'Oud · Resinous · Smoky',
    gender: 'him',
    price: 210000,
    frontImage: '/images/image8.jpeg',
    backImage: '/images/image8.jpeg',
    badge: 'Best Seller',
    href: '/shop/al-oud',
  },
  {
    id: 'aura-collection',
    name: 'AuraFume Collection',
    notes: 'Eclectic · Layered · Unisex',
    gender: 'unisex',
    price: 125000,
    frontImage: '/images/image10.jpeg',
    backImage: '/images/image9.jpeg',
    href: '/shop/aura-collection',
  },
];

const TABS = ['All', 'Him', 'Her', 'Unisex'] as const;
type Tab = (typeof TABS)[number];

// ── Mini Cart ──────────────────────────────────────────────────────
function MiniCart({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <p className="font-heading text-base text-foreground">Added to Cart</p>
          <button onClick={onClose} aria-label="Close cart" className="text-foreground/40 hover:text-foreground transition-colors">
            <X size={17} />
          </button>
        </div>

        {product && (
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="flex gap-4">
              <div className="relative w-[72px] h-[90px] overflow-hidden shrink-0 bg-card">
                <Image src={product.frontImage} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-1.5 pt-1 min-w-0">
                <p className="text-[0.62rem] text-muted-foreground tracking-[0.2em] uppercase">{product.notes}</p>
                <p className="text-[13px] font-medium text-foreground leading-snug">{product.name}</p>
                <p className="text-[13px] text-foreground/70">₦{product.price.toLocaleString('en-NG')}</p>
                <p className="text-[11px] text-muted-foreground">Qty: 1 · 50ml EDP</p>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-border flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground uppercase tracking-widest">Subtotal</span>
              <span className="text-sm font-medium text-foreground">₦{product.price.toLocaleString('en-NG')}</span>
            </div>
          </div>
        )}

        <div className="px-6 py-6 border-t border-border flex flex-col gap-3">
          <Link
            href="/cart"
            onClick={onClose}
            className="w-full flex items-center justify-center py-3 bg-primary text-primary-foreground text-[0.68rem] tracking-[0.2em] uppercase transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            View Cart
          </Link>
          <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase">
            Continue Shopping
          </button>
        </div>
      </div>
    </>
  );
}

// ── Product Card — matches FeaturedProducts design exactly ─────────
function ProductCard({
  product,
  isWishlisted,
  onWishlist,
  onQuickAdd,
}: {
  product: Product;
  isWishlisted: boolean;
  onWishlist: () => void;
  onQuickAdd: () => void;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (added) return;
    setAdded(true);
    onQuickAdd();
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article
      className="group flex flex-col shrink-0"
      style={{ width: 210, scrollSnapAlign: 'start' }}
    >
      {/* Image container — exact match with FeaturedProducts */}
      <div className="relative block overflow-hidden bg-card aspect-3/4">
        {/* Front image */}
        <Image
          src={product.frontImage}
          alt={product.name}
          fill
          className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          sizes="210px"
        />
        {/* Back image — fades in on hover */}
        <Image
          src={product.backImage}
          alt={`${product.name} — alternate view`}
          fill
          className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          sizes="210px"
        />

        {/* Badge — exact match with FeaturedProducts */}
        {product.badge && (
          <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[0.58rem] tracking-[0.18em] uppercase px-2.5 py-1">
            {product.badge}
          </span>
        )}

        {/* Wishlist — top-right (carousel addition) */}
        <button
          onClick={(e) => { e.preventDefault(); onWishlist(); }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-sm hover:scale-110 active:scale-95 transition-transform duration-150"
        >
          <Heart
            size={13}
            strokeWidth={1.75}
            className={`transition-all duration-300 ${
              isWishlisted ? 'fill-rose-500 text-rose-500' : 'fill-none text-foreground/60'
            }`}
          />
        </button>

        {/* Quick-add overlay — exact match with FeaturedProducts */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAdd}
            aria-label={`Quick add ${product.name} to cart`}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 text-[0.68rem] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${
              added
                ? 'bg-foreground text-background'
                : 'bg-primary/95 text-primary-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {added ? (
              <><Check size={13} strokeWidth={2.5} />Added</>
            ) : (
              <><ShoppingBag size={13} />Quick Add</>
            )}
          </button>
        </div>
      </div>

      {/* Info — exact match with FeaturedProducts */}
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

// ── Main Section ───────────────────────────────────────────────────
export default function ProductCarouselAlt() {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [cartProduct, setCartProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeTab === 'All'
      ? products
      : products.filter((p) => p.gender === activeTab.toLowerCase());

  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -230 : 230, behavior: 'smooth' });
  }

  function toggleWishlist(id: string) {
    setWishlisted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleQuickAdd(product: Product) {
    setCartProduct(product);
    setCartOpen(true);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'smooth' });
    const t = setTimeout(sync, 400);
    return () => clearTimeout(t);
  }, [activeTab, sync]);

  useEffect(() => { sync(); }, [sync]);

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── Header — matches FeaturedProducts layout ── */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent text-[0.62rem] tracking-[0.35em] uppercase mb-3">
              Top Picks
            </p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-tight">
              Bestsellers
            </h2>
          </div>

          {/* View All — exact match with FeaturedProducts */}
          <Link
            href="/shop"
            className="group hidden sm:inline-flex items-center gap-2.5 text-foreground/50 text-[0.68rem] tracking-[0.2em] uppercase hover:text-foreground transition-colors"
          >
            View All
            <span className="block h-px w-6 bg-foreground/30 transition-all duration-300 group-hover:w-10 group-hover:bg-foreground" />
            <ArrowRight size={12} className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
          </Link>
        </div>

        {/* ── Filter tabs — pill style ── */}
        <div className="flex items-center gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-[0.62rem] tracking-[0.18em] uppercase border transition-all duration-200 ${
                activeTab === tab
                  ? 'border-accent text-accent bg-accent/8'
                  : 'border-border text-foreground/45 hover:border-foreground/30 hover:text-foreground/70'
              }`}
            >
              {tab}
            </button>
          ))}

          {/* Prev / Next arrows — right of tabs on desktop */}
          <div className="hidden sm:flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => scroll('left')}
              disabled={!canLeft}
              aria-label="Previous"
              className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-all duration-200 ${
                canLeft ? 'text-foreground hover:border-accent hover:text-accent' : 'text-foreground/20 cursor-default'
              }`}
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canRight}
              aria-label="Next"
              className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-all duration-200 ${
                canRight ? 'text-foreground hover:border-accent hover:text-accent' : 'text-foreground/20 cursor-default'
              }`}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Scroll track ── */}
        <div
          ref={scrollRef}
          onScroll={sync}
          className="flex overflow-x-auto pb-4 scrollbar-none"
          style={{
            gap: 20,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            paddingInline: 2,
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlisted.has(product.id)}
                onWishlist={() => toggleWishlist(product.id)}
                onQuickAdd={() => handleQuickAdd(product)}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm py-12 px-2">
              No products in this category yet.
            </p>
          )}
        </div>

        {/* Mobile view all */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 text-foreground/60 text-[0.68rem] tracking-[0.25em] uppercase hover:text-foreground transition-colors"
          >
            View All Fragrances
            <ArrowRight size={12} />
          </Link>
        </div>

      </div>

      <MiniCart product={cartProduct} open={cartOpen} onClose={() => setCartOpen(false)} />
    </section>
  );
}
