import CheckoutNavBar    from '@/components/checkout/checkout-navbar';
import { CheckoutProvider } from '@/components/checkout/checkout-context';

// NavBar height: 56px (h-14)
const CHECKOUT_NAV_H = 56;

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutProvider>
      <CheckoutNavBar />

      <main
        style={{ paddingTop: CHECKOUT_NAV_H }}
        className="min-h-screen bg-background"
      >
        {children}
      </main>
    </CheckoutProvider>
  );
}
