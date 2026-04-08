'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

// ── localStorage helpers (SSR-safe) ────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

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
  discountAmount: number;  // computed flat amount off cartTotal (0 for free-shipping)
  type: string;            // 'pct' | 'flat' | 'free-shipping' | 'buy-x-get-y'
}

export interface GiftOptions {
  isGift: boolean;
  message: string;
  wrapping: boolean;       // adds GIFT_WRAP_FEE
  hidePrice: boolean;
}

export const GIFT_WRAP_FEE = 2_500; // ₦2,500

// (Coupon validation is now handled server-side via POST /api/coupons/validate)

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
  clearCart:       () => void;
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
  saveForLater: () => {}, moveToCart: () => {}, clearCart: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [giftOptions, setGiftOptionsState] = useState<GiftOptions>(DEFAULT_GIFT);

  // ── Hydrate from localStorage after mount (avoids SSR/client mismatch) ────────

  useEffect(() => {
    setItems(load<CartItem[]>('aura:cart', []));
    setSavedItems(load<CartItem[]>('aura:saved', []));
    const coupon = load<AppliedCoupon | null>('aura:coupon', null);
    setAppliedCoupon(coupon);
    setCouponStatus(coupon ? 'success' : 'idle');
    setGiftOptionsState(load<GiftOptions>('aura:gift', DEFAULT_GIFT));
  }, []);

  // ── Persist on change ──────────────────────────────────────────────────────

  useEffect(() => { persist('aura:cart',   items);         }, [items]);
  useEffect(() => { persist('aura:saved',  savedItems);    }, [savedItems]);
  useEffect(() => { persist('aura:coupon', appliedCoupon); }, [appliedCoupon]);
  useEffect(() => { persist('aura:gift',   giftOptions);   }, [giftOptions]);

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
    try {
      const res  = await fetch('/api/coupons/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim(), cartTotal }),
      });
      const data = await res.json() as {
        valid:     boolean;
        code?:     string;
        label?:    string;
        type?:     string;
        discount?: number;
        reason?:   string;
      };

      if (!data.valid) {
        setCouponStatus('error');
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code:           data.code!,
        label:          data.label!,
        discountAmount: data.discount!,
        type:           data.type!,
      });
      setCouponStatus('success');
    } catch {
      setCouponStatus('error');
      setAppliedCoupon(null);
    }
  }, [cartTotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponStatus('idle');
  }, []);

  // ── Gift options ───────────────────────────────────────────────────────────

  const setGiftOptions = useCallback((patch: Partial<GiftOptions>) => {
    setGiftOptionsState(prev => ({ ...prev, ...patch }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponStatus('idle');
    setGiftOptionsState(DEFAULT_GIFT);
  }, []);

  return (
    <CartContext.Provider value={{
      items, savedItems, cartCount, cartTotal, lastAddedAt,
      appliedCoupon, couponStatus, applyCoupon, removeCoupon,
      giftOptions, setGiftOptions,
      addToCart, removeFromCart, updateQty, saveForLater, moveToCart, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
