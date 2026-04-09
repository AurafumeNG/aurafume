export type CategoryId =
  | 'all'
  | 'orders'
  | 'payments'
  | 'shipping'
  | 'returns'
  | 'products'
  | 'account';

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  id:    CategoryId;
  label: string;
  items: FaqItem[];
}

export const CATEGORIES: FaqCategory[] = [
  {
    id:    'orders',
    label: 'Orders',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Browse our shop, add items to your cart, then proceed to checkout. You\'ll enter your delivery details and choose a payment method — either card via Paystack or bank transfer. Once your order is confirmed you\'ll receive an email summary.',
      },
      {
        q: 'Can I modify my order after placing it?',
        a: 'Orders can be modified within 1 hour of placement, before they are processed for dispatch. Please contact us immediately via WhatsApp or email if you need to make changes.',
      },
      {
        q: 'How do I cancel my order?',
        a: 'To cancel, contact us within 1 hour of placing your order. Once an order has been dispatched it cannot be cancelled — you would need to follow our returns process instead.',
      },
      {
        q: 'What is the minimum order amount?',
        a: 'There is no minimum order amount. You can purchase a single item at any time.',
      },
      {
        q: 'Can I place a bulk order?',
        a: 'Yes. For bulk or wholesale enquiries please reach out to us directly via email at hello@yourbrand.com or WhatsApp, and our team will assist you with pricing and availability.',
      },
    ],
  },
  {
    id:    'payments',
    label: 'Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept card payments (Mastercard, Visa, Verve) via Paystack, and direct bank transfer. Both options are available at checkout.',
      },
      {
        q: 'How does bank transfer payment work?',
        a: 'At checkout, select "Bank Transfer" and you will be shown our account details. Transfer the exact order amount, then upload your proof of payment. Our team will verify and confirm your order — usually within a few hours during business hours.',
      },
      {
        q: 'How long does bank transfer verification take?',
        a: 'Bank transfers are typically verified within 2–4 hours on business days (Mon–Sat, 9AM–6PM). Transfers made outside these hours are processed the next business day.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Absolutely. Card payments are processed by Paystack, a PCI-DSS compliant payment gateway — we never store your card details. Bank transfers do not involve sharing any sensitive financial information beyond what is standard for a Nigerian bank transfer.',
      },
    ],
  },
  {
    id:    'shipping',
    label: 'Shipping',
    items: [
      {
        q: 'What are your delivery options?',
        a: 'We offer standard delivery across Lagos and nationwide delivery to all states in Nigeria. You can also pick up your order from our store at Shop 17/18 Canaan Line, Rivers 2 Plaza, Balogun Tradefair Complex, Lagos.',
      },
      {
        q: 'How much does delivery cost?',
        a: 'Delivery fees vary by location. Lagos-based delivery starts from ₦1,500, while nationwide delivery is calculated at checkout based on your state and order weight.',
      },
      {
        q: 'Do you offer free delivery?',
        a: 'Yes — orders above a certain threshold qualify for free delivery within Lagos. Check the cart page for the current free delivery threshold, which may also be updated via promotional offers.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Lagos orders are typically delivered within 1–2 business days. Nationwide orders take 3–5 business days depending on your location.',
      },
      {
        q: 'Do you deliver outside Nigeria?',
        a: 'We currently deliver within Nigeria only. International shipping is not available at this time, but we are working on expanding our reach.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. Once your order is dispatched you will receive a tracking update. You can also view your order status at any time from your account under "My Orders".',
      },
    ],
  },
  {
    id:    'returns',
    label: 'Returns',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery for items that are unused, unopened, and in their original packaging. Fragrances that have been opened or used cannot be returned for hygiene reasons.',
      },
      {
        q: 'How do I request a return?',
        a: 'Contact us via email or WhatsApp with your order number and reason for return. Our team will review your request and provide return instructions within 24 hours.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 3–5 business days after we receive and inspect the returned item. The refund will be issued via the same payment method used for the original purchase.',
      },
      {
        q: 'Can I exchange a product?',
        a: 'Yes, exchanges are available for items that are unopened and in their original condition. Contact us within 7 days of delivery to request an exchange, subject to stock availability.',
      },
      {
        q: 'What items cannot be returned?',
        a: 'Opened fragrances, sale or discounted items, and gift sets that have been unwrapped cannot be returned. This is to ensure the hygiene and integrity of our products.',
      },
    ],
  },
  {
    id:    'products',
    label: 'Products',
    items: [
      {
        q: 'Are your fragrances authentic?',
        a: '100%. Every fragrance we sell is sourced directly from authorised distributors or brands. We do not sell fakes or counterfeits — authenticity is at the core of what AuraFume stands for.',
      },
      {
        q: 'How long do your fragrances last?',
        a: 'Longevity depends on the concentration. Our EDPs typically last 6–10 hours on skin, while EDTs last 4–6 hours. Longevity can vary with skin type, climate, and application area.',
      },
      {
        q: 'How should I store my perfume?',
        a: 'Store your fragrance in a cool, dry place away from direct sunlight and heat. Avoid the bathroom — humidity and temperature changes degrade the scent. Keeping the bottle upright and capped preserves the fragrance longest.',
      },
      {
        q: 'What does EDP vs EDT mean?',
        a: 'EDP (Eau de Parfum) has a higher concentration of fragrance oils (15–20%) and lasts longer. EDT (Eau de Toilette) has a lighter concentration (5–15%) and is typically fresher and more suitable for daytime wear. Both are listed on each product page.',
      },
      {
        q: 'Do you offer samples?',
        a: 'We occasionally offer sample sets and discovery kits. Check the shop for current availability, or contact us to enquire about specific fragrances you\'d like to try before committing to a full bottle.',
      },
    ],
  },
  {
    id:    'account',
    label: 'Account',
    items: [
      {
        q: 'Do I need an account to shop?',
        a: 'You can place orders as a guest. However, creating an account gives you access to order history, saved addresses, wishlists, and faster checkout on future purchases.',
      },
      {
        q: 'How do I reset my password?',
        a: 'On the login page, click "Forgot password?" and enter your email address. You will receive a reset link valid for 1 hour. If the email doesn\'t arrive, check your spam folder.',
      },
      {
        q: 'How do I update my delivery address?',
        a: 'Go to Account → Saved Addresses to add, edit, or remove delivery addresses. You can also add a new address directly at checkout.',
      },
      {
        q: 'How do I delete my account?',
        a: 'To request account deletion, please contact us via email at hello@yourbrand.com with the subject line "Account Deletion Request". We will process your request and confirm deletion within 5 business days.',
      },
    ],
  },
];

export const ALL_TABS: { id: CategoryId; label: string }[] = [
  { id: 'all', label: 'All' },
  ...CATEGORIES.map(({ id, label }) => ({ id, label })),
];
