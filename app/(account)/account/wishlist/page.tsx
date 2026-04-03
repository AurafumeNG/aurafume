'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Share2,
  Heart,
  ShoppingBag,
  X,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';
import { useCart } from '@/components/shop/cart-context';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';
const GOLD = 'oklch(0.72 0.10 74)';

// ── Types ─────────────────────────────────────────────────────────────────────
type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  scentFamily: string;
  price: number; // NGN
  image: string;
  size: string;
  stock: StockStatus;
}

// ── Mock data (swap for real API) ─────────────────────────────────────────────
const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: '1',
    slug: 'stronger-for-you-intense',
    name: 'Stronger For You Intense',
    scentFamily: 'Woody · Oriental',
    price: 265000,
    image: '/images/image3.jpeg',
    size: '100ml',
    stock: 'in-stock',
  },
  {
    id: '2',
    slug: 'loving-you-frozen',
    name: 'Loving You Frozen',
    scentFamily: 'Fresh · Aquatic',
    price: 149500,
    image: '/images/image5.jpeg',
    size: '50ml',
    stock: 'low-stock',
  },
  {
    id: '3',
    slug: 'oud-imperiale',
    name: 'Oud Impériale',
    scentFamily: 'Oud · Amber',
    price: 34000,
    image: '/images/image8.jpeg',
    size: '50ml',
    stock: 'out-of-stock',
  },
  {
    id: '4',
    slug: 'aurore-blanche',
    name: 'Aurore Blanche',
    scentFamily: 'Floral · Powdery',
    price: 134000,
    image: '/images/image7.jpeg',
    size: '30ml',
    stock: 'in-stock',
  },
  {
    id: '5',
    slug: 'rose-oud',
    name: 'Rose Oud',
    scentFamily: 'Floral · Oud',
    price: 67000,
    image: '/images/image4.jpeg',
    size: '50ml',
    stock: 'in-stock',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(ngn: number) {
  return '₦' + ngn.toLocaleString('en-NG');
}

// ── Stock pill ────────────────────────────────────────────────────────────────
const STOCK_CONFIG: Record<StockStatus, { label: string; className: string }> =
  {
    'in-stock': {
      label: 'In Stock',
      className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    },
    'low-stock': {
      label: 'Low Stock',
      className: 'text-amber-600  bg-amber-50  dark:bg-amber-950/40',
    },
    'out-of-stock': {
      label: 'Out of Stock',
      className: 'text-rose-500   bg-rose-50   dark:bg-rose-950/40',
    },
  };

function StockPill({ status }: { status: StockStatus }) {
  const { label, className } = STOCK_CONFIG[status];
  return (
    <span
      className={`inline-flex text-[0.46rem] tracking-[0.14em] uppercase font-semibold px-1.5 py-0.5 ${className}`}
    >
      {label}
    </span>
  );
}

// ── Swipe-to-remove row card ──────────────────────────────────────────────────
const SWIPE_THRESHOLD = 72; // px — beyond this, snap to reveal
const SWIPE_COMMIT = 200; // px — beyond this, auto-remove

function WishlistCard({
  item,
  index,
  onRemove,
}: {
  item: WishlistItem;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const [exiting, setExiting] = useState(false);

  // ── Swipe gesture ──────────────────────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const dragging = useRef(false);
  const animFrame = useRef<number | null>(null);

  const applyTranslate = useCallback((x: number) => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `translateX(${x}px)`;
    cardRef.current.style.transition = 'none';
  }, []);

  const snapTo = useCallback((x: number, onDone?: () => void) => {
    if (!cardRef.current) return;
    cardRef.current.style.transition =
      'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)';
    cardRef.current.style.transform = `translateX(${x}px)`;
    if (onDone) {
      const el = cardRef.current;
      const done = () => {
        el.removeEventListener('transitionend', done);
        onDone();
      };
      el.addEventListener('transitionend', done);
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      startX.current = e.clientX;
      currentX.current = swiped ? -SWIPE_THRESHOLD : 0;
      dragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [swiped],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const base = swiped ? -SWIPE_THRESHOLD : 0;
      const delta = e.clientX - startX.current;
      const next = Math.min(0, Math.max(-(SWIPE_COMMIT + 40), base + delta));
      currentX.current = next;
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      animFrame.current = requestAnimationFrame(() => applyTranslate(next));
    },
    [swiped, applyTranslate],
  );

  const handlePointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (animFrame.current) cancelAnimationFrame(animFrame.current);

    const x = currentX.current;
    if (x < -SWIPE_COMMIT) {
      snapTo(-cardRef.current!.offsetWidth, () => {
        setExiting(true);
        setTimeout(() => onRemove(item.id), 200);
      });
    } else if (x < -SWIPE_THRESHOLD) {
      setSwiped(true);
      snapTo(-SWIPE_THRESHOLD);
    } else {
      setSwiped(false);
      snapTo(0);
    }
  }, [item.id, onRemove, snapTo]);

  useEffect(() => {
    if (!swiped && cardRef.current) snapTo(0);
  }, [swiped, snapTo]);

  function handleAddToCart() {
    if (item.stock === 'out-of-stock') return;
    addToCart({
      productId: item.id,
      slug: item.slug,
      name: item.name,
      scentFamily: item.scentFamily,
      image: item.image,
      size: item.size,
      pricePerUnit: item.price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleTapRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => onRemove(item.id), 220);
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
          className="relative overflow-hidden border-b border-border/40 last:border-0"
        >
          {/* Swipe-reveal remove strip */}
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-rose-500 select-none"
          >
            <X size={18} strokeWidth={2} className="text-white" />
          </div>

          {/* Draggable row */}
          <div
            ref={cardRef}
            className="relative flex gap-4 py-4 bg-background touch-pan-y select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Thumbnail */}
            <Link
              href={`/shop/${item.slug}`}
              className="relative shrink-0 w-20 h-24 overflow-hidden bg-muted/30 block"
              draggable={false}
            >
              <Image
                src={item.image}
                alt={item.name}
                width={80}
                height={96}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-8">
              <div className="space-y-1">
                {/* Scent family */}
                <p className="text-[0.5rem] tracking-[0.18em] uppercase text-muted-foreground/55 leading-none">
                  {item.scentFamily}
                </p>

                {/* Name */}
                <Link href={`/shop/${item.slug}`} draggable={false}>
                  <p className="text-[0.68rem] tracking-[0.06em] font-medium text-foreground leading-snug line-clamp-2 hover:text-foreground/70 transition-colors">
                    {item.name}
                  </p>
                </Link>

                {/* Size */}
                <p className="text-[0.54rem] tracking-widest uppercase text-muted-foreground/50">
                  {item.size}
                </p>

                {/* Price + stock pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[0.72rem] tracking-[0.04em] font-medium tabular-nums"
                    style={{ color: GOLD }}
                  >
                    {fmt(item.price)}
                  </span>
                  <StockPill status={item.stock} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-2.5">
                <button
                  onClick={handleAddToCart}
                  disabled={item.stock === 'out-of-stock'}
                  className={`flex items-center gap-1.5 text-[0.52rem] tracking-[0.18em] uppercase font-medium px-3 py-1.5 transition-all duration-200 ${
                    item.stock === 'out-of-stock'
                      ? 'border border-border/30 text-muted-foreground/25 cursor-not-allowed'
                      : added
                        ? 'bg-emerald-600 text-white border border-emerald-600'
                        : 'border border-border/60 text-foreground hover:bg-foreground hover:text-background hover:border-foreground'
                  }`}
                >
                  {added ? (
                    'Added!'
                  ) : (
                    <>
                      <ShoppingBag size={10} strokeWidth={1.8} />
                      {item.stock === 'out-of-stock'
                        ? 'Unavailable'
                        : 'Add to bag'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tap-to-remove X (desktop) */}
            <button
              onClick={handleTapRemove}
              aria-label={`Remove ${item.name} from wishlist`}
              className="absolute top-3.5 right-2 w-7 h-7 flex items-center justify-center text-muted-foreground/35 hover:text-rose-500 transition-colors"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Wishlist header ───────────────────────────────────────────────────────────
function WishlistHeader({ count }: { count: number }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: 'My Wishlist — Aurafumeng',
          text: "Check out the fragrances I've saved on Aurafumeng.",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 h-14 bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      <div className="h-full max-w-xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center">
        {/* Left — back */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            aria-label="Back to account"
            className="flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>
        </div>

        {/* Center — title + count */}
        <div className="flex flex-col items-center justify-center gap-0.5">
          <h1 className="font-heading text-[0.88rem] tracking-[0.22em] uppercase text-foreground leading-none">
            My Wishlist
          </h1>
          <span className="text-[0.46rem] tracking-[0.16em] uppercase text-muted-foreground/50">
            ({count} {count === 1 ? 'item' : 'items'})
          </span>
        </div>

        {/* Right — share */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleShare}
            aria-label="Share wishlist"
            className="flex items-center justify-center w-9 h-9 text-foreground/60 hover:text-foreground transition-colors"
          >
            <Share2 size={16} strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyWishlist() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 py-20 text-center px-8"
    >
      <div className="w-16 h-16 rounded-full border border-border/60 flex items-center justify-center">
        <Heart
          size={26}
          strokeWidth={1.3}
          className="text-muted-foreground/35"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[0.62rem] tracking-[0.22em] uppercase font-medium text-foreground">
          Your wishlist is empty
        </p>
        <p className="text-[0.6rem] tracking-[0.05em] leading-relaxed text-muted-foreground/60 max-w-56 mx-auto">
          Save fragrances you love and come back to them anytime.
        </p>
      </div>
      <Link
        href="/shop"
        className="flex items-center gap-2 text-[0.56rem] tracking-[0.2em] uppercase font-medium text-foreground/70 hover:text-foreground transition-colors border-b border-foreground/20 pb-0.5"
      >
        Browse the collection
        <ArrowRight size={12} strokeWidth={2} />
      </Link>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4 border-b border-border/40">
          <div className="w-20 h-24 bg-muted/40 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2 bg-muted/40 animate-pulse w-1/3" />
            <div className="h-3 bg-muted/40 animate-pulse w-3/4" />
            <div className="h-2.5 bg-muted/40 animate-pulse w-1/4" />
            <div className="h-2.5 bg-muted/40 animate-pulse w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>(MOCK_WISHLIST);

  useEffect(() => {
    if (!isLoading && !user)
      router.replace('/login?redirect=/account/wishlist');
  }, [isLoading, user, router]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  function handleAddAll() {
    items
      .filter((i) => i.stock !== 'out-of-stock')
      .forEach((i) =>
        addToCart({
          productId: i.id,
          slug: i.slug,
          name: i.name,
          scentFamily: i.scentFamily,
          image: i.image,
          size: i.size,
          pricePerUnit: i.price,
        }),
      );
  }

  if (isLoading || !user) {
    return (
      <>
        <WishlistHeader count={0} />
        <div className="pt-14 max-w-xl mx-auto px-5 sm:px-8 py-5">
          <ListSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <WishlistHeader count={items.length} />

      <div className="pt-14 max-w-xl mx-auto px-5 sm:px-8 py-5 space-y-0">
        {items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <>
            {/* Summary bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between py-3 border-b border-border/60 mb-1"
            >
              <span className="text-[0.52rem] tracking-[0.18em] uppercase text-muted-foreground/50">
                {items.length} {items.length === 1 ? 'item' : 'items'} saved
              </span>
              <button
                onClick={handleAddAll}
                className="text-[0.52rem] tracking-[0.18em] uppercase font-medium px-4 py-2 text-background transition-colors duration-200"
                style={{ background: GOLD_GRADIENT }}
              >
                Add all to bag
              </button>
            </motion.div>

            {/* List */}
            <div>
              {items.map((item, i) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  index={i}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
