import { NextResponse }   from 'next/server';
import connectDB          from '@/lib/mongodb';
import Product            from '@/models/Product';
import type { ApiResponse } from '@/types/auth';
import type { CollectionFilterId } from '@/components/shop/collections-filter-bar';

// ── Shape returned to the client ──────────────────────────────────────
export interface CollectionSummary {
  id:          CollectionFilterId;
  name:        string;
  description: string;
  image:       string;   // first product image in this group
  itemCount:   number;
  featured:    boolean;
  href:        string;
}

// ── Lean product fields we actually need ──────────────────────────────
interface LeanProduct {
  fragranceFamilies: string[];
  occasions:         string[];
  collections:       string[];
  isNewArrival:      boolean;
  isBestSeller:      boolean;
  isFeatured:        boolean;
  images:            { url: string }[];
}

// ── Collection spec table ─────────────────────────────────────────────
interface CollectionSpec {
  id:          CollectionFilterId;
  name:        string;
  description: string;
  featured:    boolean;
  match:       (p: LeanProduct) => boolean;
}

const SPECS: CollectionSpec[] = [
  // ── By Fragrance Family ──────────────────────────────────────────
  {
    id:          'floral',
    name:        'Floral',
    description: 'Soft petals, garden freshness, and feminine grace',
    featured:    true,
    match:       p => p.fragranceFamilies.some(f => f.toLowerCase() === 'floral'),
  },
  {
    id:          'woody',
    name:        'Woody',
    description: 'Earthy depths, smoky resins, and quiet power',
    featured:    false,
    match:       p => p.fragranceFamilies.some(f => f.toLowerCase() === 'woody'),
  },
  {
    id:          'fresh',
    name:        'Fresh',
    description: 'Ocean breeze, crisp air, and effortless cleanliness',
    featured:    false,
    match:       p => p.fragranceFamilies.some(f => f.toLowerCase() === 'fresh'),
  },
  {
    id:          'oriental',
    name:        'Oriental',
    description: 'Spice routes, amber warmth, and sensual mystery',
    featured:    true,
    match:       p => p.fragranceFamilies.some(f => f.toLowerCase() === 'oriental'),
  },
  {
    id:          'citrus',
    name:        'Citrus',
    description: 'Bright zest and Mediterranean vibrancy in a bottle',
    featured:    false,
    match:       p => p.fragranceFamilies.some(f => f.toLowerCase() === 'citrus'),
  },

  // ── By Mood / Occasion ───────────────────────────────────────────
  {
    id:          'office',
    name:        'Office Hours',
    description: 'Confident, understated scents for the professional',
    featured:    false,
    match:       p => p.occasions.some(o => o.toLowerCase() === 'office'),
  },
  {
    id:          'evening',
    name:        'Evening Affairs',
    description: 'Bold, memorable signatures for after dark',
    featured:    true,
    match:       p => p.occasions.some(o => o.toLowerCase() === 'evening'),
  },
  {
    id:          'daily',
    name:        'Daily Wear',
    description: 'Easy, wearable scents for every single day',
    featured:    false,
    match:       p => p.occasions.some(o => o.toLowerCase() === 'daily'),
  },
  {
    id:          'special-occasion',
    name:        'Special Occasion',
    description: "Unforgettable signatures for life's big moments",
    featured:    false,
    match:       p => p.occasions.some(o => o.toLowerCase() === 'special occasion'),
  },

  // ── Curated ──────────────────────────────────────────────────────
  {
    id:          'new-arrivals',
    name:        'New Arrivals',
    description: 'The latest additions to the Aurafümeng family',
    featured:    true,
    match:       p => p.isNewArrival,
  },
  {
    id:          'best-sellers',
    name:        'Best Sellers',
    description: 'Our most-loved scents, chosen by you',
    featured:    false,
    match:       p => p.isBestSeller,
  },
  {
    id:          'gift-sets',
    name:        'Gift Sets',
    description: 'Curated pairings wrapped in signature boxes',
    featured:    false,
    match:       p => p.collections.some(c => c.toLowerCase() === 'gift-sets'),
  },
  {
    id:          'luxury-edit',
    name:        'The Luxury Edit',
    description: "Ultra-rare extraits and collector's editions",
    featured:    true,
    match:       p => p.isFeatured || p.collections.some(c => c.toLowerCase() === 'luxury-edit'),
  },
];

// ── Route ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      status:        'published',
      visibleInShop: true,
    })
      .select('fragranceFamilies occasions collections isNewArrival isBestSeller isFeatured images')
      .lean<LeanProduct[]>();

    const summaries: CollectionSummary[] = [];

    for (const spec of SPECS) {
      const matched = products.filter(spec.match);
      if (matched.length === 0) continue;

      // Use the first available product image as the collection cover
      const coverImage = matched.find(p => p.images?.[0]?.url)?.images[0].url ?? '';

      summaries.push({
        id:          spec.id,
        name:        spec.name,
        description: spec.description,
        image:       coverImage,
        itemCount:   matched.length,
        featured:    spec.featured,
        href:        `/collections/${spec.id}`,
      });
    }

    return NextResponse.json<ApiResponse<CollectionSummary[]>>({
      success: true,
      data:    summaries,
    });
  } catch (err) {
    console.error('[api/collections GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
