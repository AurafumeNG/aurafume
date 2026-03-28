'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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

// ── Mock data ────────────────────────────────────────────────────────
const ALL_PRODUCTS: ShopProduct[] = [
  {
    id: 'loving-you-frozen',
    name: 'Loving You Frozen',
    scentFamily: 'Floral · Musky',
    scentTags: ['Floral'],
    price: 149500,
    image: '/images/image5.jpeg',
    badge: 'Best Seller',
    href: '/shop/loving-you-frozen',
    rating: 4.8,
    reviewCount: 142,
    gender: 'Her',
    sizes: ['30ml', '50ml', '100ml'],
    createdAt: 1700000000,
  },
  {
    id: 'stronger-for-you-intense',
    name: 'Stronger For You Intense',
    scentFamily: 'Woody · Spicy',
    scentTags: ['Woody'],
    price: 175000,
    image: '/images/image3.jpeg',
    href: '/shop/stronger-for-you-intense',
    rating: 4.5,
    reviewCount: 89,
    gender: 'Him',
    sizes: ['50ml', '100ml'],
    createdAt: 1705000000,
  },
  {
    id: 'stronger-for-you-absolute',
    name: 'Stronger For You Absolute',
    scentFamily: 'Oriental · Resinous',
    scentTags: ['Oriental'],
    price: 185000,
    image: '/images/image11.jpeg',
    badge: 'New',
    href: '/shop/stronger-for-you-absolute',
    rating: 4.7,
    reviewCount: 34,
    gender: 'Him',
    sizes: ['50ml', '100ml'],
    createdAt: 1711000000,
  },
  {
    id: 'suger-edp',
    name: 'Suger EDP',
    scentFamily: 'Fresh · Green',
    scentTags: ['Fresh'],
    price: 139500,
    image: '/images/image1.jpeg',
    href: '/shop/suger-edp',
    rating: 4.2,
    reviewCount: 61,
    gender: 'Unisex',
    sizes: ['30ml', '50ml'],
    createdAt: 1698000000,
  },
  {
    id: 'oud-imperiale',
    name: 'Oud Impériale',
    scentFamily: 'Oud · Oriental',
    scentTags: ['Oriental'],
    price: 235000,
    image: '/images/image8.jpeg',
    badge: 'New',
    href: '/shop/oud-imperiale',
    rating: 4.9,
    reviewCount: 22,
    gender: 'Unisex',
    sizes: ['15ml', '50ml', '100ml'],
    createdAt: 1712000000,
  },
  {
    id: 'aurore-blanche',
    name: 'Aurore Blanche',
    scentFamily: 'White Musk · Floral',
    scentTags: ['Floral', 'Fresh'],
    price: 132000,
    image: '/images/image7.jpeg',
    badge: 'New',
    href: '/shop/aurore-blanche',
    rating: 4.6,
    reviewCount: 18,
    gender: 'Her',
    sizes: ['15ml', '50ml', '100ml'],
    createdAt: 1712500000,
  },
  {
    id: 'vetiver-noir',
    name: 'Vétiver Noir',
    scentFamily: 'Woody · Smoky',
    scentTags: ['Woody'],
    price: 138000,
    image: '/images/image11.jpeg',
    badge: 'New',
    href: '/shop/vetiver-noir',
    rating: 4.4,
    reviewCount: 15,
    gender: 'Him',
    sizes: ['15ml', '50ml', '100ml'],
    createdAt: 1712800000,
  },
  {
    id: 'citrus-bloom',
    name: 'Citrus Bloom',
    scentFamily: 'Citrus · Fresh',
    scentTags: ['Citrus', 'Fresh'],
    price: 98000,
    image: '/images/image2.jpeg',
    href: '/shop/citrus-bloom',
    rating: 4.1,
    reviewCount: 47,
    gender: 'Unisex',
    sizes: ['30ml', '50ml'],
    createdAt: 1695000000,
  },
  {
    id: 'rose-oud',
    name: 'Rose Oud',
    scentFamily: 'Floral · Oriental',
    scentTags: ['Floral', 'Oriental'],
    price: 195000,
    image: '/images/image4.jpeg',
    badge: 'Low Stock',
    href: '/shop/rose-oud',
    rating: 4.7,
    reviewCount: 73,
    gender: 'Her',
    sizes: ['50ml', '100ml'],
    createdAt: 1702000000,
  },
  {
    id: 'cedar-dusk',
    name: 'Cedar Dusk',
    scentFamily: 'Woody · Earthy',
    scentTags: ['Woody'],
    price: 115000,
    image: '/images/image9.jpeg',
    href: '/shop/cedar-dusk',
    rating: 4.3,
    reviewCount: 38,
    gender: 'Him',
    sizes: ['30ml', '50ml', '100ml'],
    createdAt: 1699000000,
  },
  {
    id: 'petite-fleur',
    name: 'Petite Fleur',
    scentFamily: 'Floral · Powdery',
    scentTags: ['Floral'],
    price: 88000,
    image: '/images/image6.jpeg',
    badge: 'Low Stock',
    href: '/shop/petite-fleur',
    rating: 4.0,
    reviewCount: 29,
    gender: 'Her',
    sizes: ['15ml', '30ml'],
    createdAt: 1696000000,
  },
  {
    id: 'amber-noir',
    name: 'Amber Noir',
    scentFamily: 'Oriental · Amber',
    scentTags: ['Oriental'],
    price: 162000,
    image: '/images/image10.jpeg',
    href: '/shop/amber-noir',
    rating: 4.5,
    reviewCount: 56,
    gender: 'Unisex',
    sizes: ['50ml', '100ml'],
    createdAt: 1701000000,
  },
];

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
  const [query,        setQuery]        = useState('');
  const [filters,      setFilters]      = useState<ShopFilters>(DEFAULT_FILTERS);
  const [sortBy,       setSortBy]       = useState<SortOption>('newest');
  const [viewMode,     setViewMode]     = useState<ViewMode>('grid');
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  // Pagination
  const [pageCount,    setPageCount]    = useState(1);
  const [isLoading,    setIsLoading]    = useState(false);

  // Quick add sheet
  const [sheetProduct, setSheetProduct] = useState<ShopProduct | null>(null);
  const [sheetOpen,    setSheetOpen]    = useState(false);

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
    let result = ALL_PRODUCTS.filter(p => {
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
  }, [query, filters, sortBy]);

  // Sliced to current page
  const visibleProducts = displayed.slice(0, pageCount * PAGE_SIZE);
  const hasMore         = displayed.length > pageCount * PAGE_SIZE;

  // Simulated async load (would be a real API fetch in production)
  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      setPageCount(c => c + 1);
      setIsLoading(false);
    }, 650);
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
