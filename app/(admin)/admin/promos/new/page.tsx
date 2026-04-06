'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }                         from 'next/navigation';
import Link                                  from 'next/link';
import { ChevronLeft, Save, Zap }           from 'lucide-react';
import { AnimatePresence, motion }           from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav  from '@/components/admin/AdminTopNav';

import BasicInfoSection     from '@/components/admin/promo-code/BasicInfoSection';
import DiscountTypeSection  from '@/components/admin/promo-code/DiscountTypeSection';
import UsageLimitsSection   from '@/components/admin/promo-code/UsageLimitsSection';
import ValidityPeriodSection from '@/components/admin/promo-code/ValidityPeriodSection';
import EligibilitySection   from '@/components/admin/promo-code/EligibilitySection';
import StackabilitySection  from '@/components/admin/promo-code/StackabilitySection';
import NotificationsSection from '@/components/admin/promo-code/NotificationsSection';
import PreviewBlock         from '@/components/admin/promo-code/PreviewBlock';
import FormActionBar        from '@/components/admin/promo-code/FormActionBar';

import { EMPTY_DRAFT, type PromoDraft } from '@/components/admin/promo-code/types';
import { GOLD }                          from '@/components/admin/promo-code/shared';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

// ── Page Header sub-components ─────────────────────────────────────────────────

function BackLink() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/admin/promos"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1.5 transition-colors duration-150"
      style={{ color: hovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)' }}
    >
      <ChevronLeft size={13} strokeWidth={2} className="shrink-0" style={{ marginLeft: '-2px' }} />
      <span className="text-[0.52rem] tracking-[0.14em] uppercase font-medium">Promo Codes</span>
    </Link>
  );
}

function HeaderBtn({
  label, icon, accent, loading, disabled, onClick,
}: {
  label:    string;
  icon:     React.ReactNode;
  accent?:  boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick:  () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const busy = loading || disabled;

  const style: React.CSSProperties = accent
    ? {
        background: busy ? 'rgba(180,130,60,0.35)' : hovered ? 'oklch(0.60 0.10 70)' : GOLD,
        color:      busy ? 'rgba(255,255,255,0.40)' : 'oklch(0.10 0 0)',
        border:     'none',
        cursor:     busy ? 'not-allowed' : 'pointer',
      }
    : {
        background: hovered && !busy ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        color:      busy ? 'rgba(255,255,255,0.20)' : hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
        border:     busy
          ? '1px solid rgba(255,255,255,0.05)'
          : hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
        cursor:     busy ? 'not-allowed' : 'pointer',
      };

  return (
    <button
      type="button"
      onClick={busy ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={busy}
      className="flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150"
      style={{ ...style, borderRadius: '2px', flexShrink: 0 }}
    >
      {loading
        ? <svg className="animate-spin shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
        : icon
      }
      {label}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NewPromoCodePage() {
  const router = useRouter();

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [adminUser,      setAdminUser]      = useState<AdminUser | null>(null);
  const [form,           setForm]           = useState<PromoDraft>(EMPTY_DRAFT);
  const [isDirty,        setIsDirty]        = useState(false);
  const [savingDraft,    setSavingDraft]    = useState(false);
  const [savingActivate, setSavingActivate] = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);

  const patch = useCallback((p: Partial<PromoDraft>) => {
    setForm((prev) => ({ ...prev, ...p }));
    setIsDirty(true);
  }, []);

  // Auth check
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return; }
        const { data } = await res.json() as { data?: AdminUser };
        if (!cancelled && data) setAdminUser(data);
      } catch { /* ignore */ }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const adminFullName  = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`     : '—';
  const adminShortName = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.` : '—';
  const adminRoleLabel = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  async function save(status: 'draft' | 'active') {
    setSaveError(null);
    const set = status === 'draft' ? setSavingDraft : setSavingActivate;
    set(true);
    try {
      const res  = await fetch('/api/admin/promos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, status }),
      });
      const json = await res.json() as { success?: boolean; error?: string; data?: { id: string } };
      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setIsDirty(false);
      router.push('/admin/promos');
    } catch {
      setSaveError('Network error. Check your connection and try again.');
    } finally {
      set(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      <AdminSidebar
        adminName={adminFullName}
        adminRole={adminRoleLabel}
        avatarUrl={adminUser?.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-55 flex flex-col min-h-screen">
        <AdminTopNav
          pageTitle="Create Promo Code"
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />

        <main className="flex-1 pt-14 pb-16">
          <div className="p-5 md:p-7 space-y-6">

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <BackLink />
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Create Promo Code
                  </h1>
                  <AnimatePresence>
                    {isDirty && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0  }}
                        exit={{    opacity: 0, x: -6 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'oklch(0.70 0.14 55)' }} />
                        <span className="text-[0.48rem] tracking-[0.12em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>
                          Unsaved changes
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:pt-1">
                <HeaderBtn
                  label="Save as Draft"
                  icon={<Save size={12} strokeWidth={1.8} />}
                  loading={savingDraft}
                  disabled={savingActivate}
                  onClick={() => void save('draft')}
                />
                <HeaderBtn
                  label="Activate Code"
                  icon={<Zap size={12} strokeWidth={2} />}
                  accent
                  loading={savingActivate}
                  disabled={savingDraft}
                  onClick={() => void save('active')}
                />
              </div>
            </div>

            {/* ── Save error banner ─────────────────────────────────────────── */}
            <AnimatePresence>
              {saveError && (
                <motion.div
                  key="save-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0  }}
                  exit={{    opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}
                >
                  <p className="text-[0.54rem] tracking-[0.06em]" style={{ color: 'rgba(239,68,68,0.88)' }}>
                    {saveError}
                  </p>
                  <button type="button" onClick={() => setSaveError(null)} className="shrink-0 text-[0.44rem] tracking-widest uppercase" style={{ color: 'rgba(239,68,68,0.55)' }}>
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Two-column layout ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">

              {/* Left column */}
              <div className="space-y-5">
                <BasicInfoSection     value={form} onChange={patch} />
                <DiscountTypeSection  value={form} onChange={patch} />
                <UsageLimitsSection   value={form} onChange={patch} />
                <ValidityPeriodSection value={form} onChange={patch} />
              </div>

              {/* Right column */}
              <div className="space-y-5">
                <PreviewBlock         value={form} />
                <EligibilitySection   value={form} onChange={patch} />
                <StackabilitySection  value={form} onChange={patch} />
                <NotificationsSection value={form} onChange={patch} />
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Sticky action bar */}
      <FormActionBar
        hasUnsavedChanges={isDirty}
        savingDraft={savingDraft}
        savingActivate={savingActivate}
        onSaveDraft={() => void save('draft')}
        onActivate={() => void save('active')}
      />
    </div>
  );
}
