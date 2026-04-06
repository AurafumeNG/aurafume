import { NextResponse }   from 'next/server';
import connectDB          from '@/lib/mongodb';
import Order              from '@/models/Order';
import { requireAdmin }   from '@/lib/admin-auth';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/bank-transfers ─────────────────────────────────────────────
// Returns all bank-transfer orders shaped for the admin verification UI,
// plus aggregate stats.

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all bank-transfer orders (no pagination — typically a small set)
    const [orders, statsAgg] = await Promise.all([
      Order.find({ 'payment.method': 'bank-transfer' })
        .sort({ createdAt: 1 })   // oldest first by default (most urgent)
        .select('orderNumber contact pricing payment createdAt')
        .lean(),

      Order.aggregate([
        { $match: { 'payment.method': 'bank-transfer' } },
        {
          $facet: {
            pendingCount: [
              { $match: { 'payment.status': 'pending' } },
              { $count: 'n' },
            ],
            verifiedToday: [
              { $match: { 'payment.status': 'paid', 'payment.verifiedAt': { $gte: todayStart, $lte: todayEnd } } },
              { $count: 'n' },
            ],
            rejectedToday: [
              { $match: { 'payment.status': 'failed', 'payment.rejectedAt': { $gte: todayStart, $lte: todayEnd } } },
              { $count: 'n' },
            ],
            totalPendingAmount: [
              { $match: { 'payment.status': 'pending' } },
              { $group: { _id: null, sum: { $sum: '$pricing.total' } } },
            ],
            totalVerifiedMonth: [
              { $match: { 'payment.status': 'paid', 'payment.verifiedAt': { $gte: monthStart } } },
              { $group: { _id: null, sum: { $sum: '$pricing.total' } } },
            ],
          },
        },
      ]),
    ]);

    const agg = statsAgg[0] as {
      pendingCount:       { n: number }[];
      verifiedToday:      { n: number }[];
      rejectedToday:      { n: number }[];
      totalPendingAmount: { sum: number }[];
      totalVerifiedMonth: { sum: number }[];
    };

    const stats = {
      pendingCount:       agg.pendingCount[0]?.n       ?? 0,
      verifiedToday:      agg.verifiedToday[0]?.n      ?? 0,
      rejectedToday:      agg.rejectedToday[0]?.n      ?? 0,
      totalPendingAmount: agg.totalPendingAmount[0]?.sum ?? 0,
      totalVerifiedMonth: agg.totalVerifiedMonth[0]?.sum ?? 0,
    };

    // Shape orders into the BankTransfer format the UI expects
    const transfers = orders.map((o) => {
      type RawOrder = typeof o & {
        _id: { toString(): string };
        contact: { firstName: string; lastName: string; email: string; phone: string };
        payment: {
          status:          string;
          proofUrl?:       string;
          verifiedAt?:     Date;
          rejectedAt?:     Date;
          actionedBy?:     string;
          rejectionReason?: string;
        };
        pricing:   { total: number };
        createdAt: Date;
      };

      const raw          = o as RawOrder;
      const firstName    = raw.contact.firstName;
      const lastName     = raw.contact.lastName;
      const fullName     = `${firstName} ${lastName}`;
      const initials     = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      const payStatus    = raw.payment.status;
      const placedAt     = raw.createdAt;
      const minutesElapsed = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60_000);

      // Map payment.status → transfer status
      const status =
        payStatus === 'paid'   ? 'verified' :
        payStatus === 'failed' ? 'rejected' :
        'pending';

      return {
        _id:             raw._id.toString(),
        orderNumber:     (o as { orderNumber: string }).orderNumber,
        customer:        { name: fullName, email: raw.contact.email, phone: raw.contact.phone, initials },
        amount:          raw.pricing.total,
        reference:       (o as { orderNumber: string }).orderNumber, // order number IS the transfer reference
        placedAt:        new Date(placedAt).toISOString(),
        proofUrl:        raw.payment.proofUrl,
        status,
        verifiedAt:      raw.payment.verifiedAt  ? new Date(raw.payment.verifiedAt).toISOString()  : undefined,
        rejectedAt:      raw.payment.rejectedAt  ? new Date(raw.payment.rejectedAt).toISOString()  : undefined,
        actionedBy:      raw.payment.actionedBy,
        rejectionReason: raw.payment.rejectionReason,
        minutesElapsed,
      };
    });

    return NextResponse.json<ApiResponse<{ transfers: unknown[]; stats: typeof stats }>>({
      success: true,
      data:    { transfers, stats },
    });
  } catch (err) {
    console.error('[GET /api/admin/bank-transfers]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
