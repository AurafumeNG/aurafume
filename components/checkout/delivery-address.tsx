'use client';

import { useState, useId } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, ChevronDown, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';

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
  label: string;   // 'Home', 'Office', etc.
}

// ── Mock saved addresses (swap for API data when auth is ready) ────────────────

const INITIAL_SAVED: SavedAddress[] = [
  {
    id: 'addr-1', label: 'Home',
    street: '14 Banana Island Road', apt: 'Flat 3B',
    city: 'Lagos', state: 'Lagos', lga: 'Eti-Osa',
    postalCode: '101233', country: 'Nigeria',
  },
  {
    id: 'addr-2', label: 'Office',
    street: '5 Adeola Odeku Street', apt: '',
    city: 'Lagos', state: 'Lagos', lga: 'Victoria Island',
    postalCode: '101241', country: 'Nigeria',
  },
];

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
          ? 'border-foreground bg-foreground/[0.03]'
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

function AddressForm({
  uid,
  initial,
  onCancel,
}: {
  uid:      string;
  initial?: AddressForm;
  onCancel?: () => void;
}) {
  const [form, setForm]       = useState<AddressForm>(initial ?? EMPTY_FORM);
  const [touched, setTouched] = useState<TouchedMap>({});
  const [saveAddr, setSaveAddr] = useState(false);

  const errors = validate(form);

  function set(field: FieldKey) {
    return (value: string) => setForm(prev => ({ ...prev, [field]: value }));
  }
  function touch(field: FieldKey) {
    return () => setTouched(prev => ({ ...prev, [field]: true }));
  }

  // When country changes away from Nigeria, clear state selection
  function handleCountryChange(v: string) {
    setForm(prev => ({ ...prev, country: v, state: v === 'Nigeria' ? prev.state : '' }));
  }

  const isNigeria = form.country === 'Nigeria';

  return (
    <div className="space-y-4">

      {/* Street address */}
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

      {/* Apt / Suite / Floor */}
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

      {/* City + State */}
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

      {/* LGA + Postal code */}
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

      {/* Country */}
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

      {/* Save address */}
      <div className="pt-1">
        <Checkbox
          id={`${uid}-save`}
          label="Save this address for future orders"
          checked={saveAddr}
          onChange={setSaveAddr}
        />
      </div>

      {/* Cancel (only when editing a saved address) */}
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

// ── Main export ────────────────────────────────────────────────────────────────

export default function DeliveryAddress() {
  const uid = useId();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(INITIAL_SAVED);
  const [selectedId, setSelectedId]         = useState<string | 'new' | null>(
    INITIAL_SAVED.length > 0 ? INITIAL_SAVED[0].id : 'new',
  );
  const [editingAddr, setEditingAddr]       = useState<SavedAddress | null>(null);

  const hasSaved = savedAddresses.length > 0;

  function handleDelete(id: string) {
    setSavedAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) {
      const remaining = savedAddresses.filter(a => a.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : 'new');
    }
  }

  function handleEdit(addr: SavedAddress) {
    setEditingAddr(addr);
    setSelectedId('new'); // expand form with pre-filled data
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

      {/* Saved address cards */}
      {hasSaved && (
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

      {/* New / edit address form — shown when "new" is selected or no saved addresses */}
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
            <AddressForm
              uid={uid}
              initial={editingAddr ?? undefined}
              onCancel={hasSaved ? () => {
                setSelectedId(savedAddresses[0].id);
                setEditingAddr(null);
              } : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
