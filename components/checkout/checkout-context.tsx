'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ── Delivery options ───────────────────────────────────────────────────────────

export interface DeliveryOption {
  id:       'outside-lagos' | 'within-lagos' | 'pickup';
  label:    string;
  desc:     string;
  duration: string;
  fee:      number;
  days:     number;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: 'outside-lagos', label: 'Outside Lagos',  desc: 'Nationwide delivery',                 duration: '3–5 business days',        fee: 5_500, days: 5 },
  { id: 'within-lagos',  label: 'Within Lagos',   desc: 'Standard delivery',                   duration: '0–2 business days',        fee: 3_000, days: 2 },
  { id: 'pickup',        label: 'Store Pickup',    desc: 'Pick up from our Lagos Island store', duration: 'Ready for collection today', fee: 0,     days: 0 },
];

// ── Payment methods ────────────────────────────────────────────────────────────

export type PaymentMethodId = 'bank-transfer' | 'paystack';

export interface PaymentMethod {
  id:    PaymentMethodId;
  label: string;
  desc:  string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'bank-transfer', label: 'Bank Transfer',      desc: 'Pay directly via instant bank transfer'       },
  { id: 'paystack',      label: 'Paystack Checkout',  desc: 'Pay securely with card, bank, or USSD'        },
];

// ── Summary shapes (populated as user fills in sections) ──────────────────────

export interface ContactSummary {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
}

export interface AddressSummary {
  street:  string;
  apt:     string;
  city:    string;
  state:   string;
  country: string;
}

// ── Context shape ──────────────────────────────────────────────────────────────

interface CheckoutContextValue {
  deliveryOption:    DeliveryOption | null;
  setDeliveryOption: (o: DeliveryOption) => void;
  deliveryFee:       number;

  paymentMethod:    PaymentMethod | null;
  setPaymentMethod: (m: PaymentMethod) => void;

  contactSummary:    ContactSummary | null;
  setContactSummary: (s: ContactSummary) => void;

  addressSummary:    AddressSummary | null;
  setAddressSummary: (s: AddressSummary) => void;
}

const CheckoutContext = createContext<CheckoutContextValue>({
  deliveryOption: null, setDeliveryOption: () => {}, deliveryFee: 0,
  paymentMethod: null,  setPaymentMethod:  () => {},
  contactSummary: null, setContactSummary: () => {},
  addressSummary: null, setAddressSummary: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [deliveryOption, setDeliveryOptionState] = useState<DeliveryOption | null>(null);
  const [paymentMethod,  setPaymentMethodState]  = useState<PaymentMethod | null>(null);
  const [contactSummary, setContactSummaryState] = useState<ContactSummary | null>(null);
  const [addressSummary, setAddressSummaryState] = useState<AddressSummary | null>(null);

  const setDeliveryOption = useCallback((o: DeliveryOption) => setDeliveryOptionState(o), []);
  const setPaymentMethod  = useCallback((m: PaymentMethod)  => setPaymentMethodState(m),  []);
  const setContactSummary = useCallback((s: ContactSummary) => setContactSummaryState(s), []);
  const setAddressSummary = useCallback((s: AddressSummary) => setAddressSummaryState(s), []);

  return (
    <CheckoutContext.Provider value={{
      deliveryOption, setDeliveryOption, deliveryFee: deliveryOption?.fee ?? 0,
      paymentMethod,  setPaymentMethod,
      contactSummary, setContactSummary,
      addressSummary, setAddressSummary,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  return useContext(CheckoutContext);
}
