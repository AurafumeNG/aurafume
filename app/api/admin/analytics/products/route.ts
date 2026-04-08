import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/admin-auth';
import type {
  ProductsData, ProductRow, CategoryPerf, SizeData,
  PairingRow, NewArrivalRow, TurnoverRow,
  StockStatus, TurnoverStatus,
} from '@/types/analytics-products';

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get('from') ?? '';
  const toParam   = searchParams.get('to')   ?? '';

  const fromDate = startOfDay(parseDate(fromParam));
  const toDate   = endOfDay(parseDate(toParam));

  // Previous period (same length)
  const periodMs      = toDate.getTime() - fromDate.getTime();
  const prevToDate    = new Date(fromDate.getTime() - 1);
  const prevFromDate  = new Date(prevToDate.getTime() - periodMs);

  await connectDB();

  const paidMatch    = { 'payment.status': 'paid' };
  const periodMatch  = { createdAt: { $gte: fromDate,     $lte: toDate    } };
  const prevMatch    = { createdAt: { $gte: prevFromDate, $lte: prevToDate } };

  // ── Parallel aggregations ─────────────────────────────────────────────────

  const [
    allProducts,
    itemsSoldAgg,
    sizeAgg,
    categoryAgg,
    prevCategoryAgg,
    weeklyTrendAgg,
    multiItemOrders,
  ] = await Promise.all([

    // 1. All products (inventory)
    Product.find({}).lean(),

    // 2. Items sold by product name in period
    Order.aggregate([
      { $match: { ...paidMatch, ...periodMatch } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        unitsSold: { $sum: '$items.qty' },
        revenue:   { $sum: { $multiply: ['$items.pricePerUnit', '$items.qty'] } },
        orderSet:  { $addToSet: '$_id' },
      }},
      { $project: { unitsSold: 1, revenue: 1, orderCount: { $size: '$orderSet' } } },
    ]),

    // 3. Items sold by size
    Order.aggregate([
      { $match: { ...paidMatch, ...periodMatch } },
      { $unwind: '$items' },
      { $group: {
        _id:      '$items.size',
        units:    { $sum: '$items.qty' },
        revenue:  { $sum: { $multiply: ['$items.pricePerUnit', '$items.qty'] } },
      }},
    ]),

    // 4. Category performance (current period)
    Order.aggregate([
      { $match: { ...paidMatch, ...periodMatch } },
      { $unwind: '$items' },
      { $group: {
        _id:     '$items.scentFamily',
        revenue: { $sum: { $multiply: ['$items.pricePerUnit', '$items.qty'] } },
        units:   { $sum: '$items.qty' },
        orderSet:{ $addToSet: '$_id' },
      }},
      { $project: { revenue: 1, units: 1, orderCount: { $size: '$orderSet' } } },
    ]),

    // 5. Category performance (previous period)
    Order.aggregate([
      { $match: { ...paidMatch, ...prevMatch } },
      { $unwind: '$items' },
      { $group: {
        _id:     '$items.scentFamily',
        revenue: { $sum: { $multiply: ['$items.pricePerUnit', '$items.qty'] } },
      }},
    ]),

    // 6. Weekly trend per product
    Order.aggregate([
      { $match: { ...paidMatch, ...periodMatch } },
      { $unwind: '$items' },
      { $group: {
        _id: {
          name: '$items.name',
          week: { $isoWeek: '$createdAt' },
          year: { $isoWeekYear: '$createdAt' },
        },
        revenue: { $sum: { $multiply: ['$items.pricePerUnit', '$items.qty'] } },
      }},
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]),

    // 7. Multi-item orders for pairing analysis (limit to 2000)
    Order.find(
      { ...paidMatch, ...periodMatch, 'items.1': { $exists: true } },
      { 'items.name': 1, 'items.pricePerUnit': 1, 'items.qty': 1 }
    ).limit(2000).lean(),
  ]);

  // ── Build indexes ──────────────────────────────────────────────────────────

  // Sales by product name
  interface SalesEntry { unitsSold: number; revenue: number; orderCount: number }
  const salesByName = new Map<string, SalesEntry>();
  for (const row of itemsSoldAgg as { _id: string; unitsSold: number; revenue: number; orderCount: number }[]) {
    if (row._id) salesByName.set(row._id, { unitsSold: row.unitsSold, revenue: row.revenue, orderCount: row.orderCount });
  }

  // Weekly trend by product name → ordered array of revenue values
  interface WeekKey { name: string; week: number; year: number }
  const trendMap = new Map<string, { year: number; week: number; revenue: number }[]>();
  for (const row of weeklyTrendAgg as { _id: WeekKey; revenue: number }[]) {
    const name = row._id.name;
    if (!trendMap.has(name)) trendMap.set(name, []);
    trendMap.get(name)!.push({ year: row._id.year, week: row._id.week, revenue: row.revenue });
  }
  // Sort each and keep last 7
  function buildTrend(name: string): { v: number }[] {
    const pts = trendMap.get(name) ?? [];
    pts.sort((a, b) => a.year !== b.year ? a.year - b.year : a.week - b.week);
    const last7 = pts.slice(-7);
    if (last7.length === 0) return [{ v: 0 }];
    return last7.map((p) => ({ v: Math.round(p.revenue) }));
  }

  // ── ProductRow[] ──────────────────────────────────────────────────────────

  type RawProduct = {
    _id: { toString(): string };
    name: string;
    fragranceFamilies: string[];
    variants: { size: string; stock: number; lowStockThreshold: number; price: number; costPrice?: number }[];
    isNewArrival: boolean;
    status: string;
    createdAt: Date;
  };

  const products: ProductRow[] = (allProducts as RawProduct[])
    .filter((p) => p.status === 'published')
    .map((p) => {
      const sales   = salesByName.get(p.name);
      const unitsSold   = sales?.unitsSold   ?? 0;
      const revenue     = sales?.revenue     ?? 0;
      const orderCount  = sales?.orderCount  ?? 0;
      const aov         = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

      const totalStock  = p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
      const hasOOS      = p.variants.some((v) => (v.stock ?? 0) === 0);
      const hasLow      = p.variants.some((v) => {
        const s = v.stock ?? 0;
        return s > 0 && s <= (v.lowStockThreshold ?? 5);
      });

      const stock: StockStatus = p.variants.every((v) => (v.stock ?? 0) === 0)
        ? 'out_of_stock'
        : hasLow ? 'low_stock' : 'in_stock';

      return {
        id:       String(p._id),
        name:     p.name,
        category: p.fragranceFamilies?.[0] ?? 'Other',
        variants: p.variants.map((v) => v.size),
        unitsSold,
        revenue,
        aov,
        stockQty: totalStock,
        stock,
        trend:    buildTrend(p.name),
      };
    });

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const allRawProducts = allProducts as RawProduct[];

  let outOfStockVariants = 0;
  let lowStockVariants   = 0;
  for (const p of allRawProducts.filter((p) => p.status === 'published')) {
    for (const v of p.variants) {
      if ((v.stock ?? 0) === 0) outOfStockVariants++;
      else if ((v.stock ?? 0) <= (v.lowStockThreshold ?? 5)) lowStockVariants++;
    }
  }

  const totalUnitsSold = products.reduce((s, p) => s + p.unitsSold, 0);
  const sorted         = [...products].sort((a, b) => b.unitsSold - a.unitsSold);
  const bestSeller     = sorted[0];
  const highestRev     = [...products].sort((a, b) => b.revenue - a.revenue)[0];
  const lowestRev      = products.filter((p) => p.unitsSold > 0).sort((a, b) => a.revenue - b.revenue)[0];

  // Best seller size: find the size with the most units for this product
  // (use sizeAgg filtered by the bestSeller name — approximate via sizeAgg totals)
  const kpis = {
    totalActive:        products.length,
    outOfStockVariants,
    lowStockVariants,
    totalUnitsSold,
    bestSellerName:     bestSeller?.name    ?? '—',
    bestSellerUnits:    bestSeller?.unitsSold ?? 0,
    bestSellerSize:     bestSeller?.variants?.[0] ?? '—',
    highestRevenueName: highestRev?.name    ?? '—',
    highestRevenue:     highestRev?.revenue  ?? 0,
    lowestRevenueName:  lowestRev?.name     ?? '—',
    lowestRevenueUnits: lowestRev?.unitsSold ?? 0,
  };

  // ── Category performance ──────────────────────────────────────────────────

  interface CatRaw { _id: string; revenue: number; units: number; orderCount: number }
  const prevCatMap = new Map<string, number>();
  for (const row of prevCategoryAgg as { _id: string; revenue: number }[]) {
    if (row._id) prevCatMap.set(row._id, row.revenue);
  }

  const totalCatRevenue = (categoryAgg as CatRaw[]).reduce((s, r) => s + r.revenue, 0) || 1;

  const categoryPerf: CategoryPerf[] = (categoryAgg as CatRaw[])
    .filter((r) => r._id)
    .map((r) => {
      const prev   = prevCatMap.get(r._id) ?? 0;
      const growth = prev > 0 ? Math.round(((r.revenue - prev) / prev) * 100) : 0;
      return {
        category: r._id,
        revenue:  Math.round(r.revenue),
        units:    r.units,
        orders:   r.orderCount,
        growth,
        pct:      Math.round((r.revenue / totalCatRevenue) * 100),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // ── Size analysis ─────────────────────────────────────────────────────────

  interface SizeRaw { _id: string; units: number; revenue: number }
  const totalSizeUnits   = (sizeAgg as SizeRaw[]).reduce((s, r) => s + r.units, 0) || 1;
  const totalSizeRevenue = (sizeAgg as SizeRaw[]).reduce((s, r) => s + r.revenue, 0) || 1;

  const SIZE_ORDER = ['30ml', '50ml', '100ml', '200ml'];
  const sizeData: SizeData[] = (sizeAgg as SizeRaw[])
    .filter((r) => r._id)
    .map((r) => ({
      size:       r._id,
      units:      r.units,
      revenue:    Math.round(r.revenue),
      aov:        r.units > 0 ? Math.round(r.revenue / r.units) : 0,
      pctUnits:   Math.round((r.units    / totalSizeUnits)   * 100),
      pctRevenue: Math.round((r.revenue / totalSizeRevenue) * 100),
    }))
    .sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a.size);
      const ib = SIZE_ORDER.indexOf(b.size);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  // ── Product pairings ──────────────────────────────────────────────────────

  type OrderDoc = { items: { name: string; pricePerUnit: number; qty: number }[] };

  // Count co-occurrences
  const pairCount  = new Map<string, number>();
  const pairRevMap = new Map<string, number>();
  const productOccurrences = new Map<string, number>(); // how many orders contain product A

  for (const order of multiItemOrders as OrderDoc[]) {
    const names = [...new Set(order.items.map((i) => i.name).filter(Boolean))];
    const revenueByName = new Map<string, number>();
    for (const item of order.items) {
      if (!item.name) continue;
      revenueByName.set(item.name, (revenueByName.get(item.name) ?? 0) + item.pricePerUnit * item.qty);
    }
    for (const name of names) {
      productOccurrences.set(name, (productOccurrences.get(name) ?? 0) + 1);
    }
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const [a, b] = [names[i], names[j]].sort();
        const key = `${a}|||${b}`;
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
        pairRevMap.set(key, (pairRevMap.get(key) ?? 0) + (revenueByName.get(a) ?? 0) + (revenueByName.get(b) ?? 0));
      }
    }
  }

  const pairings: PairingRow[] = [...pairCount.entries()]
    .map(([key, count]) => {
      const [productA, productB] = key.split('|||');
      const occA    = productOccurrences.get(productA) ?? 1;
      const coRate  = Math.round((count / occA) * 100);
      return {
        productA,
        productB,
        timesBought: count,
        revenue:     Math.round((pairRevMap.get(key) ?? 0) / count), // avg per order
        coRate:      Math.min(coRate, 100),
      };
    })
    .sort((a, b) => b.timesBought - a.timesBought)
    .slice(0, 10);

  // ── New arrivals ──────────────────────────────────────────────────────────

  const newArrivalProducts = allRawProducts.filter((p) => p.isNewArrival && p.status === 'published');
  const newArrivals: NewArrivalRow[] = newArrivalProducts.map((p) => {
    const sales = salesByName.get(p.name);
    return {
      id:        String(p._id),
      name:      p.name,
      unitsSold: sales?.unitsSold ?? 0,
      revenue:   Math.round(sales?.revenue ?? 0),
      launchDate:p.createdAt?.toISOString() ?? '',
      trend:     buildTrend(p.name),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const newArrivalsRevenue     = newArrivals.reduce((s, p) => s + p.revenue, 0);
  const totalRevenue           = products.reduce((s, p) => s + p.revenue, 0);
  const existingArrivalsRevenue = Math.max(0, totalRevenue - newArrivalsRevenue);

  // ── Inventory turnover ────────────────────────────────────────────────────

  const turnoverData: TurnoverRow[] = allRawProducts
    .filter((p) => p.status === 'published')
    .map((p) => {
      const sales = salesByName.get(p.name);
      const rev   = sales?.revenue ?? 0;

      // Cost ratio from variants (weighted avg costPrice/price if available)
      let costRatio = 0.4;
      const variantsWithCost = p.variants.filter((v) => v.costPrice && v.price > 0);
      if (variantsWithCost.length > 0) {
        const ratios = variantsWithCost.map((v) => (v.costPrice ?? 0) / v.price);
        costRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;
      }

      const cogs         = Math.round(rev * costRatio);
      const avgInventory = Math.round(
        p.variants.reduce((s, v) => {
          const costPer = (v.costPrice ?? v.price * costRatio);
          return s + (v.stock ?? 0) * costPer;
        }, 0)
      );

      const turnoverRate = avgInventory > 0 ? Math.round((cogs / avgInventory) * 10) / 10 : 0;
      const daysToSell   = turnoverRate > 0 ? Math.round(365 / turnoverRate) : 999;
      const status: TurnoverStatus = turnoverRate >= 1.5 ? 'fast' : turnoverRate >= 0.8 ? 'normal' : 'slow';

      return {
        name:         p.name,
        category:     p.fragranceFamilies?.[0] ?? 'Other',
        cogs,
        avgInventory,
        turnoverRate,
        daysToSell,
        status,
      };
    })
    .filter((r) => r.cogs > 0 || r.avgInventory > 0)
    .sort((a, b) => b.turnoverRate - a.turnoverRate);

  const avgTurnover = turnoverData.length > 0
    ? Math.round((turnoverData.reduce((s, r) => s + r.turnoverRate, 0) / turnoverData.length) * 10) / 10
    : 0;

  // ── Response ──────────────────────────────────────────────────────────────

  const payload: ProductsData = {
    kpis,
    products,
    categoryPerf,
    sizeData,
    pairings,
    newArrivals,
    newArrivalsRevenue,
    existingArrivalsRevenue,
    turnoverData,
    avgTurnover,
  };

  return NextResponse.json({ data: payload });
}
