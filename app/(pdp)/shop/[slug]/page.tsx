import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import ProductDetailClient from '@/components/pdp/product-detail-client';
import type { PDPProduct } from '@/components/pdp/types';

// ── DB → PDPProduct conversion ─────────────────────────────────────────────────

interface DbVariant {
  size: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}

interface DbProduct {
  _id: { toString(): string };
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  images: { url: string; publicId: string }[];
  fragranceFamilies: string[];
  concentration: string;
  gender: string;
  origin: string;
  longevity: string;
  sillage: string;
  occasions: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  variants: DbVariant[];
  isBestSeller: boolean;
  isNewArrival: boolean;
}

function dbToPDPProduct(p: DbProduct): PDPProduct {
  let badge: PDPProduct['badge'];
  if (p.isBestSeller) badge = 'Best Seller';
  else if (p.isNewArrival) badge = 'New';
  else if (p.variants.some((v) => v.stock > 0 && v.stock <= v.lowStockThreshold))
    badge = 'Low Stock';

  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    descriptor: p.shortDescription || p.name,
    scentFamily: p.fragranceFamilies.length
      ? p.fragranceFamilies.join(' · ')
      : 'Fragrance',
    badge,
    images: p.images.length
      ? p.images.map((i) => i.url)
      : ['/images/placeholder.jpeg'],
    variants: p.variants.map((v) => ({
      size: v.size,
      price: v.price,
      stock: v.stock,
    })),
    scentNotes: { top: p.topNotes, heart: p.heartNotes, base: p.baseNotes },
    description: p.fullDescription,
    specs: {
      gender: p.gender || '—',
      concentration: p.concentration || '—',
      origin: p.origin || '—',
      longevity: p.longevity || '—',
      sillage: p.sillage || '—',
    },
    occasions: p.occasions,
    relatedSlugs: [],
    bundleSlugs: [],
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const isPreview = sp['preview'] === 'true';

  await connectDB();
  const raw = await Product.findOne({ slug }).lean<DbProduct>();

  if (!raw) notFound();

  const product = dbToPDPProduct(raw);
  const productId = raw._id.toString();

  return (
    <ProductDetailClient
      product={product}
      productId={productId}
      isPreview={isPreview}
    />
  );
}
