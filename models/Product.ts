import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Sub-document interfaces ────────────────────────────────────────────────────

export interface IProductImage {
  url:      string;
  publicId: string;
}

export interface IProductVariant {
  size:              string;
  sku:               string;
  price:             number;
  compareAtPrice?:   number;
  costPrice?:        number;
  stock:             number;
  lowStockThreshold: number;
  barcode?:          string;
}

export interface IProductDimensions {
  l?: number;
  w?: number;
  h?: number;
}

// ── Main document interface ────────────────────────────────────────────────────

export interface IProduct extends Document {
  // Basic Info
  name:             string;
  slug:             string;
  shortDescription: string;
  fullDescription:  string;

  // Images
  images: IProductImage[];

  // Fragrance Details
  fragranceFamilies: string[];
  concentration:     string;
  gender:            string;
  origin:            string;
  launchYear?:       number;
  longevity:         string;
  sillage:           string;
  seasons:           string[];
  occasions:         string[];

  // Scent Notes
  topNotes:   string[];
  heartNotes: string[];
  baseNotes:  string[];

  // Variants & Pricing
  variants: IProductVariant[];

  // SEO
  metaTitle:       string;
  metaDescription: string;
  keywords:        string[];
  ogImageUrl:      string;

  // Status & Visibility
  status:          'draft' | 'published' | 'archived';
  visibleInShop:   boolean;
  isFeatured:      boolean;
  isNewArrival:    boolean;
  isBestSeller:    boolean;
  scheduledAt?:    Date;

  // Organization
  tags:              string[];
  collections:       string[];
  relatedProductIds: string[];

  // Shipping
  weight?:          number;
  dimensions?:      IProductDimensions;
  isFragile:        boolean;
  specialPackaging: boolean;

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ────────────────────────────────────────────────────────────────

const ImageSchema = new Schema<IProductImage>(
  {
    url:      { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: false },
);

const VariantSchema = new Schema<IProductVariant>(
  {
    size:              { type: String, required: true },
    sku:               { type: String, default: '' },
    price:             { type: Number, required: true, min: 0 },
    compareAtPrice:    { type: Number, min: 0 },
    costPrice:         { type: Number, min: 0 },
    stock:             { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    barcode:           { type: String, default: '' },
  },
  { _id: false },
);

const DimensionsSchema = new Schema<IProductDimensions>(
  {
    l: { type: Number, min: 0 },
    w: { type: Number, min: 0 },
    h: { type: Number, min: 0 },
  },
  { _id: false },
);

// ── Main schema ────────────────────────────────────────────────────────────────

const ProductSchema = new Schema<IProduct>(
  {
    // Basic Info
    name: {
      type:     String,
      required: [true, 'Product name is required'],
      trim:     true,
    },
    slug: {
      type:     String,
      required: [true, 'Slug is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
    },
    shortDescription: { type: String, default: '', trim: true },
    fullDescription:  { type: String, default: '' },

    // Images
    images: { type: [ImageSchema], default: [] },

    // Fragrance Details
    fragranceFamilies: [{ type: String }],
    concentration:     { type: String, default: '' },
    gender:            { type: String, default: '' },
    origin:            { type: String, default: '' },
    launchYear:        { type: Number },
    longevity:         { type: String, default: '' },
    sillage:           { type: String, default: '' },
    seasons:           [{ type: String }],
    occasions:         [{ type: String }],

    // Scent Notes
    topNotes:   [{ type: String }],
    heartNotes: [{ type: String }],
    baseNotes:  [{ type: String }],

    // Variants
    variants: { type: [VariantSchema], default: [] },

    // SEO
    metaTitle:       { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords:        [{ type: String }],
    ogImageUrl:      { type: String, default: '' },

    // Status
    status: {
      type:    String,
      enum:    ['draft', 'published', 'archived'],
      default: 'draft',
    },
    visibleInShop:   { type: Boolean, default: true },
    isFeatured:      { type: Boolean, default: false },
    isNewArrival:    { type: Boolean, default: false },
    isBestSeller:    { type: Boolean, default: false },
    scheduledAt:     { type: Date },

    // Organization
    tags:              [{ type: String }],
    collections:       [{ type: String }],
    relatedProductIds: [{ type: String }],

    // Shipping
    weight:           { type: Number, min: 0 },
    dimensions:       { type: DimensionsSchema },
    isFragile:        { type: Boolean, default: false },
    specialPackaging: { type: Boolean, default: false },

    // Audit
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

// ── Indexes ────────────────────────────────────────────────────────────────────

ProductSchema.index({ status:    1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ name: 'text', 'variants.sku': 'text' });

// ── Model ──────────────────────────────────────────────────────────────────────

const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
