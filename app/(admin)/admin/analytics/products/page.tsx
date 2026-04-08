'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import AnalyticsTabs from '@/components/admin/analytics/AnalyticsTabs';
import ProductPageHeader from '@/components/admin/analytics/products/ProductPageHeader';
import ProductKPIs from '@/components/admin/analytics/products/ProductKPIs';
import ProductPerformanceTable from '@/components/admin/analytics/products/ProductPerformanceTable';
import TopBottomPerformers from '@/components/admin/analytics/products/TopBottomPerformers';
import CategoryPerformanceChart from '@/components/admin/analytics/products/CategoryPerformanceChart';
import VariantSizeAnalysis from '@/components/admin/analytics/products/VariantSizeAnalysis';
import ProductViewFunnel from '@/components/admin/analytics/products/ProductViewFunnel';
import ProductPairingAnalysis from '@/components/admin/analytics/products/ProductPairingAnalysis';
import NewArrivalsPerformance from '@/components/admin/analytics/products/NewArrivalsPerformance';
import InventoryTurnover from '@/components/admin/analytics/products/InventoryTurnover';
import type { DatePreset } from '@/components/admin/analytics/shared';
import type { ProductsData } from '@/types/analytics-products';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AdminStats {
  pendingOrders?: number;
  pendingBankTransfers?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split('T')[0]; }
function nDaysAgoStr(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function presetToDates(preset: DatePreset): { from: string; to: string } {
  const today = todayStr();
  switch (preset) {
    case 'today':     return { from: today,           to: today };
    case 'yesterday': return { from: nDaysAgoStr(1),  to: nDaysAgoStr(1) };
    case 'last7':     return { from: nDaysAgoStr(6),  to: today };
    case 'last30':    return { from: nDaysAgoStr(29), to: today };
    case 'last90':    return { from: nDaysAgoStr(89), to: today };
    case 'thisYear':  return { from: `${new Date().getFullYear()}-01-01`, to: today };
    case 'allTime':   return { from: '2023-01-01',    to: today };
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductAnalyticsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser]     = useState<AdminUser | null>(null);
  const [stats, setStats]             = useState<AdminStats | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [preset,   setPreset]   = useState<DatePreset>('last30');
  const init = presetToDates('last30');
  const [from,     setFrom]     = useState(init.from);
  const [to,       setTo]       = useState(init.to);
  const [category, setCategory] = useState('All Categories');

  const [productsData, setProductsData] = useState<ProductsData | null>(null);
  const [dataLoading, setDataLoading]   = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Auth
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meRes, statsRes] = await Promise.all([
          fetch('/api/admin/me'),
          fetch('/api/admin/stats'),
        ]);
        if (meRes.status === 401 || meRes.status === 403) { router.push('/admin/login'); return; }
        const meData    = await meRes.json()    as { data?: AdminUser  };
        const statsData = await statsRes.json() as { data?: AdminStats };
        if (!cancelled) {
          if (meData.data)    setAdminUser(meData.data);
          if (statsData.data) setStats(statsData.data);
        }
      } catch { /* fail silently */ }
      finally { if (!cancelled) setAuthLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  // Fetch analytics data on date range change
  useEffect(() => {
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;
    setDataLoading(true);

    fetch(`/api/admin/analytics/products?from=${from}&to=${to}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json: { data?: ProductsData }) => {
        if (!ctrl.signal.aborted) setProductsData(json.data ?? null);
      })
      .catch(() => { /* aborted or network error */ })
      .finally(() => { if (!ctrl.signal.aborted) setDataLoading(false); });

    return () => ctrl.abort();
  }, [from, to]);

  function handlePreset(p: DatePreset) {
    setPreset(p);
    const { from: f, to: t } = presetToDates(p);
    setFrom(f); setTo(t);
  }

  const adminName     = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.` : '—';
  const adminFullName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : '—';
  const adminRole     = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      <AdminSidebar
        adminName={adminFullName} adminRole={adminRole} avatarUrl={adminUser?.avatar}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        pendingOrders={stats?.pendingOrders} pendingTransfers={stats?.pendingBankTransfers}
      />

      <div className="lg:pl-55 flex flex-col min-h-screen">
        <AdminTopNav
          pageTitle="Product Analytics" adminName={adminName} avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-6">

            <ProductPageHeader
              preset={preset} from={from} to={to} category={category}
              onPreset={handlePreset}
              onFrom={(v) => { setFrom(v); setPreset('allTime'); }}
              onTo={(v)   => { setTo(v);   setPreset('allTime'); }}
              onCategory={setCategory}
            />

            <AnalyticsTabs active="Products" />

            {/* Loading bar */}
            {dataLoading && (
              <div className="h-px w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full animate-pulse" style={{ background: 'oklch(0.53 0.09 70)', width: '60%' }} />
              </div>
            )}

            <section>
              <ProductKPIs data={productsData} />
            </section>

            <section>
              <ProductPerformanceTable data={productsData} category={category} />
            </section>

            <section>
              <TopBottomPerformers data={productsData} />
            </section>

            <section>
              <CategoryPerformanceChart data={productsData} />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <VariantSizeAnalysis data={productsData} />
              <NewArrivalsPerformance data={productsData} />
            </section>

            <section>
              <ProductViewFunnel data={productsData} />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ProductPairingAnalysis data={productsData} />
              <InventoryTurnover data={productsData} />
            </section>

          </div>
        </main>
      </div>

      {authLoading && (
        <div className="fixed inset-0 z-60 flex items-center justify-center" style={{ background: '#0F0F0F' }}>
          <Loader2 size={20} strokeWidth={1.8} className="animate-spin" style={{ color: 'oklch(0.53 0.09 70)' }} />
        </div>
      )}
    </div>
  );
}
