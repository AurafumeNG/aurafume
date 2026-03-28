import { CartProvider }      from '@/components/shop/cart-context';
import ShopNavBar            from '@/components/shop/shop-navbar-cart';
import BottomNavBar          from '@/components/shop/bottom-nav';
import FloatingCartButton    from '@/components/shop/floating-cart-button';
import Footer                from '@/components/footer';

// ShopNavBar height: 56px (h-14)
const SHOP_NAV_H = 56;

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ShopNavBar />

      <main style={{ paddingTop: SHOP_NAV_H }} className="pb-24 sm:pb-0">
        {children}
      </main>

      {/* Footer hidden on mobile — BottomNavBar takes its place */}
      <div className="hidden sm:block">
        <Footer />
      </div>

      <BottomNavBar />
      <FloatingCartButton />
    </CartProvider>
  );
}
