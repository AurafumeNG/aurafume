import { NextRequest, NextResponse } from 'next/server';
import connectDB                      from '@/lib/mongodb';
import Order                          from '@/models/Order';
import { requireAdmin }               from '@/lib/admin-auth';
import type { ApiResponse }           from '@/types/auth';
import type {
  RevenueData,
  RevenueTrendPoint,
  PaymentMethodStat,
  PaymentMethodMonthPoint,
  DeliveryMethodStat,
  AOVPoint,
  AOVBucket,
  TimingPoint,
  RefundReason,
  RefundPoint,
  RefundedOrder,
  ForecastPoint,
  CohortRow,
} from '@/types/analytics-revenue';

// ── Date helpers ───────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function fmtDateLabel(d: Date): string {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}
function fmtMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
}
function startOfNMonthsAgo(n: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, 1);
}

// ── Simple linear-regression forecast ─────────────────────────────────────────

function forecast2Months(
  historicalValues: number[],
  historicalLabels: string[],
  nextLabels: string[],
): ForecastPoint[] {
  const vals = historicalValues;
  const n = vals.length;
  const xMean = (n - 1) / 2;
  const yMean = vals.reduce((a, b) => a + b, 0) / (n || 1);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (vals[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  const historical: ForecastPoint[] = historicalLabels.map((date, i) => ({
    date,
    actual: vals[i] ?? 0,
    forecast: null,
    upper: null,
    lower: null,
  }));

  const projected: ForecastPoint[] = nextLabels.map((date, i) => {
    const x = n + i;
    const f = Math.max(0, Math.round(intercept + slope * x));
    return { date, actual: null, forecast: f, upper: Math.round(f * 1.15), lower: Math.round(f * 0.85) };
  });

  return [...historical, ...projected];
}

// ── Delivery option mapping ────────────────────────────────────────────────────

const DELIVERY_MAP: Record<string, { key: string; label: string }> = {
  'within-lagos':  { key: 'express',  label: 'Express Delivery'  },
  'outside-lagos': { key: 'standard', label: 'Standard Delivery' },
  'pickup':        { key: 'pickup',   label: 'Pickup'            },
};

// ── DoW mapping (MongoDB $dayOfWeek: 1=Sun, 2=Mon, ..., 7=Sat) ────────────────

const DOW_MAP: Record<number, string> = {
  2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat', 1: 'Sun',
};
const DOW_ORDER = [2, 3, 4, 5, 6, 7, 1]; // Mon–Sun

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

  const periodMs   = toDate.getTime() - fromDate.getTime();
  const periodDays = Math.max(1, Math.round(periodMs / 86_400_000));
  const prevTo     = new Date(fromDate.getTime() - 1);
  const prevFrom   = new Date(fromDate.getTime() - periodMs - 1);

  await connectDB();

  // Shared match filters
  const paidFilter = {
    createdAt: { $gte: fromDate, $lte: toDate },
    'payment.status': 'paid',
  };
  const refundFilter = {
    createdAt: { $gte: fromDate, $lte: toDate },
    'payment.status': 'refunded',
  };
  const prevPaidFilter = {
    createdAt: { $gte: prevFrom, $lte: prevTo },
    'payment.status': 'paid',
  };
  const prevRefundFilter = {
    createdAt: { $gte: prevFrom, $lte: prevTo },
    'payment.status': 'refunded',
  };

  // ── 18 parallel aggregations ─────────────────────────────────────────────────
  const [
    curKpiRaw,
    prevKpiRaw,
    curRefundKpiRaw,
    prevRefundKpiRaw,
    dailyRaw,
    prevDailyRaw,
    weeklyRaw,
    prevWeeklyRaw,
    paymentStatsRaw,
    paymentMonthlyRaw,
    deliveryStatsRaw,
    aovDailyRaw,
    aovHistogramRaw,
    byHourRaw,
    byDowRaw,
    refundedOrdersRaw,
    cohortFirstOrdersRaw,
    cohortAllOrdersRaw,
  ] = await Promise.all([

    // 1. Current period KPIs (paid)
    Order.aggregate([
      { $match: paidFilter },
      { $group: {
        _id: null,
        gross:   { $sum: '$pricing.subtotal' },
        net:     { $sum: '$pricing.total'    },
        discount:{ $sum: '$pricing.discount' },
        orders:  { $sum: 1 },
      }},
    ]),

    // 2. Previous period KPIs (paid)
    Order.aggregate([
      { $match: prevPaidFilter },
      { $group: {
        _id: null,
        gross:   { $sum: '$pricing.subtotal' },
        net:     { $sum: '$pricing.total'    },
        discount:{ $sum: '$pricing.discount' },
        orders:  { $sum: 1 },
      }},
    ]),

    // 3. Current refund KPIs
    Order.aggregate([
      { $match: refundFilter },
      { $group: {
        _id: null,
        amount: { $sum: '$pricing.total' },
        count:  { $sum: 1 },
        discount: { $sum: '$pricing.discount' },
      }},
    ]),

    // 4. Previous refund KPIs
    Order.aggregate([
      { $match: prevRefundFilter },
      { $group: {
        _id: null,
        amount: { $sum: '$pricing.total' },
        count:  { $sum: 1 },
      }},
    ]),

    // 5. Daily trend (current paid)
    Order.aggregate([
      { $match: paidFilter },
      { $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
        gross: { $sum: '$pricing.subtotal' },
        net:   { $sum: '$pricing.total'   },
      }},
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]),

    // 6. Daily trend (prev paid) — for comparison
    Order.aggregate([
      { $match: prevPaidFilter },
      { $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
        gross: { $sum: '$pricing.subtotal' },
        net:   { $sum: '$pricing.total'   },
      }},
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]),

    // 7. Weekly trend (current paid)
    Order.aggregate([
      { $match: paidFilter },
      { $group: {
        _id: { y: { $isoWeekYear: '$createdAt' }, w: { $isoWeek: '$createdAt' } },
        gross: { $sum: '$pricing.subtotal' },
        net:   { $sum: '$pricing.total'   },
        minDate: { $min: '$createdAt' },
      }},
      { $sort: { '_id.y': 1, '_id.w': 1 } },
    ]),

    // 8. Weekly trend (prev paid) — for comparison
    Order.aggregate([
      { $match: prevPaidFilter },
      { $group: {
        _id: { y: { $isoWeekYear: '$createdAt' }, w: { $isoWeek: '$createdAt' } },
        gross: { $sum: '$pricing.subtotal' },
        net:   { $sum: '$pricing.total'   },
      }},
      { $sort: { '_id.y': 1, '_id.w': 1 } },
    ]),

    // 9. Payment method stats (current paid + refunded)
    Order.aggregate([
      { $match: { createdAt: { $gte: fromDate, $lte: toDate }, 'payment.status': { $in: ['paid', 'refunded'] } } },
      { $group: {
        _id: '$payment.method',
        revenue: { $sum: '$pricing.total'    },
        orders:  { $sum: 1                   },
        discount:{ $sum: '$pricing.discount' },
      }},
    ]),

    // 10. Payment method monthly (last 7 months, fixed)
    Order.aggregate([
      { $match: {
        createdAt: { $gte: startOfNMonthsAgo(6) },
        'payment.status': 'paid',
      }},
      { $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, method: '$payment.method' },
        revenue: { $sum: '$pricing.total' },
      }},
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),

    // 11. Delivery method stats (current paid)
    Order.aggregate([
      { $match: paidFilter },
      { $group: {
        _id: '$delivery.option',
        orders:      { $sum: 1                        },
        revenue:     { $sum: '$pricing.total'          },
        deliveryFee: { $sum: '$pricing.deliveryFee'    },
      }},
    ]),

    // 12. AOV daily (current paid)
    Order.aggregate([
      { $match: paidFilter },
      { $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
        totalRev: { $sum: '$pricing.total' },
        count:    { $sum: 1               },
        minDate:  { $min: '$createdAt'    },
      }},
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]),

    // 13. AOV histogram (current paid)
    Order.aggregate([
      { $match: paidFilter },
      { $bucket: {
        groupBy: '$pricing.total',
        boundaries: [0, 5000, 10000, 15000, 20000, 30000],
        default: '30k+',
        output: { count: { $sum: 1 } },
      }},
    ]),

    // 14. Revenue by hour (current paid)
    Order.aggregate([
      { $match: paidFilter },
      { $group: {
        _id: { $hour: '$createdAt' },
        revenue: { $sum: '$pricing.total' },
      }},
      { $sort: { _id: 1 } },
    ]),

    // 15. Revenue by day of week (current paid)
    Order.aggregate([
      { $match: paidFilter },
      { $group: {
        _id: { $dayOfWeek: '$createdAt' },
        revenue: { $sum: '$pricing.total' },
      }},
    ]),

    // 16. Refunded orders list (current period)
    Order.aggregate([
      { $match: refundFilter },
      { $project: {
        orderNumber: 1,
        customer: { $concat: ['$contact.firstName', ' ', '$contact.lastName'] },
        amount: '$pricing.total',
        date: '$createdAt',
      }},
      { $sort: { date: -1 } },
      { $limit: 50 },
    ]),

    // 17. Cohort: first order date per customer (all time)
    Order.aggregate([
      { $match: { 'payment.status': { $in: ['paid', 'refunded'] } } },
      { $group: {
        _id: '$contact.email',
        firstDate: { $min: '$createdAt' },
      }},
    ]),

    // 18. Cohort: all orders with customer + month + revenue (all time)
    Order.aggregate([
      { $match: { 'payment.status': { $in: ['paid', 'refunded'] } } },
      { $project: {
        email: '$contact.email',
        revenue: '$pricing.total',
        year:  { $year:  '$createdAt' },
        month: { $month: '$createdAt' },
      }},
    ]),
  ]);

  // Also fetch monthly trend for refunds (to build the trend chart's `refunds` series)
  const [dailyRefundsRaw, weeklyRefundsRaw] = await Promise.all([
    Order.aggregate([
      { $match: refundFilter },
      { $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
        amount: { $sum: '$pricing.total' },
      }},
    ]),
    Order.aggregate([
      { $match: refundFilter },
      { $group: {
        _id: { y: { $isoWeekYear: '$createdAt' }, w: { $isoWeek: '$createdAt' } },
        amount: { $sum: '$pricing.total' },
      }},
    ]),
  ]);

  // Fixed last-12-months monthly trend (for forecast historical data)
  const monthlyRaw = await Order.aggregate([
    { $match: {
      createdAt: { $gte: startOfNMonthsAgo(11) },
      'payment.status': 'paid',
    }},
    { $group: {
      _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
      gross: { $sum: '$pricing.subtotal' },
      net:   { $sum: '$pricing.total'   },
    }},
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  const monthlyRefundsRaw = await Order.aggregate([
    { $match: {
      createdAt: { $gte: startOfNMonthsAgo(11) },
      'payment.status': 'refunded',
    }},
    { $group: {
      _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
      amount: { $sum: '$pricing.total' },
    }},
  ]);

  // ── Post-process ───────────────────────────────────────────────────────────────

  const cur  = curKpiRaw[0]  ?? { gross: 0, net: 0, discount: 0, orders: 0 };
  const prev = prevKpiRaw[0] ?? { gross: 0, net: 0, discount: 0, orders: 0 };
  const curRef  = curRefundKpiRaw[0]  ?? { amount: 0, count: 0, discount: 0 };
  const prevRef = prevRefundKpiRaw[0] ?? { amount: 0, count: 0 };

  // ── Daily trend ────────────────────────────────────────────────────────────────

  // Build date-indexed maps for prev daily and refund daily
  type DayKey = string;
  const prevDailyMap = new Map<DayKey, { gross: number; net: number }>();
  for (const r of prevDailyRaw) {
    // Offset by periodDays to align with current period dates
    const d = new Date(r._id.y, r._id.m - 1, r._id.d);
    const shifted = addDays(d, periodDays);
    const key = `${shifted.getFullYear()}-${shifted.getMonth()}-${shifted.getDate()}`;
    prevDailyMap.set(key, { gross: r.gross, net: r.net });
  }
  const dailyRefundMap = new Map<DayKey, number>();
  for (const r of dailyRefundsRaw) {
    const key = `${r._id.y}-${r._id.m - 1}-${r._id.d}`;
    dailyRefundMap.set(key, r.amount);
  }

  const trendDaily: RevenueTrendPoint[] = dailyRaw.map((r) => {
    const d = new Date(r._id.y, r._id.m - 1, r._id.d);
    const key = `${r._id.y}-${r._id.m - 1}-${r._id.d}`;
    const prev2 = prevDailyMap.get(key) ?? { gross: 0, net: 0 };
    return {
      date:      fmtDateLabel(d),
      gross:     r.gross,
      net:       r.net,
      refunds:   dailyRefundMap.get(key) ?? 0,
      prevGross: prev2.gross,
      prevNet:   prev2.net,
    };
  });

  // ── Weekly trend ───────────────────────────────────────────────────────────────

  const prevWeeklyMap = new Map<string, { gross: number; net: number }>();
  for (let i = 0; i < prevWeeklyRaw.length; i++) {
    // Map prev weekly by index offset
    const curWeek = weeklyRaw[i];
    if (curWeek) {
      prevWeeklyMap.set(`${curWeek._id.y}-${curWeek._id.w}`, {
        gross: prevWeeklyRaw[i]?.gross ?? 0,
        net:   prevWeeklyRaw[i]?.net   ?? 0,
      });
    }
  }
  const weeklyRefundMap = new Map<string, number>();
  for (const r of weeklyRefundsRaw) {
    weeklyRefundMap.set(`${r._id.y}-${r._id.w}`, r.amount);
  }

  const trendWeekly: RevenueTrendPoint[] = weeklyRaw.map((r) => {
    const key = `${r._id.y}-${r._id.w}`;
    const prev2 = prevWeeklyMap.get(key) ?? { gross: 0, net: 0 };
    return {
      date:      `W${r._id.w} ${r.minDate ? fmtDateLabel(new Date(r.minDate)) : ''}`,
      gross:     r.gross,
      net:       r.net,
      refunds:   weeklyRefundMap.get(key) ?? 0,
      prevGross: prev2.gross,
      prevNet:   prev2.net,
    };
  });

  // ── Monthly trend (last 12 months) ────────────────────────────────────────────

  const monthlyRefundMap = new Map<string, number>();
  for (const r of monthlyRefundsRaw) {
    monthlyRefundMap.set(`${r._id.y}-${r._id.m}`, r.amount);
  }

  const trendMonthly: RevenueTrendPoint[] = monthlyRaw.map((r, i) => {
    const prevIdx = i - 1;
    const prevM = monthlyRaw[prevIdx];
    const key = `${r._id.y}-${r._id.m}`;
    return {
      date:      fmtMonthLabel(r._id.y, r._id.m),
      gross:     r.gross,
      net:       r.net,
      refunds:   monthlyRefundMap.get(key) ?? 0,
      prevGross: prevM?.gross ?? 0,
      prevNet:   prevM?.net   ?? 0,
    };
  });

  // ── Payment method stats ───────────────────────────────────────────────────────

  const paymentStats: PaymentMethodStat[] = paymentStatsRaw.map((r) => ({
    method:      r._id as string,
    revenue:     r.revenue,
    orders:      r.orders,
    aov:         r.orders > 0 ? Math.round(r.revenue / r.orders) : 0,
    successRate: r._id === 'bank-transfer' ? 100 : 97,  // Paystack ~97% success rate
  }));

  // ── Payment method monthly ─────────────────────────────────────────────────────

  const pmMonthMap = new Map<string, { paystack: number; bank: number }>();
  for (const r of paymentMonthlyRaw) {
    const key = `${r._id.y}-${r._id.m}`;
    const entry = pmMonthMap.get(key) ?? { paystack: 0, bank: 0 };
    if (r._id.method === 'paystack') entry.paystack = r.revenue;
    else entry.bank = r.revenue;
    pmMonthMap.set(key, entry);
  }

  const paymentMonthly: PaymentMethodMonthPoint[] = Array.from(pmMonthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => {
      const [y, m] = key.split('-').map(Number);
      return { month: fmtMonthLabel(y, m), ...v };
    });

  // ── Delivery method stats ──────────────────────────────────────────────────────

  const deliveryStats: DeliveryMethodStat[] = deliveryStatsRaw.map((r) => {
    const mapped = DELIVERY_MAP[r._id as string] ?? { key: r._id, label: r._id };
    return {
      key:         mapped.key,
      method:      mapped.label,
      orders:      r.orders,
      revenue:     r.revenue,
      aov:         r.orders > 0 ? Math.round(r.revenue / r.orders) : 0,
      deliveryFee: r.deliveryFee,
    };
  });

  // ── AOV daily ─────────────────────────────────────────────────────────────────

  const aovDaily: AOVPoint[] = aovDailyRaw.map((r) => ({
    date: fmtDateLabel(new Date(r.minDate ?? new Date(r._id.y, r._id.m - 1, r._id.d))),
    aov:  r.count > 0 ? Math.round(r.totalRev / r.count) : 0,
  }));

  // ── AOV histogram ─────────────────────────────────────────────────────────────

  const bucketLabels: Record<string, string> = {
    '0':    '₦0–5k',
    '5000': '₦5k–10k',
    '10000':'₦10k–15k',
    '15000':'₦15k–20k',
    '20000':'₦20k–30k',
    '30k+': '₦30k+',
  };
  const aovHistogram: AOVBucket[] = aovHistogramRaw.map((r) => ({
    range: bucketLabels[String(r._id)] ?? String(r._id),
    count: r.count,
  }));

  // ── Revenue by hour ────────────────────────────────────────────────────────────

  const hourMap = new Map<number, number>();
  for (const r of byHourRaw) hourMap.set(r._id as number, r.revenue);

  function fmtHour(h: number): string {
    if (h === 0)  return '12am';
    if (h === 12) return '12pm';
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  }

  const revenueByHour: TimingPoint[] = Array.from({ length: 24 }, (_, h) => ({
    label:   fmtHour(h),
    revenue: hourMap.get(h) ?? 0,
  }));

  // ── Revenue by day of week ─────────────────────────────────────────────────────

  const dowMap = new Map<number, number>();
  for (const r of byDowRaw) dowMap.set(r._id as number, r.revenue);

  const revenueByDow: TimingPoint[] = DOW_ORDER.map((mongoDay) => ({
    label:   DOW_MAP[mongoDay],
    revenue: dowMap.get(mongoDay) ?? 0,
  }));

  // ── Refund analysis ────────────────────────────────────────────────────────────

  const refundsCount  = curRef.count;
  const refundsAmount = curRef.amount;
  const refundRate    = cur.orders + refundsCount > 0
    ? Math.round((refundsCount / (cur.orders + refundsCount)) * 1000) / 10
    : 0;
  const avgRefundAmount = refundsCount > 0 ? Math.round(refundsAmount / refundsCount) : 0;

  const refundReasons: RefundReason[] = refundsCount > 0
    ? [{ reason: 'Refunded', count: refundsCount, amount: refundsAmount }]
    : [];

  const refundsOverTime: RefundPoint[] = refundedOrdersRaw.map((r) => ({
    date:   fmtDateLabel(new Date(r.date as Date)),
    amount: r.amount as number,
  }));

  const refundedOrders: RefundedOrder[] = refundedOrdersRaw.map((r) => ({
    id:       r.orderNumber as string,
    customer: r.customer as string,
    amount:   r.amount as number,
    reason:   'Refunded',
    date:     fmtDateLabel(new Date(r.date as Date)),
  }));

  // ── Forecast ──────────────────────────────────────────────────────────────────

  const forecastValues  = trendMonthly.map((p) => p.net);
  const forecastLabels  = trendMonthly.map((p) => p.date);
  const lastDate        = monthlyRaw[monthlyRaw.length - 1];
  const nextMonthLabels: string[] = [];
  if (lastDate) {
    for (let i = 1; i <= 2; i++) {
      const m = lastDate._id.m + i;
      const y = lastDate._id.y + Math.floor((m - 1) / 12);
      const adjustedM = ((m - 1) % 12) + 1;
      nextMonthLabels.push(fmtMonthLabel(y, adjustedM));
    }
  } else {
    const thisM = now.getMonth() + 1;
    const thisY = now.getFullYear();
    for (let i = 1; i <= 2; i++) {
      const m = thisM + i;
      const y = thisY + Math.floor((m - 1) / 12);
      nextMonthLabels.push(fmtMonthLabel(y, ((m - 1) % 12) + 1));
    }
  }
  const forecastData = forecast2Months(forecastValues, forecastLabels, nextMonthLabels);

  // Forecast KPIs
  const projected = forecastData.filter((p) => p.forecast !== null);
  const projectedRevenue = projected.reduce((s, p) => s + (p.forecast ?? 0), 0);
  const avgMonthlyOrders = cur.orders / Math.max(1, trendMonthly.length);
  const projectedOrders  = Math.round(avgMonthlyOrders * 2);
  const growthPct = prev.net > 0
    ? Math.round(((cur.net - prev.net) / prev.net) * 1000) / 10
    : 0;

  // ── Cohort table ──────────────────────────────────────────────────────────────

  // Build first-order-month lookup
  const firstOrderMonth = new Map<string, string>(); // email → 'YYYY-M'
  for (const r of cohortFirstOrdersRaw) {
    const d = new Date(r.firstDate as Date);
    firstOrderMonth.set(r._id as string, `${d.getFullYear()}-${d.getMonth() + 1}`);
  }

  // Collect all distinct cohort months (sorted)
  const cohortMonthSet = new Set<string>();
  for (const v of firstOrderMonth.values()) cohortMonthSet.add(v);

  const sortedCohortMonths = Array.from(cohortMonthSet).sort();

  // Build cohort key index
  const cohortMonthKeys = sortedCohortMonths;
  const cohortKeyToIndex = new Map<string, number>();
  cohortMonthKeys.forEach((k, i) => cohortKeyToIndex.set(k, i));

  const numCohorts = cohortMonthKeys.length;
  // Max column span = numCohorts months of subsequent retention
  const maxCols = Math.min(numCohorts, 8);

  // Revenue matrix: cohortIndex → monthOffset → revenue
  const cohortMatrix: number[][] = Array.from({ length: numCohorts }, () =>
    Array(maxCols).fill(0)
  );

  for (const order of cohortAllOrdersRaw) {
    const email = order.email as string;
    const cohortKey = firstOrderMonth.get(email);
    if (!cohortKey) continue;
    const cohortIdx = cohortKeyToIndex.get(cohortKey);
    if (cohortIdx === undefined) continue;
    const orderMonthKey = `${order.year}-${order.month}`;
    const orderCohortIdx = cohortKeyToIndex.get(orderMonthKey);
    if (orderCohortIdx === undefined) continue;
    const offset = orderCohortIdx - cohortIdx;
    if (offset >= 0 && offset < maxCols) {
      cohortMatrix[cohortIdx][offset] += order.revenue as number;
    }
  }

  // Determine "future" cells (months that haven't happened yet relative to each cohort)
  const nowKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const nowIdx = cohortKeyToIndex.get(nowKey) ?? (numCohorts - 1);

  const cohortData: CohortRow[] = cohortMonthKeys.slice(-8).map((cohortKey, rowIdx) => {
    const absoluteCohortIdx = cohortKeyToIndex.get(cohortKey) ?? 0;
    const values: (number | null)[] = cohortMatrix[absoluteCohortIdx]?.slice(0, maxCols).map((v, col) => {
      const absoluteMonthIdx = absoluteCohortIdx + col;
      return absoluteMonthIdx > nowIdx ? null : v;
    }) ?? [];
    return { cohort: fmtMonthLabel(...(cohortKey.split('-').map(Number) as [number, number])), values };
  });

  // Displayed cohort month labels (column headers)
  const displayedCohortMonths = cohortMonthKeys.slice(-8).map((k) => {
    const [y, m] = k.split('-').map(Number);
    return fmtMonthLabel(y, m);
  });

  const allValues = cohortData.flatMap((r) => r.values.filter((v): v is number => v !== null));
  const cohortMax = allValues.length > 0 ? Math.max(...allValues) : 1;

  // ── Compile response ──────────────────────────────────────────────────────────

  const responseData: RevenueData = {
    from: fromDate.toISOString().split('T')[0],
    to:   toDate.toISOString().split('T')[0],
    periodDays,

    kpis: {
      gross:             cur.gross,
      prevGross:         prev.gross,
      net:               cur.net,
      prevNet:           prev.net,
      discount:          cur.discount + curRef.discount,
      prevDiscount:      prev.discount,
      refundsAmount:     refundsAmount,
      prevRefundsAmount: prevRef.amount,
      refundsCount,
      orders:            cur.orders,
      prevOrders:        prev.orders,
      aov:               cur.orders > 0 ? Math.round(cur.net / cur.orders) : 0,
      prevAov:           prev.orders > 0 ? Math.round(prev.net / prev.orders) : 0,
    },

    trendDaily,
    trendWeekly,
    trendMonthly,

    paymentStats,
    paymentMonthly,

    deliveryStats,

    aovDaily,
    aovHistogram,

    revenueByHour,
    revenueByDow,

    refundKpis: {
      count:     refundsCount,
      amount:    refundsAmount,
      rate:      refundRate,
      avgAmount: avgRefundAmount,
    },
    refundReasons,
    refundsOverTime,
    refundedOrders,

    forecastData,
    forecastKpis: {
      projectedRevenue,
      projectedOrders,
      growthPct,
    },

    cohortMonths: displayedCohortMonths,
    cohortData,
    cohortMax,
  };

  return NextResponse.json<ApiResponse<RevenueData>>({ data: responseData });
}
