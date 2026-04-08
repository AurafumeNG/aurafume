// ── Product Analytics Mock Data ───────────────────────────────────────────────

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  variants: string[];
  unitsSold: number;
  revenue: number;
  aov: number;
  views: number;
  addToCartRate: number;   // %
  conversionRate: number;  // %
  wishlistCount: number;
  stock: StockStatus;
  stockQty: number;
  trend: { v: number }[];
  launchDate?: string;
  cogs: number;            // cost of goods sold
  avgInventory: number;    // average inventory value
}

export const PRODUCTS: ProductRow[] = [
  {
    id: 'p1',
    name: 'Noir Oud Intense',
    category: 'Woody',
    variants: ['30ml', '50ml', '100ml'],
    unitsSold: 58,
    revenue: 928000,
    aov: 16000,
    views: 3840,
    addToCartRate: 14.6,
    conversionRate: 7.2,
    wishlistCount: 312,
    stock: 'in_stock',
    stockQty: 42,
    trend: [{ v: 12 }, { v: 15 }, { v: 11 }, { v: 18 }, { v: 14 }, { v: 20 }, { v: 22 }],
    cogs: 371200,
    avgInventory: 252000,
  },
  {
    id: 'p2',
    name: 'Oud Royale',
    category: 'Woody',
    variants: ['50ml', '100ml'],
    unitsSold: 48,
    revenue: 960000,
    aov: 20000,
    views: 2980,
    addToCartRate: 13.2,
    conversionRate: 6.8,
    wishlistCount: 284,
    stock: 'in_stock',
    stockQty: 28,
    trend: [{ v: 8 }, { v: 10 }, { v: 9 }, { v: 13 }, { v: 11 }, { v: 14 }, { v: 16 }],
    cogs: 384000,
    avgInventory: 336000,
  },
  {
    id: 'p3',
    name: 'Rose Elixir',
    category: 'Floral',
    variants: ['30ml', '50ml'],
    unitsSold: 44,
    revenue: 704000,
    aov: 16000,
    views: 2640,
    addToCartRate: 11.8,
    conversionRate: 5.9,
    wishlistCount: 198,
    stock: 'low_stock',
    stockQty: 6,
    trend: [{ v: 8 }, { v: 10 }, { v: 9 }, { v: 11 }, { v: 10 }, { v: 12 }, { v: 11 }],
    cogs: 281600,
    avgInventory: 192000,
  },
  {
    id: 'p4',
    name: 'Cedarwood Dusk',
    category: 'Woody',
    variants: ['50ml', '100ml'],
    unitsSold: 38,
    revenue: 608000,
    aov: 16000,
    views: 2100,
    addToCartRate: 12.4,
    conversionRate: 6.1,
    wishlistCount: 156,
    stock: 'in_stock',
    stockQty: 35,
    trend: [{ v: 6 }, { v: 8 }, { v: 7 }, { v: 10 }, { v: 9 }, { v: 11 }, { v: 12 }],
    cogs: 243200,
    avgInventory: 196000,
  },
  {
    id: 'p5',
    name: 'Citrus Mirage',
    category: 'Citrus',
    variants: ['30ml', '50ml'],
    unitsSold: 31,
    revenue: 496000,
    aov: 16000,
    views: 1820,
    addToCartRate: 10.6,
    conversionRate: 5.2,
    wishlistCount: 112,
    stock: 'in_stock',
    stockQty: 51,
    trend: [{ v: 5 }, { v: 6 }, { v: 7 }, { v: 8 }, { v: 7 }, { v: 9 }, { v: 10 }],
    cogs: 198400,
    avgInventory: 163000,
  },
  {
    id: 'p6',
    name: 'White Jasmine Bloom',
    category: 'Floral',
    variants: ['30ml', '50ml'],
    unitsSold: 26,
    revenue: 416000,
    aov: 16000,
    views: 1540,
    addToCartRate: 9.8,
    conversionRate: 4.8,
    wishlistCount: 94,
    stock: 'out_of_stock',
    stockQty: 0,
    trend: [{ v: 4 }, { v: 5 }, { v: 4 }, { v: 6 }, { v: 5 }, { v: 7 }, { v: 7 }],
    cogs: 166400,
    avgInventory: 96000,
  },
  {
    id: 'p7',
    name: 'Amber Sands',
    category: 'Oriental',
    variants: ['50ml', '100ml'],
    unitsSold: 22,
    revenue: 352000,
    aov: 16000,
    views: 1280,
    addToCartRate: 9.2,
    conversionRate: 4.5,
    wishlistCount: 78,
    stock: 'in_stock',
    stockQty: 19,
    trend: [{ v: 3 }, { v: 4 }, { v: 4 }, { v: 5 }, { v: 4 }, { v: 6 }, { v: 6 }],
    cogs: 140800,
    avgInventory: 128000,
  },
  {
    id: 'p8',
    name: 'Fresh Linen',
    category: 'Fresh',
    variants: ['30ml', '50ml', '100ml'],
    unitsSold: 19,
    revenue: 304000,
    aov: 16000,
    views: 1140,
    addToCartRate: 8.8,
    conversionRate: 4.1,
    wishlistCount: 62,
    stock: 'in_stock',
    stockQty: 44,
    trend: [{ v: 3 }, { v: 3 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 5 }, { v: 6 }],
    cogs: 121600,
    avgInventory: 112000,
  },
  {
    id: 'p9',
    name: 'Saffron Dreams',
    category: 'Oriental',
    variants: ['50ml'],
    unitsSold: 14,
    revenue: 224000,
    aov: 16000,
    views: 960,
    addToCartRate: 7.4,
    conversionRate: 3.2,
    wishlistCount: 48,
    stock: 'low_stock',
    stockQty: 4,
    trend: [{ v: 2 }, { v: 2 }, { v: 3 }, { v: 3 }, { v: 3 }, { v: 4 }, { v: 4 }],
    cogs: 89600,
    avgInventory: 64000,
  },
  {
    id: 'p10',
    name: 'Green Vetiver',
    category: 'Fresh',
    variants: ['30ml', '50ml'],
    unitsSold: 11,
    revenue: 176000,
    aov: 16000,
    views: 820,
    addToCartRate: 6.8,
    conversionRate: 2.8,
    wishlistCount: 38,
    stock: 'in_stock',
    stockQty: 30,
    trend: [{ v: 2 }, { v: 2 }, { v: 2 }, { v: 3 }, { v: 2 }, { v: 3 }, { v: 3 }],
    cogs: 70400,
    avgInventory: 88000,
  },
  {
    id: 'p11',
    name: 'Tuberose Nocturne',
    category: 'Floral',
    variants: ['30ml'],
    unitsSold: 8,
    revenue: 128000,
    aov: 16000,
    views: 680,
    addToCartRate: 5.9,
    conversionRate: 2.2,
    wishlistCount: 28,
    stock: 'out_of_stock',
    stockQty: 0,
    trend: [{ v: 1 }, { v: 2 }, { v: 1 }, { v: 2 }, { v: 2 }, { v: 2 }, { v: 2 }],
    launchDate: '2026-03-08',
    cogs: 51200,
    avgInventory: 32000,
  },
  {
    id: 'p12',
    name: 'Patchouli Noir',
    category: 'Oriental',
    variants: ['50ml', '100ml'],
    unitsSold: 6,
    revenue: 96000,
    aov: 16000,
    views: 540,
    addToCartRate: 5.2,
    conversionRate: 1.8,
    wishlistCount: 21,
    stock: 'in_stock',
    stockQty: 22,
    trend: [{ v: 1 }, { v: 1 }, { v: 1 }, { v: 2 }, { v: 1 }, { v: 2 }, { v: 2 }],
    launchDate: '2026-02-14',
    cogs: 38400,
    avgInventory: 64000,
  },
];

// ── Category performance ───────────────────────────────────────────────────────

export const CATEGORY_PERF = [
  { category: 'Woody',    revenue: 2496000, units: 144, orders: 108, prevRevenue: 2100000, growth: 18.9 },
  { category: 'Floral',   revenue: 1248000, units: 78,  orders: 58,  prevRevenue: 1050000, growth: 18.9 },
  { category: 'Fresh',    revenue: 480000,  units: 30,  orders: 22,  prevRevenue: 415000,  growth: 15.7 },
  { category: 'Oriental', revenue: 672000,  units: 42,  orders: 31,  prevRevenue: 590000,  growth: 13.9 },
  { category: 'Citrus',   revenue: 496000,  units: 31,  orders: 24,  prevRevenue: 450000,  growth: 10.2 },
];

export const CATEGORY_DONUT = CATEGORY_PERF.map((c) => ({
  name: c.category,
  value: c.revenue,
  pct: Math.round((c.revenue / CATEGORY_PERF.reduce((s, x) => s + x.revenue, 0)) * 100),
}));

// ── Variant size analysis ─────────────────────────────────────────────────────

export const SIZE_DATA = [
  { size: '30ml', units: 98,  revenue: 980000,  aov: 10000, pctUnits: 28, pctRevenue: 20 },
  { size: '50ml', units: 188, revenue: 2068000, aov: 11000, pctUnits: 54, pctRevenue: 43 },
  { size: '100ml',units: 64,  revenue: 1280000, aov: 20000, pctUnits: 18, pctRevenue: 27 },
];

// ── Product view funnel ───────────────────────────────────────────────────────

export const FUNNEL_PRODUCTS = [
  { name: 'Noir Oud Intense', views: 3840, cart: 561, checkout: 382, purchased: 277 },
  { name: 'Oud Royale',       views: 2980, cart: 393, checkout: 268, purchased: 203 },
  { name: 'Rose Elixir',      views: 2640, cart: 311, checkout: 212, purchased: 156 },
  { name: 'Cedarwood Dusk',   views: 2100, cart: 260, checkout: 177, purchased: 128 },
  { name: 'Citrus Mirage',    views: 1820, cart: 193, checkout: 132, purchased: 95  },
];

export const FUNNEL_OVERALL = {
  viewsToCart:       12.4,
  cartToCheckout:    68.2,
  checkoutToPurchase:71.3,
  overall:            6.0,
};

// ── Product pairing ───────────────────────────────────────────────────────────

export const PAIRINGS = [
  { productA: 'Noir Oud Intense', productB: 'Oud Royale',       timesBought: 28, revenue: 1008000, coRate: 48.3 },
  { productA: 'Rose Elixir',      productB: 'White Jasmine',    timesBought: 19, revenue: 608000,  coRate: 43.2 },
  { productA: 'Cedarwood Dusk',   productB: 'Amber Sands',      timesBought: 14, revenue: 448000,  coRate: 36.8 },
  { productA: 'Citrus Mirage',    productB: 'Green Vetiver',    timesBought: 11, revenue: 352000,  coRate: 35.5 },
  { productA: 'Fresh Linen',      productB: 'Citrus Mirage',    timesBought: 9,  revenue: 288000,  coRate: 29.0 },
  { productA: 'Oud Royale',       productB: 'Saffron Dreams',   timesBought: 8,  revenue: 320000,  coRate: 57.1 },
];

// ── New arrivals ──────────────────────────────────────────────────────────────

export const NEW_ARRIVALS = PRODUCTS.filter((p) => p.launchDate);

// ── Inventory turnover ────────────────────────────────────────────────────────

export interface TurnoverRow {
  name: string;
  category: string;
  cogs: number;
  avgInventory: number;
  turnoverRate: number;
  daysToSell: number;
  status: 'fast' | 'normal' | 'slow';
}

export const TURNOVER_DATA: TurnoverRow[] = PRODUCTS.map((p) => {
  const rate = p.avgInventory > 0 ? parseFloat((p.cogs / p.avgInventory).toFixed(2)) : 0;
  return {
    name: p.name,
    category: p.category,
    cogs: p.cogs,
    avgInventory: p.avgInventory,
    turnoverRate: rate,
    daysToSell: rate > 0 ? Math.round(365 / rate) : 999,
    status: (rate >= 1.5 ? 'fast' : rate >= 0.8 ? 'normal' : 'slow') as 'fast' | 'normal' | 'slow',
  };
}).sort((a, b) => b.turnoverRate - a.turnoverRate);

export const AVG_TURNOVER = parseFloat(
  (TURNOVER_DATA.reduce((s, r) => s + r.turnoverRate, 0) / TURNOVER_DATA.length).toFixed(2)
);
