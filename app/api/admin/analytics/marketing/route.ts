import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/lib/admin-auth';
import type {
  MarketingData, MarketingKPIData, PromoCodeRow, PromoDayPoint,
  DiscountImpactData, CodeUsageSplit, PromoType, PromoStatus,
} from '@/types/analytics-marketing';
import type { ICoupon } from '@/models/Coupon';

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}
function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}
function periodDays(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
}
function dateRange(from: Date, to: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

const CODE_COLORS = [
  'oklch(0.53 0.09 70)', '#4ade80', '#60a5fa', '#a78bfa',
  '#fb923c', '#f472b6', '#34d399', '#38bdf8',
];

function mapType(type: string): PromoType {
  if (type === 'pct') return 'Percentage';
  if (type === 'flat') return 'Fixed';
  if (type === 'free-shipping') return 'Free Shipping';
  return 'Buy X Get Y';
}

function mapStatus(coupon: ICoupon | undefined): PromoStatus {
  if (!coupon) return 'Disabled';
  const now = new Date();
  if (coupon.expiresAt && coupon.expiresAt < now) return 'Expired';
  switch (coupon.status) {
    case 'active':    return 'Active';
    case 'scheduled': return 'Scheduled';
    case 'disabled':
    case 'archived':  return 'Disabled';
    default:          return 'Draft';
  }
}

function mapDiscount(coupon: ICoupon | undefined): string {
  if (!coupon) return '—';
  switch (coupon.type) {
    case 'pct':          return `${coupon.value}%`;
    case 'flat':         return `\u20A6${coupon.value.toLocaleString('en-NG')}`;
    case 'free-shipping': return 'Free Shipping';
    case 'buy-x-get-y':  return `Buy ${coupon.buyX} Get ${coupon.getY}`;
  }
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const sp        = req.nextUrl.searchParams;
  const fromDate  = startOfDay(parseDate(sp.get('from') ?? ''));
  const toDate    = endOfDay(parseDate(sp.get('to')   ?? ''));
  const spanDays  = periodDays(fromDate, toDate);
  const prevTo    = new Date(fromDate.getTime() - 1);
  const prevFrom  = startOfDay(new Date(prevTo.getTime() - (spanDays - 1) * 86400000));

  const PAID    = 'paid';
  const HAS_CODE = { $exists: true, $ne: '' };
  const inPeriod     = { $gte: fromDate, $lte: toDate };
  const inPrevPeriod = { $gte: prevFrom, $lte: prevTo };

  // ── 7 parallel queries ─────────────────────────────────────────────────────

  const [
    curCodeAgg,
    prevCodeAgg,
    dailyAgg,
    coupons,
    allTimeEmailAgg,
    impactAgg,
    prevTotAgg,
  ] = await Promise.all([

    // 1. Current period per-code stats
    Order.aggregate([
      { $match: { 'payment.status': PAID, 'pricing.couponCode': HAS_CODE, createdAt: inPeriod } },
      { $group: {
        _id:           '$pricing.couponCode',
        uses:          { $sum: 1 },
        revenue:       { $sum: '$pricing.total' },
        discountGiven: { $sum: '$pricing.discount' },
        uniqueEmails:  { $addToSet: '$contact.email' },
      }},
    ]),

    // 2. Previous period per-code stats (for KPI comparison)
    Order.aggregate([
      { $match: { 'payment.status': PAID, 'pricing.couponCode': HAS_CODE, createdAt: inPrevPeriod } },
      { $group: {
        _id:           '$pricing.couponCode',
        uses:          { $sum: 1 },
        revenue:       { $sum: '$pricing.total' },
        discountGiven: { $sum: '$pricing.discount' },
      }},
    ]),

    // 3. Daily per-code usage in current period (chart data)
    Order.aggregate([
      { $match: { 'payment.status': PAID, 'pricing.couponCode': HAS_CODE, createdAt: inPeriod } },
      { $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          code: '$pricing.couponCode',
        },
        uses:     { $sum: 1 },
        revenue:  { $sum: '$pricing.total' },
        discount: { $sum: '$pricing.discount' },
      }},
      { $sort: { '_id.date': 1 } },
    ]),

    // 4. All coupons
    Coupon.find({}).lean() as Promise<ICoupon[]>,

    // 5. All-time per-email: first paid order date + total order count
    Order.aggregate([
      { $match: { 'payment.status': PAID } },
      { $sort:  { createdAt: 1 } },
      { $group: {
        _id:         '$contact.email',
        firstDate:   { $first: '$createdAt' },
        totalOrders: { $sum: 1 },
      }},
    ]),

    // 6. Current period: all paid orders grouped by hasCode (discount impact)
    Order.aggregate([
      { $match: { 'payment.status': PAID, createdAt: inPeriod } },
      { $group: {
        _id: {
          hasCode: { $cond: [
            { $gt: [{ $ifNull: ['$pricing.couponCode', ''] }, ''] },
            true, false,
          ]},
        },
        orders:  { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
        emails:  { $addToSet: '$contact.email' },
      }},
    ]),

    // 7. Previous period total revenue (for prevDiscountRate)
    Order.aggregate([
      { $match: { 'payment.status': PAID, createdAt: inPrevPeriod } },
      { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } },
    ]),
  ]);

  // ── Build lookup maps ──────────────────────────────────────────────────────

  const couponMap = new Map<string, ICoupon>();
  for (const c of coupons) couponMap.set(c.code, c);

  const emailMap = new Map<string, { firstDate: Date; totalOrders: number }>();
  for (const e of allTimeEmailAgg) {
    emailMap.set(e._id as string, {
      firstDate:   e.firstDate   as Date,
      totalOrders: e.totalOrders as number,
    });
  }

  type CurStat = { uses: number; revenue: number; discountGiven: number; uniqueEmails: string[] };
  const curCodeMap = new Map<string, CurStat>();
  for (const a of curCodeAgg) {
    curCodeMap.set(a._id as string, {
      uses:          a.uses          as number,
      revenue:       a.revenue       as number,
      discountGiven: a.discountGiven as number,
      uniqueEmails:  a.uniqueEmails  as string[],
    });
  }

  // ── Build promo code rows ──────────────────────────────────────────────────

  const knownCodes = new Set<string>([
    ...coupons.map((c) => c.code),
    ...Array.from(curCodeMap.keys()),
  ]);

  let colorIdx = 0;
  const colorMap = new Map<string, string>();

  const promoCodes: PromoCodeRow[] = [];
  for (const code of knownCodes) {
    const stats  = curCodeMap.get(code);
    const coupon = couponMap.get(code);

    if (!colorMap.has(code)) colorMap.set(code, CODE_COLORS[colorIdx++ % CODE_COLORS.length]);
    const color = colorMap.get(code)!;

    const uses          = stats?.uses          ?? 0;
    const revenue       = stats?.revenue       ?? 0;
    const discountGiven = stats?.discountGiven ?? 0;

    promoCodes.push({
      code,
      type:            mapType(coupon?.type ?? 'pct'),
      discount:        mapDiscount(coupon),
      uses,
      limit:           coupon?.maxUses ?? null,
      uniqueCustomers: stats?.uniqueEmails.length ?? 0,
      revenue,
      discountGiven,
      aovWithCode:     uses > 0 ? Math.round(revenue / uses) : 0,
      roi:             discountGiven > 0 ? parseFloat((revenue / discountGiven).toFixed(1)) : 0,
      status:          mapStatus(coupon),
      color,
    });
  }

  // Sort: by revenue desc (used codes first)
  promoCodes.sort((a, b) => b.revenue - a.revenue || b.uses - a.uses);

  // Top codes for chart: active with uses > 0 (max 5)
  const topCodes = promoCodes
    .filter((c) => c.status === 'Active' && c.uses > 0)
    .slice(0, 5);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  // Current period totals from impactAgg
  type ImpactGroup = { _id: { hasCode: boolean }; orders: number; revenue: number; emails: string[] };
  const withCodeGroup = (impactAgg as ImpactGroup[]).find((g) => g._id.hasCode === true);
  const noCodeGroup   = (impactAgg as ImpactGroup[]).find((g) => g._id.hasCode === false);

  const curTotalRevenue   = (withCodeGroup?.revenue ?? 0) + (noCodeGroup?.revenue ?? 0);
  const curPromoRevenue   = promoCodes.reduce((s, c) => s + c.revenue,       0);
  const curTotalDiscount  = promoCodes.reduce((s, c) => s + c.discountGiven, 0);
  const curCodeUsageCount = promoCodes.reduce((s, c) => s + c.uses,          0);
  const curDiscountRate   = curTotalRevenue > 0
    ? parseFloat(((curTotalDiscount / curTotalRevenue) * 100).toFixed(1)) : 0;
  const curRoi = curTotalDiscount > 0
    ? parseFloat((curPromoRevenue / curTotalDiscount).toFixed(2)) : 0;

  const prevTotalRevenue   = (prevTotAgg[0]?.totalRevenue as number) ?? 0;
  const prevPromoRevenue   = (prevCodeAgg as { revenue: number }[]).reduce((s, a) => s + a.revenue,       0);
  const prevTotalDiscount  = (prevCodeAgg as { discountGiven: number }[]).reduce((s, a) => s + a.discountGiven, 0);
  const prevCodeUsageCount = (prevCodeAgg as { uses: number }[]).reduce((s, a) => s + a.uses, 0);
  const prevDiscountRate   = prevTotalRevenue > 0
    ? parseFloat(((prevTotalDiscount / prevTotalRevenue) * 100).toFixed(1)) : 0;
  const prevRoi = prevTotalDiscount > 0
    ? parseFloat((prevPromoRevenue / prevTotalDiscount).toFixed(2)) : 0;

  const kpis: MarketingKPIData = {
    promoRevenue:        curPromoRevenue,
    totalDiscount:       curTotalDiscount,
    codeUsageCount:      curCodeUsageCount,
    discountRate:        curDiscountRate,
    roi:                 curRoi,
    prevPromoRevenue,
    prevTotalDiscount,
    prevCodeUsageCount,
    prevDiscountRate,
    prevRoi,
  };

  // ── Daily chart ────────────────────────────────────────────────────────────

  type DailyRaw = { _id: { date: string; code: string }; uses: number; revenue: number; discount: number };
  const dailyMap = new Map<string, Map<string, { uses: number; revenue: number; discount: number }>>();
  for (const item of dailyAgg as DailyRaw[]) {
    if (!dailyMap.has(item._id.date)) dailyMap.set(item._id.date, new Map());
    dailyMap.get(item._id.date)!.set(item._id.code, {
      uses:     item.uses,
      revenue:  item.revenue,
      discount: item.discount,
    });
  }

  const topCodeIds = topCodes.map((c) => c.code);
  const promoDaily: PromoDayPoint[] = dateRange(fromDate, toDate).map((isoDate) => {
    const d     = new Date(isoDate + 'T00:00:00Z');
    const label = d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    const point: PromoDayPoint = { date: label };
    const dayData = dailyMap.get(isoDate);
    for (const code of topCodeIds) {
      point[`${code}_uses`]     = dayData?.get(code)?.uses     ?? 0;
      point[`${code}_revenue`]  = dayData?.get(code)?.revenue  ?? 0;
      point[`${code}_discount`] = dayData?.get(code)?.discount ?? 0;
    }
    return point;
  });

  // ── Discount impact ────────────────────────────────────────────────────────

  function repeatRate(emails: string[]): number {
    if (emails.length === 0) return 0;
    const r = emails.filter((e) => (emailMap.get(e)?.totalOrders ?? 0) > 1).length;
    return Math.round((r / emails.length) * 100);
  }

  const wcOrders  = withCodeGroup?.orders  ?? 0;
  const wcRevenue = withCodeGroup?.revenue ?? 0;
  const ncOrders  = noCodeGroup?.orders    ?? 0;
  const ncRevenue = noCodeGroup?.revenue   ?? 0;
  const totalRev  = wcRevenue + ncRevenue;

  const discountImpact: DiscountImpactData = {
    withCode: {
      aov:        wcOrders > 0 ? Math.round(wcRevenue / wcOrders) : 0,
      orders:     wcOrders,
      revenue:    wcRevenue,
      repeatRate: repeatRate(withCodeGroup?.emails ?? []),
    },
    noCode: {
      aov:        ncOrders > 0 ? Math.round(ncRevenue / ncOrders) : 0,
      orders:     ncOrders,
      revenue:    ncRevenue,
      repeatRate: repeatRate(noCodeGroup?.emails ?? []),
    },
    totalRevenue: totalRev,
    revenueSplit: [
      {
        name:  'Organic (no code)',
        value: ncRevenue,
        pct:   totalRev > 0 ? Math.round((ncRevenue / totalRev) * 100)   : 0,
        color: 'rgba(255,255,255,0.22)',
      },
      {
        name:  'Promoted (with code)',
        value: wcRevenue,
        pct:   totalRev > 0 ? Math.round((wcRevenue / totalRev) * 100) : 0,
        color: 'oklch(0.53 0.09 70)',
      },
    ],
  };

  // ── First vs repeat use ────────────────────────────────────────────────────

  const codeUsageSplit: CodeUsageSplit[] = topCodes.map((tc) => {
    const stats = curCodeMap.get(tc.code);
    const emails = stats?.uniqueEmails ?? [];
    if (emails.length === 0) return { code: tc.code, color: tc.color, newPct: 0, returnPct: 0 };
    const newCount = emails.filter((e) => {
      const em = emailMap.get(e);
      return em && em.firstDate >= fromDate && em.firstDate <= toDate;
    }).length;
    const newPct = Math.round((newCount / emails.length) * 100);
    return { code: tc.code, color: tc.color, newPct, returnPct: 100 - newPct };
  });

  // Overall split across all code-using customers in period
  const allCodeEmails = new Set<string>();
  for (const [, stats] of curCodeMap) {
    for (const e of stats.uniqueEmails) allCodeEmails.add(e);
  }
  let overallNewCount = 0;
  for (const email of allCodeEmails) {
    const em = emailMap.get(email);
    if (em && em.firstDate >= fromDate && em.firstDate <= toDate) overallNewCount++;
  }
  const total = allCodeEmails.size;
  const overallSplit = total > 0
    ? { newPct: Math.round((overallNewCount / total) * 100), returnPct: Math.round(((total - overallNewCount) / total) * 100) }
    : { newPct: 0, returnPct: 0 };

  // ── Site AOV ──────────────────────────────────────────────────────────────

  const totalOrders = wcOrders + ncOrders;
  const siteAov = totalOrders > 0 && totalRev > 0 ? Math.round(totalRev / totalOrders) : 0;

  // ── Response ───────────────────────────────────────────────────────────────

  const data: MarketingData = {
    kpis,
    promoCodes,
    topCodes,
    promoDaily,
    discountImpact,
    codeUsageSplit,
    overallSplit,
    siteAov,
  };

  return NextResponse.json({ data });
}
