'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Mail, Bell, BellOff, Loader2, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';
import type { INotificationPreferences } from '@/models/User';

// ── Types ─────────────────────────────────────────────────────────────────────
type PrefPath =
  | 'email.orderUpdates' | 'email.promotions' | 'email.newArrivals'
  | 'email.restockedItems' | 'email.newsletter'
  | 'push.enabled' | 'push.orderStatusChanges' | 'push.flashSales' | 'push.deliveryUpdates';

type Permission = 'default' | 'granted' | 'denied' | 'unsupported';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = 'oklch(0.72 0.10 74)';

// ── Default prefs (shown while loading / fallback) ────────────────────────────
const DEFAULT_PREFS: INotificationPreferences = {
  email: {
    orderUpdates:   true,
    promotions:     false,
    newArrivals:    false,
    restockedItems: false,
    newsletter:     false,
  },
  push: {
    enabled:            false,
    orderStatusChanges: true,
    flashSales:         false,
    deliveryUpdates:    true,
  },
};

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  saving,
  disabled,
}: {
  checked:  boolean;
  onChange: () => void;
  saving?:  boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed"
      style={{
        background: checked && !disabled ? GOLD : 'oklch(0.82 0 0 / 0.55)',
        opacity:    disabled ? 0.35 : 1,
      }}
    >
      {saving ? (
        <Loader2
          size={10}
          strokeWidth={2.5}
          className="absolute inset-0 m-auto text-white animate-spin"
        />
      ) : (
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      )}
    </button>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  saving,
  disabled,
  last,
}: {
  label:        string;
  description?: string;
  checked:      boolean;
  onChange:     () => void;
  saving?:      boolean;
  disabled?:    boolean;
  last?:        boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3.5 px-4 ${
        last ? '' : 'border-b border-border/40'
      }`}
    >
      <div className="space-y-0.5 min-w-0">
        <p className={`text-[0.64rem] tracking-[0.08em] font-medium leading-none transition-colors ${
          disabled ? 'text-muted-foreground/35' : 'text-foreground'
        }`}>
          {label}
        </p>
        {description && (
          <p className={`text-[0.54rem] tracking-[0.04em] leading-relaxed transition-colors ${
            disabled ? 'text-muted-foreground/25' : 'text-muted-foreground/55'
          }`}>
            {description}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} saving={saving} disabled={disabled} />
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon:     React.ElementType;
  title:    string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon size={11} strokeWidth={1.8} className="text-muted-foreground/40" />
        <p className="text-[0.48rem] tracking-[0.28em] uppercase text-muted-foreground/40 font-medium">
          {title}
        </p>
      </div>
      <div className="border border-border/60 bg-background/40">
        {children}
      </div>
    </div>
  );
}

// ── Push permission banner ────────────────────────────────────────────────────
function PermissionBanner({ permission }: { permission: Permission }) {
  if (permission === 'granted' || permission === 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="overflow-hidden"
      >
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-border/40">
          <AlertTriangle size={13} strokeWidth={1.8} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {permission === 'denied' ? (
              <>
                <p className="text-[0.58rem] tracking-[0.04em] font-medium text-amber-700 dark:text-amber-400">
                  Notifications blocked
                </p>
                <p className="text-[0.52rem] tracking-[0.04em] text-amber-600/80 dark:text-amber-500/70 leading-relaxed">
                  Enable notifications in your browser settings to receive push alerts.
                </p>
              </>
            ) : (
              <>
                <p className="text-[0.58rem] tracking-[0.04em] font-medium text-amber-700 dark:text-amber-400">
                  Push not supported
                </p>
                <p className="text-[0.52rem] tracking-[0.04em] text-amber-600/80 dark:text-amber-500/70 leading-relaxed">
                  Your browser doesn't support push notifications. Try Chrome or Safari.
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Notifications header ──────────────────────────────────────────────────────
function NotificationsHeader() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-30 h-14 bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      <div className="h-full max-w-xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center">

        <div className="flex items-center">
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
        </div>

        <div className="flex items-center justify-center">
          <h1 className="font-heading text-[0.88rem] tracking-[0.22em] uppercase text-foreground leading-none">
            Notifications
          </h1>
        </div>

        <div />

      </div>
    </motion.header>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="pt-14 max-w-xl mx-auto px-5 sm:px-8 py-8 space-y-8">
      {[5, 4].map((rows, si) => (
        <div key={si} className="space-y-3">
          <div className="h-2 w-28 bg-muted/40 animate-pulse" />
          <div className="border border-border/40">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 last:border-0">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-32 bg-muted/40 animate-pulse" />
                  <div className="h-2 w-44 bg-muted/40 animate-pulse" />
                </div>
                <div className="w-9 h-5 rounded-full bg-muted/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router              = useRouter();
  const { user, isLoading } = useAuth();

  const [prefs,      setPrefs]      = useState<INotificationPreferences>(DEFAULT_PREFS);
  const [fetching,   setFetching]   = useState(true);
  const [saving,     setSaving]     = useState<Set<PrefPath>>(new Set());
  const [permission, setPermission] = useState<Permission>('default');

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?redirect=/account/notifications');
  }, [isLoading, user, router]);

  // ── Detect push permission status (client-only) ───────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as Permission);
  }, []);

  // ── Fetch preferences ─────────────────────────────────────────────────────
  const fetchPrefs = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications/preferences');
      const json = (await res.json()) as { success?: boolean; data?: INotificationPreferences };
      if (res.ok && json.success && json.data) setPrefs(json.data);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) fetchPrefs();
  }, [isLoading, user, fetchPrefs]);

  // ── Auto-save single preference ───────────────────────────────────────────
  const savePref = useCallback(async (path: PrefPath, value: boolean) => {
    // Optimistic update
    setPrefs(prev => {
      const next = structuredClone(prev);
      const [section, key] = path.split('.') as ['email' | 'push', string];
      (next[section] as Record<string, boolean>)[key] = value;
      return next;
    });

    setSaving(prev => new Set(prev).add(path));
    try {
      const res  = await fetch('/api/notifications/preferences', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ path, value }),
      });
      const json = (await res.json()) as { success?: boolean; data?: INotificationPreferences };
      if (res.ok && json.success && json.data) {
        setPrefs(json.data);
      } else {
        // Revert on error
        fetchPrefs();
      }
    } catch {
      fetchPrefs();
    } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(path); return next; });
    }
  }, [fetchPrefs]);

  // ── Push master toggle with permission flow ───────────────────────────────
  const handlePushMasterToggle = useCallback(async () => {
    if (prefs.push.enabled) {
      // Turning off — just update pref
      await savePref('push.enabled', false);
      return;
    }

    // Turning on — need permission
    if (permission === 'unsupported') return;
    if (permission === 'denied') return;   // banner already shown

    if (permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result as Permission);
      if (result !== 'granted') return;
    }

    await savePref('push.enabled', true);
  }, [prefs.push.enabled, permission, savePref]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const pushActive = prefs.push.enabled && permission === 'granted';
  const pushBlocked = permission === 'denied' || permission === 'unsupported';

  const isSaving = (path: PrefPath) => saving.has(path);

  if (isLoading || fetching) return <><NotificationsHeader /><PageSkeleton /></>;

  return (
    <>
      <NotificationsHeader />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-14 max-w-xl mx-auto px-5 sm:px-8 py-8 space-y-8"
      >

        {/* ── Email Notifications ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Section icon={Mail} title="Email Notifications">
            <ToggleRow
              label="Order Updates"
              description="Confirmation, shipping, and delivery emails"
              checked={prefs.email.orderUpdates}
              onChange={() => savePref('email.orderUpdates', !prefs.email.orderUpdates)}
              saving={isSaving('email.orderUpdates')}
            />
            <ToggleRow
              label="Promotions & Offers"
              description="Exclusive discounts and seasonal sales"
              checked={prefs.email.promotions}
              onChange={() => savePref('email.promotions', !prefs.email.promotions)}
              saving={isSaving('email.promotions')}
            />
            <ToggleRow
              label="New Arrivals"
              description="Be first to know about new fragrances"
              checked={prefs.email.newArrivals}
              onChange={() => savePref('email.newArrivals', !prefs.email.newArrivals)}
              saving={isSaving('email.newArrivals')}
            />
            <ToggleRow
              label="Restocked Items"
              description="Alerts when sold-out items are back in stock"
              checked={prefs.email.restockedItems}
              onChange={() => savePref('email.restockedItems', !prefs.email.restockedItems)}
              saving={isSaving('email.restockedItems')}
            />
            <ToggleRow
              label="Newsletter"
              description="Fragrance guides, stories, and editorial content"
              checked={prefs.email.newsletter}
              onChange={() => savePref('email.newsletter', !prefs.email.newsletter)}
              saving={isSaving('email.newsletter')}
              last
            />
          </Section>
        </motion.div>

        {/* ── Push Notifications ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
        >
          <Section icon={Bell} title="Push Notifications">

            {/* Permission banner */}
            <PermissionBanner permission={permission} />

            {/* Master toggle */}
            <div
              className="flex items-center justify-between gap-4 py-4 px-4 border-b border-border/40"
              style={{ background: 'oklch(0.97 0.005 80 / 0.5)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-7 h-7 shrink-0"
                  style={{ color: pushActive ? GOLD : undefined }}
                >
                  {pushActive
                    ? <Bell    size={14} strokeWidth={1.7} />
                    : <BellOff size={14} strokeWidth={1.7} className="text-muted-foreground/40" />
                  }
                </span>
                <div className="space-y-0.5">
                  <p className="text-[0.64rem] tracking-[0.08em] font-medium text-foreground leading-none">
                    Enable Push Notifications
                  </p>
                  <p className="text-[0.52rem] tracking-[0.04em] text-muted-foreground/55">
                    {pushActive
                      ? 'Push notifications are active'
                      : pushBlocked
                      ? 'Blocked in browser settings'
                      : 'Tap to enable on this device'
                    }
                  </p>
                </div>
              </div>
              <Toggle
                checked={prefs.push.enabled}
                onChange={handlePushMasterToggle}
                saving={isSaving('push.enabled')}
                disabled={pushBlocked}
              />
            </div>

            {/* Individual push toggles */}
            <ToggleRow
              label="Order Status Changes"
              description="Instant alerts when your order status updates"
              checked={prefs.push.orderStatusChanges}
              onChange={() => savePref('push.orderStatusChanges', !prefs.push.orderStatusChanges)}
              saving={isSaving('push.orderStatusChanges')}
              disabled={!pushActive}
            />
            <ToggleRow
              label="Flash Sales"
              description="Time-limited offers and surprise drops"
              checked={prefs.push.flashSales}
              onChange={() => savePref('push.flashSales', !prefs.push.flashSales)}
              saving={isSaving('push.flashSales')}
              disabled={!pushActive}
            />
            <ToggleRow
              label="Delivery Updates"
              description="Real-time tracking and delivery notifications"
              checked={prefs.push.deliveryUpdates}
              onChange={() => savePref('push.deliveryUpdates', !prefs.push.deliveryUpdates)}
              saving={isSaving('push.deliveryUpdates')}
              disabled={!pushActive}
              last
            />
          </Section>

          {/* Push hint */}
          <p className="mt-2 px-1 text-[0.48rem] tracking-[0.1em] text-muted-foreground/35 leading-relaxed">
            Push notifications require browser permission and only work while the app is installed or open.
          </p>
        </motion.div>

      </motion.div>
    </>
  );
}
