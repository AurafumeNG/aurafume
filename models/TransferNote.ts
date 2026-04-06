import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransferNote extends Document {
  orderId:   mongoose.Types.ObjectId;
  adminId:   mongoose.Types.ObjectId;
  adminName: string;
  content:   string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferNoteSchema = new Schema<ITransferNote>(
  {
    orderId:   { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    adminId:   { type: Schema.Types.ObjectId, ref: 'User',  required: true },
    adminName: { type: String, required: true },
    content:   { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const TransferNote: Model<ITransferNote> =
  mongoose.models.TransferNote ||
  mongoose.model<ITransferNote>('TransferNote', TransferNoteSchema);

export default TransferNote;
