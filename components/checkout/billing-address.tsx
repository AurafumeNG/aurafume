'use client';

import { useState, useId } from 'react';
import { Check, ChevronDown, CreditCard, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// ── Shared data ────────────────────────────────────────────────────────────────

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

interface BillingForm {
  street:     string;
  apt:        string;
  city:       string;
  state:      string;
  lga:        string;
  postalCode: string;
  country:    string;
}

type FieldKey   = keyof BillingForm;
type TouchedMap = Partial<Record<FieldKey, boolean>>;
type ErrorMap   = Partial<Record<FieldKey, string>>;

const EMPTY: BillingForm = {
  street: '', apt: '', city: '', state: '', lga: '', postalCode: '', country: 'Nigeria',
};

function validate(f: BillingForm): ErrorMap {
  const e: ErrorMap = {};
  if (!f.street.trim()) e.street  = 'Street address is required.';
  if (!f.city.trim())   e.city    = 'City is required.';
  if (!f.state)         e.state   = 'Please select a state.';
  if (!f.country)       e.country = 'Please select a country.';
  return e;
}

// ── Field components ───────────────────────────────────────────────────────────

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

function InputField({
  id, label, optional = false, value, placeholder, type = 'text',
  inputMode, autoComplete, error, touched, onChange, onBlur,
}: {
  id: string; label: string; optional?: boolean; value: string;
  placeholder: string; type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string; error?: string; touched: boolean;
  onChange: (v: string) => void; onBlur: () => void;
}) {
  const hasError = touched && !!error;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-[0.6rem] tracking-[0.22em] uppercase text-muted-foreground mb-1.5">
        {label}
        {optional && <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">(optional)</span>}
      </label>
      <div className={`border transition-colors duration-200 ${hasError ? 'border-destructive' : 'border-border focus-within:border-foreground/50'}`}>
        <input
          id={id} type={type} value={value} placeholder={placeholder}
          inputMode={inputMode} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)} onBlur={onBlur}
          aria-invalid={hasError} aria-describedby={hasError ? `${id}-err` : undefined}
          className="w-full h-12 px-3 bg-transparent text-[0.88rem] text-foreground placeholder:text-muted-foreground/40 outline-none"
        />
      </div>
      <AnimatePresence initial={false}>
        {hasError && <div id={`${id}-err`}><FieldError message={error!} /></div>}
      </AnimatePresence>
    </div>
  );
}

function SelectField({
  id, label, value, options, placeholder, error, touched, onChange, onBlur,
}: {
  id: string; label: string; value: string; options: string[];
  placeholder: string; error?: string; touched: boolean;
  onChange: (v: string) => void; onBlur: () => void;
}) {
  const hasError = touched && !!error;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-[0.6rem] tracking-[0.22em] uppercase text-muted-foreground mb-1.5">
        {label}
      </label>
      <div className={`relative border transition-colors duration-200 ${hasError ? 'border-destructive' : 'border-border focus-within:border-foreground/50'}`}>
        <select
          id={id} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
          aria-invalid={hasError} aria-describedby={hasError ? `${id}-err` : undefined}
          className="w-full h-12 pl-3 pr-8 bg-transparent text-[0.88rem] text-foreground appearance-none outline-none cursor-pointer"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} strokeWidth={1.8} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      <AnimatePresence initial={false}>
        {hasError && <div id={`${id}-err`}><FieldError message={error!} /></div>}
      </AnimatePresence>
    </div>
  );
}

// ── Same-as-delivery checkbox ──────────────────────────────────────────────────

function SameCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
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
      <span className="text-[0.78rem] text-foreground/80">Same as delivery address</span>
    </label>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function BillingAddress() {
  const uid = useId();
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const [form, setForm]                     = useState<BillingForm>(EMPTY);
  const [touched, setTouched]               = useState<TouchedMap>({});

  const errors = validate(form);

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
    <section>
      {/* Heading */}
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={13} strokeWidth={1.8} className="text-muted-foreground" />
        <h2 className="text-[0.62rem] tracking-[0.32em] uppercase text-muted-foreground">
          Billing Address
        </h2>
      </div>

      {/* Same-as checkbox */}
      <SameCheckbox checked={sameAsDelivery} onChange={setSameAsDelivery} />

      {/* Separate billing form — revealed when unchecked */}
      <AnimatePresence initial={false}>
        {!sameAsDelivery && (
          <motion.div
            key="billing-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-4">

              <InputField
                id={`${uid}-street`}  label="Street Address"
                value={form.street}   placeholder="14 Banana Island Road"
                autoComplete="billing address-line1"
                error={errors.street} touched={!!touched.street}
                onChange={set('street')} onBlur={touch('street')}
              />

              <InputField
                id={`${uid}-apt`}     label="Apartment / Suite / Floor" optional
                value={form.apt}      placeholder="Flat 3B, 2nd Floor…"
                autoComplete="billing address-line2"
                error={errors.apt}    touched={!!touched.apt}
                onChange={set('apt')} onBlur={touch('apt')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id={`${uid}-city`}   label="City"
                  value={form.city}    placeholder="Lagos"
                  autoComplete="billing address-level2"
                  error={errors.city}  touched={!!touched.city}
                  onChange={set('city')} onBlur={touch('city')}
                />

                {isNigeria ? (
                  <SelectField
                    id={`${uid}-state`}  label="State"
                    value={form.state}   options={NG_STATES}
                    placeholder="Select state"
                    error={errors.state} touched={!!touched.state}
                    onChange={set('state')} onBlur={touch('state')}
                  />
                ) : (
                  <InputField
                    id={`${uid}-state`}  label="State / Province / Region"
                    value={form.state}   placeholder="Enter your region"
                    autoComplete="billing address-level1"
                    error={errors.state} touched={!!touched.state}
                    onChange={set('state')} onBlur={touch('state')}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  id={`${uid}-lga`}    label="LGA / District" optional
                  value={form.lga}     placeholder="Eti-Osa"
                  autoComplete="billing address-level3"
                  error={errors.lga}   touched={!!touched.lga}
                  onChange={set('lga')} onBlur={touch('lga')}
                />
                <InputField
                  id={`${uid}-postal`} label="Postal Code" optional
                  value={form.postalCode} placeholder="101233"
                  inputMode="numeric"  autoComplete="billing postal-code"
                  error={errors.postalCode} touched={!!touched.postalCode}
                  onChange={set('postalCode')} onBlur={touch('postalCode')}
                />
              </div>

              <SelectField
                id={`${uid}-country`} label="Country"
                value={form.country}  options={COUNTRIES}
                placeholder="Select country"
                error={errors.country} touched={!!touched.country}
                onChange={handleCountryChange} onBlur={touch('country')}
              />

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
