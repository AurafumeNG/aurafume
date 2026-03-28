'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
type Gender = 'him' | 'her' | 'unisex';

interface Product {
  id: string;
  name: string;
  gender: Gender;
  price: number;
  frontImage: string;
  backImage: string;
  badge?: 'Bestseller' | 'New';
  rating: number;
  reviews: number;
  href: string;
}

// ── Data ───────────────────────────────────────────────────────────
const products: Product[] = [
  {
    id: 'loving-you-frozen',
    name: 'Loving You Frozen',
    gender: 'her',
    price: 149500,
    frontImage: '/images/image5.jpeg',
    backImage: '/images/image2.jpeg',
    badge: 'Bestseller',
    rating: 4.8,
    reviews: 124,
    href: '/shop/loving-you-frozen',
  },
  {
    id: 'stronger-intense',
    name: 'Stronger For You Intense',
    gender: 'him',
    price: 175000,
    frontImage: '/images/image3.jpeg',
    backImage: '/images/image3.jpeg',
    badge: 'Bestseller',
    rating: 4.7,
    reviews: 89,
    href: '/shop/stronger-for-you-intense',
  },
  {
    id: 'stronger-absolute',
    name: 'Stronger For You Absolute',
    gender: 'him',
    price: 185000,
    frontImage: '/images/image11.jpeg',
    backImage: '/images/image4.jpeg',
    badge: 'New',
    rating: 4.6,
    reviews: 31,
    href: '/shop/stronger-for-you-absolute',
  },
  {
    id: 'suger-edp',
    name: 'Suger EDP',
    gender: 'unisex',
    price: 139500,
    frontImage: '/images/image1.jpeg',
    backImage: '/images/image6.jpeg',
    badge: 'Bestseller',
    rating: 4.9,
    reviews: 210,
    href: '/shop/suger-edp',
  },
  {
    id: 'read-lux',
    name: "Re'ad Lux",
    gender: 'her',
    price: 195000,
    frontImage: '/images/image7.jpeg',
    backImage: '/images/image7.jpeg',
    badge: 'New',
    rating: 4.5,
    reviews: 18,
    href: '/shop/read-lux',
  },
  {
    id: 'al-oud',
    name: 'Al Oud',
    gender: 'him',
    price: 210000,
    frontImage: '/images/image8.jpeg',
    backImage: '/images/image8.jpeg',
    badge: 'Bestseller',
    rating: 4.8,
    reviews: 97,
    href: '/shop/al-oud',
  },
  {
    id: 'aura-collection',
    name: 'AuraFume Collection',
    gender: 'unisex',
    price: 125000,
    frontImage: '/images/image10.jpeg',
    backImage: '/images/image9.jpeg',
    rating: 4.4,
    reviews: 52,
    href: '/shop/aura-collection',
  },
];

const TABS = ['All', 'Him', 'Her', 'Unisex'] as const;
type Tab = (typeof TABS)[number];

function fmt(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

// ── Star Rating ────────────────────────────────────────────────────
function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-[2px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={9}
            strokeWidth={1.5}
            className={
              i <= Math.round(rating)
                ? 'fill-[#C6A77B] text-[#C6A77B]'
                : 'fill-none text-foreground/20'
            }
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">({reviews})</span>
    </div>
  );
}

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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <p className="font-heading text-base text-foreground">Added to Cart</p>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="text-foreground/40 hover:text-foreground transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Item */}
        {product && (
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="flex gap-4">
              <div className="relative w-[72px] h-[90px] rounded overflow-hidden shrink-0 bg-card">
                <Image
                  src={product.frontImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 pt-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground leading-snug">
                  {product.name}
                </p>
                <p className="text-[13px] text-[#C6A77B]">{fmt(product.price)}</p>
                <StarRating rating={product.rating} reviews={product.reviews} />
                <p className="text-[11px] text-muted-foreground mt-1">Qty: 1 · 50ml EDP</p>
              </div>
            </div>

            {/* Subtotal */}
            <div className="mt-6 pt-5 border-t border-border flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground uppercase tracking-widest">
                Subtotal
              </span>
              <span className="text-sm font-medium text-foreground">{fmt(product.price)}</span>
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="px-6 py-6 border-t border-border flex flex-col gap-3">
          <Link
            href="/cart"
            onClick={onClose}
            className="w-full flex items-center justify-center py-3 bg-primary text-primary-foreground text-[0.68rem] tracking-[0.2em] uppercase transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            View Cart
          </Link>
          <button
            onClick={onClose}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </>
  );
}

// ── Product Card ───────────────────────────────────────────────────
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
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (justAdded) return;
    setJustAdded(true);
    onQuickAdd();
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <Link
      href={product.href}
      className="group relative flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 180,
        borderRadius: 8,
        backgroundColor: '#EAE4DC',
        scrollSnapAlign: 'start',
      }}
    >
      {/* ── Image area ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
        {/* Front image */}
        <Image
          src={product.frontImage}
          alt={product.name}
          fill
          className="object-cover object-center transition-opacity duration-500 group-hover:opacity-0"
          sizes="220px"
        />
        {/* Back image — fades in on hover */}
        <Image
          src={product.backImage}
          alt={`${product.name} — alternate view`}
          fill
          className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          sizes="220px"
        />

        {/* Badge */}
        {product.badge && (
          <span
            className="absolute top-2.5 left-2.5 px-2 py-[3px] text-[#C6A77B]"
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              backgroundColor: '#111111',
              borderRadius: 2,
            }}
          >
            {product.badge}
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onWishlist();
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-sm hover:scale-110 active:scale-95 transition-transform duration-150"
        >
          <Heart
            size={13}
            strokeWidth={1.75}
            className={`transition-all duration-300 ${
              isWishlisted
                ? 'fill-rose-500 text-rose-500'
                : 'fill-none text-foreground/60'
            }`}
            style={isWishlisted ? { transform: 'scale(1.15)' } : undefined}
          />
        </button>

        {/* Quick-add — slides up on hover */}
        <button
          onClick={handleAdd}
          aria-label="Quick add to cart"
          className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.15em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
          style={{
            backgroundColor: justAdded ? '#C6A77B' : 'rgba(17,17,17,0.92)',
            color: justAdded ? '#111111' : '#ffffff',
          }}
        >
          <ShoppingBag size={11} />
          {justAdded ? 'Added!' : 'Quick Add'}
        </button>
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col gap-1.5 px-3 py-3">
        <StarRating rating={product.rating} reviews={product.reviews} />
        <p
          className="leading-snug text-[#0A0A0A]"
          style={{ fontSize: 14, fontWeight: 500 }}
        >
          {product.name}
        </p>
        <p style={{ fontSize: 14, color: '#C6A77B' }}>{fmt(product.price)}</p>
      </div>
    </Link>
  );
}

// ── Main Carousel ──────────────────────────────────────────────────
export default function ProductCarousel() {
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
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
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

  // Reset scroll when filter changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'smooth' });
    const t = setTimeout(sync, 400);
    return () => clearTimeout(t);
  }, [activeTab, sync]);

  // Init scroll state
  useEffect(() => { sync(); }, [sync]);

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── Header row ── */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent text-[0.62rem] tracking-[0.35em] uppercase mb-3">
              Top Picks
            </p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-tight">
              Bestsellers
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Prev / Next — desktop only */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => scroll('left')}
                disabled={!canLeft}
                aria-label="Previous products"
                className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-all duration-200 ${
                  canLeft
                    ? 'text-foreground hover:border-accent hover:text-accent'
                    : 'text-foreground/20 cursor-default'
                }`}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canRight}
                aria-label="Next products"
                className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-all duration-200 ${
                  canRight
                    ? 'text-foreground hover:border-accent hover:text-accent'
                    : 'text-foreground/20 cursor-default'
                }`}
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-foreground/50 text-[0.68rem] tracking-[0.2em] uppercase hover:text-foreground transition-colors"
            >
              View All
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-1 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[0.63rem] tracking-[0.18em] uppercase transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/45 hover:text-foreground'
              }`}
              style={{ borderRadius: 4 }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Scroll track ── */}
        <div
          ref={scrollRef}
          onScroll={sync}
          className="flex overflow-x-auto pb-2 scrollbar-none"
          style={{
            gap: 12,
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

        {/* ── Mobile: view all ── */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/shop"
            className="text-foreground/50 text-[0.68rem] tracking-[0.25em] uppercase hover:text-foreground transition-colors"
          >
            View All Fragrances
          </Link>
        </div>

      </div>

      {/* ── Mini cart ── */}
      <MiniCart
        product={cartProduct}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </section>
  );
}
