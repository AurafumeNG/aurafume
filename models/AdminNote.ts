import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAdminNote extends Document {
  customerId: mongoose.Types.ObjectId;
  adminId:    mongoose.Types.ObjectId;
  adminName:  string;
  content:    string;
  createdAt:  Date;
  updatedAt:  Date;
}

const AdminNoteSchema = new Schema<IAdminNote>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminName:  { type: String, required: true },
    content:    { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const AdminNote: Model<IAdminNote> =
  mongoose.models.AdminNote || mongoose.model<IAdminNote>('AdminNote', AdminNoteSchema);

export default AdminNote;
