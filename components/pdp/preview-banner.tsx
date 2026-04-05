'use client';

import { useState } from 'react';
import Link          from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface PreviewBannerProps {
  productId:   string;
  productSlug: string;
}

export default function PreviewBanner({ productId, productSlug }: PreviewBannerProps) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/products/${productId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'published', visibleInShop: true }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to publish. Please try again.');
        return;
      }
      // Redirect to the live product page after publish
      router.push(`/shop/${productSlug}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <motion.div
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 32, delay: 0.1 }}
      className="fixed top-14 inset-x-0 z-40"
      style={{ height: '48px' }}
    >
      {/* Main bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 h-full"
        style={{
          background:   'oklch(0.72 0.14 65)',
          borderBottom: '1px solid oklch(0.60 0.14 65)',
        }}
      >
        {/* Left — edit button */}
        <Link
          href={`/admin/products/${productId}/edit`}
          className="flex items-center gap-1.5 h-7 px-3 shrink-0 transition-colors duration-150"
          style={{
            background:  'rgba(0,0,0,0.12)',
            border:      '1px solid rgba(0,0,0,0.16)',
            color:       'oklch(0.12 0 0)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.20)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.12)'; }}
        >
          <Pencil size={11} strokeWidth={2} />
          <span className="text-[0.50rem] tracking-[0.14em] uppercase font-semibold">Edit Product</span>
        </Link>

        {/* Centre — warning message */}
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle
            size={12}
            strokeWidth={2}
            className="shrink-0"
            style={{ color: 'oklch(0.18 0 0)', opacity: 0.65 }}
          />
          <p
            className="text-[0.50rem] tracking-[0.08em] truncate"
            style={{ color: 'oklch(0.12 0 0)', opacity: 0.80 }}
          >
            You are previewing a draft product — not visible to customers
          </p>
        </div>

        {/* Right — publish button */}
        <button
          type="button"
          onClick={publishing ? undefined : handlePublish}
          disabled={publishing}
          className="flex items-center gap-1.5 h-7 px-3 shrink-0 transition-colors duration-150"
          style={{
            background: publishing ? 'rgba(0,0,0,0.08)' : 'oklch(0.12 0 0)',
            border:     '1px solid rgba(0,0,0,0.20)',
            color:      publishing ? 'rgba(0,0,0,0.35)' : 'oklch(0.96 0 0)',
            cursor:     publishing ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => {
            if (!publishing) e.currentTarget.style.background = 'oklch(0.22 0 0)';
          }}
          onMouseLeave={e => {
            if (!publishing) e.currentTarget.style.background = 'oklch(0.12 0 0)';
          }}
        >
          {publishing
            ? <Loader2 size={11} strokeWidth={2} className="animate-spin" />
            : <Zap size={11} strokeWidth={2} />
          }
          <span className="text-[0.50rem] tracking-[0.14em] uppercase font-semibold">
            {publishing ? 'Publishing…' : 'Publish Now'}
          </span>
        </button>
      </div>

      {/* Error strip */}
      {error && (
        <div
          className="px-4 py-1 text-[0.48rem] tracking-[0.06em]"
          style={{ background: 'rgba(239,68,68,0.90)', color: 'white' }}
        >
          {error}
        </div>
      )}
    </motion.div>
  );
}
