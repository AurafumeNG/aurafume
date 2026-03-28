export interface ShopProduct {
  id: string;
  name: string;
  scentFamily: string;       // e.g. 'Woody · Oriental'
  price: number;             // in NGN
  image: string;
  badge?: 'New' | 'Best Seller' | 'Low Stock';
  href: string;
  rating: number;            // 0–5, supports .5
  reviewCount: number;
  gender: 'Him' | 'Her' | 'Unisex';
  sizes: string[];           // ['30ml', '50ml', '100ml']
  scentTags: string[];       // used for filtering, e.g. ['Woody', 'Oriental']
  createdAt: number;         // unix timestamp for "Newest" sort
}

export interface ShopFilters {
  scentFamilies: string[];
  priceRange: [number, number];
  gender: string;            // '' | 'Him' | 'Her' | 'Unisex'
  sizes: string[];
}

export const DEFAULT_PRICE_RANGE: [number, number] = [0, 300000];

export const DEFAULT_FILTERS: ShopFilters = {
  scentFamilies: [],
  priceRange: DEFAULT_PRICE_RANGE,
  gender: '',
  sizes: [],
};

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export type ViewMode = 'grid' | 'list';

export const SCENT_FAMILIES = ['Floral', 'Woody', 'Fresh', 'Oriental', 'Citrus'] as const;

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price-asc',  label: 'Price: Low–High' },
  { value: 'price-desc', label: 'Price: High–Low' },
  { value: 'popular',    label: 'Most Popular' },
];
