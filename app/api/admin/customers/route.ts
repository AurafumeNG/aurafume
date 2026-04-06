import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import User                         from '@/models/User';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';
import type { PipelineStage }       from 'mongoose';

// ── GET — list customers with order stats ──────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const q         = searchParams.get('q')         ?? '';
  const status    = searchParams.get('status')    ?? '';
  const orders    = searchParams.get('orders')    ?? '';
  const spent     = searchParams.get('spent')     ?? '';
  const dateRange = searchParams.get('dateRange') ?? '';
  const dateFrom  = searchParams.get('dateFrom')  ?? '';
  const dateTo    = searchParams.get('dateTo')    ?? '';
  const location  = searchParams.get('location')  ?? '';
  const sort      = searchParams.get('sort')      ?? 'newest';
  const page      = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const pageSize  = Math.min(200, parseInt(searchParams.get('pageSize') ?? '20', 10));

  try {
    await connectDB();

    // ── Base match ─────────────────────────────────────────────────────────────
    const match: Record<string, unknown> = { role: 'customer' };

    if (q.trim()) {
      match.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName:  { $regex: q, $options: 'i' } },
        { email:     { $regex: q, $options: 'i' } },
        { phone:     { $regex: q, $options: 'i' } },
      ];
    }

    if (status === 'suspended') {
      match.isSuspended = true;
    } else if (status === 'verified') {
      match.isVerified  = true;
      match.isSuspended = { $ne: true };
    } else if (status === 'unverified') {
      match.isVerified  = false;
      match.isSuspended = { $ne: true };
    } else if (status === 'active') {
      match.isSuspended = { $ne: true };
    }

    if (location && location !== 'all') {
      match['addresses.state'] = { $regex: location, $options: 'i' };
    }

    // ── Date joined filter ─────────────────────────────────────────────────────
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateRange === 'today') {
      match.createdAt = { $gte: todayStart, $lte: todayEnd };
    } else if (dateRange === 'week') {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);
      match.createdAt = { $gte: weekStart };
    } else if (dateRange === 'month') {
      match.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (dateRange === 'custom' && dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to   = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        match.createdAt = { $gte: from, $lte: to };
      }
    }

    // ── Aggregation pipeline ───────────────────────────────────────────────────
    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from:         'orders',
          localField:   '_id',
          foreignField: 'userId',
          as:           'orderDocs',
        },
      },
      {
        $addFields: {
          totalOrders: { $size: '$orderDocs' },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orderDocs',
                    as:    'o',
                    cond:  { $eq: ['$$o.payment.status', 'paid'] },
                  },
                },
                as: 'o',
                in: '$$o.pricing.total',
              },
            },
          },
          lastOrderDate: { $max: '$orderDocs.createdAt' },
        },
      },
      { $unset: 'orderDocs' },
    ];

    // ── Post-lookup filters ────────────────────────────────────────────────────
    if (orders === 'none') {
      pipeline.push({ $match: { totalOrders: 0 } });
    } else if (orders === '1-5') {
      pipeline.push({ $match: { totalOrders: { $gte: 1, $lte: 5 } } });
    } else if (orders === '5+') {
      pipeline.push({ $match: { totalOrders: { $gt: 5 } } });
    }

    if (spent === 'under-10k') {
      pipeline.push({ $match: { totalSpent: { $lt: 10000 } } });
    } else if (spent === '10k-50k') {
      pipeline.push({ $match: { totalSpent: { $gte: 10000, $lte: 50000 } } });
    } else if (spent === '50k-100k') {
      pipeline.push({ $match: { totalSpent: { $gte: 50000, $lte: 100000 } } });
    } else if (spent === '100k+') {
      pipeline.push({ $match: { totalSpent: { $gt: 100000 } } });
    }

    // ── Sort ───────────────────────────────────────────────────────────────────
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:        { createdAt:   -1 },
      oldest:        { createdAt:    1 },
      'orders-desc': { totalOrders: -1 },
      'orders-asc':  { totalOrders:  1 },
      'spent-desc':  { totalSpent:  -1 },
      'spent-asc':   { totalSpent:   1 },
      'name-asc':    { firstName: 1, lastName: 1 },
      'name-desc':   { firstName: -1, lastName: -1 },
    };
    pipeline.push({ $sort: sortMap[sort] ?? { createdAt: -1 } });

    // ── Count (clone before skip/limit) ───────────────────────────────────────
    const countPipeline: PipelineStage[] = [...pipeline, { $count: 'total' }];

    pipeline.push(
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          _id:           1,
          firstName:     1,
          lastName:      1,
          email:         1,
          phone:         1,
          isVerified:    1,
          isSuspended:   1,
          avatar:        1,
          createdAt:     1,
          totalOrders:   1,
          totalSpent:    1,
          lastOrderDate: 1,
        },
      },
    );

    // ── Stats ──────────────────────────────────────────────────────────────────
    const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [customers, countResult, totalCustomers, newThisMonth, suspended, lastMonthNew, activeResult, avgLTVResult] =
      await Promise.all([
        User.aggregate(pipeline),
        User.aggregate(countPipeline),
        User.countDocuments({ role: 'customer' }),
        User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart } }),
        User.countDocuments({ role: 'customer', isSuspended: true }),
        User.countDocuments({ role: 'customer', createdAt: { $gte: prevMonStart, $lte: prevMonEnd } }),
        User.aggregate([
          { $match: { role: 'customer' } },
          { $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders' } },
          { $match: { 'orders.0': { $exists: true } } },
          { $count: 'total' },
        ]),
        User.aggregate([
          { $match: { role: 'customer' } },
          { $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders' } },
          {
            $addFields: {
              totalSpent: {
                $sum: {
                  $map: {
                    input: { $filter: { input: '$orders', as: 'o', cond: { $eq: ['$$o.payment.status', 'paid'] } } },
                    as:    'o',
                    in:    '$$o.pricing.total',
                  },
                },
              },
            },
          },
          { $group: { _id: null, avg: { $avg: '$totalSpent' } } },
        ]),
      ]);

    const activeCustomers = (activeResult[0]?.total as number | undefined) ?? 0;
    const avgLTV          = Math.round((avgLTVResult[0]?.avg as number | undefined) ?? 0);
    const total           = (countResult[0]?.total as number | undefined) ?? 0;

    return NextResponse.json<ApiResponse<{
      customers:    unknown[];
      total:        number;
      page:         number;
      pageSize:     number;
      stats: {
        total:            number;
        newThisMonth:     number;
        lastMonthNew:     number;
        suspended:        number;
        activeCustomers:  number;
        avgLTV:           number;
      };
    }>>({
      success: true,
      data: {
        customers,
        total,
        page,
        pageSize,
        stats: { total: totalCustomers, newThisMonth, lastMonthNew, suspended, activeCustomers, avgLTV },
      },
    });
  } catch (err) {
    console.error('[api/admin/customers GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH — suspend / unsuspend / verify ───────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = (await req.json()) as { id?: string; ids?: string[]; action: string };
    const { id, ids, action } = body;

    const targetIds = ids ?? (id ? [id] : []);
    if (!targetIds.length) {
      return NextResponse.json<ApiResponse>({ error: 'No customer IDs provided.' }, { status: 400 });
    }

    if (action === 'suspend') {
      await User.updateMany({ _id: { $in: targetIds } }, { $set: { isSuspended: true } });
    } else if (action === 'unsuspend') {
      await User.updateMany({ _id: { $in: targetIds } }, { $set: { isSuspended: false } });
    } else if (action === 'verify') {
      await User.updateMany({ _id: { $in: targetIds } }, { $set: { isVerified: true } });
    } else {
      return NextResponse.json<ApiResponse>({ error: 'Unknown action.' }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[api/admin/customers PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
