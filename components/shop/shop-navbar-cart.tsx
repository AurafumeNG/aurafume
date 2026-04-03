'use client';

import { useEffect, useState } from 'react';
import ShopNavBar from '@/components/shop-navbar';
import { useCart } from './cart-context';

// Thin wrapper that feeds cart count from context into ShopNavBar.
// cartCount is deferred until after mount to avoid SSR/client hydration mismatch
// (cart data lives in localStorage, which is unavailable on the server).
export default function ShopNavBarCart() {
  const { cartCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return <ShopNavBar cartCount={mounted ? cartCount : 0} />;
}
