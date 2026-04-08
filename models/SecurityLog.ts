import mongoose, { Document, Model, Schema } from 'mongoose';

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'login_locked'
  | 'password_changed'
  | 'pin_changed'
  | 'pin_reset'
  | 'session_revoked'
  | 'session_revoked_all'
  | 'two_fa_enabled'
  | 'two_fa_disabled'
  | 'two_fa_failed'
  | 'ip_blocked'
  | 'settings_changed';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export interface ISecurityLog extends Document {
  event:        SecurityEventType;
  description:  string;
  severity:     SecuritySeverity;
  adminId?:     string;
  adminName?:   string;
  ipAddress?:   string;
  location?:    string;
  userAgent?:   string;
  createdAt:    Date;
}

const SecurityLogSchema = new Schema<ISecurityLog>(
  {
    event:       { type: String, required: true, index: true },
    description: { type: String, required: true },
    severity:    { type: String, enum: ['info', 'warning', 'critical'], required: true },
    adminId:     { type: String, index: true },
    adminName:   { type: String },
    ipAddress:   { type: String },
    location:    { type: String },
    userAgent:   { type: String },
  },
  { timestamps: true },
);

SecurityLogSchema.index({ createdAt: -1 });

const SecurityLog: Model<ISecurityLog> =
  mongoose.models.SecurityLog ||
  mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);

export default SecurityLog;

// ── Helper ─────────────────────────────────────────────────────────────────────

export async function logSecurityEvent(params: {
  event:       SecurityEventType;
  description: string;
  severity:    SecuritySeverity;
  adminId?:    string;
  adminName?:  string;
  ipAddress?:  string;
  location?:   string;
  userAgent?:  string;
}) {
  try {
    await SecurityLog.create(params);
  } catch {
    console.error('[SecurityLog] Failed to write:', params);
  }
}
