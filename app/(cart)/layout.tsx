import CartNavBar        from '@/components/cart-navbar';
import BottomNavBar      from '@/components/shop/bottom-nav';
import FloatingCartButton from '@/components/shop/floating-cart-button';
import Footer            from '@/components/footer';

// CartNavBar height: 56px (h-14)
const CART_NAV_H = 56;

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CartNavBar />

      <main style={{ paddingTop: CART_NAV_H }} className="pb-24 sm:pb-0">
        {children}
      </main>

      <div className="hidden sm:block">
        <Footer />
      </div>

      <BottomNavBar />
      <FloatingCartButton />
    </>
  );
}
