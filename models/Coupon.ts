import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Status ─────────────────────────────────────────────────────────────────────

export type CouponStatus   = 'draft' | 'active' | 'scheduled' | 'disabled' | 'archived';
export type CouponType     = 'pct' | 'flat' | 'free-shipping' | 'buy-x-get-y';
export type GetDiscount    = 'free' | 'half' | 'custom';
export type ApplyTo        = 'order' | 'products' | 'categories';
export type PaymentRestriction = 'all' | 'paystack' | 'bank-transfer';

// ── Interface ──────────────────────────────────────────────────────────────────

export interface ICoupon extends Document {
  // ── Core ───────────────────────────────────────────────────────────────────
  code:        string;    // always stored UPPERCASE
  description: string;
  label:       string;
  status:      CouponStatus;
  isActive:    boolean;   // kept for checkout middleware compatibility

  // ── Discount type & value ──────────────────────────────────────────────────
  type:                 CouponType;
  value:                number;   // pct 0-100 or flat ₦ amount
  hasPctCap:            boolean;
  pctCap:               number;
  freeShippingStandard: boolean;
  freeShippingExpress:  boolean;
  buyX:                 number;
  getY:                 number;
  getDiscount:          GetDiscount;
  getCustomPct:         number;
  applyTo:              ApplyTo;
  applyToProductIds:    mongoose.Types.ObjectId[];
  applyToCategoryIds:   string[];

  // ── Usage limits ───────────────────────────────────────────────────────────
  maxUses:          number | null;   // null = unlimited
  usedCount:        number;
  perCustomerLimit: number | null;   // null = unlimited
  singleUse:        boolean;

  // ── Validity ───────────────────────────────────────────────────────────────
  validFrom:           Date;
  expiresAt:           Date | null;
  autoDisableOnExpiry: boolean;

  // ── Eligibility ────────────────────────────────────────────────────────────
  minOrderAmount:        number;
  minItems:              number;
  firstOrderOnly:        boolean;
  newCustomersOnly:      boolean;
  newCustomerDays:       number;
  specificCustomerEmails: string[];
  requiredProductIds:    mongoose.Types.ObjectId[];
  hasPaymentRestriction: boolean;
  paymentRestriction:    PaymentRestriction;

  // ── Stackability ───────────────────────────────────────────────────────────
  combinableWithCodes: boolean;
  combinableWithSales: boolean;

  // ── Notifications ──────────────────────────────────────────────────────────
  hasUsageAlert:   boolean;
  usageAlertPct:   number;
  hasExpiryAlert:  boolean;
  expiryAlertDays: number;
  alertEmails:     string[];

  // ── Timestamps ─────────────────────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────────

const CouponSchema = new Schema<ICoupon>(
  {
    // Core
    code: {
      type:      String,
      required:  true,
      unique:    true,
      uppercase: true,
      trim:      true,
      index:     true,
    },
    description: { type: String, default: '' },
    label:       { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['draft', 'active', 'scheduled', 'disabled', 'archived'],
      default: 'draft',
      index:   true,
    },
    isActive: { type: Boolean, default: false, index: true },

    // Discount type & value
    type: {
      type:     String,
      enum:     ['pct', 'flat', 'free-shipping', 'buy-x-get-y'],
      required: true,
    },
    value:                { type: Number, default: 0, min: 0 },
    hasPctCap:            { type: Boolean, default: false },
    pctCap:               { type: Number,  default: 0  },
    freeShippingStandard: { type: Boolean, default: true },
    freeShippingExpress:  { type: Boolean, default: true },
    buyX:                 { type: Number,  default: 2   },
    getY:                 { type: Number,  default: 1   },
    getDiscount:          { type: String,  enum: ['free', 'half', 'custom'], default: 'free' },
    getCustomPct:         { type: Number,  default: 50  },
    applyTo:              { type: String,  enum: ['order', 'products', 'categories'], default: 'order' },
    applyToProductIds:    [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applyToCategoryIds:   [{ type: String }],

    // Usage limits
    maxUses:          { type: Number,  default: null },
    usedCount:        { type: Number,  default: 0    },
    perCustomerLimit: { type: Number,  default: null },
    singleUse:        { type: Boolean, default: false },

    // Validity
    validFrom:           { type: Date, default: () => new Date() },
    expiresAt:           { type: Date, default: null },
    autoDisableOnExpiry: { type: Boolean, default: true },

    // Eligibility
    minOrderAmount:        { type: Number,  default: 0      },
    minItems:              { type: Number,  default: 0      },
    firstOrderOnly:        { type: Boolean, default: false  },
    newCustomersOnly:      { type: Boolean, default: false  },
    newCustomerDays:       { type: Number,  default: 30     },
    specificCustomerEmails: [{ type: String, lowercase: true, trim: true }],
    requiredProductIds:    [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    hasPaymentRestriction: { type: Boolean, default: false },
    paymentRestriction:    { type: String,  enum: ['all', 'paystack', 'bank-transfer'], default: 'all' },

    // Stackability
    combinableWithCodes: { type: Boolean, default: false },
    combinableWithSales: { type: Boolean, default: true  },

    // Notifications
    hasUsageAlert:   { type: Boolean, default: false },
    usageAlertPct:   { type: Number,  default: 80    },
    hasExpiryAlert:  { type: Boolean, default: false },
    expiryAlertDays: { type: Number,  default: 3     },
    alertEmails:     [{ type: String, lowercase: true, trim: true }],
  },
  { timestamps: true },
);

// ── Sync isActive from status before save ──────────────────────────────────────

CouponSchema.pre('save', async function () {
  (this as unknown as { isActive: boolean }).isActive = this.status === 'active';
});

CouponSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as Record<string, unknown> | null;
  if (update && typeof update.status === 'string') {
    update.isActive = update.status === 'active';
  }
});

// ── Model ──────────────────────────────────────────────────────────────────────

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
