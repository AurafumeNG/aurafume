'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ShopProductCard from './shop-product-card';
import SkeletonCard    from './skeleton-card';
import EmptyState      from './empty-state';
import type { ShopProduct, ViewMode } from './types';

interface ProductGridProps {
  products: ShopProduct[];
  viewMode: ViewMode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onQuickAdd: (product: ShopProduct) => void;
  onClearFilters: () => void;
}

const SKELETON_COUNT = 4;

export default function ProductGrid({
  products,
  viewMode,
  hasMore,
  isLoading,
  onLoadMore,
  onQuickAdd,
  onClearFilters,
}: ProductGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Auto-trigger load more when sentinel scrolls into view
  useEffect(() => {
    if (!hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1, rootMargin: '80px' },
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (products.length === 0 && !isLoading) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6'
    : 'flex flex-col gap-3';

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={gridClass}
        >
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut', delay: Math.min(i * 0.04, 0.28) }}
            >
              <ShopProductCard
                product={product}
                viewMode={viewMode}
                onQuickAdd={onQuickAdd}
              />
            </motion.div>
          ))}

          {/* Skeleton cards while loading next page */}
          {isLoading &&
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={`sk-${i}`} viewMode={viewMode} />
            ))
          }
        </motion.div>
      </AnimatePresence>

      {/* Sentinel for IntersectionObserver */}
      {hasMore && !isLoading && (
        <div ref={sentinelRef} className="h-1 mt-2" aria-hidden />
      )}

      {/* Manual "Load More" fallback (visible when auto-scroll doesn't fire) */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            className="h-11 px-8 border border-border text-[0.65rem] tracking-[0.22em] uppercase text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-200"
          >
            Load More
          </button>
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && products.length > 0 && (
        <p className="text-center text-[0.62rem] tracking-[0.2em] uppercase text-muted-foreground/50 mt-12 pb-2">
          All {products.length} products shown
        </p>
      )}
    </div>
  );
}
