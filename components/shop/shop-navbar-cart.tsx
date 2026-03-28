'use client';

import ShopNavBar from '@/components/shop-navbar';
import { useCart } from './cart-context';

// Thin wrapper that feeds cart count from context into ShopNavBar
export default function ShopNavBarCart() {
  const { cartCount } = useCart();
  return <ShopNavBar cartCount={cartCount} />;
}
