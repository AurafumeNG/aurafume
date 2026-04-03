'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Users,
  Landmark,
  TrendingUp,
  PackageCheck,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import AdminTopNav from '@/components/admin/AdminTopNav';
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { AdminStats } from '@/app/api/admin/stats/route';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString('en-NG')}`;
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent, loading,
}: {
  label:   string;
  value:   string | number;
  sub?:    string;
  icon:    React.ElementType;
  accent?: boolean;
  loading: boolean;
}) {
  return (
    <div
      className="relative flex flex-col gap-4 p-5 overflow-hidden"
      style={{
        background: '#1A1A1A',
        border:     `1px solid ${accent ? 'rgba(180,130,60,0.20)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg"
        style={{ background: accent ? 'rgba(180,130,60,0.12)' : 'rgba(255,255,255,0.05)' }}
      >
        <Icon
          size={16}
          strokeWidth={1.8}
          style={{ color: accent ? 'oklch(0.53 0.09 70)' : 'rgba(255,255,255,0.45)' }}
        />
      </div>

      {loading ? (
        <div className="h-7 w-20 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
      ) : (
        <p
          className="text-[1.55rem] font-semibold tracking-tight leading-none"
          style={{ color: accent ? 'oklch(0.58 0.09 74)' : 'rgba(255,255,255,0.88)' }}
        >
          {value}
        </p>
      )}

      <div>
        <p
          className="text-[0.58rem] tracking-[0.14em] uppercase font-medium"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {label}
        </p>
        {sub && (
          <p
            className="mt-0.5 text-[0.52rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.20)' }}
          >
            {sub}
          </p>
        )}
      </div>

      {accent && (
        <div
          className="absolute top-0 right-0 w-16 h-16 opacity-[0.04]"
          style={{ background: 'radial-gradient(circle at top right, oklch(0.70 0.12 74), transparent 70%)' }}
        />
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [stats,       setStats]       = useState<AdminStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

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

        const meData    = await meRes.json()    as { data?: AdminUser;  error?: string };
        const statsData = await statsRes.json() as { data?: AdminStats; error?: string };

        if (!cancelled) {
          if (meData.data)    setAdminUser(meData.data);
          if (statsData.data) setStats(statsData.data);
          if (meData.error)   setError(meData.error);
        }
      } catch {
        if (!cancelled) setError('Failed to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  const adminName     = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.` : '—';
  const adminFullName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`     : '—';
  const adminRoleLabel = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

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

      {/* Content area — offset for desktop sidebar */}
      <div className="lg:pl-55 flex flex-col min-h-screen">

        {/* Top nav */}
        <AdminTopNav
          pageTitle="Dashboard Overview"
          adminName={adminName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        {/* Main content */}
        <main className="flex-1 pt-14">
          <div className="p-5 md:p-7 space-y-8">

            {/* Page heading */}
            <div className="space-y-1 pt-1">
              <h1
                className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                Dashboard Overview
              </h1>
              <p
                className="text-[0.54rem] tracking-[0.08em]"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Welcome back{adminUser ? `, ${adminUser.firstName}` : ''}. Here&apos;s what&apos;s happening today.
              </p>
            </div>

            {error && (
              <p
                className="text-[0.56rem] tracking-[0.06em] px-4 py-3"
                style={{
                  color:      'rgba(239,68,68,0.80)',
                  border:     '1px solid rgba(239,68,68,0.15)',
                  background: 'rgba(239,68,68,0.05)',
                }}
              >
                {error}
              </p>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              <StatCard
                label="Total Revenue"
                value={stats ? formatNaira(stats.totalRevenue) : '—'}
                sub="All paid orders"
                icon={TrendingUp}
                accent
                loading={loading}
              />
              <StatCard
                label="Orders Today"
                value={stats?.ordersToday ?? '—'}
                sub={stats ? `${formatNaira(stats.revenueToday)} earned` : undefined}
                icon={PackageCheck}
                loading={loading}
              />
              <StatCard
                label="Total Orders"
                value={stats?.totalOrders ?? '—'}
                sub="All time"
                icon={ShoppingCart}
                loading={loading}
              />
              <StatCard
                label="Pending Orders"
                value={stats?.pendingOrders ?? '—'}
                sub="Awaiting confirmation"
                icon={ShoppingCart}
                loading={loading}
              />
              <StatCard
                label="Bank Transfers"
                value={stats?.pendingBankTransfers ?? '—'}
                sub="Pending verification"
                icon={Landmark}
                loading={loading}
              />
              <StatCard
                label="Customers"
                value={stats?.totalCustomers ?? '—'}
                sub="Registered accounts"
                icon={Users}
                loading={loading}
              />
            </div>

            {/* Quick actions */}
            <div>
              <p
                className="mb-3 text-[0.52rem] tracking-[0.22em] uppercase"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'View Pending Orders',  href: '/admin/orders?status=pending'    },
                  { label: 'Verify Transfers',      href: '/admin/transfers?status=pending' },
                  { label: 'Manage Products',       href: '/admin/products'                 },
                  { label: 'View Customers',        href: '/admin/customers'                },
                ].map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase transition-colors duration-150"
                    style={{
                      border:     '1px solid rgba(255,255,255,0.08)',
                      color:      'rgba(255,255,255,0.40)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color       = 'rgba(255,255,255,0.70)';
                      e.currentTarget.style.background  = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color       = 'rgba(255,255,255,0.40)';
                      e.currentTarget.style.background  = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    {link.label}
                    <ArrowUpRight size={11} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Initial auth-check loading screen */}
      {loading && !stats && !error && (
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
