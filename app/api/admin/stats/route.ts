import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/auth';

export interface AdminStats {
  totalOrders:           number;
  pendingOrders:         number;
  pendingBankTransfers:  number;
  totalRevenue:          number;
  totalCustomers:        number;
  revenueToday:          number;
  ordersToday:           number;
}

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('aura-admin-auth')?.value;

  if (!token) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
    return NextResponse.json<ApiResponse>({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      pendingBankTransfers,
      totalCustomers,
      ordersToday,
      revenueAgg,
      revenueTodayAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ 'payment.method': 'bank-transfer', 'payment.status': 'pending' }),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amountPaid' } } },
      ]),
      Order.aggregate([
        { $match: { 'payment.status': 'paid', createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$payment.amountPaid' } } },
      ]),
    ]);

    const stats: AdminStats = {
      totalOrders,
      pendingOrders,
      pendingBankTransfers,
      totalCustomers,
      ordersToday,
      totalRevenue:   revenueAgg[0]?.total        ?? 0,
      revenueToday:   revenueTodayAgg[0]?.total   ?? 0,
    };

    return NextResponse.json<ApiResponse<AdminStats>>({ success: true, data: stats });
  } catch (err) {
    console.error('[api/admin/stats]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
