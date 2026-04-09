import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product';

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in .env');

// Public Unsplash perfume/fragrance images (no auth required)
const IMAGES = [
  'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80',
  'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
  'https://images.unsplash.com/photo-1594913580638-df5adfecc0ff?w=800&q=80',
  'https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=800&q=80',
  'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=800&q=80',
  'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80',
  'https://images.unsplash.com/photo-1600612253971-3b29c5ef5e4a?w=800&q=80',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
  'https://images.unsplash.com/photo-1608528577891-eb055944f2e7?w=800&q=80',
  'https://images.unsplash.com/photo-1616604426565-3f0e4e2f4ebb?w=800&q=80',
];

const products = [
  {
    name: 'Midnight Oud',
    slug: 'midnight-oud',
    shortDescription: 'A rich, smoky oriental with deep oud and amber accords.',
    fullDescription:
      'Midnight Oud opens with a burst of spiced saffron before settling into a luxurious heart of aged oud wood and rose absolute. The base lingers with warm amber, musk, and a touch of vanilla smoke.',
    fragranceFamilies: ['Oriental', 'Woody'],
    concentration: 'Eau de Parfum',
    gender: 'Unisex',
    origin: 'UAE',
    launchYear: 2022,
    longevity: 'Excellent (8-12 hrs)',
    sillage: 'Heavy',
    seasons: ['Fall', 'Winter'],
    occasions: ['Evening', 'Special Occasion'],
    topNotes: ['Saffron', 'Black Pepper', 'Cardamom'],
    heartNotes: ['Oud Wood', 'Rose Absolute', 'Incense'],
    baseNotes: ['Amber', 'Vanilla', 'Musk', 'Sandalwood'],
    variants: [
      { size: '50ml', sku: 'MO-50', price: 129, compareAtPrice: 160, stock: 40, lowStockThreshold: 5 },
      { size: '100ml', sku: 'MO-100', price: 199, compareAtPrice: 240, stock: 25, lowStockThreshold: 3 },
    ],
    status: 'published',
    isFeatured: true,
    isBestSeller: true,
    tags: ['oud', 'oriental', 'smoky'],
    collections: ['Signature Collection'],
    images: [{ url: IMAGES[0], publicId: '' }],
  },
  {
    name: 'Rose Soleil',
    slug: 'rose-soleil',
    shortDescription: 'A sun-drenched floral bouquet of rose and peony.',
    fullDescription:
      'Rose Soleil captures the warmth of a Mediterranean morning. Fresh dewy rose petals are lifted by bright bergamot, then grounded in soft white musk and cedarwood.',
    fragranceFamilies: ['Floral', 'Fresh'],
    concentration: 'Eau de Toilette',
    gender: 'Feminine',
    origin: 'France',
    launchYear: 2023,
    longevity: 'Moderate (4-6 hrs)',
    sillage: 'Moderate',
    seasons: ['Spring', 'Summer'],
    occasions: ['Daytime', 'Casual'],
    topNotes: ['Bergamot', 'Lemon Zest', 'Pink Pepper'],
    heartNotes: ['Rose', 'Peony', 'Jasmine'],
    baseNotes: ['White Musk', 'Cedarwood', 'Ambrette'],
    variants: [
      { size: '30ml', sku: 'RS-30', price: 75, compareAtPrice: 95, stock: 60, lowStockThreshold: 8 },
      { size: '75ml', sku: 'RS-75', price: 140, stock: 35, lowStockThreshold: 5 },
    ],
    status: 'published',
    isNewArrival: true,
    tags: ['rose', 'floral', 'fresh'],
    collections: ['Floral Garden'],
    images: [{ url: IMAGES[1], publicId: '' }],
  },
  {
    name: 'Vetiver Storm',
    slug: 'vetiver-storm',
    shortDescription: 'A bold, earthy vetiver electrified with ozone and woods.',
    fullDescription:
      'Vetiver Storm is a modern take on the classic vetiver fragrance. Cold ozone and grapefruit open the composition before a thunderous heart of raw vetiver root and smoked cedarwood takes hold.',
    fragranceFamilies: ['Woody', 'Aromatic'],
    concentration: 'Eau de Parfum',
    gender: 'Masculine',
    origin: 'UK',
    launchYear: 2021,
    longevity: 'Long-lasting (6-8 hrs)',
    sillage: 'Moderate',
    seasons: ['Fall', 'Winter', 'Spring'],
    occasions: ['Daytime', 'Office'],
    topNotes: ['Grapefruit', 'Ozone', 'Mint'],
    heartNotes: ['Vetiver', 'Cypress', 'Geranium'],
    baseNotes: ['Smoked Cedar', 'Oakmoss', 'Leather'],
    variants: [
      { size: '50ml', sku: 'VS-50', price: 110, stock: 50, lowStockThreshold: 6 },
      { size: '100ml', sku: 'VS-100', price: 175, compareAtPrice: 200, stock: 20, lowStockThreshold: 3 },
    ],
    status: 'published',
    isBestSeller: true,
    tags: ['vetiver', 'woody', 'masculine'],
    collections: ['Signature Collection'],
    images: [{ url: IMAGES[2], publicId: '' }],
  },
  {
    name: 'Citrus Blanche',
    slug: 'citrus-blanche',
    shortDescription: 'A sparkling, clean citrus with a powdery white finish.',
    fullDescription:
      'Citrus Blanche is effortlessly fresh — a cascade of Sicilian lemon, yuzu, and neroli that dries down to an airy iris-powder musk. Perfect for everyday wear.',
    fragranceFamilies: ['Citrus', 'Fresh'],
    concentration: 'Eau de Cologne',
    gender: 'Unisex',
    origin: 'Italy',
    launchYear: 2023,
    longevity: 'Light (2-4 hrs)',
    sillage: 'Soft',
    seasons: ['Spring', 'Summer'],
    occasions: ['Daytime', 'Sport', 'Casual'],
    topNotes: ['Sicilian Lemon', 'Yuzu', 'Mandarin'],
    heartNotes: ['Neroli', 'Petitgrain', 'Iris'],
    baseNotes: ['White Musk', 'Ambrette', 'Cashmeran'],
    variants: [
      { size: '100ml', sku: 'CB-100', price: 89, stock: 80, lowStockThreshold: 10 },
    ],
    status: 'published',
    isNewArrival: true,
    tags: ['citrus', 'fresh', 'clean'],
    collections: ['Everyday Essentials'],
    images: [{ url: IMAGES[3], publicId: '' }],
  },
  {
    name: 'Black Santal',
    slug: 'black-santal',
    shortDescription: 'Creamy Australian sandalwood wrapped in dark leather.',
    fullDescription:
      'Black Santal pairs the buttery richness of Australian sandalwood with dry birch tar leather and a whisper of smoked tonka bean for a deeply sensual, modern masculine fragrance.',
    fragranceFamilies: ['Woody', 'Leather'],
    concentration: 'Eau de Parfum',
    gender: 'Masculine',
    origin: 'Australia',
    launchYear: 2020,
    longevity: 'Excellent (8-12 hrs)',
    sillage: 'Heavy',
    seasons: ['Fall', 'Winter'],
    occasions: ['Evening', 'Date Night'],
    topNotes: ['Black Pepper', 'Rum', 'Aldehydes'],
    heartNotes: ['Sandalwood', 'Birch Tar', 'Violet Leaf'],
    baseNotes: ['Smoked Tonka', 'Dark Amber', 'Leather'],
    variants: [
      { size: '50ml', sku: 'BS-50', price: 145, compareAtPrice: 180, stock: 30, lowStockThreshold: 4 },
      { size: '100ml', sku: 'BS-100', price: 220, stock: 15, lowStockThreshold: 3 },
    ],
    status: 'published',
    isFeatured: true,
    tags: ['sandalwood', 'leather', 'dark'],
    collections: ['Signature Collection', 'Bestsellers'],
    images: [{ url: IMAGES[4], publicId: '' }],
  },
  {
    name: 'Jasmine Nuit',
    slug: 'jasmine-nuit',
    shortDescription: 'Intoxicating night-blooming jasmine with a sensual musk base.',
    fullDescription:
      'Inspired by jasmine blooming under moonlight, this fragrance captures the indolic richness of the flower at its peak, balanced by creamy benzoin and a soft animalic musk.',
    fragranceFamilies: ['Floral', 'Oriental'],
    concentration: 'Eau de Parfum',
    gender: 'Feminine',
    origin: 'Egypt',
    launchYear: 2022,
    longevity: 'Long-lasting (6-8 hrs)',
    sillage: 'Moderate',
    seasons: ['Summer', 'Fall'],
    occasions: ['Evening', 'Date Night', 'Special Occasion'],
    topNotes: ['Bergamot', 'Pink Pepper', 'Green Leaf'],
    heartNotes: ['Jasmine Sambac', 'Tuberose', 'Ylang Ylang'],
    baseNotes: ['Benzoin', 'Sandalwood', 'Musk', 'Civet'],
    variants: [
      { size: '50ml', sku: 'JN-50', price: 135, stock: 35, lowStockThreshold: 5 },
      { size: '100ml', sku: 'JN-100', price: 210, compareAtPrice: 250, stock: 18, lowStockThreshold: 3 },
    ],
    status: 'published',
    tags: ['jasmine', 'floral', 'night'],
    collections: ['Floral Garden', 'Evening Collection'],
    images: [{ url: IMAGES[5], publicId: '' }],
  },
  {
    name: 'Arctic Fern',
    slug: 'arctic-fern',
    shortDescription: 'A crisp, aquatic fougère with green fern and cool woods.',
    fullDescription:
      'Arctic Fern opens like a blast of cold sea air — aquatic notes and frozen greens segue into a classic fougère heart of lavender and coumarin, resting on clean driftwood and musk.',
    fragranceFamilies: ['Aquatic', 'Fougère'],
    concentration: 'Eau de Toilette',
    gender: 'Masculine',
    origin: 'Scandinavia',
    launchYear: 2021,
    longevity: 'Moderate (4-6 hrs)',
    sillage: 'Moderate',
    seasons: ['Spring', 'Summer'],
    occasions: ['Sport', 'Daytime', 'Casual'],
    topNotes: ['Aquatic Notes', 'Frozen Greens', 'Lemon'],
    heartNotes: ['Lavender', 'Coumarin', 'Fern'],
    baseNotes: ['Driftwood', 'Ambergris', 'White Musk'],
    variants: [
      { size: '75ml', sku: 'AF-75', price: 95, stock: 55, lowStockThreshold: 7 },
      { size: '150ml', sku: 'AF-150', price: 155, compareAtPrice: 185, stock: 22, lowStockThreshold: 4 },
    ],
    status: 'published',
    tags: ['aquatic', 'fresh', 'fougère'],
    collections: ['Everyday Essentials'],
    images: [{ url: IMAGES[6], publicId: '' }],
  },
  {
    name: 'Amber Velvet',
    slug: 'amber-velvet',
    shortDescription: 'A warm, gourmand amber with vanilla and spiced rum accord.',
    fullDescription:
      'Amber Velvet is a cosy, enveloping fragrance that wraps you in golden warmth. Opening notes of caramel and rum give way to a honeyed labdanum heart, finishing on a plush base of vanilla and benzoin.',
    fragranceFamilies: ['Oriental', 'Gourmand'],
    concentration: 'Eau de Parfum',
    gender: 'Unisex',
    origin: 'France',
    launchYear: 2022,
    longevity: 'Excellent (8-12 hrs)',
    sillage: 'Heavy',
    seasons: ['Fall', 'Winter'],
    occasions: ['Evening', 'Cosy Night In'],
    topNotes: ['Caramel', 'Rum', 'Orange Blossom'],
    heartNotes: ['Labdanum', 'Heliotrope', 'Tonka Bean'],
    baseNotes: ['Vanilla', 'Benzoin', 'Ambergris', 'Musk'],
    variants: [
      { size: '50ml', sku: 'AV-50', price: 120, stock: 40, lowStockThreshold: 5 },
      { size: '100ml', sku: 'AV-100', price: 190, compareAtPrice: 220, stock: 20, lowStockThreshold: 3 },
    ],
    status: 'published',
    isFeatured: true,
    tags: ['amber', 'vanilla', 'gourmand', 'warm'],
    collections: ['Evening Collection'],
    images: [{ url: IMAGES[7], publicId: '' }],
  },
  {
    name: 'Green Tea Accord',
    slug: 'green-tea-accord',
    shortDescription: 'Serene, clean green tea with a hint of white florals.',
    fullDescription:
      'Green Tea Accord is the ultimate "skin scent" — a meditative blend of steamed green tea, cucumber, and white musk that feels like freshly laundered linen and morning calm.',
    fragranceFamilies: ['Fresh', 'Aromatic'],
    concentration: 'Eau de Toilette',
    gender: 'Unisex',
    origin: 'Japan',
    launchYear: 2023,
    longevity: 'Light (2-4 hrs)',
    sillage: 'Soft',
    seasons: ['Spring', 'Summer'],
    occasions: ['Daytime', 'Meditation', 'Casual'],
    topNotes: ['Green Tea', 'Cucumber', 'Bergamot'],
    heartNotes: ['White Florals', 'Jasmine Rice', 'Vetiver'],
    baseNotes: ['White Musk', 'Cedarwood', 'Ambrette Seed'],
    variants: [
      { size: '100ml', sku: 'GT-100', price: 85, stock: 70, lowStockThreshold: 10 },
    ],
    status: 'published',
    isNewArrival: true,
    tags: ['green tea', 'clean', 'light', 'fresh'],
    collections: ['Everyday Essentials'],
    images: [{ url: IMAGES[8], publicId: '' }],
  },
  {
    name: 'Myrrh Mystique',
    slug: 'myrrh-mystique',
    shortDescription: 'Ancient myrrh resin reimagined with frankincense and dark rose.',
    fullDescription:
      'Myrrh Mystique draws from centuries-old incense traditions. Dry frankincense smoke opens the composition before a resinous myrrh accord takes centre stage, softened by a deep Bulgarian rose and labdanum base.',
    fragranceFamilies: ['Oriental', 'Resinous'],
    concentration: 'Extrait de Parfum',
    gender: 'Unisex',
    origin: 'Middle East',
    launchYear: 2021,
    longevity: 'Excellent (12+ hrs)',
    sillage: 'Heavy',
    seasons: ['Fall', 'Winter'],
    occasions: ['Evening', 'Special Occasion', 'Spiritual'],
    topNotes: ['Frankincense', 'Elemi', 'Cardamom'],
    heartNotes: ['Myrrh', 'Bulgarian Rose', 'Cistus'],
    baseNotes: ['Labdanum', 'Benzoin', 'Dark Musk', 'Oud'],
    variants: [
      { size: '30ml', sku: 'MM-30', price: 180, compareAtPrice: 210, stock: 20, lowStockThreshold: 3 },
      { size: '50ml', sku: 'MM-50', price: 280, stock: 10, lowStockThreshold: 2 },
    ],
    status: 'published',
    isFeatured: true,
    tags: ['myrrh', 'incense', 'resinous', 'luxury'],
    collections: ['Signature Collection', 'Luxury Line'],
    images: [{ url: IMAGES[9], publicId: '' }],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log('Connected to MongoDB');

  // Remove existing seed products to avoid duplicates
  const slugs = products.map((p) => p.slug);
  await Product.deleteMany({ slug: { $in: slugs } });
  console.log('Cleared existing seed products');

  const docs = products.map((p) => ({ ...p, createdBy: 'seed-script' }));
  const inserted = await Product.insertMany(docs);
  console.log(`Seeded ${inserted.length} products successfully`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
