'use client';

import { useState, useId, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, ChevronDown, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCheckout } from './checkout-context';

// ── Data ───────────────────────────────────────────────────────────────────────

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa',
  'United Kingdom', 'United States', 'Canada', 'Other',
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface AddressForm {
  street:     string;
  apt:        string;
  city:       string;
  state:      string;
  lga:        string;
  postalCode: string;
  country:    string;
}

type FieldKey   = keyof AddressForm;
type TouchedMap = Partial<Record<FieldKey, boolean>>;
type ErrorMap   = Partial<Record<FieldKey, string>>;

interface SavedAddress extends AddressForm {
  id:    string;
  label: string;
}

// ── API address shape (from /api/addresses) ────────────────────────────────────

interface ApiAddress {
  _id:        string;
  label:      string;
  street:     string;
  apt?:       string;
  city:       string;
  state:      string;
  postalCode: string;
  country:    string;
  isDefault:  boolean;
}

const EMPTY_FORM: AddressForm = {
  street: '', apt: '', city: '', state: '', lga: '', postalCode: '', country: 'Nigeria',
};

// ── Validation ─────────────────────────────────────────────────────────────────

function validate(form: AddressForm): ErrorMap {
  const errors: ErrorMap = {};
  if (!form.street.trim())  errors.street  = 'Street address is required.';
  if (!form.city.trim())    errors.city    = 'City is required.';
  if (!form.state)          errors.state   = 'Please select a state.';
  if (!form.country)        errors.country = 'Please select a country.';
  return errors;
}

// ── Shared field error ─────────────────────────────────────────────────────────

function FieldError({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-1.5 text-[0.64rem] text-destructive mt-1.5 overflow-hidden"
      role="alert"
    >
      <AlertCircle size={11} strokeWidth={2} className="shrink-0" />
      {message}
    </motion.p>
  );
}

// ── Text input ─────────────────────────────────────────────────────────────────

interface InputFieldProps {
  id:           string;
  label:        string;
  optional?:    boolean;
  value:        string;
  placeholder:  string;
  type?:        string;
  inputMode?:   React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  error?:       string;
  touched:      boolean;
  onChange:     (v: string) => void;
  onBlur:       () => void;
}

function InputField({
  id, label, optional, value, placeholder,
  type = 'text', inputMode, autoComplete,
  error, touched, onChange, onBlur,
}: InputFieldProps) {
  const hasError = touched && !!error;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-[0.6rem] tracking-[0.22em] uppercase text-muted-foreground mb-1.5">
        {label}
        {optional && (
          <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">(optional)</span>
        )}
      </label>
      <div className={`border transition-colors duration-200 ${
        hasError ? 'border-destructive' : 'border-border focus-within:border-foreground/50'
      }`}>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-err` : undefined}
          className="w-full h-12 px-3 bg-transparent text-[0.88rem] text-foreground placeholder:text-muted-foreground/40 outline-none"
        />
      </div>
      <AnimatePresence initial={false}>
        {hasError && <div id={`${id}-err`}><FieldError message={error!} /></div>}
      </AnimatePresence>
    </div>
  );
}

// ── Select (State / Country) ───────────────────────────────────────────────────

interface SelectFieldProps {
  id:       string;
  label:    string;
  value:    string;
  options:  string[];
  placeholder: string;
  error?:   string;
  touched:  boolean;
  onChange: (v: string) => void;
  onBlur:   () => void;
}

function SelectField({
  id, label, value, options, placeholder,
  error, touched, onChange, onBlur,
}: SelectFieldProps) {
  const hasError = touched && !!error;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-[0.6rem] tracking-[0.22em] uppercase text-muted-foreground mb-1.5">
        {label}
      </label>
      <div className={`relative border transition-colors duration-200 ${
        hasError ? 'border-destructive' : 'border-border focus-within:border-foreground/50'
      }`}>
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-err` : undefined}
          className="w-full h-12 pl-3 pr-8 bg-transparent text-[0.88rem] text-foreground appearance-none outline-none cursor-pointer"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={1.8}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
      <AnimatePresence initial={false}>
        {hasError && <div id={`${id}-err`}><FieldError message={error!} /></div>}
      </AnimatePresence>
    </div>
  );
}

// ── Checkbox ───────────────────────────────────────────────────────────────────

function Checkbox({
  id, label, checked, onChange,
}: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer group">
      <button
        id={id}
        role="checkbox"
        aria-checked={checked}
        type="button"
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-4 h-4 flex items-center justify-center border transition-colors ${
          checked ? 'bg-foreground border-foreground' : 'border-border group-hover:border-foreground/40'
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <Check size={9} strokeWidth={3} className="text-background" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <span className="text-[0.76rem] text-foreground/80">{label}</span>
    </label>
  );
}

// ── Saved address card ─────────────────────────────────────────────────────────

function AddressCard({
  address, selected, onSelect, onEdit, onDelete,
}: {
  address:  SavedAddress;
  selected: boolean;
  onSelect: () => void;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      className={`relative cursor-pointer border p-4 transition-colors duration-200 ${
        selected
          ? 'border-foreground bg-foreground/3'
          : 'border-border hover:border-foreground/30'
      }`}
    >
      {/* Selection indicator */}
      <div className={`absolute top-3.5 right-3.5 w-4 h-4 flex items-center justify-center border transition-colors ${
        selected ? 'bg-foreground border-foreground' : 'border-border'
      }`}>
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.14 }}
            >
              <Check size={9} strokeWidth={3} className="text-background" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Label badge */}
      <span className="inline-block text-[0.52rem] tracking-[0.2em] uppercase text-muted-foreground border border-border px-1.5 py-0.5 mb-2">
        {address.label}
      </span>

      {/* Address lines */}
      <p className="text-[0.8rem] text-foreground leading-snug pr-6">
        {address.street}{address.apt && `, ${address.apt}`}
      </p>
      <p className="text-[0.76rem] text-muted-foreground mt-0.5">
        {address.city}, {address.state}{address.postalCode && ` ${address.postalCode}`}
      </p>
      <p className="text-[0.72rem] text-muted-foreground/70">{address.country}</p>

      {/* Edit / delete */}
      <div className="flex items-center gap-1 mt-3">
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          aria-label={`Edit ${address.label} address`}
          className="flex items-center gap-1 text-[0.58rem] tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors px-2 py-1 -ml-2"
        >
          <Pencil size={10} strokeWidth={1.8} />
          Edit
        </button>
        <span className="text-border select-none">·</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          aria-label={`Delete ${address.label} address`}
          className="flex items-center gap-1 text-[0.58rem] tracking-[0.14em] uppercase text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
        >
          <Trash2 size={10} strokeWidth={1.8} />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ── New / edit address form ────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function AddressFormFields({
  uid,
  initial,
  onCancel,
  onFormChange,
  showSaveCheckbox,
  onSaveAddress,
}: {
  uid:              string;
  initial?:         AddressForm;
  onCancel?:        () => void;
  onFormChange?:    (form: AddressForm) => void;
  showSaveCheckbox: boolean;
  onSaveAddress?:   (form: AddressForm) => Promise<void>;
}) {
  const [form, setForm]         = useState<AddressForm>(initial ?? EMPTY_FORM);
  const [touched, setTouched]   = useState<TouchedMap>({});
  const [saveAddr, setSaveAddr] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (isValid) onFormChange?.(form);
  }, [form, isValid, onFormChange]);

  // Reset save status when form changes after an error
  useEffect(() => {
    if (saveStatus === 'error') setSaveStatus('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function handleSaveToggle(checked: boolean) {
    setSaveAddr(checked);
    if (!checked || !isValid || !onSaveAddress) return;

    setSaveStatus('saving');
    try {
      await onSaveAddress(form);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      setSaveAddr(false);
    }
  }

  function set(field: FieldKey) {
    return (value: string) => setForm(prev => ({ ...prev, [field]: value }));
  }
  function touch(field: FieldKey) {
    return () => setTouched(prev => ({ ...prev, [field]: true }));
  }

  function handleCountryChange(v: string) {
    setForm(prev => ({ ...prev, country: v, state: v === 'Nigeria' ? prev.state : '' }));
  }

  const isNigeria = form.country === 'Nigeria';

  return (
    <div className="space-y-4">
      <InputField
        id={`${uid}-street`}
        label="Street Address"
        value={form.street}
        placeholder="14 Banana Island Road"
        autoComplete="address-line1"
        error={errors.street}
        touched={!!touched.street}
        onChange={set('street')}
        onBlur={touch('street')}
      />

      <InputField
        id={`${uid}-apt`}
        label="Apartment / Suite / Floor"
        optional
        value={form.apt}
        placeholder="Flat 3B, 2nd Floor…"
        autoComplete="address-line2"
        error={errors.apt}
        touched={!!touched.apt}
        onChange={set('apt')}
        onBlur={touch('apt')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          id={`${uid}-city`}
          label="City"
          value={form.city}
          placeholder="Lagos"
          autoComplete="address-level2"
          error={errors.city}
          touched={!!touched.city}
          onChange={set('city')}
          onBlur={touch('city')}
        />

        {isNigeria ? (
          <SelectField
            id={`${uid}-state`}
            label="State"
            value={form.state}
            options={NG_STATES}
            placeholder="Select state"
            error={errors.state}
            touched={!!touched.state}
            onChange={set('state')}
            onBlur={touch('state')}
          />
        ) : (
          <InputField
            id={`${uid}-state`}
            label="State / Province / Region"
            value={form.state}
            placeholder="Enter your region"
            autoComplete="address-level1"
            error={errors.state}
            touched={!!touched.state}
            onChange={set('state')}
            onBlur={touch('state')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          id={`${uid}-lga`}
          label="LGA / District"
          optional
          value={form.lga}
          placeholder="Eti-Osa"
          autoComplete="address-level3"
          error={errors.lga}
          touched={!!touched.lga}
          onChange={set('lga')}
          onBlur={touch('lga')}
        />
        <InputField
          id={`${uid}-postal`}
          label="Postal Code"
          optional
          value={form.postalCode}
          placeholder="101233"
          inputMode="numeric"
          autoComplete="postal-code"
          error={errors.postalCode}
          touched={!!touched.postalCode}
          onChange={set('postalCode')}
          onBlur={touch('postalCode')}
        />
      </div>

      <SelectField
        id={`${uid}-country`}
        label="Country"
        value={form.country}
        options={COUNTRIES}
        placeholder="Select country"
        error={errors.country}
        touched={!!touched.country}
        onChange={handleCountryChange}
        onBlur={touch('country')}
      />

      {showSaveCheckbox && (
        <div className="pt-1 space-y-1">
          <Checkbox
            id={`${uid}-save`}
            label="Save this address to my account"
            checked={saveAddr}
            onChange={handleSaveToggle}
          />
          <AnimatePresence>
            {saveStatus === 'saving' && (
              <motion.p
                key="saving"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[0.58rem] tracking-[0.06em] text-muted-foreground pl-7"
              >
                Saving…
              </motion.p>
            )}
            {saveStatus === 'saved' && (
              <motion.p
                key="saved"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[0.58rem] tracking-[0.06em] pl-7"
                style={{ color: 'oklch(0.6 0.15 145)' }}
              >
                <Check size={10} strokeWidth={2.5} />
                Address saved to your account
              </motion.p>
            )}
            {saveStatus === 'error' && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[0.58rem] tracking-[0.06em] text-destructive pl-7"
              >
                Could not save address. Please try again.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-[0.62rem] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function AddressSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="h-24 border border-border/40 animate-pulse bg-muted/20" />
      ))}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function DeliveryAddress() {
  const uid = useId();
  const { setAddressSummary } = useCheckout();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedId,     setSelectedId]     = useState<string | 'new' | null>(null);
  const [editingAddr,    setEditingAddr]     = useState<SavedAddress | null>(null);
  const [loading,        setLoading]         = useState(true);
  const [isGuest,        setIsGuest]         = useState(false);

  // ── Fetch user addresses on mount ──────────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch('/api/addresses', { credentials: 'include' });
      if (!res.ok) {
        // Not authenticated — guest checkout, show empty form
        setIsGuest(true);
        setSelectedId('new');
        setLoading(false);
        return;
      }
      const data = await res.json() as { data?: ApiAddress[] };
      const addresses: SavedAddress[] = (data.data ?? []).map(a => ({
        id:         a._id,
        label:      a.label,
        street:     a.street,
        apt:        a.apt ?? '',
        city:       a.city,
        state:      a.state,
        lga:        '',
        postalCode: a.postalCode,
        country:    a.country,
      }));
      setSavedAddresses(addresses);
      if (addresses.length > 0) {
        const rawDefault = (data.data ?? []).find(a => a.isDefault);
        setSelectedId(rawDefault ? rawDefault._id : addresses[0].id);
      } else {
        setSelectedId('new');
      }
    } catch {
      setIsGuest(true);
      setSelectedId('new');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const hasSaved = savedAddresses.length > 0;

  // ── Sync selected saved address to checkout context ───────────────────────
  useEffect(() => {
    if (!selectedId || selectedId === 'new') return;
    const addr = savedAddresses.find(a => a.id === selectedId);
    if (addr) {
      setAddressSummary({
        street:  addr.street,
        apt:     addr.apt,
        city:    addr.city,
        state:   addr.state,
        country: addr.country,
      });
    }
  }, [selectedId, savedAddresses, setAddressSummary]);

  // ── Save address to account ────────────────────────────────────────────────
  async function handleSaveAddress(form: AddressForm) {
    const res = await fetch('/api/addresses', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label:      'Home',
        street:     form.street,
        apt:        form.apt || undefined,
        city:       form.city,
        state:      form.state,
        postalCode: form.postalCode || '',
        country:    form.country,
        isDefault:  savedAddresses.length === 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      throw new Error(data.error ?? 'Failed to save address');
    }
  }

  function handleDelete(id: string) {
    setSavedAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) {
      const remaining = savedAddresses.filter(a => a.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : 'new');
    }
  }

  function handleEdit(addr: SavedAddress) {
    setEditingAddr(addr);
    setSelectedId('new');
  }

  return (
    <section>
      {/* Heading */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={13} strokeWidth={1.8} className="text-muted-foreground" />
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
          Delivery Address
        </h2>
      </div>

      {/* Loading state */}
      {loading && <AddressSkeleton />}

      {/* Saved address cards */}
      {!loading && hasSaved && (
        <div className="space-y-3 mb-4" role="radiogroup" aria-label="Saved addresses">
          <AnimatePresence initial={false}>
            {savedAddresses.map(addr => (
              <AddressCard
                key={addr.id}
                address={addr}
                selected={selectedId === addr.id && !editingAddr}
                onSelect={() => { setSelectedId(addr.id); setEditingAddr(null); }}
                onEdit={() => handleEdit(addr)}
                onDelete={() => handleDelete(addr.id)}
              />
            ))}
          </AnimatePresence>

          {/* Add new address toggle */}
          <button
            type="button"
            onClick={() => { setSelectedId('new'); setEditingAddr(null); }}
            className={`w-full h-12 flex items-center justify-center gap-2 border transition-colors duration-200 text-[0.64rem] tracking-[0.2em] uppercase ${
              selectedId === 'new'
                ? 'border-foreground text-foreground'
                : 'border-dashed border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            }`}
          >
            <Plus size={13} strokeWidth={2} />
            Add New Address
          </button>
        </div>
      )}

      {/* New / edit address form */}
      {!loading && (
        <AnimatePresence initial={false}>
          {(selectedId === 'new' || !hasSaved) && (
            <motion.div
              key="address-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="overflow-hidden"
            >
              <AddressFormFields
                uid={uid}
                initial={editingAddr ?? undefined}
                showSaveCheckbox={!isGuest && !editingAddr}
                onSaveAddress={!isGuest ? handleSaveAddress : undefined}
                onCancel={hasSaved ? () => {
                  setSelectedId(savedAddresses[0].id);
                  setEditingAddr(null);
                } : undefined}
                onFormChange={addr => setAddressSummary({
                  street:  addr.street,
                  apt:     addr.apt,
                  city:    addr.city,
                  state:   addr.state,
                  country: addr.country,
                })}
              />

              {/* Guest nudge — shown only when guest is entering a new address */}
              {isGuest && (
                <p className="mt-4 text-[0.62rem] tracking-[0.04em] text-muted-foreground/70 leading-relaxed">
                  Have an account?{' '}
                  <Link
                    href="/login?redirect=/checkout"
                    className="text-foreground underline underline-offset-2 hover:text-accent transition-colors"
                  >
                    Log in
                  </Link>
                  {' '}to use your saved addresses.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
}
