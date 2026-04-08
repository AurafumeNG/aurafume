import mongoose, { Document, Model, Schema } from 'mongoose';

export const SINGLETON_ID = 'admin_general_settings';

export interface IAdminGeneralSettings extends Document<string> {
  _id:           string;
  storeName:     string;
  storeTagline:  string;
  storeEmail:    string;
  storePhone:    string;
  streetAddress: string;
  city:          string;
  state:         string;
  country:       string;
  logoUrl:       string;
  faviconUrl:    string;
  updatedAt:     Date;
}

const AdminGeneralSettingsSchema = new Schema<IAdminGeneralSettings>(
  {
    _id:           { type: String, default: SINGLETON_ID },
    storeName:     { type: String, default: 'AuraFumeNG' },
    storeTagline:  { type: String, default: 'Luxury Fragrances for Every Soul' },
    storeEmail:    { type: String, default: 'hello@aurafumeng.com' },
    storePhone:    { type: String, default: '' },
    streetAddress: { type: String, default: '' },
    city:          { type: String, default: '' },
    state:         { type: String, default: '' },
    country:       { type: String, default: 'Nigeria' },
    logoUrl:       { type: String, default: '' },
    faviconUrl:    { type: String, default: '' },
  },
  { timestamps: true, _id: false },
);

const AdminGeneralSettings: Model<IAdminGeneralSettings> =
  mongoose.models.AdminGeneralSettings ||
  mongoose.model<IAdminGeneralSettings>(
    'AdminGeneralSettings',
    AdminGeneralSettingsSchema,
  );

export default AdminGeneralSettings;

// ── Helper: get or create singleton ───────────────────────────────────────────

export async function getGeneralSettings(): Promise<IAdminGeneralSettings> {
  const doc = await AdminGeneralSettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc!;
}
