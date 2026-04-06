import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import User                         from '@/models/User';
import Order                        from '@/models/Order';
import Product                      from '@/models/Product';
import AdminNote                    from '@/models/AdminNote';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';
import mongoose                     from 'mongoose';

// ── GET — full customer detail ─────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid ID.' }, { status: 400 });
  }

  try {
    await connectDB();

    const customer = await User.findById(id)
      .select('-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordTokenExpiry')
      .lean();

    if (!customer || customer.role !== 'customer') {
      return NextResponse.json<ApiResponse>({ error: 'Customer not found.' }, { status: 404 });
    }

    // ── Orders (all, sorted newest first) ──────────────────────────────────────
    const orders = await Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .select('orderNumber status items pricing payment delivery createdAt updatedAt')
      .lean();

    // ── Lifetime stats ─────────────────────────────────────────────────────────
    const paidOrders    = orders.filter((o) => o.payment.status === 'paid');
    const totalSpent    = paidOrders.reduce((s, o) => s + o.pricing.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? Math.round(totalSpent / paidOrders.length) : 0;
    const lastOrder     = orders[0] ?? null;

    // ── Behaviour analysis ─────────────────────────────────────────────────────
    const allItems = orders.flatMap((o) => o.items);

    // Fragrance categories
    const catMap = new Map<string, number>();
    for (const item of allItems) {
      const fam = item.scentFamily || 'Unknown';
      catMap.set(fam, (catMap.get(fam) ?? 0) + item.qty);
    }
    const fragranceCategories = [...catMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Preferred sizes
    const sizeMap = new Map<string, number>();
    for (const item of allItems) {
      sizeMap.set(item.size, (sizeMap.get(item.size) ?? 0) + item.qty);
    }
    const preferredSizes = [...sizeMap.entries()]
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => b.count - a.count);

    // Payment method distribution
    const pmMap  = new Map<string, number>();
    for (const o of orders) {
      pmMap.set(o.payment.method, (pmMap.get(o.payment.method) ?? 0) + 1);
    }
    const pmTotal        = orders.length;
    const paymentMethods = [...pmMap.entries()].map(([method, count]) => ({
      method,
      count,
      percentage: pmTotal > 0 ? Math.round((count / pmTotal) * 100) : 0,
    }));

    // Order frequency (avg days between orders)
    let orderFrequencyDays: number | null = null;
    if (orders.length >= 2) {
      const sorted  = [...orders].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      const gaps: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const diff = (+new Date(sorted[i].createdAt) - +new Date(sorted[i - 1].createdAt)) / 86400000;
        gaps.push(diff);
      }
      orderFrequencyDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
    }

    // Peak shopping day
    const dayCount = new Array(7).fill(0) as number[];
    for (const o of orders) {
      dayCount[new Date(o.createdAt).getDay()]++;
    }
    const peakDay       = dayCount.indexOf(Math.max(...dayCount));
    const DAYS          = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakShoppingDay = orders.length > 0 ? DAYS[peakDay] : null;

    // Promo codes
    const promoMap = new Map<string, { label?: string; totalDiscount: number }>();
    for (const o of orders) {
      if (o.pricing.couponCode) {
        const existing = promoMap.get(o.pricing.couponCode) ?? { label: o.pricing.couponLabel, totalDiscount: 0 };
        existing.totalDiscount += o.pricing.discount;
        promoMap.set(o.pricing.couponCode, existing);
      }
    }
    const promoCodes   = [...promoMap.entries()].map(([code, info]) => ({ code, label: info.label, discount: info.totalDiscount }));
    const totalDiscount = promoCodes.reduce((s, p) => s + p.discount, 0);

    const favoriteCategory = fragranceCategories[0]?.name ?? null;

    // ── Wishlist products ──────────────────────────────────────────────────────
    const wishlistIds = (customer.wishlist ?? []).slice(0, 20);
    const wishlistProducts = wishlistIds.length > 0
      ? await Product.find({ slug: { $in: wishlistIds } })
          .select('name slug images variants status')
          .lean()
      : [];

    // ── Admin notes ────────────────────────────────────────────────────────────
    const notes = await AdminNote.find({ customerId: id })
      .sort({ createdAt: -1 })
      .lean();

    // ── Derived activity log ───────────────────────────────────────────────────
    const activityLog: { id: string; type: string; label: string; actor: string; isSystem: boolean; date: string }[] = [];

    activityLog.push({
      id:       `created-${id}`,
      type:     'account_created',
      label:    'Account created',
      actor:    'System',
      isSystem: true,
      date:     (customer.createdAt as Date).toISOString(),
    });

    if (customer.isVerified) {
      activityLog.push({
        id:       `verified-${id}`,
        type:     'email_verified',
        label:    'Email verified',
        actor:    'System',
        isSystem: true,
        date:     (customer.createdAt as Date).toISOString(),
      });
    }

    for (const o of [...orders].reverse()) {
      activityLog.push({
        id:       `order-placed-${o._id}`,
        type:     'order_placed',
        label:    `Order ${o.orderNumber} placed`,
        actor:    'Customer',
        isSystem: false,
        date:     (o.createdAt as Date).toISOString(),
      });
      if (o.status === 'shipped' || o.status === 'delivered') {
        activityLog.push({
          id:       `order-shipped-${o._id}`,
          type:     'order_shipped',
          label:    `Order ${o.orderNumber} shipped`,
          actor:    'System',
          isSystem: true,
          date:     (o.updatedAt as Date).toISOString(),
        });
      }
      if (o.status === 'delivered') {
        activityLog.push({
          id:       `order-delivered-${o._id}`,
          type:     'order_delivered',
          label:    `Order ${o.orderNumber} delivered`,
          actor:    'System',
          isSystem: true,
          date:     (o.updatedAt as Date).toISOString(),
        });
      }
    }

    for (const note of [...notes].reverse()) {
      activityLog.push({
        id:       `note-${(note._id as mongoose.Types.ObjectId).toString()}`,
        type:     'note_added',
        label:    `Admin note added`,
        actor:    note.adminName,
        isSystem: false,
        date:     (note.createdAt as Date).toISOString(),
      });
    }

    if (customer.isSuspended) {
      activityLog.push({
        id:       `suspended-${id}`,
        type:     'account_suspended',
        label:    'Account suspended',
        actor:    'Admin',
        isSystem: false,
        date:     new Date().toISOString(),
      });
    }

    activityLog.sort((a, b) => +new Date(b.date) - +new Date(a.date));

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: {
        customer,
        stats: {
          totalOrders:    orders.length,
          totalSpent,
          avgOrderValue,
          wishlistCount:  customer.wishlist?.length ?? 0,
          lastOrderDate:  lastOrder ? (lastOrder.createdAt as Date).toISOString() : null,
          favoriteCategory,
        },
        behaviour: {
          fragranceCategories,
          preferredSizes,
          paymentMethods,
          orderFrequencyDays,
          peakShoppingDay,
          promoCodes,
          totalDiscount,
        },
        orders,
        wishlistProducts,
        notes,
        activityLog,
      },
    });
  } catch (err) {
    console.error('[api/admin/customers/[id] GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH — update customer (profile edit, verify, suspend, unsuspend) ─────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid ID.' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = (await req.json()) as Record<string, unknown>;
    const { action } = body;

    if (action === 'update_profile') {
      const { firstName, lastName, phone } = body as { firstName?: string; lastName?: string; phone?: string };
      const update: Record<string, string> = {};
      if (firstName) update.firstName = String(firstName).trim();
      if (lastName)  update.lastName  = String(lastName).trim();
      if (phone !== undefined) update.phone = String(phone).trim();
      const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
        .select('firstName lastName phone')
        .lean();
      return NextResponse.json<ApiResponse<unknown>>({ success: true, data: updated });
    }

    if (action === 'verify_email') {
      await User.findByIdAndUpdate(id, { $set: { isVerified: true } });
      return NextResponse.json<ApiResponse>({ success: true });
    }

    if (action === 'suspend') {
      await User.findByIdAndUpdate(id, { $set: { isSuspended: true } });
      return NextResponse.json<ApiResponse>({ success: true });
    }

    if (action === 'unsuspend') {
      await User.findByIdAndUpdate(id, { $set: { isSuspended: false } });
      return NextResponse.json<ApiResponse>({ success: true });
    }

    return NextResponse.json<ApiResponse>({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/customers/[id] PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE — delete customer (superadmin, 0 orders only) ──────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin || (admin as { role?: string }).role !== 'superadmin') {
    return NextResponse.json<ApiResponse>({ error: 'Forbidden.' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid ID.' }, { status: 400 });
  }

  try {
    await connectDB();

    const orderCount = await Order.countDocuments({ userId: id });
    if (orderCount > 0) {
      return NextResponse.json<ApiResponse>(
        { error: 'Cannot delete customer with order history.' },
        { status: 422 },
      );
    }

    await Promise.all([
      User.findByIdAndDelete(id),
      AdminNote.deleteMany({ customerId: id }),
    ]);

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[api/admin/customers/[id] DELETE]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
