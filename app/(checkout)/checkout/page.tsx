import CheckoutSteps         from '@/components/cart/checkout-steps';
import ContactInfo           from '@/components/checkout/contact-info';
import DeliveryAddress       from '@/components/checkout/delivery-address';
import DeliveryMethod        from '@/components/checkout/delivery-method';
import DeliveryNotes         from '@/components/checkout/delivery-notes';
import CheckoutGiftOptions   from '@/components/checkout/checkout-gift-options';
import CheckoutCoupon        from '@/components/checkout/checkout-coupon';
import PaymentMethodSelection from '@/components/checkout/payment-method';
import BillingAddress        from '@/components/checkout/billing-address';
import ReviewConfirm         from '@/components/checkout/review-confirm';
import TermsConsent          from '@/components/checkout/terms-consent';
import PlaceOrderCta         from '@/components/checkout/place-order-cta';
import StickyOrderBar        from '@/components/checkout/sticky-order-bar';
import {
  MobileOrderSummary,
  DesktopOrderSummary,
} from '@/components/checkout/checkout-order-summary';

export default function CheckoutPage() {
  return (
    <>
      {/* ── Mobile-only collapsible order summary ── */}
      <div className="lg:hidden">
        <MobileOrderSummary />
      </div>

      {/* ── PWA sticky order bar — mobile only ── */}
      <StickyOrderBar />

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-14 lg:items-start">

          {/* Left — checkout form */}
          <div className="space-y-8">

            <CheckoutSteps currentStep={1} />

            {/* Each wrapper div carries an ID for Review & Confirm edit-scroll targets */}
            <div id="section-contact"><ContactInfo /></div>

            <div id="section-address"><DeliveryAddress /></div>

            <div id="section-delivery"><DeliveryMethod /></div>

            <DeliveryNotes />

            <CheckoutGiftOptions />

            <CheckoutCoupon />

            <div id="section-payment"><PaymentMethodSelection /></div>

            <BillingAddress />

            <ReviewConfirm />

            <PlaceOrderCta />

            <TermsConsent />

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
