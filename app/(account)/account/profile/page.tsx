'use client';

import {
  useEffect, useRef, useState, useCallback, useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Camera, ImageIcon, Trash2, X, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/auth-context';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD_GRADIENT =
  'linear-gradient(135deg, oklch(0.68 0.11 70) 0%, oklch(0.78 0.09 78) 60%, oklch(0.72 0.10 74) 100%)';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileData {
  firstName: string;
  lastName:  string;
  email:     string;
  phone?:    string;
  avatar?:   string;
  provider:  'local' | 'google';
  createdAt: string;
}

interface FormState {
  firstName: string;
  lastName:  string;
  phone:     string;
}

// ── Client-side image compression ─────────────────────────────────────────────
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 300;
      const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.naturalWidth  * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unavailable'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')); };
    img.src = url;
  });
}

// ── Field ─────────────────────────────────────────────────────────────────────
const inputCls =
  'h-11 w-full border border-border/60 bg-background px-3 text-[0.72rem] tracking-[0.03em] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:border-foreground/40 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

function Field({
  label, optional, children,
}: {
  label: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.54rem] tracking-[0.18em] uppercase font-medium text-muted-foreground/70">
        {label}
        {optional && (
          <span className="ml-1.5 text-muted-foreground/40 normal-case tracking-normal text-[0.5rem]">
            (optional)
          </span>
        )}
      </p>
      {children}
    </div>
  );
}

// ── Avatar action sheet ───────────────────────────────────────────────────────
function AvatarActionSheet({
  isOpen,
  hasAvatar,
  onCamera,
  onGallery,
  onRemove,
  onClose,
}: {
  isOpen:   boolean;
  hasAvatar: boolean;
  onCamera:  () => void;
  onGallery: () => void;
  onRemove:  () => void;
  onClose:   () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const options = [
    { icon: Camera,    label: 'Take Photo',          action: onCamera,  danger: false },
    { icon: ImageIcon, label: 'Choose from Gallery',  action: onGallery, danger: false },
    ...(hasAvatar
      ? [{ icon: Trash2, label: 'Remove Photo', action: onRemove, danger: true }]
      : []
    ),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="av-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="av-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.85 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl shadow-2xl sm:max-w-sm sm:mx-auto sm:rounded-t-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            {/* Title */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-border/40">
              <h3 className="font-heading text-[0.82rem] tracking-[0.18em] uppercase text-foreground">
                Profile Photo
              </h3>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Options */}
            <div className="py-2">
              {options.map(({ icon: Icon, label, action, danger }) => (
                <button
                  key={label}
                  onClick={() => { action(); onClose(); }}
                  className={`w-full flex items-center gap-4 px-6 py-4 text-[0.64rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150 ${
                    danger
                      ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      : 'text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.7} />
                  {label}
                </button>
              ))}
            </div>

            {/* Cancel */}
            <div className="px-5 pb-8 pt-1 border-t border-border/40">
              <button
                onClick={onClose}
                className="w-full h-11 flex items-center justify-center text-[0.58rem] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Profile header ────────────────────────────────────────────────────────────
function ProfileHeader({
  isDirty,
  saving,
  onSave,
}: {
  isDirty: boolean;
  saving:  boolean;
  onSave:  () => void;
}) {
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
            Profile
          </h1>
        </div>

        {/* Right — save */}
        <div className="flex items-center justify-end">
          <button
            onClick={onSave}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 h-9 px-2 text-[0.52rem] tracking-[0.14em] uppercase font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: isDirty && !saving ? 'oklch(0.72 0.10 74)' : undefined }}
          >
            {saving ? (
              <Loader2 size={13} strokeWidth={2} className="animate-spin" />
            ) : (
              'Save'
            )}
          </button>
        </div>

      </div>
    </motion.header>
  );
}

// ── Avatar block ──────────────────────────────────────────────────────────────
function AvatarBlock({
  name,
  avatarSrc,
  uploading,
  error,
  onTap,
}: {
  name:      string;
  avatarSrc?: string;
  uploading: boolean;
  error:     string;
  onTap:     () => void;
}) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      {/* Circular avatar */}
      <button
        onClick={onTap}
        className="relative w-28 h-28 rounded-full overflow-hidden shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group"
        style={{ background: GOLD_GRADIENT }}
        aria-label="Change profile photo"
      >
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-heading text-4xl font-light text-background/90 select-none">
            {initial}
          </span>
        )}

        {/* Hover/tap overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {uploading ? (
            <Loader2 size={22} strokeWidth={2} className="text-white animate-spin" />
          ) : (
            <>
              <Camera size={20} strokeWidth={1.8} className="text-white" />
              <span className="text-white text-[0.44rem] tracking-[0.14em] uppercase font-medium">
                Change
              </span>
            </>
          )}
        </div>
      </button>

      <p className="text-[0.54rem] tracking-[0.14em] uppercase text-muted-foreground/50">
        Tap to change photo
      </p>

      {error && (
        <p className="text-[0.52rem] tracking-[0.06em] text-rose-500 text-center max-w-56">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="max-w-xl mx-auto px-5 sm:px-8 py-6 space-y-8">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-28 h-28 rounded-full bg-muted/40 animate-pulse" />
        <div className="h-2 w-28 bg-muted/40 animate-pulse" />
      </div>
      {/* Fields */}
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-2 w-16 bg-muted/40 animate-pulse" />
            <div className="h-11 bg-muted/40 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router              = useRouter();
  const { user, isLoading, refresh } = useAuth();

  const [profile,    setProfile]    = useState<ProfileData | null>(null);
  const [fetching,   setFetching]   = useState(true);
  const [form,       setForm]       = useState<FormState>({ firstName: '', lastName: '', phone: '' });
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const [localAvatar, setLocalAvatar] = useState<string | undefined>(undefined);
  const [uploading,   setUploading]   = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const [sheetOpen, setSheetOpen] = useState(false);

  // Two hidden file inputs — one for camera, one for gallery
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?redirect=/account/profile');
  }, [isLoading, user, router]);

  // ── Fetch full profile (includes phone) ───────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res  = await fetch('/api/auth/me');
      const json = (await res.json()) as { success?: boolean; data?: ProfileData };
      if (res.ok && json.success && json.data) {
        const p = json.data;
        setProfile(p);
        setLocalAvatar(p.avatar);
        setForm({
          firstName: p.firstName,
          lastName:  p.lastName,
          phone:     p.phone ?? '',
        });
      }
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) fetchProfile();
  }, [isLoading, user, fetchProfile]);

  // ── Dirty check ───────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.firstName !== profile.firstName ||
      form.lastName  !== profile.lastName  ||
      form.phone     !== (profile.phone ?? '')
    );
  }, [form, profile]);

  // ── Save profile ──────────────────────────────────────────────────────────
  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    setSaveError('');
    try {
      const res  = await fetch('/api/auth/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          phone:     form.phone.trim(),
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string; data?: ProfileData };
      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'Something went wrong.');
        return;
      }
      setProfile(json.data!);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    setAvatarError('');
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setLocalAvatar(dataUrl);       // optimistic preview

      const res  = await fetch('/api/auth/avatar', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatar: dataUrl }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string; data?: { avatar: string } };

      if (!res.ok || !json.success) {
        setLocalAvatar(profile?.avatar);   // revert
        setAvatarError(json.error ?? 'Upload failed. Please try again.');
        return;
      }
      setProfile(prev => prev ? { ...prev, avatar: json.data?.avatar } : prev);
      await refresh();
    } catch {
      setLocalAvatar(profile?.avatar);
      setAvatarError('Could not process image. Please try another.');
    } finally {
      setUploading(false);
    }
  }, [profile, refresh]);

  const handleRemoveAvatar = useCallback(async () => {
    setAvatarError('');
    setUploading(true);
    const prev = localAvatar;
    setLocalAvatar(undefined);   // optimistic
    try {
      const res = await fetch('/api/auth/avatar', { method: 'DELETE' });
      if (!res.ok) {
        setLocalAvatar(prev);
        setAvatarError('Could not remove photo. Please try again.');
        return;
      }
      setProfile(p => p ? { ...p, avatar: undefined } : p);
      await refresh();
    } finally {
      setUploading(false);
    }
  }, [localAvatar, refresh]);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = '';   // reset so same file can be re-selected
    },
    [handleFileSelect],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const showSkeleton = isLoading || fetching;
  const memberSince  = profile
    ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '';

  return (
    <>
      <ProfileHeader isDirty={isDirty} saving={saving} onSave={handleSave} />

      {showSkeleton ? (
        <div className="pt-14">
          <PageSkeleton />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pt-14 max-w-xl mx-auto px-5 sm:px-8 pb-12"
        >
          {/* ── Avatar block ── */}
          <AvatarBlock
            name={profile?.firstName ?? ''}
            avatarSrc={localAvatar}
            uploading={uploading}
            error={avatarError}
            onTap={() => setSheetOpen(true)}
          />

          {/* Divider */}
          <div className="border-t border-border/40 mb-7" />

          {/* ── Form fields ── */}
          <div className="space-y-5">

            {saveError && (
              <p className="text-[0.56rem] tracking-[0.06em] text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5 border border-rose-200 dark:border-rose-800/40">
                {saveError}
              </p>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="Promise"
                  className={inputCls}
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Last Name">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="Udo"
                  className={inputCls}
                  autoComplete="family-name"
                />
              </Field>
            </div>

            {/* Phone */}
            <Field label="Phone Number" optional>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+234 816 476 3362"
                className={inputCls}
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>

            {/* Email — read-only */}
            <Field label="Email Address">
              <div className="relative">
                <input
                  type="email"
                  value={profile?.email ?? ''}
                  readOnly
                  className={`${inputCls} pr-20 text-muted-foreground/60`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.44rem] tracking-[0.14em] uppercase font-medium text-muted-foreground/40">
                  Read-only
                </span>
              </div>
              {profile?.provider === 'google' && (
                <p className="text-[0.5rem] tracking-[0.06em] text-muted-foreground/45 mt-1">
                  Managed by your Google account
                </p>
              )}
            </Field>

          </div>

          {/* ── Member info ── */}
          <div className="mt-9 pt-6 border-t border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.52rem] tracking-[0.16em] uppercase text-muted-foreground/45">
                Member since
              </span>
              <span className="text-[0.58rem] tracking-[0.06em] text-muted-foreground/60">
                {memberSince}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[0.52rem] tracking-[0.16em] uppercase text-muted-foreground/45">
                Sign-in method
              </span>
              <span className="text-[0.58rem] tracking-[0.06em] text-muted-foreground/60 capitalize">
                {profile?.provider === 'google' ? 'Google' : 'Email & Password'}
              </span>
            </div>
          </div>

          {/* ── Save — bottom CTA (supplement to header button) ── */}
          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="w-full h-12 flex items-center justify-center gap-2 text-[0.6rem] tracking-[0.22em] uppercase font-medium bg-foreground text-background disabled:opacity-30 transition-opacity duration-200"
            >
              {saving ? (
                <><Loader2 size={13} strokeWidth={2} className="animate-spin" /> Saving…</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={onFileInputChange}
        aria-hidden
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileInputChange}
        aria-hidden
      />

      {/* Avatar action sheet */}
      <AvatarActionSheet
        isOpen={sheetOpen}
        hasAvatar={!!localAvatar}
        onCamera={() => cameraRef.current?.click()}
        onGallery={() => galleryRef.current?.click()}
        onRemove={handleRemoveAvatar}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
