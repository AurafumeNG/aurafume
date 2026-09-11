import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Product                      from '@/models/Product';
import { requireAdmin }             from '@/lib/admin-auth';
import { revalidateStorefront }     from '@/lib/revalidate-storefront';
import type { ApiResponse }         from '@/types/auth';
import type { IProduct }            from '@/models/Product';

// ── Helpers ────────────────────────────────────────────────────────────────────

function toNum(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function toScheduledDate(date: string, time: string): Date | undefined {
  if (!date || !time) return undefined;
  const d = new Date(`${date}T${time}`);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Builds a safe, typed update payload from the incoming body.
 * Only includes fields that were present in the request.
 */
function buildUpdatePayload(body: Record<string, unknown>): Partial<IProduct> {
  const update: Record<string, unknown> = {};

  // String fields
  const strings: (keyof IProduct)[] = [
    'name', 'slug', 'shortDescription', 'fullDescription',
    'concentration', 'gender', 'origin', 'longevity', 'sillage',
    'metaTitle', 'metaDescription', 'ogImageUrl',
  ];
  for (const key of strings) {
    if (key in body) update[key] = String(body[key] ?? '').trim();
  }

  // Boolean fields
  const booleans: (keyof IProduct)[] = [
    'visibleInShop', 'isFeatured', 'isNewArrival', 'isBestSeller',
    'isFragile', 'specialPackaging',
  ];
  for (const key of booleans) {
    if (key in body) update[key] = Boolean(body[key]);
  }

  // Status enum
  if ('status' in body) {
    const s = String(body.status);
    if (['draft', 'published', 'archived'].includes(s)) update.status = s;
  }

  // Numeric fields
  if ('launchYear' in body) update.launchYear = toNum(body.launchYear);
  if ('weight'     in body) update.weight     = toNum(body.weight);

  // Dimensions
  if ('dimL' in body || 'dimW' in body || 'dimH' in body) {
    update.dimensions = {
      l: toNum(body.dimL),
      w: toNum(body.dimW),
      h: toNum(body.dimH),
    };
  }

  // Array fields
  const strArrays: (keyof IProduct)[] = [
    'fragranceFamilies', 'seasons', 'occasions',
    'topNotes', 'heartNotes', 'baseNotes',
    'keywords', 'tags', 'collections', 'relatedProductIds',
  ];
  for (const key of strArrays) {
    if (key in body && Array.isArray(body[key])) {
      update[key] = (body[key] as unknown[]).map(String);
    }
  }

  // Images
  if ('images' in body && Array.isArray(body.images)) {
    update.images = (body.images as Record<string, unknown>[]).map(img => ({
      url:      String(img.url      ?? ''),
      publicId: String(img.publicId ?? ''),
    }));
  }

  // Variants
  if ('variants' in body && Array.isArray(body.variants)) {
    update.variants = (body.variants as Record<string, unknown>[]).map(v => ({
      size:              String(v.size ?? '').trim(),
      sku:               String(v.sku  ?? '').trim(),
      price:             toNum(v.price)             ?? 0,
      compareAtPrice:    toNum(v.compareAtPrice),
      costPrice:         toNum(v.costPrice),
      stock:             toNum(v.stock)             ?? 0,
      lowStockThreshold: toNum(v.lowStockThreshold) ?? 5,
      barcode:           String(v.barcode ?? '').trim(),
    }));
  }

  // Schedule
  if ('scheduleEnabled' in body) {
    if (body.scheduleEnabled) {
      const d = toScheduledDate(
        String(body.scheduleDate ?? ''),
        String(body.scheduleTime ?? ''),
      );
      update.scheduledAt = d;
    } else {
      update.scheduledAt = undefined;
    }
  }

  return update as Partial<IProduct>;
}

// ── Route context ──────────────────────────────────────────────────────────────

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET — fetch single product ─────────────────────────────────────────────────

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await connectDB();
    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json<ApiResponse>({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json<ApiResponse<unknown>>({ success: true, data: product });
  } catch (err) {
    console.error('[api/admin/products/[id] GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH — update product ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const update = buildUpdatePayload(body);

  try {
    await connectDB();

    // If slug is being changed, check uniqueness against other docs
    if (update.slug) {
      const conflict = await Product.findOne({ slug: update.slug, _id: { $ne: id } }).lean();
      if (conflict) {
        return NextResponse.json<ApiResponse>(
          { error: `Slug "${update.slug}" is already in use.` },
          { status: 409 },
        );
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).lean();

    if (!product) {
      return NextResponse.json<ApiResponse>({ error: 'Product not found.' }, { status: 404 });
    }

    revalidateStorefront((product as { slug?: string }).slug);

    return NextResponse.json<ApiResponse<unknown>>({ success: true, data: product });
  } catch (err: unknown) {
    console.error('[api/admin/products/[id] PATCH]', err);
    if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
      return NextResponse.json<ApiResponse>(
        { error: 'A product with this slug already exists.' },
        { status: 409 },
      );
    }
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE — archive or permanently delete ─────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id }       = await ctx.params;
  const { searchParams } = new URL(req.url);
  // ?permanent=true permanently removes the document; default is to archive
  const permanent    = searchParams.get('permanent') === 'true';

  try {
    await connectDB();

    if (permanent) {
      const deleted = await Product.findByIdAndDelete(id).lean();
      if (!deleted) {
        return NextResponse.json<ApiResponse>({ error: 'Product not found.' }, { status: 404 });
      }
      revalidateStorefront((deleted as { slug?: string }).slug);
      return NextResponse.json<ApiResponse>({ success: true, message: 'Product permanently deleted.' });
    }

    // Default: archive (soft-delete)
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { status: 'archived', visibleInShop: false } },
      { new: true },
    ).lean();

    if (!product) {
      return NextResponse.json<ApiResponse>({ error: 'Product not found.' }, { status: 404 });
    }

    revalidateStorefront((product as { slug?: string }).slug);

    return NextResponse.json<ApiResponse>({ success: true, message: 'Product archived.' });
  } catch (err) {
    console.error('[api/admin/products/[id] DELETE]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
