import CheckoutNavBar    from '@/components/checkout/checkout-navbar';
import BottomNavBar     from '@/components/shop/bottom-nav';
import { CheckoutProvider } from '@/components/checkout/checkout-context';

// NavBar height: 56px (h-14)
const CHECKOUT_NAV_H = 56;

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutProvider>
      <CheckoutNavBar />

      {/*
        Mobile bottom padding:
          64px (BottomNavBar h-16)
        + ~88px (StickyOrderBar step strip + bar + safe-area)
        = ~152px → pb-40 (160px) gives comfortable clearance
      */}
      <main
        style={{ paddingTop: CHECKOUT_NAV_H }}
        className="min-h-screen bg-background pb-40 sm:pb-0"
      >
        {children}
      </main>

      {/* Muted nav — present for orientation, intentionally de-emphasised */}
      <BottomNavBar variant="checkout" />
    </CheckoutProvider>
  );
}
