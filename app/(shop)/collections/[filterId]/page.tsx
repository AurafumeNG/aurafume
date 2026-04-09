'use client';

import { useState, useEffect, useCallback, useMemo, Suspense, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal, Check, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductGrid  from '@/components/shop/product-grid';
import QuickAddSheet from '@/components/shop/quick-add-sheet';
import type { ShopProduct, SortOption, ViewMode } from '@/components/shop/types';
import type { CollectionSummary } from '@/app/api/collections/route';
import { SORT_OPTIONS } from '@/components/shop/types';

// ── Constants ─────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

// ── Page ─────────────────────────────────────────────────────────────
export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ filterId: string }>;
}) {
  return (
    <Suspense>
      <CollectionDetailInner params={params} />
    </Suspense>
  );
}

function CollectionDetailInner({
  params,
}: {
  params: Promise<{ filterId: string }>;
}) {
  const { filterId } = use(params);

  // ── Data ─────────────────────────────────────────────────────────
  const [summary, setSummary]     = useState<CollectionSummary | null>(null);
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  // Wishlist
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch the collection summary (name, description, featured, etc.)
    fetch('/api/collections')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const match = (json?.data as CollectionSummary[] | undefined)
          ?.find(c => c.id === filterId);
        if (!match) { setNotFound(true); return; }
        setSummary(match);
      })
      .catch(() => setNotFound(true));
  }, [filterId]);

  useEffect(() => {
    fetch(`/api/collections/${filterId}/products`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) setAllProducts(json.data as ShopProduct[]);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [filterId]);

  useEffect(() => {
    fetch('/api/wishlist')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) setWishlistedIds(new Set(json.data as string[]));
      })
      .catch(() => {});
  }, []);

  // ── UI state ─────────────────────────────────────────────────────
  const [sortBy,     setSortBy]     = useState<SortOption>('newest');
  const [viewMode,   setViewMode]   = useState<ViewMode>('grid');
  const [sortOpen,   setSortOpen]   = useState(false);
  const [pageCount,  setPageCount]  = useState(1);

  // Quick-add sheet
  const [sheetProduct, setSheetProduct] = useState<ShopProduct | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);

  // Reset page on sort change
  useEffect(() => { setPageCount(1); }, [sortBy]);

  // ── Derived ───────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...allProducts].sort((a, b) => {
      if (sortBy === 'newest')     return b.createdAt - a.createdAt;
      if (sortBy === 'price-asc')  return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular')    return b.reviewCount - a.reviewCount;
      return 0;
    });
  }, [allProducts, sortBy]);

  const visible = sorted.slice(0, pageCount * PAGE_SIZE);
  const hasMore = sorted.length > visible.length;

  const handleLoadMore = useCallback(() => {
    setPageCount(c => c + 1);
  }, []);

  // ── 404 ───────────────────────────────────────────────────────────
  if (notFound && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[0.58rem] tracking-[0.22em] uppercase text-muted-foreground">
          Collection not found
        </p>
        <Link
          href="/collections"
          className="text-[0.68rem] tracking-[0.18em] uppercase text-accent underline-offset-4 hover:underline"
        >
          ← Back to collections
        </Link>
      </div>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* Back */}
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
          >
            <ArrowLeft size={11} strokeWidth={2} />
            Collections
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
          >
            <div>
              <p className="text-[0.55rem] tracking-[0.24em] uppercase text-muted-foreground mb-1.5">
                Aurafümeng
              </p>
              <h1 className="font-heading text-[clamp(1.6rem,5vw,2.8rem)] text-foreground leading-none tracking-tight">
                {summary?.name ?? ''}
              </h1>
              {summary?.description && (
                <p className="mt-2 text-[0.75rem] text-muted-foreground max-w-sm leading-relaxed">
                  {summary.description}
                </p>
              )}
            </div>

            {!loading && (
              <span className="text-[0.65rem] tracking-[0.14em] text-muted-foreground tabular-nums shrink-0">
                {allProducts.length} {allProducts.length === 1 ? 'product' : 'products'}
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11">

            {/* View toggle */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  viewMode === 'grid' ? 'text-foreground' : 'text-foreground/35 hover:text-foreground/60'
                }`}
              >
                <LayoutGrid size={16} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  viewMode === 'list' ? 'text-foreground' : 'text-foreground/35 hover:text-foreground/60'
                }`}
              >
                <List size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(v => !v)}
                aria-expanded={sortOpen}
                className="flex items-center gap-1.5 h-7 px-2.5 text-[0.6rem] tracking-[0.15em] uppercase text-foreground/60 hover:text-foreground border border-transparent hover:border-border transition-all duration-200"
              >
                <SlidersHorizontal size={11} strokeWidth={1.8} />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <span className="sm:hidden">Sort</span>
                <ChevronDown
                  size={10}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-48 bg-background border border-border shadow-lg z-50 py-1"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-[0.72rem] tracking-[0.1em] text-left hover:bg-card transition-colors"
                        >
                          {opt.label}
                          {sortBy === opt.value && (
                            <Check size={12} className="text-accent shrink-0" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <ProductGrid
          products={visible}
          viewMode={viewMode}
          hasMore={hasMore}
          isLoading={loading}
          onLoadMore={handleLoadMore}
          onQuickAdd={p => { setSheetProduct(p); setSheetOpen(true); }}
          onClearFilters={() => {}}
          wishlistedIds={wishlistedIds}
        />
      </div>

      {/* ── Quick-add sheet ───────────────────────────────────────── */}
      <QuickAddSheet
        product={sheetProduct}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />

    </div>
  );
}
