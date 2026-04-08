import mongoose, { Document, Model, Schema } from 'mongoose';

export const SINGLETON_ID = 'admin_payment_settings';

interface PaymentMethod {
  id:          string;
  name:        string;
  description: string;
  label:       string;
  icon:        'paystack' | 'bank';
}

export interface IAdminPaymentSettings extends Document<string> {
  _id: string;
  bankTransfer: {
    enabled:                   boolean;
    bankName:                  string;
    accountName:               string;
    accountNumber:             string;
    verificationDeadlineHours: number;
    verificationInstructions:  string;
  };
  methodsOrder: PaymentMethod[];
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<PaymentMethod>(
  {
    id:          { type: String, required: true },
    name:        { type: String, default: '' },
    description: { type: String, default: '' },
    label:       { type: String, default: '' },
    icon:        { type: String, enum: ['paystack', 'bank'], default: 'paystack' },
  },
  { _id: false },
);

const AdminPaymentSettingsSchema = new Schema<IAdminPaymentSettings>(
  {
    _id: { type: String, default: SINGLETON_ID },
    bankTransfer: {
      enabled:                   { type: Boolean, default: true },
      bankName:                  { type: String,  default: '' },
      accountName:               { type: String,  default: '' },
      accountNumber:             { type: String,  default: '' },
      verificationDeadlineHours: { type: Number,  default: 24 },
      verificationInstructions:  { type: String,  default: '' },
    },
    methodsOrder: { type: [PaymentMethodSchema], default: [] },
  },
  { timestamps: true, _id: false },
);

const AdminPaymentSettings: Model<IAdminPaymentSettings> =
  mongoose.models.AdminPaymentSettings ||
  mongoose.model<IAdminPaymentSettings>(
    'AdminPaymentSettings',
    AdminPaymentSettingsSchema,
  );

export default AdminPaymentSettings;

// ── Helper: get or create singleton ───────────────────────────────────────────

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: 'paystack',      name: 'Paystack',       description: 'Card, Bank, USSD',    label: 'Pay with Card / Bank',  icon: 'paystack' },
  { id: 'bank-transfer', name: 'Bank Transfer',  description: 'Direct bank transfer', label: 'Direct Bank Transfer', icon: 'bank'     },
];

export async function getPaymentSettings(): Promise<IAdminPaymentSettings> {
  const doc = await AdminPaymentSettings.findByIdAndUpdate(
    SINGLETON_ID,
    {
      $setOnInsert: {
        _id:          SINGLETON_ID,
        methodsOrder: DEFAULT_METHODS,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc!;
}
