'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

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

interface CartContextValue {
  items: CartItem[];
  savedItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  lastAddedAt: number;
  addToCart: (input: CartItemInput) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQty: (productId: string, size: string, qty: number) => void;
  saveForLater: (productId: string, size: string) => void;
  moveToCart: (productId: string, size: string) => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  savedItems: [],
  cartCount: 0,
  cartTotal: 0,
  lastAddedAt: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQty: () => {},
  saveForLater: () => {},
  moveToCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,       setItems]      = useState<CartItem[]>([]);
  const [savedItems,  setSavedItems] = useState<CartItem[]>([]);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  const cartCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const cartTotal = useMemo(() => items.reduce((s, i) => s + i.pricePerUnit * i.qty, 0), [items]);

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
        const idx = cart.findIndex(
          i => i.productId === productId && i.size === size,
        );
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

  return (
    <CartContext.Provider value={{
      items,
      savedItems,
      cartCount,
      cartTotal,
      lastAddedAt,
      addToCart,
      removeFromCart,
      updateQty,
      saveForLater,
      moveToCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
