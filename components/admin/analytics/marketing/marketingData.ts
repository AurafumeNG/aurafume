// ── Marketing Analytics Mock Data ─────────────────────────────────────────────

// ── Promo codes ───────────────────────────────────────────────────────────────

export type PromoStatus = 'Active' | 'Expired' | 'Disabled';
export type PromoType   = 'Percentage' | 'Fixed' | 'Free Shipping';

export interface PromoCode {
  code:            string;
  type:            PromoType;
  discount:        string;   // e.g. "10%" or "₦2,000"
  uses:            number;
  limit:           number | null;
  uniqueCustomers: number;
  revenue:         number;
  discountGiven:   number;
  aovWithCode:     number;
  aovSiteAvg:      number;
  conversionRate:  number;   // % applied → completed
  roi:             number;   // revenue / discountGiven
  status:          PromoStatus;
  color:           string;   // for chart line
}

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME10',      type: 'Percentage',   discount: '10%',
    uses: 98,  limit: null, uniqueCustomers: 91,
    revenue: 3420000, discountGiven: 380000, aovWithCode: 34898, aovSiteAvg: 28000,
    conversionRate: 84, roi: 9.0, status: 'Active',  color: 'oklch(0.53 0.09 70)',
  },
  {
    code: 'AURA20',         type: 'Percentage',   discount: '20%',
    uses: 62,  limit: 100, uniqueCustomers: 56,
    revenue: 1890000, discountGiven: 472500, aovWithCode: 30484, aovSiteAvg: 28000,
    conversionRate: 78, roi: 4.0, status: 'Active',  color: '#4ade80',
  },
  {
    code: 'LUXURY50',       type: 'Fixed',        discount: '₦5,000',
    uses: 34,  limit: 50,  uniqueCustomers: 30,
    revenue: 1680000, discountGiven: 170000, aovWithCode: 49412, aovSiteAvg: 28000,
    conversionRate: 52, roi: 9.9, status: 'Active',  color: '#60a5fa',
  },
  {
    code: 'SCENT15',        type: 'Percentage',   discount: '15%',
    uses: 40,  limit: 60,  uniqueCustomers: 38,
    revenue: 1020000, discountGiven: 180000, aovWithCode: 25500, aovSiteAvg: 28000,
    conversionRate: 72, roi: 5.7, status: 'Active',  color: '#a78bfa',
  },
  {
    code: 'BIRTHDAY30',     type: 'Percentage',   discount: '30%',
    uses: 14,  limit: 20,  uniqueCustomers: 14,
    revenue: 390000,  discountGiven: 37500,  aovWithCode: 27857, aovSiteAvg: 28000,
    conversionRate: 90, roi: 10.4, status: 'Active',  color: '#fb923c',
  },
  {
    code: 'FLASH25',        type: 'Percentage',   discount: '25%',
    uses: 0,   limit: 200, uniqueCustomers: 0,
    revenue: 0,       discountGiven: 0,      aovWithCode: 0,     aovSiteAvg: 28000,
    conversionRate: 0,  roi: 0,   status: 'Disabled', color: 'rgba(255,255,255,0.25)',
  },
  {
    code: 'SUMMER20',       type: 'Percentage',   discount: '20%',
    uses: 0,   limit: 150, uniqueCustomers: 0,
    revenue: 0,       discountGiven: 0,      aovWithCode: 0,     aovSiteAvg: 28000,
    conversionRate: 0,  roi: 0,   status: 'Expired',  color: 'rgba(255,255,255,0.18)',
  },
];

// Active top-5 codes for chart
export const TOP_CODES = PROMO_CODES.filter((c) => c.status === 'Active' && c.uses > 0);

// ── Daily usage per code (30 days, Mar 7 – Apr 5) ────────────────────────────

function genDate(i: number): string {
  const d = new Date('2026-03-07');
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

// Uses seeded formula to avoid hydration mismatch
function seed(codeIdx: number, day: number): number {
  return Math.max(0, Math.floor(((codeIdx * 7 + day * 13) % 11) - 3 + (day % 5 === 0 ? 4 : 0)));
}

const AOV_BY_CODE: Record<string, number> = {
  WELCOME10:  34898,
  AURA20:     30484,
  LUXURY50:   49412,
  SCENT15:    25500,
  BIRTHDAY30: 27857,
};

const DISCOUNT_PCT: Record<string, number> = {
  WELCOME10:  0.10,
  AURA20:     0.20,
  LUXURY50:   0.114, // ₦5000 / ~₦44000
  SCENT15:    0.15,
  BIRTHDAY30: 0.30,
};

export const PROMO_DAILY = Array.from({ length: 30 }, (_, i) => {
  const date = genDate(i);
  const row: Record<string, number | string> = { date };
  TOP_CODES.forEach((code, ci) => {
    const uses         = seed(ci, i);
    const revenue      = uses * AOV_BY_CODE[code.code];
    const discountAmt  = Math.round(revenue * DISCOUNT_PCT[code.code]);
    row[`${code.code}_uses`]     = uses;
    row[`${code.code}_revenue`]  = revenue;
    row[`${code.code}_discount`] = discountAmt;
  });
  return row;
});

// ── Discount impact ───────────────────────────────────────────────────────────

export const DISCOUNT_IMPACT = {
  withCode: {
    aov:            34898,
    completionRate: 79,
    repeatRate:     46,
    orders:         248,
    revenue:        1240000,
  },
  noCode: {
    aov:            26200,
    completionRate: 68,
    repeatRate:     32,
    orders:         812,
    revenue:        3010000,
  },
  totalRevenue: 4250000,
};

export const REVENUE_SPLIT = [
  { name: 'Organic (no code)',    value: 3010000, pct: 71, color: 'rgba(255,255,255,0.22)' },
  { name: 'Promoted (with code)', value: 1240000, pct: 29, color: 'oklch(0.53 0.09 70)'    },
];

// ── First vs repeat use ───────────────────────────────────────────────────────

export const CODE_USAGE_SPLIT = TOP_CODES.map((code) => ({
  code:       code.code,
  color:      code.color,
  newPct:     code.code === 'WELCOME10' ? 88
            : code.code === 'AURA20'    ? 64
            : code.code === 'LUXURY50'  ? 50
            : code.code === 'SCENT15'   ? 58
            : 71,
  returnPct:  code.code === 'WELCOME10' ? 12
            : code.code === 'AURA20'    ? 36
            : code.code === 'LUXURY50'  ? 50
            : code.code === 'SCENT15'   ? 42
            : 29,
}));

export const OVERALL_SPLIT = { newPct: 72, returnPct: 28 };

// ── Failed promo attempts ─────────────────────────────────────────────────────

export const FAILURE_REASONS = [
  { reason: 'Minimum spend not met', count: 182, pct: 42, color: '#f87171' },
  { reason: 'Already used',          count: 121, pct: 28, color: '#fb923c' },
  { reason: 'Code expired',          count:  78, pct: 18, color: '#facc15' },
  { reason: 'Not eligible',          count:  52, pct: 12, color: 'rgba(255,255,255,0.30)' },
];

export const FAILURE_BY_CODE = [
  { code: 'LUXURY50',   totalAttempts: 93,  failed: 63, failRate: 68 },
  { code: 'SCENT15',    totalAttempts: 72,  failed: 32, failRate: 44 },
  { code: 'AURA20',     totalAttempts: 98,  failed: 36, failRate: 37 },
  { code: 'BIRTHDAY30', totalAttempts: 21,  failed:  7, failRate: 33 },
  { code: 'WELCOME10',  totalAttempts: 142, failed: 44, failRate: 31 },
];

// ── Email campaigns ───────────────────────────────────────────────────────────

export interface EmailCampaign {
  name:         string;
  date:         string;
  sent:         number;
  delivered:    number;
  opened:       number;
  clicked:      number;
  converted:    number;
  revenue:      number;
}

export const EMAIL_CAMPAIGNS: EmailCampaign[] = [
  {
    name: 'March New Arrivals',  date: 'Mar 3',
    sent: 1340, delivered: 1302, opened: 468, clicked: 118, converted: 42, revenue: 1176000,
  },
  {
    name: 'WELCOME10 Blast',     date: 'Mar 10',
    sent: 1340, delivered: 1298, opened: 520, clicked: 156, converted: 58, revenue: 1624000,
  },
  {
    name: 'Re-engagement',       date: 'Mar 20',
    sent: 616,  delivered: 598,  opened: 132, clicked:  28, converted:  9, revenue:  252000,
  },
  {
    name: 'April Preview',       date: 'Apr 1',
    sent: 1340, delivered: 1318, opened: 492, clicked: 136, converted: 38, revenue: 1064000,
  },
];

// Time-series for email chart (one entry per campaign)
export const EMAIL_TREND = EMAIL_CAMPAIGNS.map((c) => ({
  campaign:   c.name.length > 16 ? c.name.slice(0, 15) + '…' : c.name,
  openRate:   Math.round((c.opened    / c.delivered) * 100),
  clickRate:  Math.round((c.clicked   / c.delivered) * 100),
  convRate:   Math.round((c.converted / c.delivered) * 100),
  revenue:    c.revenue,
}));

// ── Wishlist funnel ───────────────────────────────────────────────────────────

export const WISHLIST_FUNNEL = [
  { stage: 'Products Wishlisted',       count: 1840, pct: 100 },
  { stage: 'Added to Cart',             count:  620, pct: 33.7 },
  { stage: 'Completed Purchase',        count:  490, pct: 79.0 }, // % of prev stage
  { stage: 'Wishlist → Purchase',       count:  490, pct: 26.6 }, // overall
];

export const TOP_WISHLISTED = [
  { product: 'Oud Royale EDP 100ml',     wishlistCount: 148, purchaseRate: 41 },
  { product: 'Amber Noir EDP 50ml',      wishlistCount: 124, purchaseRate: 38 },
  { product: 'Santal Collection Set',    wishlistCount: 112, purchaseRate: 22 },
  { product: 'Rose Oud Intense 75ml',    wishlistCount:  98, purchaseRate: 29 },
  { product: 'Velvet Musk EDP 100ml',    wishlistCount:  87, purchaseRate: 16 },
  { product: 'Citrus Bloom EDT 50ml',    wishlistCount:  74, purchaseRate: 52 },
  { product: 'Patchouli Dark EDP 75ml',  wishlistCount:  68, purchaseRate: 12 },
  { product: 'Gold Collection Gift Set', wishlistCount:  62, purchaseRate: 19 },
];
