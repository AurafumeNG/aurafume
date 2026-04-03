'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Plus, MapPin, Home, Briefcase,
  MoreVertical, Pencil, Trash2, Star, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';
import AddressSheet, { type AddressData } from '@/components/account/address-sheet';

// ── Tag icon mapping ──────────────────────────────────────────────────────────
function AddressIcon({ label }: { label: string }) {
  const Icon =
    label === 'Home' ? Home :
    label === 'Work' ? Briefcase :
    MapPin;
  return <Icon size={15} strokeWidth={1.7} />;
}

// ── Addresses header ──────────────────────────────────────────────────────────
function AddressesHeader({ onAdd }: { onAdd: () => void }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-30 h-14 bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      <div className="h-full max-w-xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center">

        {/* Left — back */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            aria-label="Back to account"
            className="flex items-center justify-center -ml-1 w-9 h-9 text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ChevronLeft
              size={22}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>
        </div>

        {/* Center — title */}
        <div className="flex items-center justify-center">
          <h1 className="font-heading text-[0.88rem] tracking-[0.22em] uppercase text-foreground leading-none">
            My Addresses
          </h1>
        </div>

        {/* Right — add new */}
        <div className="flex items-center justify-end">
          <button
            onClick={onAdd}
            aria-label="Add new address"
            className="flex items-center gap-1 h-9 px-2 text-foreground/65 hover:text-foreground transition-colors"
          >
            <Plus size={16} strokeWidth={2} />
            <span className="text-[0.52rem] tracking-[0.14em] uppercase font-medium hidden sm:block">
              Add New
            </span>
          </button>
        </div>

      </div>
    </motion.header>
  );
}

// ── Kebab menu ────────────────────────────────────────────────────────────────
function KebabMenu({
  isDefault, onEdit, onDelete, onSetDefault,
}: {
  isDefault: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        aria-label="Address options"
        className="w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground transition-colors"
      >
        <MoreVertical size={15} strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={  { opacity: 0, scale: 0.95, y: -4   }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-9 z-20 w-44 bg-background border border-border/60 shadow-md"
            onPointerDown={e => e.stopPropagation()}
          >
            {!isDefault && (
              <button
                onClick={() => { onSetDefault(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[0.58rem] tracking-widest uppercase text-foreground hover:bg-muted/30 transition-colors border-b border-border/40"
              >
                <Star size={13} strokeWidth={1.7} />
                Set as default
              </button>
            )}
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[0.58rem] tracking-widest uppercase text-foreground hover:bg-muted/30 transition-colors border-b border-border/40"
            >
              <Pencil size={13} strokeWidth={1.7} />
              Edit
            </button>
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[0.58rem] tracking-widest uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 size={13} strokeWidth={1.7} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Address card ──────────────────────────────────────────────────────────────
function AddressCard({
  address, index, onEdit, onDelete, onSetDefault, isDeleting,
}: {
  address: AddressData;
  index: number;
  onEdit: (a: AddressData) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting: boolean;
}) {
  const line2 = [address.apt, address.street].filter(Boolean).join(', ');
  const line3 = `${address.city}, ${address.state}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDeleting ? 0 : 1, x: isDeleting ? -20 : 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      transition={{ duration: 0.25, delay: isDeleting ? 0 : index * 0.06 }}
      className={`border border-border/60 bg-background/40 p-4 relative ${
        address.isDefault ? 'border-l-[3px]' : ''
      }`}
      style={address.isDefault ? { borderLeftColor: 'oklch(0.72 0.10 74)' } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-7 h-7 shrink-0"
            style={{ color: 'oklch(0.72 0.10 74)' }}
          >
            <AddressIcon label={address.label} />
          </span>
          <div className="space-y-0.5">
            <p className="text-[0.6rem] tracking-[0.18em] uppercase font-medium text-foreground leading-none">
              {address.label}
            </p>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 text-[0.44rem] tracking-[0.14em] uppercase font-semibold text-emerald-600">
                <Check size={9} strokeWidth={2.5} />
                Default
              </span>
            )}
          </div>
        </div>

        <KebabMenu
          isDefault={address.isDefault}
          onEdit={() => onEdit(address)}
          onDelete={() => onDelete(address._id)}
          onSetDefault={() => onSetDefault(address._id)}
        />
      </div>

      {/* Address lines */}
      <div className="pl-9 space-y-0.5">
        <p className="text-[0.6rem] tracking-[0.04em] text-muted-foreground/70 leading-relaxed">
          {line2}
        </p>
        <p className="text-[0.6rem] tracking-[0.04em] text-muted-foreground/70">
          {line3}, {address.country}
        </p>
        <p className="text-[0.58rem] tracking-[0.06em] text-muted-foreground/45 pt-0.5">
          {address.postalCode}
        </p>
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyAddresses({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 py-20 text-center px-8"
    >
      <div className="w-16 h-16 rounded-full border border-border/60 flex items-center justify-center">
        <MapPin size={26} strokeWidth={1.3} className="text-muted-foreground/35" />
      </div>
      <div className="space-y-1.5">
        <p className="text-[0.62rem] tracking-[0.22em] uppercase font-medium text-foreground">
          No saved addresses
        </p>
        <p className="text-[0.6rem] tracking-[0.05em] leading-relaxed text-muted-foreground/60 max-w-56 mx-auto">
          Save a delivery address to make checkout faster.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-[0.56rem] tracking-[0.2em] uppercase font-medium px-5 py-2.5 border border-border/60 text-foreground hover:bg-foreground hover:text-background transition-colors duration-200"
      >
        <Plus size={12} strokeWidth={2} />
        Add address
      </button>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border border-border/40 p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-muted/40 animate-pulse" />
            <div className="h-3 w-16 bg-muted/40 animate-pulse" />
          </div>
          <div className="pl-9 space-y-2">
            <div className="h-2.5 w-44 bg-muted/40 animate-pulse" />
            <div className="h-2.5 w-36 bg-muted/40 animate-pulse" />
            <div className="h-2 w-16 bg-muted/40 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AddressesPage() {
  const router              = useRouter();
  const { user, isLoading } = useAuth();

  const [addresses,   setAddresses]   = useState<AddressData[]>([]);
  const [fetching,    setFetching]    = useState(true);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<AddressData | undefined>(undefined);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?redirect=/account/addresses');
  }, [isLoading, user, router]);

  // ── Fetch addresses ───────────────────────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    try {
      const res  = await fetch('/api/addresses');
      const json = (await res.json()) as { success?: boolean; data?: AddressData[] };
      if (res.ok && json.success) setAddresses(json.data ?? []);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) fetchAddresses();
  }, [isLoading, user, fetchAddresses]);

  // ── Sheet handlers ────────────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(undefined);
    setSheetOpen(true);
  }

  const openEdit = useCallback((address: AddressData) => {
    setEditTarget(address);
    setSheetOpen(true);
  }, []);

  function handleSaved(updated: AddressData[]) {
    setAddresses(updated);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res  = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { success?: boolean; data?: AddressData[] };
      if (res.ok && json.success) setAddresses(json.data ?? []);
    } finally {
      setDeletingId(null);
    }
  }, []);

  // ── Set default ───────────────────────────────────────────────────────────
  const handleSetDefault = useCallback(async (id: string) => {
    // Optimistic update
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
    try {
      const res  = await fetch(`/api/addresses/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isDefault: true }),
      });
      const json = (await res.json()) as { success?: boolean; data?: AddressData[] };
      if (res.ok && json.success) setAddresses(json.data ?? []);
    } catch {
      fetchAddresses(); // rollback on error
    }
  }, [fetchAddresses]);

  // ── Render ────────────────────────────────────────────────────────────────
  const showSkeleton = isLoading || fetching;

  return (
    <>
      <AddressesHeader onAdd={openAdd} />

      <div className="pt-14 max-w-xl mx-auto px-5 sm:px-8 py-6 space-y-8">

        {showSkeleton ? (
          <ListSkeleton />
        ) : addresses.length === 0 ? (
          <EmptyAddresses onAdd={openAdd} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {addresses.map((address, i) => (
                <AddressCard
                  key={address._id}
                  address={address}
                  index={i}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                  isDeleting={deletingId === address._id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Bottom CTA when list has items */}
        {!showSkeleton && addresses.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            onClick={openAdd}
            className="w-full flex items-center justify-center gap-2.5 h-12 border border-border/50 border-dashed text-[0.56rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:border-border transition-colors duration-200"
          >
            <Plus size={13} strokeWidth={2} />
            Add new address
          </motion.button>
        )}

      </div>

      {/* Bottom sheet */}
      <AddressSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSaved}
        initial={editTarget}
      />
    </>
  );
}
