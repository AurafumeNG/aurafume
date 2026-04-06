import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Product                      from '@/models/Product';
import StockAdjustment              from '@/models/StockAdjustment';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── GET /api/admin/inventory ──────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const now           = new Date();
    const startOfToday  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      products,
      velocityAgg,
      lastRestockedAgg,
      lastSoldAgg,
      todayMovements,
      chartAgg,
    ] = await Promise.all([
      Product.find({})
        .select('name slug fragranceFamilies status images variants')
        .lean(),

      // Units sold per variant in last 30 days
      StockAdjustment.aggregate([
        { $match: { type: 'remove', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id:       { productId: '$productId', variantSize: '$variantSize' },
          unitsSold: { $sum: '$adjustment' },
        }},
      ]),

      // Most recent restock per variant
      StockAdjustment.aggregate([
        { $match: { type: { $in: ['add', 'set'] } } },
        { $sort: { createdAt: -1 } },
        { $group: {
          _id:          { productId: '$productId', variantSize: '$variantSize' },
          lastRestocked: { $first: '$createdAt' },
        }},
      ]),

      // Most recent sale per variant
      StockAdjustment.aggregate([
        { $match: { type: 'remove' } },
        { $sort: { createdAt: -1 } },
        { $group: {
          _id:      { productId: '$productId', variantSize: '$variantSize' },
          lastSold: { $first: '$createdAt' },
        }},
      ]),

      // Movements today
      StockAdjustment.countDocuments({ createdAt: { $gte: startOfToday } }),

      // Chart data — daily additions & removals for last 90 days
      StockAdjustment.aggregate([
        { $match: { createdAt: { $gte: ninetyDaysAgo } } },
        { $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          total: { $sum: '$adjustment' },
        }},
        { $sort: { '_id.date': 1 } },
      ]),
    ]);

    // ── Build lookup maps ───────────────────────────────────────────────────────

    const velocityMap      = new Map<string, number>();
    const lastRestockedMap = new Map<string, Date>();
    const lastSoldMap      = new Map<string, Date>();

    for (const v of velocityAgg as { _id: { productId: string; variantSize: string }; unitsSold: number }[]) {
      velocityMap.set(`${v._id.productId}::${v._id.variantSize}`, v.unitsSold);
    }
    for (const v of lastRestockedAgg as { _id: { productId: string; variantSize: string }; lastRestocked: Date }[]) {
      lastRestockedMap.set(`${v._id.productId}::${v._id.variantSize}`, v.lastRestocked);
    }
    for (const v of lastSoldAgg as { _id: { productId: string; variantSize: string }; lastSold: Date }[]) {
      lastSoldMap.set(`${v._id.productId}::${v._id.variantSize}`, v.lastSold);
    }

    // ── Chart data ──────────────────────────────────────────────────────────────

    const chartMap = new Map<string, { added: number; removed: number }>();
    for (const entry of chartAgg as { _id: { date: string; type: string }; total: number }[]) {
      const { date, type } = entry._id;
      if (!chartMap.has(date)) chartMap.set(date, { added: 0, removed: 0 });
      const d = chartMap.get(date)!;
      if (type === 'add' || type === 'set') d.added  += entry.total;
      else if (type === 'remove')           d.removed += entry.total;
    }
    const chartData = Array.from(chartMap.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Shape products + compute stats ──────────────────────────────────────────

    let totalSkus   = 0;
    let outOfStock  = 0;
    let lowStock    = 0;
    let wellStocked = 0;
    let stockValue  = 0;

    const categoriesSet   = new Set<string>();
    const variantSizesSet = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapedProducts = (products as any[]).map((p) => {
      const productId = (p._id as { toString(): string }).toString();
      const category  = (p.fragranceFamilies as string[])?.[0] ?? 'Uncategorized';
      categoriesSet.add(category);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shapedVariants = (p.variants as any[]).map((v) => {
        totalSkus++;
        variantSizesSet.add(v.size as string);

        const key       = `${productId}::${v.size}`;
        const unitsSold = velocityMap.get(key) ?? 0;
        const velocity  = Math.round((unitsSold / 30) * 10) / 10; // per day, 1 dp
        const daysLeft  = velocity > 0
          ? Math.floor((v.stock as number) / velocity)
          : (v.stock as number) > 0 ? 9999 : 0;

        const cost = (v.costPrice as number | undefined) ?? 0;
        const val  = cost * (v.stock as number);
        stockValue += val;

        if ((v.stock as number) === 0)                                      outOfStock++;
        else if ((v.stock as number) <= (v.lowStockThreshold as number))    lowStock++;
        else                                                                 wellStocked++;

        return {
          size:              v.size,
          sku:               v.sku ?? '',
          stock:             v.stock,
          lowStockThreshold: v.lowStockThreshold,
          costPrice:         cost,
          stockValue:        val,
          unitsSold,
          velocity,
          daysLeft,
          lastRestocked: lastRestockedMap.get(key)?.toISOString() ?? null,
          lastSold:      lastSoldMap.get(key)?.toISOString()      ?? null,
        };
      });

      return {
        _id:      productId,
        name:     p.name,
        slug:     p.slug,
        category,
        status:   p.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image:    (p.images as any[])?.[0]?.url ?? '',
        variants: shapedVariants,
      };
    });

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: {
        stats: { totalSkus, outOfStock, lowStock, wellStocked, stockValue, todayMovements },
        products: shapedProducts,
        chartData,
        categories:   Array.from(categoriesSet).sort(),
        variantSizes: Array.from(variantSizesSet).sort(),
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/inventory]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
