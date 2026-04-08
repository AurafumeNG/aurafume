import mongoose, { Document, Model, Schema } from 'mongoose';

export const SINGLETON_ID = 'admin_shipping_settings';

interface DeliveryMethod {
  id:                string;
  type:              'delivery';
  enabled:           boolean;
  label:             string;
  description:       string;
  fee:               number;
  estimatedDaysFrom: number;
  estimatedDaysTo:   number;
  availableStates:   'all' | 'specific';
  selectedStates:    string[];
}

interface PickupMethod {
  id:                  string;
  type:                'pickup';
  enabled:             boolean;
  label:               string;
  description:         string;
  fee:                 number;
  pickupAddress:       string;
  pickupHours:         string;
  pickupInstructions:  string;
}

type ShippingMethod = DeliveryMethod | PickupMethod;

export interface IAdminShippingSettings extends Document<string> {
  methods: ShippingMethod[];
  updatedAt: Date;
}

// Store each method as a flexible Mixed sub-document so both
// delivery and pickup variants can live in the same array.
const AdminShippingSettingsSchema = new Schema<IAdminShippingSettings>(
  {
    _id:     { type: String, default: SINGLETON_ID },
    methods: { type: [Schema.Types.Mixed], default: [] },
  } as any,
  { timestamps: true, _id: false },
);

const AdminShippingSettings: Model<IAdminShippingSettings> =
  mongoose.models.AdminShippingSettings ||
  mongoose.model<IAdminShippingSettings>(
    'AdminShippingSettings',
    AdminShippingSettingsSchema,
  );

export default AdminShippingSettings;

// ── Helper: get or create singleton ───────────────────────────────────────────

const DEFAULT_METHODS: ShippingMethod[] = [
  {
    id:                'outside-lagos',
    type:              'delivery',
    enabled:           true,
    label:             'Outside Lagos',
    description:       '3–5 business days',
    fee:               3500,
    estimatedDaysFrom: 3,
    estimatedDaysTo:   5,
    availableStates:   'all',
    selectedStates:    [],
  },
  {
    id:                'within-lagos',
    type:              'delivery',
    enabled:           true,
    label:             'Within Lagos',
    description:       '0–2 business days',
    fee:               1500,
    estimatedDaysFrom: 0,
    estimatedDaysTo:   2,
    availableStates:   'specific',
    selectedStates:    ['Lagos'],
  },
  {
    id:                 'store-pickup',
    type:               'pickup',
    enabled:            true,
    label:              'Store Pickup',
    description:        'Collect from our store',
    fee:                0,
    pickupAddress:      '14 Fragrance Avenue, Lekki Phase 1, Lagos',
    pickupHours:        'Mon–Sat, 9am–6pm',
    pickupInstructions: 'Bring your order confirmation email or SMS. Items are held for 7 days.',
  },
];

export async function getShippingSettings(): Promise<IAdminShippingSettings> {
  const doc = await AdminShippingSettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID, methods: DEFAULT_METHODS } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc!;
}
