'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Upload, X, Clock, Loader2, ImageIcon } from 'lucide-react';
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

interface GeneralSettings {
  storeName: string;
  storeTagline: string;
  storeEmail: string;
  storePhone: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  storeName: 'AuraFumeNG',
  storeTagline: 'Luxury Fragrances for Every Soul',
  storeEmail: 'hello@aurafumeng.com',
  storePhone: '+234 801 234 5678',
  streetAddress: '',
  city: '',
  state: '',
  country: 'Nigeria',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function isEqual(a: GeneralSettings, b: GeneralSettings) {
  return (Object.keys(a) as (keyof GeneralSettings)[]).every(
    (k) => a[k] === b[k]
  );
}

function formatSavedAt(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) +
    ' at ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GeneralSettingsPage() {
  const router = useRouter();

  // ── auth / sidebar ──
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // ── form state ──
  const [saved, setSaved] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState('');

  // ── logo / favicon ──
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // ── derived ──
  const isDirty = !isEqual(form, saved) || !!logoFile || !!faviconFile;

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
    fetch('/api/admin/settings/general')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const loaded: GeneralSettings = {
            storeName:     json.data.storeName     ?? DEFAULT_SETTINGS.storeName,
            storeTagline:  json.data.storeTagline  ?? DEFAULT_SETTINGS.storeTagline,
            storeEmail:    json.data.storeEmail    ?? DEFAULT_SETTINGS.storeEmail,
            storePhone:    json.data.storePhone    ?? DEFAULT_SETTINGS.storePhone,
            streetAddress: json.data.streetAddress ?? DEFAULT_SETTINGS.streetAddress,
            city:          json.data.city          ?? DEFAULT_SETTINGS.city,
            state:         json.data.state         ?? DEFAULT_SETTINGS.state,
            country:       json.data.country       ?? DEFAULT_SETTINGS.country,
          };
          setSaved(loaded);
          setForm(loaded);
          if (json.data.logoUrl)    setLogoUrl(json.data.logoUrl);
          if (json.data.faviconUrl) setFaviconUrl(json.data.faviconUrl);
          if (json.data.updatedAt)  setSavedAt(new Date(json.data.updatedAt));
        }
      })
      .catch(() => {});
  }, []);

  // ── field update ──
  function setField<K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── logo upload ──
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
    e.target.value = '';
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoUrl(null);
  }

  // ── favicon upload ──
  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconFile(file);
    const url = URL.createObjectURL(file);
    setFaviconUrl(url);
    e.target.value = '';
  }

  // ── save ──
  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError('');

    try {
      let body: BodyInit;
      let headers: Record<string, string> = {};

      if (logoFile || faviconFile) {
        // multipart — include files
        const fd = new FormData();
        (Object.keys(form) as (keyof GeneralSettings)[]).forEach((k) =>
          fd.append(k, form[k])
        );
        if (logoFile)    fd.append('logo',    logoFile);
        if (faviconFile) fd.append('favicon', faviconFile);
        body = fd;
        // Let browser set Content-Type with boundary automatically
      } else {
        body = JSON.stringify(form);
        headers['Content-Type'] = 'application/json';
      }

      const res  = await fetch('/api/admin/settings/general', {
        method: 'PATCH',
        headers,
        body,
      });
      const json = await res.json() as {
        success?: boolean;
        error?: string;
        data?: { logoUrl?: string; faviconUrl?: string; updatedAt?: string };
      };

      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save settings.');
      } else {
        setSaved(form);
        setLogoFile(null);
        setFaviconFile(null);
        if (json.data?.logoUrl)    setLogoUrl(json.data.logoUrl);
        if (json.data?.faviconUrl) setFaviconUrl(json.data.faviconUrl);
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
          {/* Settings sub-navigation */}
          <SettingsSubNav />

          {/* Page content */}
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

              {/* ── Store Identity ── */}
              <SectionCard
                title="Store Identity"
                subtitle="Core information used across emails, invoices, and browser tabs"
              >
                {/* Store name */}
                <div>
                  <FieldLabel required>Store Name</FieldLabel>
                  <input
                    type="text"
                    value={form.storeName}
                    onChange={(e) => setField('storeName', e.target.value)}
                    placeholder="YourBrand Perfumes"
                    className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                    style={inputBase}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <HelperText>
                    Used in emails, invoices, and browser tab titles
                  </HelperText>
                </div>

                {/* Store tagline */}
                <div>
                  <FieldLabel>Store Tagline</FieldLabel>
                  <input
                    type="text"
                    value={form.storeTagline}
                    onChange={(e) => setField('storeTagline', e.target.value)}
                    placeholder="Luxury Fragrances for Every Soul"
                    className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                    style={inputBase}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <HelperText>
                    Shown on the homepage and in meta descriptions
                  </HelperText>
                </div>

                <Divider />

                {/* Store logo */}
                <div>
                  <FieldLabel>Store Logo</FieldLabel>
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 120,
                        height: 40,
                        background: '#1A1A1A',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Store logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <ImageIcon
                          size={18}
                          strokeWidth={1.5}
                          style={{ color: 'rgba(255,255,255,0.15)' }}
                        />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-0.5">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept=".png,.svg,.webp"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <UploadButton
                        onClick={() => logoInputRef.current?.click()}
                        icon={<Upload size={11} strokeWidth={2} />}
                        label="Upload New Logo"
                      />
                      {logoUrl && (
                        <button
                          onClick={handleRemoveLogo}
                          className="text-left text-[0.48rem] tracking-[0.08em] transition-colors duration-150"
                          style={{ color: 'rgba(239,68,68,0.65)' }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = 'rgba(239,68,68,0.90)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = 'rgba(239,68,68,0.65)')
                          }
                        >
                          Remove Logo
                        </button>
                      )}
                      <HelperText>
                        PNG, SVG, WEBP · Max 2MB · Transparent bg recommended
                      </HelperText>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div>
                  <FieldLabel>Store Favicon</FieldLabel>
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        background: '#1A1A1A',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {faviconUrl ? (
                        <img
                          src={faviconUrl}
                          alt="Favicon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon
                          size={13}
                          strokeWidth={1.5}
                          style={{ color: 'rgba(255,255,255,0.15)' }}
                        />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-0.5">
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept=".ico,.png"
                        className="hidden"
                        onChange={handleFaviconChange}
                      />
                      <UploadButton
                        onClick={() => faviconInputRef.current?.click()}
                        icon={<Upload size={11} strokeWidth={2} />}
                        label="Upload Favicon"
                      />
                      <HelperText>
                        ICO, PNG · Max 512KB · 32×32px or 64×64px recommended
                      </HelperText>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Store email */}
                <div>
                  <FieldLabel required>Store Email Address</FieldLabel>
                  <input
                    type="email"
                    value={form.storeEmail}
                    onChange={(e) => setField('storeEmail', e.target.value)}
                    placeholder="hello@yourbrand.com"
                    className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                    style={inputBase}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <HelperText>
                    Used as the reply-to address on all customer emails
                  </HelperText>
                </div>

                {/* Store phone */}
                <div>
                  <FieldLabel>Store Phone Number</FieldLabel>
                  <input
                    type="tel"
                    value={form.storePhone}
                    onChange={(e) => setField('storePhone', e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                    style={inputBase}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <HelperText>Shown on invoices and the contact page</HelperText>
                </div>

                <Divider />

                {/* Physical address */}
                <div>
                  <p
                    className="text-[0.50rem] tracking-[0.14em] uppercase font-medium mb-3"
                    style={{ color: 'rgba(255,255,255,0.38)' }}
                  >
                    Store Physical Address
                  </p>

                  {/* Street */}
                  <div className="mb-3">
                    <FieldLabel>Street Address</FieldLabel>
                    <textarea
                      value={form.streetAddress}
                      onChange={(e) =>
                        setField('streetAddress', e.target.value)
                      }
                      placeholder="14 Fragrance Avenue, Lekki Phase 1"
                      rows={2}
                      className="px-3 py-2 text-[0.56rem] tracking-[0.06em] resize-none rounded-none leading-relaxed"
                      style={inputBase}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  {/* City / State / Country */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <FieldLabel>City</FieldLabel>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setField('city', e.target.value)}
                        placeholder="Lagos"
                        className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                        style={inputBase}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                    </div>
                    <div>
                      <FieldLabel>State</FieldLabel>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => setField('state', e.target.value)}
                        placeholder="Lagos State"
                        className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                        style={inputBase}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                    </div>
                    <div>
                      <FieldLabel>Country</FieldLabel>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => setField('country', e.target.value)}
                        placeholder="Nigeria"
                        className="h-9 px-3 text-[0.56rem] tracking-[0.06em] rounded-none"
                        style={inputBase}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                    </div>
                  </div>
                  <HelperText>Shown on invoices and the contact page</HelperText>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
          General Settings
        </h1>
        <p
          className="mt-1 text-[0.52rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.36)' }}
        >
          Basic store identity and configuration
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
          ? `1px solid transparent`
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

function UploadButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1.5 h-7 px-3 text-[0.48rem] tracking-[0.10em] uppercase font-semibold transition-colors duration-150"
      style={{
        background: hovered ? 'rgba(180,130,60,0.14)' : 'rgba(180,130,60,0.08)',
        border: `1px solid ${hovered ? 'rgba(180,130,60,0.35)' : 'rgba(180,130,60,0.18)'}`,
        color: GOLD,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
