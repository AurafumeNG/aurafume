import mongoose, { Document, Model, Schema } from 'mongoose';

// Singleton document — one record for the entire store.
// Accessed via upsert with a fixed SINGLETON_ID.

export const SINGLETON_ID = 'admin_notification_settings';

interface OrderEvent {
  enabled: boolean;
  channel: 'email' | 'in-app' | 'both';
}

interface SimpleEvent {
  enabled: boolean;
}

export interface IAdminNotificationSettings extends Document {
  _id: string;
  orderAlerts: {
    newOrder:            OrderEvent;
    paymentConfirmed:    OrderEvent;
    cancelledByCustomer: OrderEvent;
    refundRequested:     OrderEvent;
  };
  bankTransferAlerts: {
    newTransferOrder: SimpleEvent;
    awaiting12h:      SimpleEvent;
    awaiting24h:      SimpleEvent;
    recipients:       string[];
  };
  inventoryAlerts: {
    lowStock:   SimpleEvent;
    outOfStock: SimpleEvent;
    restocked:  SimpleEvent;
    recipients: string[];
    frequency:  'once' | 'daily';
  };
  customerAlerts: {
    newRegistered:    SimpleEvent;
    accountSuspended: SimpleEvent;
    accountDeleted:   SimpleEvent;
  };
  systemAlerts: {
    promoThreshold:  SimpleEvent;
    promoExpired:    SimpleEvent;
    failedLogin:     SimpleEvent;
    passwordChanged: SimpleEvent;
  };
  globalRecipients: string[];
  updatedAt: Date;
}

const OrderEventSchema = new Schema<OrderEvent>(
  {
    enabled: { type: Boolean, default: true },
    channel: { type: String, enum: ['email', 'in-app', 'both'], default: 'both' },
  },
  { _id: false },
);

const SimpleEventSchema = new Schema<SimpleEvent>(
  { enabled: { type: Boolean, default: true } },
  { _id: false },
);

const AdminNotificationSettingsSchema = new Schema<IAdminNotificationSettings>(
  {
    _id: { type: String, default: SINGLETON_ID },
    orderAlerts: {
      newOrder:            { type: OrderEventSchema, default: () => ({ enabled: true,  channel: 'both'  }) },
      paymentConfirmed:    { type: OrderEventSchema, default: () => ({ enabled: true,  channel: 'both'  }) },
      cancelledByCustomer: { type: OrderEventSchema, default: () => ({ enabled: true,  channel: 'email' }) },
      refundRequested:     { type: OrderEventSchema, default: () => ({ enabled: true,  channel: 'both'  }) },
    },
    bankTransferAlerts: {
      newTransferOrder: { type: SimpleEventSchema, default: () => ({ enabled: true }) },
      awaiting12h:      { type: SimpleEventSchema, default: () => ({ enabled: true }) },
      awaiting24h:      { type: SimpleEventSchema, default: () => ({ enabled: true }) },
      recipients:       [{ type: String }],
    },
    inventoryAlerts: {
      lowStock:   { type: SimpleEventSchema, default: () => ({ enabled: true  }) },
      outOfStock: { type: SimpleEventSchema, default: () => ({ enabled: true  }) },
      restocked:  { type: SimpleEventSchema, default: () => ({ enabled: false }) },
      recipients: [{ type: String }],
      frequency:  { type: String, enum: ['once', 'daily'], default: 'once' },
    },
    customerAlerts: {
      newRegistered:    { type: SimpleEventSchema, default: () => ({ enabled: false }) },
      accountSuspended: { type: SimpleEventSchema, default: () => ({ enabled: true  }) },
      accountDeleted:   { type: SimpleEventSchema, default: () => ({ enabled: true  }) },
    },
    systemAlerts: {
      promoThreshold:  { type: SimpleEventSchema, default: () => ({ enabled: true }) },
      promoExpired:    { type: SimpleEventSchema, default: () => ({ enabled: true }) },
      failedLogin:     { type: SimpleEventSchema, default: () => ({ enabled: true }) },
      passwordChanged: { type: SimpleEventSchema, default: () => ({ enabled: true }) },
    },
    globalRecipients: [{ type: String }],
  },
  { timestamps: true, _id: false },
);

const AdminNotificationSettings: Model<IAdminNotificationSettings> =
  mongoose.models.AdminNotificationSettings ||
  mongoose.model<IAdminNotificationSettings>(
    'AdminNotificationSettings',
    AdminNotificationSettingsSchema,
  );

export default AdminNotificationSettings;

// ── Helper: get or create singleton ───────────────────────────────────────────

export async function getNotificationSettings(): Promise<IAdminNotificationSettings> {
  const doc = await AdminNotificationSettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc!;
}
