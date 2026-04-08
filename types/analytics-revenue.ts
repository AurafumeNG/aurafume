// ── Shared types for the Analytics Revenue API and its client components ────────

export interface RevenueTrendPoint {
  date:      string;
  gross:     number;   // pricing.subtotal (before discount)
  net:       number;   // pricing.total (what was paid)
  refunds:   number;   // refund amount on this date
  prevGross: number;
  prevNet:   number;
}

export interface PaymentMethodStat {
  method:      string;   // 'paystack' | 'bank-transfer'
  revenue:     number;
  orders:      number;
  aov:         number;
  successRate: number;   // always 100 for bank-transfer; Paystack estimated
}

export interface PaymentMethodMonthPoint {
  month:    string;
  paystack: number;
  bank:     number;
}

export interface DeliveryMethodStat {
  key:         string;   // 'express' | 'standard' | 'pickup'
  method:      string;   // display label
  orders:      number;
  revenue:     number;
  aov:         number;
  deliveryFee: number;
}

export interface AOVPoint {
  date: string;
  aov:  number;
}

export interface AOVBucket {
  range: string;
  count: number;
}

export interface TimingPoint {
  label:   string;
  revenue: number;
}

export interface RefundReason {
  reason: string;
  count:  number;
  amount: number;
}

export interface RefundPoint {
  date:   string;
  amount: number;
}

export interface RefundedOrder {
  id:       string;
  customer: string;
  amount:   number;
  reason:   string;
  date:     string;
}

export interface ForecastPoint {
  date:     string;
  actual:   number | null;
  forecast: number | null;
  upper:    number | null;
  lower:    number | null;
}

export interface CohortRow {
  cohort: string;
  values: (number | null)[];
}

export interface RevenueData {
  from:       string;
  to:         string;
  periodDays: number;

  kpis: {
    gross:             number;
    prevGross:         number;
    net:               number;
    prevNet:           number;
    discount:          number;
    prevDiscount:      number;
    refundsAmount:     number;
    prevRefundsAmount: number;
    refundsCount:      number;
    orders:            number;
    prevOrders:        number;
    aov:               number;
    prevAov:           number;
  };

  trendDaily:   RevenueTrendPoint[];
  trendWeekly:  RevenueTrendPoint[];
  trendMonthly: RevenueTrendPoint[];

  paymentStats:   PaymentMethodStat[];
  paymentMonthly: PaymentMethodMonthPoint[];

  deliveryStats: DeliveryMethodStat[];

  aovDaily:     AOVPoint[];
  aovHistogram: AOVBucket[];

  revenueByHour: TimingPoint[];
  revenueByDow:  TimingPoint[];

  refundKpis: {
    count:     number;
    amount:    number;
    rate:      number;
    avgAmount: number;
  };
  refundReasons:   RefundReason[];
  refundsOverTime: RefundPoint[];
  refundedOrders:  RefundedOrder[];

  forecastData: ForecastPoint[];
  forecastKpis: {
    projectedRevenue: number;
    projectedOrders:  number;
    growthPct:        number;
  };

  cohortMonths: string[];
  cohortData:   CohortRow[];
  cohortMax:    number;
}
