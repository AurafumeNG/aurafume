'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Heart, ShoppingCart, Menu, X,
  User, Package, MapPin, ShieldCheck, LogOut, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';
const GOLD = 'oklch(0.72 0.10 74)';

const NAV_LINKS = [
  { href: '/',            label: 'Home'        },
  { href: '/shop',        label: 'Shop'        },
  { href: '/about',       label: 'About'       },
  { href: '/collections', label: 'Collections' },
];

const ACCOUNT_LINKS = [
  { icon: User,        label: 'My Account',     href: '/account'           },
  { icon: Package,     label: 'My Orders',      href: '/account/orders'    },
  { icon: Heart,       label: 'Wishlist',       href: '/account/wishlist'  },
  { icon: MapPin,      label: 'Saved Addresses', href: '/account/addresses' },
  { icon: ShieldCheck, label: 'Security',       href: '/account/security'  },
];

// ── Mini avatar ───────────────────────────────────────────────────────────────
function NavAvatar({ name, src, size = 7 }: { name: string; src?: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  const dim = `w-${size} h-${size}`;
  return (
    <div
      className={`${dim} rounded-full overflow-hidden shrink-0 flex items-center justify-center`}
      style={{ background: GOLD_GRADIENT }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-heading text-[0.65rem] font-light text-background/90 select-none">
          {initial}
        </span>
      )}
    </div>
  );
}

// ── Desktop dropdown ──────────────────────────────────────────────────────────
function UserDropdown({
  name, email, avatar, onLogout,
}: {
  name: string; email: string; avatar?: string; onLogout: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1,    y: 0   }}
      exit={  { opacity: 0, scale: 0.97, y: -6   }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 bg-background border border-border/60 shadow-xl"
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Profile header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
        <div
          className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: GOLD_GRADIENT }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-heading text-[0.75rem] font-light text-background/90 select-none">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[0.64rem] tracking-[0.06em] font-medium text-foreground truncate">
            {name}
          </p>
          <p className="text-[0.52rem] tracking-[0.03em] text-muted-foreground/55 truncate">
            {email}
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {ACCOUNT_LINKS.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/25 transition-colors duration-100"
          >
            <Icon size={13} strokeWidth={1.7} style={{ color: GOLD }} />
            <span className="flex-1 text-[0.58rem] tracking-widest uppercase font-medium text-foreground">
              {label}
            </span>
            <ChevronRight
              size={12} strokeWidth={1.5}
              className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors"
            />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="border-t border-border/50 py-1">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors duration-100"
        >
          <LogOut size={13} strokeWidth={1.7} />
          <span className="text-[0.58rem] tracking-widest uppercase font-medium">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Logout confirmation sheet ─────────────────────────────────────────────────
function LogoutSheet({
  isOpen, onClose, onConfirm, loading,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="lo-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-70 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="lo-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.85 }}
            className="fixed inset-x-0 bottom-0 z-80 bg-background rounded-t-2xl shadow-2xl sm:max-w-sm sm:mx-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>
            <div className="px-6 pb-10 pt-4 flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full border border-rose-200 dark:border-rose-800/50 flex items-center justify-center mb-1 bg-rose-50 dark:bg-rose-950/30">
                <LogOut size={22} strokeWidth={1.6} className="text-rose-500" />
              </div>
              <h2 className="font-heading text-[1.05rem] tracking-widest uppercase text-foreground">
                Log Out?
              </h2>
              <p className="text-[0.6rem] tracking-[0.05em] text-muted-foreground/60 leading-relaxed max-w-[16rem]">
                You will be signed out of your account on this device.
              </p>
              <div className="w-full space-y-2.5 mt-5">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2 text-[0.6rem] tracking-[0.22em] uppercase font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-colors duration-200"
                >
                  {loading ? 'Signing out…' : 'Confirm Log Out'}
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full h-11 flex items-center justify-center text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main navbar ───────────────────────────────────────────────────────────────
export default function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const pathname                 = usePathname();
  const router                   = useRouter();
  const { user, logout }         = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutSheet,  setLogoutSheet]  = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close drawer when route changes
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (!drawerOpen) { document.body.style.overflow = ''; return; }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const close = (e: PointerEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [dropdownOpen]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutSheet(false);
    setDrawerOpen(false);
    router.push('/');
  }, [logout, router]);

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <>
      <header className="w-full bg-background/90 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo/aurafumeng-logo.png"
              alt="AuraFume"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-sm tracking-widest uppercase transition-colors hover:text-accent ${
                    pathname === href ? 'text-accent' : 'text-foreground/80'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button aria-label="Search" className="text-foreground/70 hover:text-accent transition-colors">
              <Search size={20} />
            </button>

            {/* Wishlist — real link */}
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="hidden sm:block text-foreground/70 hover:text-accent transition-colors"
            >
              <Heart size={20} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              className="relative text-foreground/70 hover:text-accent transition-colors"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* ── User indicator (desktop only) ── */}
            {user ? (
              <div ref={dropdownRef} className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-label="My account"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-1.5 group"
                >
                  <NavAvatar name={user.firstName} src={user.avatar} />
                  {/* Gold online dot */}
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: GOLD }}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <UserDropdown
                      name={fullName}
                      email={user.email}
                      avatar={user.avatar}
                      onLogout={() => { setDropdownOpen(false); setLogoutSheet(true); }}
                    />
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="hidden md:flex items-center justify-center text-foreground/70 hover:text-accent transition-colors"
              >
                <User size={20} />
              </Link>
            )}

            {/* Hamburger (mobile) */}
            <button
              aria-label="Open menu"
              className="md:hidden text-foreground/70 hover:text-accent transition-colors"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile overlay ── */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Slide-out drawer ── */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-background shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-border shrink-0">
          <Image
            src="/logo/aurafumeng-logo.png"
            alt="AuraFume"
            width={100}
            height={36}
            className="h-8 w-auto object-contain"
          />
          <button
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="text-foreground/70 hover:text-accent transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable drawer body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── User profile block ── */}
          {user ? (
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: GOLD_GRADIENT }}
                >
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-heading text-lg font-light text-background/90 select-none">
                      {user.firstName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.7rem] tracking-[0.06em] font-medium text-foreground truncate">
                    {fullName}
                  </p>
                  <p className="text-[0.55rem] tracking-[0.03em] text-muted-foreground/55 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Account quick-links */}
              <div className="space-y-0 -mx-2">
                {ACCOUNT_LINKS.map(({ icon: Icon, label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-2 py-2.5 rounded hover:bg-muted/30 transition-colors group"
                  >
                    <Icon size={13} strokeWidth={1.7} style={{ color: GOLD }} />
                    <span className="flex-1 text-[0.6rem] tracking-widest uppercase font-medium text-foreground">
                      {label}
                    </span>
                    <ChevronRight size={11} strokeWidth={1.5} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            /* Not logged in — sign in prompt */
            <div className="px-6 py-5 border-b border-border">
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-10 border border-border/60 text-[0.58rem] tracking-[0.18em] uppercase font-medium text-foreground hover:bg-muted/20 transition-colors"
              >
                <User size={14} strokeWidth={1.8} />
                Sign In
              </Link>
            </div>
          )}

          {/* Nav links */}
          <nav className="px-6 pt-7 flex flex-col gap-5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`text-base tracking-widest uppercase transition-colors hover:text-accent ${
                  pathname === href ? 'text-accent' : 'text-foreground/80'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Bottom icon row */}
          <div className="px-6 mt-8 pt-6 border-t border-border flex items-center gap-6">
            <button aria-label="Search" className="text-foreground/70 hover:text-accent transition-colors">
              <Search size={20} />
            </button>
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              onClick={() => setDrawerOpen(false)}
              className="text-foreground/70 hover:text-accent transition-colors"
            >
              <Heart size={20} />
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              onClick={() => setDrawerOpen(false)}
              className="relative text-foreground/70 hover:text-accent transition-colors"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Sign out (only when logged in) */}
          {user && (
            <div className="px-6 mt-4 pb-8">
              <button
                onClick={() => { setDrawerOpen(false); setLogoutSheet(true); }}
                className="w-full flex items-center justify-center gap-2.5 h-11 border border-rose-200/60 dark:border-rose-800/40 text-[0.58rem] tracking-[0.2em] uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors duration-200"
              >
                <LogOut size={14} strokeWidth={1.7} />
                Sign Out
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Logout confirmation sheet */}
      <LogoutSheet
        isOpen={logoutSheet}
        onClose={() => setLogoutSheet(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  );
}
