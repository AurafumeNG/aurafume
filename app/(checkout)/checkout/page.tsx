import CheckoutSteps      from '@/components/cart/checkout-steps';
import ContactInfo        from '@/components/checkout/contact-info';
import DeliveryAddress    from '@/components/checkout/delivery-address';
import DeliveryMethod     from '@/components/checkout/delivery-method';
import DeliveryNotes      from '@/components/checkout/delivery-notes';
import CheckoutGiftOptions from '@/components/checkout/checkout-gift-options';
import CheckoutCoupon      from '@/components/checkout/checkout-coupon';
import PaymentMethodSelection from '@/components/checkout/payment-method';
import {
  MobileOrderSummary,
  DesktopOrderSummary,
} from '@/components/checkout/checkout-order-summary';

export default function CheckoutPage() {
  return (
    <>
      {/* ── Mobile-only collapsible order summary — sits above the form ── */}
      <div className="lg:hidden">
        <MobileOrderSummary />
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-14 lg:items-start">

          {/* Left — checkout form */}
          <div className="space-y-8">
            <CheckoutSteps currentStep={1} />
            <ContactInfo />
            <DeliveryAddress />
            <DeliveryMethod />
            <DeliveryNotes />
            <CheckoutGiftOptions />

            <CheckoutCoupon />

            <PaymentMethodSelection />
            <div className="pb-8" />
          </div>

          {/* Right — sticky order summary (desktop only) */}
          <aside className="hidden lg:block sticky top-18 self-start">
            <DesktopOrderSummary />
          </aside>

        </div>
      </div>
    </>
  );
}
