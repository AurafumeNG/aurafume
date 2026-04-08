// ── Customer Analytics Types ───────────────────────────────────────────────────

export type TopCustomerSegment = 'Champion' | 'Loyal' | 'Potential Loyalist' | 'New' | 'At Risk' | 'Lost';
export type RFMSegmentLabel    = 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'New Customers' | 'At Risk' | 'Lost Customers';

export interface CustomerKPIData {
  totalCustomers: number;
  newCustomers: number;
  returningRate: number;        // % of orders in period from repeat customers
  avgLTV: number;               // all-time avg lifetime value
  avgOrdersPerCustomer: number; // all-time
  churnRate: number;            // % of customers with no order in last 90 days
  // Previous period comparisons
  prevTotalCustomers: number;
  prevNewCustomers: number;
  prevReturningRate: number;
  prevAvgLTV: number;
}

export interface GrowthPoint {
  date: string;
  newCustomers: number;
  total: number;
}

export interface MilestonePoint {
  label: string;
  total: number;
  x: string;
}

export interface NVRMonthPoint {
  month: string;
  newCustomers: number;
  returning: number;
}

export interface NVRMetrics {
  new: { orders: number; revenue: number; aov: number; avgItems: number };
  ret: { orders: number; revenue: number; aov: number; avgItems: number };
}

export interface CohortRow {
  cohort: string;
  values: (number | null)[];
}

export interface LTVBucket {
  range: string;
  count: number;
}

export interface LTVSegment {
  tier: string;
  range: string;
  customers: number;
  pct: number;
  revPct: number;
  color: string;
}

export interface RFMSegment {
  segment: RFMSegmentLabel;
  count: number;
  revenue: number;
  desc: string;
  color: string;
  bg: string;
}

export interface FreqRow {
  label: string;
  customers: number;
  pct: number;
}

export interface GeoRow {
  state: string;
  customers: number;
  orders: number;
  revenue: number;
  aov: number;
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface SignupTrendPoint {
  date: string;
  signups: number;
}

export interface TopCustomer {
  rank: number;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  aov: number;
  lastOrder: string;
  segment: TopCustomerSegment;
}

export interface CustomersData {
  kpis: CustomerKPIData;
  growthDaily: GrowthPoint[];
  growthWeekly: GrowthPoint[];
  growthMonthly: GrowthPoint[];
  milestones: MilestonePoint[];
  nvrMonthly: NVRMonthPoint[];
  nvrMetrics: NVRMetrics;
  retentionCohorts: CohortRow[];
  ltvHistogram: LTVBucket[];
  ltvSegments: LTVSegment[];
  avgLTV: number;
  medianLTV: number;
  rfmSegments: RFMSegment[];
  freqData: FreqRow[];
  freqStats: { avgOrders: number; repeatRate: number };
  geoData: GeoRow[];
  regSource: DonutSlice[];
  verifyStatus: DonutSlice[];
  signupTrend: SignupTrendPoint[];
  signupStats: { avgDaily: number; peakDay: number; unverified: number };
  topCustomers: TopCustomer[];
}
