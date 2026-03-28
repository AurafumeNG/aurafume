import CartItemsList from '@/components/cart/cart-items-list';

export default function CartPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-8 py-8 lg:max-w-2xl">
        <CartItemsList />
      </div>
    </div>
  );
}
