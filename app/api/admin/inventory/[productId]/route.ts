import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import StockAdjustment from '@/models/StockAdjustment';
import User from '@/models/User';
import { requireAdmin } from '@/lib/admin-auth';
import type { ApiResponse } from '@/types/auth';

interface RouteContext {
  params: Promise<{ productId: string }>;
}

// ── GET /api/admin/inventory/[productId] ───────────────────────────────────────

export async function GET(_req: NextRequest, ctx: RouteContext) {
  // const admin = await requireAdmin();
  // if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { productId } = await ctx.params;
  if (!mongoose.isValidObjectId(productId)) {
    return NextResponse.json<ApiResponse>(
      { error: 'Invalid product ID.' },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json<ApiResponse>(
        { error: 'Product not found.' },
        { status: 404 },
      );
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    const [
      salesAllTime,
      sales30d,
      chartAgg,
      lastSoldAgg,
      lastRestockedAgg,
      wishlisted,
      creatorDoc,
    ] = await Promise.all([
      // All-time units sold + revenue per variant size
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            'items.productId': productId,
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.productId': productId } },
        {
          $group: {
            _id: '$items.size',
            units: { $sum: '$items.qty' },
            revenue: {
              $sum: { $multiply: ['$items.qty', '$items.pricePerUnit'] },
            },
          },
        },
      ]),

      // 30d units sold + revenue per variant size
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            'items.productId': productId,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.productId': productId } },
        {
          $group: {
            _id: '$items.size',
            units: { $sum: '$items.qty' },
            revenue: {
              $sum: { $multiply: ['$items.qty', '$items.pricePerUnit'] },
            },
          },
        },
      ]),

      // 90-day chart data (daily, per variant)
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            'items.productId': productId,
            createdAt: { $gte: ninetyDaysAgo },
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.productId': productId } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              size: '$items.size',
            },
            units: { $sum: '$items.qty' },
            revenue: {
              $sum: { $multiply: ['$items.qty', '$items.pricePerUnit'] },
            },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),

      // Last sold per variant (most recent order)
      Order.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' },
            'items.productId': productId,
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.productId': productId } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$items.size',
            lastSold: { $first: '$createdAt' },
          },
        },
      ]),

      // Last restocked per variant (most recent 'add' adjustment)
      StockAdjustment.aggregate([
        { $match: { productId, type: 'add' } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$variantSize',
            date: { $first: '$createdAt' },
            qty: { $first: '$adjustment' },
            previousStock: { $first: '$previousStock' },
            newStock: { $first: '$newStock' },
            by: { $first: '$adjustedBy' },
          },
        },
      ]),

      // Wishlist count
      User.countDocuments({ wishlist: productId }),

      // Creator name
      (async () => {
        if (!product.createdBy) return null;
        try {
          if (mongoose.Types.ObjectId.isValid(product.createdBy)) {
            return User.findById(product.createdBy)
              .select('firstName lastName')
              .lean();
          }
        } catch {
          /* ignore */
        }
        return null;
      })(),
    ]);

    // ── Build lookup maps ────────────────────────────────────────────────────────

    type AggItem = { _id: string; units: number; revenue: number };
    const allTimeMap = new Map<string, { units: number; revenue: number }>();
    for (const r of salesAllTime as AggItem[])
      allTimeMap.set(r._id, { units: r.units, revenue: r.revenue });

    const month30Map = new Map<string, { units: number; revenue: number }>();
    for (const r of sales30d as AggItem[])
      month30Map.set(r._id, { units: r.units, revenue: r.revenue });

    const lastSoldMap = new Map<string, Date>();
    for (const r of lastSoldAgg as { _id: string; lastSold: Date }[])
      lastSoldMap.set(r._id, r.lastSold);

    const lastRestockedMap = new Map<
      string,
      {
        date: Date;
        qty: number;
        previousStock: number;
        newStock: number;
        by: string;
      }
    >();
    for (const r of lastRestockedAgg as {
      _id: string;
      date: Date;
      qty: number;
      previousStock: number;
      newStock: number;
      by: string;
    }[]) {
      lastRestockedMap.set(r._id, r);
    }

    // ── Chart data ────────────────────────────────────────────────────────────────

    // Collect all unique dates + variant sizes
    type ChartAggItem = {
      _id: { date: string; size: string };
      units: number;
      revenue: number;
    };
    const chartDateMap = new Map<
      string,
      Record<string, { units: number; revenue: number }>
    >();
    for (const r of chartAgg as ChartAggItem[]) {
      const { date, size } = r._id;
      if (!chartDateMap.has(date)) chartDateMap.set(date, {});
      chartDateMap.get(date)![size] = { units: r.units, revenue: r.revenue };
    }
    const chartData = Array.from(chartDateMap.entries())
      .map(([date, byVariant]) => ({ date, byVariant }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Variant stats ─────────────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = product as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variantStats = (p.variants as any[]).map((v: any) => {
      const allT = allTimeMap.get(v.size as string) ?? { units: 0, revenue: 0 };
      const m30 = month30Map.get(v.size as string) ?? { units: 0, revenue: 0 };
      const vel = Math.round((m30.units / 30) * 10) / 10;
      const days =
        vel > 0
          ? Math.floor((v.stock as number) / vel)
          : (v.stock as number) > 0
            ? 9999
            : 0;
      const lr = lastRestockedMap.get(v.size as string) ?? null;
      const ls = lastSoldMap.get(v.size as string) ?? null;
      return {
        size: v.size,
        unitsSoldAllTime: allT.units,
        revenueAllTime: allT.revenue,
        unitsSold30d: m30.units,
        velocity: vel,
        daysLeft: days,
        lastRestocked: lr
          ? {
              date: lr.date.toISOString(),
              qty: lr.qty,
              previousStock: lr.previousStock,
              newStock: lr.newStock,
              by: lr.by,
            }
          : null,
        lastSold: ls ? ls.toISOString() : null,
      };
    });

    // ── Product-level totals ──────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalStock = (p.variants as any[]).reduce(
      (s: number, v: any) => s + (v.stock as number),
      0,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalStockValue = (p.variants as any[]).reduce(
      (s: number, v: any) =>
        s + ((v.costPrice as number | undefined) ?? 0) * (v.stock as number),
      0,
    );
    const totalUnitsSoldAll = variantStats.reduce(
      (s, v) => s + v.unitsSoldAllTime,
      0,
    );
    const totalRevenueAll = variantStats.reduce(
      (s, v) => s + v.revenueAllTime,
      0,
    );
    const totalUnits30d = variantStats.reduce((s, v) => s + v.unitsSold30d, 0);
    const avgDailySales = Math.round((totalUnits30d / 30) * 10) / 10;

    const createdByName = creatorDoc
      ? `${(creatorDoc as { firstName: string; lastName: string }).firstName} ${(creatorDoc as { firstName: string; lastName: string }).lastName}`.trim()
      : (product.createdBy ?? 'Unknown');

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: {
        product,
        variantStats,
        productStats: {
          totalStock,
          totalUnitsSoldAllTime: totalUnitsSoldAll,
          totalUnitsSold30d: totalUnits30d,
          totalRevenueAllTime: totalRevenueAll,
          totalStockValue,
          avgDailySales,
          wishlisted,
          createdByName,
        },
        chartData,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/inventory/[productId]]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Server error.' },
      { status: 500 },
    );
  }
}
