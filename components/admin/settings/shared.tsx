'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  CreditCard,
  Truck,
  Bell,
  Users,
  Shield,
  Search,
  LucideIcon,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

export const GOLD = 'oklch(0.53 0.09 70)';

// ── Input styles ───────────────────────────────────────────────────────────────

export const inputBase: React.CSSProperties = {
  background: '#1A1A1A',
  border: '1px solid rgba(255,255,255,0.07)',
  color: 'rgba(255,255,255,0.78)',
  outline: 'none',
  width: '100%',
};

export function focusBorder(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
}

export function blurBorder(
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) {
  e.currentTarget.style.borderColor = e.currentTarget.value
    ? 'rgba(180,130,60,0.20)'
    : 'rgba(255,255,255,0.07)';
}

// ── SectionCard ────────────────────────────────────────────────────────────────

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <h2
          className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-1 text-[0.48rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

// ── FieldLabel ─────────────────────────────────────────────────────────────────

export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label
        className="text-[0.50rem] tracking-[0.14em] uppercase font-medium"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        {children}
        {required && (
          <span className="ml-1" style={{ color: GOLD }}>
            *
          </span>
        )}
      </label>
      {hint && (
        <span
          className="text-[0.46rem] tracking-[0.06em]"
          style={{ color: 'rgba(255,255,255,0.20)' }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

// ── HelperText ─────────────────────────────────────────────────────────────────

export function HelperText({
  children,
  color = 'muted',
}: {
  children: React.ReactNode;
  color?: 'muted' | 'gold' | 'green' | 'red';
}) {
  const colorMap = {
    muted: 'rgba(255,255,255,0.28)',
    gold: GOLD,
    green: 'rgba(74,222,128,0.80)',
    red: 'rgba(239,68,68,0.80)',
  };
  return (
    <p
      className="text-[0.48rem] tracking-[0.06em] mt-1.5"
      style={{ color: colorMap[color] }}
    >
      {children}
    </p>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />;
}

// ── Settings categories ────────────────────────────────────────────────────────

interface SettingsCategory {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    label: 'General',
    href: '/admin/settings/general',
    icon: Store,
    description: 'Store name, logo',
  },
  {
    label: 'Payments',
    href: '/admin/settings/payments',
    icon: CreditCard,
    description: 'Bank transfer config',
  },
  {
    label: 'Shipping',
    href: '/admin/settings/shipping',
    icon: Truck,
    description: 'Delivery methods and fees',
  },
  {
    label: 'Notifications',
    href: '/admin/settings/notifications',
    icon: Bell,
    description: 'Admin alert preferences',
  },
  {
    label: 'Team',
    href: '/admin/settings/team',
    icon: Users,
    description: 'Admin accounts management',
  },
  {
    label: 'Security',
    href: '/admin/settings/security',
    icon: Shield,
    description: '2FA, sessions, PIN management',
  },
];

// ── SettingsSubNav ─────────────────────────────────────────────────────────────

export function SettingsSubNav() {
  const pathname = usePathname();
  const [search, setSearch] = useState('');

  const filtered = SETTINGS_CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 w-[200px] sticky top-14 self-start overflow-y-auto"
      style={{
        background: '#141414',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        height: 'calc(100vh - 56px)',
      }}
    >
      {/* Search */}
      <div className="px-3 pt-4 pb-3">
        <div
          className="flex items-center gap-2 h-8 px-3"
          style={{
            background: '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
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
            placeholder="Search settings..."
            className="flex-1 bg-transparent outline-none text-[0.52rem] tracking-[0.06em] min-w-0 placeholder:text-[rgba(255,255,255,0.22)]"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          />
        </div>
      </div>

      {/* Category links */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {filtered.map((cat) => {
          const active = pathname === cat.href;
          return (
            <SettingsCategoryLink key={cat.href} cat={cat} active={active} />
          );
        })}
        {filtered.length === 0 && (
          <p
            className="px-2 py-3 text-[0.48rem] tracking-[0.06em]"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            No settings found
          </p>
        )}
      </nav>
    </aside>
  );
}

function SettingsCategoryLink({
  cat,
  active,
}: {
  cat: SettingsCategory;
  active: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = cat.icon;

  return (
    <Link
      href={cat.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-2.5 h-9 px-3 rounded-[3px] transition-colors duration-150"
      style={{
        background: active
          ? 'rgba(180,130,60,0.12)'
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
        color: active
          ? GOLD
          : hovered
            ? 'rgba(255,255,255,0.70)'
            : 'rgba(255,255,255,0.38)',
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-sm"
          style={{ background: GOLD }}
        />
      )}
      <Icon size={14} strokeWidth={active ? 2 : 1.8} className="shrink-0" />
      <span className="text-[0.58rem] tracking-[0.10em] font-medium">
        {cat.label}
      </span>
    </Link>
  );
}
