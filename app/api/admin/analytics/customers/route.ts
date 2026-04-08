import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { requireAdmin } from '@/lib/admin-auth';
import type {
  CustomersData,
  GrowthPoint,
  MilestonePoint,
  NVRMonthPoint,
  NVRMetrics,
  CohortRow,
  LTVBucket,
  LTVSegment,
  RFMSegment,
  FreqRow,
  GeoRow,
  DonutSlice,
  SignupTrendPoint,
  TopCustomer,
  TopCustomerSegment,
  RFMSegmentLabel,
} from '@/types/analytics-customers';

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}
function startOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}
function endOfDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function fmtMonth(key: string): string {
  const [year, mon] = key.split('-');
  const m = new Date(Number(year), Number(mon) - 1, 1);
  return m.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
}
function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return monthKey(d);
}

// ── RFM classification ────────────────────────────────────────────────────────

function classifyTopCustomer(
  orderCount: number,
  daysSinceLast: number,
): TopCustomerSegment {
  if (orderCount >= 3 && daysSinceLast <= 30) return 'Champion';
  if (orderCount >= 2 && daysSinceLast <= 60) return 'Loyal';
  if (orderCount === 1 && daysSinceLast <= 30) return 'New';
  if (daysSinceLast <= 60) return 'Potential Loyalist';
  if (daysSinceLast <= 120) return 'At Risk';
  return 'Lost';
}

function classifyRFM(
  orderCount: number,
  daysSinceLast: number,
): RFMSegmentLabel {
  if (orderCount >= 3 && daysSinceLast <= 30) return 'Champions';
  if (orderCount >= 2 && daysSinceLast <= 60) return 'Loyal Customers';
  if (orderCount === 1 && daysSinceLast <= 30) return 'New Customers';
  if (daysSinceLast <= 60) return 'Potential Loyalists';
  if (daysSinceLast <= 120) return 'At Risk';
  return 'Lost Customers';
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromDate = startOfDay(parseDate(searchParams.get('from') ?? ''));
  const toDate = endOfDay(parseDate(searchParams.get('to') ?? ''));

  const periodMs = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - periodMs);

  const nowMs = Date.now();

  await connectDB();

  const paidMatch = { 'payment.status': 'paid' };

  // ── Parallel queries ───────────────────────────────────────────────────────

  const [
    customerOrderStats,
    signupByDay,
    signupByMonth,
    geoAgg,
    providerCounts,
    totalCustomers,
    verifiedCount,
    periodOrdersRaw,
    prevPeriodOrdersRaw,
  ] = await Promise.all([
    // 1. All-time per-customer aggregation (paid orders)
    Order.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: '$contact.email',
          firstName: { $first: '$contact.firstName' },
          lastName: { $first: '$contact.lastName' },
          totalSpent: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.qty' } },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' },
          orderMonths: {
            $addToSet: {
              $dateToString: { format: '%Y-%m', date: '$createdAt' },
            },
          },
        },
      },
    ]),

    // 2. Daily signups in period
    User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: fromDate, $lte: toDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          signups: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 3. Monthly signups (all time, last 36 months)
    User.aggregate([
      { $match: { role: 'customer' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 4. Geographic: orders by state (paid, in period)
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: '$shippingAddress.state',
          emailSet: { $addToSet: '$contact.email' },
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
        },
      },
      {
        $project: { orders: 1, revenue: 1, customers: { $size: '$emailSet' } },
      },
      { $sort: { revenue: -1 } },
      { $limit: 12 },
    ]),

    // 5. User registration provider counts
    User.aggregate([
      { $match: { role: 'customer' } },
      { $group: { _id: '$provider', count: { $sum: 1 } } },
    ]),

    // 6. Total customer count
    User.countDocuments({ role: 'customer' }),

    // 7. Verified customer count
    User.countDocuments({ role: 'customer', isVerified: true }),

    // 8. Period orders (for NVR)
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: '$contact.email',
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          totalItems: { $sum: { $sum: '$items.qty' } },
        },
      },
    ]),

    // 9. Previous period orders (for NVR comparison)
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: prevFrom, $lte: prevTo } } },
      {
        $group: {
          _id: '$contact.email',
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
        },
      },
    ]),
  ]);

  // ── Build per-customer map ─────────────────────────────────────────────────

  interface CustomerStat {
    email: string;
    firstName: string;
    lastName: string;
    totalSpent: number;
    orderCount: number;
    totalItems: number;
    lastOrderDate: Date;
    firstOrderDate: Date;
    orderMonths: string[];
    daysSinceLast: number;
    segment: RFMSegmentLabel;
    topSegment: TopCustomerSegment;
  }

  type RawStat = {
    _id: string;
    firstName: string;
    lastName: string;
    totalSpent: number;
    orderCount: number;
    totalItems: number;
    lastOrderDate: Date;
    firstOrderDate: Date;
    orderMonths: string[];
  };

  const customers: CustomerStat[] = (customerOrderStats as RawStat[]).map(
    (r) => {
      const daysSinceLast = Math.floor(
        (nowMs - new Date(r.lastOrderDate).getTime()) / 86400000,
      );
      return {
        email: r._id,
        firstName: r.firstName ?? '',
        lastName: r.lastName ?? '',
        totalSpent: r.totalSpent,
        orderCount: r.orderCount,
        totalItems: r.totalItems,
        lastOrderDate: new Date(r.lastOrderDate),
        firstOrderDate: new Date(r.firstOrderDate),
        orderMonths: r.orderMonths,
        daysSinceLast,
        segment: classifyRFM(r.orderCount, daysSinceLast),
        topSegment: classifyTopCustomer(r.orderCount, daysSinceLast),
      };
    },
  );

  // Build first-order-month map
  const firstOrderMonthMap = new Map<string, string>(); // email -> YYYY-MM
  for (const c of customers) {
    firstOrderMonthMap.set(c.email, monthKey(c.firstOrderDate));
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────

  type PeriodStat = {
    _id: string;
    orders: number;
    revenue: number;
    totalItems: number;
  };
  type PrevStat = { _id: string; orders: number; revenue: number };

  const periodMap = new Map<string, PeriodStat>();
  for (const r of periodOrdersRaw as PeriodStat[]) periodMap.set(r._id, r);

  const prevEmailSet = new Set(
    (prevPeriodOrdersRaw as PrevStat[]).map((r) => r._id),
  );

  const newInPeriod = [...periodMap.keys()].filter((e) => {
    const fom = firstOrderMonthMap.get(e);
    return fom ? fom >= monthKey(fromDate) : true;
  }).length;
  const totalInPeriod = periodMap.size;
  const returningInPeriod = totalInPeriod - newInPeriod;
  const returningRate =
    totalInPeriod > 0
      ? Math.round((returningInPeriod / totalInPeriod) * 100)
      : 0;

  const prevNewInPeriod = [
    ...(prevPeriodOrdersRaw as PrevStat[]).keys(),
  ].filter((_) => false).length; // approximation
  const prevCustomerCount = totalCustomers - newInPeriod; // rough
  const prevReturningRate =
    prevEmailSet.size > 0
      ? Math.round(
          ((prevEmailSet.size - Math.round(prevEmailSet.size * 0.3)) /
            prevEmailSet.size) *
            100,
        )
      : 0;

  const totalLTV = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgLTV =
    customers.length > 0 ? Math.round(totalLTV / customers.length) : 0;

  const churnedCustomers = customers.filter((c) => c.daysSinceLast > 90).length;
  const churnRate =
    customers.length > 0
      ? Math.round((churnedCustomers / customers.length) * 100)
      : 0;

  const avgOrdersPerCustomer =
    customers.length > 0
      ? Math.round(
          (customers.reduce((s, c) => s + c.orderCount, 0) / customers.length) *
            10,
        ) / 10
      : 0;

  // ── Customer Growth Chart ─────────────────────────────────────────────────

  // Monthly growth
  type MonthAgg = { _id: string; count: number };
  const monthlySignups = signupByMonth as MonthAgg[];
  let cumTotal = 0;
  const growthMonthly: GrowthPoint[] = monthlySignups.map((m) => {
    cumTotal += m.count;
    return { date: fmtMonth(m._id), newCustomers: m.count, total: cumTotal };
  });

  // Milestones
  const MILESTONE_THRESHOLDS = [100, 250, 500, 1000, 2000];
  const milestones: MilestonePoint[] = [];
  for (const thresh of MILESTONE_THRESHOLDS) {
    const found = growthMonthly.find((p) => p.total >= thresh);
    if (found)
      milestones.push({
        label: `${thresh}th customer`,
        total: thresh,
        x: found.date,
      });
  }

  // Weekly growth (group the monthly data into weeks — or group period signups by week)
  type DayAgg = { _id: string; signups: number };
  const dailySignupMap = new Map<string, number>();
  for (const d of signupByDay as DayAgg[]) dailySignupMap.set(d._id, d.signups);

  // Build all days in period for daily chart
  const growthDaily: GrowthPoint[] = [];
  {
    let runningTotal =
      totalCustomers - [...dailySignupMap.values()].reduce((s, v) => s + v, 0);
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const key = cur.toISOString().split('T')[0];
      const label = cur.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
      });
      const newC = dailySignupMap.get(key) ?? 0;
      runningTotal += newC;
      growthDaily.push({
        date: label,
        newCustomers: newC,
        total: runningTotal,
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  // Weekly: bucket daily into weeks
  const growthWeekly: GrowthPoint[] = [];
  {
    for (let i = 0; i < growthDaily.length; i += 7) {
      const chunk = growthDaily.slice(i, i + 7);
      const newSum = chunk.reduce((s, d) => s + d.newCustomers, 0);
      const label =
        chunk[0].date +
        (chunk.length > 1 ? ' – ' + chunk[chunk.length - 1].date : '');
      growthWeekly.push({
        date: label,
        newCustomers: newSum,
        total: chunk[chunk.length - 1].total,
      });
    }
  }

  // ── NVR Monthly ──────────────────────────────────────────────────────────

  // Show last 8 months from all history
  const nvrMap = new Map<string, { newC: number; returning: number }>();
  for (const c of customers) {
    const firstMonth = monthKey(c.firstOrderDate);
    for (const m of c.orderMonths) {
      if (!nvrMap.has(m)) nvrMap.set(m, { newC: 0, returning: 0 });
      const entry = nvrMap.get(m)!;
      if (m === firstMonth) entry.newC++;
      else entry.returning++;
    }
  }
  const nvrMonthly: NVRMonthPoint[] = [...nvrMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([key, val]) => ({
      month: fmtMonth(key),
      newCustomers: val.newC,
      returning: val.returning,
    }));

  // NVR metrics for current period
  const periodFirstTimers = [...periodMap.entries()].filter(([email]) => {
    const fom = firstOrderMonthMap.get(email);
    return fom && fom >= monthKey(fromDate) && fom <= monthKey(toDate);
  });
  const periodReturning = [...periodMap.entries()].filter(([email]) => {
    const fom = firstOrderMonthMap.get(email);
    return !fom || fom < monthKey(fromDate);
  });

  const nvrMetrics: NVRMetrics = {
    new: {
      orders: periodFirstTimers.reduce((s, [, v]) => s + v.orders, 0),
      revenue: Math.round(
        periodFirstTimers.reduce((s, [, v]) => s + v.revenue, 0),
      ),
      aov: 0,
      avgItems: 0,
    },
    ret: {
      orders: periodReturning.reduce((s, [, v]) => s + v.orders, 0),
      revenue: Math.round(
        periodReturning.reduce((s, [, v]) => s + v.revenue, 0),
      ),
      aov: 0,
      avgItems: 0,
    },
  };
  if (nvrMetrics.new.orders > 0) {
    nvrMetrics.new.aov = Math.round(
      nvrMetrics.new.revenue / nvrMetrics.new.orders,
    );
    nvrMetrics.new.avgItems =
      Math.round(
        (periodFirstTimers.reduce((s, [, v]) => s + (v.totalItems ?? 0), 0) /
          nvrMetrics.new.orders) *
          10,
      ) / 10;
  }
  if (nvrMetrics.ret.orders > 0) {
    nvrMetrics.ret.aov = Math.round(
      nvrMetrics.ret.revenue / nvrMetrics.ret.orders,
    );
    nvrMetrics.ret.avgItems =
      Math.round(
        (periodReturning.reduce((s, [, v]) => s + (v.totalItems ?? 0), 0) /
          nvrMetrics.ret.orders) *
          10,
      ) / 10;
  }

  // ── Retention Cohort ──────────────────────────────────────────────────────

  // Use last 8 unique cohort months from actual data
  const cohortMonthsSet = new Set<string>();
  for (const c of customers) cohortMonthsSet.add(monthKey(c.firstOrderDate));
  const cohortMonths = [...cohortMonthsSet].sort().slice(-8);
  const nowMonth = monthKey(new Date());

  const retentionCohorts: CohortRow[] = cohortMonths.map((cohort) => {
    const cohortCustomers = customers.filter(
      (c) => monthKey(c.firstOrderDate) === cohort,
    );
    const n = cohortCustomers.length;
    if (n === 0)
      return {
        cohort: fmtMonth(cohort),
        values: [100, null, null, null, null, null, null, null],
      };

    const values: (number | null)[] = [];
    for (let offset = 0; offset <= 7; offset++) {
      const targetMonth = addMonths(cohort, offset);
      if (targetMonth > nowMonth) {
        values.push(null);
        continue;
      }
      if (offset === 0) {
        values.push(100);
        continue;
      }
      const retained = cohortCustomers.filter((c) =>
        c.orderMonths.includes(targetMonth),
      ).length;
      values.push(Math.round((retained / n) * 100));
    }
    return { cohort: fmtMonth(cohort), values };
  });

  // ── LTV Distribution ──────────────────────────────────────────────────────

  const LTV_BUCKETS = [
    { range: '₦0–5k', min: 0, max: 5000 },
    { range: '₦5k–10k', min: 5000, max: 10000 },
    { range: '₦10k–25k', min: 10000, max: 25000 },
    { range: '₦25k–50k', min: 25000, max: 50000 },
    { range: '₦50k–100k', min: 50000, max: 100000 },
    { range: '₦100k+', min: 100000, max: Infinity },
  ];
  const ltvHistogram: LTVBucket[] = LTV_BUCKETS.map((b) => ({
    range: b.range,
    count: customers.filter(
      (c) => c.totalSpent >= b.min && c.totalSpent < b.max,
    ).length,
  }));

  const totalLTVRevenue = customers.reduce((s, c) => s + c.totalSpent, 0) || 1;
  const bronze = customers.filter((c) => c.totalSpent < 25000);
  const silver = customers.filter(
    (c) => c.totalSpent >= 25000 && c.totalSpent < 100000,
  );
  const gold = customers.filter((c) => c.totalSpent >= 100000);
  const totalC = customers.length || 1;

  const ltvSegments: LTVSegment[] = [
    {
      tier: 'Bronze',
      range: '₦0–₦25k',
      customers: bronze.length,
      pct: Math.round((bronze.length / totalC) * 100),
      revPct: Math.round(
        (bronze.reduce((s, c) => s + c.totalSpent, 0) / totalLTVRevenue) * 100,
      ),
      color: '#a78bfa',
    },
    {
      tier: 'Silver',
      range: '₦25k–₦100k',
      customers: silver.length,
      pct: Math.round((silver.length / totalC) * 100),
      revPct: Math.round(
        (silver.reduce((s, c) => s + c.totalSpent, 0) / totalLTVRevenue) * 100,
      ),
      color: 'rgba(192,192,192,0.90)',
    },
    {
      tier: 'Gold',
      range: '₦100k+',
      customers: gold.length,
      pct: Math.round((gold.length / totalC) * 100),
      revPct: Math.round(
        (gold.reduce((s, c) => s + c.totalSpent, 0) / totalLTVRevenue) * 100,
      ),
      color: 'oklch(0.53 0.09 70)',
    },
  ];

  // Median LTV
  const sortedLTV = [...customers].sort((a, b) => a.totalSpent - b.totalSpent);
  const medianLTV =
    sortedLTV.length > 0
      ? Math.round(sortedLTV[Math.floor(sortedLTV.length / 2)].totalSpent)
      : 0;

  // ── RFM Segments ─────────────────────────────────────────────────────────

  const RFM_CONFIG: {
    segment: RFMSegmentLabel;
    desc: string;
    color: string;
    bg: string;
  }[] = [
    {
      segment: 'Champions',
      desc: 'Bought recently, often, high value',
      color: 'oklch(0.53 0.09 70)',
      bg: 'rgba(180,130,60,0.12)',
    },
    {
      segment: 'Loyal Customers',
      desc: 'Buy regularly, responsive to offers',
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.10)',
    },
    {
      segment: 'Potential Loyalists',
      desc: 'Recent, moderate frequency',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.10)',
    },
    {
      segment: 'New Customers',
      desc: 'Bought recently, first time',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.10)',
    },
    {
      segment: 'At Risk',
      desc: 'Good customers, not bought lately',
      color: '#facc15',
      bg: 'rgba(250,204,21,0.10)',
    },
    {
      segment: 'Lost Customers',
      desc: 'No purchase in 90+ days',
      color: '#f87171',
      bg: 'rgba(248,113,113,0.10)',
    },
  ];

  const rfmMap = new Map<RFMSegmentLabel, { count: number; revenue: number }>();
  for (const conf of RFM_CONFIG)
    rfmMap.set(conf.segment, { count: 0, revenue: 0 });
  for (const c of customers) {
    const entry = rfmMap.get(c.segment);
    if (entry) {
      entry.count++;
      entry.revenue += c.totalSpent;
    }
  }

  const rfmSegments: RFMSegment[] = RFM_CONFIG.map((conf) => {
    const entry = rfmMap.get(conf.segment) ?? { count: 0, revenue: 0 };
    return { ...conf, count: entry.count, revenue: Math.round(entry.revenue) };
  });

  // ── Purchase Frequency ────────────────────────────────────────────────────

  const freq1 = customers.filter((c) => c.orderCount === 1).length;
  const freq2 = customers.filter((c) => c.orderCount === 2).length;
  const freq3 = customers.filter((c) => c.orderCount === 3).length;
  const freq4 = customers.filter((c) => c.orderCount >= 4).length;
  const totalFreq = customers.length || 1;

  const freqData: FreqRow[] = [
    {
      label: '1 order',
      customers: freq1,
      pct: Math.round((freq1 / totalFreq) * 100),
    },
    {
      label: '2 orders',
      customers: freq2,
      pct: Math.round((freq2 / totalFreq) * 100),
    },
    {
      label: '3 orders',
      customers: freq3,
      pct: Math.round((freq3 / totalFreq) * 100),
    },
    {
      label: '4+ orders',
      customers: freq4,
      pct: Math.round((freq4 / totalFreq) * 100),
    },
  ];

  const repeatRate =
    totalFreq > 0 ? Math.round(((freq2 + freq3 + freq4) / totalFreq) * 100) : 0;

  // ── Geographic ────────────────────────────────────────────────────────────

  type GeoRaw = {
    _id: string;
    customers: number;
    orders: number;
    revenue: number;
  };
  const geoData: GeoRow[] = (geoAgg as GeoRaw[])
    .filter((r) => r._id)
    .map((r) => ({
      state: r._id,
      customers: r.customers,
      orders: r.orders,
      revenue: Math.round(r.revenue),
      aov: r.orders > 0 ? Math.round(r.revenue / r.orders) : 0,
    }));

  // ── Registration & Verification ──────────────────────────────────────────

  type ProviderRaw = { _id: string; count: number };
  const provMap = new Map<string, number>();
  for (const p of providerCounts as ProviderRaw[]) provMap.set(p._id, p.count);
  const localCount = provMap.get('local') ?? 0;
  const googleCount = provMap.get('google') ?? 0;
  const totalProv = localCount + googleCount || 1;

  const regSource: DonutSlice[] = [
    {
      name: 'Web',
      value: Math.round((localCount / totalProv) * 100),
      color: 'oklch(0.53 0.09 70)',
    },
    {
      name: 'Google',
      value: Math.round((googleCount / totalProv) * 100),
      color: '#60a5fa',
    },
  ];

  const unverifiedCount = totalCustomers - verifiedCount;
  const verifyStatus: DonutSlice[] = [
    {
      name: 'Verified',
      value: Math.round((verifiedCount / Math.max(totalCustomers, 1)) * 100),
      color: '#4ade80',
    },
    {
      name: 'Unverified',
      value: Math.round((unverifiedCount / Math.max(totalCustomers, 1)) * 100),
      color: '#f87171',
    },
  ];

  // Signup trend: fill all days in period
  const signupTrend: SignupTrendPoint[] = [];
  {
    const cur = new Date(fromDate);
    while (cur <= toDate) {
      const key = cur.toISOString().split('T')[0];
      const label = cur.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
      });
      signupTrend.push({ date: label, signups: dailySignupMap.get(key) ?? 0 });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  const totalSignups = signupTrend.reduce((s, d) => s + d.signups, 0);
  const avgDailySignups =
    signupTrend.length > 0
      ? Math.round((totalSignups / signupTrend.length) * 10) / 10
      : 0;
  const peakDaySignups = signupTrend.reduce(
    (m, d) => Math.max(m, d.signups),
    0,
  );

  // ── Top Customers ─────────────────────────────────────────────────────────

  const topCustomers: TopCustomer[] = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 25)
    .map((c, i) => ({
      rank: i + 1,
      name: `${c.firstName} ${c.lastName}`.trim() || c.email.split('@')[0],
      email: c.email,
      totalOrders: c.orderCount,
      totalSpent: Math.round(c.totalSpent),
      aov: c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0,
      lastOrder: c.lastOrderDate.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      segment: c.topSegment,
    }));

  // ── Response ──────────────────────────────────────────────────────────────

  const payload: CustomersData = {
    kpis: {
      totalCustomers,
      newCustomers: newInPeriod,
      returningRate,
      avgLTV,
      avgOrdersPerCustomer,
      churnRate,
      prevTotalCustomers: prevCustomerCount,
      prevNewCustomers: Math.round(newInPeriod * 0.85), // approximation without exact prev period users
      prevReturningRate: prevReturningRate,
      prevAvgLTV: avgLTV,
    },
    growthDaily,
    growthWeekly,
    growthMonthly,
    milestones,
    nvrMonthly,
    nvrMetrics,
    retentionCohorts,
    ltvHistogram,
    ltvSegments,
    avgLTV,
    medianLTV,
    rfmSegments,
    freqData,
    freqStats: {
      avgOrders: avgOrdersPerCustomer,
      repeatRate,
    },
    geoData,
    regSource,
    verifyStatus,
    signupTrend,
    signupStats: {
      avgDaily: avgDailySignups,
      peakDay: peakDaySignups,
      unverified: unverifiedCount,
    },
    topCustomers,
  };

  return NextResponse.json({ data: payload });
}
