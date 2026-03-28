'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  scentFamily: string;
  image: string;
  size: string;
  pricePerUnit: number;
  qty: number;
}

export type CartItemInput = Omit<CartItem, 'qty'> & { qty?: number };

export interface AppliedCoupon {
  code: string;
  label: string;           // e.g. "10% off"
  discountAmount: number;  // computed flat amount off cartTotal
}

export interface GiftOptions {
  isGift: boolean;
  message: string;
  wrapping: boolean;       // adds GIFT_WRAP_FEE
  hidePrice: boolean;
}

export const GIFT_WRAP_FEE = 2_500; // ₦2,500

// ── Mock coupon table ──────────────────────────────────────────────────────────
// Replace with a real API call when the backend is ready.

interface CouponDef {
  type: 'pct' | 'flat';
  value: number;       // % or flat ₦
  label: string;
}

const VALID_COUPONS: Record<string, CouponDef> = {
  AURA10:    { type: 'pct',  value: 10,    label: '10% off'        },
  WELCOME15: { type: 'pct',  value: 15,    label: '15% off'        },
  FIRST5K:   { type: 'flat', value: 5_000, label: '₦5,000 off'     },
};

function computeDiscount(def: CouponDef, total: number): number {
  if (def.type === 'pct')  return Math.round(total * def.value / 100);
  return Math.min(def.value, total); // flat — never exceed total
}

// ── Context shape ──────────────────────────────────────────────────────────────

interface CartContextValue {
  items:        CartItem[];
  savedItems:   CartItem[];
  cartCount:    number;
  cartTotal:    number;       // raw subtotal (no discounts / fees)
  lastAddedAt:  number;

  appliedCoupon:   AppliedCoupon | null;
  couponStatus:    'idle' | 'loading' | 'success' | 'error';
  applyCoupon:     (code: string) => Promise<void>;
  removeCoupon:    () => void;

  giftOptions:     GiftOptions;
  setGiftOptions:  (patch: Partial<GiftOptions>) => void;

  addToCart:       (input: CartItemInput) => void;
  removeFromCart:  (productId: string, size: string) => void;
  updateQty:       (productId: string, size: string, qty: number) => void;
  saveForLater:    (productId: string, size: string) => void;
  moveToCart:      (productId: string, size: string) => void;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_GIFT: GiftOptions = {
  isGift: false, message: '', wrapping: false, hidePrice: false,
};

const CartContext = createContext<CartContextValue>({
  items: [], savedItems: [], cartCount: 0, cartTotal: 0, lastAddedAt: 0,
  appliedCoupon: null, couponStatus: 'idle',
  applyCoupon: async () => {}, removeCoupon: () => {},
  giftOptions: DEFAULT_GIFT, setGiftOptions: () => {},
  addToCart: () => {}, removeFromCart: () => {}, updateQty: () => {},
  saveForLater: () => {}, moveToCart: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,        setItems]       = useState<CartItem[]>([]);
  const [savedItems,   setSavedItems]  = useState<CartItem[]>([]);
  const [lastAddedAt,  setLastAddedAt] = useState(0);

  const [appliedCoupon,  setAppliedCoupon]  = useState<AppliedCoupon | null>(null);
  const [couponStatus,   setCouponStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [giftOptions, setGiftOptionsState] = useState<GiftOptions>(DEFAULT_GIFT);

  const cartCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const cartTotal = useMemo(() => items.reduce((s, i) => s + i.pricePerUnit * i.qty, 0), [items]);

  // ── Cart mutations ─────────────────────────────────────────────────────────

  const addToCart = useCallback((input: CartItemInput) => {
    const qty = input.qty ?? 1;
    setItems(prev => {
      const idx = prev.findIndex(
        i => i.productId === input.productId && i.size === input.size,
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, { ...input, qty }];
    });
    setLastAddedAt(Date.now());
  }, []);

  const removeFromCart = useCallback((productId: string, size: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)));
  }, []);

  const updateQty = useCallback((productId: string, size: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)));
    } else {
      setItems(prev =>
        prev.map(i =>
          i.productId === productId && i.size === size ? { ...i, qty } : i,
        ),
      );
    }
  }, []);

  const saveForLater = useCallback((productId: string, size: string) => {
    setItems(prev => {
      const item = prev.find(i => i.productId === productId && i.size === size);
      if (!item) return prev;
      setSavedItems(s => {
        const exists = s.some(i => i.productId === productId && i.size === size);
        return exists ? s : [...s, { ...item, qty: 1 }];
      });
      return prev.filter(i => !(i.productId === productId && i.size === size));
    });
  }, []);

  const moveToCart = useCallback((productId: string, size: string) => {
    setSavedItems(prev => {
      const item = prev.find(i => i.productId === productId && i.size === size);
      if (!item) return prev;
      setItems(cart => {
        const idx = cart.findIndex(i => i.productId === productId && i.size === size);
        if (idx >= 0) {
          const updated = [...cart];
          updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
          return updated;
        }
        return [...cart, { ...item, qty: 1 }];
      });
      setLastAddedAt(Date.now());
      return prev.filter(i => !(i.productId === productId && i.size === size));
    });
  }, []);

  // ── Coupon ─────────────────────────────────────────────────────────────────

  const applyCoupon = useCallback(async (code: string) => {
    setCouponStatus('loading');
    // Simulate network latency
    await new Promise(r => setTimeout(r, 800));

    const def = VALID_COUPONS[code.trim().toUpperCase()];
    if (!def) {
      setCouponStatus('error');
      setAppliedCoupon(null);
      return;
    }
    // Snapshot cartTotal at the moment of application
    setItems(current => {
      const total = current.reduce((s, i) => s + i.pricePerUnit * i.qty, 0);
      setAppliedCoupon({
        code: code.trim().toUpperCase(),
        label: def.label,
        discountAmount: computeDiscount(def, total),
      });
      return current; // no change to items
    });
    setCouponStatus('success');
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponStatus('idle');
  }, []);

  // ── Gift options ───────────────────────────────────────────────────────────

  const setGiftOptions = useCallback((patch: Partial<GiftOptions>) => {
    setGiftOptionsState(prev => ({ ...prev, ...patch }));
  }, []);

  return (
    <CartContext.Provider value={{
      items, savedItems, cartCount, cartTotal, lastAddedAt,
      appliedCoupon, couponStatus, applyCoupon, removeCoupon,
      giftOptions, setGiftOptions,
      addToCart, removeFromCart, updateQty, saveForLater, moveToCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
