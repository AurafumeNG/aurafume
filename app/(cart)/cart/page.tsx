import CheckoutSteps      from '@/components/cart/checkout-steps';
import DeliveryProgress   from '@/components/cart/delivery-progress';
import CartItemsList      from '@/components/cart/cart-items-list';
import CouponCode         from '@/components/cart/coupon-code';
import GiftOptions        from '@/components/cart/gift-options';
import OrderSummary       from '@/components/cart/order-summary';
import SavedForLater      from '@/components/cart/saved-for-later';
import CartUpsell         from '@/components/cart/cart-upsell';
import StickyCheckoutBar  from '@/components/cart/sticky-checkout-bar';

export default function CartPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 space-y-6">

        {/* Step 1 of 4 */}
        <CheckoutSteps currentStep={0} />

        {/* Free delivery motivational bar */}
        <DeliveryProgress />

        {/* Active cart items */}
        <CartItemsList />

        {/* Promo / discount code */}
        <CouponCode />

        {/* Gift options */}
        <GiftOptions />

        {/* Order summary + main CTA + payment icons + continue shopping */}
        <OrderSummary />

        {/* Saved for later */}
        <SavedForLater />

        {/* You May Also Like */}
        <CartUpsell />

        {/* Extra bottom padding on mobile so sticky bar never occludes content */}
        <div className="sm:hidden h-24" />

      </div>

      {/* PWA sticky checkout bar — hides when main CTA is in view */}
      <StickyCheckoutBar />
    </div>
  );
}
