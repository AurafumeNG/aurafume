import { NextRequest, NextResponse }  from 'next/server';
import connectDB                       from '@/lib/mongodb';
import Order                           from '@/models/Order';
import User                            from '@/models/User';
import Product                         from '@/models/Product';
import { requireAdmin }                from '@/lib/admin-auth';
import type { ApiResponse }            from '@/types/auth';
import type {
  OverviewData,
  RevenuePoint,
  TopProductData,
  OverviewEvent,
}                                      from '@/types/analytics-overview';

// ── Date helpers ───────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmtLabel(d: Date): string {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}
// e.g. "Aug 25" from {year:2025, month:8}
function fmtMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
}
function fmtWeekLabel(d: Date): string {
  return `W${fmtLabel(d)}`;
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get('from');
  const toStr   = searchParams.get('to');

  const now = new Date();
  const defaultTo   = endOfDay(now);
  const defaultFrom = startOfDay(addDays(now, -29));

  const fromDate = fromStr ? startOfDay(new Date(fromStr)) : defaultFrom;
  const toDate   = toStr   ? endOfDay(new Date(toStr))     : defaultTo;

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid date range' }, { status: 400 });
  }

  const periodMs   = toDate.getTime() - fromDate.getTime() + 86_400_000;
  const periodDays = Math.max(1, Math.round(periodMs / 86_400_000));
  const prevToDate   = new Date(fromDate.getTime() - 86_400_000);
  const prevFromDate = new Date(fromDate.getTime() - periodMs);

  // Fixed horizons for weekly/monthly charts
  const twelveWeeksAgo  = startOfDay(addDays(now, -83));  // ~12 weeks
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  try {
    await connectDB();

    const [
      kpiResult,
      prevKpiResult,
      statusResult,
      paymentResult,
      deliveryResult,
      topProductsRaw,
      categoryResult,
      geoResult,
      heatmapResult,
      marketingResult,
      topCouponResult,
      totalCustomers,
      newCustomers,
      repeatRateResult,
      refundedCount,
      totalOrdersAllTime,
      prePeriodEmails,
      periodEmailResult,
      dailyResult,
      prevDailyResult,
      sparklineRevResult,
      weeklyResult,
      prevWeeklyResult,
      monthlyResult,
      prevMonthlyResult,
      dailyCustomersResult,
    ] = await Promise.all([
      // 1. Current KPIs (paid orders in period)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate }, 'payment.status': 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),

      // 2. Previous period KPIs
      Order.aggregate([
        { $match: { createdAt: { $gte: prevFromDate, $lte: prevToDate }, 'payment.status': 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),

      // 3. Status distribution (all orders in period)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // 4. Payment method breakdown (paid)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate }, 'payment.status': 'paid' } },
        { $group: { _id: '$payment.method', revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
      ]),

      // 5. Delivery option breakdown (all orders)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
        { $group: { _id: '$delivery.option', revenue: { $sum: '$pricing.total' }, label: { $first: '$delivery.label' } } },
      ]),

      // 6. Top 5 products by revenue (paid)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate }, 'payment.status': 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { productId: '$items.productId', name: '$items.name', size: '$items.size' },
            unitsSold: { $sum: '$items.qty' },
            revenue:   { $sum: { $multiply: ['$items.qty', '$items.pricePerUnit'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),

      // 7. Scent family (category) breakdown (paid)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate }, 'payment.status': 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id:     '$items.scentFamily',
            revenue: { $sum: { $multiply: ['$items.qty', '$items.pricePerUnit'] } },
            units:   { $sum: '$items.qty' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
      ]),

      // 8. Geographic (all orders)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
        {
          $group: {
            _id:       '$shippingAddress.state',
            revenue:   { $sum: '$pricing.total' },
            orders:    { $sum: 1 },
            customers: { $addToSet: '$contact.email' },
          },
        },
        { $project: { revenue: 1, orders: 1, customers: { $size: '$customers' } } },
        { $sort:  { revenue: -1 } },
        { $limit: 10 },
      ]),

      // 9. Heatmap: orders by hour × day of week
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
        {
          $group: {
            _id: {
              hour: { $hour: '$createdAt' },
              dow:  { $dayOfWeek: '$createdAt' }, // 1=Sun … 7=Sat
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // 10. Marketing summary (paid + coupon)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: fromDate, $lte: toDate },
            'payment.status': 'paid',
            'pricing.couponCode': { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id:           null,
            promoOrders:   { $sum: 1 },
            totalDiscount: { $sum: '$pricing.discount' },
            promoRevenue:  { $sum: '$pricing.total' },
          },
        },
      ]),

      // 11. Top coupon code
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: fromDate, $lte: toDate },
            'pricing.couponCode': { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id:         '$pricing.couponCode',
            uses:        { $sum: 1 },
            couponLabel: { $first: '$pricing.couponLabel' },
          },
        },
        { $sort:  { uses: -1 } },
        { $limit: 1 },
      ]),

      // 12. Total customers
      User.countDocuments({ role: 'customer' }),

      // 13. New customers in period
      User.countDocuments({ role: 'customer', createdAt: { $gte: fromDate, $lte: toDate } }),

      // 14. Repeat purchase rate (all time)
      Order.aggregate([
        { $group: { _id: '$contact.email', orderCount: { $sum: 1 } } },
        {
          $group: {
            _id:    null,
            total:  { $sum: 1 },
            repeat: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } },
          },
        },
      ]),

      // 15. Refunded orders (all time)
      Order.countDocuments({ 'payment.status': 'refunded' }),

      // 16. Total orders all time
      Order.countDocuments({}),

      // 17. Pre-period emails (for new vs returning split)
      Order.distinct('contact.email', { createdAt: { $lt: fromDate } }),

      // 18. Period emails + revenue (paid)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate }, 'payment.status': 'paid' } },
        { $group: { _id: '$contact.email', revenue: { $sum: '$pricing.total' } } },
      ]),

      // 19. Daily revenue series (current period, paid)
      Order.aggregate([
        { $match: { createdAt: { $gte: fromDate, $lte: toDate }, 'payment.status': 'paid' } },
        {
          $group: {
            _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 20. Daily revenue (previous period, paid)
      Order.aggregate([
        { $match: { createdAt: { $gte: prevFromDate, $lte: prevToDate }, 'payment.status': 'paid' } },
        {
          $group: {
            _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 21. Sparkline: last 7 days revenue (paid)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay(addDays(now, -6)), $lte: endOfDay(now) },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 22. Weekly revenue (last 12 weeks, paid) — fixed horizon
      Order.aggregate([
        { $match: { createdAt: { $gte: twelveWeeksAgo, $lte: endOfDay(now) }, 'payment.status': 'paid' } },
        {
          $group: {
            _id:     { year: { $isoWeekYear: '$createdAt' }, week: { $isoWeek: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
            minDate: { $min: '$createdAt' },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),

      // 23. Weekly revenue — one year prior (for comparison)
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfDay(addDays(twelveWeeksAgo, -364)),
              $lte: endOfDay(addDays(now, -364)),
            },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id:     { year: { $isoWeekYear: '$createdAt' }, week: { $isoWeek: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),

      // 24. Monthly revenue (last 12 months, paid) — fixed horizon
      Order.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo, $lte: endOfDay(now) }, 'payment.status': 'paid' } },
        {
          $group: {
            _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // 25. Monthly revenue — one year prior (for comparison)
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(twelveMonthsAgo.getFullYear() - 1, twelveMonthsAgo.getMonth(), 1),
              $lte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999),
            },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // 26. Daily new users (last 7 days) for customer sparkline
      User.aggregate([
        {
          $match: {
            role:      'customer',
            createdAt: { $gte: startOfDay(addDays(now, -6)), $lte: endOfDay(now) },
          },
        },
        {
          $group: {
            _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // ── KPIs ────────────────────────────────────────────────────────────────────

    const revenue     = (kpiResult[0]?.revenue     as number) ?? 0;
    const orders      = (kpiResult[0]?.orders      as number) ?? 0;
    const prevRevenue = (prevKpiResult[0]?.revenue  as number) ?? 0;
    const prevOrders  = (prevKpiResult[0]?.orders   as number) ?? 0;
    const aov         = orders     > 0 ? Math.round(revenue     / orders)     : 0;
    const prevAov     = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

    // ── Secondary KPIs ──────────────────────────────────────────────────────────

    const rrRow         = (repeatRateResult[0] as { total: number; repeat: number } | undefined);
    const repeatRate    = rrRow && rrRow.total > 0 ? Math.round((rrRow.repeat / rrRow.total) * 100) : 0;
    const refundRate    = totalOrdersAllTime > 0 ? +((refundedCount / totalOrdersAllTime) * 100).toFixed(1) : 0;
    const revPerCustomer = totalCustomers > 0 ? Math.round(revenue / totalCustomers) : 0;

    // ── Sparklines (7 days) ─────────────────────────────────────────────────────

    type SparkRow = { _id: string; revenue: number; orders: number };
    const sparkMap: Record<string, SparkRow> = {};
    for (const r of sparklineRevResult as SparkRow[]) sparkMap[r._id] = r;

    type CustRow = { _id: string; count: number };
    const custSparkMap: Record<string, number> = {};
    for (const r of dailyCustomersResult as CustRow[]) custSparkMap[r._id] = r.count;

    const sparkDates = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(now, i - 6);
      return d.toISOString().split('T')[0];
    });

    const sparklines = {
      revenue:   sparkDates.map((d) => ({ v: sparkMap[d]?.revenue ?? 0 })),
      orders:    sparkDates.map((d) => ({ v: sparkMap[d]?.orders  ?? 0 })),
      customers: sparkDates.map((d) => ({ v: custSparkMap[d]      ?? 0 })),
      aov:       sparkDates.map((d) => {
        const r = sparkMap[d];
        return { v: r && r.orders > 0 ? Math.round(r.revenue / r.orders) : 0 };
      }),
    };

    // ── Status distribution ─────────────────────────────────────────────────────

    type StatusRow = { _id: string; count: number };
    const totalPeriodOrders = (statusResult as StatusRow[]).reduce((s, r) => s + r.count, 0);
    const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statusDistribution = STATUS_ORDER.map((st) => {
      const found = (statusResult as StatusRow[]).find((r) => r._id === st);
      const count = found?.count ?? 0;
      return {
        status: st.charAt(0).toUpperCase() + st.slice(1),
        count,
        pct: totalPeriodOrders > 0 ? +((count / totalPeriodOrders) * 100).toFixed(1) : 0,
      };
    }).filter((s) => s.count > 0);

    // ── Payment breakdown ───────────────────────────────────────────────────────

    type MethodRow = { _id: string; revenue: number; count: number; label?: string };
    const totalPaidRevenue = (paymentResult as MethodRow[]).reduce((s, r) => s + r.revenue, 0);
    const PAYMENT_LABEL: Record<string, string> = { paystack: 'Paystack', 'bank-transfer': 'Bank Transfer' };
    const paymentBreakdown = (paymentResult as MethodRow[])
      .sort((a, b) => b.revenue - a.revenue)
      .map((r) => ({
        name:  PAYMENT_LABEL[r._id] ?? r._id,
        value: r.revenue,
        pct:   totalPaidRevenue > 0 ? Math.round((r.revenue / totalPaidRevenue) * 100) : 0,
      }));

    // ── Delivery breakdown ──────────────────────────────────────────────────────

    const totalDeliveryRev = (deliveryResult as MethodRow[]).reduce((s, r) => s + r.revenue, 0);
    const DELIVERY_LABEL: Record<string, string> = {
      'outside-lagos': 'Express Delivery',
      'within-lagos':  'Standard Delivery',
      'pickup':        'Pickup',
    };
    const deliveryBreakdown = (deliveryResult as MethodRow[])
      .sort((a, b) => b.revenue - a.revenue)
      .map((r) => ({
        name:  DELIVERY_LABEL[r._id] ?? (r.label as string | undefined) ?? r._id,
        value: r.revenue,
        pct:   totalDeliveryRev > 0 ? Math.round((r.revenue / totalDeliveryRev) * 100) : 0,
      }));

    // ── Top products ────────────────────────────────────────────────────────────

    type ProductRow = {
      _id: { productId: string; name: string; size: string };
      unitsSold: number;
      revenue: number;
    };
    const totalProductRevenue = (topProductsRaw as ProductRow[]).reduce((s, r) => s + r.revenue, 0);
    const topProductIds = (topProductsRaw as ProductRow[]).map((r) => r._id.productId);

    // Fetch stock status for top products
    const productDocs = topProductIds.length > 0
      ? await Product.find({ _id: { $in: topProductIds } })
          .select('_id variants')
          .lean()
      : [];

    type ProductDoc = { _id: unknown; variants: { stock: number; lowStockThreshold: number }[] };
    const stockMap: Record<string, 'in_stock' | 'low_stock' | 'out_of_stock'> = {};
    for (const doc of productDocs as ProductDoc[]) {
      const totalStock = (doc.variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0);
      const lowThreshold = Math.max(...(doc.variants ?? []).map((v) => v.lowStockThreshold ?? 5));
      stockMap[String(doc._id)] =
        totalStock === 0  ? 'out_of_stock' :
        totalStock <= lowThreshold ? 'low_stock'   : 'in_stock';
    }

    // 7-day trend per top product
    type TrendRow = { _id: { productId: string; date: string }; units: number };
    const trendRows: TrendRow[] = topProductIds.length > 0
      ? await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfDay(addDays(now, -6)), $lte: endOfDay(now) },
              'payment.status': 'paid',
            },
          },
          { $unwind: '$items' },
          { $match: { 'items.productId': { $in: topProductIds } } },
          {
            $group: {
              _id:   { productId: '$items.productId', date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
              units: { $sum: '$items.qty' },
            },
          },
          { $sort: { '_id.date': 1 } },
        ])
      : [];

    // Build per-product trend map
    const trendMap: Record<string, Record<string, number>> = {};
    for (const row of trendRows) {
      if (!trendMap[row._id.productId]) trendMap[row._id.productId] = {};
      trendMap[row._id.productId][row._id.date] = row.units;
    }

    const topProducts: TopProductData[] = (topProductsRaw as ProductRow[]).map((r, i) => ({
      rank:        i + 1,
      name:        r._id.name,
      variant:     r._id.size,
      unitsSold:   r.unitsSold,
      revenue:     r.revenue,
      pctOfTotal:  totalProductRevenue > 0 ? +((r.revenue / totalProductRevenue) * 100).toFixed(1) : 0,
      stockStatus: stockMap[r._id.productId] ?? 'in_stock',
      trend:       sparkDates.map((d) => ({ v: trendMap[r._id.productId]?.[d] ?? 0 })),
    }));

    // ── Categories ──────────────────────────────────────────────────────────────

    type CatRow = { _id: string; revenue: number; units: number };
    const totalCatRevenue = (categoryResult as CatRow[]).reduce((s, r) => s + r.revenue, 0);
    const categories = (categoryResult as CatRow[]).map((r) => ({
      name:    r._id ?? 'Unknown',
      revenue: r.revenue,
      units:   r.units,
      pct:     totalCatRevenue > 0 ? Math.round((r.revenue / totalCatRevenue) * 100) : 0,
    }));

    // ── Geographic ──────────────────────────────────────────────────────────────

    type GeoRow = { _id: string; revenue: number; orders: number; customers: number };
    const totalGeoRev = (geoResult as GeoRow[]).reduce((s, r) => s + r.revenue, 0);
    const states = (geoResult as GeoRow[]).map((r) => ({
      state:     r._id ?? 'Unknown',
      revenue:   r.revenue,
      orders:    r.orders,
      customers: r.customers,
      pct:       totalGeoRev > 0 ? Math.round((r.revenue / totalGeoRev) * 100) : 0,
    }));

    // ── Heatmap [Mon=0..Sun=6][hour 0..23] ─────────────────────────────────────

    type HeatRow = { _id: { hour: number; dow: number }; count: number };
    const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const row of heatmapResult as HeatRow[]) {
      // MongoDB dow: 1=Sun…7=Sat → convert to 0=Mon…6=Sun
      const mongoDow = row._id.dow; // 1-7
      const dayIdx   = mongoDow === 1 ? 6 : mongoDow - 2; // 0=Mon..6=Sun
      heatmap[dayIdx][row._id.hour] = row.count;
    }

    // ── Customer split (new vs returning) ──────────────────────────────────────

    const prePeriodSet = new Set(prePeriodEmails as string[]);
    type EmailRevRow = { _id: string; revenue: number };
    let newCount = 0, newRevenue = 0, returningCount = 0, returningRevenue = 0;
    for (const row of periodEmailResult as EmailRevRow[]) {
      if (prePeriodSet.has(row._id)) {
        returningCount++;
        returningRevenue += row.revenue;
      } else {
        newCount++;
        newRevenue += row.revenue;
      }
    }

    // ── Marketing ───────────────────────────────────────────────────────────────

    type MktRow = { _id: null; promoOrders: number; totalDiscount: number; promoRevenue: number };
    type CouponRow = { _id: string; uses: number; couponLabel: string };
    const mkt       = (marketingResult[0] as MktRow | undefined);
    const topCoupon = (topCouponResult[0] as CouponRow | undefined);
    const marketing = {
      promoOrders:   mkt?.promoOrders   ?? 0,
      totalDiscount: mkt?.totalDiscount ?? 0,
      promoRevenue:  mkt?.promoRevenue  ?? 0,
      topCode:       topCoupon?._id         ?? '—',
      topCodeUses:   topCoupon?.uses         ?? 0,
      topCodeLabel:  topCoupon?.couponLabel  ?? '',
    };

    // ── Daily revenue series ────────────────────────────────────────────────────

    type DailyRow = { _id: string; revenue: number; orders: number };
    const dailyMap: Record<string, DailyRow>     = {};
    const prevDailyMap: Record<number, DailyRow> = {};

    for (const r of dailyResult    as DailyRow[]) dailyMap[r._id] = r;
    // Index prev by day-index within previous period
    const prevDailyArr = (prevDailyResult as DailyRow[]).sort((a, b) => a._id.localeCompare(b._id));
    prevDailyArr.forEach((r, idx) => { prevDailyMap[idx] = r; });

    const revenueDaily: RevenuePoint[] = [];
    let dayIdx = 0;
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const key  = cur.toISOString().split('T')[0];
      const day  = dailyMap[key];
      const prev = prevDailyMap[dayIdx] ?? { revenue: 0, orders: 0 };
      const dayOrders = day?.orders ?? 0;
      revenueDaily.push({
        date:        fmtLabel(cur),
        revenue:     day?.revenue ?? 0,
        orders:      dayOrders,
        aov:         dayOrders > 0 ? Math.round((day?.revenue ?? 0) / dayOrders) : 0,
        prevRevenue: prev.revenue,
        prevOrders:  prev.orders,
      });
      cur.setDate(cur.getDate() + 1);
      dayIdx++;
    }

    // ── Weekly series (last 12 weeks, fixed horizon) ────────────────────────────

    type WeekRow = { _id: { year: number; week: number }; revenue: number; orders: number; minDate?: Date };
    const weeklyMap: Record<string, WeekRow>     = {};
    const prevWeeklyMap: Record<string, WeekRow> = {};
    for (const r of weeklyResult     as WeekRow[]) weeklyMap[`${r._id.year}-${r._id.week}`]     = r;
    for (const r of prevWeeklyResult as WeekRow[]) prevWeeklyMap[`${r._id.year}-${r._id.week}`] = r;

    const revenueWeekly: RevenuePoint[] = (weeklyResult as WeekRow[]).map((r) => {
      // Compare to same ISO week, previous year
      const prevKey = `${r._id.year - 1}-${r._id.week}`;
      const prev    = prevWeeklyMap[prevKey] ?? { revenue: 0, orders: 0 };
      const wOrders = r.orders ?? 0;
      const weekStart = r.minDate ? new Date(r.minDate) : new Date();
      return {
        date:        fmtWeekLabel(weekStart),
        revenue:     r.revenue,
        orders:      wOrders,
        aov:         wOrders > 0 ? Math.round(r.revenue / wOrders) : 0,
        prevRevenue: prev.revenue,
        prevOrders:  prev.orders,
      };
    });

    // ── Monthly series (last 12 months, fixed horizon) ──────────────────────────

    type MonthRow = { _id: { year: number; month: number }; revenue: number; orders: number };
    const prevMonthlyMap: Record<string, MonthRow> = {};
    for (const r of prevMonthlyResult as MonthRow[]) {
      prevMonthlyMap[`${r._id.year}-${r._id.month}`] = r;
    }

    const revenueMonthly: RevenuePoint[] = (monthlyResult as MonthRow[]).map((r) => {
      const prevKey = `${r._id.year - 1}-${r._id.month}`;
      const prev    = prevMonthlyMap[prevKey] ?? { revenue: 0, orders: 0 };
      const mOrders = r.orders ?? 0;
      return {
        date:        fmtMonthLabel(r._id.year, r._id.month),
        revenue:     r.revenue,
        orders:      mOrders,
        aov:         mOrders > 0 ? Math.round(r.revenue / mOrders) : 0,
        prevRevenue: prev.revenue,
        prevOrders:  prev.orders,
      };
    });

    // ── Events feed (computed) ──────────────────────────────────────────────────

    const events: OverviewEvent[] = [];

    // Best revenue day in period
    if (revenueDaily.length > 0) {
      const best = revenueDaily.reduce((b, d) => d.revenue > b.revenue ? d : b, revenueDaily[0]);
      if (best.revenue > 0) {
        events.push({
          type:   'revenue',
          date:   best.date,
          title:  'Best revenue day in period',
          detail: `₦${best.revenue.toLocaleString('en-NG')} — highest single-day revenue in the selected period`,
        });
      }
    }

    // Top product event
    if (topProducts[0]) {
      const tp = topProducts[0];
      events.push({
        type:   'product',
        date:   fmtLabel(toDate),
        title:  `Top seller: ${tp.name}`,
        detail: `${tp.unitsSold} units sold · ₦${tp.revenue.toLocaleString('en-NG')} revenue`,
      });
    }

    // Top promo
    if (marketing.topCode !== '—') {
      events.push({
        type:   'promo',
        date:   fmtLabel(toDate),
        title:  `Most-used promo: ${marketing.topCode}`,
        detail: `Used ${marketing.topCodeUses} times · ₦${marketing.totalDiscount.toLocaleString('en-NG')} discounted`,
      });
    }

    // Customer milestone
    if (totalCustomers >= 1000) {
      events.push({
        type:   'milestone',
        date:   fmtLabel(toDate),
        title:  `${totalCustomers.toLocaleString()} total customers`,
        detail: `${newCustomers} new customers joined in the selected period`,
      });
    } else if (newCustomers > 0) {
      events.push({
        type:   'customer',
        date:   fmtLabel(toDate),
        title:  `${newCustomers} new customer${newCustomers > 1 ? 's' : ''} in period`,
        detail: `Total registered: ${totalCustomers.toLocaleString()} customers`,
      });
    }

    // Out of stock products
    const oosList = topProducts.filter((p) => p.stockStatus === 'out_of_stock');
    if (oosList.length > 0) {
      events.push({
        type:   'stock',
        date:   fmtLabel(toDate),
        title:  `${oosList[0].name} is out of stock`,
        detail: `Top-selling product needs restocking`,
      });
    }

    // ── Build response ──────────────────────────────────────────────────────────

    const data: OverviewData = {
      from:       fromDate.toISOString().split('T')[0],
      to:         toDate.toISOString().split('T')[0],
      periodDays,

      kpis: {
        revenue,     prevRevenue,
        orders,      prevOrders,
        totalCustomers, newCustomers,
        aov,         prevAov,
      },

      sparklines,

      secondary: { repeatRate, revPerCustomer, refundRate },

      revenueDaily,
      revenueWeekly,
      revenueMonthly,

      paymentBreakdown,
      deliveryBreakdown,

      statusDistribution,
      avgFulfillmentDays: 0, // would require shipped/delivered timestamps — skip for now

      topProducts,
      categories,

      customerSplit: { newCount, returningCount, newRevenue, returningRevenue, totalCustomers },

      states,
      heatmap,
      marketing,
      events: events.slice(0, 6),
    };

    return NextResponse.json<ApiResponse<OverviewData>>({ success: true, data });
  } catch (err) {
    console.error('[analytics/overview GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
