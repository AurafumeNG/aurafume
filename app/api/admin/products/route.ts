import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Product                      from '@/models/Product';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';
import type { IProduct }            from '@/models/Product';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Convert a string to a non-negative number, returning undefined if blank/NaN. */
function toNum(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

/** Combine a YYYY-MM-DD date string and HH:mm time string into a Date. */
function toScheduledDate(date: string, time: string): Date | undefined {
  if (!date || !time) return undefined;
  const d = new Date(`${date}T${time}`);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Strips unknown keys and coerces types from the incoming JSON body. */
function buildProductDoc(body: Record<string, unknown>, adminId: string) {
  const variants = (Array.isArray(body.variants) ? body.variants : []).map(
    (v: Record<string, unknown>) => ({
      size:              String(v.size ?? '').trim(),
      sku:               String(v.sku  ?? '').trim(),
      price:             toNum(v.price)             ?? 0,
      compareAtPrice:    toNum(v.compareAtPrice),
      costPrice:         toNum(v.costPrice),
      stock:             toNum(v.stock)             ?? 0,
      lowStockThreshold: toNum(v.lowStockThreshold) ?? 5,
      barcode:           String(v.barcode ?? '').trim(),
    }),
  );

  const images = (Array.isArray(body.images) ? body.images : []).map(
    (img: Record<string, unknown>) => ({
      url:      String(img.url      ?? ''),
      publicId: String(img.publicId ?? ''),
    }),
  );

  const dimensions =
    toNum(body.dimL) !== undefined ||
    toNum(body.dimW) !== undefined ||
    toNum(body.dimH) !== undefined
      ? { l: toNum(body.dimL), w: toNum(body.dimW), h: toNum(body.dimH) }
      : undefined;

  const scheduleEnabled = Boolean(body.scheduleEnabled);
  const scheduledAt = scheduleEnabled
    ? toScheduledDate(String(body.scheduleDate ?? ''), String(body.scheduleTime ?? ''))
    : undefined;

  return {
    name:             String(body.name             ?? '').trim(),
    slug:             String(body.slug             ?? '').trim().toLowerCase(),
    shortDescription: String(body.shortDescription ?? '').trim(),
    fullDescription:  String(body.fullDescription  ?? ''),
    images,
    fragranceFamilies: Array.isArray(body.fragranceFamilies) ? body.fragranceFamilies.map(String) : [],
    concentration:    String(body.concentration ?? ''),
    gender:           String(body.gender        ?? ''),
    origin:           String(body.origin        ?? '').trim(),
    launchYear:       toNum(body.launchYear),
    longevity:        String(body.longevity ?? ''),
    sillage:          String(body.sillage   ?? ''),
    seasons:          Array.isArray(body.seasons)   ? body.seasons.map(String)   : [],
    occasions:        Array.isArray(body.occasions)  ? body.occasions.map(String)  : [],
    topNotes:         Array.isArray(body.topNotes)   ? body.topNotes.map(String)   : [],
    heartNotes:       Array.isArray(body.heartNotes) ? body.heartNotes.map(String) : [],
    baseNotes:        Array.isArray(body.baseNotes)  ? body.baseNotes.map(String)  : [],
    variants,
    metaTitle:        String(body.metaTitle       ?? '').trim(),
    metaDescription:  String(body.metaDescription ?? '').trim(),
    keywords:         Array.isArray(body.keywords)    ? body.keywords.map(String)    : [],
    ogImageUrl:       String(body.ogImageUrl ?? ''),
    status:           (['draft', 'published', 'archived'].includes(String(body.status))
                         ? body.status
                         : 'draft') as IProduct['status'],
    visibleInShop:    body.visibleInShop   !== false,
    isFeatured:       Boolean(body.isFeatured),
    isNewArrival:     Boolean(body.isNewArrival),
    isBestSeller:     Boolean(body.isBestSeller),
    scheduledAt,
    tags:              Array.isArray(body.tags)        ? body.tags.map(String)        : [],
    collections:       Array.isArray(body.collections)  ? body.collections.map(String)  : [],
    relatedProductIds: Array.isArray(body.relatedProductIds) ? body.relatedProductIds.map(String) : [],
    weight:           toNum(body.weight),
    dimensions,
    isFragile:        Boolean(body.isFragile),
    specialPackaging: Boolean(body.specialPackaging),
    createdBy:        adminId,
  };
}

function validateForPublish(doc: ReturnType<typeof buildProductDoc>) {
  const errors: string[] = [];
  if (!doc.name)  errors.push('Product name is required.');
  if (!doc.slug)  errors.push('Slug is required.');
  if (!doc.variants.length)            errors.push('At least one variant is required.');
  if (doc.variants.some(v => !v.price)) errors.push('All variants must have a price.');
  if (!doc.shortDescription)           errors.push('Short description is required.');
  return errors;
}

// ── POST — create product ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const doc = buildProductDoc(body, admin.userId);

  // Always validate name + slug. For publish, run full validation.
  if (!doc.name) {
    return NextResponse.json<ApiResponse>({ error: 'Product name is required.' }, { status: 422 });
  }
  if (!doc.slug) {
    return NextResponse.json<ApiResponse>({ error: 'Slug is required.' }, { status: 422 });
  }
  if (doc.status === 'published') {
    const errors = validateForPublish(doc);
    if (errors.length) {
      return NextResponse.json<ApiResponse>({ error: errors.join(' ') }, { status: 422 });
    }
  }

  try {
    await connectDB();

    // Slug uniqueness check
    const existing = await Product.findOne({ slug: doc.slug }).lean();
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { error: `Slug "${doc.slug}" is already in use. Choose a different slug.` },
        { status: 409 },
      );
    }

    const product = await Product.create(doc);

    return NextResponse.json<ApiResponse<{ id: string; slug: string }>>(
      { success: true, data: { id: product._id.toString(), slug: product.slug } },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error('[api/admin/products POST]', err);

    // Mongoose duplicate key
    if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
      return NextResponse.json<ApiResponse>(
        { error: 'A product with this slug already exists.' },
        { status: 409 },
      );
    }

    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── GET — list products ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const q        = searchParams.get('q')        ?? '';
  const status   = searchParams.get('status')   ?? '';   // 'draft' | 'published' | 'archived'
  const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20', 10));

  const filter: Record<string, unknown> = {};

  if (q.trim()) {
    filter.$or = [
      { name:           { $regex: q, $options: 'i' } },
      { slug:           { $regex: q, $options: 'i' } },
      { 'variants.sku': { $regex: q, $options: 'i' } },
    ];
  }

  if (['draft', 'published', 'archived'].includes(status)) {
    filter.status = status;
  }

  try {
    await connectDB();

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('name slug status isFeatured isNewArrival isBestSeller variants images createdAt')
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json<ApiResponse<{
      products: unknown[];
      total:    number;
      page:     number;
      pages:    number;
    }>>({
      success: true,
      data: {
        products,
        total,
        page,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('[api/admin/products GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
