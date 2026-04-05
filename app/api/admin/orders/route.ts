import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Order                        from '@/models/Order';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── GET — list orders with stats ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const q             = searchParams.get('q')             ?? '';
  const status        = searchParams.get('status')        ?? '';
  const paymentMethod = searchParams.get('paymentMethod') ?? '';
  const paymentStatus = searchParams.get('paymentStatus') ?? '';
  const dateRange     = searchParams.get('dateRange')     ?? '';
  const dateFrom      = searchParams.get('dateFrom')      ?? '';
  const dateTo        = searchParams.get('dateTo')        ?? '';
  const amountMin     = searchParams.get('amountMin')     ?? '';
  const amountMax     = searchParams.get('amountMax')     ?? '';
  const sort          = searchParams.get('sort')          ?? 'newest';
  const page          = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const pageSize      = Math.min(200, parseInt(searchParams.get('pageSize') ?? '20', 10));
  const statsOnly     = searchParams.get('statsOnly') === 'true';

  try {
    await connectDB();

    // ── Stats (always computed against all orders) ──────────────────────────────
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalOrders,
      pendingOrders,
      pendingBankTransfers,
      todayOrders,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ 'payment.method': 'bank-transfer', 'payment.status': 'pending' }),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
    ]);

    const totalRevenue: number = revenueResult[0]?.total ?? 0;

    if (statsOnly) {
      return NextResponse.json<ApiResponse<{
        totalOrders: number;
        pendingOrders: number;
        pendingBankTransfers: number;
        todayOrders: number;
        totalRevenue: number;
      }>>({
        success: true,
        data: { totalOrders, pendingOrders, pendingBankTransfers, todayOrders, totalRevenue },
      });
    }

    // ── Build filter ────────────────────────────────────────────────────────────
    const filter: Record<string, unknown> = {};

    if (q.trim()) {
      filter.$or = [
        { orderNumber:       { $regex: q, $options: 'i' } },
        { 'contact.firstName': { $regex: q, $options: 'i' } },
        { 'contact.lastName':  { $regex: q, $options: 'i' } },
        { 'contact.email':     { $regex: q, $options: 'i' } },
      ];
    }

    const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    const VALID_METHODS = ['bank-transfer', 'paystack'];
    if (VALID_METHODS.includes(paymentMethod)) {
      filter['payment.method'] = paymentMethod;
    }

    const VALID_PAY_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
    if (VALID_PAY_STATUSES.includes(paymentStatus)) {
      filter['payment.status'] = paymentStatus;
    }

    // Date range filter
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    if (dateRange === 'today') {
      filter.createdAt = { $gte: todayStart, $lte: end };
    } else if (dateRange === 'week') {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);
      filter.createdAt = { $gte: weekStart };
    } else if (dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.createdAt = { $gte: monthStart };
    } else if (dateRange === 'custom' && dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to   = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        filter.createdAt = { $gte: from, $lte: to };
      }
    }

    // Amount range filter
    const minNum = amountMin !== '' ? Number(amountMin) : NaN;
    const maxNum = amountMax !== '' ? Number(amountMax) : NaN;
    if (!isNaN(minNum) || !isNaN(maxNum)) {
      const amountFilter: Record<string, number> = {};
      if (!isNaN(minNum)) amountFilter.$gte = minNum;
      if (!isNaN(maxNum)) amountFilter.$lte = maxNum;
      filter['pricing.total'] = amountFilter;
    }

    // ── Sort ────────────────────────────────────────────────────────────────────
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:       { createdAt: -1 },
      oldest:       { createdAt:  1 },
      'amount-desc': { 'pricing.total': -1 },
      'amount-asc':  { 'pricing.total':  1 },
      'name-asc':    { 'contact.firstName': 1 },
    };
    const sortQuery = sortMap[sort] ?? { createdAt: -1 };

    // ── Query ───────────────────────────────────────────────────────────────────
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sortQuery)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('orderNumber contact pricing delivery payment status items createdAt updatedAt')
        .lean(),
      Order.countDocuments(filter),
    ]);

    // ── Status counts for tab badges ────────────────────────────────────────────
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const s of statusCounts) counts[s._id as string] = s.count as number;

    return NextResponse.json<ApiResponse<{
      orders:      unknown[];
      total:       number;
      page:        number;
      pageSize:    number;
      statusCounts: Record<string, number>;
      stats: {
        totalOrders:         number;
        pendingOrders:       number;
        pendingBankTransfers: number;
        todayOrders:         number;
        totalRevenue:        number;
      };
    }>>({
      success: true,
      data: {
        orders,
        total,
        page,
        pageSize,
        statusCounts: counts,
        stats: { totalOrders, pendingOrders, pendingBankTransfers, todayOrders, totalRevenue },
      },
    });
  } catch (err) {
    console.error('[api/admin/orders GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
