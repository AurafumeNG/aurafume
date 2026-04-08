'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  Loader2,
  Shield,
  KeyRound,
  Lock,
  Monitor,
  Smartphone,
  Globe,
  QrCode,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Download,
  Check,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
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
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

interface SecuritySettings {
  minPasswordLength:   number;
  requireUppercase:    boolean;
  requireNumber:       boolean;
  requireSpecial:      boolean;
  passwordExpiry:      boolean;
  expiryDays:          number;
  maxLoginAttempts:    number;
  lockoutMinutes:      number;
  rememberDeviceDays:  number;
  sessionTimeoutHours: number;
  ipRestriction:       boolean;
  allowedIps:          string[];
}

interface SessionInfo {
  id:         string;
  isCurrent:  boolean;
  userAgent:  string;
  ip:         string;
  issuedAt:   string | null;
  lastActive: string;
}

interface SecurityLogEntry {
  _id:         string;
  event:       string;
  description: string;
  severity:    'info' | 'warning' | 'critical';
  adminId?:    string;
  adminName?:  string;
  ipAddress?:  string;
  location?:   string;
  createdAt:   string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: SecuritySettings = {
  minPasswordLength:   8,
  requireUppercase:    true,
  requireNumber:       true,
  requireSpecial:      true,
  passwordExpiry:      false,
  expiryDays:          90,
  maxLoginAttempts:    5,
  lockoutMinutes:      15,
  rememberDeviceDays:  30,
  sessionTimeoutHours: 8,
  ipRestriction:       false,
  allowedIps:          [],
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function parseUserAgent(ua: string): { device: string; browser: string } {
  const mobile  = /Mobile|Android|iPhone|iPad/i.test(ua);
  const browser =
    /Chrome/i.test(ua)  ? 'Chrome'  :
    /Firefox/i.test(ua) ? 'Firefox' :
    /Safari/i.test(ua)  ? 'Safari'  :
    /Edge/i.test(ua)    ? 'Edge'    : 'Browser';
  return { device: mobile ? 'Mobile' : 'Desktop', browser };
}

function isEqual<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ── Toggle ──────────────────────────────────────────────────────────────────────

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className="relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200"
      style={{
        background: on ? 'rgba(74,222,128,0.30)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${on ? 'rgba(74,222,128,0.50)' : 'rgba(255,255,255,0.12)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
        style={{
          left:       on ? 'calc(100% - 16px)' : '2px',
          background: on ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.30)',
        }}
      />
    </button>
  );
}

// ── PIN field ──────────────────────────────────────────────────────────────────

function PinField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
            onChange(v);
          }}
          placeholder={placeholder}
          className="h-9 px-3 pr-9 text-[0.62rem] tracking-widest"
          style={{ ...inputBase }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Severity badge ─────────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: 'info' | 'warning' | 'critical' }) {
  const color =
    severity === 'critical' ? '#ef4444' :
    severity === 'warning'  ? '#f59e0b' : 'rgba(255,255,255,0.25)';
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-0.75"
      style={{ background: color }}
    />
  );
}

function eventLabel(event: string) {
  const map: Record<string, string> = {
    login_success:      'Successful login',
    login_failed:       'Failed login attempt',
    login_locked:       'Account locked',
    password_changed:   'Password changed',
    pin_changed:        'PIN changed',
    pin_reset:          'PIN reset',
    session_revoked:    'Session revoked',
    session_revoked_all:'All sessions revoked',
    two_fa_enabled:     '2FA enabled',
    two_fa_disabled:    '2FA disabled',
    two_fa_failed:      '2FA verification failed',
    ip_blocked:         'IP address blocked',
    settings_changed:   'Security settings updated',
  };
  return map[event] ?? event;
}

// ── Admin PIN Management ───────────────────────────────────────────────────────

function AdminPinSection({ adminEmail }: { adminEmail: string }) {
  const [pinSet, setPinSet]           = useState<boolean | null>(null);
  const [currentPin, setCurrentPin]   = useState('');
  const [newPin, setNewPin]           = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<{ ok: boolean; text: string } | null>(null);

  const [resetOpen, setResetOpen]     = useState(false);
  const [resetPass, setResetPass]     = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [showResetPass, setShowResetPass] = useState(false);

  useEffect(() => {
    fetch('/api/admin/security/pin')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPinSet(d.data.pinSet); });
  }, []);

  async function handleUpdate() {
    setMsg(null);
    if (newPin.length !== 6) {
      setMsg({ ok: false, text: 'New PIN must be exactly 6 digits.' });
      return;
    }
    if (newPin !== confirmPin) {
      setMsg({ ok: false, text: 'PINs do not match.' });
      return;
    }
    if (pinSet && !currentPin) {
      setMsg({ ok: false, text: 'Current PIN is required.' });
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/security/pin', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPin: currentPin || undefined, newPin }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ ok: true, text: 'PIN updated successfully.' });
        setPinSet(true);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        setMsg({ ok: false, text: data.error ?? 'Failed to update PIN.' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetMsg(null);
    if (!resetPass) {
      setResetMsg({ ok: false, text: 'Password is required.' });
      return;
    }
    setResetLoading(true);
    try {
      const res  = await fetch('/api/admin/security/pin/reset', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: resetPass }),
      });
      const data = await res.json();
      if (data.success) {
        setResetMsg({ ok: true, text: 'PIN cleared. You can set a new one.' });
        setPinSet(false);
        setResetPass('');
        setTimeout(() => setResetOpen(false), 1500);
      } else {
        setResetMsg({ ok: false, text: data.error ?? 'Failed to reset PIN.' });
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <SectionCard
      title="Admin PIN"
      subtitle="Six-digit PIN required alongside password for admin login"
    >
      {/* Status */}
      <div className="flex items-center gap-2">
        <span
          className="text-[0.50rem] tracking-[0.12em] uppercase font-medium"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Current status
        </span>
        {pinSet === null ? (
          <Loader2 size={11} className="animate-spin" style={{ color: 'rgba(255,255,255,0.25)' }} />
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
            style={{
              background: pinSet ? 'rgba(74,222,128,0.10)' : 'rgba(239,68,68,0.10)',
              border:     `1px solid ${pinSet ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color:      pinSet ? 'rgba(74,222,128,0.90)' : 'rgba(239,68,68,0.75)',
            }}
          >
            {pinSet ? <ShieldCheck size={10} strokeWidth={2} /> : <ShieldOff size={10} strokeWidth={2} />}
            {pinSet ? 'PIN is set' : 'PIN not set'}
          </span>
        )}
      </div>

      <Divider />

      {/* Change PIN */}
      <div className="space-y-4">
        <p className="text-[0.52rem] tracking-widest uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.50)' }}>
          {pinSet ? 'Change PIN' : 'Set PIN'}
        </p>

        {pinSet && (
          <PinField
            label="Current PIN"
            value={currentPin}
            onChange={setCurrentPin}
            placeholder="••••••"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <PinField label="New PIN" value={newPin} onChange={setNewPin} placeholder="6 digits" />
          <PinField label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} placeholder="6 digits" />
        </div>

        {msg && <HelperText color={msg.ok ? 'green' : 'red'}>{msg.text}</HelperText>}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving}
            className="h-8 px-5 flex items-center gap-2 text-[0.52rem] tracking-[0.14em] uppercase font-semibold transition-opacity duration-150"
            style={{
              background: GOLD,
              color:      '#0a0a0a',
              opacity:    saving ? 0.6 : 1,
            }}
          >
            {saving && <Loader2 size={11} className="animate-spin" />}
            {pinSet ? 'Update PIN' : 'Set PIN'}
          </button>

          {pinSet && (
            <button
              type="button"
              onClick={() => setResetOpen((o) => !o)}
              className="text-[0.48rem] tracking-widest underline underline-offset-2"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              Forgot PIN?
            </button>
          )}
        </div>
      </div>

      {/* Forgot PIN panel */}
      <AnimatePresence>
        {resetOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-1 p-4 space-y-3"
              style={{
                background: 'rgba(239,68,68,0.05)',
                border:     '1px solid rgba(239,68,68,0.14)',
              }}
            >
              <p className="text-[0.50rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Confirm your account password to clear the current PIN. Sending to <span style={{ color: GOLD }}>{adminEmail}</span>.
              </p>
              <div>
                <FieldLabel>Account Password</FieldLabel>
                <div className="relative">
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    value={resetPass}
                    onChange={(e) => setResetPass(e.target.value)}
                    className="h-9 px-3 pr-9 text-[0.62rem]"
                    style={{ ...inputBase }}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255,255,255,0.30)' }}
                  >
                    {showResetPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              {resetMsg && <HelperText color={resetMsg.ok ? 'green' : 'red'}>{resetMsg.text}</HelperText>}
              <button
                type="button"
                onClick={handleReset}
                disabled={resetLoading}
                className="h-8 px-4 text-[0.50rem] tracking-[0.14em] uppercase font-semibold flex items-center gap-2"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border:     '1px solid rgba(239,68,68,0.30)',
                  color:      'rgba(239,68,68,0.80)',
                  opacity:    resetLoading ? 0.6 : 1,
                }}
              >
                {resetLoading && <Loader2 size={11} className="animate-spin" />}
                Clear PIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Divider />
      <p className="flex items-center gap-1.5 text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <Lock size={11} />
        PIN is required alongside your password for all admin logins
      </p>
    </SectionCard>
  );
}

// ── Password Policy ────────────────────────────────────────────────────────────

function PasswordPolicySection({
  settings,
  onChange,
}: {
  settings: SecuritySettings;
  onChange: (patch: Partial<SecuritySettings>) => void;
}) {
  return (
    <SectionCard title="Password Policy" subtitle="Rules applied when admins create or reset their password">
      {/* Min length */}
      <div>
        <FieldLabel>Minimum Password Length</FieldLabel>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={6}
            max={32}
            value={settings.minPasswordLength}
            onChange={(e) => onChange({ minPasswordLength: Number(e.target.value) })}
            className="h-9 px-3 w-20 text-[0.62rem] text-center"
            style={{ ...inputBase }}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
          <span className="text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>characters</span>
        </div>
      </div>

      <Divider />

      {/* Toggles */}
      {[
        { key: 'requireUppercase' as const, label: 'Require uppercase letter',   hint: 'e.g. A–Z' },
        { key: 'requireNumber'    as const, label: 'Require number',             hint: 'e.g. 0–9' },
        { key: 'requireSpecial'   as const, label: 'Require special character',  hint: 'e.g. !@#$' },
      ].map(({ key, label, hint }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.55rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</p>
            <p className="text-[0.46rem] tracking-[0.06em] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{hint}</p>
          </div>
          <Toggle on={settings[key]} onChange={(v) => onChange({ [key]: v })} />
        </div>
      ))}

      <Divider />

      {/* Password expiry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.55rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.65)' }}>Password Expiry</p>
            <p className="text-[0.46rem] tracking-[0.06em] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Force password reset after a set number of days</p>
          </div>
          <Toggle on={settings.passwordExpiry} onChange={(v) => onChange({ passwordExpiry: v })} />
        </div>
        <AnimatePresence>
          {settings.passwordExpiry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>Reset every</span>
                <input
                  type="number"
                  min={7}
                  max={365}
                  value={settings.expiryDays}
                  onChange={(e) => onChange({ expiryDays: Number(e.target.value) })}
                  className="h-8 px-3 w-20 text-[0.62rem] text-center"
                  style={{ ...inputBase }}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
                <span className="text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>days</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionCard>
  );
}

// ── Login Security ─────────────────────────────────────────────────────────────

function LoginSecuritySection({
  settings,
  onChange,
}: {
  settings: SecuritySettings;
  onChange: (patch: Partial<SecuritySettings>) => void;
}) {
  const [ipInput, setIpInput] = useState('');
  const [ipError, setIpError] = useState('');

  function addIp() {
    const val = ipInput.trim();
    if (!val) return;
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    const ipv6  = /^[0-9a-fA-F:]+$/;
    if (!ipv4.test(val) && !ipv6.test(val)) {
      setIpError('Enter a valid IP address (e.g. 196.45.10.1)');
      return;
    }
    if (settings.allowedIps.includes(val)) {
      setIpError('IP already in list');
      return;
    }
    setIpError('');
    onChange({ allowedIps: [...settings.allowedIps, val] });
    setIpInput('');
  }

  function removeIp(ip: string) {
    onChange({ allowedIps: settings.allowedIps.filter((x) => x !== ip) });
  }

  const numberRow = (
    label: string,
    hint: string,
    key: keyof SecuritySettings,
    suffix: string,
    min: number,
    max: number
  ) => (
    <div key={key}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={min}
          max={max}
          value={settings[key] as number}
          onChange={(e) => onChange({ [key]: Number(e.target.value) })}
          className="h-9 px-3 w-20 text-[0.62rem] text-center"
          style={{ ...inputBase }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <span className="text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{hint}</span>
      </div>
      <HelperText>{suffix}</HelperText>
    </div>
  );

  return (
    <SectionCard title="Login Security" subtitle="Control how admin login attempts and sessions are managed">
      {numberRow('Max Login Attempts', 'failed attempts before lockout', 'maxLoginAttempts', 'Account is locked once this threshold is reached', 1, 20)}
      <Divider />
      {numberRow('Lockout Duration', 'minutes', 'lockoutMinutes', 'How long the account remains locked after too many attempts', 1, 1440)}
      <Divider />
      {numberRow('Remember Device Duration', 'days', 'rememberDeviceDays', 'How long a trusted device is remembered before requiring full auth again', 1, 365)}
      <Divider />
      {numberRow('Session Timeout', 'hours of inactivity', 'sessionTimeoutHours', 'Admin is automatically signed out after this period of inactivity', 1, 72)}
      <Divider />

      {/* IP restriction */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.55rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.65)' }}>Restrict by IP Address</p>
            <p className="text-[0.46rem] tracking-[0.06em] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Limit admin access to specific IP addresses</p>
          </div>
          <Toggle on={settings.ipRestriction} onChange={(v) => onChange({ ipRestriction: v })} />
        </div>

        <AnimatePresence>
          {settings.ipRestriction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
              className="space-y-3 pt-1"
            >
              {/* Warning */}
              <div
                className="flex items-start gap-2 p-3"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border:     '1px solid rgba(239,68,68,0.18)',
                }}
              >
                <AlertTriangle size={12} strokeWidth={1.8} style={{ color: 'rgba(239,68,68,0.70)', marginTop: 1, flexShrink: 0 }} />
                <p className="text-[0.48rem] tracking-[0.06em] leading-relaxed" style={{ color: 'rgba(239,68,68,0.75)' }}>
                  Be careful — an incorrect IP list will lock you out of the admin panel.
                  Ensure your current IP is in the list before saving.
                </p>
              </div>

              {/* IP list chips */}
              {settings.allowedIps.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {settings.allowedIps.map((ip) => (
                    <span
                      key={ip}
                      className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[0.48rem] tracking-[0.08em]"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border:     '1px solid rgba(255,255,255,0.10)',
                        color:      'rgba(255,255,255,0.65)',
                      }}
                    >
                      <Globe size={10} strokeWidth={1.6} />
                      {ip}
                      <button
                        type="button"
                        onClick={() => removeIp(ip)}
                        className="ml-0.5 leading-none"
                        style={{ color: 'rgba(255,255,255,0.30)' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* IP input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => { setIpInput(e.target.value); setIpError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && addIp()}
                  placeholder="196.45.10.1"
                  className="flex-1 h-8 px-3 text-[0.58rem] tracking-widest"
                  style={{ ...inputBase }}
                  onFocus={focusBorder}
                  onBlur={(e) => blurBorder(e as unknown as React.FocusEvent<HTMLInputElement>)}
                />
                <button
                  type="button"
                  onClick={addIp}
                  className="h-8 px-4 text-[0.50rem] tracking-[0.14em] uppercase font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border:     '1px solid rgba(255,255,255,0.10)',
                    color:      'rgba(255,255,255,0.55)',
                  }}
                >
                  Add IP
                </button>
              </div>
              {ipError && <HelperText color="red">{ipError}</HelperText>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionCard>
  );
}

// ── Active Sessions ────────────────────────────────────────────────────────────

function ActiveSessionsSection() {
  const [sessions, setSessions]       = useState<SessionInfo[]>([]);
  const [loading, setLoading]         = useState(true);
  const [revoking, setRevoking]       = useState(false);
  const [revokeMsg, setRevokeMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const router                        = useRouter();

  useEffect(() => {
    fetch('/api/admin/security/sessions')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSessions(d.data.sessions); })
      .finally(() => setLoading(false));
  }, []);

  async function revokeAll() {
    setRevoking(true);
    setRevokeMsg(null);
    try {
      const res  = await fetch('/api/admin/security/sessions', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRevokeMsg({ ok: true, text: 'Session revoked. Redirecting…' });
        setTimeout(() => router.push('/admin/login'), 1500);
      } else {
        setRevokeMsg({ ok: false, text: data.error ?? 'Failed to revoke sessions.' });
      }
    } finally {
      setRevoking(false);
    }
  }

  return (
    <SectionCard
      title="Active Admin Sessions"
      subtitle="All currently active admin sessions across devices"
    >
      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
          <span className="text-[0.50rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading sessions…</span>
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-[0.50rem] tracking-[0.08em] py-2" style={{ color: 'rgba(255,255,255,0.25)' }}>No active sessions found.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const { device, browser } = parseUserAgent(s.userAgent);
            const DeviceIcon = device === 'Mobile' ? Smartphone : Monitor;
            return (
              <div
                key={s.id}
                className="p-3 flex items-center gap-3"
                style={{
                  background: s.isCurrent ? 'rgba(180,130,60,0.06)' : 'rgba(255,255,255,0.02)',
                  border:     `1px solid ${s.isCurrent ? 'rgba(180,130,60,0.15)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <DeviceIcon
                  size={18}
                  strokeWidth={1.4}
                  style={{ color: s.isCurrent ? GOLD : 'rgba(255,255,255,0.25)', flexShrink: 0 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.54rem] tracking-[0.08em] font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
                      {device} · {browser}
                    </span>
                    {s.isCurrent && (
                      <span
                        className="px-1.5 py-0.5 text-[0.42rem] tracking-[0.14em] uppercase font-semibold"
                        style={{
                          background: 'rgba(180,130,60,0.14)',
                          border:     '1px solid rgba(180,130,60,0.28)',
                          color:      GOLD,
                        }}
                      >
                        This device
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="flex items-center gap-1 text-[0.46rem] tracking-[0.06em]"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      <Globe size={10} /> {s.ip}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[0.46rem] tracking-[0.06em]"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      <Clock size={10} /> {formatRelative(s.lastActive)}
                    </span>
                    {s.issuedAt && (
                      <span
                        className="flex items-center gap-1 text-[0.46rem] tracking-[0.06em]"
                        style={{ color: 'rgba(255,255,255,0.20)' }}
                      >
                        <MapPin size={10} /> Issued {formatRelative(s.issuedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {revokeMsg && <HelperText color={revokeMsg.ok ? 'green' : 'red'}>{revokeMsg.text}</HelperText>}

      <div className="pt-1">
        <button
          type="button"
          onClick={revokeAll}
          disabled={revoking}
          className="h-8 px-4 flex items-center gap-2 text-[0.50rem] tracking-[0.14em] uppercase font-semibold"
          style={{
            background: 'rgba(239,68,68,0.10)',
            border:     '1px solid rgba(239,68,68,0.22)',
            color:      'rgba(239,68,68,0.75)',
            opacity:    revoking ? 0.6 : 1,
          }}
        >
          {revoking ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
          Revoke All Sessions
        </button>
        <HelperText>This will sign you out immediately on this device.</HelperText>
      </div>
    </SectionCard>
  );
}

// ── 2FA ────────────────────────────────────────────────────────────────────────

function TwoFASection() {
  const [enabled, setEnabled]             = useState<boolean | null>(null);
  const [loading, setLoading]             = useState(true);
  const [disableOpen, setDisableOpen]     = useState(false);
  const [disablePass, setDisablePass]     = useState('');
  const [showDisablePass, setShowDisablePass] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableMsg, setDisableMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied]               = useState(false);

  const PLACEHOLDER_SETUP_KEY = 'AURAFUME2FASECRETKEY';

  useEffect(() => {
    fetch('/api/admin/security/2fa')
      .then((r) => r.json())
      .then((d) => { if (d.success) setEnabled(d.data.enabled); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDisable() {
    setDisableMsg(null);
    if (!disablePass) {
      setDisableMsg({ ok: false, text: 'Password is required.' });
      return;
    }
    setDisableLoading(true);
    try {
      const res  = await fetch('/api/admin/security/2fa', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'disable', password: disablePass }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(false);
        setDisableOpen(false);
        setDisablePass('');
      } else {
        setDisableMsg({ ok: false, text: data.error ?? 'Failed to disable 2FA.' });
      }
    } finally {
      setDisableLoading(false);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(PLACEHOLDER_SETUP_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SectionCard
      title="Two-Factor Authentication"
      subtitle="Add an extra layer of security to your admin account"
    >
      {/* Status */}
      <div className="flex items-center gap-3">
        <span className="text-[0.50rem] tracking-[0.12em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</span>
        {loading ? (
          <Loader2 size={11} className="animate-spin" style={{ color: 'rgba(255,255,255,0.25)' }} />
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.46rem] tracking-[0.12em] uppercase font-semibold"
            style={{
              background: enabled ? 'rgba(74,222,128,0.10)' : 'rgba(255,255,255,0.05)',
              border:     `1px solid ${enabled ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.10)'}`,
              color:      enabled ? 'rgba(74,222,128,0.90)' : 'rgba(255,255,255,0.35)',
            }}
          >
            {enabled ? <ShieldCheck size={10} strokeWidth={2} /> : <ShieldOff size={10} strokeWidth={2} />}
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </div>

      <Divider />

      {!loading && !enabled && (
        <div className="space-y-4">
          <p className="text-[0.52rem] tracking-[0.08em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Scan the QR code below with an authenticator app (Google Authenticator, Authy, etc.) to enable 2FA on your account.
          </p>

          {/* QR placeholder */}
          <div
            className="flex flex-col items-center justify-center gap-3 p-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border:     '1px dashed rgba(255,255,255,0.10)',
            }}
          >
            <QrCode size={64} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-[0.46rem] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.20)' }}>
              2FA setup requires TOTP library installation
            </p>
          </div>

          {/* Manual key */}
          <div>
            <FieldLabel hint="Enter manually if QR fails">Manual Setup Key</FieldLabel>
            <div
              className="flex items-center gap-2 h-9 px-3"
              style={{
                background: '#1A1A1A',
                border:     '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <code
                className="flex-1 text-[0.52rem] tracking-widest font-mono"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {PLACEHOLDER_SETUP_KEY}
              </code>
              <button type="button" onClick={copyKey} style={{ color: 'rgba(255,255,255,0.30)' }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Verification code */}
          <div>
            <FieldLabel>Verification Code</FieldLabel>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code from authenticator"
                className="flex-1 h-9 px-3 text-[0.62rem] tracking-widest"
                style={{ ...inputBase }}
                onFocus={focusBorder}
                onBlur={blurBorder}
                disabled
              />
              <button
                type="button"
                disabled
                className="h-9 px-5 text-[0.52rem] tracking-[0.14em] uppercase font-semibold"
                style={{
                  background: GOLD,
                  color:      '#0a0a0a',
                  opacity:    0.4,
                  cursor:     'not-allowed',
                }}
              >
                Enable 2FA
              </button>
            </div>
            <HelperText>2FA activation requires installing the speakeasy + qrcode packages.</HelperText>
          </div>
        </div>
      )}

      {!loading && enabled && (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-[0.52rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.40)' }}>
            <ShieldCheck size={13} style={{ color: 'rgba(74,222,128,0.70)' }} />
            Two-factor authentication is active on your account.
          </p>

          <button
            type="button"
            onClick={() => setDisableOpen((o) => !o)}
            className="h-8 px-4 flex items-center gap-2 text-[0.50rem] tracking-[0.14em] uppercase font-semibold"
            style={{
              background: 'rgba(239,68,68,0.10)',
              border:     '1px solid rgba(239,68,68,0.22)',
              color:      'rgba(239,68,68,0.75)',
            }}
          >
            <ShieldOff size={11} />
            Disable 2FA
            {disableOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Disable confirmation */}
          <AnimatePresence>
            {disableOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  className="p-4 space-y-3"
                  style={{
                    background: 'rgba(239,68,68,0.05)',
                    border:     '1px solid rgba(239,68,68,0.14)',
                  }}
                >
                  <p className="text-[0.50rem] tracking-[0.08em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    Enter your account password to confirm disabling two-factor authentication.
                  </p>
                  <div>
                    <FieldLabel>Account Password</FieldLabel>
                    <div className="relative">
                      <input
                        type={showDisablePass ? 'text' : 'password'}
                        value={disablePass}
                        onChange={(e) => setDisablePass(e.target.value)}
                        placeholder="Your password"
                        className="h-9 px-3 pr-9 text-[0.62rem]"
                        style={{ ...inputBase }}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDisablePass((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(255,255,255,0.30)' }}
                      >
                        {showDisablePass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                  {disableMsg && <HelperText color={disableMsg.ok ? 'green' : 'red'}>{disableMsg.text}</HelperText>}
                  <button
                    type="button"
                    onClick={handleDisable}
                    disabled={disableLoading}
                    className="h-8 px-4 flex items-center gap-2 text-[0.50rem] tracking-[0.14em] uppercase font-semibold"
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border:     '1px solid rgba(239,68,68,0.30)',
                      color:      'rgba(239,68,68,0.80)',
                      opacity:    disableLoading ? 0.6 : 1,
                    }}
                  >
                    {disableLoading && <Loader2 size={11} className="animate-spin" />}
                    Confirm Disable
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </SectionCard>
  );
}

// ── Security Log ───────────────────────────────────────────────────────────────

function SecurityLogSection() {
  const [logs, setLogs]         = useState<SecurityLogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [filterEvt, setFilterEvt] = useState('');
  const [filterSev, setFilterSev] = useState('');

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (filterEvt) params.set('event',    filterEvt);
      if (filterSev) params.set('severity', filterSev);
      const res  = await fetch(`/api/admin/security/log?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setPage(data.data.page);
        setPages(data.data.pages);
        setTotal(data.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [filterEvt, filterSev]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  function exportCSV() {
    const header = 'Event,Description,Severity,Admin,IP,Date';
    const rows = logs.map((l) =>
      [
        eventLabel(l.event),
        `"${l.description.replace(/"/g, '""')}"`,
        l.severity,
        l.adminName ?? '',
        l.ipAddress ?? '',
        formatDate(l.createdAt),
      ].join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `security-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const severityColor = {
    info:     'rgba(255,255,255,0.25)',
    warning:  '#f59e0b',
    critical: '#ef4444',
  } as const;

  const selectStyle: React.CSSProperties = {
    background: '#1A1A1A',
    border:     '1px solid rgba(255,255,255,0.07)',
    color:      'rgba(255,255,255,0.55)',
    outline:    'none',
    height:     '32px',
    padding:    '0 10px',
    fontSize:   '0.52rem',
    letterSpacing: '0.06em',
  };

  return (
    <SectionCard title="Security Log" subtitle="Timeline of security-relevant events across all admin accounts">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterEvt}
          onChange={(e) => setFilterEvt(e.target.value)}
          style={selectStyle}
        >
          <option value="">All events</option>
          <option value="login_success">Login success</option>
          <option value="login_failed">Login failed</option>
          <option value="login_locked">Account locked</option>
          <option value="password_changed">Password changed</option>
          <option value="pin_changed">PIN changed</option>
          <option value="pin_reset">PIN reset</option>
          <option value="session_revoked">Session revoked</option>
          <option value="session_revoked_all">All sessions revoked</option>
          <option value="two_fa_enabled">2FA enabled</option>
          <option value="two_fa_disabled">2FA disabled</option>
          <option value="two_fa_failed">2FA failed</option>
          <option value="ip_blocked">IP blocked</option>
          <option value="settings_changed">Settings changed</option>
        </select>

        <select
          value={filterSev}
          onChange={(e) => setFilterSev(e.target.value)}
          style={selectStyle}
        >
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <button
          type="button"
          onClick={exportCSV}
          className="h-8 px-3 flex items-center gap-1.5 text-[0.50rem] tracking-[0.12em] uppercase font-semibold ml-auto"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border:     '1px solid rgba(255,255,255,0.08)',
            color:      'rgba(255,255,255,0.40)',
          }}
        >
          <Download size={11} />
          Export CSV
        </button>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex items-center gap-2 py-6">
          <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
          <span className="text-[0.50rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading log…</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2">
          <ShieldAlert size={24} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.12)' }} />
          <p className="text-[0.50rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>No security events recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {logs.map((log, idx) => (
            <div key={log._id}>
              <div className="flex items-start gap-3 py-3">
                <SeverityDot severity={log.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[0.54rem] tracking-[0.06em] font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
                      {eventLabel(log.event)}
                    </span>
                    {log.adminName && (
                      <span className="text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        — {log.adminName}
                      </span>
                    )}
                    {log.location && (
                      <span className="flex items-center gap-1 text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                        <MapPin size={9} /> {log.location}
                      </span>
                    )}
                    <span className="ml-auto text-[0.44rem] tracking-[0.06em] shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }}>
                      {formatRelative(log.createdAt)}
                    </span>
                  </div>
                  {log.description !== eventLabel(log.event) && (
                    <p className="text-[0.46rem] tracking-[0.04em] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {log.description}
                    </p>
                  )}
                  {log.ipAddress && (
                    <span className="flex items-center gap-1 mt-0.5 text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.20)' }}>
                      <Globe size={9} /> {log.ipAddress}
                    </span>
                  )}
                </div>
              </div>
              {idx < logs.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {total} events · Page {page} of {pages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchLogs(page - 1)}
              disabled={page === 1 || loading}
              className="h-7 px-3 text-[0.48rem] tracking-widest uppercase font-semibold disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.08)',
                color:      'rgba(255,255,255,0.45)',
              }}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => fetchLogs(page + 1)}
              disabled={page === pages || loading}
              className="h-7 px-3 text-[0.48rem] tracking-widest uppercase font-semibold disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.08)',
                color:      'rgba(255,255,255,0.45)',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SecuritySettingsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser]     = useState<AdminUser | null>(null);

  const [saved, setSaved]     = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [form,  setForm]      = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isDirty = !isEqual(form, saved);
  const isSuperAdmin = adminUser?.role === 'superadmin';

  const lastSavedRef = useRef<Date | null>(null);

  // Load admin user
  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) router.push('/admin/login');
        else setAdminUser(d.data);
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  // Load security settings
  useEffect(() => {
    fetch('/api/admin/security/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const s = d.data as SecuritySettings;
          setSaved(s);
          setForm(s);
        }
      })
      .finally(() => setLoadingSettings(false));
  }, []);

  function patch(updates: Partial<SecuritySettings>) {
    setForm((f) => ({ ...f, ...updates }));
  }

  async function handleSave() {
    setSaveMsg(null);
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/security/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(form);
        lastSavedRef.current = new Date();
        setSaveMsg({ ok: true, text: 'Settings saved.' });
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveMsg({ ok: false, text: data.error ?? 'Failed to save settings.' });
      }
    } finally {
      setSaving(false);
    }
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.20)' }} />
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

              {/* Page Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={16} strokeWidth={1.4} style={{ color: GOLD }} />
                    <h1
                      className="text-[0.65rem] tracking-[0.22em] uppercase font-semibold"
                      style={{ color: 'rgba(255,255,255,0.80)' }}
                    >
                      Security Settings
                    </h1>
                  </div>
                  <p className="text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    Manage access control and security configuration
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {saveMsg && (
                    <motion.span
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[0.46rem] tracking-[0.08em]"
                      style={{ color: saveMsg.ok ? 'rgba(74,222,128,0.80)' : 'rgba(239,68,68,0.75)' }}
                    >
                      {saveMsg.text}
                    </motion.span>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || saving || !isSuperAdmin || loadingSettings}
                    title={!isSuperAdmin ? 'Only Super Admins can modify security settings' : undefined}
                    className="h-8 px-5 flex items-center gap-2 text-[0.52rem] tracking-[0.16em] uppercase font-semibold transition-opacity duration-150"
                    style={{
                      background: isDirty && isSuperAdmin ? GOLD : 'rgba(255,255,255,0.06)',
                      color:      isDirty && isSuperAdmin ? '#0a0a0a' : 'rgba(255,255,255,0.25)',
                      border:     isDirty && isSuperAdmin ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      opacity:    (saving || loadingSettings) ? 0.6 : 1,
                      cursor:     !isDirty || !isSuperAdmin ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving && <Loader2 size={11} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>

              {!isSuperAdmin && (
                <div
                  className="flex items-start gap-2 px-4 py-3"
                  style={{
                    background: 'rgba(180,130,60,0.06)',
                    border:     '1px solid rgba(180,130,60,0.14)',
                  }}
                >
                  <KeyRound size={12} strokeWidth={1.6} style={{ color: GOLD, marginTop: 1, flexShrink: 0 }} />
                  <p className="text-[0.48rem] tracking-[0.06em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    Password Policy and Login Security settings can only be modified by Super Admins.
                    You can still manage your own PIN, 2FA, and view the security log.
                  </p>
                </div>
              )}

              {/* Admin PIN */}
              <AdminPinSection adminEmail={adminUser.email} />

              {/* Password Policy */}
              <PasswordPolicySection settings={form} onChange={patch} />

              {/* Login Security */}
              <LoginSecuritySection settings={form} onChange={patch} />

              {/* Active Sessions */}
              <ActiveSessionsSection />

              {/* 2FA */}
              <TwoFASection />

              {/* Security Log */}
              <SecurityLogSection />

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
