import mongoose, { Document, Model, Schema } from 'mongoose';

// Singleton document — one record for the entire store.
// Accessed via upsert with a fixed SINGLETON_ID.

export const SINGLETON_ID = 'admin_security_settings';

export interface IAdminSecuritySettings extends Document<string> {
  // Password Policy
  minPasswordLength:  number;
  requireUppercase:   boolean;
  requireNumber:      boolean;
  requireSpecial:     boolean;
  passwordExpiry:     boolean;
  expiryDays:         number;
  // Login Security
  maxLoginAttempts:   number;
  lockoutMinutes:     number;
  rememberDeviceDays: number;
  sessionTimeoutHours: number;
  ipRestriction:      boolean;
  allowedIps:         string[];
  updatedAt:          Date;
}

const AdminSecuritySettingsSchema = new Schema<IAdminSecuritySettings>(
  {
    _id:                 { type: String, default: SINGLETON_ID },
    minPasswordLength:   { type: Number, default: 8   },
    requireUppercase:    { type: Boolean, default: true  },
    requireNumber:       { type: Boolean, default: true  },
    requireSpecial:      { type: Boolean, default: true  },
    passwordExpiry:      { type: Boolean, default: false },
    expiryDays:          { type: Number, default: 90  },
    maxLoginAttempts:    { type: Number, default: 5   },
    lockoutMinutes:      { type: Number, default: 15  },
    rememberDeviceDays:  { type: Number, default: 30  },
    sessionTimeoutHours: { type: Number, default: 8   },
    ipRestriction:       { type: Boolean, default: false },
    allowedIps:          [{ type: String }],
  },
  { timestamps: true, _id: false },
);

const AdminSecuritySettings: Model<IAdminSecuritySettings> =
  mongoose.models.AdminSecuritySettings ||
  mongoose.model<IAdminSecuritySettings>('AdminSecuritySettings', AdminSecuritySettingsSchema);

export default AdminSecuritySettings;

// ── Helper: get or create singleton ───────────────────────────────────────────

export async function getSecuritySettings(): Promise<IAdminSecuritySettings> {
  const doc = await AdminSecuritySettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc!;
}
