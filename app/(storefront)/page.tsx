import connectDB       from '@/lib/mongodb';
import ProductModel    from '@/models/Product';
import HeroSection     from '@/components/hero-section';
import FeaturedProducts from '@/components/featured-products';
import NewArrivals     from '@/components/new-arrivals';
import CategoryHighlights from '@/components/category-highlights';
import BrandStory      from '@/components/brand-story';
import BestSellers     from '@/components/product-carousel-alt';
import ScentFinder     from '@/components/scent-finder';
import WholesaleBanner from '@/components/wholesale-banner';
import type { Product } from '@/components/product-card';
import type { Arrival } from '@/components/new-arrivals';
import type { Category } from '@/components/category-highlights';
import type { BestSellerProduct, BestSellerGender } from '@/components/product-carousel-alt';

// Storefront content is prerendered, then refreshed at most once a minute.
// Admin product writes also revalidate this path on demand for immediate updates.
export const revalidate = 60;

// ── Helpers ────────────────────────────────────────────────────────────────────

type DbVariant = { size: string; price: number; stock: number; lowStockThreshold: number };
type DbImage   = { url: string; publicId: string };

interface DbProduct {
  _id:               { toString(): string };
  name:              string;
  slug:              string;
  shortDescription:  string;
  fragranceFamilies: string[];
  gender:            string;
  images:            DbImage[];
  variants:          DbVariant[];
  isBestSeller:      boolean;
  isNewArrival:      boolean;
}

// Scent families the mosaic can surface, in the order they should appear.
// A family only becomes a tile when at least one published product carries it.
const SCENT_CATEGORIES: { id: string; name: string; descriptor: string }[] = [
  { id: 'floral',   name: 'Floral',   descriptor: 'Romantic · Delicate'   },
  { id: 'fresh',    name: 'Fresh',    descriptor: 'Clean · Airy'          },
  { id: 'woody',    name: 'Woody',    descriptor: 'Earthy · Grounded'     },
  { id: 'oriental', name: 'Oriental', descriptor: 'Opulent · Warm'        },
  { id: 'citrus',   name: 'Citrus',   descriptor: 'Bright · Zesty'        },
];

function badge(p: DbProduct): string | undefined {
  if (p.isBestSeller) return 'Best Seller';
  if (p.isNewArrival) return 'New';
  const hasLowStock = p.variants.some(v => v.stock > 0 && v.stock <= v.lowStockThreshold);
  if (hasLowStock) return 'Low Stock';
  return undefined;
}

function minPrice(p: DbProduct): number {
  if (!p.variants.length) return 0;
  return Math.min(...p.variants.map(v => v.price));
}

function notes(p: DbProduct): string {
  return p.fragranceFamilies.length ? p.fragranceFamilies.join(' · ') : 'Fragrance';
}

function toGender(raw: string): BestSellerGender {
  const lower = raw.toLowerCase();
  if (lower.includes('mascu') || lower.includes('him'))  return 'him';
  if (lower.includes('femin') || lower.includes('her'))  return 'her';
  return 'unisex';
}

function toFeatured(p: DbProduct): Product {
  return {
    id:    p._id.toString(),
    name:  p.name,
    notes: notes(p),
    price: minPrice(p),
    image: p.images[0]?.url ?? '',
    badge: badge(p),
    href:  `/shop/${p.slug}`,
    sizes: p.variants.map(v => v.size),
  };
}

function toArrival(p: DbProduct): Arrival {
  return {
    id:         p._id.toString(),
    name:       p.name,
    descriptor: p.shortDescription || p.name,
    notes:      notes(p),
    image:      p.images[0]?.url ?? '',
    sizes:      p.variants.map(v => ({ label: v.size, price: v.price })),
  };
}

function toBestSeller(p: DbProduct): BestSellerProduct {
  return {
    id:          p._id.toString(),
    name:        p.name,
    notes:       notes(p),
    gender:      toGender(p.gender),
    price:       minPrice(p),
    frontImage:  p.images[0]?.url ?? '',
    backImage:   p.images[1]?.url ?? p.images[0]?.url ?? '',
    badge:       badge(p),
    href:        `/shop/${p.slug}`,
  };
}

// ── Data fetching ──────────────────────────────────────────────────────────────

const SELECT = 'name slug shortDescription fragranceFamilies gender images variants isBestSeller isNewArrival';
const BASE   = { status: 'published', visibleInShop: true };

/** Builds the "Shop by Scent" tiles from the families products actually have. */
function toCategories(all: DbProduct[]): Category[] {
  return SCENT_CATEGORIES.flatMap(({ id, name, descriptor }) => {
    const cover = all.find(
      p => p.fragranceFamilies.some(f => f.toLowerCase() === id) && p.images[0]?.url,
    );
    if (!cover) return [];
    return [{
      id,
      name,
      descriptor,
      image: cover.images[0].url,
      href:  `/shop?scent=${id}`,
    }];
  });
}

async function getStorefrontData() {
  try {
    await connectDB();

    const [featuredRaw, newArrivalsRaw, bestSellersRaw, allRaw] = await Promise.all([
      ProductModel.find({ ...BASE, isFeatured:   true }).sort({ createdAt: -1 }).limit(4).select(SELECT).lean(),
      ProductModel.find({ ...BASE, isNewArrival: true }).sort({ createdAt: -1 }).limit(3).select(SELECT).lean(),
      ProductModel.find({ ...BASE, isBestSeller: true }).sort({ createdAt: -1 }).limit(8).select(SELECT).lean(),
      ProductModel.find(BASE).sort({ createdAt: -1 }).select('fragranceFamilies images').lean(),
    ]);

    return {
      featured:    (featuredRaw    as unknown as DbProduct[]).map(toFeatured),
      newArrivals: (newArrivalsRaw as unknown as DbProduct[]).map(toArrival),
      bestSellers: (bestSellersRaw as unknown as DbProduct[]).map(toBestSeller),
      categories:  toCategories(allRaw as unknown as DbProduct[]),
    };
  } catch {
    return { featured: [], newArrivals: [], bestSellers: [], categories: [] };
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function Home() {
  const { featured, newArrivals, bestSellers, categories } = await getStorefrontData();

  return (
    <>
      <HeroSection />
      <FeaturedProducts products={featured} />
      <NewArrivals      arrivals={newArrivals} />
      <CategoryHighlights categories={categories} />
      <BrandStory />
      <BestSellers      products={bestSellers} />
      <WholesaleBanner />
      <ScentFinder />
    </>
  );
}
