'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
  Clock,
  CreditCard,
  Landmark,
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

interface BankTransferConfig {
  enabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  verificationDeadlineHours: number;
  verificationInstructions: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  label: string;
  icon: 'paystack' | 'bank';
}

interface PaymentsSettings {
  bankTransfer: BankTransferConfig;
  methodsOrder: PaymentMethod[];
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_METHODS: PaymentMethod[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Card, Bank, USSD',
    label: 'Pay with Card / Bank',
    icon: 'paystack',
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer',
    label: 'Direct Bank Transfer',
    icon: 'bank',
  },
];

const DEFAULT_SETTINGS: PaymentsSettings = {
  bankTransfer: {
    enabled: true,
    bankName: 'GTBank',
    accountName: 'AuraFumeNG Ltd',
    accountNumber: '0123456789',
    verificationDeadlineHours: 24,
    verificationInstructions:
      'Transfer the exact amount and use your order number as the narration. Send proof of payment to hello@aurafumeng.com.',
  },
  methodsOrder: DEFAULT_METHODS,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return '•'.repeat(num.length - 4) + num.slice(-4);
}

function deepEqual(a: PaymentsSettings, b: PaymentsSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PaymentsSettingsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const [saved, setSaved] = useState<PaymentsSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState<PaymentsSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState('');

  const isDirty = !deepEqual(form, saved);

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
    fetch('/api/admin/settings/payments')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const loaded: PaymentsSettings = {
            bankTransfer: { ...DEFAULT_SETTINGS.bankTransfer, ...json.data.bankTransfer },
            methodsOrder: Array.isArray(json.data.methodsOrder) && json.data.methodsOrder.length > 0
              ? json.data.methodsOrder as PaymentMethod[]
              : DEFAULT_SETTINGS.methodsOrder,
          };
          setSaved(loaded);
          setForm(loaded);
          if (json.data.updatedAt) setSavedAt(new Date(json.data.updatedAt));
        }
      })
      .catch(() => {});
  }, []);

  // ── field helpers ──
  function setBankField<K extends keyof BankTransferConfig>(
    key: K,
    value: BankTransferConfig[K]
  ) {
    setForm((prev) => ({
      ...prev,
      bankTransfer: { ...prev.bankTransfer, [key]: value },
    }));
  }

  function setMethodLabel(id: string, label: string) {
    setForm((prev) => ({
      ...prev,
      methodsOrder: prev.methodsOrder.map((m) =>
        m.id === id ? { ...m, label } : m
      ),
    }));
  }

  function reorderMethods(newOrder: PaymentMethod[]) {
    setForm((prev) => ({ ...prev, methodsOrder: newOrder }));
  }

  // ── save ──
  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const res  = await fetch('/api/admin/settings/payments', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const json = await res.json() as { success?: boolean; error?: string; data?: { bankTransfer?: BankTransferConfig; methodsOrder?: PaymentMethod[]; updatedAt?: string } };
      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save settings.');
      } else {
        // Sync saved state from server response (includes masked account number)
        const updated: PaymentsSettings = {
          bankTransfer: { ...form.bankTransfer, ...json.data?.bankTransfer },
          methodsOrder: json.data?.methodsOrder ?? form.methodsOrder,
        };
        setSaved(updated);
        setForm(updated);
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

      <main className="lg:pl-[220px] pt-14 min-h-screen">
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

              {/* ── Bank Transfer ── */}
              <BankTransferSection
                config={form.bankTransfer}
                onChange={setBankField}
              />

              {/* ── Payment Display ── */}
              <PaymentDisplaySection
                methods={form.methodsOrder}
                onReorder={reorderMethods}
                onLabelChange={setMethodLabel}
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
          Payment Settings
        </h1>
        <p
          className="mt-1 text-[0.52rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.36)' }}
        >
          Configure payment methods and processing
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

// ── Bank Transfer Section ──────────────────────────────────────────────────────

function BankTransferSection({
  config,
  onChange,
}: {
  config: BankTransferConfig;
  onChange: <K extends keyof BankTransferConfig>(
    key: K,
    value: BankTransferConfig[K]
  ) => void;
}) {
  const [accountRevealed, setAccountRevealed] = useState(false);

  return (
    <SectionCard
      title="Bank Transfer"
      subtitle="Direct bank payment option shown at checkout"
    >
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-[0.56rem] tracking-[0.08em] font-medium"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            Enable Bank Transfer
          </p>
          <p
            className="mt-0.5 text-[0.46rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            Show bank transfer as a payment option at checkout
          </p>
        </div>
        <MasterToggle
          enabled={config.enabled}
          onToggle={() => onChange('enabled', !config.enabled)}
        />
      </div>

      <Divider />

      {/* Bank name */}
      <div style={{ opacity: config.enabled ? 1 : 0.4, transition: 'opacity 0.2s' }}>
        <FieldLabel required>Bank Name</FieldLabel>
        <input
          type="text"
          value={config.bankName}
          onChange={(e) => onChange('bankName', e.target.value)}
          placeholder="GTBank"
          disabled={!config.enabled}
          className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
      </div>

      {/* Account name */}
      <div style={{ opacity: config.enabled ? 1 : 0.4, transition: 'opacity 0.2s' }}>
        <FieldLabel required>Account Name</FieldLabel>
        <input
          type="text"
          value={config.accountName}
          onChange={(e) => onChange('accountName', e.target.value)}
          placeholder="YourBrand Perfumes Ltd"
          disabled={!config.enabled}
          className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
      </div>

      {/* Account number */}
      <div style={{ opacity: config.enabled ? 1 : 0.4, transition: 'opacity 0.2s' }}>
        <FieldLabel required>Account Number</FieldLabel>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={accountRevealed ? 'text' : 'password'}
              value={config.accountNumber}
              onChange={(e) => onChange('accountNumber', e.target.value)}
              placeholder="0123456789"
              disabled={!config.enabled}
              className="h-9 px-3 pr-10 text-[0.56rem] tracking-[0.12em] rounded-none w-full"
              style={{
                ...inputBase,
                letterSpacing: accountRevealed ? '0.06em' : '0.20em',
              }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
            <button
              type="button"
              onClick={() => setAccountRevealed((v) => !v)}
              disabled={!config.enabled}
              className="absolute right-0 top-0 h-full px-3 flex items-center transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.28)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')
              }
              aria-label={accountRevealed ? 'Hide account number' : 'Reveal account number'}
            >
              {accountRevealed ? (
                <EyeOff size={13} strokeWidth={1.8} />
              ) : (
                <Eye size={13} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>
        <HelperText>
          {accountRevealed
            ? 'Account number visible — click eye to hide'
            : `Displaying as ${maskAccountNumber(config.accountNumber || '0000000000')}`}
        </HelperText>
      </div>

      <Divider />

      {/* Verification deadline */}
      <div style={{ opacity: config.enabled ? 1 : 0.4, transition: 'opacity 0.2s' }}>
        <FieldLabel>Payment Verification Deadline</FieldLabel>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={config.verificationDeadlineHours}
            onChange={(e) =>
              onChange(
                'verificationDeadlineHours',
                Math.max(1, parseInt(e.target.value) || 1)
              )
            }
            min={1}
            max={168}
            disabled={!config.enabled}
            className="h-9 px-3 text-[0.56rem] tracking-[0.06em] tabular-nums rounded-none w-24 text-center"
            style={inputBase}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
          <span
            className="text-[0.52rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.38)' }}
          >
            hours to verify transfer
          </span>
        </div>
        <HelperText>Order auto-cancels if payment is not verified within this window</HelperText>
      </div>

      {/* Verification instructions */}
      <div style={{ opacity: config.enabled ? 1 : 0.4, transition: 'opacity 0.2s' }}>
        <FieldLabel>Verification Instructions to Customer</FieldLabel>
        <textarea
          value={config.verificationInstructions}
          onChange={(e) => onChange('verificationInstructions', e.target.value)}
          placeholder="Transfer exact amount and use order number as narration..."
          rows={3}
          disabled={!config.enabled}
          className="px-3 py-2.5 text-[0.56rem] tracking-[0.06em] resize-none rounded-none leading-relaxed"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <HelperText>
          Shown on the bank transfer instructions screen after order placement
        </HelperText>
      </div>
    </SectionCard>
  );
}

// ── Payment Display Section ────────────────────────────────────────────────────

function PaymentDisplaySection({
  methods,
  onReorder,
  onLabelChange,
}: {
  methods: PaymentMethod[];
  onReorder: (newOrder: PaymentMethod[]) => void;
  onLabelChange: (id: string, label: string) => void;
}) {
  return (
    <SectionCard
      title="Payment Display"
      subtitle="Control how payment methods appear at checkout"
    >
      {/* Order */}
      <div>
        <FieldLabel hint="Drag to reorder">Active Payment Methods Order</FieldLabel>
        <p
          className="text-[0.46rem] tracking-[0.06em] mb-3"
          style={{ color: 'rgba(255,255,255,0.26)' }}
        >
          Methods are shown in this order at checkout
        </p>
        <DraggableMethodList methods={methods} onReorder={onReorder} />
      </div>

      <Divider />

      {/* Labels */}
      <div>
        <FieldLabel>Payment Method Labels</FieldLabel>
        <p
          className="text-[0.46rem] tracking-[0.06em] mb-3"
          style={{ color: 'rgba(255,255,255,0.26)' }}
        >
          Customize the label shown to customers for each method
        </p>
        <div className="space-y-3">
          {methods.map((method) => (
            <MethodLabelRow
              key={method.id}
              method={method}
              onChange={(label) => onLabelChange(method.id, label)}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ── Draggable Method List ──────────────────────────────────────────────────────

function DraggableMethodList({
  methods,
  onReorder,
}: {
  methods: PaymentMethod[];
  onReorder: (newOrder: PaymentMethod[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (draggingId === null) return;

    const dragIndex = methods.findIndex((m) => m.id === draggingId);
    if (dragIndex === dropIndex) {
      setDraggingId(null);
      setOverIndex(null);
      return;
    }

    const next = [...methods];
    const [removed] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, removed);
    onReorder(next);
    setDraggingId(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverIndex(null);
  }

  return (
    <div className="space-y-1.5">
      {methods.map((method, index) => {
        const isDragging = draggingId === method.id;
        const isOver = overIndex === index && draggingId !== method.id;
        const Icon = method.icon === 'paystack' ? CreditCard : Landmark;

        return (
          <div
            key={method.id}
            draggable
            onDragStart={() => handleDragStart(method.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-3 h-11 px-3 transition-all duration-150"
            style={{
              background: isDragging
                ? 'rgba(180,130,60,0.08)'
                : isOver
                  ? 'rgba(255,255,255,0.06)'
                  : '#1A1A1A',
              border: isDragging
                ? `1px solid rgba(180,130,60,0.30)`
                : isOver
                  ? '1px solid rgba(255,255,255,0.14)'
                  : '1px solid rgba(255,255,255,0.07)',
              opacity: isDragging ? 0.55 : 1,
              cursor: 'grab',
            }}
          >
            {/* Drag handle */}
            <GripVertical
              size={13}
              strokeWidth={1.8}
              style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0 }}
            />

            {/* Position badge */}
            <span
              className="flex items-center justify-center w-4 h-4 text-[0.40rem] font-bold shrink-0"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.30)',
              }}
            >
              {index + 1}
            </span>

            {/* Icon */}
            <Icon
              size={13}
              strokeWidth={1.8}
              style={{ color: GOLD, flexShrink: 0 }}
            />

            {/* Name + description */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[0.54rem] tracking-[0.08em] font-medium"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                {method.name}
              </p>
              <p
                className="text-[0.44rem] tracking-[0.06em]"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                {method.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Method Label Row ───────────────────────────────────────────────────────────

function MethodLabelRow({
  method,
  onChange,
}: {
  method: PaymentMethod;
  onChange: (label: string) => void;
}) {
  const Icon = method.icon === 'paystack' ? CreditCard : Landmark;

  return (
    <div className="flex items-center gap-3">
      {/* Method identifier */}
      <div
        className="flex items-center gap-2 shrink-0 w-32"
        style={{ color: 'rgba(255,255,255,0.42)' }}
      >
        <Icon size={12} strokeWidth={1.8} className="shrink-0" />
        <span className="text-[0.50rem] tracking-[0.08em] truncate">
          {method.name}
        </span>
      </div>

      {/* Arrow */}
      <span
        className="text-[0.44rem] shrink-0"
        style={{ color: 'rgba(255,255,255,0.18)' }}
      >
        →
      </span>

      {/* Editable label */}
      <input
        type="text"
        value={method.label}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 px-3 text-[0.54rem] tracking-[0.06em] rounded-none"
        style={inputBase}
        onFocus={focusBorder}
        onBlur={blurBorder}
      />
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

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
          ? hovered
            ? 'oklch(0.48 0.09 70)'
            : GOLD
          : 'rgba(255,255,255,0.05)',
        color: active ? 'oklch(0.10 0 0)' : 'rgba(255,255,255,0.20)',
        cursor: active ? 'pointer' : 'not-allowed',
        border: active
          ? '1px solid transparent'
          : '1px solid rgba(255,255,255,0.06)',
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

function MasterToggle({
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
      className="relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200"
      style={{
        background: enabled ? 'rgba(74,222,128,0.78)' : 'rgba(255,255,255,0.10)',
        border: `1px solid ${enabled ? 'rgba(74,222,128,0.40)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}
