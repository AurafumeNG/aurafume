'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag, Check, ArrowLeft, ArrowRight } from 'lucide-react';

function InstagramIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Types ───────────────────────────────────────────────────────────
interface SizeOption {
  label: string;
  price: number;
}

interface ShoppableProduct {
  name: string;
  notes: string;
  href: string;
  image: string;
  sizes: SizeOption[];
}

interface FeedTile {
  id: string;
  image: string;
  handle: string;
  postUrl: string;
  shoppable?: ShoppableProduct;
}

// ── Feed data ───────────────────────────────────────────────────────
// NOTE: Replace with Instagram Basic Display API response in production.
// API endpoint: https://graph.instagram.com/me/media?fields=id,media_url,permalink,caption&access_token={TOKEN}
const tiles: FeedTile[] = [
  {
    id: 'ugc-1',
    image: '/images/image6.jpeg',
    handle: '@chisom.b',
    postUrl: 'https://instagram.com/aurafumeng',
    shoppable: {
      name: 'Loving You Frozen',
      notes: 'Floral · Musky · Amber',
      href: '/shop/loving-you-frozen',
      image: '/images/image5.jpeg',
      sizes: [
        { label: '15ml', price: 52000 },
        { label: '50ml', price: 149500 },
        { label: '100ml', price: 238000 },
      ],
    },
  },
  {
    id: 'ugc-2',
    image: '/images/image3.jpeg',
    handle: '@emeka.t',
    postUrl: 'https://instagram.com/aurafumeng',
  },
  {
    id: 'ugc-3',
    image: '/images/image1.jpeg',
    handle: '@adaeze.o',
    postUrl: 'https://instagram.com/aurafumeng',
    shoppable: {
      name: 'Suger EDP',
      notes: 'Fresh · Green · Earthy',
      href: '/shop/suger-edp',
      image: '/images/image1.jpeg',
      sizes: [
        { label: '15ml', price: 46000 },
        { label: '50ml', price: 139500 },
        { label: '100ml', price: 222000 },
      ],
    },
  },
  {
    id: 'ugc-4',
    image: '/images/image8.jpeg',
    handle: '@tunde.w',
    postUrl: 'https://instagram.com/aurafumeng',
  },
  {
    id: 'ugc-5',
    image: '/images/image5.jpeg',
    handle: '@funmi.a',
    postUrl: 'https://instagram.com/aurafumeng',
    shoppable: {
      name: 'Loving You Frozen',
      notes: 'Floral · Musky · Amber',
      href: '/shop/loving-you-frozen',
      image: '/images/image5.jpeg',
      sizes: [
        { label: '15ml', price: 52000 },
        { label: '50ml', price: 149500 },
        { label: '100ml', price: 238000 },
      ],
    },
  },
  {
    id: 'ugc-6',
    image: '/images/image7.jpeg',
    handle: '@kemi.j',
    postUrl: 'https://instagram.com/aurafumeng',
  },
  {
    id: 'ugc-7',
    image: '/images/image11.jpeg',
    handle: '@sola.d',
    postUrl: 'https://instagram.com/aurafumeng',
    shoppable: {
      name: 'Stronger For You Absolute',
      notes: 'Oriental · Resinous · Bold',
      href: '/shop/stronger-for-you-absolute',
      image: '/images/image11.jpeg',
      sizes: [
        { label: '15ml', price: 62000 },
        { label: '50ml', price: 185000 },
        { label: '100ml', price: 295000 },
      ],
    },
  },
  {
    id: 'ugc-8',
    image: '/images/image4.jpeg',
    handle: '@bisi.m',
    postUrl: 'https://instagram.com/aurafumeng',
  },
];

const IG_HANDLE = '@aurafumeng';
const IG_URL = 'https://instagram.com/aurafumeng';

// ── Lightbox ────────────────────────────────────────────────────────
function Lightbox({
  tiles,
  index,
  onClose,
  onNav,
}: {
  tiles: FeedTile[];
  index: number;
  onClose: () => void;
  onNav: (dir: 'prev' | 'next') => void;
}) {
  const tile = tiles[index];

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNav('prev');
      if (e.key === 'ArrowRight') onNav('next');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNav]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 backdrop-blur-sm">
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors"
      >
        <X size={20} />
      </button>

      {/* Prev */}
      <button
        onClick={() => onNav('prev')}
        aria-label="Previous"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft size={22} />
      </button>

      {/* Image */}
      <div className="relative w-[min(540px,90vw)] aspect-square">
        <Image
          src={tile.image}
          alt={`AuraFume — shared by ${tile.handle}`}
          fill
          className="object-cover"
          sizes="(max-width: 600px) 90vw, 540px"
        />
        {/* Handle watermark */}
        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-foreground/70 to-transparent px-5 py-4 flex items-end justify-between gap-3">
          <span className="text-white/80 text-[0.65rem] tracking-[0.15em]">
            {tile.handle}
          </span>
          <a
            href={tile.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-[0.6rem] tracking-[0.15em] uppercase transition-colors"
          >
            <InstagramIcon size={11} />
            View post
          </a>
        </div>
      </div>

      {/* Next */}
      <button
        onClick={() => onNav('next')}
        aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
      >
        <ArrowRight size={22} />
      </button>

      {/* Dot counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {tiles.map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              i === index
                ? 'w-4 h-1 bg-white'
                : 'w-1 h-1 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Quick-view panel ────────────────────────────────────────────────
function QuickView({
  product,
  open,
  onClose,
}: {
  product: ShoppableProduct | null;
  open: boolean;
  onClose: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState(1);
  const [added, setAdded] = useState(false);

  // Reset size when product changes
  useEffect(() => { setSelectedSize(1); setAdded(false); }, [product]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleAdd() {
    if (added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  const price = product?.sizes[selectedSize].price ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <p className="font-heading text-sm text-foreground">Shoppable Look</p>
          <button
            onClick={onClose}
            aria-label="Close quick-view"
            className="text-foreground/40 hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {product && (
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
            {/* Product image */}
            <div className="relative aspect-3/4 overflow-hidden bg-card w-full">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover object-center"
                sizes="320px"
              />
              <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[0.58rem] tracking-[0.18em] uppercase px-2.5 py-1">
                New
              </span>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-[0.62rem] tracking-[0.2em] uppercase">
                {product.notes}
              </p>
              <Link
                href={product.href}
                onClick={onClose}
                className="font-heading text-lg text-foreground leading-tight hover:text-accent transition-colors"
              >
                {product.name}
              </Link>
            </div>

            {/* Size selector */}
            <div className="flex flex-col gap-2">
              <p className="text-[0.6rem] tracking-[0.2em] uppercase text-muted-foreground">
                Size
              </p>
              <div className="flex gap-1.5">
                {product.sizes.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => setSelectedSize(i)}
                    className={`px-3.5 py-1.5 text-[0.6rem] tracking-[0.18em] uppercase border transition-all duration-200 ${
                      selectedSize === i
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-foreground/45 hover:border-foreground/30 hover:text-foreground/70'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-[0.62rem] tracking-[0.2em] uppercase text-muted-foreground">
                Price
              </span>
              <span className="font-heading text-base text-foreground tabular-nums transition-all duration-200">
                ₦{price.toLocaleString('en-NG')}
              </span>
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="px-6 py-5 border-t border-border flex flex-col gap-3 shrink-0">
          <button
            onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 text-[0.68rem] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${
              added
                ? 'bg-foreground text-background'
                : 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {added ? (
              <><Check size={13} strokeWidth={2.5} />Added to Bag</>
            ) : (
              <><ShoppingBag size={13} />Add to Bag</>
            )}
          </button>
          {product && (
            <Link
              href={product.href}
              onClick={onClose}
              className="text-center text-[0.62rem] text-muted-foreground hover:text-foreground tracking-[0.18em] uppercase transition-colors"
            >
              View Full Product
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// ── Feed tile ───────────────────────────────────────────────────────
function FeedTileCard({
  tile,
  onClick,
}: {
  tile: FeedTile;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative block w-full aspect-square overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`${tile.shoppable ? 'Shop this look' : 'View post'} by ${tile.handle}`}
    >
      {/* Image */}
      <Image
        src={tile.image}
        alt={`AuraFume community — ${tile.handle}`}
        fill
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        sizes="(max-width: 1024px) 33vw, 25vw"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-all duration-300" />

      {/* Hover content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <InstagramIcon size={22} className="text-white" />
        {tile.shoppable && (
          <span className="text-white text-[0.55rem] tracking-[0.2em] uppercase bg-accent/90 px-2.5 py-1">
            Shop Look
          </span>
        )}
      </div>

      {/* Handle watermark — always visible, bottom-left */}
      <span className="absolute bottom-2 left-2 text-white/70 text-[0.52rem] tracking-widest drop-shadow-sm pointer-events-none">
        {tile.handle}
      </span>

      {/* Shoppable dot indicator */}
      {tile.shoppable && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" aria-hidden />
      )}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────
export default function SocialFeed() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<ShoppableProduct | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Non-shoppable tiles for lightbox navigation (separate index array)
  const lightboxTiles = tiles.filter((t) => !t.shoppable);

  function handleTileClick(tile: FeedTile) {
    if (tile.shoppable) {
      setQuickViewProduct(tile.shoppable);
      setQuickViewOpen(true);
    } else {
      const idx = lightboxTiles.findIndex((t) => t.id === tile.id);
      setLightboxIndex(idx);
    }
  }

  const handleLightboxNav = useCallback((dir: 'prev' | 'next') => {
    setLightboxIndex((prev) => {
      if (prev === null) return null;
      return dir === 'next'
        ? (prev + 1) % lightboxTiles.length
        : (prev - 1 + lightboxTiles.length) % lightboxTiles.length;
    });
  }, [lightboxTiles.length]);

  return (
    <>
      <section className="bg-background">

        {/* ── Section header ── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-10 md:pt-28 md:pb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-accent text-[0.62rem] tracking-[0.35em] uppercase mb-3">
              Community
            </p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3rem)] text-foreground leading-tight">
              Tag Us{' '}
              <a
                href={IG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                {IG_HANDLE}
              </a>
            </h2>
          </div>

          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 border border-foreground/20 hover:border-accent px-5 py-2.5 text-[0.65rem] tracking-[0.22em] uppercase text-foreground/60 hover:text-accent transition-all duration-300 self-start sm:self-auto"
          >
            <InstagramIcon size={13} />
            Follow Us
          </a>
        </div>

        {/* ── Tile grid — full bleed, 2px gap ── */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-0.5">
          {tiles.map((tile) => (
            <FeedTileCard
              key={tile.id}
              tile={tile}
              onClick={() => handleTileClick(tile)}
            />
          ))}
        </div>

        {/* ── Legend ── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden />
          <p className="text-muted-foreground text-[0.58rem] tracking-[0.15em] uppercase">
            Gold dot indicates shoppable look
          </p>
        </div>

      </section>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          tiles={lightboxTiles}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={handleLightboxNav}
        />
      )}

      {/* ── Quick-view ── */}
      <QuickView
        product={quickViewProduct}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
