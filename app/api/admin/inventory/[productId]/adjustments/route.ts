import { NextRequest, NextResponse } from 'next/server';
import mongoose                      from 'mongoose';
import connectDB                     from '@/lib/mongodb';
import StockAdjustment               from '@/models/StockAdjustment';
import Order                         from '@/models/Order';
import { requireAdmin }              from '@/lib/admin-auth';
import type { ApiResponse }          from '@/types/auth';

interface RouteContext {
  params: Promise<{ productId: string }>;
}

// ── GET /api/admin/inventory/[productId]/adjustments ──────────────────────────
// Supports ?page, ?limit, ?variantSize, ?type, ?from, ?to

export async function GET(req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { productId } = await ctx.params;
  if (!mongoose.isValidObjectId(productId)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid product ID.' }, { status: 400 });
  }

  const sp          = req.nextUrl.searchParams;
  const page        = Math.max(1, parseInt(sp.get('page')  ?? '1',  10));
  const limit       = Math.min(50, parseInt(sp.get('limit') ?? '20', 10));
  const variantSize = sp.get('variantSize') ?? '';
  const typeFilter  = sp.get('type')        ?? '';   // 'add' | 'remove' | 'set'
  const from        = sp.get('from')        ?? '';
  const to          = sp.get('to')          ?? '';

  try {
    await connectDB();

    // ── Build filter ──────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { productId };
    if (variantSize) filter.variantSize = variantSize;
    if (typeFilter && ['add', 'remove', 'set'].includes(typeFilter)) filter.type = typeFilter;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).getTime() + 86399999); // end of day
    }

    const [items, total] = await Promise.all([
      StockAdjustment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      StockAdjustment.countDocuments(filter),
    ]);

    // For 'remove' adjustments, try to find a matching order by date proximity
    // (a heuristic: if reason looks like order number, extract it)
    // We enrich each item with an orderRef if the reason contains an order number pattern
    const enriched = items.map((adj) => {
      const reason = adj.reason ?? '';
      // Try to extract order number from reason like "#ORD-2024-00248"
      const orderMatch = reason.match(/#?(ORD-[\w-]+)/i);
      return {
        _id:           (adj._id as { toString(): string }).toString(),
        variantSize:   adj.variantSize,
        variantSku:    adj.variantSku,
        type:          adj.type,
        adjustment:    adj.adjustment,
        previousStock: adj.previousStock,
        newStock:      adj.newStock,
        reason:        adj.reason,
        adjustedBy:    adj.adjustedBy,
        adjustedById:  adj.adjustedById,
        createdAt:     adj.createdAt.toISOString(),
        orderRef:      orderMatch ? orderMatch[1] : null,
      };
    });

    // For 'remove' adjustments without a reason-based orderRef,
    // try to find the order by date match (within 1 minute)
    // This is best-effort — don't fail if it doesn't work
    const removeItems = enriched.filter((e) => e.type === 'remove' && !e.orderRef);
    if (removeItems.length > 0) {
      await Promise.all(
        removeItems.map(async (item) => {
          try {
            const adjDate = new Date(item.createdAt);
            const order = await Order.findOne({
              'items.productId': productId,
              'items.size':      item.variantSize,
              createdAt: {
                $gte: new Date(adjDate.getTime() - 60000),
                $lte: new Date(adjDate.getTime() + 60000),
              },
            }).select('orderNumber').lean();
            if (order) item.orderRef = (order as { orderNumber: string }).orderNumber;
          } catch { /* ignore */ }
        }),
      );
    }

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: {
        items:      enriched,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/inventory/[productId]/adjustments]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
