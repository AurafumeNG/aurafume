// ── Marketing Analytics Types ──────────────────────────────────────────────────

export type PromoStatus = 'Active' | 'Expired' | 'Disabled' | 'Draft' | 'Scheduled';
export type PromoType   = 'Percentage' | 'Fixed' | 'Free Shipping' | 'Buy X Get Y';

export interface MarketingKPIData {
  promoRevenue:        number;
  totalDiscount:       number;
  codeUsageCount:      number;
  discountRate:        number;    // % of total revenue discounted
  roi:                 number;    // promoRevenue / totalDiscount
  prevPromoRevenue:    number;
  prevTotalDiscount:   number;
  prevCodeUsageCount:  number;
  prevDiscountRate:    number;
  prevRoi:             number;
}

export interface PromoCodeRow {
  code:            string;
  type:            PromoType;
  discount:        string;        // "10%" or "₦5,000"
  uses:            number;
  limit:           number | null;
  uniqueCustomers: number;
  revenue:         number;
  discountGiven:   number;
  aovWithCode:     number;
  roi:             number;
  status:          PromoStatus;
  color:           string;
}

// Keys are dynamic: `${code}_uses`, `${code}_revenue`, `${code}_discount`, plus `date`
export type PromoDayPoint = Record<string, number | string>;

export interface DiscountImpactSide {
  aov:        number;
  orders:     number;
  revenue:    number;
  repeatRate: number;   // % of customers who ordered >1 time all-time
}

export interface RevenueSplitSlice {
  name:  string;
  value: number;
  pct:   number;
  color: string;
}

export interface DiscountImpactData {
  withCode:     DiscountImpactSide;
  noCode:       DiscountImpactSide;
  totalRevenue: number;
  revenueSplit: RevenueSplitSlice[];
}

export interface CodeUsageSplit {
  code:      string;
  color:     string;
  newPct:    number;
  returnPct: number;
}

export interface MarketingData {
  kpis:           MarketingKPIData;
  promoCodes:     PromoCodeRow[];
  topCodes:       PromoCodeRow[];    // active codes with uses > 0, up to 5
  promoDaily:     PromoDayPoint[];
  discountImpact: DiscountImpactData;
  codeUsageSplit: CodeUsageSplit[];
  overallSplit:   { newPct: number; returnPct: number };
  siteAov:        number;
}
