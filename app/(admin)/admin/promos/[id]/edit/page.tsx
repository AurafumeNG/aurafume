'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter }                              from 'next/navigation';
import Link                                       from 'next/link';
import { ChevronLeft, Save, Zap, Loader2 }       from 'lucide-react';
import { AnimatePresence, motion }                from 'motion/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav  from '@/components/admin/AdminTopNav';

import BasicInfoSection      from '@/components/admin/promo-code/BasicInfoSection';
import DiscountTypeSection   from '@/components/admin/promo-code/DiscountTypeSection';
import UsageLimitsSection    from '@/components/admin/promo-code/UsageLimitsSection';
import ValidityPeriodSection from '@/components/admin/promo-code/ValidityPeriodSection';
import EligibilitySection    from '@/components/admin/promo-code/EligibilitySection';
import StackabilitySection   from '@/components/admin/promo-code/StackabilitySection';
import NotificationsSection  from '@/components/admin/promo-code/NotificationsSection';
import PreviewBlock          from '@/components/admin/promo-code/PreviewBlock';
import FormActionBar         from '@/components/admin/promo-code/FormActionBar';

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

// ── API → draft mapper ─────────────────────────────────────────────────────────

// Maps the API response shape onto the PromoDraft structure so the form
// can be pre-populated when editing an existing code.
function apiToForm(api: Record<string, unknown>): PromoDraft {
  return {
    ...EMPTY_DRAFT,
    code:        String(api.code           ?? ''),
    description: String(api.description    ?? ''),
    label:       String(api.label          ?? ''),
    discountType: (api.type as PromoDraft['discountType']) ?? 'pct',
    pctValue:     Number(api.value         ?? 10),
    flatValue:    Number(api.value         ?? 1000),
    hasPctCap:    Boolean(api.hasPctCap),
    pctCap:       Number(api.pctCap        ?? 5000),
    hasMaxUses:   api.maxUses != null,
    maxUses:      Number(api.maxUses       ?? 100),
    hasPerCustomerLimit: api.perCustomerLimit != null,
    perCustomerLimit:    Number(api.perCustomerLimit ?? 1),
    singleUse:    Boolean(api.singleUse),
    validFrom:    api.validFrom
      ? String(api.validFrom).split('T')[0]
      : EMPTY_DRAFT.validFrom,
    validFromTime: api.validFrom
      ? String(api.validFrom).split('T')[1]?.slice(0, 5) ?? '00:00'
      : '00:00',
    hasExpiry:    Boolean(api.expiresAt),
    expiresAt:    api.expiresAt ? String(api.expiresAt).split('T')[0] : '',
    expiresAtTime: api.expiresAt
      ? String(api.expiresAt).split('T')[1]?.slice(0, 5) ?? '23:59'
      : '23:59',
    autoDisableOnExpiry: api.autoDisableOnExpiry !== false,
    // Eligibility
    hasMinOrder:       Number(api.minOrderAmount ?? 0) > 0,
    minOrderAmount:    Number(api.minOrderAmount ?? 20000),
    firstOrderOnly:    Boolean(api.firstOrderOnly),
    hasSpecificCustomers: Array.isArray(api.specificCustomers) && (api.specificCustomers as unknown[]).length > 0,
    specificCustomerEmails: Array.isArray(api.specificCustomers)
      ? (api.specificCustomers as string[])
      : [],
    hasPaymentRestriction: Boolean(api.paymentMethod && api.paymentMethod !== 'all'),
    paymentRestriction: (api.paymentMethod as PromoDraft['paymentRestriction']) ?? 'all',
  };
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
    ? { background: busy ? 'rgba(180,130,60,0.35)' : hovered ? 'oklch(0.60 0.10 70)' : GOLD, color: busy ? 'rgba(255,255,255,0.40)' : 'oklch(0.10 0 0)', border: 'none', cursor: busy ? 'not-allowed' : 'pointer' }
    : { background: hovered && !busy ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', color: busy ? 'rgba(255,255,255,0.20)' : hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)', border: busy ? '1px solid rgba(255,255,255,0.05)' : hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)', cursor: busy ? 'not-allowed' : 'pointer' };
  return (
    <button type="button" onClick={busy ? undefined : onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} disabled={busy} className="flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150" style={{ ...style, borderRadius: '2px', flexShrink: 0 }}>
      {loading ? <svg className="animate-spin shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg> : icon}
      {label}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EditPromoCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [adminUser,      setAdminUser]      = useState<AdminUser | null>(null);
  const [form,           setForm]           = useState<PromoDraft>(EMPTY_DRAFT);
  const [usedCount,      setUsedCount]      = useState<number>(0);
  const [isDirty,        setIsDirty]        = useState(false);
  const [dataLoading,    setDataLoading]    = useState(true);
  const [savingDraft,    setSavingDraft]    = useState(false);
  const [savingActivate, setSavingActivate] = useState(false);
  const [archiving,      setArchiving]      = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);

  const patch = useCallback((p: Partial<PromoDraft>) => {
    setForm((prev) => ({ ...prev, ...p }));
    setIsDirty(true);
  }, []);

  // Auth check + load promo code
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meRes, codeRes] = await Promise.all([
          fetch('/api/admin/me'),
          fetch(`/api/admin/promos/${id}`),
        ]);
        if (meRes.status === 401 || meRes.status === 403) { router.push('/admin/login'); return; }
        if (!codeRes.ok) { router.push('/admin/promos'); return; }

        const { data: me }   = await meRes.json()   as { data?: AdminUser };
        const { data: code } = await codeRes.json() as { data?: Record<string, unknown> };

        if (cancelled) return;
        if (me)   setAdminUser(me);
        if (code) {
          setForm(apiToForm(code));
          setUsedCount(Number(code.usedCount ?? 0));
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, router]);

  const adminFullName  = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`     : '—';
  const adminShortName = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.` : '—';
  const adminRoleLabel = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  async function save(status: 'draft' | 'active') {
    setSaveError(null);
    const set = status === 'draft' ? setSavingDraft : setSavingActivate;
    set(true);
    try {
      const res  = await fetch(`/api/admin/promos/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, status }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setIsDirty(false);
    } catch {
      setSaveError('Network error. Check your connection and try again.');
    } finally {
      set(false);
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this promo code? This action cannot be undone.')) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/admin/promos/${id}/archive`, { method: 'PATCH' });
      if (res.ok) router.push('/admin/promos');
    } catch { /* ignore */ } finally {
      setArchiving(false);
    }
  }

  // Full-page loading state
  if (dataLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} strokeWidth={1.8} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
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
          pageTitle="Edit Promo Code"
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
                    Edit Promo Code
                  </h1>
                  {form.code && (
                    <span
                      className="text-[0.60rem] tracking-[0.18em] font-bold font-mono"
                      style={{ color: GOLD }}
                    >
                      {form.code}
                    </span>
                  )}
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
                  disabled={savingActivate || archiving}
                  onClick={() => void save('draft')}
                />
                <HeaderBtn
                  label="Activate Code"
                  icon={<Zap size={12} strokeWidth={2} />}
                  accent
                  loading={savingActivate}
                  disabled={savingDraft || archiving}
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
                <BasicInfoSection      value={form} onChange={patch} isEdit />
                <DiscountTypeSection   value={form} onChange={patch} />
                <UsageLimitsSection    value={form} onChange={patch} currentUsedCount={usedCount} />
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
        isEdit
        hasUnsavedChanges={isDirty}
        savingDraft={savingDraft}
        savingActivate={savingActivate}
        onSaveDraft={() => void save('draft')}
        onActivate={() => void save('active')}
        onArchive={handleArchive}
      />
    </div>
  );
}
