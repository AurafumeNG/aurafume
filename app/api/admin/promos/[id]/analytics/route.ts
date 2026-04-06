import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Coupon                       from '@/models/Coupon';
import Order                        from '@/models/Order';
import User                         from '@/models/User';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── GET /api/admin/promos/[id]/analytics ─────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const window  = searchParams.get('window')  ?? '30';   // '7' | '30' | 'all'
  const metric  = searchParams.get('metric')  ?? 'uses'; // 'uses' | 'discount' | 'revenue'
  const ordersPage  = Math.max(1, parseInt(searchParams.get('ordersPage')  ?? '1', 10));
  const customersPage = Math.max(1, parseInt(searchParams.get('customersPage') ?? '1', 10));
  const pageSize    = 10;

  try {
    await connectDB();

    // ── Load code ───────────────────────────────────────────────────────────────
    const coupon = await Coupon.findById(id).lean() as Record<string, unknown> | null;
    if (!coupon) {
      return NextResponse.json<ApiResponse>({ error: 'Promo code not found.' }, { status: 404 });
    }

    const code = String(coupon.code ?? '');

    // ── Date window ─────────────────────────────────────────────────────────────
    const now      = new Date();
    const windowDays = window === 'all' ? null : parseInt(window, 10);
    const windowStart = windowDays
      ? new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)
      : null;

    const windowFilter: Record<string, unknown> = windowStart
      ? { createdAt: { $gte: windowStart } }
      : {};

    // ── All orders using this code ───────────────────────────────────────────────
    const allOrdersFilter = { 'pricing.couponCode': code, ...windowFilter };

    const [
      allOrdersDocs,
      kpiAgg,
      prevWindowAgg,
      topProductsAgg,
      customerSegmentsAgg,
      usageTimelineAgg,
    ] = await Promise.all([
      // Paginated orders list
      Order.find({ 'pricing.couponCode': code })
        .sort({ createdAt: -1 })
        .skip((ordersPage - 1) * pageSize)
        .limit(pageSize)
        .select('orderNumber contact pricing delivery payment status createdAt')
        .lean(),

      // KPI aggregation for current window
      Order.aggregate([
        { $match: allOrdersFilter },
        {
          $group: {
            _id:           null,
            totalUses:     { $sum: 1 },
            totalDiscount: { $sum: '$pricing.discount' },
            totalRevenue:  { $sum: '$pricing.total' },
            uniqueUsers:   { $addToSet: '$contact.email' },
            completed:     {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
            },
          },
        },
      ]),

      // Previous window for trend (uses count)
      Order.aggregate([
        {
          $match: {
            'pricing.couponCode': code,
            ...(windowDays
              ? { createdAt: { $gte: new Date(now.getTime() - windowDays * 2 * 24 * 60 * 60 * 1000), $lt: windowStart ?? now } }
              : {}),
          },
        },
        { $group: { _id: null, uses: { $sum: 1 }, discount: { $sum: '$pricing.discount' }, revenue: { $sum: '$pricing.total' } } },
      ]),

      // Top 5 products
      Order.aggregate([
        { $match: { 'pricing.couponCode': code } },
        { $unwind: '$items' },
        {
          $group: {
            _id:      '$items.productId',
            name:     { $first: '$items.name' },
            image:    { $first: '$items.image' },
            slug:     { $first: '$items.slug' },
            size:     { $first: '$items.size' },
            count:    { $sum: '$items.qty' },
            revenue:  { $sum: { $multiply: ['$items.pricePerUnit', '$items.qty'] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Customer segments
      Order.aggregate([
        { $match: { 'pricing.couponCode': code } },
        {
          $group: {
            _id:            '$contact.email',
            paymentMethods: { $push: '$payment.method' },
            isFirstOrder:   { $first: '$contact.email' },
          },
        },
      ]),

      // Usage timeline
      Order.aggregate([
        { $match: allOrdersFilter },
        {
          $group: {
            _id:      {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            uses:     { $sum: 1 },
            discount: { $sum: '$pricing.discount' },
            revenue:  { $sum: '$pricing.total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // ── Total orders count for pagination ───────────────────────────────────────
    const totalOrdersCount = await Order.countDocuments({ 'pricing.couponCode': code });

    // ── KPI values ──────────────────────────────────────────────────────────────
    const kpi = kpiAgg[0] ?? { totalUses: 0, totalDiscount: 0, totalRevenue: 0, uniqueUsers: [], completed: 0 };
    const prev = prevWindowAgg[0] ?? { uses: 0, discount: 0, revenue: 0 };

    const totalUses    = (kpi.totalUses    as number) ?? 0;
    const totalDiscount = (kpi.totalDiscount as number) ?? 0;
    const totalRevenue  = (kpi.totalRevenue  as number) ?? 0;
    const uniqueCustomers = ((kpi.uniqueUsers as string[]) ?? []).length;
    const completedOrders = (kpi.completed as number) ?? 0;
    const avgOrderValue   = totalUses > 0 ? totalRevenue / totalUses : 0;
    const conversionRate  = totalUses > 0 ? Math.round((completedOrders / totalUses) * 100) : 0;

    const prevUses    = (prev.uses    as number) ?? 0;
    const usesTrend   = totalUses - prevUses;

    // ── Customer segment breakdown ───────────────────────────────────────────────
    const emailSet = (customerSegmentsAgg as { _id: string; paymentMethods: string[] }[])
      .map((r) => r._id);

    // Parallel: check which customers placed orders before this code
    const [newCustomerCount, verifiedCount, paystackCount, bankCount] = await Promise.all([
      // "New" = email had no orders before the first code use date
      (async () => {
        if (emailSet.length === 0) return 0;
        // Approximate: customers whose first-ever order used this code
        const firstOrders = await Order.aggregate([
          { $match: { 'contact.email': { $in: emailSet } } },
          { $sort: { createdAt: 1 } },
          { $group: { _id: '$contact.email', firstOrder: { $first: '$$ROOT' } } },
          { $match: { 'firstOrder.pricing.couponCode': code } },
          { $count: 'count' },
        ]);
        return (firstOrders[0]?.count as number) ?? 0;
      })(),
      // Verified users
      (async () => {
        if (emailSet.length === 0) return 0;
        return User.countDocuments({ email: { $in: emailSet }, isVerified: true });
      })(),
      // Paystack
      Order.countDocuments({ 'pricing.couponCode': code, 'payment.method': 'paystack' }),
      // Bank transfer
      Order.countDocuments({ 'pricing.couponCode': code, 'payment.method': 'bank-transfer' }),
    ]);

    const returningCustomers   = uniqueCustomers - newCustomerCount;
    const unverifiedCount      = uniqueCustomers - verifiedCount;
    const paystackPct          = uniqueCustomers > 0 ? Math.round((paystackCount  / totalUses) * 100) : 0;
    const bankPct              = uniqueCustomers > 0 ? Math.round((bankCount / totalUses) * 100) : 0;
    const newPct               = uniqueCustomers > 0 ? Math.round((newCustomerCount / uniqueCustomers) * 100) : 0;
    const verifiedPct          = uniqueCustomers > 0 ? Math.round((verifiedCount    / uniqueCustomers) * 100) : 0;

    // ── Timeline — fill gaps ────────────────────────────────────────────────────
    type TimelineRow = { date: string; uses: number; discount: number; revenue: number };
    const timelineRaw = (usageTimelineAgg as { _id: string; uses: number; discount: number; revenue: number }[])
      .map((r) => ({ date: r._id, uses: r.uses, discount: r.discount, revenue: r.revenue }));

    // Peak day
    const peakDay = timelineRaw.reduce<TimelineRow | null>((best, r) => {
      const val = metric === 'uses' ? r.uses : metric === 'discount' ? r.discount : r.revenue;
      const bestVal = best ? (metric === 'uses' ? best.uses : metric === 'discount' ? best.discount : best.revenue) : -1;
      return val > bestVal ? r : best;
    }, null);

    const daysWithData = timelineRaw.length;
    const avgDailyUses = daysWithData > 0 ? (totalUses / daysWithData).toFixed(1) : '0';

    // ── Customers list (paginated) ───────────────────────────────────────────────
    const customersTotal = uniqueCustomers;
    const customersAgg   = await Order.aggregate([
      { $match: { 'pricing.couponCode': code } },
      { $sort:  { createdAt: -1 } },
      {
        $group: {
          _id:          '$contact.email',
          firstName:    { $first: '$contact.firstName' },
          lastName:     { $first: '$contact.lastName'  },
          email:        { $first: '$contact.email'     },
          dateUsed:     { $first: '$createdAt'         },
          orderAmount:  { $first: '$pricing.total'     },
          discountReceived: { $first: '$pricing.discount' },
          userId:       { $first: '$userId'            },
        },
      },
      { $sort:  { dateUsed: -1 } },
      { $skip:  (customersPage - 1) * pageSize },
      { $limit: pageSize },
    ]);

    // ── Failed applications (approximated via a log model — placeholder array) ──
    // Real implementation would query a PromoApplicationLog model.
    // We return an empty array so the UI renders cleanly until the log is wired up.
    const failedApplications: unknown[] = [];

    // ── Activity log ────────────────────────────────────────────────────────────
    // Built from coupon document timestamps + status history.
    // A full audit trail would come from a dedicated AuditLog model.
    // We synthesise the key events from the coupon fields.
    const activityLog = buildActivityLog(coupon);

    // ── Shape orders list ───────────────────────────────────────────────────────
    const ordersList = (allOrdersDocs as unknown[]).map((o) => {
      const order = o as Record<string, unknown>;
      return {
        _id:          order._id,
        orderNumber:  order.orderNumber,
        contact:      order.contact,
        orderTotal:   (order.pricing as Record<string, number>).total + (order.pricing as Record<string, number>).discount,
        discountApplied: (order.pricing as Record<string, number>).discount,
        finalAmount:  (order.pricing as Record<string, number>).total,
        date:         order.createdAt,
        status:       order.status,
        paymentStatus: (order.payment as Record<string, unknown>).status,
      };
    });

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: {
        coupon,
        kpi: {
          totalUses,
          totalDiscount,
          totalRevenue,
          avgOrderValue,
          conversionRate,
          uniqueCustomers,
          usesTrend,
          prevUses,
        },
        timeline: timelineRaw,
        peakDay:  peakDay ? { date: peakDay.date, uses: peakDay.uses, discount: peakDay.discount, revenue: peakDay.revenue } : null,
        avgDailyUses,
        segments: {
          newCustomers:       newCustomerCount,
          returningCustomers,
          verifiedCustomers:  verifiedCount,
          unverifiedCustomers: unverifiedCount,
          paystackOrders:     paystackCount,
          bankTransferOrders: bankCount,
          newPct,
          verifiedPct,
          paystackPct,
          bankPct,
          total:              uniqueCustomers,
          totalOrders:        totalUses,
        },
        topProducts: topProductsAgg,
        orders: {
          list:  ordersList,
          total: totalOrdersCount,
          page:  ordersPage,
          pageSize,
        },
        customers: {
          list:  customersAgg,
          total: customersTotal,
          page:  customersPage,
          pageSize,
        },
        failedApplications,
        activityLog,
      },
    });
  } catch (err) {
    console.error('[api/admin/promos/:id/analytics GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── Synthetic activity log from coupon document ────────────────────────────────

function buildActivityLog(coupon: Record<string, unknown>): {
  id: string; label: string; actor: string; isSystem: boolean; date: string;
}[] {
  const events: { id: string; label: string; actor: string; isSystem: boolean; date: string }[] = [];
  const created = String(coupon.createdAt ?? '');
  const updated = String(coupon.updatedAt ?? '');
  const status  = String(coupon.status ?? '');

  if (created) {
    events.push({
      id:       'created',
      label:    `Code created`,
      actor:    'Admin',
      isSystem: false,
      date:     created,
    });
  }

  if (status === 'active') {
    events.push({
      id:       'activated',
      label:    'Code activated',
      actor:    'Admin',
      isSystem: false,
      date:     updated || created,
    });
  }

  if (status === 'disabled') {
    events.push({
      id:       'disabled',
      label:    'Code disabled',
      actor:    'Admin',
      isSystem: false,
      date:     updated || created,
    });
  }

  if (status === 'archived') {
    events.push({
      id:       'archived',
      label:    'Code archived',
      actor:    'Admin',
      isSystem: false,
      date:     updated || created,
    });
  }

  const expiresAt = coupon.expiresAt ? new Date(String(coupon.expiresAt)) : null;
  if (expiresAt && expiresAt < new Date()) {
    events.push({
      id:       'expired',
      label:    'Code auto-expired',
      actor:    'System',
      isSystem: true,
      date:     String(coupon.expiresAt),
    });
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
