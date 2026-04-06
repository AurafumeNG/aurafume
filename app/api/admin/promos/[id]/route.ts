import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Coupon                       from '@/models/Coupon';
import Order                        from '@/models/Order';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── GET — fetch single promo code ─────────────────────────────────────────────

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
    const coupon = await Coupon.findById(id).lean();

    if (!coupon) {
      return NextResponse.json<ApiResponse>({ error: 'Promo code not found.' }, { status: 404 });
    }

    // Compute revenue impact from all orders using this code
    const revenueAgg = await Order.aggregate([
      { $match: { 'pricing.couponCode': (coupon as { code: string }).code } },
      { $group: { _id: null, total: { $sum: '$pricing.discount' }, uses: { $sum: 1 } } },
    ]);
    const revenueImpact = (revenueAgg[0]?.total as number) ?? 0;

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data:    { ...coupon, revenueImpact },
    });
  } catch (err) {
    console.error('[api/admin/promos/:id GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH — update a promo code ───────────────────────────────────────────────

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

  try {
    await connectDB();

    const existing = await Coupon.findById(id).select('code status usedCount').lean() as {
      code: string; status: string; usedCount: number;
    } | null;

    if (!existing) {
      return NextResponse.json<ApiResponse>({ error: 'Promo code not found.' }, { status: 404 });
    }

    if (existing.status === 'archived') {
      return NextResponse.json<ApiResponse>({ error: 'Archived codes cannot be edited.' }, { status: 422 });
    }

    // Build update payload
    const update: Record<string, unknown> = {};

    // Code (if provided and changed)
    if (body.code !== undefined) {
      const newCode = String(body.code).toUpperCase().trim();
      if (!/^[A-Z0-9-]{1,20}$/.test(newCode)) {
        return NextResponse.json<ApiResponse>({ error: 'Invalid code format.' }, { status: 422 });
      }
      if (newCode !== existing.code) {
        const conflict = await Coupon.exists({ code: newCode, _id: { $ne: id } });
        if (conflict) {
          return NextResponse.json<ApiResponse>({ error: 'Code is already in use.' }, { status: 409 });
        }
      }
      update.code = newCode;
    }

    if (body.description !== undefined) update.description = String(body.description);
    if (body.label       !== undefined) update.label       = String(body.label);

    // Status
    const VALID_STATUSES = ['draft', 'active', 'disabled'];
    if (body.status !== undefined) {
      const newStatus = String(body.status);
      if (!VALID_STATUSES.includes(newStatus)) {
        return NextResponse.json<ApiResponse>({ error: `Invalid status: "${newStatus}".` }, { status: 422 });
      }
      update.status   = newStatus;
      update.isActive = newStatus === 'active';
    }

    // Discount type & value
    const type = body.discountType !== undefined ? String(body.discountType) : undefined;
    if (type !== undefined)                  update.type = type;
    if (body.pctValue  !== undefined && type === 'pct')  update.value = Number(body.pctValue);
    if (body.flatValue !== undefined && type === 'flat') update.value = Number(body.flatValue);
    if (body.hasPctCap !== undefined)            update.hasPctCap            = Boolean(body.hasPctCap);
    if (body.pctCap    !== undefined)            update.pctCap               = Number(body.pctCap);
    if (body.freeShippingStandard !== undefined) update.freeShippingStandard = Boolean(body.freeShippingStandard);
    if (body.freeShippingExpress  !== undefined) update.freeShippingExpress  = Boolean(body.freeShippingExpress);
    if (body.buyX         !== undefined)         update.buyX         = Number(body.buyX);
    if (body.getY         !== undefined)         update.getY         = Number(body.getY);
    if (body.getDiscount  !== undefined)         update.getDiscount  = String(body.getDiscount);
    if (body.getCustomPct !== undefined)         update.getCustomPct = Number(body.getCustomPct);
    if (body.applyTo      !== undefined)         update.applyTo      = String(body.applyTo);

    // Usage limits
    if (body.hasMaxUses !== undefined) {
      update.maxUses = body.hasMaxUses ? Number(body.maxUses ?? 100) : null;
    }
    if (body.hasPerCustomerLimit !== undefined) {
      update.perCustomerLimit = body.hasPerCustomerLimit ? Number(body.perCustomerLimit ?? 1) : null;
    }
    if (body.singleUse !== undefined) update.singleUse = Boolean(body.singleUse);

    // Validity
    if (body.validFrom !== undefined) {
      const validFromStr  = String(body.validFrom ?? '');
      const validFromTime = String(body.validFromTime ?? '00:00');
      if (validFromStr) update.validFrom = new Date(`${validFromStr}T${validFromTime}:00`);
    }
    if (body.hasExpiry !== undefined) {
      const expiresAtStr  = String(body.expiresAt  ?? '');
      const expiresAtTime = String(body.expiresAtTime ?? '23:59');
      update.expiresAt = body.hasExpiry && expiresAtStr
        ? new Date(`${expiresAtStr}T${expiresAtTime}:00`)
        : null;
    }
    if (body.autoDisableOnExpiry !== undefined) update.autoDisableOnExpiry = Boolean(body.autoDisableOnExpiry);

    // Eligibility
    if (body.hasMinOrder !== undefined) {
      update.minOrderAmount = body.hasMinOrder ? Number(body.minOrderAmount ?? 0) : 0;
    }
    if (body.hasMinItems !== undefined) {
      update.minItems = body.hasMinItems ? Number(body.minItems ?? 0) : 0;
    }
    if (body.firstOrderOnly       !== undefined) update.firstOrderOnly       = Boolean(body.firstOrderOnly);
    if (body.newCustomersOnly     !== undefined) update.newCustomersOnly     = Boolean(body.newCustomersOnly);
    if (body.newCustomerDays      !== undefined) update.newCustomerDays      = Number(body.newCustomerDays);
    if (body.hasPaymentRestriction !== undefined) update.hasPaymentRestriction = Boolean(body.hasPaymentRestriction);
    if (body.paymentRestriction   !== undefined) update.paymentRestriction   = String(body.paymentRestriction);

    if (body.specificCustomerEmails !== undefined) {
      update.specificCustomerEmails = Array.isArray(body.specificCustomerEmails)
        ? (body.specificCustomerEmails as string[]).map((e) => e.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    // Stackability
    if (body.combinableWithCodes !== undefined) update.combinableWithCodes = Boolean(body.combinableWithCodes);
    if (body.combinableWithSales !== undefined) update.combinableWithSales = Boolean(body.combinableWithSales);

    // Notifications
    if (body.hasUsageAlert   !== undefined) update.hasUsageAlert   = Boolean(body.hasUsageAlert);
    if (body.usageAlertPct   !== undefined) update.usageAlertPct   = Number(body.usageAlertPct);
    if (body.hasExpiryAlert  !== undefined) update.hasExpiryAlert  = Boolean(body.hasExpiryAlert);
    if (body.expiryAlertDays !== undefined) update.expiryAlertDays = Number(body.expiryAlertDays);
    if (body.alertEmails !== undefined) {
      const raw = String(body.alertEmails ?? '');
      update.alertEmails = raw
        ? raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json<ApiResponse>({ error: 'No fields to update.' }, { status: 400 });
    }

    const updated = await Coupon.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).lean();

    return NextResponse.json<ApiResponse<unknown>>({ success: true, data: updated });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json<ApiResponse>({ error: 'Code is already in use.' }, { status: 409 });
    }
    console.error('[api/admin/promos/:id PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
