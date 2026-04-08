// ── Shared types for the Analytics Overview API and its client components ──────

export interface RevenuePoint {
  date:        string;
  revenue:     number;
  orders:      number;
  aov:         number;
  prevRevenue: number;
  prevOrders:  number;
}

export interface TopProductData {
  rank:        number;
  name:        string;
  variant:     string;
  unitsSold:   number;
  revenue:     number;
  pctOfTotal:  number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  trend:       { v: number }[];
}

export interface BreakdownItem {
  name:  string;
  value: number;
  pct:   number;
}

export interface StatusItem {
  status: string;
  count:  number;
  pct:    number;
}

export interface CategoryItem {
  name:    string;
  revenue: number;
  units:   number;
  pct:     number;
}

export interface StateItem {
  state:     string;
  revenue:   number;
  orders:    number;
  customers: number;
  pct:       number;
}

export interface OverviewEvent {
  type:   'revenue' | 'milestone' | 'product' | 'promo' | 'stock' | 'customer';
  date:   string;
  title:  string;
  detail: string;
}

export interface OverviewData {
  from:        string;
  to:          string;
  periodDays:  number;

  kpis: {
    revenue:     number;
    prevRevenue: number;
    orders:      number;
    prevOrders:  number;
    totalCustomers: number;
    newCustomers:   number;
    aov:         number;
    prevAov:     number;
  };

  sparklines: {
    revenue:   { v: number }[];
    orders:    { v: number }[];
    customers: { v: number }[];
    aov:       { v: number }[];
  };

  secondary: {
    repeatRate:     number;
    revPerCustomer: number;
    refundRate:     number;
  };

  revenueDaily:   RevenuePoint[];
  revenueWeekly:  RevenuePoint[];
  revenueMonthly: RevenuePoint[];

  paymentBreakdown:  BreakdownItem[];
  deliveryBreakdown: BreakdownItem[];

  statusDistribution: StatusItem[];
  avgFulfillmentDays: number;

  topProducts: TopProductData[];

  categories: CategoryItem[];

  customerSplit: {
    newCount:        number;
    returningCount:  number;
    newRevenue:      number;
    returningRevenue: number;
    totalCustomers:  number;
  };

  states: StateItem[];

  /** [dayIndex 0=Mon..6=Sun][hour 0..23] = order count */
  heatmap: number[][];

  marketing: {
    promoOrders:   number;
    totalDiscount: number;
    promoRevenue:  number;
    topCode:       string;
    topCodeUses:   number;
    topCodeLabel:  string;
  };

  events: OverviewEvent[];
}
