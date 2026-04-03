'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Search,
  ShoppingCart,
  User,
  Package,
  Heart,
  MapPin,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';
const GOLD = 'oklch(0.72 0.10 74)';

// ── Mini avatar ───────────────────────────────────────────────────────────────
function NavAvatar({ name, src }: { name: string; src?: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
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

// ── User dropdown (desktop) ───────────────────────────────────────────────────
const MENU_ITEMS = [
  { icon: User, label: 'My Account', href: '/account' },
  { icon: Package, label: 'My Orders', href: '/account/orders' },
  { icon: Heart, label: 'Wishlist', href: '/account/wishlist' },
  { icon: MapPin, label: 'Saved Addresses', href: '/account/addresses' },
  { icon: ShieldCheck, label: 'Security', href: '/account/security' },
];

function UserDropdown({
  name,
  email,
  avatar,
  onLogout,
}: {
  name: string;
  email: string;
  avatar?: string;
  onLogout: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 bg-background border border-border/60 shadow-xl"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Profile header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
        <div
          className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: GOLD_GRADIENT }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
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
        {MENU_ITEMS.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/25 transition-colors duration-100"
          >
            <Icon size={13} strokeWidth={1.7} style={{ color: GOLD }} />
            <span className="flex-1 text-[0.58rem] tracking-[0.1em] uppercase font-medium text-foreground">
              {label}
            </span>
            <ChevronRight
              size={12}
              strokeWidth={1.5}
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
          <span className="text-[0.58rem] tracking-[0.1em] uppercase font-medium">
            Sign Out
          </span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Logout bottom sheet (mobile) ──────────────────────────────────────────────
function LogoutSheet({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="ls-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="ls-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 360,
              damping: 34,
              mass: 0.85,
            }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-background rounded-t-2xl shadow-2xl sm:max-w-sm sm:mx-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            <div className="px-6 pb-10 pt-4 flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full border border-rose-200 dark:border-rose-800/50 flex items-center justify-center mb-1 bg-rose-50 dark:bg-rose-950/30">
                <LogOut size={22} strokeWidth={1.6} className="text-rose-500" />
              </div>
              <h2 className="font-heading text-[1.05rem] tracking-[0.1em] uppercase text-foreground">
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

// ── Mobile user menu sheet ────────────────────────────────────────────────────
function MobileUserSheet({
  isOpen,
  onClose,
  name,
  email,
  avatar,
  onLogoutRequest,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  email: string;
  avatar?: string;
  onLogoutRequest: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="mu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="mu-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 360,
              damping: 34,
              mass: 0.85,
            }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-background rounded-t-2xl shadow-2xl sm:max-w-sm sm:mx-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            {/* Profile row */}
            <div className="flex items-center gap-3.5 px-5 py-4 border-b border-border/50">
              <div
                className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: GOLD_GRADIENT }}
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-heading text-lg font-light text-background/90 select-none">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] tracking-[0.06em] font-medium text-foreground truncate">
                  {name}
                </p>
                <p className="text-[0.55rem] tracking-[0.03em] text-muted-foreground/55 truncate">
                  {email}
                </p>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              {MENU_ITEMS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors group"
                >
                  <Icon size={15} strokeWidth={1.7} style={{ color: GOLD }} />
                  <span className="flex-1 text-[0.62rem] tracking-[0.1em] uppercase font-medium text-foreground">
                    {label}
                  </span>
                  <ChevronRight
                    size={13}
                    strokeWidth={1.5}
                    className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors"
                  />
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div className="px-5 pt-2 pb-10 border-t border-border/50">
              <button
                onClick={() => {
                  onClose();
                  onLogoutRequest();
                }}
                className="w-full flex items-center justify-center gap-2.5 h-12 text-[0.58rem] tracking-[0.2em] uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 transition-colors duration-200 mt-3"
              >
                <LogOut size={14} strokeWidth={1.7} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main navbar ───────────────────────────────────────────────────────────────
interface ShopNavBarProps {
  cartCount?: number;
  onSearchOpen?: () => void;
}

export default function ShopNavBar({
  cartCount = 0,
  onSearchOpen,
}: ShopNavBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [logoutSheet, setLogoutSheet] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const close = (e: PointerEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [dropdownOpen]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutSheet(false);
    router.push('/');
  }, [logout, router]);

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <>
      <motion.header
        className={`fixed top-0 inset-x-0 z-50 h-14 bg-background/90 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
          scrolled ? 'shadow-sm' : 'shadow-none'
        }`}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center">
          {/* Left — back (mobile) · logo (desktop) */}
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="sm:hidden flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ChevronLeft size={22} strokeWidth={1.8} />
            </button>
            <Link href="/" className="hidden sm:block">
              <Image
                src="/logo/aurafumeng-logo.png"
                alt="AuraFume"
                width={110}
                height={36}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Center — page title */}
          <div className="flex justify-center">
            <h1 className="font-heading text-[0.9rem] tracking-[0.22em] uppercase text-foreground leading-none">
              Shop
            </h1>
          </div>

          {/* Right — search · user · cart */}
          <div className="flex items-center justify-end gap-2 sm:gap-3.5">
            <button
              onClick={onSearchOpen}
              aria-label="Search"
              className="flex items-center justify-center w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
            >
              <Search size={18} strokeWidth={1.8} />
            </button>

            {/* ── User indicator ── */}
            {user ? (
              <>
                {/* Mobile: tap opens sheet */}
                <button
                  onClick={() => setMobileSheet(true)}
                  aria-label="My account"
                  className="sm:hidden flex items-center justify-center w-9 h-9"
                >
                  <NavAvatar name={user.firstName} src={user.avatar} />
                </button>

                {/* Desktop: tap opens dropdown */}
                <div
                  ref={dropdownRef}
                  className="z-[99] relative hidden sm:block"
                >
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-label="My account"
                    aria-expanded={dropdownOpen}
                    className="flex items-center gap-2 h-9 px-1 group"
                  >
                    <NavAvatar name={user.firstName} src={user.avatar} />
                    {/* Online dot */}
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
                        onLogout={() => {
                          setDropdownOpen(false);
                          setLogoutSheet(true);
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Not logged in — show user icon → /login */
              <Link
                href="/login"
                aria-label="Sign in"
                className="flex items-center justify-center w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
              >
                <User size={18} strokeWidth={1.8} />
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount > 1 ? 's' : ''}` : ''}`}
              className="relative flex items-center justify-center w-9 h-9 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ShoppingCart size={18} strokeWidth={1.8} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] font-bold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center leading-none tabular-nums"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Mobile: full user menu sheet */}
      {user && (
        <MobileUserSheet
          isOpen={mobileSheet}
          onClose={() => setMobileSheet(false)}
          name={fullName}
          email={user.email}
          avatar={user.avatar}
          onLogoutRequest={() => setLogoutSheet(true)}
        />
      )}

      {/* Logout confirmation sheet (shared mobile + desktop) */}
      <LogoutSheet
        isOpen={logoutSheet}
        onClose={() => setLogoutSheet(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  );
}
