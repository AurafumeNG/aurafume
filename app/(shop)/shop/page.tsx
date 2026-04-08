'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar      from '@/components/shop/search-bar';
import FilterSortBar  from '@/components/shop/filter-sort-bar';
import FilterDrawer   from '@/components/shop/filter-drawer';
import ActiveFilters  from '@/components/shop/active-filters';
import ResultsHeader  from '@/components/shop/results-header';
import ProductGrid    from '@/components/shop/product-grid';
import QuickAddSheet  from '@/components/shop/quick-add-sheet';
import {
  DEFAULT_FILTERS,
  DEFAULT_PRICE_RANGE,
  type ShopProduct,
  type ShopFilters,
  type SortOption,
  type ViewMode,
} from '@/components/shop/types';


// ── Constants ────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

// ── Helpers ──────────────────────────────────────────────────────────
function countActiveFilters(f: ShopFilters): number {
  const [defMin, defMax] = DEFAULT_PRICE_RANGE;
  return (
    f.scentFamilies.length +
    (f.gender ? 1 : 0) +
    f.sizes.length +
    (f.priceRange[0] !== defMin || f.priceRange[1] !== defMax ? 1 : 0)
  );
}

// ── Page ─────────────────────────────────────────────────────────────
export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query,        setQuery]        = useState(() => searchParams.get('q') ?? '');
  const [filters,      setFilters]      = useState<ShopFilters>(DEFAULT_FILTERS);
  const [sortBy,       setSortBy]       = useState<SortOption>('newest');
  const [viewMode,     setViewMode]     = useState<ViewMode>('grid');
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  // Pagination
  const [pageCount,    setPageCount]    = useState(1);
  const [isLoading] = useState(false);

  // Quick add sheet
  const [sheetProduct, setSheetProduct] = useState<ShopProduct | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);

  // Products
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) setAllProducts(json.data as ShopProduct[]);
      })
      .catch(() => {});
  }, []);

  // Wishlist
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/wishlist')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) setWishlistedIds(new Set(json.data as string[]));
      })
      .catch(() => {});
  }, []);

  // Keep URL in sync with the search query (debounced)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set('q', query.trim());
      } else {
        params.delete('q');
      }
      router.replace(`/shop?${params.toString()}`, { scroll: false });
    }, 400);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Reset to page 1 whenever filter/search/sort changes
  useEffect(() => { setPageCount(1); }, [query, filters, sortBy]);

  // Scent pill toggle
  function handleScentToggle(family: string) {
    if (family === '__clear__') {
      setFilters(f => ({ ...f, scentFamilies: [] }));
    } else {
      setFilters(f => ({
        ...f,
        scentFamilies: f.scentFamilies.includes(family)
          ? f.scentFamilies.filter(s => s !== family)
          : [...f.scentFamilies, family],
      }));
    }
  }

  // Derived: all filtered + sorted products
  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = allProducts.filter(p => {
      if (q && !p.name.toLowerCase().includes(q) && !p.scentFamily.toLowerCase().includes(q)) return false;
      if (filters.scentFamilies.length > 0 && !filters.scentFamilies.some(f => p.scentTags.includes(f))) return false;
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
      if (filters.gender && p.gender !== filters.gender) return false;
      if (filters.sizes.length > 0 && !filters.sizes.some(s => p.sizes.includes(s))) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'newest')     return b.createdAt - a.createdAt;
      if (sortBy === 'price-asc')  return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular')    return b.reviewCount - a.reviewCount;
      return 0;
    });
  }, [query, filters, sortBy, allProducts]);

  // Sliced to current page
  const visibleProducts = displayed.slice(0, pageCount * PAGE_SIZE);
  const hasMore         = displayed.length > pageCount * PAGE_SIZE;

  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setPageCount(c => c + 1);
  }, [isLoading, hasMore]);

  function handleQuickAdd(product: ShopProduct) {
    setSheetProduct(product);
    setSheetOpen(true);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setQuery('');
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Search bar */}
      <SearchBar value={query} onChange={setQuery} />

      {/* Filter + sort bar (sticky below ShopNavBar) */}
      <FilterSortBar
        activeScentFamilies={filters.scentFamilies}
        onScentToggle={handleScentToggle}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeFilterCount={countActiveFilters(filters)}
        onFilterOpen={() => setDrawerOpen(true)}
      />

      {/* Active filter tags */}
      <ActiveFilters
        filters={filters}
        onRemoveScentFamily={f => setFilters(d => ({ ...d, scentFamilies: d.scentFamilies.filter(s => s !== f) }))}
        onRemoveGender={() => setFilters(d => ({ ...d, gender: '' }))}
        onRemoveSize={s => setFilters(d => ({ ...d, sizes: d.sizes.filter(x => x !== s) }))}
        onRemovePriceRange={() => setFilters(d => ({ ...d, priceRange: DEFAULT_PRICE_RANGE }))}
        onClearAll={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Results count + view toggle */}
      <ResultsHeader
        count={displayed.length}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />

      {/* Product grid + infinite scroll */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <ProductGrid
          products={visibleProducts}
          viewMode={viewMode}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          onQuickAdd={handleQuickAdd}
          onClearFilters={clearFilters}
          wishlistedIds={wishlistedIds}
        />
      </div>

      {/* Filter drawer */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      {/* Quick add bottom sheet */}
      <QuickAddSheet
        product={sheetProduct}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />

    </div>
  );
}
