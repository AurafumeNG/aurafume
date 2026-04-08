'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  MapPin,
  Heart,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';
import AccountNavBar from '@/components/account/account-navbar';

// ── Gold palette ────────────────────────────────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Avatar ──────────────────────────────────────────────────────────────────────

function Avatar({ name, src }: { name: string; src?: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="relative w-20 h-20 rounded-full overflow-hidden shrink-0"
      style={{ background: GOLD_GRADIENT }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-heading text-3xl font-light text-background/90">
          {initial}
        </span>
      )}
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`bg-muted/40 animate-pulse rounded-none ${className ?? ''}`}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-xl mx-auto px-5 sm:px-8 space-y-8 py-8">
      <div className="flex items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border/60 px-4 py-4 flex flex-col items-center justify-center gap-1 bg-background/40">
      <span className="font-heading text-2xl font-light text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-[0.5rem] tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ── Menu row ────────────────────────────────────────────────────────────────────

function MenuRow({
  icon: Icon,
  label,
  href,
  badge,
  description,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 py-3.5 px-4 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors duration-150 group"
    >
      <span
        className="flex items-center justify-center w-8 h-8 shrink-0"
        style={{ color: 'oklch(0.72 0.10 74)' }}
      >
        <Icon size={17} strokeWidth={1.7} />
      </span>
      <div className="flex-1 min-w-0">
        <span className="block text-[0.68rem] tracking-[0.1em] uppercase font-medium text-foreground">
          {label}
        </span>
        {description && (
          <span className="block text-[0.56rem] tracking-[0.04em] text-muted-foreground/60 mt-0.5">
            {description}
          </span>
        )}
      </div>
      {badge && (
        <span
          className="text-[0.5rem] tracking-[0.1em] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: GOLD_GRADIENT, color: 'oklch(0.12 0 0)' }}
        >
          {badge}
        </span>
      )}
      <ChevronRight
        size={15}
        strokeWidth={1.5}
        className="text-muted-foreground/40 group-hover:text-foreground/60 transition-colors"
      />
    </Link>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-4 mb-2 text-[0.48rem] tracking-[0.28em] uppercase text-muted-foreground/40 font-medium">
        {title}
      </p>
      <div className="border border-border/60 bg-background/40">{children}</div>
    </div>
  );
}

// ── Logout confirmation sheet ────────────────────────────────────────────────────

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
          {/* Backdrop */}
          <motion.div
            key="logout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="logout-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 360,
              damping: 34,
              mass: 0.85,
            }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl shadow-2xl sm:max-w-sm sm:mx-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            {/* Close button */}
            <div className="flex justify-end px-5 pt-3 pb-1">
              <button
                onClick={onClose}
                aria-label="Cancel"
                className="w-7 h-7 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-10 pt-1 flex flex-col items-center text-center gap-2">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full border border-rose-200 dark:border-rose-800/50 flex items-center justify-center mb-1 bg-rose-50 dark:bg-rose-950/30">
                <LogOut size={22} strokeWidth={1.6} className="text-rose-500" />
              </div>

              <h2 className="font-heading text-[1.05rem] tracking-[0.1em] uppercase text-foreground">
                Log Out?
              </h2>
              <p className="text-[0.6rem] tracking-[0.05em] text-muted-foreground/60 leading-relaxed max-w-[16rem]">
                You will be signed out of your account on this device.
              </p>

              {/* Actions */}
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
                  className="w-full h-11 flex items-center justify-center text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
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

// ── Main page ───────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/account');
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    setLogoutLoading(true);
    await logout();
    router.push('/');
  }

  const memberSince = user
    ? new Date(
        (user as unknown as { createdAt?: string }).createdAt ?? Date.now(),
      ).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (isLoading || !user) {
    return (
      <>
        <AccountNavBar />
        <PageSkeleton />
      </>
    );
  }

  return (
    <>
      <AccountNavBar />

      <div className="max-w-xl mx-auto px-5 sm:px-8 space-y-8 py-8">
        {/* ── Profile header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-5"
        >
          <Avatar name={user.firstName} src={user.avatar} />
          <div className="space-y-1 min-w-0">
            <h2 className="font-heading text-[1.35rem] tracking-[0.06em] text-foreground leading-tight truncate">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-[0.6rem] tracking-[0.08em] text-muted-foreground/70 truncate">
              {user.email}
            </p>
            {memberSince && (
              <p className="text-[0.52rem] tracking-[0.14em] uppercase text-muted-foreground/40">
                Member since {memberSince}
              </p>
            )}
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard label="Orders" value={0} />
          <StatCard label="Wishlist" value={0} />
        </motion.div>

        {/* ── Menu ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="space-y-5"
        >
          <MenuSection title="Shopping">
            <MenuRow
              icon={Package}
              label="My Orders"
              href="/account/orders"
              description="Track and manage your orders"
            />
            <MenuRow
              icon={Heart}
              label="Wishlist"
              href="/account/wishlist"
              description="Items you've saved"
            />
          </MenuSection>

          <MenuSection title="Account">
            <MenuRow
              icon={User}
              label="Edit Profile"
              href="/account/profile"
              description="Name, email, phone"
            />
            <MenuRow
              icon={MapPin}
              label="Saved Addresses"
              href="/account/addresses"
              description="Manage delivery addresses"
            />
            {/* <MenuRow
              icon={CreditCard}
              label="Payment Methods"
              href="/account/payment"
              description="Saved payment options"
            /> */}
          </MenuSection>

          <MenuSection title="More">
            <MenuRow
              icon={Bell}
              label="Notifications"
              href="/account/notifications"
            />
            <MenuRow
              icon={ShieldCheck}
              label="Security"
              href="/account/security"
              description="Password and linked accounts"
            />
            {/* <MenuRow icon={Sparkles}   label="Loyalty & Perks" href="/account/loyalty"  badge="New" /> */}
            <MenuRow
              icon={HelpCircle}
              label="Help & Support"
              href="/account/help"
              description="FAQs and contact"
            />
          </MenuSection>
        </motion.div>

        {/* ── Sign out ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="pt-2 pb-4"
        >
          <button
            onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 h-12 border border-border/50 text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors duration-200"
          >
            <LogOut size={14} strokeWidth={1.7} />
            Sign Out
          </button>
        </motion.div>
      </div>

      <LogoutSheet
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  );
}
