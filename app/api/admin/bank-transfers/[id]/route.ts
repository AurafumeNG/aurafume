import { NextRequest, NextResponse }  from 'next/server';
import connectDB                      from '@/lib/mongodb';
import Order                          from '@/models/Order';
import User                           from '@/models/User';
import TransferNote                   from '@/models/TransferNote';
import { requireAdmin }               from '@/lib/admin-auth';
import type { ApiResponse }           from '@/types/auth';
import mongoose                       from 'mongoose';

// ── GET /api/admin/bank-transfers/[id] ────────────────────────────────────────
// Returns full order + customer stats + admin notes for the detail page.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid ID.' }, { status: 400 });
  }

  try {
    await connectDB();

    const order = await Order.findOne({
      _id:              id,
      'payment.method': 'bank-transfer',
    })
      .select('-__v')
      .lean();

    if (!order) {
      return NextResponse.json<ApiResponse>({ error: 'Transfer not found.' }, { status: 404 });
    }

    const typedOrder = order as unknown as {
      _id:    { toString(): string };
      userId?: { toString(): string };
      contact: { email: string };
    };

    // Customer stats — query by userId if logged-in order, else by email
    const customerFilter = typedOrder.userId
      ? { userId: typedOrder.userId }
      : { 'contact.email': typedOrder.contact.email };

    const [customerOrders, customerSpend, notes] = await Promise.all([
      Order.countDocuments(customerFilter),
      Order.aggregate([
        { $match: { ...customerFilter, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      TransferNote.find({ orderId: id }).sort({ createdAt: 1 }).lean(),
    ]);

    // Fetch customer profile if userId exists
    let customerProfile = null;
    if (typedOrder.userId) {
      customerProfile = await User
        .findById(typedOrder.userId)
        .select('firstName lastName email phone isVerified isSuspended avatar createdAt')
        .lean();
    }

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: {
        order,
        customerStats: {
          totalOrders: customerOrders,
          totalSpent:  customerSpend[0]?.total ?? 0,
        },
        customerProfile,
        notes: notes.map((n) => ({
          _id:       (n._id as { toString(): string }).toString(),
          adminId:   (n.adminId as { toString(): string }).toString(),
          adminName: n.adminName,
          content:   n.content,
          createdAt: n.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/bank-transfers/[id]]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/bank-transfers/[id] ──────────────────────────────────────
// Body: { action: 'verify' | 'reject', rejectionReason?: string, customerNote?: string }
// verify → payment.status = 'paid',   sets verifiedAt + actionedBy
// reject → payment.status = 'failed', sets rejectedAt + actionedBy + rejectionReason

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { action?: string; rejectionReason?: string; customerNote?: string };
  try {
    body = (await req.json()) as { action?: string; rejectionReason?: string; customerNote?: string };
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { action, rejectionReason, customerNote } = body;

  if (action !== 'verify' && action !== 'reject') {
    return NextResponse.json<ApiResponse>(
      { error: 'action must be "verify" or "reject".' },
      { status: 422 },
    );
  }

  if (action === 'reject' && !rejectionReason?.trim()) {
    return NextResponse.json<ApiResponse>(
      { error: 'rejectionReason is required when rejecting.' },
      { status: 422 },
    );
  }

  try {
    await connectDB();

    const adminUser = await User.findById(admin.userId).select('firstName lastName').lean() as
      { firstName: string; lastName: string } | null;
    const actionedBy = adminUser
      ? `${adminUser.firstName} ${adminUser.lastName}`
      : admin.email;

    const now    = new Date();
    const update =
      action === 'verify'
        ? {
            'payment.status':     'paid',
            'payment.paidAt':     now,
            'payment.verifiedAt': now,
            'payment.actionedBy': actionedBy,
            status:               'confirmed',
          }
        : {
            'payment.status':          'failed',
            'payment.rejectedAt':      now,
            'payment.actionedBy':      actionedBy,
            'payment.rejectionReason': rejectionReason!.trim(),
            status:                    'cancelled',
          };

    const order = await Order.findOneAndUpdate(
      { _id: id, 'payment.method': 'bank-transfer', 'payment.status': 'pending' },
      { $set: update },
      { new: true, select: 'orderNumber payment.status status' },
    ).lean();

    if (!order) {
      return NextResponse.json<ApiResponse>(
        { error: 'Transfer not found or already actioned.' },
        { status: 404 },
      );
    }

    // Save optional customer-facing note as an internal admin note
    if (customerNote?.trim()) {
      await TransferNote.create({
        orderId:   id,
        adminId:   admin.userId,
        adminName: actionedBy,
        content:   `[${action === 'verify' ? 'Confirmation' : 'Rejection'} note] ${customerNote.trim()}`,
      });
    }

    return NextResponse.json<ApiResponse<{ orderNumber: string; action: string }>>({
      success: true,
      data:    { orderNumber: (order as { orderNumber: string }).orderNumber, action },
    });
  } catch (err) {
    console.error('[PATCH /api/admin/bank-transfers/[id]]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
