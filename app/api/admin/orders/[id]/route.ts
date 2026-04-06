import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Order                        from '@/models/Order';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── GET — fetch single order ───────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await connectDB();
    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json<ApiResponse>({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<unknown>>({ success: true, data: order });
  } catch (err) {
    console.error('[api/admin/orders GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH — update order status ────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const newStatus = String(body.status ?? '');

  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json<ApiResponse>(
      { error: `Invalid status: "${newStatus}".` },
      { status: 422 },
    );
  }

  try {
    await connectDB();
    const order = await Order.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, select: 'orderNumber status updatedAt' },
    ).lean();

    if (!order) {
      return NextResponse.json<ApiResponse>({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<{ orderNumber: string; status: string }>>(
      { success: true, data: { orderNumber: (order as { orderNumber: string }).orderNumber, status: newStatus } },
    );
  } catch (err) {
    console.error('[api/admin/orders PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE — permanently delete order ─────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await connectDB();
    const order = await Order.findById(id).select('status payment').lean() as {
      status: string;
      payment: { status: string };
    } | null;

    if (!order) {
      return NextResponse.json<ApiResponse>({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'cancelled') {
      return NextResponse.json<ApiResponse>(
        { error: 'Only cancelled orders can be deleted.' },
        { status: 422 },
      );
    }

    if (order.payment.status === 'paid') {
      return NextResponse.json<ApiResponse>(
        { error: 'Orders with payments cannot be deleted.' },
        { status: 422 },
      );
    }

    await Order.findByIdAndDelete(id);
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[api/admin/orders DELETE]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
