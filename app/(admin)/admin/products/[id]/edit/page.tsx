'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter }                              from 'next/navigation';
import Link                                       from 'next/link';
import {
  ChevronLeft, Save, Upload, Eye, ShoppingCart,
  Package, Heart, Star, Plus, Loader2, X, Archive, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import AdminSidebar            from '@/components/admin/AdminSidebar';
import AdminTopNav             from '@/components/admin/AdminTopNav';
import BasicInfoSection        from '@/components/admin/new-product/BasicInfoSection';
import ProductImagesSection    from '@/components/admin/new-product/ProductImagesSection';
import FragranceDetailsSection from '@/components/admin/new-product/FragranceDetailsSection';
import ScentNotesSection       from '@/components/admin/new-product/ScentNotesSection';
import VariantsPricingSection  from '@/components/admin/new-product/VariantsPricingSection';
import SEOSection              from '@/components/admin/new-product/SEOSection';
import StatusSection           from '@/components/admin/new-product/StatusSection';
import OrganizationSection     from '@/components/admin/new-product/OrganizationSection';
import ShippingSection         from '@/components/admin/new-product/ShippingSection';
import FormActionBar           from '@/components/admin/new-product/FormActionBar';
import { EMPTY_DRAFT, type ProductDraft } from '@/components/admin/new-product/types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminUser {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
  avatar?:   string;
}

interface DbProductVariant {
  size:              string;
  sku:               string;
  price:             number;
  compareAtPrice?:   number;
  costPrice?:        number;
  stock:             number;
  lowStockThreshold: number;
  barcode?:          string;
}

interface DbProduct {
  _id:               string;
  name:              string;
  slug:              string;
  shortDescription:  string;
  fullDescription:   string;
  images:            { url: string; publicId: string }[];
  fragranceFamilies: string[];
  concentration:     string;
  gender:            string;
  origin:            string;
  launchYear?:       number;
  longevity:         string;
  sillage:           string;
  seasons:           string[];
  occasions:         string[];
  topNotes:          string[];
  heartNotes:        string[];
  baseNotes:         string[];
  variants:          DbProductVariant[];
  metaTitle:         string;
  metaDescription:   string;
  keywords:          string[];
  ogImageUrl:        string;
  status:            'draft' | 'published' | 'archived';
  visibleInShop:     boolean;
  isFeatured:        boolean;
  isNewArrival:      boolean;
  isBestSeller:      boolean;
  scheduledAt?:      string;
  tags:              string[];
  collections:       string[];
  relatedProductIds: string[];
  weight?:           number;
  dimensions?:       { l?: number; w?: number; h?: number };
  isFragile:         boolean;
  specialPackaging:  boolean;
  createdBy:         string;
  createdAt:         string;
  updatedAt:         string;
}

interface ProductStats {
  views:         number;
  cartAdds:      number;
  unitsSold:     number;
  wishlisted:    number;
  avgRating:     number;
  reviewCount:   number;
  createdByName: string;
}

interface StockAdjustmentRecord {
  _id:           string;
  variantSize:   string;
  variantSku:    string;
  type:          'add' | 'remove' | 'set';
  previousStock: number;
  adjustment:    number;
  newStock:      number;
  reason:        string;
  adjustedBy:    string;
  createdAt:     string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dbProductToProductDraft(p: DbProduct): ProductDraft {
  const scheduledAt = p.scheduledAt ? new Date(p.scheduledAt) : null;
  return {
    name:             p.name             ?? '',
    slug:             p.slug             ?? '',
    shortDescription: p.shortDescription ?? '',
    fullDescription:  p.fullDescription  ?? '',
    images:           (p.images ?? []).map((img, i) => ({
      id:       `existing-${i}-${img.publicId || img.url.slice(-8)}`,
      url:      img.url,
      publicId: img.publicId,
    })),
    fragranceFamilies: p.fragranceFamilies ?? [],
    concentration:    p.concentration ?? '',
    gender:           p.gender        ?? '',
    origin:           p.origin        ?? '',
    launchYear:       p.launchYear != null ? String(p.launchYear) : '',
    longevity:        p.longevity ?? '',
    sillage:          p.sillage  ?? '',
    seasons:          p.seasons   ?? [],
    occasions:        p.occasions ?? [],
    topNotes:         p.topNotes   ?? [],
    heartNotes:       p.heartNotes ?? [],
    baseNotes:        p.baseNotes  ?? [],
    variants:         (p.variants ?? []).map((v, i) => ({
      id:                `existing-variant-${i}`,
      size:              v.size              ?? '',
      sku:               v.sku               ?? '',
      price:             v.price      != null ? String(v.price)             : '',
      compareAtPrice:    v.compareAtPrice != null ? String(v.compareAtPrice) : '',
      costPrice:         v.costPrice   != null ? String(v.costPrice)        : '',
      stock:             v.stock       != null ? String(v.stock)            : '',
      lowStockThreshold: v.lowStockThreshold != null ? String(v.lowStockThreshold) : '5',
      barcode:           v.barcode ?? '',
    })),
    metaTitle:        p.metaTitle       ?? '',
    metaDescription:  p.metaDescription ?? '',
    keywords:         p.keywords        ?? [],
    ogImageUrl:       p.ogImageUrl      ?? '',
    status:           p.status          ?? 'draft',
    visibleInShop:    p.visibleInShop   !== false,
    isFeatured:       Boolean(p.isFeatured),
    isNewArrival:     Boolean(p.isNewArrival),
    isBestSeller:     Boolean(p.isBestSeller),
    scheduleEnabled:  Boolean(scheduledAt),
    scheduleDate:     scheduledAt ? scheduledAt.toISOString().split('T')[0] : '',
    scheduleTime:     scheduledAt ? scheduledAt.toTimeString().slice(0, 5)  : '',
    tags:             p.tags              ?? [],
    collections:      p.collections       ?? [],
    relatedProductIds: p.relatedProductIds ?? [],
    weight:           p.weight        != null ? String(p.weight)          : '',
    dimL:             p.dimensions?.l != null ? String(p.dimensions.l)   : '',
    dimW:             p.dimensions?.w != null ? String(p.dimensions.w)   : '',
    dimH:             p.dimensions?.h != null ? String(p.dimensions.h)   : '',
    isFragile:        Boolean(p.isFragile),
    specialPackaging: Boolean(p.specialPackaging),
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

function formatAdjDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner({ size = 12 }: { size?: number }) {
  return (
    <svg className="animate-spin shrink-0" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Back Link ──────────────────────────────────────────────────────────────────

function BackLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1.5 transition-colors duration-150"
      style={{ color: hovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)' }}
    >
      <ChevronLeft size={13} strokeWidth={2} className="shrink-0" style={{ marginLeft: '-2px' }} />
      <span className="text-[0.52rem] tracking-[0.14em] uppercase font-medium">{label}</span>
    </Link>
  );
}

// ── Header Action Button ───────────────────────────────────────────────────────

function HeaderActionButton({
  label, icon, variant, loading, disabled, onClick,
}: {
  label:    string;
  icon:     React.ReactNode;
  variant:  'filled' | 'outlined';
  loading?: boolean;
  disabled?: boolean;
  onClick:  () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const busy = loading || disabled;

  const style: React.CSSProperties =
    variant === 'filled'
      ? {
          background: busy ? 'rgba(180,130,60,0.35)' : hovered ? 'oklch(0.60 0.10 70)' : GOLD,
          color:      busy ? 'rgba(255,255,255,0.40)' : 'oklch(0.10 0 0)',
          border:     'none',
          cursor:     busy ? 'not-allowed' : 'pointer',
        }
      : {
          background: hovered && !busy ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
          color:      busy ? 'rgba(255,255,255,0.20)' : hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
          border:     busy
            ? '1px solid rgba(255,255,255,0.05)'
            : hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
          cursor:     busy ? 'not-allowed' : 'pointer',
        };

  return (
    <button
      type="button"
      onClick={busy ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={busy}
      className="flex items-center gap-1.5 h-8 px-4 text-[0.54rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150"
      style={{ ...style, borderRadius: '2px', flexShrink: 0 }}
    >
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

// ── Page Header Block ──────────────────────────────────────────────────────────

function PageHeaderBlock({
  productName,
  updatedAt,
  createdByName,
  hasUnsavedChanges,
  savingDraft,
  savingPublish,
  onSaveDraft,
  onPublish,
}: {
  productName:       string;
  updatedAt:         string;
  createdByName:     string;
  hasUnsavedChanges: boolean;
  savingDraft:       boolean;
  savingPublish:     boolean;
  onSaveDraft:       () => void;
  onPublish:         () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Left */}
      <div className="space-y-1.5">
        <BackLink href="/admin/products" label="Products" />
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-[0.70rem] tracking-[0.24em] uppercase font-semibold"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            Edit Product{productName ? ` — ${productName}` : ''}
          </h1>
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div
                key="unsaved"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0  }}
                exit={{    opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'oklch(0.70 0.14 55)' }} />
                <span className="text-[0.48rem] tracking-[0.12em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>
                  Unsaved changes
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {(updatedAt || createdByName) && (
          <div className="flex items-center gap-3 flex-wrap">
            {updatedAt && (
              <span className="text-[0.48rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                Last edited {formatDate(updatedAt)}
              </span>
            )}
            {createdByName && (
              <>
                <span className="w-px h-3" style={{ background: 'rgba(255,255,255,0.10)' }} />
                <span className="text-[0.48rem] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Added by Admin {createdByName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-wrap sm:pt-1">
        <HeaderActionButton
          label="Save as Draft"
          icon={<Save size={12} strokeWidth={1.8} />}
          variant="outlined"
          loading={savingDraft}
          disabled={savingPublish}
          onClick={onSaveDraft}
        />
        <HeaderActionButton
          label="Publish Product"
          icon={<Upload size={12} strokeWidth={1.8} />}
          variant="filled"
          loading={savingPublish}
          disabled={savingDraft}
          onClick={onPublish}
        />
      </div>
    </div>
  );
}

// ── Performance Stats Bar ──────────────────────────────────────────────────────

function PerformanceStatsBar({ stats }: { stats: ProductStats | null }) {
  const items = [
    { icon: <Eye      size={13} strokeWidth={1.6} />, value: stats?.views       ?? 0,    label: 'views'        },
    { icon: <ShoppingCart size={13} strokeWidth={1.6} />, value: stats?.cartAdds ?? 0, label: 'added to cart' },
    { icon: <Package  size={13} strokeWidth={1.6} />, value: stats?.unitsSold   ?? 0,    label: 'units sold'   },
    { icon: <Heart    size={13} strokeWidth={1.6} />, value: stats?.wishlisted  ?? 0,    label: 'wishlisted'   },
    {
      icon:  <Star size={13} strokeWidth={1.6} />,
      value: stats ? (stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} avg rating` : '—') : '—',
      label: stats?.reviewCount ? `${stats.reviewCount} reviews` : 'no reviews',
    },
  ];

  return (
    <div
      className="flex flex-wrap gap-0"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#141414' }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[130px]"
          style={{
            borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
          }}
        >
          <span style={{ color: GOLD, opacity: 0.70 }}>{item.icon}</span>
          <div>
            <p
              className="text-[0.64rem] tracking-[0.04em] font-semibold tabular-nums"
              style={{ color: 'rgba(255,255,255,0.80)' }}
            >
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </p>
            <p
              className="text-[0.44rem] tracking-[0.10em] uppercase mt-0.5"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stock History Section ──────────────────────────────────────────────────────

function StockHistorySection({
  adjustments,
  loading,
  onOpenSheet,
}: {
  adjustments: StockAdjustmentRecord[];
  loading:     boolean;
  onOpenSheet: () => void;
}) {
  return (
    <div
      style={{
        border:     '1px solid rgba(255,255,255,0.06)',
        background: '#141414',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="space-y-0.5">
          <h2
            className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            Variant Stock History
          </h2>
          <p className="text-[0.50rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Manual and automated stock adjustments.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSheet}
          className="flex items-center gap-1.5 h-8 px-3 text-[0.50rem] tracking-[0.12em] uppercase font-medium shrink-0"
          style={{
            background: 'rgba(180,130,60,0.08)',
            color:      GOLD,
            border:     '1px solid rgba(180,130,60,0.22)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(180,130,60,0.14)';
            e.currentTarget.style.borderColor = 'rgba(180,130,60,0.38)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(180,130,60,0.08)';
            e.currentTarget.style.borderColor = 'rgba(180,130,60,0.22)';
          }}
        >
          <Plus size={11} strokeWidth={2.2} />
          Manual Stock Adjustment
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} strokeWidth={1.8} className="animate-spin" style={{ color: GOLD }} />
        </div>
      ) : adjustments.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[0.52rem] tracking-[0.10em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            No stock adjustments recorded yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Date', 'Variant', 'Prev. Stock', 'Adjustment', 'New Stock', 'Admin'].map(col => (
                  <th
                    key={col}
                    className="px-5 py-2.5 text-left text-[0.44rem] tracking-[0.16em] uppercase font-semibold"
                    style={{ color: 'rgba(255,255,255,0.20)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adjustments.map(adj => {
                const delta = adj.type === 'remove' ? -adj.adjustment : adj.type === 'set' ? adj.newStock - adj.previousStock : adj.adjustment;
                const sign  = delta >= 0 ? '+' : '';
                const col   = delta > 0 ? 'rgba(74,222,128,0.80)' : delta < 0 ? 'rgba(239,68,68,0.75)' : 'rgba(255,255,255,0.35)';
                const typeLabel = { add: 'Add', remove: 'Remove', set: 'Set' }[adj.type];
                return (
                  <tr
                    key={adj._id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <td className="px-5 py-3 text-[0.52rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      {formatAdjDate(adj.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[0.54rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {adj.variantSize}
                      </p>
                      {adj.variantSku && (
                        <p className="text-[0.42rem] tracking-[0.10em] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
                          {adj.variantSku}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[0.54rem] tabular-nums" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      {adj.previousStock}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-[0.52rem] tabular-nums font-semibold"
                        style={{ color: col }}
                      >
                        {sign}{delta} <span className="font-normal opacity-70 text-[0.44rem]">({typeLabel})</span>
                      </span>
                      {adj.reason && (
                        <p className="text-[0.42rem] tracking-[0.04em] mt-0.5 truncate max-w-[140px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                          {adj.reason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[0.54rem] tabular-nums font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
                      {adj.newStock}
                    </td>
                    <td className="px-5 py-3 text-[0.50rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {adj.adjustedBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Stock Adjustment Sheet ─────────────────────────────────────────────────────

function StockAdjustmentSheet({
  open,
  onClose,
  productId,
  variants,
  onSaved,
}: {
  open:      boolean;
  onClose:   () => void;
  productId: string;
  variants:  { size: string; sku: string; stock: string }[];
  onSaved:   (record: StockAdjustmentRecord) => void;
}) {
  const [variantSize, setVariantSize] = useState('');
  const [adjType,     setAdjType]     = useState<'add' | 'remove' | 'set'>('add');
  const [qty,         setQty]         = useState('');
  const [reason,      setReason]      = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setVariantSize(variants[0]?.size ?? '');
      setAdjType('add');
      setQty('');
      setReason('');
      setError(null);
    }
  }, [open, variants]);

  async function handleSave() {
    setError(null);
    if (!variantSize) { setError('Please select a variant.'); return; }
    const qtyNum = Number(qty);
    if (!qty || isNaN(qtyNum) || qtyNum < 0) { setError('Enter a valid quantity.'); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock-adjustments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ variantSize, type: adjType, qty: qtyNum, reason }),
      });
      const json = await res.json() as { success?: boolean; error?: string; data?: StockAdjustmentRecord };
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to save adjustment.');
        return;
      }
      onSaved(json.data!);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.72)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{    y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
            style={{
              background: '#1A1A1A',
              border:     '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-[0.62rem] tracking-[0.16em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.78)' }}>
                Manual Stock Adjustment
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7"
                style={{ color: 'rgba(255,255,255,0.30)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">

              {/* Variant select */}
              <div className="space-y-1.5">
                <label className="text-[0.52rem] tracking-[0.12em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Variant
                </label>
                <select
                  value={variantSize}
                  onChange={e => setVariantSize(e.target.value)}
                  className="w-full h-9 px-3 text-[0.58rem] tracking-[0.04em] outline-none appearance-none"
                  style={{
                    background: '#111',
                    border:     '1px solid rgba(255,255,255,0.10)',
                    color:      'rgba(255,255,255,0.72)',
                  }}
                >
                  {variants.map(v => (
                    <option key={v.size} value={v.size}>
                      {v.size}{v.sku ? ` — ${v.sku}` : ''} (stock: {v.stock || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment type */}
              <div className="space-y-1.5">
                <label className="text-[0.52rem] tracking-[0.12em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Adjustment Type
                </label>
                <div className="flex gap-0" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {(['add', 'remove', 'set'] as const).map((t, i) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAdjType(t)}
                      className="flex-1 h-9 text-[0.52rem] tracking-[0.10em] uppercase font-medium transition-colors duration-100"
                      style={{
                        background: adjType === t ? 'rgba(180,130,60,0.14)' : 'transparent',
                        color:      adjType === t ? GOLD : 'rgba(255,255,255,0.35)',
                        borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                      }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[0.52rem] tracking-[0.12em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 px-3 text-[0.58rem] tracking-[0.04em] outline-none tabular-nums"
                  style={{
                    background: '#111',
                    border:     '1px solid rgba(255,255,255,0.10)',
                    color:      'rgba(255,255,255,0.72)',
                  }}
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-[0.52rem] tracking-[0.12em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Received new shipment, returned items, damaged stock..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-[0.56rem] tracking-[0.04em] outline-none resize-none"
                  style={{
                    background: '#111',
                    border:     '1px solid rgba(255,255,255,0.10)',
                    color:      'rgba(255,255,255,0.65)',
                  }}
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{    opacity: 0 }}
                    className="text-[0.52rem] tracking-[0.06em]"
                    style={{ color: 'rgba(239,68,68,0.85)' }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-10 text-[0.56rem] tracking-[0.14em] uppercase font-semibold transition-colors duration-150"
                style={{
                  background: saving ? 'rgba(180,130,60,0.35)' : GOLD,
                  color:      saving ? 'rgba(255,255,255,0.40)' : 'oklch(0.10 0 0)',
                  cursor:     saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving && <Spinner />}
                Save Adjustment
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Danger Zone ────────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  danger,
  saving,
  extra,
  onConfirm,
  onCancel,
}: {
  title:        string;
  body:         React.ReactNode;
  confirmLabel: string;
  danger?:      boolean;
  saving:       boolean;
  extra?:       React.ReactNode;
  onConfirm:    () => void;
  onCancel:     () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.80)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{    opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm p-6 space-y-4"
        style={{
          background: '#1C1C1C',
          border:     `1px solid ${danger ? 'rgba(239,68,68,0.20)' : 'rgba(255,255,255,0.10)'}`,
        }}
      >
        <h3
          className="text-[0.64rem] tracking-[0.18em] uppercase font-semibold"
          style={{ color: danger ? 'rgba(239,68,68,0.88)' : 'rgba(255,255,255,0.80)' }}
        >
          {title}
        </h3>
        <div className="text-[0.56rem] tracking-[0.04em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {body}
        </div>
        {extra}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 h-9 text-[0.52rem] tracking-[0.12em] uppercase transition-colors duration-100"
            style={{
              background: 'transparent',
              color:      'rgba(255,255,255,0.35)',
              border:     '1px solid rgba(255,255,255,0.10)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saving ? undefined : onConfirm}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 h-9 text-[0.52rem] tracking-[0.12em] uppercase font-semibold transition-colors duration-100"
            style={{
              background: danger ? 'rgba(239,68,68,0.14)' : 'rgba(180,130,60,0.14)',
              color:      danger ? 'rgba(239,68,68,0.88)' : GOLD,
              border:     `1px solid ${danger ? 'rgba(239,68,68,0.28)' : 'rgba(180,130,60,0.28)'}`,
              cursor:     saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DangerZone({
  productId,
  productName,
  totalSold,
  onArchived,
  onDeleted,
}: {
  productId:   string;
  productName: string;
  totalSold:   number;
  onArchived:  () => void;
  onDeleted:   () => void;
}) {
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  const [archiving,    setArchiving]    = useState(false);
  const [delete1Open,  setDelete1Open]  = useState(false);
  const [delete2Open,  setDelete2Open]  = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [confirmText,  setConfirmText]  = useState('');

  async function handleArchive() {
    setArchiving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (res.ok) { onArchived(); }
    } catch { /* ignore */ } finally {
      setArchiving(false);
      setArchiveOpen(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}?permanent=true`, { method: 'DELETE' });
      if (res.ok) { onDeleted(); }
    } catch { /* ignore */ } finally {
      setDeleting(false);
      setDelete2Open(false);
    }
  }

  return (
    <>
      <div
        className="space-y-4 p-5"
        style={{ border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.03)' }}
      >
        <div className="space-y-0.5">
          <h2
            className="text-[0.58rem] tracking-[0.18em] uppercase font-semibold"
            style={{ color: 'rgba(239,68,68,0.72)' }}
          >
            Danger Zone
          </h2>
          <p className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            These actions are difficult or impossible to reverse.
          </p>
        </div>

        {/* Archive */}
        <div
          className="flex items-start justify-between gap-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="space-y-0.5">
            <p className="text-[0.54rem] tracking-[0.08em] font-medium" style={{ color: 'rgba(255,255,255,0.62)' }}>
              Archive Product
            </p>
            <p className="text-[0.46rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Hides from store. Data is preserved and can be restored.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-[0.50rem] tracking-[0.10em] uppercase font-medium shrink-0 transition-colors duration-100"
            style={{
              background: 'transparent',
              color:      'rgba(239,68,68,0.60)',
              border:     '1px solid rgba(239,68,68,0.20)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = 'rgba(239,68,68,0.88)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(239,68,68,0.60)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)';
            }}
          >
            <Archive size={11} strokeWidth={1.8} />
            Archive
          </button>
        </div>

        {/* Permanent delete */}
        <div
          className="flex items-start justify-between gap-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="space-y-0.5">
            <p className="text-[0.54rem] tracking-[0.08em] font-medium" style={{ color: 'rgba(255,255,255,0.62)' }}>
              Permanently Delete
            </p>
            <p className="text-[0.46rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {totalSold > 0
                ? `Cannot delete — this product has ${totalSold} recorded sale${totalSold !== 1 ? 's' : ''}.`
                : 'Irreversible. This product and all its data will be removed forever.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => totalSold === 0 && setDelete1Open(true)}
            disabled={totalSold > 0}
            className="flex items-center gap-1.5 h-8 px-3 text-[0.50rem] tracking-[0.10em] uppercase font-medium shrink-0 transition-colors duration-100"
            style={{
              background: 'transparent',
              color:      totalSold > 0 ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.60)',
              border:     `1px solid ${totalSold > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.20)'}`,
              cursor:     totalSold > 0 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => {
              if (totalSold === 0) {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                e.currentTarget.style.color = 'rgba(239,68,68,0.88)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
              }
            }}
            onMouseLeave={e => {
              if (totalSold === 0) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(239,68,68,0.60)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)';
              }
            }}
          >
            <Trash2 size={11} strokeWidth={1.8} />
            Delete
          </button>
        </div>
      </div>

      {/* Archive confirm modal */}
      <AnimatePresence>
        {archiveOpen && (
          <ConfirmModal
            title="Archive this product?"
            body={
              <>
                <strong style={{ color: 'rgba(255,255,255,0.70)' }}>{productName}</strong> will be hidden
                from the store. No data will be lost and you can restore it at any time by changing its status.
              </>
            }
            confirmLabel="Archive Product"
            danger
            saving={archiving}
            onConfirm={handleArchive}
            onCancel={() => setArchiveOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete step 1 */}
      <AnimatePresence>
        {delete1Open && (
          <ConfirmModal
            title="Are you sure?"
            body={
              <>
                You are about to permanently delete{' '}
                <strong style={{ color: 'rgba(255,255,255,0.70)' }}>{productName}</strong>.
                This action cannot be undone.
              </>
            }
            confirmLabel="Continue"
            danger
            saving={false}
            onConfirm={() => { setDelete1Open(false); setDelete2Open(true); setConfirmText(''); }}
            onCancel={() => setDelete1Open(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete step 2 — type product name */}
      <AnimatePresence>
        {delete2Open && (
          <ConfirmModal
            title="Type the product name to confirm"
            body={
              <>
                Type <strong style={{ color: 'rgba(255,255,255,0.70)' }}>{productName}</strong> to
                permanently delete this product.
              </>
            }
            confirmLabel="Delete Forever"
            danger
            saving={deleting}
            extra={
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={productName}
                className="w-full h-9 px-3 text-[0.56rem] tracking-[0.04em] outline-none"
                style={{
                  background: '#111',
                  border:     '1px solid rgba(239,68,68,0.22)',
                  color:      'rgba(255,255,255,0.72)',
                }}
                autoFocus
              />
            }
            onConfirm={() => {
              if (confirmText.trim() === productName.trim()) handleDelete();
            }}
            onCancel={() => { setDelete2Open(false); setConfirmText(''); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = use(params);
  const router   = useRouter();

  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [adminUser,      setAdminUser]      = useState<AdminUser | null>(null);

  // Product data
  const [pageLoading,    setPageLoading]    = useState(true);
  const [product,        setProduct]        = useState<DbProduct | null>(null);
  const [notFound,       setNotFound]       = useState(false);

  // Stats
  const [stats,          setStats]          = useState<ProductStats | null>(null);

  // Stock adjustments
  const [adjustments,       setAdjustments]       = useState<StockAdjustmentRecord[]>([]);
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(true);
  const [sheetOpen,          setSheetOpen]          = useState(false);

  // Form
  const [form,          setForm]          = useState<ProductDraft>(EMPTY_DRAFT);
  const [isDirty,       setIsDirty]       = useState(false);
  const [savingDraft,   setSavingDraft]   = useState(false);
  const [savingPublish, setSavingPublish] = useState(false);
  const [saveError,     setSaveError]     = useState<string | null>(null);
  const [saveSuccess,   setSaveSuccess]   = useState(false);

  const patch = useCallback((p: Partial<ProductDraft>) => {
    setForm(prev => ({ ...prev, ...p }));
    setIsDirty(true);
  }, []);

  // Auth check
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return; }
        const { data } = await res.json() as { data?: AdminUser };
        if (!cancelled && data) setAdminUser(data);
      } catch { /* ignore */ }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  // Fetch product
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setPageLoading(true);
      try {
        const res = await fetch(`/api/admin/products/${id}`);
        if (res.status === 404) { if (!cancelled) setNotFound(true); return; }
        if (!res.ok) return;
        const json = await res.json() as { success?: boolean; data?: DbProduct };
        if (!cancelled && json.data) {
          setProduct(json.data);
          setForm(dbProductToProductDraft(json.data));
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setPageLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  // Fetch stats
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res  = await fetch(`/api/admin/products/${id}/stats`);
        const json = await res.json() as { success?: boolean; data?: ProductStats };
        if (!cancelled && json.data) setStats(json.data);
      } catch { /* ignore */ }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  // Fetch stock adjustments
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setAdjustmentsLoading(true);
      try {
        const res  = await fetch(`/api/admin/products/${id}/stock-adjustments`);
        const json = await res.json() as { success?: boolean; data?: StockAdjustmentRecord[] };
        if (!cancelled && json.data) setAdjustments(json.data);
      } catch { /* ignore */ } finally {
        if (!cancelled) setAdjustmentsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const adminFullName  = adminUser ? `${adminUser.firstName} ${adminUser.lastName}`     : '—';
  const adminShortName = adminUser ? `${adminUser.firstName} ${adminUser.lastName[0]}.` : '—';
  const adminRoleLabel = adminUser?.role === 'superadmin' ? 'Super Admin' : 'Admin';

  async function save(status: 'draft' | 'published') {
    setSaveError(null);
    setSaveSuccess(false);
    const set = status === 'draft' ? setSavingDraft : setSavingPublish;
    set(true);
    try {
      const res  = await fetch(`/api/admin/products/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, status }),
      });
      const json = await res.json() as { success?: boolean; error?: string; data?: DbProduct };
      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'Something went wrong. Please try again.');
        return;
      }
      if (json.data) {
        setProduct(json.data);
        setForm(dbProductToProductDraft(json.data));
      }
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Network error. Check your connection and try again.');
    } finally {
      set(false);
    }
  }

  function handleSaveDraft()  { void save('draft');     }
  function handlePublish()    { void save('published'); }

  function handleAdjustmentSaved(record: StockAdjustmentRecord) {
    setAdjustments(prev => [record, ...prev]);
    // Also update the stock value in the form
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map(v =>
        v.size === record.variantSize
          ? { ...v, stock: String(record.newStock) }
          : v,
      ),
    }));
  }

  // Loading screen
  if (pageLoading) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center" style={{ background: '#0F0F0F' }}>
        <Loader2 size={22} strokeWidth={1.6} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="fixed inset-0 z-60 flex flex-col items-center justify-center gap-3" style={{ background: '#0F0F0F' }}>
        <p className="text-[0.62rem] tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Product not found
        </p>
        <Link
          href="/admin/products"
          className="text-[0.54rem] tracking-[0.12em] uppercase underline underline-offset-2"
          style={{ color: GOLD }}
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const variantsForSheet = form.variants.map(v => ({
    size:  v.size,
    sku:   v.sku,
    stock: v.stock,
  }));

  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F' }}>

      {/* Sidebar */}
      <AdminSidebar
        adminName={adminFullName}
        adminRole={adminRoleLabel}
        avatarUrl={adminUser?.avatar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content */}
      <div className="lg:pl-55 flex flex-col min-h-screen">

        <AdminTopNav
          pageTitle={`Edit — ${product?.name ?? 'Product'}`}
          adminName={adminShortName}
          avatarUrl={adminUser?.avatar}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <main className="flex-1 pt-14 pb-16">
          <div className="p-5 md:p-7 space-y-6">

            {/* Page header */}
            <PageHeaderBlock
              productName={product?.name ?? ''}
              updatedAt={product?.updatedAt ?? ''}
              createdByName={stats?.createdByName ?? ''}
              hasUnsavedChanges={isDirty}
              savingDraft={savingDraft}
              savingPublish={savingPublish}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
            />

            {/* Save error */}
            <AnimatePresence>
              {saveError && (
                <motion.div
                  key="save-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0  }}
                  exit={{    opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border:     '1px solid rgba(239,68,68,0.20)',
                  }}
                >
                  <p className="text-[0.54rem] tracking-[0.06em]" style={{ color: 'rgba(239,68,68,0.88)' }}>
                    {saveError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSaveError(null)}
                    className="shrink-0 text-[0.44rem] tracking-widest uppercase"
                    style={{ color: 'rgba(239,68,68,0.55)' }}
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save success */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  key="save-success"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0  }}
                  exit={{    opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="px-4 py-3"
                  style={{
                    background: 'rgba(34,197,94,0.07)',
                    border:     '1px solid rgba(34,197,94,0.18)',
                  }}
                >
                  <p className="text-[0.54rem] tracking-[0.06em]" style={{ color: 'rgba(74,222,128,0.85)' }}>
                    Product saved successfully.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Performance stats */}
            <PerformanceStatsBar stats={stats} />

            {/* Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

              {/* LEFT */}
              <div className="space-y-5">
                <BasicInfoSection        value={form} onChange={patch} />
                <ProductImagesSection    value={form} onChange={patch} />
                <FragranceDetailsSection value={form} onChange={patch} />
                <ScentNotesSection       value={form} onChange={patch} />
                <VariantsPricingSection  value={form} onChange={patch} />
                <SEOSection              value={form} onChange={patch} />

                {/* Stock history — edit only */}
                <StockHistorySection
                  adjustments={adjustments}
                  loading={adjustmentsLoading}
                  onOpenSheet={() => setSheetOpen(true)}
                />
              </div>

              {/* RIGHT */}
              <div className="space-y-5">
                <StatusSection       value={form} onChange={patch} />
                <OrganizationSection value={form} onChange={patch} />
                <ShippingSection     value={form} onChange={patch} />

                {/* Danger zone — edit only */}
                <DangerZone
                  productId={id}
                  productName={product?.name ?? ''}
                  totalSold={stats?.unitsSold ?? 0}
                  onArchived={() => router.push('/admin/products')}
                  onDeleted={()  => router.push('/admin/products')}
                />
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Sticky action bar */}
      <FormActionBar
        hasUnsavedChanges={isDirty}
        savingDraft={savingDraft}
        savingPublish={savingPublish}
        productSlug={form.slug}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onDelete={() => {/* handled by DangerZone */}}
      />

      {/* Stock adjustment sheet */}
      <StockAdjustmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        productId={id}
        variants={variantsForSheet}
        onSaved={handleAdjustmentSaved}
      />

    </div>
  );
}
