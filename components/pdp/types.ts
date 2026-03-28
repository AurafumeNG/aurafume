export interface SizeVariant {
  size: string;
  price: number;
  stock: number; // 0 = out of stock, ≤3 = low stock
}

export interface ScentNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface FragranceSpecs {
  gender: string;
  concentration: string;
  origin: string;
  longevity: string;
  sillage: string;
}

export interface PDPProduct {
  id: string;
  slug: string;
  name: string;
  descriptor: string;
  scentFamily: string;
  badge?: 'New' | 'Best Seller' | 'Low Stock';
  images: string[];
  variants: SizeVariant[];
  scentNotes: ScentNotes;
  description: string;
  specs: FragranceSpecs;
  occasions: string[];
  relatedSlugs: string[];
  bundleSlugs: string[];
}
