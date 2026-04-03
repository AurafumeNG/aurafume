'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Landmark,
  Tag,
  Archive,
  BarChart2,
  Settings,
  LogOut,
  LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GOLD = 'oklch(0.53 0.09 70)';

interface NavItem {
  label:   string;
  href:    string;
  icon:    LucideIcon;
  badge?:  number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      href: '/admin',            icon: LayoutDashboard },
  { label: 'Products',       href: '/admin/products',   icon: Package         },
  { label: 'Orders',         href: '/admin/orders',     icon: ShoppingCart    },
  { label: 'Customers',      href: '/admin/customers',  icon: Users           },
  { label: 'Bank Transfers', href: '/admin/transfers',  icon: Landmark        },
  { label: 'Promo Codes',    href: '/admin/promos',     icon: Tag             },
  { label: 'Inventory',      href: '/admin/inventory',  icon: Archive         },
  { label: 'Analytics',      href: '/admin/analytics',  icon: BarChart2       },
  { label: 'Settings',       href: '/admin/settings',   icon: Settings        },
];

interface AdminSidebarProps {
  adminName:            string;
  adminRole?:           string;
  avatarUrl?:           string;
  isOpen:               boolean;
  onClose:              () => void;
  pendingOrders?:       number;
  pendingTransfers?:    number;
}

export default function AdminSidebar({
  adminName,
  adminRole = 'Super Admin',
  avatarUrl,
  isOpen,
  onClose,
  pendingOrders    = 0,
  pendingTransfers = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  // Inject live badge counts into nav items
  const navWithBadges: NavItem[] = NAV_ITEMS.map(item => {
    if (item.href === '/admin/orders')    return { ...item, badge: pendingOrders    || undefined };
    if (item.href === '/admin/transfers') return { ...item, badge: pendingTransfers || undefined };
    return item;
  });

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const initials = adminName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <aside
      className="flex flex-col h-full w-[220px] shrink-0"
      style={{
        background:   '#141414',
        borderRight:  '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 h-14 px-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link
          href="/admin"
          onClick={onClose}
          className="text-[0.52rem] tracking-[0.32em] uppercase font-semibold"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          AuraFumeNG
        </Link>
      </div>

      {/* Admin identity */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[0.58rem] font-semibold shrink-0 overflow-hidden"
          style={{
            background: avatarUrl ? 'transparent' : GOLD,
            color:      'oklch(0.10 0 0)',
          }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
            : initials
          }
        </div>
        <div className="min-w-0">
          <p
            className="text-[0.58rem] tracking-[0.08em] font-medium truncate"
            style={{ color: 'rgba(255,255,255,0.82)' }}
          >
            {adminName}
          </p>
          <span
            className="inline-block mt-0.5 px-1.5 py-px text-[0.42rem] tracking-[0.14em] uppercase font-semibold rounded-[2px]"
            style={{
              background: 'rgba(180,130,60,0.15)',
              color:      GOLD,
              border:     `1px solid rgba(180,130,60,0.25)`,
            }}
          >
            {adminRole}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navWithBadges.map(item => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.href}
              item={item}
              active={active}
              onClose={onClose}
            />
          );
        })}
      </nav>

      {/* Log out */}
      <div className="shrink-0 px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="pt-3">
          <LogoutButton onClick={handleLogout} />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop — fixed, always visible */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile — slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.65)' }}
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{    x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({
  item, active, onClose,
}: {
  item: NavItem;
  active: boolean;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-3 h-9 px-3 rounded-[3px] transition-colors duration-150"
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
      {/* Active indicator bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-sm"
          style={{ background: GOLD }}
        />
      )}

      <Icon size={15} strokeWidth={active ? 2 : 1.8} className="shrink-0" />

      <span className="flex-1 text-[0.60rem] tracking-[0.10em] font-medium">
        {item.label}
      </span>

      {item.badge !== undefined && item.badge > 0 && (
        <span
          className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[0.44rem] font-bold"
          style={{
            background: active ? GOLD : 'rgba(180,130,60,0.22)',
            color:      active ? 'oklch(0.10 0 0)' : GOLD,
          }}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  );
}

function LogoutButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 h-9 px-3 rounded-[3px] transition-colors duration-150"
      style={{
        color:      hovered ? 'rgba(239,68,68,0.85)' : 'rgba(255,255,255,0.25)',
        background: hovered ? 'rgba(239,68,68,0.06)' : 'transparent',
      }}
    >
      <LogOut size={15} strokeWidth={1.8} className="shrink-0" />
      <span className="text-[0.60rem] tracking-[0.10em] font-medium">Log Out</span>
    </button>
  );
}
