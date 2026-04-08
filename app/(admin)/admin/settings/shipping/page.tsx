'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  Clock,
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  Search,
  MapPin,
  Package,
  Check,
  X,
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

interface DeliveryMethod {
  id: string;
  type: 'delivery';
  enabled: boolean;
  label: string;
  description: string;
  fee: number;
  estimatedDaysFrom: number;
  estimatedDaysTo: number;
  availableStates: 'all' | 'specific';
  selectedStates: string[];
}

interface PickupMethod {
  id: string;
  type: 'pickup';
  enabled: boolean;
  label: string;
  description: string;
  fee: number;
  pickupAddress: string;
  pickupHours: string;
  pickupInstructions: string;
}

type ShippingMethod = DeliveryMethod | PickupMethod;

// ── Nigerian states ────────────────────────────────────────────────────────────

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_METHODS: ShippingMethod[] = [
  {
    id: 'outside-lagos',
    type: 'delivery',
    enabled: true,
    label: 'Outside Lagos',
    description: '3–5 business days',
    fee: 3500,
    estimatedDaysFrom: 3,
    estimatedDaysTo: 5,
    availableStates: 'all',
    selectedStates: [],
  },
  {
    id: 'within-lagos',
    type: 'delivery',
    enabled: true,
    label: 'Within Lagos',
    description: '0–2 business days',
    fee: 1500,
    estimatedDaysFrom: 0,
    estimatedDaysTo: 2,
    availableStates: 'specific',
    selectedStates: ['Lagos'],
  },
  {
    id: 'store-pickup',
    type: 'pickup',
    enabled: true,
    label: 'Store Pickup',
    description: 'Collect from our store',
    fee: 0,
    pickupAddress: '14 Fragrance Avenue, Lekki Phase 1, Lagos',
    pickupHours: 'Mon–Sat, 9am–6pm',
    pickupInstructions:
      'Bring your order confirmation email or SMS. Items are held for 7 days.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
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

export default function ShippingSettingsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const [saved, setSaved] = useState<ShippingMethod[]>(DEFAULT_METHODS);
  const [methods, setMethods] = useState<ShippingMethod[]>(DEFAULT_METHODS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState('');

  const isDirty = JSON.stringify(methods) !== JSON.stringify(saved);

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
    fetch('/api/admin/settings/shipping')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.methods) && json.data.methods.length > 0) {
          setSaved(json.data.methods as ShippingMethod[]);
          setMethods(json.data.methods as ShippingMethod[]);
          if (json.data.updatedAt) setSavedAt(new Date(json.data.updatedAt));
        }
      })
      .catch(() => {});
  }, []);

  // ── method mutations ──
  function updateMethod(id: string, changes: Partial<ShippingMethod>) {
    setMethods((prev) =>
      prev.map((m) =>
        m.id === id ? ({ ...m, ...changes } as ShippingMethod) : m
      )
    );
  }

  function addMethod(type: 'delivery' | 'pickup') {
    const id = `method-${Date.now()}`;
    const base = {
      id,
      enabled: true,
      label: type === 'delivery' ? 'New Delivery Zone' : 'Store Pickup',
      description: '',
      fee: 0,
    };
    if (type === 'delivery') {
      setMethods((prev) => [
        ...prev,
        {
          ...base,
          type: 'delivery' as const,
          estimatedDaysFrom: 1,
          estimatedDaysTo: 3,
          availableStates: 'all' as const,
          selectedStates: [],
        },
      ]);
    } else {
      setMethods((prev) => [
        ...prev,
        {
          ...base,
          type: 'pickup' as const,
          pickupAddress: '',
          pickupHours: '',
          pickupInstructions: '',
        },
      ]);
    }
  }

  function deleteMethod(id: string) {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  }

  function reorder(newOrder: ShippingMethod[]) {
    setMethods(newOrder);
  }

  // ── save ──
  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const res  = await fetch('/api/admin/settings/shipping', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ methods }),
      });
      const json = await res.json() as { success?: boolean; error?: string; data?: { updatedAt?: string } };
      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save settings.');
      } else {
        setSaved(methods);
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

              {/* ── Delivery methods ── */}
              <DeliveryMethodsSection
                methods={methods}
                onAdd={addMethod}
                onUpdate={updateMethod}
                onDelete={deleteMethod}
                onReorder={reorder}
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
          Shipping Settings
        </h1>
        <p
          className="mt-1 text-[0.52rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.36)' }}
        >
          Configure delivery methods and fees
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

// ── Delivery Methods Section ───────────────────────────────────────────────────

function DeliveryMethodsSection({
  methods,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: {
  methods: ShippingMethod[];
  onAdd: (type: 'delivery' | 'pickup') => void;
  onUpdate: (id: string, changes: Partial<ShippingMethod>) => void;
  onDelete: (id: string) => void;
  onReorder: (order: ShippingMethod[]) => void;
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <SectionCard
      title="Delivery Methods"
      subtitle="Define the shipping options available to customers at checkout"
    >
      {/* Cards list */}
      <MethodDragList
        methods={methods}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onReorder={onReorder}
      />

      {/* Add method */}
      <div className="relative" ref={addMenuRef}>
        <AddMethodButton
          onClick={() => setAddMenuOpen((o) => !o)}
          open={addMenuOpen}
        />

        {addMenuOpen && (
          <div
            className="absolute left-0 top-[calc(100%+6px)] w-52 py-1 z-20"
            style={{
              background: '#1E1E1E',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <AddMenuOption
              icon={<Package size={13} strokeWidth={1.8} />}
              label="Standard Delivery"
              sub="Zone with fee and estimated days"
              onClick={() => {
                onAdd('delivery');
                setAddMenuOpen(false);
              }}
            />
            <AddMenuOption
              icon={<MapPin size={13} strokeWidth={1.8} />}
              label="Store Pickup"
              sub="In-store collection, usually free"
              onClick={() => {
                onAdd('pickup');
                setAddMenuOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ── Drag list ──────────────────────────────────────────────────────────────────

function MethodDragList({
  methods,
  onUpdate,
  onDelete,
  onReorder,
}: {
  methods: ShippingMethod[];
  onUpdate: (id: string, changes: Partial<ShippingMethod>) => void;
  onDelete: (id: string) => void;
  onReorder: (order: ShippingMethod[]) => void;
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
    if (!draggingId) return;
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

  if (methods.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-10 text-center"
        style={{
          border: '1px dashed rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <Package
          size={22}
          strokeWidth={1.4}
          style={{ color: 'rgba(255,255,255,0.18)', marginBottom: 8 }}
        />
        <p
          className="text-[0.52rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          No delivery methods yet. Add one below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((method, index) => {
        const isDragging = draggingId === method.id;
        const isOver = overIndex === index && draggingId !== method.id;

        return (
          <MethodCard
            key={method.id}
            method={method}
            index={index}
            isDragging={isDragging}
            isOver={isOver}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDragStart={() => handleDragStart(method.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          />
        );
      })}
    </div>
  );
}

// ── Method Card (dispatcher) ───────────────────────────────────────────────────

function MethodCard({
  method,
  index,
  isDragging,
  isOver,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  method: ShippingMethod;
  index: number;
  isDragging: boolean;
  isOver: boolean;
  onUpdate: (id: string, changes: Partial<ShippingMethod>) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [isDraggable, setIsDraggable] = useState(false);

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => { onDragEnd(); setIsDraggable(false); }}
      style={{
        border: isOver
          ? `1px solid ${GOLD}`
          : isDragging
            ? '1px solid rgba(180,130,60,0.30)'
            : '1px solid rgba(255,255,255,0.07)',
        background: isDragging ? 'rgba(180,130,60,0.04)' : '#1A1A1A',
        opacity: isDragging ? 0.55 : 1,
        transition: 'border-color 0.12s, opacity 0.12s',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-4 h-11"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Grip — drag handle */}
        <div
          onMouseDown={() => setIsDraggable(true)}
          onMouseUp={() => setIsDraggable(false)}
          className="shrink-0 cursor-grab active:cursor-grabbing"
          style={{ color: 'rgba(255,255,255,0.18)', touchAction: 'none' }}
          title="Drag to reorder"
        >
          <GripVertical size={14} strokeWidth={1.8} />
        </div>

        {/* Toggle */}
        <SmallToggle
          enabled={method.enabled}
          onToggle={() => onUpdate(method.id, { enabled: !method.enabled })}
        />

        {/* Editable label */}
        <input
          type="text"
          value={method.label}
          onChange={(e) => onUpdate(method.id, { label: e.target.value })}
          className="flex-1 bg-transparent outline-none text-[0.60rem] tracking-[0.08em] font-medium min-w-0"
          style={{ color: 'rgba(255,255,255,0.80)' }}
          placeholder="Method name"
        />

        {/* Type badge */}
        <span
          className="shrink-0 px-2 py-0.5 text-[0.40rem] tracking-[0.14em] uppercase font-semibold"
          style={{
            background:
              method.type === 'pickup'
                ? 'rgba(74,222,128,0.08)'
                : 'rgba(180,130,60,0.10)',
            color:
              method.type === 'pickup'
                ? 'rgba(74,222,128,0.70)'
                : GOLD,
            border:
              method.type === 'pickup'
                ? '1px solid rgba(74,222,128,0.18)'
                : '1px solid rgba(180,130,60,0.20)',
          }}
        >
          {method.type === 'pickup' ? 'Pickup' : 'Delivery'}
        </span>

        {/* Delete */}
        <DeleteButton onClick={() => onDelete(method.id)} />
      </div>

      {/* Card body */}
      <div className="p-4 space-y-4">
        {method.type === 'delivery' ? (
          <DeliveryCardBody method={method} onUpdate={onUpdate} />
        ) : (
          <PickupCardBody method={method} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}

// ── Delivery card body ─────────────────────────────────────────────────────────

function DeliveryCardBody({
  method,
  onUpdate,
}: {
  method: DeliveryMethod;
  onUpdate: (id: string, changes: Partial<ShippingMethod>) => void;
}) {
  return (
    <>
      {/* Description */}
      <div>
        <FieldLabel>Description</FieldLabel>
        <input
          type="text"
          value={method.description}
          onChange={(e) =>
            onUpdate(method.id, { description: e.target.value })
          }
          placeholder="3–5 business days"
          className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <HelperText>Shown to customers below the method name at checkout</HelperText>
      </div>

      {/* Fee + Estimated days — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Shipping Fee</FieldLabel>
          <div
            className="flex items-center h-9"
            style={{
              background: '#1E1E1E',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span
              className="px-3 text-[0.52rem] shrink-0 h-full flex items-center"
              style={{
                color: 'rgba(255,255,255,0.28)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              ₦
            </span>
            <input
              type="number"
              value={method.fee}
              onChange={(e) =>
                onUpdate(method.id, {
                  fee: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              min={0}
              placeholder="0"
              className="flex-1 bg-transparent outline-none h-full px-3 text-[0.56rem] tracking-[0.06em] tabular-nums"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            />
          </div>
          {method.fee === 0 && (
            <HelperText color="green">Free shipping</HelperText>
          )}
        </div>

        <div>
          <FieldLabel>Estimated Days</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={method.estimatedDaysFrom}
              onChange={(e) =>
                onUpdate(method.id, {
                  estimatedDaysFrom: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              min={0}
              placeholder="0"
              className="h-9 px-3 text-[0.56rem] tracking-[0.06em] tabular-nums text-center rounded-none w-16"
              style={inputBase}
            />
            <span
              className="text-[0.48rem] shrink-0"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              –
            </span>
            <input
              type="number"
              value={method.estimatedDaysTo}
              onChange={(e) =>
                onUpdate(method.id, {
                  estimatedDaysTo: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              min={0}
              placeholder="5"
              className="h-9 px-3 text-[0.56rem] tracking-[0.06em] tabular-nums text-center rounded-none w-16"
              style={inputBase}
            />
            <span
              className="text-[0.48rem] shrink-0"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              days
            </span>
          </div>
        </div>
      </div>

      {/* Available states */}
      <div>
        <FieldLabel>Available States</FieldLabel>

        {/* All / Specific toggle */}
        <div className="flex gap-2 mb-3">
          {(['all', 'specific'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onUpdate(method.id, { availableStates: opt })
              }
              className="flex items-center gap-1.5 h-7 px-3 text-[0.48rem] tracking-widest uppercase font-semibold transition-colors duration-150"
              style={{
                background:
                  method.availableStates === opt
                    ? 'rgba(180,130,60,0.12)'
                    : 'rgba(255,255,255,0.04)',
                border:
                  method.availableStates === opt
                    ? `1px solid rgba(180,130,60,0.28)`
                    : '1px solid rgba(255,255,255,0.07)',
                color:
                  method.availableStates === opt
                    ? GOLD
                    : 'rgba(255,255,255,0.35)',
              }}
            >
              {method.availableStates === opt && (
                <Check size={9} strokeWidth={2.5} />
              )}
              {opt === 'all' ? 'All States' : 'Specific States'}
            </button>
          ))}
        </div>

        {method.availableStates === 'specific' && (
          <StatesMultiSelect
            selected={method.selectedStates}
            onChange={(states) =>
              onUpdate(method.id, { selectedStates: states })
            }
          />
        )}

        {method.availableStates === 'all' && (
          <HelperText>
            This method is available to customers in all 36 states + FCT
          </HelperText>
        )}
      </div>
    </>
  );
}

// ── Pickup card body ───────────────────────────────────────────────────────────

function PickupCardBody({
  method,
  onUpdate,
}: {
  method: PickupMethod;
  onUpdate: (id: string, changes: Partial<ShippingMethod>) => void;
}) {
  return (
    <>
      {/* Description */}
      <div>
        <FieldLabel>Description</FieldLabel>
        <input
          type="text"
          value={method.description}
          onChange={(e) =>
            onUpdate(method.id, { description: e.target.value })
          }
          placeholder="Collect from our store"
          className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
      </div>

      {/* Fee */}
      <div>
        <FieldLabel>Fee</FieldLabel>
        <div
          className="flex items-center h-9"
          style={{
            background: '#1E1E1E',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span
            className="px-3 text-[0.52rem] shrink-0 h-full flex items-center"
            style={{
              color: 'rgba(255,255,255,0.28)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            ₦
          </span>
          <input
            type="number"
            value={method.fee}
            onChange={(e) =>
              onUpdate(method.id, {
                fee: Math.max(0, parseInt(e.target.value) || 0),
              })
            }
            min={0}
            placeholder="0"
            className="flex-1 bg-transparent outline-none h-full px-3 text-[0.56rem] tracking-[0.06em] tabular-nums"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          />
        </div>
        {method.fee === 0 && (
          <HelperText color="green">₦0 — Free pickup</HelperText>
        )}
      </div>

      <Divider />

      {/* Pickup address */}
      <div>
        <FieldLabel>Pickup Address</FieldLabel>
        <input
          type="text"
          value={method.pickupAddress}
          onChange={(e) =>
            onUpdate(method.id, { pickupAddress: e.target.value })
          }
          placeholder="14 Fragrance Avenue, Lekki Phase 1, Lagos"
          className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <HelperText>Shown to customers after they choose this option</HelperText>
      </div>

      {/* Pickup hours */}
      <div>
        <FieldLabel>Pickup Hours</FieldLabel>
        <input
          type="text"
          value={method.pickupHours}
          onChange={(e) =>
            onUpdate(method.id, { pickupHours: e.target.value })
          }
          placeholder="Mon–Sat, 9am–6pm"
          className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
      </div>

      {/* Pickup instructions */}
      <div>
        <FieldLabel>Pickup Instructions</FieldLabel>
        <textarea
          value={method.pickupInstructions}
          onChange={(e) =>
            onUpdate(method.id, { pickupInstructions: e.target.value })
          }
          placeholder="Bring your order confirmation. Items are held for 7 days."
          rows={3}
          className="px-3 py-2.5 text-[0.56rem] tracking-[0.06em] resize-none rounded-none leading-relaxed"
          style={inputBase}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <HelperText>
          Displayed on the order confirmation page and confirmation email
        </HelperText>
      </div>
    </>
  );
}

// ── States Multi-Select ────────────────────────────────────────────────────────

function StatesMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (states: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = NG_STATES.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(state: string) {
    if (selected.includes(state)) {
      onChange(selected.filter((s) => s !== state));
    } else {
      onChange([...selected, state]);
    }
  }

  function selectAll() {
    onChange([...NG_STATES]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Selected chips + trigger */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-9 px-2.5 py-1.5 cursor-pointer"
        style={{
          background: '#1A1A1A',
          border: `1px solid ${open ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
        }}
        onClick={() => setOpen((o) => !o)}
      >
        {selected.length === 0 && (
          <span
            className="text-[0.52rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Select states...
          </span>
        )}

        {selected.slice(0, 4).map((state) => (
          <StateChip
            key={state}
            state={state}
            onRemove={(e) => {
              e.stopPropagation();
              toggle(state);
            }}
          />
        ))}

        {selected.length > 4 && (
          <span
            className="px-2 py-0.5 text-[0.44rem] tracking-[0.06em]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.40)',
            }}
          >
            +{selected.length - 4} more
          </span>
        )}

        <ChevronDown
          size={11}
          strokeWidth={2}
          className="ml-auto shrink-0 transition-transform duration-150"
          style={{
            color: 'rgba(255,255,255,0.25)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-30"
          style={{
            background: '#1E1E1E',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 h-9"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Search
              size={11}
              strokeWidth={1.8}
              style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search states..."
              className="flex-1 bg-transparent outline-none text-[0.52rem] tracking-[0.06em] min-w-0"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              autoFocus
            />
          </div>

          {/* Select all / Clear */}
          <div
            className="flex items-center justify-between px-3 py-1.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <button
              type="button"
              onClick={selectAll}
              className="text-[0.44rem] tracking-widest uppercase transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.30)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = GOLD)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')
              }
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-[0.44rem] tracking-widest uppercase transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.30)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'rgba(239,68,68,0.70)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')
              }
            >
              Clear
            </button>
          </div>

          {/* State list */}
          <div className="overflow-y-auto max-h-48 py-1">
            {filtered.length === 0 ? (
              <p
                className="px-3 py-3 text-[0.48rem] tracking-[0.06em] text-center"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                No states match "{search}"
              </p>
            ) : (
              filtered.map((state) => {
                const checked = selected.includes(state);
                return (
                  <StateOption
                    key={state}
                    state={state}
                    checked={checked}
                    onToggle={() => toggle(state)}
                  />
                );
              })
            )}
          </div>

          {/* Footer summary */}
          {selected.length > 0 && (
            <div
              className="px-3 py-2 text-[0.44rem] tracking-[0.06em]"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.28)',
              }}
            >
              {selected.length} state{selected.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StateChip({
  state,
  onRemove,
}: {
  state: string;
  onRemove: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      className="flex items-center gap-1 pl-2 pr-1 py-0.5 text-[0.44rem] tracking-[0.06em]"
      style={{
        background: 'rgba(180,130,60,0.10)',
        border: '1px solid rgba(180,130,60,0.20)',
        color: GOLD,
      }}
    >
      {state}
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center w-3 h-3 transition-colors duration-100"
        style={{ color: 'rgba(180,130,60,0.55)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = 'rgba(180,130,60,0.55)')
        }
      >
        <X size={8} strokeWidth={2.5} />
      </button>
    </span>
  );
}

function StateOption({
  state,
  checked,
  onToggle,
}: {
  state: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-3 h-8 text-left transition-colors duration-100"
      style={{
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
      }}
    >
      {/* Checkbox */}
      <span
        className="shrink-0 flex items-center justify-center w-3.5 h-3.5"
        style={{
          background: checked ? GOLD : 'transparent',
          border: `1px solid ${checked ? GOLD : 'rgba(255,255,255,0.18)'}`,
        }}
      >
        {checked && <Check size={8} strokeWidth={3} style={{ color: 'oklch(0.10 0 0)' }} />}
      </span>

      <span
        className="text-[0.52rem] tracking-[0.06em]"
        style={{ color: checked ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.48)' }}
      >
        {state}
      </span>
    </button>
  );
}

// ── Small reusable components ──────────────────────────────────────────────────

function AddMethodButton({
  onClick,
  open,
}: {
  onClick: () => void;
  open: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 h-9 px-4 w-full justify-center text-[0.50rem] tracking-[0.14em] uppercase font-semibold transition-colors duration-150"
      style={{
        background: open || hovered ? 'rgba(180,130,60,0.08)' : 'transparent',
        border: `1px dashed ${open || hovered ? 'rgba(180,130,60,0.35)' : 'rgba(255,255,255,0.12)'}`,
        color: open || hovered ? GOLD : 'rgba(255,255,255,0.30)',
      }}
    >
      <Plus size={12} strokeWidth={2.2} />
      Add Delivery Method
    </button>
  );
}

function AddMenuOption({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150"
      style={{
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: hovered ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.50)',
      }}
    >
      {icon}
      <div>
        <p className="text-[0.54rem] tracking-[0.08em] font-medium">{label}</p>
        <p
          className="mt-0.5 text-[0.44rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.28)' }}
        >
          {sub}
        </p>
      </div>
    </button>
  );
}

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

function DeleteButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="shrink-0 flex items-center justify-center w-7 h-7 transition-colors duration-150"
      style={{
        color: hovered ? 'rgba(239,68,68,0.80)' : 'rgba(255,255,255,0.18)',
        background: hovered ? 'rgba(239,68,68,0.08)' : 'transparent',
      }}
      title="Remove method"
    >
      <Trash2 size={13} strokeWidth={1.8} />
    </button>
  );
}

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
