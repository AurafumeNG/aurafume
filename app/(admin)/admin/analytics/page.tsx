'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import PageHeader from '@/components/admin/analytics/PageHeader';
import AnalyticsTabs from '@/components/admin/analytics/AnalyticsTabs';
import HeadlineKPIs from '@/components/admin/analytics/HeadlineKPIs';
import SecondaryKPIs from '@/components/admin/analytics/SecondaryKPIs';
import RevenueChart from '@/components/admin/analytics/RevenueChart';
import RevenueBreakdown from '@/components/admin/analytics/RevenueBreakdown';
import OrdersStatus from '@/components/admin/analytics/OrdersStatus';
import TopProducts from '@/components/admin/analytics/TopProducts';
import CategoryChart from '@/components/admin/analytics/CategoryChart';
import CustomerInsights from '@/components/admin/analytics/CustomerInsights';
import GeographicDistribution from '@/components/admin/analytics/GeographicDistribution';
import SalesHeatmap from '@/components/admin/analytics/SalesHeatmap';
import MarketingSummary from '@/components/admin/analytics/MarketingSummary';
import EventsFeed from '@/components/admin/analytics/EventsFeed';
import type { DatePreset } from '@/components/admin/analytics/shared';
import type { OverviewData } from '@/types/analytics-overview';

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

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function nDaysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function presetToDates(preset: DatePreset): { from: string; to: string } {
  const today = todayStr();
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      return { from: nDaysAgoStr(1), to: nDaysAgoStr(1) };
    case 'last7':
      return { from: nDaysAgoStr(6), to: today };
    case 'last30':
      return { from: nDaysAgoStr(29), to: today };
    case 'last90':
      return { from: nDaysAgoStr(89), to: today };
    case 'thisYear': {
      const year = new Date().getFullYear();
      return { from: `${year}-01-01`, to: today };
    }
    case 'allTime':
      return { from: '2023-01-01', to: today };
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Date range state
  const [preset, setPreset] = useState<DatePreset>('last30');
  const initialDates = presetToDates('last30');
  const [from, setFrom] = useState(initialDates.from);
  const [to, setTo] = useState(initialDates.to);
  const [compare, setCompare] = useState(false);

  // Analytics data
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Auth check
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [meRes, statsRes] = await Promise.all([
          fetch('/api/admin/me'),
          fetch('/api/admin/stats'),
        ]);

        if (meRes.status === 401 || meRes.status === 403) {
          router.push('/admin/login');
          return;
        }

        const meData = await meRes.json() as { data?: AdminUser };
        const statsData = await statsRes.json() as { data?: AdminStats };

        if (!cancelled) {
          if (meData.data) setAdminUser(meData.data);
          if (statsData.data) setStats(statsData.data);
        }
      } catch {
        // fail silently
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  // Fetch analytics data whenever date range changes
  useEffect(() => {
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    setDataLoading(true);

    fetch(`/api/admin/analytics/overview?from=${from}&to=${to}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json: { data?: OverviewData }) => {
        if (!ctrl.signal.aborted) {
          setOverviewData(json.data ?? null);
        }
      })
      .catch(() => { /* aborted or network error — keep previous data */ })
      .finally(() => {
        if (!ctrl.signal.aborted) setDataLoading(false);
      });

    return () => ctrl.abort();
  }, [from, to]);

  function handlePreset(p: DatePreset) {
    setPreset(p);
    const { from: f, to: t } = presetToDates(p);
    setFrom(f);
    setTo(t);
  }

  function handleFromChange(v: string) {
    setFrom(v);
    setPreset('allTime');
  }

  function handleToChange(v: string) {
    setTo(v);
    setPreset('allTime');
  }

  const adminName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName[0]}.`
    : '—';
  const adminFullName = adminUser
    ? `${adminUser.firstName} ${adminUser.lastName}`
    : '—';
  const adminRoleLabel =
    adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      {/* Sidebar */}
      <AdminSidebar
        adminName={adminFullName}
        adminRole={adminRoleLabel}
        avatarUrl={adminUser?.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingOrders={stats?.pendingOrders}
        pendingTransfers={stats?.pendingBankTransfers}
      />

      {/* Content area */}
      <div className="lg:pl-55 flex flex-col min-h-screen">
        <AdminTopNav
          pageTitle="Analytics"
          adminName={adminName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-6">

            {/* ── Page Header ──────────────────────────────────────────── */}
            <PageHeader
              preset={preset}
              from={from}
              to={to}
              compare={compare}
              onPreset={handlePreset}
              onFrom={handleFromChange}
              onTo={handleToChange}
              onCompare={setCompare}
            />

            {/* ── Sub-navigation tabs ──────────────────────────────────── */}
            <AnalyticsTabs active="Overview" />

            {/* Loading bar */}
            {dataLoading && (
              <div className="h-px w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full animate-pulse" style={{ background: 'oklch(0.53 0.09 70)', width: '60%' }} />
              </div>
            )}

            {/* ── Headline KPIs ────────────────────────────────────────── */}
            <section>
              <HeadlineKPIs compare={compare} data={overviewData} />
            </section>

            {/* ── Secondary KPIs ───────────────────────────────────────── */}
            <section>
              <SecondaryKPIs compare={compare} data={overviewData} />
            </section>

            {/* ── Revenue Overview Chart ───────────────────────────────── */}
            <section>
              <RevenueChart compare={compare} data={overviewData} />
            </section>

            {/* ── Revenue Breakdown (Payment & Delivery donuts) ────────── */}
            <section>
              <RevenueBreakdown data={overviewData} />
            </section>

            {/* ── Orders Status + Top Products (side by side on lg) ────── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <OrdersStatus data={overviewData} />
              <TopProducts data={overviewData} />
            </section>

            {/* ── Category + Customer Insights (side by side on xl) ────── */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <CategoryChart data={overviewData} />
              <CustomerInsights data={overviewData} />
            </section>

            {/* ── Geographic Distribution ──────────────────────────────── */}
            <section>
              <GeographicDistribution data={overviewData} />
            </section>

            {/* ── Heatmap ──────────────────────────────────────────────── */}
            <section>
              <SalesHeatmap data={overviewData} />
            </section>

            {/* ── Marketing + Events (side by side on xl) ──────────────── */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <MarketingSummary data={overviewData} />
              <EventsFeed data={overviewData} />
            </section>

          </div>
        </main>
      </div>

      {/* Auth-check loading overlay */}
      {authLoading && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center"
          style={{ background: '#0F0F0F' }}
        >
          <Loader2
            size={20}
            strokeWidth={1.8}
            className="animate-spin"
            style={{ color: 'oklch(0.53 0.09 70)' }}
          />
        </div>
      )}
    </div>
  );
}
