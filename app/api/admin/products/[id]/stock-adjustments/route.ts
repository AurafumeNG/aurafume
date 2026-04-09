import { NextRequest, NextResponse }        from 'next/server';
import connectDB                            from '@/lib/mongodb';
import Product                              from '@/models/Product';
import StockAdjustment                      from '@/models/StockAdjustment';
import User                                 from '@/models/User';
import { requireAdmin }                     from '@/lib/admin-auth';
import { sendRestockNotification }          from '@/lib/send-restock-notification';
import type { ApiResponse }                 from '@/types/auth';
import mongoose                             from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET — list stock adjustments for a product ─────────────────────────────────

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await connectDB();
    const adjustments = await StockAdjustment.find({ productId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json<ApiResponse<unknown[]>>({
      success: true,
      data:    adjustments,
    });
  } catch (err) {
    console.error('[stock-adjustments GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── POST — add a manual stock adjustment ──────────────────────────────────────

export async function POST(req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const variantSize = String(body.variantSize ?? '').trim();
  const type        = String(body.type        ?? '') as 'add' | 'remove' | 'set';
  const qty         = Number(body.qty);
  const reason      = String(body.reason ?? '').trim();

  if (!variantSize) {
    return NextResponse.json<ApiResponse>({ error: 'Variant is required.' }, { status: 422 });
  }
  if (!['add', 'remove', 'set'].includes(type)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid adjustment type.' }, { status: 422 });
  }
  if (isNaN(qty) || qty < 0) {
    return NextResponse.json<ApiResponse>({ error: 'Quantity must be a non-negative number.' }, { status: 422 });
  }

  try {
    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json<ApiResponse>({ error: 'Product not found.' }, { status: 404 });
    }

    const variant = product.variants.find(v => v.size === variantSize);
    if (!variant) {
      return NextResponse.json<ApiResponse>({ error: 'Variant not found.' }, { status: 404 });
    }

    const previousStock = variant.stock;
    let newStock: number;
    let adjustment: number;

    switch (type) {
      case 'add':
        newStock   = previousStock + qty;
        adjustment = qty;
        break;
      case 'remove':
        newStock   = Math.max(0, previousStock - qty);
        adjustment = qty;
        break;
      case 'set':
        newStock   = qty;
        adjustment = qty;
        break;
    }

    // Update the variant's stock via arrayFilters
    await Product.findByIdAndUpdate(
      id,
      { $set: { 'variants.$[v].stock': newStock } },
      { arrayFilters: [{ 'v.size': variantSize }] },
    );

    // Resolve admin display name
    let adjustedBy = admin.email;
    try {
      if (mongoose.Types.ObjectId.isValid(admin.userId)) {
        const user = await User.findById(admin.userId).select('firstName lastName').lean();
        if (user) adjustedBy = `${user.firstName} ${user.lastName}`.trim();
      }
    } catch { /* use email as fallback */ }

    const record = await StockAdjustment.create({
      productId:     id,
      variantSize,
      variantSku:    variant.sku ?? '',
      type,
      previousStock,
      adjustment,
      newStock,
      reason,
      adjustedBy,
      adjustedById:  admin.userId,
    });

    // Notify wishlisting customers when a variant comes back in stock (0 → >0)
    if (previousStock === 0 && newStock > 0) {
      sendRestockNotification({
        productId:   id,
        productName: product.name,
        productSlug: product.slug,
        imageUrl:    product.images?.[0]?.url,
        variantSize,
      }).catch((err) => console.error('[restock notification]', err));
    }

    return NextResponse.json<ApiResponse<unknown>>(
      { success: true, data: record.toObject() },
      { status: 201 },
    );
  } catch (err) {
    console.error('[stock-adjustments POST]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
