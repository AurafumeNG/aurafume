'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ── Delivery options — single source of truth ──────────────────────────────────

export interface DeliveryOption {
  id:       'outside-lagos' | 'within-lagos' | 'pickup';
  label:    string;
  desc:     string;
  duration: string;
  fee:      number;
  days:     number;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id:       'outside-lagos',
    label:    'Outside Lagos',
    desc:     'Nationwide delivery',
    duration: '3–5 business days',
    fee:      5_500,
    days:     5,
  },
  {
    id:       'within-lagos',
    label:    'Within Lagos',
    desc:     'Standard delivery',
    duration: '0–2 business days',
    fee:      3_000,
    days:     2,
  },
  {
    id:       'pickup',
    label:    'Store Pickup',
    desc:     'Pick up from our Lagos Island store',
    duration: 'Ready for collection today',
    fee:      0,
    days:     0,
  },
];

// ── Payment methods — single source of truth ───────────────────────────────────

export type PaymentMethodId = 'bank-transfer' | 'paystack';

export interface PaymentMethod {
  id:    PaymentMethodId;
  label: string;
  desc:  string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id:    'bank-transfer',
    label: 'Bank Transfer',
    desc:  'Pay directly via instant bank transfer',
  },
  {
    id:    'paystack',
    label: 'Paystack Checkout',
    desc:  'Pay securely with card, bank, or USSD',
  },
];

// ── Context shape ──────────────────────────────────────────────────────────────

interface CheckoutContextValue {
  deliveryOption:    DeliveryOption | null;
  setDeliveryOption: (option: DeliveryOption) => void;
  deliveryFee:       number;

  paymentMethod:    PaymentMethod | null;
  setPaymentMethod: (method: PaymentMethod) => void;
}

const CheckoutContext = createContext<CheckoutContextValue>({
  deliveryOption:    null,
  setDeliveryOption: () => {},
  deliveryFee:       0,
  paymentMethod:     null,
  setPaymentMethod:  () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [deliveryOption, setDeliveryOptionState] = useState<DeliveryOption | null>(null);
  const [paymentMethod,  setPaymentMethodState]  = useState<PaymentMethod | null>(null);

  const setDeliveryOption = useCallback((option: DeliveryOption) => {
    setDeliveryOptionState(option);
  }, []);

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setPaymentMethodState(method);
  }, []);

  return (
    <CheckoutContext.Provider value={{
      deliveryOption,
      setDeliveryOption,
      deliveryFee: deliveryOption?.fee ?? 0,
      paymentMethod,
      setPaymentMethod,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  return useContext(CheckoutContext);
}
