// ── Customer Analytics Mock Data ──────────────────────────────────────────────

// ── Customer growth over time ──────────────────────────────────────────────────

export const GROWTH_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-03-07');
  d.setDate(d.getDate() + i);
  const label = d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  const newCustomers = Math.floor(2 + (i % 7 === 5 ? 8 : i % 7 === 6 ? 5 : 2) + Math.floor(Math.sin(i) * 2));
  return { date: label, newCustomers: Math.max(1, newCustomers), total: 0 };
}).map((d, i, arr) => ({
  ...d,
  total: 1254 + arr.slice(0, i + 1).reduce((s, x) => s + x.newCustomers, 0),
}));

export const GROWTH_WEEKLY = [
  { date: 'W1 Mar', newCustomers: 18, total: 1272 },
  { date: 'W2 Mar', newCustomers: 22, total: 1294 },
  { date: 'W3 Mar', newCustomers: 20, total: 1314 },
  { date: 'W4 Mar', newCustomers: 26, total: 1340 },
];

export const GROWTH_MONTHLY = [
  { date: 'Aug 25', newCustomers: 68,  total: 920  },
  { date: 'Sep 25', newCustomers: 74,  total: 994  },
  { date: 'Oct 25', newCustomers: 88,  total: 1082 },
  { date: 'Nov 25', newCustomers: 102, total: 1184 },
  { date: 'Dec 25', newCustomers: 56,  total: 1240 },
  { date: 'Jan 26', newCustomers: 62,  total: 1254 },  // corrected — some churn
  { date: 'Feb 26', newCustomers: 70,  total: 1254 },
  { date: 'Mar 26', newCustomers: 86,  total: 1340 },
];

export const MILESTONES = [
  { label: '100th customer', total: 100, date: 'Apr 25' },
  { label: '500th customer', total: 500, date: 'Sep 25' },
  { label: '1000th customer',total: 1000,date: 'Dec 25' },
];

// ── New vs Returning monthly ───────────────────────────────────────────────────

export const NVR_MONTHLY = [
  { month: 'Sep 25', newCustomers: 74,  returning: 108, newRevenue: 1009000,  retRevenue: 831000  },
  { month: 'Oct 25', newCustomers: 88,  returning: 122, newRevenue: 1197000,  retRevenue: 979000  },
  { month: 'Nov 25', newCustomers: 102, returning: 146, newRevenue: 1385000,  retRevenue: 1250000 },
  { month: 'Dec 25', newCustomers: 56,  returning: 239, newRevenue: 760000,   retRevenue: 3090000 },
  { month: 'Jan 26', newCustomers: 62,  returning: 198, newRevenue: 843000,   retRevenue: 2397000 },
  { month: 'Feb 26', newCustomers: 70,  returning: 212, newRevenue: 952000,   retRevenue: 2638000 },
  { month: 'Mar 26', newCustomers: 86,  returning: 226, newRevenue: 2805000,  retRevenue: 1445000 },
];

export const NVR_METRICS = {
  new: { orders: 206, revenue: 2805000, aov: 13592, avgItems: 1.8 },
  ret: { orders: 106, revenue: 1445000, aov: 13679, avgItems: 2.4 },
};

// ── Retention cohort ──────────────────────────────────────────────────────────

export const RETENTION_COHORTS = [
  { cohort: 'Aug 25', values: [100, 28, 22, 18, 15, 13, 12, 10] },
  { cohort: 'Sep 25', values: [100, 30, 24, 19, 16, 14, 12, null] },
  { cohort: 'Oct 25', values: [100, 27, 21, 17, 14, 12, null, null] },
  { cohort: 'Nov 25', values: [100, 31, 25, 20, 16, null, null, null] },
  { cohort: 'Dec 25', values: [100, 26, 20, 16, null, null, null, null] },
  { cohort: 'Jan 26', values: [100, 29, 23, null, null, null, null, null] },
  { cohort: 'Feb 26', values: [100, 32, null, null, null, null, null, null] },
  { cohort: 'Mar 26', values: [100, null, null, null, null, null, null, null] },
];

// ── LTV distribution ──────────────────────────────────────────────────────────

export const LTV_HISTOGRAM = [
  { range: '₦0–5k',     count: 214 },
  { range: '₦5k–10k',   count: 312 },
  { range: '₦10k–25k',  count: 314 },
  { range: '₦25k–50k',  count: 240 },
  { range: '₦50k–100k', count: 150 },
  { range: '₦100k+',    count: 110 },
];

export const LTV_SEGMENTS = [
  { tier: 'Bronze', range: '₦0–₦25k',   customers: 840, pct: 63, revPct: 22, color: '#a78bfa' },
  { tier: 'Silver', range: '₦25k–₦100k',customers: 390, pct: 29, revPct: 37, color: 'rgba(192,192,192,0.90)' },
  { tier: 'Gold',   range: '₦100k+',    customers: 110, pct: 8,  revPct: 41, color: 'oklch(0.53 0.09 70)' },
];

// ── RFM Segments ──────────────────────────────────────────────────────────────

export const RFM_SEGMENTS = [
  { segment: 'Champions',          count: 84,  revenue: 1742000, desc: 'Bought recently, often, high value',       color: 'oklch(0.53 0.09 70)',  bg: 'rgba(180,130,60,0.12)'  },
  { segment: 'Loyal Customers',    count: 142, revenue: 1280000, desc: 'Buy regularly, responsive to offers',      color: '#4ade80',              bg: 'rgba(74,222,128,0.10)'  },
  { segment: 'Potential Loyalists',count: 198, revenue: 982000,  desc: 'Recent, moderate frequency',               color: '#60a5fa',              bg: 'rgba(96,165,250,0.10)'  },
  { segment: 'New Customers',      count: 86,  revenue: 620000,  desc: 'Bought recently, first time',              color: '#a78bfa',              bg: 'rgba(167,139,250,0.10)' },
  { segment: 'At Risk',            count: 214, revenue: 840000,  desc: 'Good customers, not bought lately',        color: '#facc15',              bg: 'rgba(250,204,21,0.10)'  },
  { segment: 'Lost Customers',     count: 616, revenue: 0,       desc: 'No purchase in 90+ days',                  color: '#f87171',              bg: 'rgba(248,113,113,0.10)' },
];

// ── Purchase frequency ────────────────────────────────────────────────────────

export const FREQ_DATA = [
  { label: '1 order',  customers: 840, pct: 63 },
  { label: '2 orders', customers: 280, pct: 21 },
  { label: '3 orders', customers: 134, pct: 10 },
  { label: '4+ orders',customers: 86,  pct: 6  },
];

// ── Geographic ────────────────────────────────────────────────────────────────

export const GEO_DATA = [
  { state: 'Lagos',        customers: 562, orders: 412, revenue: 1785000, aov: 4332 },
  { state: 'Abuja (FCT)', customers: 214, orders: 148, revenue: 680000,  aov: 4595 },
  { state: 'Port Harcourt',customers: 148, orders: 104, revenue: 467500,  aov: 4495 },
  { state: 'Ibadan',       customers: 107, orders: 76,  revenue: 340000,  aov: 4474 },
  { state: 'Kano',         customers: 80,  orders: 56,  revenue: 255000,  aov: 4554 },
  { state: 'Enugu',        customers: 67,  orders: 48,  revenue: 212500,  aov: 4427 },
  { state: 'Warri',        customers: 54,  orders: 38,  revenue: 170000,  aov: 4474 },
  { state: 'Kaduna',       customers: 40,  orders: 28,  revenue: 127500,  aov: 4554 },
  { state: 'Benin City',   customers: 40,  orders: 28,  revenue: 127500,  aov: 4554 },
  { state: 'Aba',          customers: 28,  orders: 20,  revenue: 85000,   aov: 4250 },
];

// ── Registration & Device ─────────────────────────────────────────────────────

export const REG_SOURCE = [
  { name: 'Web',    value: 78, color: 'oklch(0.53 0.09 70)' },
  { name: 'Mobile', value: 22, color: 'rgba(255,255,255,0.28)' },
];

export const VERIFY_STATUS = [
  { name: 'Verified',   value: 91, color: '#4ade80' },
  { name: 'Unverified', value: 9,  color: '#f87171' },
];

export const SIGNUP_TREND = GROWTH_DAILY.map((d) => ({
  date: d.date,
  signups: d.newCustomers,
}));

// ── Top customers ─────────────────────────────────────────────────────────────

export type CustomerSegmentLabel =
  | 'Champion'
  | 'Loyal'
  | 'Potential Loyalist'
  | 'New'
  | 'At Risk'
  | 'Lost';

export interface TopCustomer {
  rank: number;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  aov: number;
  lastOrder: string;
  segment: CustomerSegmentLabel;
}

export const TOP_CUSTOMERS: TopCustomer[] = [
  { rank: 1,  name: 'Amara Okafor',       email: 'amara@example.com',   totalOrders: 14, totalSpent: 294000, aov: 21000, lastOrder: 'Apr 5',  segment: 'Champion'          },
  { rank: 2,  name: 'Chidi Ezenwachi',    email: 'chidi@example.com',   totalOrders: 12, totalSpent: 252000, aov: 21000, lastOrder: 'Apr 3',  segment: 'Champion'          },
  { rank: 3,  name: 'Ngozi Eze',          email: 'ngozi@example.com',   totalOrders: 11, totalSpent: 220000, aov: 20000, lastOrder: 'Mar 30', segment: 'Champion'          },
  { rank: 4,  name: 'Emeka Obi',          email: 'emeka@example.com',   totalOrders: 10, totalSpent: 200000, aov: 20000, lastOrder: 'Apr 4',  segment: 'Champion'          },
  { rank: 5,  name: 'Fatima Abdullahi',   email: 'fatima@example.com',  totalOrders: 9,  totalSpent: 189000, aov: 21000, lastOrder: 'Apr 2',  segment: 'Champion'          },
  { rank: 6,  name: 'Adewale Adeyemi',    email: 'adewale@example.com', totalOrders: 8,  totalSpent: 168000, aov: 21000, lastOrder: 'Mar 28', segment: 'Loyal'             },
  { rank: 7,  name: 'Kemi Olonade',       email: 'kemi@example.com',    totalOrders: 8,  totalSpent: 160000, aov: 20000, lastOrder: 'Mar 26', segment: 'Loyal'             },
  { rank: 8,  name: 'Tunde Bello',        email: 'tunde@example.com',   totalOrders: 7,  totalSpent: 147000, aov: 21000, lastOrder: 'Apr 1',  segment: 'Loyal'             },
  { rank: 9,  name: 'Chioma Nwachukwu',   email: 'chioma@example.com',  totalOrders: 7,  totalSpent: 140000, aov: 20000, lastOrder: 'Mar 25', segment: 'Loyal'             },
  { rank: 10, name: 'Seun Akinola',       email: 'seun@example.com',    totalOrders: 6,  totalSpent: 126000, aov: 21000, lastOrder: 'Mar 22', segment: 'Loyal'             },
  { rank: 11, name: 'Yetunde Afolabi',    email: 'yetunde@example.com', totalOrders: 6,  totalSpent: 120000, aov: 20000, lastOrder: 'Apr 3',  segment: 'Potential Loyalist'},
  { rank: 12, name: 'Oluwaseun Ajayi',    email: 'oluseun@example.com', totalOrders: 5,  totalSpent: 110000, aov: 22000, lastOrder: 'Mar 29', segment: 'Potential Loyalist'},
  { rank: 13, name: 'Biodun Ogundimu',    email: 'biodun@example.com',  totalOrders: 5,  totalSpent: 105000, aov: 21000, lastOrder: 'Mar 20', segment: 'Potential Loyalist'},
  { rank: 14, name: 'Adeola Sanni',       email: 'adeola@example.com',  totalOrders: 5,  totalSpent: 100000, aov: 20000, lastOrder: 'Mar 18', segment: 'Potential Loyalist'},
  { rank: 15, name: 'Chinwe Okonkwo',     email: 'chinwe@example.com',  totalOrders: 4,  totalSpent: 88000,  aov: 22000, lastOrder: 'Apr 4',  segment: 'Potential Loyalist'},
  { rank: 16, name: 'Musa Ibrahim',       email: 'musa@example.com',    totalOrders: 4,  totalSpent: 84000,  aov: 21000, lastOrder: 'Mar 15', segment: 'At Risk'           },
  { rank: 17, name: 'Grace Okechukwu',    email: 'grace@example.com',   totalOrders: 4,  totalSpent: 80000,  aov: 20000, lastOrder: 'Mar 10', segment: 'At Risk'           },
  { rank: 18, name: 'Rotimi Adeleke',     email: 'rotimi@example.com',  totalOrders: 3,  totalSpent: 66000,  aov: 22000, lastOrder: 'Apr 5',  segment: 'New'               },
  { rank: 19, name: 'Ifeoma Obi',         email: 'ifeoma@example.com',  totalOrders: 3,  totalSpent: 63000,  aov: 21000, lastOrder: 'Mar 30', segment: 'Loyal'             },
  { rank: 20, name: 'Damilola Oladele',   email: 'dami@example.com',    totalOrders: 3,  totalSpent: 60000,  aov: 20000, lastOrder: 'Mar 27', segment: 'Potential Loyalist'},
];
