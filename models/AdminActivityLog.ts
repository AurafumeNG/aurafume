import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAdminActivityLog extends Document {
  adminId:    string;   // User._id of the admin who acted
  adminName:  string;   // Denormalized — display even if admin later deleted
  adminRole:  string;   // 'admin' | 'superadmin' at the time of action
  action:     string;   // machine key e.g. 'invited_admin', 'updated_order'
  detail:     string;   // human-readable full sentence
  targetType?: string;  // 'order' | 'product' | 'customer' | 'admin' | 'promo' | ...
  targetId?:  string;
  createdAt:  Date;
}

const AdminActivityLogSchema = new Schema<IAdminActivityLog>(
  {
    adminId:    { type: String, required: true, index: true },
    adminName:  { type: String, required: true },
    adminRole:  { type: String, required: true },
    action:     { type: String, required: true, index: true },
    detail:     { type: String, required: true },
    targetType: { type: String },
    targetId:   { type: String },
  },
  { timestamps: true },
);

// Compound index for common query patterns
AdminActivityLogSchema.index({ createdAt: -1 });
AdminActivityLogSchema.index({ adminId: 1, createdAt: -1 });

const AdminActivityLog: Model<IAdminActivityLog> =
  mongoose.models.AdminActivityLog ||
  mongoose.model<IAdminActivityLog>('AdminActivityLog', AdminActivityLogSchema);

export default AdminActivityLog;

// ── Logging helper (import in any route that should be audited) ────────────────

export async function logAdminAction(params: {
  adminId:    string;
  adminName:  string;
  adminRole:  string;
  action:     string;
  detail:     string;
  targetType?: string;
  targetId?:  string;
}) {
  try {
    await AdminActivityLog.create(params);
  } catch {
    // Never let logging failure break the actual operation
    console.error('[AdminActivityLog] Failed to write log:', params);
  }
}
