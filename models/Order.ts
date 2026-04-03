import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Sub-document types ─────────────────────────────────────────────────────────

export interface IOrderItem {
  productId:    string;
  slug:         string;
  name:         string;
  scentFamily:  string;
  image:        string;
  size:         string;
  pricePerUnit: number;
  qty:          number;
}

export interface IOrderContact {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
}

export interface IOrderAddress {
  street:     string;
  apt?:       string;
  city:       string;
  state:      string;
  postalCode?: string;
  country:    string;
}

export interface IOrderGift {
  isGift:   boolean;
  message?: string;
  wrapping: boolean;
  hidePrice: boolean;
}

export interface IOrderPricing {
  subtotal:     number;
  discount:     number;
  couponCode?:  string;
  couponLabel?: string;
  deliveryFee:  number;
  giftWrapFee:  number;
  total:        number;
}

export interface IOrderDelivery {
  option:   'outside-lagos' | 'within-lagos' | 'pickup';
  label:    string;
  duration: string;
  notes?:   string;
}

export interface IOrderPayment {
  method:       'bank-transfer' | 'paystack';
  status:       'pending' | 'paid' | 'failed' | 'refunded';
  paystackRef?: string;
  paidAt?:      Date;
  amountPaid?:  number; // in Naira (not kobo)
}

// ── Main interface ─────────────────────────────────────────────────────────────

export interface IOrder extends Document {
  orderNumber:     string;
  userId?:         mongoose.Types.ObjectId;
  contact:         IOrderContact;
  shippingAddress: IOrderAddress;
  billingAddress?: IOrderAddress;
  items:           IOrderItem[];
  gift:            IOrderGift;
  pricing:         IOrderPricing;
  delivery:        IOrderDelivery;
  payment:         IOrderPayment;
  status:          'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt:       Date;
  updatedAt:       Date;
}

// ── Schemas ────────────────────────────────────────────────────────────────────

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId:    { type: String, required: true },
    slug:         { type: String, required: true },
    name:         { type: String, required: true },
    scentFamily:  { type: String, required: true },
    image:        { type: String, required: true },
    size:         { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    qty:          { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const ContactSchema = new Schema<IOrderContact>(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, lowercase: true },
    phone:     { type: String, required: true },
  },
  { _id: false },
);

const AddressSchema = new Schema<IOrderAddress>(
  {
    street:     { type: String, required: true },
    apt:        { type: String },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    postalCode: { type: String },
    country:    { type: String, required: true, default: 'Nigeria' },
  },
  { _id: false },
);

const GiftSchema = new Schema<IOrderGift>(
  {
    isGift:    { type: Boolean, default: false },
    message:   { type: String },
    wrapping:  { type: Boolean, default: false },
    hidePrice: { type: Boolean, default: false },
  },
  { _id: false },
);

const PricingSchema = new Schema<IOrderPricing>(
  {
    subtotal:     { type: Number, required: true },
    discount:     { type: Number, default: 0 },
    couponCode:   { type: String },
    couponLabel:  { type: String },
    deliveryFee:  { type: Number, required: true },
    giftWrapFee:  { type: Number, default: 0 },
    total:        { type: Number, required: true },
  },
  { _id: false },
);

const DeliverySchema = new Schema<IOrderDelivery>(
  {
    option:   { type: String, enum: ['outside-lagos', 'within-lagos', 'pickup'], required: true },
    label:    { type: String, required: true },
    duration: { type: String, required: true },
    notes:    { type: String },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IOrderPayment>(
  {
    method:      { type: String, enum: ['bank-transfer', 'paystack'], required: true },
    status:      { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paystackRef: { type: String, index: true },
    paidAt:      { type: Date },
    amountPaid:  { type: Number },
  },
  { _id: false },
);

// ── Counter for human-readable order numbers ───────────────────────────────────

const CounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter =
  mongoose.models.Counter ||
  mongoose.model('Counter', CounterSchema);

// ── Order schema ───────────────────────────────────────────────────────────────

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type:   String,
      unique: true,
      index:  true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref:  'User',
      index: true,
    },
    contact:         { type: ContactSchema,  required: true },
    shippingAddress: { type: AddressSchema,  required: true },
    billingAddress:  { type: AddressSchema },
    items:           { type: [OrderItemSchema], required: true },
    gift:            { type: GiftSchema,     default: () => ({}) },
    pricing:         { type: PricingSchema,  required: true },
    delivery:        { type: DeliverySchema, required: true },
    payment:         { type: PaymentSchema,  required: true },
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

// Auto-generate sequential order numbers: ORD-00001, ORD-00002, …
OrderSchema.pre('save', async function () {
  if (this.orderNumber) return;
  const counter = await Counter.findByIdAndUpdate(
    'orderNumber',
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  this.orderNumber = `ORD-${String(counter.seq).padStart(5, '0')}`;
});

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
