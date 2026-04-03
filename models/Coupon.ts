import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Interface ──────────────────────────────────────────────────────────────────

export interface ICoupon extends Document {
  code:           string;          // always stored UPPERCASE
  type:           'pct' | 'flat';
  value:          number;          // percentage (0–100) or flat ₦ amount
  label:          string;          // display text, e.g. "10% off"
  description?:   string;          // internal note
  minOrderAmount: number;          // minimum cart subtotal to qualify (0 = no minimum)
  maxUses:        number | null;   // null = unlimited
  usedCount:      number;
  expiresAt?:     Date;            // undefined = never expires
  isActive:       boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────────

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type:      String,
      required:  true,
      unique:    true,
      uppercase: true,
      trim:      true,
      index:     true,
    },
    type: {
      type:     String,
      enum:     ['pct', 'flat'],
      required: true,
    },
    value: {
      type:     Number,
      required: true,
      min:      0,
    },
    label: {
      type:     String,
      required: true,
    },
    description: {
      type: String,
    },
    minOrderAmount: {
      type:    Number,
      default: 0,
    },
    maxUses: {
      type:    Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type:    Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
