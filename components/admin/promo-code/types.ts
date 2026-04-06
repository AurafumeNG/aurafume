// ── Shared types for the Promo Code create / edit form ─────────────────────────

export type PromoDiscountType      = 'pct' | 'flat' | 'free-shipping' | 'buy-x-get-y';
export type PromoApplyTo           = 'order' | 'products' | 'categories';
export type PromoPaymentRestriction = 'all' | 'paystack' | 'bank-transfer';
export type PromoGetDiscount       = 'free' | 'half' | 'custom';

export interface PromoDraft {
  // ── Basic Info ─────────────────────────────────────────────────────────────
  code:        string;
  description: string;
  label:       string;

  // ── Discount Type & Value ──────────────────────────────────────────────────
  discountType:        PromoDiscountType;
  // pct
  pctValue:            number;
  hasPctCap:           boolean;
  pctCap:              number;
  // flat
  flatValue:           number;
  // free-shipping
  freeShippingStandard: boolean;
  freeShippingExpress:  boolean;
  // buy-x-get-y
  buyX:          number;
  getY:          number;
  getDiscount:   PromoGetDiscount;
  getCustomPct:  number;
  // where to apply
  applyTo:             PromoApplyTo;
  applyToProductIds:   string[];
  applyToCategoryIds:  string[];

  // ── Usage Limits ───────────────────────────────────────────────────────────
  hasMaxUses:          boolean;
  maxUses:             number;
  hasPerCustomerLimit: boolean;
  perCustomerLimit:    number;
  singleUse:           boolean;

  // ── Validity Period ────────────────────────────────────────────────────────
  validFrom:           string;  // date  yyyy-mm-dd
  validFromTime:       string;  // time  HH:mm
  hasExpiry:           boolean;
  expiresAt:           string;
  expiresAtTime:       string;
  autoDisableOnExpiry: boolean;

  // ── Eligibility ────────────────────────────────────────────────────────────
  hasMinOrder:              boolean;
  minOrderAmount:           number;
  hasMinItems:              boolean;
  minItems:                 number;
  firstOrderOnly:           boolean;
  newCustomersOnly:         boolean;
  newCustomerDays:          number;
  hasSpecificCustomers:     boolean;
  specificCustomerEmails:   string[];
  hasRequiredProducts:      boolean;
  requiredProductIds:       string[];
  hasPaymentRestriction:    boolean;
  paymentRestriction:       PromoPaymentRestriction;

  // ── Stackability ───────────────────────────────────────────────────────────
  combinableWithCodes: boolean;
  combinableWithSales: boolean;

  // ── Notifications ──────────────────────────────────────────────────────────
  hasUsageAlert:   boolean;
  usageAlertPct:   number;
  hasExpiryAlert:  boolean;
  expiryAlertDays: number;
  alertEmails:     string;
}

// ── Default empty form ─────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];

export const EMPTY_DRAFT: PromoDraft = {
  code:        '',
  description: '',
  label:       '',

  discountType:         'pct',
  pctValue:             10,
  hasPctCap:            false,
  pctCap:               5000,
  flatValue:            1000,
  freeShippingStandard: true,
  freeShippingExpress:  true,
  buyX:                 2,
  getY:                 1,
  getDiscount:          'free',
  getCustomPct:         50,
  applyTo:              'order',
  applyToProductIds:    [],
  applyToCategoryIds:   [],

  hasMaxUses:          false,
  maxUses:             100,
  hasPerCustomerLimit: true,
  perCustomerLimit:    1,
  singleUse:           false,

  validFrom:           today(),
  validFromTime:       '00:00',
  hasExpiry:           false,
  expiresAt:           '',
  expiresAtTime:       '23:59',
  autoDisableOnExpiry: true,

  hasMinOrder:             false,
  minOrderAmount:          20000,
  hasMinItems:             false,
  minItems:                2,
  firstOrderOnly:          false,
  newCustomersOnly:        false,
  newCustomerDays:         30,
  hasSpecificCustomers:    false,
  specificCustomerEmails:  [],
  hasRequiredProducts:     false,
  requiredProductIds:      [],
  hasPaymentRestriction:   false,
  paymentRestriction:      'all',

  combinableWithCodes: false,
  combinableWithSales: true,

  hasUsageAlert:   false,
  usageAlertPct:   80,
  hasExpiryAlert:  false,
  expiryAlertDays: 3,
  alertEmails:     '',
};
