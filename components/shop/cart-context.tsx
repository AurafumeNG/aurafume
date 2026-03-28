'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface CartContextValue {
  cartCount: number;
  lastAddedAt: number; // timestamp — changes on every add, used to trigger FAB bounce
  addToCart: (productId: string, size: string, qty: number) => void;
}

const CartContext = createContext<CartContextValue>({
  cartCount: 0,
  lastAddedAt: 0,
  addToCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount,   setCartCount]   = useState(0);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  const addToCart = useCallback((_productId: string, _size: string, qty: number) => {
    setCartCount(c => c + qty);
    setLastAddedAt(Date.now());
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, lastAddedAt, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
