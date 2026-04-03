// ── Shared types for the Add New Product form ──────────────────────────────────

export interface UploadedImage {
  id:        string;
  url:       string;
  publicId:  string;
  progress?: number; // 0-100 while uploading; undefined = complete
}

export interface ProductVariant {
  id:                string;
  size:              string;
  sku:               string;
  price:             string;
  compareAtPrice:    string;
  costPrice:         string;
  stock:             string;
  lowStockThreshold: string;
  barcode:           string;
}

export interface ProductDraft {
  // Basic Info
  name:             string;
  slug:             string;
  shortDescription: string;
  fullDescription:  string; // raw HTML from WYSIWYG

  // Images
  images: UploadedImage[];

  // Fragrance Details
  fragranceFamilies: string[];
  concentration:     string;
  gender:            string;
  origin:            string;
  launchYear:        string;
  longevity:         string;
  sillage:           string;
  seasons:           string[];
  occasions:         string[];

  // Scent Notes
  topNotes:    string[];
  heartNotes:  string[];
  baseNotes:   string[];

  // Variants
  variants: ProductVariant[];

  // SEO
  metaTitle:       string;
  metaDescription: string;
  keywords:        string[];
  ogImageUrl:      string;

  // Status
  status:            'draft' | 'published' | 'archived';
  visibleInShop:     boolean;
  isFeatured:        boolean;
  isNewArrival:      boolean;
  isBestSeller:      boolean;
  scheduleEnabled:   boolean;
  scheduleDate:      string;
  scheduleTime:      string;

  // Organization
  tags:               string[];
  collections:        string[];
  relatedProductIds:  string[];

  // Shipping
  weight:            string;
  dimL:              string;
  dimW:              string;
  dimH:              string;
  isFragile:         boolean;
  specialPackaging:  boolean;
}

export const EMPTY_DRAFT: ProductDraft = {
  name:             '',
  slug:             '',
  shortDescription: '',
  fullDescription:  '',
  images:           [],
  fragranceFamilies: [],
  concentration:    '',
  gender:           '',
  origin:           '',
  launchYear:       '',
  longevity:        '',
  sillage:          '',
  seasons:          [],
  occasions:        [],
  topNotes:         [],
  heartNotes:       [],
  baseNotes:        [],
  variants:         [],
  metaTitle:        '',
  metaDescription:  '',
  keywords:         [],
  ogImageUrl:       '',
  status:           'draft',
  visibleInShop:    true,
  isFeatured:       false,
  isNewArrival:     false,
  isBestSeller:     false,
  scheduleEnabled:  false,
  scheduleDate:     '',
  scheduleTime:     '',
  tags:             [],
  collections:      [],
  relatedProductIds: [],
  weight:           '',
  dimL:             '',
  dimW:             '',
  dimH:             '',
  isFragile:        false,
  specialPackaging: false,
};

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
