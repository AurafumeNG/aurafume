'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, User, KeyRound, LogOut, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface AdminTopNavProps {
  pageTitle:    string;
  adminName:    string;
  avatarUrl?:   string;
  notifCount?:  number;
  onMenuToggle: () => void;
}

export default function AdminTopNav({
  pageTitle,
  adminName,
  avatarUrl,
  notifCount = 0,
  onMenuToggle,
}: AdminTopNavProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  // Initials fallback
  const initials = adminName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 h-14 flex items-center px-4 md:px-6 gap-4"
      style={{
        background:   '#141414',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        left:         'var(--sidebar-width, 0px)',
      }}
    >
      {/* Hamburger — visible on mobile */}
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center w-8 h-8 shrink-0 lg:hidden transition-colors"
        style={{ color: 'rgba(255,255,255,0.40)' }}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} strokeWidth={1.8} />
      </button>

      {/* Brand — visible on mobile (hidden on desktop where sidebar shows it) */}
      <Link
        href="/admin"
        className="lg:hidden shrink-0 text-[0.52rem] tracking-[0.30em] uppercase font-semibold"
        style={{ color: 'rgba(255,255,255,0.80)' }}
      >
        AuraFumeNG
      </Link>

      {/* Page title */}
      <p
        className="hidden lg:block text-[0.58rem] tracking-[0.20em] uppercase font-medium"
        style={{ color: 'rgba(255,255,255,0.40)' }}
      >
        {pageTitle}
      </p>

      <div className="flex-1" />

      {/* Notifications bell */}
      <button
        className="relative flex items-center justify-center w-8 h-8 transition-colors"
        style={{ color: 'rgba(255,255,255,0.35)' }}
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={1.8} />
        {notifCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full text-[0.42rem] font-bold leading-none"
            style={{
              background: 'oklch(0.53 0.09 70)',
              color:      'oklch(0.10 0 0)',
            }}
          >
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      {/* Admin avatar + name dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2 h-8 px-2 transition-colors group"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[0.52rem] font-semibold shrink-0 overflow-hidden"
            style={{
              background: avatarUrl ? 'transparent' : 'oklch(0.53 0.09 70)',
              color:      'oklch(0.10 0 0)',
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
              : initials
            }
          </div>

          {/* Name */}
          <span
            className="hidden sm:block text-[0.56rem] tracking-[0.10em]"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            {adminName}
          </span>

          <ChevronDown
            size={12}
            strokeWidth={2}
            className="hidden sm:block transition-transform duration-200"
            style={{
              color:     'rgba(255,255,255,0.28)',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-[calc(100%+8px)] w-48 py-1 z-50"
              style={{
                background:   '#1A1A1A',
                border:       '1px solid rgba(255,255,255,0.08)',
                boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <DropItem
                icon={<User size={13} strokeWidth={1.8} />}
                label="View Profile"
                onClick={() => { setDropdownOpen(false); router.push('/admin/profile'); }}
              />
              <DropItem
                icon={<KeyRound size={13} strokeWidth={1.8} />}
                label="Change Password"
                onClick={() => { setDropdownOpen(false); router.push('/admin/change-password'); }}
              />
              <div className="my-1 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <DropItem
                icon={<LogOut size={13} strokeWidth={1.8} />}
                label="Log Out"
                onClick={handleLogout}
                danger
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function DropItem({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base  = danger ? 'rgba(239,68,68,0.70)' : 'rgba(255,255,255,0.55)';
  const hover = danger ? 'rgba(239,68,68,0.90)' : 'rgba(255,255,255,0.82)';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150"
      style={{
        color:      hovered ? hover : base,
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
      }}
    >
      {icon}
      <span className="text-[0.58rem] tracking-[0.10em]">{label}</span>
    </button>
  );
}
