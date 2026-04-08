'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';
import OrderSearchBar from '@/components/account/order-search-bar';
import OrdersList, {
  type Order,
  type OrderStatus,
} from '@/components/account/orders-list';

// ── Filter config ───────────────────────────────────────────────────────────────

type FilterKey = 'all' | OrderStatus;

interface OrderFilter {
  key: FilterKey;
  label: string;
}

const FILTERS: OrderFilter[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

// ── API response type ───────────────────────────────────────────────────────────

interface ApiOrder {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  contact: { firstName: string; lastName: string; phone: string; email: string };
  shippingAddress: { street: string; apt?: string; city: string; state: string; country: string };
  items: { productId: string; name: string; image: string; size: string; qty: number; pricePerUnit: number }[];
  pricing: { subtotal: number; deliveryFee: number; discount: number; total: number; couponCode?: string };
  payment: { method: 'paystack' | 'bank-transfer'; paystackRef?: string };
  delivery: { notes?: string };
}

function mapApiOrder(o: ApiOrder): Order {
  // 'confirmed' is not in the component's OrderStatus union — treat it as 'processing'
  const status: OrderStatus = o.status === 'confirmed' ? 'processing' : o.status;

  return {
    id: o._id,
    orderNumber: o.orderNumber,
    date: new Date(o.createdAt),
    status,
    subtotal: o.pricing.subtotal,
    deliveryFee: o.pricing.deliveryFee,
    discount: o.pricing.discount,
    total: o.pricing.total,
    couponCode: o.pricing.couponCode,
    paymentMethod: o.payment.method,
    deliveryAddress: {
      name: `${o.contact.firstName} ${o.contact.lastName}`.trim(),
      phone: o.contact.phone,
      street: o.shippingAddress.street,
      apt: o.shippingAddress.apt,
      city: o.shippingAddress.city,
      state: o.shippingAddress.state,
      country: o.shippingAddress.country,
    },
    items: o.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      image: item.image,
      size: item.size,
      qty: item.qty,
      price: item.pricePerUnit,
    })),
  };
}

// ── Orders header (nav + filter tabs) ──────────────────────────────────────────

function OrdersHeader({
  activeFilter,
  onFilter,
  counts,
}: {
  activeFilter: FilterKey;
  onFilter: (f: FilterKey) => void;
  counts: Partial<Record<FilterKey, number>>;
}) {
  const router = useRouter();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLButtonElement>(
      '[data-active="true"]',
    );
    if (el && tabsRef.current) {
      const left =
        el.offsetLeft - tabsRef.current.clientWidth / 2 + el.clientWidth / 2;
      tabsRef.current.scrollTo({ left, behavior: 'smooth' });
    }
  }, [activeFilter]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="h-14 max-w-xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center"
      >
        <button
          onClick={() => router.back()}
          aria-label="Back to account"
          className="flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
        >
          <ChevronLeft
            size={22}
            strokeWidth={1.8}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </button>
        <div className="flex items-center justify-center">
          <h1 className="font-heading text-[0.88rem] tracking-[0.22em] uppercase text-foreground leading-none">
            My Orders
          </h1>
        </div>
        <div />
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        ref={tabsRef}
        className="flex items-center justify-center overflow-x-auto border-t border-border/40"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex px-4 sm:px-6 min-w-max">
          {FILTERS.map(({ key, label }) => {
            const count = counts[key] ?? 0;
            const isActive = key === activeFilter;
            return (
              <button
                key={key}
                data-active={isActive}
                onClick={() => onFilter(key)}
                className={`relative flex items-center gap-1.5 px-3.5 py-3 text-[0.56rem] tracking-[0.18em] uppercase font-medium whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground/55 hover:text-muted-foreground'
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[0.42rem] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-foreground text-background'
                        : 'bg-muted/70 text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="orders-tab-indicator"
                    className="absolute bottom-0 inset-x-0 h-0.5"
                    style={{ background: 'oklch(0.72 0.10 74)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </header>
  );
}

// ── All-empty state ─────────────────────────────────────────────────────────────

function NoOrders() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 py-20 text-center px-8"
    >
      <div className="w-16 h-16 rounded-full border border-border/60 flex items-center justify-center">
        <Package
          size={26}
          strokeWidth={1.3}
          className="text-muted-foreground/35"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[0.62rem] tracking-[0.22em] uppercase font-medium text-foreground">
          No orders yet
        </p>
        <p className="text-[0.6rem] tracking-[0.05em] leading-relaxed text-muted-foreground/60 max-w-55 mx-auto">
          When you place your first order it will appear here.
        </p>
      </div>
      <Link
        href="/shop"
        className="flex items-center gap-2 text-[0.56rem] tracking-[0.2em] uppercase font-medium text-foreground/70 hover:text-foreground transition-colors border-b border-foreground/20 pb-0.5"
      >
        Browse the collection
        <ArrowRight size={12} strokeWidth={2} />
      </Link>
    </motion.div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?redirect=/account/orders');
  }, [isLoading, user, router]);

  // Fetch real orders
  useEffect(() => {
    if (isLoading || !user) return;

    setOrdersLoading(true);
    setOrdersError(null);

    fetch('/api/orders')
      .then((res) => res.json())
      .then((json: { success?: boolean; data?: ApiOrder[]; error?: string }) => {
        if (json.success && Array.isArray(json.data)) {
          setAllOrders(json.data.map(mapApiOrder));
        } else {
          setOrdersError(json.error ?? 'Failed to load orders.');
        }
      })
      .catch(() => setOrdersError('Failed to load orders.'))
      .finally(() => setOrdersLoading(false));
  }, [isLoading, user]);

  // Filter by tab
  const tabFiltered =
    activeFilter === 'all'
      ? allOrders
      : allOrders.filter((o) => o.status === activeFilter);

  // Count per status for badges
  const counts: Partial<Record<FilterKey, number>> = {
    all: allOrders.length,
    pending: allOrders.filter((o) => o.status === 'pending').length,
    processing: allOrders.filter((o) => o.status === 'processing').length,
    shipped: allOrders.filter((o) => o.status === 'shipped').length,
    delivered: allOrders.filter((o) => o.status === 'delivered').length,
    cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
  };

  if (isLoading || !user || ordersLoading) {
    return (
      <>
        <OrdersHeader
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
          counts={{}}
        />
        <div className="pt-25 max-w-xl mx-auto px-5 sm:px-8 py-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/40 animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  if (ordersError) {
    return (
      <>
        <OrdersHeader
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
          counts={{}}
        />
        <div className="pt-25 max-w-xl mx-auto px-4 sm:px-6 py-10 text-center">
          <p className="text-[0.6rem] tracking-widest text-muted-foreground/70">
            {ordersError}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <OrdersHeader
        activeFilter={activeFilter}
        onFilter={setActiveFilter}
        counts={counts}
      />

      {/* pt-25 = 56px nav + 44px tabs */}
      <div className="pt-25 max-w-xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Search bar */}
        {allOrders.length > 0 && (
          <OrderSearchBar value={searchQuery} onChange={setSearchQuery} />
        )}

        {/* List */}
        <AnimatePresence mode="wait">
          {allOrders.length === 0 ? (
            <NoOrders key="no-orders" />
          ) : (
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <OrdersList orders={tabFiltered} searchQuery={searchQuery} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
