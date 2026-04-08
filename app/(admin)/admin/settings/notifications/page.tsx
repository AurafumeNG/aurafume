'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  Clock,
  Plus,
  X,
  Mail,
  MonitorDot,
  Layers2,
  TriangleAlert,
  ShieldAlert,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import {
  GOLD,
  inputBase,
  focusBorder,
  blurBorder,
  SectionCard,
  FieldLabel,
  HelperText,
  Divider,
  SettingsSubNav,
} from '@/components/admin/settings/shared';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

type NotifChannel = 'email' | 'in-app' | 'both';

interface OrderEvent {
  enabled: boolean;
  channel: NotifChannel;
}

interface SimpleEvent {
  enabled: boolean;
}

interface NotificationSettings {
  orderAlerts: {
    newOrder: OrderEvent;
    paymentConfirmed: OrderEvent;
    cancelledByCustomer: OrderEvent;
    refundRequested: OrderEvent;
  };
  bankTransferAlerts: {
    newTransferOrder: SimpleEvent;
    awaiting12h: SimpleEvent;
    awaiting24h: SimpleEvent;
    recipients: string[];
  };
  inventoryAlerts: {
    lowStock: SimpleEvent;
    outOfStock: SimpleEvent;
    restocked: SimpleEvent;
    recipients: string[];
    frequency: 'once' | 'daily';
  };
  customerAlerts: {
    newRegistered: SimpleEvent;
    accountSuspended: SimpleEvent;
    accountDeleted: SimpleEvent;
  };
  systemAlerts: {
    promoThreshold: SimpleEvent;
    promoExpired: SimpleEvent;
    failedLogin: SimpleEvent;
    passwordChanged: SimpleEvent;
  };
  globalRecipients: string[];
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: NotificationSettings = {
  orderAlerts: {
    newOrder:             { enabled: true,  channel: 'both'   },
    paymentConfirmed:     { enabled: true,  channel: 'both'   },
    cancelledByCustomer:  { enabled: true,  channel: 'email'  },
    refundRequested:      { enabled: true,  channel: 'both'   },
  },
  bankTransferAlerts: {
    newTransferOrder:  { enabled: true  },
    awaiting12h:       { enabled: true  },
    awaiting24h:       { enabled: true  },
    recipients:        ['admin@aurafumeng.com'],
  },
  inventoryAlerts: {
    lowStock:    { enabled: true  },
    outOfStock:  { enabled: true  },
    restocked:   { enabled: false },
    recipients:  ['admin@aurafumeng.com'],
    frequency:   'once',
  },
  customerAlerts: {
    newRegistered:      { enabled: false },
    accountSuspended:   { enabled: true  },
    accountDeleted:     { enabled: true  },
  },
  systemAlerts: {
    promoThreshold:  { enabled: true  },
    promoExpired:    { enabled: true  },
    failedLogin:     { enabled: true  },
    passwordChanged: { enabled: true  },
  },
  globalRecipients: ['admin@aurafumeng.com', 'manager@aurafumeng.com'],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSavedAt(date: Date) {
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' at ' +
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NotificationsSettingsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [adminUser, setAdminUser]       = useState<AdminUser | null>(null);
  const [saved, setSaved]               = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [settings, setSettings]         = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving]             = useState(false);
  const [savedAt, setSavedAt]           = useState<Date | null>(null);
  const [saveError, setSaveError]       = useState('');

  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved);

  // ── auth ──
  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) router.push('/admin/login');
        else setAdminUser(data.data);
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  // ── load saved settings ──
  useEffect(() => {
    fetch('/api/admin/settings/notifications')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          // Merge with defaults so any missing keys (older doc) still have values
          const merged: NotificationSettings = {
            ...DEFAULT_SETTINGS,
            ...json.data,
            orderAlerts:        { ...DEFAULT_SETTINGS.orderAlerts,        ...json.data.orderAlerts        },
            bankTransferAlerts: { ...DEFAULT_SETTINGS.bankTransferAlerts, ...json.data.bankTransferAlerts },
            inventoryAlerts:    { ...DEFAULT_SETTINGS.inventoryAlerts,    ...json.data.inventoryAlerts    },
            customerAlerts:     { ...DEFAULT_SETTINGS.customerAlerts,     ...json.data.customerAlerts     },
            systemAlerts:       { ...DEFAULT_SETTINGS.systemAlerts,       ...json.data.systemAlerts       },
          };
          setSaved(merged);
          setSettings(merged);
          if (json.data.updatedAt) setSavedAt(new Date(json.data.updatedAt));
        }
      })
      .catch(() => {});
  }, []);

  // ── updaters ──
  function setOrderEvent(
    key: keyof NotificationSettings['orderAlerts'],
    changes: Partial<OrderEvent>
  ) {
    setSettings((prev) => ({
      ...prev,
      orderAlerts: {
        ...prev.orderAlerts,
        [key]: { ...prev.orderAlerts[key], ...changes },
      },
    }));
  }

  function setBankEvent(
    key: keyof Pick<NotificationSettings['bankTransferAlerts'], 'newTransferOrder' | 'awaiting12h' | 'awaiting24h'>,
    changes: Partial<SimpleEvent>
  ) {
    setSettings((prev) => ({
      ...prev,
      bankTransferAlerts: {
        ...prev.bankTransferAlerts,
        [key]: { ...prev.bankTransferAlerts[key], ...changes },
      },
    }));
  }

  function setInventoryEvent(
    key: keyof Pick<NotificationSettings['inventoryAlerts'], 'lowStock' | 'outOfStock' | 'restocked'>,
    changes: Partial<SimpleEvent>
  ) {
    setSettings((prev) => ({
      ...prev,
      inventoryAlerts: {
        ...prev.inventoryAlerts,
        [key]: { ...prev.inventoryAlerts[key], ...changes },
      },
    }));
  }

  function setCustomerEvent(
    key: keyof NotificationSettings['customerAlerts'],
    changes: Partial<SimpleEvent>
  ) {
    setSettings((prev) => ({
      ...prev,
      customerAlerts: {
        ...prev.customerAlerts,
        [key]: { ...prev.customerAlerts[key], ...changes },
      },
    }));
  }

  function setSystemEvent(
    key: keyof NotificationSettings['systemAlerts'],
    changes: Partial<SimpleEvent>
  ) {
    setSettings((prev) => ({
      ...prev,
      systemAlerts: {
        ...prev.systemAlerts,
        [key]: { ...prev.systemAlerts[key], ...changes },
      },
    }));
  }

  // ── save ──
  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const res  = await fetch('/api/admin/settings/notifications', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      });
      const json = await res.json() as { success?: boolean; error?: string; data?: { updatedAt?: string } };
      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save settings.');
      } else {
        setSaved(settings);
        setSavedAt(json.data?.updatedAt ? new Date(json.data.updatedAt) : new Date());
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!adminUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0F0F0F' }}
      >
        <Loader2
          size={20}
          className="animate-spin"
          style={{ color: 'rgba(255,255,255,0.20)' }}
        />
      </div>
    );
  }

  const adminName = `${adminUser.firstName} ${adminUser.lastName}`;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>
      <AdminSidebar
        adminName={adminName}
        adminRole={adminUser.role}
        avatarUrl={adminUser.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <AdminTopNav
        pageTitle="Settings"
        adminName={adminName}
        avatarUrl={adminUser.avatar}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="lg:pl-55 pt-14 min-h-screen">
        <div className="flex min-h-[calc(100vh-56px)]">
          <SettingsSubNav />

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
              {/* ── Page header ── */}
              <PageHeader
                isDirty={isDirty}
                saving={saving}
                savedAt={savedAt}
                saveError={saveError}
                onSave={handleSave}
              />

              {/* ── Order alerts ── */}
              <OrderAlertsSection
                data={settings.orderAlerts}
                onEventChange={setOrderEvent}
              />

              {/* ── Bank transfer alerts ── */}
              <BankTransferAlertsSection
                data={settings.bankTransferAlerts}
                onEventChange={setBankEvent}
                onRecipientsChange={(emails) =>
                  setSettings((prev) => ({
                    ...prev,
                    bankTransferAlerts: { ...prev.bankTransferAlerts, recipients: emails },
                  }))
                }
              />

              {/* ── Inventory alerts ── */}
              <InventoryAlertsSection
                data={settings.inventoryAlerts}
                onEventChange={setInventoryEvent}
                onRecipientsChange={(emails) =>
                  setSettings((prev) => ({
                    ...prev,
                    inventoryAlerts: { ...prev.inventoryAlerts, recipients: emails },
                  }))
                }
                onFrequencyChange={(frequency) =>
                  setSettings((prev) => ({
                    ...prev,
                    inventoryAlerts: { ...prev.inventoryAlerts, frequency },
                  }))
                }
              />

              {/* ── Customer alerts ── */}
              <CustomerAlertsSection
                data={settings.customerAlerts}
                onEventChange={setCustomerEvent}
              />

              {/* ── System alerts ── */}
              <SystemAlertsSection
                data={settings.systemAlerts}
                onEventChange={setSystemEvent}
              />

              {/* ── Global recipients ── */}
              <GlobalRecipientsSection
                emails={settings.globalRecipients}
                onChange={(emails) =>
                  setSettings((prev) => ({ ...prev, globalRecipients: emails }))
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────────────────────

function PageHeader({
  isDirty,
  saving,
  savedAt,
  saveError,
  onSave,
}: {
  isDirty: boolean;
  saving: boolean;
  savedAt: Date | null;
  saveError: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1
          className="text-[0.88rem] tracking-[0.06em] font-semibold leading-tight"
          style={{ color: 'rgba(255,255,255,0.88)' }}
        >
          Notification Settings
        </h1>
        <p
          className="mt-1 text-[0.52rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.36)' }}
        >
          Configure admin alerts and notifications
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <SaveButton isDirty={isDirty} saving={saving} onSave={onSave} />
        {saveError ? (
          <p className="text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(239,68,68,0.80)' }}>
            {saveError}
          </p>
        ) : savedAt ? (
          <div
            className="flex items-center gap-1.5 text-[0.44rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            <Clock size={10} strokeWidth={1.8} />
            <span>Last saved {formatSavedAt(savedAt)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Order Alerts Section ───────────────────────────────────────────────────────

function OrderAlertsSection({
  data,
  onEventChange,
}: {
  data: NotificationSettings['orderAlerts'];
  onEventChange: (
    key: keyof NotificationSettings['orderAlerts'],
    changes: Partial<OrderEvent>
  ) => void;
}) {
  return (
    <SectionCard
      title="Order Alerts"
      subtitle="Get notified when order activity occurs in your store"
    >
      <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <OrderNotifRow
          label="New order placed"
          description="Triggered when a customer completes checkout"
          event={data.newOrder}
          onToggle={() => onEventChange('newOrder', { enabled: !data.newOrder.enabled })}
          onChannelChange={(channel) => onEventChange('newOrder', { channel })}
        />
        <OrderNotifRow
          label="Order payment confirmed"
          description="Triggered when bank transfer or card payment is verified"
          event={data.paymentConfirmed}
          onToggle={() => onEventChange('paymentConfirmed', { enabled: !data.paymentConfirmed.enabled })}
          onChannelChange={(channel) => onEventChange('paymentConfirmed', { channel })}
        />
        <OrderNotifRow
          label="Order cancelled by customer"
          description="Triggered when a customer cancels their own order"
          event={data.cancelledByCustomer}
          onToggle={() => onEventChange('cancelledByCustomer', { enabled: !data.cancelledByCustomer.enabled })}
          onChannelChange={(channel) => onEventChange('cancelledByCustomer', { channel })}
        />
        <OrderNotifRow
          label="Refund requested"
          description="Triggered when a customer requests a refund"
          event={data.refundRequested}
          onToggle={() => onEventChange('refundRequested', { enabled: !data.refundRequested.enabled })}
          onChannelChange={(channel) => onEventChange('refundRequested', { channel })}
        />
      </div>
    </SectionCard>
  );
}

// ── Bank Transfer Alerts Section ───────────────────────────────────────────────

function BankTransferAlertsSection({
  data,
  onEventChange,
  onRecipientsChange,
}: {
  data: NotificationSettings['bankTransferAlerts'];
  onEventChange: (
    key: 'newTransferOrder' | 'awaiting12h' | 'awaiting24h',
    changes: Partial<SimpleEvent>
  ) => void;
  onRecipientsChange: (emails: string[]) => void;
}) {
  return (
    <SectionCard
      title="Bank Transfer Alerts"
      subtitle="Monitor manual payment transfers requiring admin action"
    >
      <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <SimpleNotifRow
          label="New bank transfer order"
          description="Customer places an order and selects bank transfer"
          event={data.newTransferOrder}
          onToggle={() => onEventChange('newTransferOrder', { enabled: !data.newTransferOrder.enabled })}
          urgency="urgent"
        />
        <SimpleNotifRow
          label="Transfer awaiting more than 12 hours"
          description="Payment proof not received within 12 hours of order"
          event={data.awaiting12h}
          onToggle={() => onEventChange('awaiting12h', { enabled: !data.awaiting12h.enabled })}
        />
        <SimpleNotifRow
          label="Transfer awaiting more than 24 hours"
          description="Order risks auto-cancellation — immediate action needed"
          event={data.awaiting24h}
          onToggle={() => onEventChange('awaiting24h', { enabled: !data.awaiting24h.enabled })}
          urgency="critical"
        />
      </div>

      <Divider />

      <div>
        <FieldLabel>Alert Recipients</FieldLabel>
        <HelperText>
          These admins receive all bank transfer alert emails
        </HelperText>
        <div className="mt-2">
          <EmailListEditor emails={data.recipients} onChange={onRecipientsChange} />
        </div>
      </div>
    </SectionCard>
  );
}

// ── Inventory Alerts Section ───────────────────────────────────────────────────

function InventoryAlertsSection({
  data,
  onEventChange,
  onRecipientsChange,
  onFrequencyChange,
}: {
  data: NotificationSettings['inventoryAlerts'];
  onEventChange: (
    key: 'lowStock' | 'outOfStock' | 'restocked',
    changes: Partial<SimpleEvent>
  ) => void;
  onRecipientsChange: (emails: string[]) => void;
  onFrequencyChange: (freq: 'once' | 'daily') => void;
}) {
  return (
    <SectionCard
      title="Inventory Alerts"
      subtitle="Stay informed about stock levels across your product catalog"
    >
      <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <SimpleNotifRow
          label="Product goes low stock"
          description="Triggered when a variant's stock falls below your low stock threshold"
          event={data.lowStock}
          onToggle={() => onEventChange('lowStock', { enabled: !data.lowStock.enabled })}
          urgency="urgent"
        />
        <SimpleNotifRow
          label="Product goes out of stock"
          description="Triggered when a variant's available quantity reaches zero"
          event={data.outOfStock}
          onToggle={() => onEventChange('outOfStock', { enabled: !data.outOfStock.enabled })}
          urgency="critical"
        />
        <SimpleNotifRow
          label="Product restocked"
          description="Triggered when stock is added to a previously empty variant"
          event={data.restocked}
          onToggle={() => onEventChange('restocked', { enabled: !data.restocked.enabled })}
        />
      </div>

      <Divider />

      <div>
        <FieldLabel>Global Alert Recipients</FieldLabel>
        <HelperText>Receives all inventory alert emails</HelperText>
        <div className="mt-2">
          <EmailListEditor emails={data.recipients} onChange={onRecipientsChange} />
        </div>
      </div>

      <Divider />

      <div>
        <FieldLabel>Alert Frequency</FieldLabel>
        <div className="mt-2 space-y-2">
          <FrequencyRadioOption
            id="freq-once"
            value="once"
            current={data.frequency}
            label="Alert once when threshold crossed"
            description="Send one notification when the condition is first met"
            onChange={onFrequencyChange}
          />
          <FrequencyRadioOption
            id="freq-daily"
            value="daily"
            current={data.frequency}
            label="Alert daily while below threshold"
            description="Repeat daily until the stock issue is resolved"
            onChange={onFrequencyChange}
          />
        </div>
      </div>
    </SectionCard>
  );
}

// ── Customer Alerts Section ────────────────────────────────────────────────────

function CustomerAlertsSection({
  data,
  onEventChange,
}: {
  data: NotificationSettings['customerAlerts'];
  onEventChange: (
    key: keyof NotificationSettings['customerAlerts'],
    changes: Partial<SimpleEvent>
  ) => void;
}) {
  return (
    <SectionCard
      title="Customer Alerts"
      subtitle="Track significant activity on customer accounts"
    >
      <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <SimpleNotifRow
          label="New customer registered"
          description="A new account was created on your store"
          event={data.newRegistered}
          onToggle={() => onEventChange('newRegistered', { enabled: !data.newRegistered.enabled })}
        />
        <SimpleNotifRow
          label="Customer account suspended"
          description="An admin suspends a customer account"
          event={data.accountSuspended}
          onToggle={() => onEventChange('accountSuspended', { enabled: !data.accountSuspended.enabled })}
          urgency="urgent"
        />
        <SimpleNotifRow
          label="Customer account deleted"
          description="A customer account is permanently deleted"
          event={data.accountDeleted}
          onToggle={() => onEventChange('accountDeleted', { enabled: !data.accountDeleted.enabled })}
          urgency="urgent"
        />
      </div>
    </SectionCard>
  );
}

// ── System Alerts Section ──────────────────────────────────────────────────────

function SystemAlertsSection({
  data,
  onEventChange,
}: {
  data: NotificationSettings['systemAlerts'];
  onEventChange: (
    key: keyof NotificationSettings['systemAlerts'],
    changes: Partial<SimpleEvent>
  ) => void;
}) {
  return (
    <SectionCard
      title="System Alerts"
      subtitle="Critical platform and security events"
    >
      <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <SimpleNotifRow
          label="Promo code usage threshold reached"
          description="A promo code is approaching or has hit its maximum usage limit"
          event={data.promoThreshold}
          onToggle={() => onEventChange('promoThreshold', { enabled: !data.promoThreshold.enabled })}
        />
        <SimpleNotifRow
          label="Promo code expired"
          description="An active promo code has passed its expiry date"
          event={data.promoExpired}
          onToggle={() => onEventChange('promoExpired', { enabled: !data.promoExpired.enabled })}
        />
        <SimpleNotifRow
          label="Failed login attempt to admin"
          description="An unrecognised login attempt was made on the admin panel"
          event={data.failedLogin}
          onToggle={() => onEventChange('failedLogin', { enabled: !data.failedLogin.enabled })}
          urgency="critical"
        />
        <SimpleNotifRow
          label="Admin account password changed"
          description="Any admin account password is modified"
          event={data.passwordChanged}
          onToggle={() => onEventChange('passwordChanged', { enabled: !data.passwordChanged.enabled })}
          urgency="urgent"
        />
      </div>
    </SectionCard>
  );
}

// ── Global Recipients Section ──────────────────────────────────────────────────

function GlobalRecipientsSection({
  emails,
  onChange,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
}) {
  return (
    <SectionCard
      title="Global Alert Recipients"
      subtitle="Default email addresses that receive all admin notifications"
    >
      <EmailListEditor emails={emails} onChange={onChange} />

      <div
        className="flex items-start gap-2.5 px-3 py-2.5"
        style={{
          background: 'rgba(180,130,60,0.05)',
          border: '1px solid rgba(180,130,60,0.12)',
        }}
      >
        <TriangleAlert
          size={12}
          strokeWidth={1.8}
          style={{ color: GOLD, flexShrink: 0, marginTop: 1 }}
        />
        <p
          className="text-[0.48rem] tracking-[0.06em] leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          Individual sections (Bank Transfer, Inventory) can specify their own recipient
          lists which override these defaults for those alert types.
        </p>
      </div>
    </SectionCard>
  );
}

// ── OrderNotifRow ──────────────────────────────────────────────────────────────

function OrderNotifRow({
  label,
  description,
  event,
  onToggle,
  onChannelChange,
}: {
  label: string;
  description: string;
  event: OrderEvent;
  onToggle: () => void;
  onChannelChange: (channel: NotifChannel) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      {/* Toggle */}
      <div className="pt-0.5 shrink-0">
        <SmallToggle enabled={event.enabled} onToggle={onToggle} />
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[0.56rem] tracking-[0.08em] font-medium leading-snug"
          style={{
            color: event.enabled
              ? 'rgba(255,255,255,0.78)'
              : 'rgba(255,255,255,0.28)',
          }}
        >
          {label}
        </p>
        <p
          className="mt-0.5 text-[0.46rem] tracking-[0.06em] leading-snug"
          style={{ color: 'rgba(255,255,255,0.26)' }}
        >
          {description}
        </p>
      </div>

      {/* Channel selector */}
      <div
        className="shrink-0 transition-opacity duration-200"
        style={{ opacity: event.enabled ? 1 : 0.25, pointerEvents: event.enabled ? 'auto' : 'none' }}
      >
        <ChannelSelector value={event.channel} onChange={onChannelChange} />
      </div>
    </div>
  );
}

// ── SimpleNotifRow ─────────────────────────────────────────────────────────────

function SimpleNotifRow({
  label,
  description,
  event,
  onToggle,
  urgency,
}: {
  label: string;
  description: string;
  event: SimpleEvent;
  onToggle: () => void;
  urgency?: 'urgent' | 'critical';
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      {/* Toggle */}
      <div className="pt-0.5 shrink-0">
        <SmallToggle enabled={event.enabled} onToggle={onToggle} />
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className="text-[0.56rem] tracking-[0.08em] font-medium leading-snug"
            style={{
              color: event.enabled
                ? 'rgba(255,255,255,0.78)'
                : 'rgba(255,255,255,0.28)',
            }}
          >
            {label}
          </p>
          {urgency && <UrgencyBadge level={urgency} />}
        </div>
        <p
          className="mt-0.5 text-[0.46rem] tracking-[0.06em] leading-snug"
          style={{ color: 'rgba(255,255,255,0.26)' }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

// ── ChannelSelector ────────────────────────────────────────────────────────────

const CHANNELS: { value: NotifChannel; icon: React.ReactNode; label: string }[] = [
  {
    value: 'email',
    icon: <Mail size={10} strokeWidth={2} />,
    label: 'Email',
  },
  {
    value: 'in-app',
    icon: <MonitorDot size={10} strokeWidth={2} />,
    label: 'In-app',
  },
  {
    value: 'both',
    icon: <Layers2 size={10} strokeWidth={2} />,
    label: 'Both',
  },
];

function ChannelSelector({
  value,
  onChange,
}: {
  value: NotifChannel;
  onChange: (channel: NotifChannel) => void;
}) {
  return (
    <div
      className="flex items-center"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}
    >
      {CHANNELS.map((ch) => {
        const active = value === ch.value;
        return (
          <ChannelOption
            key={ch.value}
            active={active}
            icon={ch.icon}
            label={ch.label}
            onClick={() => onChange(ch.value)}
          />
        );
      })}
    </div>
  );
}

function ChannelOption({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1 h-7 px-2.5 text-[0.44rem] tracking-[0.08em] font-medium transition-colors duration-150"
      style={{
        background: active
          ? 'rgba(180,130,60,0.14)'
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
        color: active ? GOLD : hovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── UrgencyBadge ───────────────────────────────────────────────────────────────

function UrgencyBadge({ level }: { level: 'urgent' | 'critical' }) {
  const isUrgent = level === 'urgent';
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[0.38rem] tracking-[0.12em] uppercase font-semibold shrink-0"
      style={{
        background: isUrgent
          ? 'rgba(251,146,60,0.10)'
          : 'rgba(239,68,68,0.10)',
        border: `1px solid ${isUrgent ? 'rgba(251,146,60,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: isUrgent ? 'rgba(251,146,60,0.90)' : 'rgba(239,68,68,0.85)',
      }}
    >
      {isUrgent ? (
        <TriangleAlert size={8} strokeWidth={2} />
      ) : (
        <ShieldAlert size={8} strokeWidth={2} />
      )}
      {level}
    </span>
  );
}

// ── FrequencyRadioOption ───────────────────────────────────────────────────────

function FrequencyRadioOption({
  id,
  value,
  current,
  label,
  description,
  onChange,
}: {
  id: string;
  value: 'once' | 'daily';
  current: 'once' | 'daily';
  label: string;
  description: string;
  onChange: (v: 'once' | 'daily') => void;
}) {
  const selected = value === current;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      id={id}
      onClick={() => onChange(value)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors duration-150"
      style={{
        background: selected
          ? 'rgba(180,130,60,0.06)'
          : hovered
            ? 'rgba(255,255,255,0.03)'
            : 'transparent',
        border: `1px solid ${selected ? 'rgba(180,130,60,0.22)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Radio circle */}
      <span
        className="mt-0.5 shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-full transition-colors duration-150"
        style={{
          border: `1.5px solid ${selected ? GOLD : 'rgba(255,255,255,0.20)'}`,
          background: 'transparent',
        }}
      >
        {selected && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: GOLD }}
          />
        )}
      </span>

      <div>
        <p
          className="text-[0.54rem] tracking-[0.08em] font-medium leading-snug"
          style={{ color: selected ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.48)' }}
        >
          {label}
        </p>
        <p
          className="mt-0.5 text-[0.44rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.26)' }}
        >
          {description}
        </p>
      </div>
    </button>
  );
}

// ── EmailListEditor ────────────────────────────────────────────────────────────

function EmailListEditor({
  emails,
  onChange,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addEmail() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    if (emails.includes(trimmed)) {
      setError('Already in the list');
      return;
    }
    onChange([...emails, trimmed]);
    setInput('');
    setError('');
  }

  function removeEmail(email: string) {
    onChange(emails.filter((e) => e !== email));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
    if (e.key === 'Escape') {
      setInput('');
      setError('');
    }
  }

  return (
    <div className="space-y-2">
      {/* Existing emails */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emails.map((email) => (
            <EmailChip
              key={email}
              email={email}
              onRemove={() => removeEmail(email)}
            />
          ))}
        </div>
      )}

      {/* Add email input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="email"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Add email address..."
            className="h-8 px-3 text-[0.54rem] tracking-[0.06em] rounded-none w-full"
            style={{
              ...inputBase,
              borderColor: error ? 'rgba(239,68,68,0.45)' : undefined,
            }}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
        <AddEmailButton onClick={addEmail} />
      </div>

      {error && (
        <p
          className="text-[0.46rem] tracking-[0.06em]"
          style={{ color: 'rgba(239,68,68,0.75)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function EmailChip({
  email,
  onRemove,
}: {
  email: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="flex items-center gap-1.5 pl-2.5 pr-1.5 h-6 text-[0.46rem] tracking-[0.06em]"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.55)',
      }}
    >
      <Mail size={9} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
      {email}
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center w-3.5 h-3.5 transition-colors duration-100"
        style={{ color: 'rgba(255,255,255,0.22)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(239,68,68,0.75)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
        aria-label={`Remove ${email}`}
      >
        <X size={9} strokeWidth={2.5} />
      </button>
    </span>
  );
}

function AddEmailButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1.5 h-8 px-3 text-[0.48rem] tracking-widest uppercase font-semibold transition-colors duration-150 shrink-0"
      style={{
        background: hovered ? 'rgba(180,130,60,0.14)' : 'rgba(180,130,60,0.07)',
        border: `1px solid ${hovered ? 'rgba(180,130,60,0.35)' : 'rgba(180,130,60,0.16)'}`,
        color: GOLD,
      }}
    >
      <Plus size={10} strokeWidth={2.2} />
      Add
    </button>
  );
}

// ── SmallToggle ────────────────────────────────────────────────────────────────

function SmallToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className="relative shrink-0 w-8 h-4.5 rounded-full transition-colors duration-200"
      style={{
        background: enabled ? 'rgba(74,222,128,0.78)' : 'rgba(255,255,255,0.10)',
        border: `1px solid ${enabled ? 'rgba(74,222,128,0.40)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(14px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// ── SaveButton ─────────────────────────────────────────────────────────────────

function SaveButton({
  isDirty,
  saving,
  onSave,
}: {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = isDirty && !saving;

  return (
    <button
      onClick={onSave}
      disabled={!active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 h-8 px-4 text-[0.52rem] tracking-[0.14em] uppercase font-semibold transition-all duration-150"
      style={{
        background: active
          ? hovered ? 'oklch(0.48 0.09 70)' : GOLD
          : 'rgba(255,255,255,0.05)',
        color: active ? 'oklch(0.10 0 0)' : 'rgba(255,255,255,0.20)',
        cursor: active ? 'pointer' : 'not-allowed',
        border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {saving ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Save size={11} strokeWidth={2.2} />
      )}
      {saving ? 'Saving…' : 'Save Changes'}
    </button>
  );
}
