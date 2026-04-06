import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Coupon                       from '@/models/Coupon';
import Order                        from '@/models/Order';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Derive the effective status, auto-expiring codes past their expiresAt date. */
function effectiveStatus(doc: {
  status:    string;
  validFrom: Date;
  expiresAt: Date | null;
}): string {
  const now = new Date();
  if (doc.status === 'archived') return 'archived';
  if (doc.expiresAt && doc.expiresAt < now) return 'expired';
  if (doc.validFrom > now && doc.status !== 'draft') return 'scheduled';
  return doc.status;
}

/** Build a label describing the discount value. */
function discountLabel(doc: {
  type:  string;
  value: number;
  buyX:  number;
  getY:  number;
}): string {
  if (doc.type === 'pct')           return `${doc.value}%`;
  if (doc.type === 'flat')          return `₦${doc.value.toLocaleString('en-NG')} off`;
  if (doc.type === 'free-shipping') return 'Free Shipping';
  return `Buy ${doc.buyX} Get ${doc.getY}`;
}

// ── GET — list promo codes with stats ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const q           = (searchParams.get('q')           ?? '').trim();
  const status      = searchParams.get('status')        ?? '';
  const type        = searchParams.get('type')          ?? '';
  const eligibility = searchParams.get('eligibility')   ?? '';
  const usage       = searchParams.get('usage')         ?? '';
  const expiry      = searchParams.get('expiry')        ?? '';
  const sort        = searchParams.get('sort')          ?? 'newest';
  const page        = Math.max(1, parseInt(searchParams.get('page')     ?? '1',  10));
  const pageSize    = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20', 10));

  try {
    await connectDB();

    const now         = new Date();
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekFromNow = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ── Stats (always computed against all non-archived codes) ─────────────────
    const [
      statsTotal,
      statsActive,
      statsExpired,
      statsScheduled,
      monthlyOrderAgg,
      topCodeAgg,
    ] = await Promise.all([
      Coupon.countDocuments({ status: { $ne: 'archived' } }),
      Coupon.countDocuments({ status: 'active', $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }], validFrom: { $lte: now } }),
      Coupon.countDocuments({ $or: [{ status: 'expired' }, { expiresAt: { $lt: now }, status: { $ne: 'archived' } }] }),
      Coupon.countDocuments({ status: 'active', validFrom: { $gt: now } }),
      // Monthly usage & discount impact from orders
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart },
            'pricing.couponCode': { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id:           null,
            totalUses:     { $sum: 1 },
            totalDiscount: { $sum: '$pricing.discount' },
          },
        },
      ]),
      // Top performing code this month
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart },
            'pricing.couponCode': { $exists: true, $ne: '' },
          },
        },
        { $group: { _id: '$pricing.couponCode', uses: { $sum: 1 } } },
        { $sort: { uses: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const stats = {
      total:               statsTotal,
      active:              statsActive,
      expired:             statsExpired,
      scheduled:           statsScheduled,
      totalUsesThisMonth:  (monthlyOrderAgg[0]?.totalUses     as number) ?? 0,
      discountThisMonth:   (monthlyOrderAgg[0]?.totalDiscount as number) ?? 0,
      topCode:             (topCodeAgg[0]?._id as string)                ?? '—',
    };

    // ── Build filter ────────────────────────────────────────────────────────────
    const filter: Record<string, unknown> = { status: { $ne: 'archived' } };

    if (q) {
      filter.$or = [
        { code:        { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { label:       { $regex: q, $options: 'i' } },
      ];
    }

    // Status filter — map UI status to DB query
    const VALID_STATUSES = ['draft', 'active', 'scheduled', 'disabled', 'archived'];
    if (VALID_STATUSES.includes(status)) {
      if (status === 'expired') {
        filter.expiresAt = { $lt: now };
        (filter as Record<string, unknown>).status = { $ne: 'archived' };
      } else if (status === 'scheduled') {
        filter.status   = 'active';
        filter.validFrom = { $gt: now };
      } else if (status === 'active') {
        filter.status    = 'active';
        filter.validFrom = { $lte: now };
        filter.$or = [
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ];
      } else {
        filter.status = status;
      }
    }

    // Type filter
    const VALID_TYPES = ['pct', 'flat', 'free-shipping', 'buy-x-get-y'];
    if (VALID_TYPES.includes(type)) {
      filter.type = type;
    }

    // Eligibility filter
    if (eligibility === 'first-order') {
      filter.firstOrderOnly = true;
    } else if (eligibility === 'specific') {
      filter['specificCustomerEmails.0'] = { $exists: true };
    } else if (eligibility === 'min-spend') {
      filter.minOrderAmount = { $gt: 0 };
    }

    // Usage filter
    if (usage === 'unused') {
      filter.usedCount = 0;
    } else if (usage === 'full') {
      filter.$expr = { $and: [{ $ne: ['$maxUses', null] }, { $gte: ['$usedCount', '$maxUses'] }] };
    } else if (usage === 'partial') {
      filter.usedCount = { $gt: 0 };
      filter.$expr = { $or: [{ $eq: ['$maxUses', null] }, { $lt: ['$usedCount', '$maxUses'] }] };
    }

    // Expiry filter
    if (expiry === 'this-week') {
      filter.expiresAt = { $gte: now, $lte: weekFromNow };
    } else if (expiry === 'this-month') {
      filter.expiresAt = { $gte: now, $lte: monthFromNow };
    } else if (expiry === 'no-expiry') {
      filter.expiresAt = null;
    }

    // ── Sort ────────────────────────────────────────────────────────────────────
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      'newest':         { createdAt: -1  },
      'oldest':         { createdAt:  1  },
      'most-used':      { usedCount: -1  },
      'least-used':     { usedCount:  1  },
      'expiry-soonest': { expiresAt:  1  },
      'expiry-latest':  { expiresAt: -1  },
      'discount-desc':  { value:     -1  },
      'discount-asc':   { value:      1  },
    };
    const sortQuery = sortMap[sort] ?? { createdAt: -1 };

    // ── Query ───────────────────────────────────────────────────────────────────
    const [codes, total] = await Promise.all([
      Coupon.find(filter)
        .sort(sortQuery)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    // Compute revenue impact per code from orders (batch)
    const codeCodes = codes.map((c) => (c as { code: string }).code);
    const revenueAgg = await Order.aggregate([
      { $match: { 'pricing.couponCode': { $in: codeCodes } } },
      { $group: { _id: '$pricing.couponCode', total: { $sum: '$pricing.discount' } } },
    ]);
    const revenueMap: Record<string, number> = {};
    for (const row of revenueAgg) revenueMap[row._id as string] = row.total as number;

    // Shape the response — enrich each code with derived fields
    const shaped = codes.map((c) => {
      const doc = c as unknown as {
        _id: unknown; code: string; status: string; validFrom: Date; expiresAt: Date | null;
        type: string; value: number; buyX: number; getY: number;
        usedCount: number; maxUses: number | null;
        [key: string]: unknown;
      };
      return {
        ...doc,
        status:        effectiveStatus(doc),
        label:         doc.label || discountLabel(doc),
        revenueImpact: revenueMap[doc.code] ?? 0,
      };
    });

    return NextResponse.json<ApiResponse<{
      codes:    unknown[];
      total:    number;
      page:     number;
      pageSize: number;
      stats: typeof stats;
    }>>({
      success: true,
      data: { codes: shaped, total, page, pageSize, stats },
    });
  } catch (err) {
    console.error('[api/admin/promos GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── POST — create a promo code ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const code = String(body.code ?? '').toUpperCase().trim();
  if (!code) {
    return NextResponse.json<ApiResponse>({ error: 'Code is required.' }, { status: 422 });
  }
  if (!/^[A-Z0-9-]{1,20}$/.test(code)) {
    return NextResponse.json<ApiResponse>({ error: 'Code may only contain uppercase letters, numbers, and hyphens (max 20 characters).' }, { status: 422 });
  }

  const VALID_TYPES    = ['pct', 'flat', 'free-shipping', 'buy-x-get-y'];
  const VALID_STATUSES = ['draft', 'active'];

  const type   = String(body.discountType ?? body.type ?? 'pct');
  const status = String(body.status ?? 'draft');

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json<ApiResponse>({ error: `Invalid discount type: "${type}".` }, { status: 422 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json<ApiResponse>({ error: `Invalid status: "${status}".` }, { status: 422 });
  }

  // Parse validFrom
  const validFromStr = String(body.validFrom ?? '');
  const validFromTime = String(body.validFromTime ?? '00:00');
  const validFrom = validFromStr
    ? new Date(`${validFromStr}T${validFromTime}:00`)
    : new Date();

  // Parse expiresAt
  const hasExpiry = Boolean(body.hasExpiry);
  const expiresAtStr  = String(body.expiresAt  ?? '');
  const expiresAtTime = String(body.expiresAtTime ?? '23:59');
  const expiresAt = hasExpiry && expiresAtStr
    ? new Date(`${expiresAtStr}T${expiresAtTime}:00`)
    : null;

  // Determine effective status
  const now = new Date();
  let effectiveStatusValue = status;
  if (status === 'active' && validFrom > now) {
    effectiveStatusValue = 'active'; // will be 'scheduled' visually via validFrom
  }

  // Alert emails — parse comma-separated string
  const alertEmailsRaw = String(body.alertEmails ?? '');
  const alertEmails = alertEmailsRaw
    ? alertEmailsRaw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  // Specific customer emails — already an array from the form
  const specificCustomerEmails = Array.isArray(body.specificCustomerEmails)
    ? (body.specificCustomerEmails as string[]).map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  try {
    await connectDB();

    // Check uniqueness
    const existing = await Coupon.exists({ code });
    if (existing) {
      return NextResponse.json<ApiResponse>({ error: 'A promo code with this code already exists.' }, { status: 409 });
    }

    const coupon = await Coupon.create({
      code,
      description: String(body.description ?? ''),
      label:       String(body.label       ?? ''),
      status:      effectiveStatusValue,
      isActive:    effectiveStatusValue === 'active',

      // Discount
      type,
      value:                type === 'pct'  ? Number(body.pctValue  ?? 0)
                          : type === 'flat' ? Number(body.flatValue ?? 0)
                          : 0,
      hasPctCap:            Boolean(body.hasPctCap),
      pctCap:               Number(body.pctCap ?? 0),
      freeShippingStandard: Boolean(body.freeShippingStandard ?? true),
      freeShippingExpress:  Boolean(body.freeShippingExpress  ?? true),
      buyX:                 Number(body.buyX ?? 2),
      getY:                 Number(body.getY ?? 1),
      getDiscount:          String(body.getDiscount ?? 'free'),
      getCustomPct:         Number(body.getCustomPct ?? 50),
      applyTo:              String(body.applyTo ?? 'order'),

      // Usage limits
      maxUses:          body.hasMaxUses          ? Number(body.maxUses         ?? 100) : null,
      perCustomerLimit: body.hasPerCustomerLimit ? Number(body.perCustomerLimit ?? 1  ) : null,
      singleUse:        Boolean(body.singleUse),

      // Validity
      validFrom,
      expiresAt,
      autoDisableOnExpiry: Boolean(body.autoDisableOnExpiry ?? true),

      // Eligibility
      minOrderAmount:        body.hasMinOrder  ? Number(body.minOrderAmount ?? 0) : 0,
      minItems:              body.hasMinItems  ? Number(body.minItems       ?? 0) : 0,
      firstOrderOnly:        Boolean(body.firstOrderOnly),
      newCustomersOnly:      Boolean(body.newCustomersOnly),
      newCustomerDays:       Number(body.newCustomerDays ?? 30),
      specificCustomerEmails,
      hasPaymentRestriction: Boolean(body.hasPaymentRestriction),
      paymentRestriction:    String(body.paymentRestriction ?? 'all'),

      // Stackability
      combinableWithCodes: Boolean(body.combinableWithCodes),
      combinableWithSales: body.combinableWithSales !== false,

      // Notifications
      hasUsageAlert:   Boolean(body.hasUsageAlert),
      usageAlertPct:   Number(body.usageAlertPct   ?? 80),
      hasExpiryAlert:  Boolean(body.hasExpiryAlert),
      expiryAlertDays: Number(body.expiryAlertDays ?? 3),
      alertEmails,
    });

    return NextResponse.json<ApiResponse<{ id: string; code: string }>>(
      { success: true, data: { id: coupon._id.toString(), code: coupon.code } },
      { status: 201 },
    );
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json<ApiResponse>({ error: 'A promo code with this code already exists.' }, { status: 409 });
    }
    console.error('[api/admin/promos POST]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
