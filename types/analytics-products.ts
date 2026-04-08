// ── Product Analytics Types ────────────────────────────────────────────────────

export type StockStatus    = 'in_stock' | 'low_stock' | 'out_of_stock';
export type TurnoverStatus = 'fast' | 'normal' | 'slow';

export interface ProductKPIData {
  totalActive: number;
  outOfStockVariants: number;
  lowStockVariants: number;
  totalUnitsSold: number;
  bestSellerName: string;
  bestSellerUnits: number;
  bestSellerSize: string;
  highestRevenueName: string;
  highestRevenue: number;
  lowestRevenueName: string;
  lowestRevenueUnits: number;
}

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  variants: string[];
  unitsSold: number;
  revenue: number;
  aov: number;
  stockQty: number;
  stock: StockStatus;
  trend: { v: number }[];
}

export interface CategoryPerf {
  category: string;
  revenue: number;
  units: number;
  orders: number;
  growth: number;   // % vs previous period
  pct: number;      // % of total category revenue
}

export interface SizeData {
  size: string;
  units: number;
  revenue: number;
  aov: number;
  pctUnits: number;
  pctRevenue: number;
}

export interface PairingRow {
  productA: string;
  productB: string;
  timesBought: number;
  revenue: number;
  coRate: number;
}

export interface NewArrivalRow {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
  launchDate: string;
  trend: { v: number }[];
}

export interface TurnoverRow {
  name: string;
  category: string;
  cogs: number;
  avgInventory: number;
  turnoverRate: number;
  daysToSell: number;
  status: TurnoverStatus;
}

export interface ProductsData {
  kpis: ProductKPIData;
  products: ProductRow[];
  categoryPerf: CategoryPerf[];
  sizeData: SizeData[];
  pairings: PairingRow[];
  newArrivals: NewArrivalRow[];
  newArrivalsRevenue: number;
  existingArrivalsRevenue: number;
  turnoverData: TurnoverRow[];
  avgTurnover: number;
}
