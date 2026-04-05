import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStockAdjustment extends Document {
  productId:     string;
  variantSize:   string;
  variantSku:    string;
  type:          'add' | 'remove' | 'set';
  previousStock: number;
  adjustment:    number;   // units changed (positive), or the new absolute value for 'set'
  newStock:      number;
  reason:        string;
  adjustedBy:    string;   // denormalised display name
  adjustedById:  string;   // admin userId
  createdAt:     Date;
}

const StockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    productId:     { type: String, required: true, index: true },
    variantSize:   { type: String, required: true },
    variantSku:    { type: String, default: '' },
    type:          { type: String, enum: ['add', 'remove', 'set'], required: true },
    previousStock: { type: Number, required: true },
    adjustment:    { type: Number, required: true },
    newStock:      { type: Number, required: true },
    reason:        { type: String, default: '' },
    adjustedBy:    { type: String, required: true },
    adjustedById:  { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const StockAdjustment: Model<IStockAdjustment> =
  mongoose.models.StockAdjustment ??
  mongoose.model<IStockAdjustment>('StockAdjustment', StockAdjustmentSchema);

export default StockAdjustment;
