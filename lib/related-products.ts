import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import type { RelatedProduct } from '@/components/pdp/types';

// ── DB shapes ──────────────────────────────────────────────────────────────────

interface LeanVariant {
  size:              string;
  price:             number;
  stock:             number;
  lowStockThreshold: number;
}

interface LeanRelated {
  _id:               mongoose.Types.ObjectId;
  slug:              string;
  name:              string;
  fragranceFamilies: string[];
  images:            { url: string }[];
  variants:          LeanVariant[];
  isBestSeller:      boolean;
  isNewArrival:      boolean;
}

const SELECT = 'slug name fragranceFamilies images variants isBestSeller isNewArrival';
const BASE   = { status: 'published', visibleInShop: true } as const;

function toRelated(p: LeanRelated): RelatedProduct {
  let badge: RelatedProduct['badge'];
  if (p.isBestSeller) badge = 'Best Seller';
  else if (p.isNewArrival) badge = 'New';
  else if (p.variants.some(v => v.stock > 0 && v.stock <= v.lowStockThreshold))
    badge = 'Low Stock';

  return {
    id:          p._id.toString(),
    slug:        p.slug,
    name:        p.name,
    scentFamily: p.fragranceFamilies.length ? p.fragranceFamilies.join(' · ') : 'Fragrance',
    image:       p.images[0]?.url ?? '',
    badge,
    variants:    p.variants.map(v => ({ size: v.size, price: v.price, stock: v.stock })),
  };
}

/** Only ids that are valid ObjectIds — the field is typed as string[]. */
function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
  return ids
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
}

/**
 * Resolves the products to show alongside `source`.
 *
 * Priority: explicitly linked `relatedProductIds` → other published products
 * sharing a fragrance family → most recent published products. Products with no
 * sellable variant are dropped, and the source product is never included.
 */
export async function getRelatedProducts(
  source: { id: string; fragranceFamilies: string[] },
  limit = 4,
): Promise<RelatedProduct[]> {
  await connectDB();

  const excluded = new Set<string>([source.id]);
  const picked: LeanRelated[] = [];

  async function fill(query: Record<string, unknown>, sort?: Record<string, 1 | -1>) {
    if (picked.length >= limit) return;
    const cursor = Product.find({
      ...BASE,
      ...query,
      _id: { $nin: Array.from(excluded).filter(mongoose.Types.ObjectId.isValid) },
    }).select(SELECT).limit(limit - picked.length);

    const rows = await (sort ? cursor.sort(sort) : cursor).lean<LeanRelated[]>();
    for (const row of rows) {
      picked.push(row);
      excluded.add(row._id.toString());
    }
  }

  // 1 — explicitly linked products, in the order the admin set them
  const linkedIds = toObjectIds(
    (await Product.findById(source.id).select('relatedProductIds').lean<{ relatedProductIds?: string[] }>())
      ?.relatedProductIds ?? [],
  );

  if (linkedIds.length) {
    const rows = await Product.find({ ...BASE, _id: { $in: linkedIds } })
      .select(SELECT)
      .lean<LeanRelated[]>();

    const byId = new Map(rows.map(r => [r._id.toString(), r]));
    for (const oid of linkedIds) {
      const row = byId.get(oid.toString());
      if (row && !excluded.has(row._id.toString()) && picked.length < limit) {
        picked.push(row);
        excluded.add(row._id.toString());
      }
    }
  }

  // 2 — same fragrance family
  if (source.fragranceFamilies.length) {
    await fill({ fragranceFamilies: { $in: source.fragranceFamilies } }, { createdAt: -1 });
  }

  // 3 — anything else recent
  await fill({}, { createdAt: -1 });

  return picked.map(toRelated).filter(p => p.variants.length > 0);
}

/** Related products for a set of cart slugs, excluding anything already in the cart. */
export async function getUpsellProducts(
  slugs: string[],
  limit = 6,
): Promise<RelatedProduct[]> {
  await connectDB();

  const sources = await Product.find({ ...BASE, slug: { $in: slugs } })
    .select('_id fragranceFamilies')
    .lean<{ _id: mongoose.Types.ObjectId; fragranceFamilies: string[] }[]>();

  if (sources.length === 0) return [];

  const families = Array.from(new Set(sources.flatMap(s => s.fragranceFamilies)));

  const linked = await Product.find({ _id: { $in: sources.map(s => s._id) } })
    .select('relatedProductIds')
    .lean<{ relatedProductIds?: string[] }[]>();

  const linkedIds = toObjectIds(linked.flatMap(l => l.relatedProductIds ?? []));

  const excludedSlugs = new Set(slugs);
  const seen = new Set<string>();
  const picked: LeanRelated[] = [];

  function take(rows: LeanRelated[]) {
    for (const row of rows) {
      const id = row._id.toString();
      if (seen.has(id) || excludedSlugs.has(row.slug) || picked.length >= limit) continue;
      seen.add(id);
      picked.push(row);
    }
  }

  if (linkedIds.length) {
    take(await Product.find({ ...BASE, _id: { $in: linkedIds } }).select(SELECT).lean<LeanRelated[]>());
  }

  if (picked.length < limit && families.length) {
    take(
      await Product.find({ ...BASE, fragranceFamilies: { $in: families } })
        .select(SELECT)
        .sort({ createdAt: -1 })
        .limit(limit * 2)
        .lean<LeanRelated[]>(),
    );
  }

  return picked.map(toRelated).filter(p => p.variants.length > 0);
}
