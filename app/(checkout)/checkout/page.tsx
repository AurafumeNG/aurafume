import CheckoutSteps    from '@/components/cart/checkout-steps';
import ContactInfo     from '@/components/checkout/contact-info';
import DeliveryAddress from '@/components/checkout/delivery-address';

export default function CheckoutPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 space-y-8">

      <CheckoutSteps currentStep={1} />

      <ContactInfo />

      <DeliveryAddress />

      {/* Payment section will follow */}
    </div>
  );
}
