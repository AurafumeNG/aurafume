// models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface INotificationPreferences {
  email: {
    orderUpdates:   boolean;
    promotions:     boolean;
    newArrivals:    boolean;
    restockedItems: boolean;
    newsletter:     boolean;
  };
  push: {
    enabled:            boolean;
    orderStatusChanges: boolean;
    flashSales:         boolean;
    deliveryUpdates:    boolean;
    restockedItems:     boolean;
  };
}

export interface IAddress {
  _id?: unknown;
  label: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  notificationPreferences?: INotificationPreferences;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  provider: 'local' | 'google';
  googleId?: string;
  isVerified: boolean;
  isSuspended?: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  inviteToken?: string;
  inviteTokenExpires?: Date;
  lastLoginAt?: Date;
  adminPin?: string;        // bcrypt-hashed 6-digit PIN
  twoFaEnabled?: boolean;
  twoFaSecret?: string;     // TOTP secret (store encrypted in production)
  twoFaBackupCodes?: string[]; // hashed backup codes
  role: 'customer' | 'admin' | 'superadmin' | 'viewer';
  wishlist: string[];
  addresses: IAddress[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const NotificationPreferencesSchema = new Schema(
  {
    email: {
      orderUpdates:   { type: Boolean, default: true  },
      promotions:     { type: Boolean, default: false },
      newArrivals:    { type: Boolean, default: false },
      restockedItems: { type: Boolean, default: false },
      newsletter:     { type: Boolean, default: false },
    },
    push: {
      enabled:            { type: Boolean, default: false },
      orderStatusChanges: { type: Boolean, default: true  },
      flashSales:         { type: Boolean, default: false },
      deliveryUpdates:    { type: Boolean, default: true  },
      restockedItems:     { type: Boolean, default: true  },
    },
  },
  { _id: false },
);

const AddressSchema = new Schema<IAddress>({
  label:      { type: String },
  street:     { type: String },
  apt:        { type: String },
  city:       { type: String },
  state:      { type: String },
  postalCode: { type: String },
  country:    { type: String, default: 'Nigeria' },
  isDefault:  { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,   // allows multiple null values while keeping uniqueness for set values
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpiry: { type: Date },
    inviteToken: { type: String },
    inviteTokenExpires: { type: Date },
    lastLoginAt: { type: Date },
    adminPin:          { type: String, select: false },
    twoFaEnabled:      { type: Boolean, default: false },
    twoFaSecret:       { type: String, select: false },
    twoFaBackupCodes:  [{ type: String, select: false }],
    role: {
      type: String,
      enum: ['customer', 'admin', 'superadmin', 'viewer'],
      default: 'customer',
    },
    wishlist: [{ type: String }],
    addresses: [AddressSchema],
    avatar: { type: String },
    notificationPreferences: { type: NotificationPreferencesSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// Hash password before saving — skip for OAuth users who have no password
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password — returns false for OAuth-only accounts
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
