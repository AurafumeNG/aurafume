import BottomNavBar       from '@/components/shop/bottom-nav';
import FloatingCartButton from '@/components/shop/floating-cart-button';
import Footer             from '@/components/footer';

// PDPNavBar height: 56px (h-14) — rendered per-page so it can receive product props
const PDP_NAV_H = 56;

export default function PDPLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main style={{ paddingTop: PDP_NAV_H }} className="pb-24 sm:pb-0">
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
