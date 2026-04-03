'use client';

import { useState, useEffect }   from 'react';
import { Save, Upload, Trash2, ExternalLink } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin shrink-0"
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Action Button ──────────────────────────────────────────────────────────────

function ActionButton({
  label, icon, variant, loading, disabled, onClick, small,
}: {
  label:    string;
  icon:     React.ReactNode;
  variant:  'filled' | 'outlined' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  onClick:  () => void;
  small?:   boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const busy = loading || disabled;

  const styles: Record<string, React.CSSProperties> = {
    filled: {
      background: busy
        ? 'rgba(180,130,60,0.35)'
        : hovered ? 'oklch(0.60 0.10 70)' : GOLD,
      color:  busy ? 'rgba(255,255,255,0.40)' : 'oklch(0.10 0 0)',
      border: 'none',
    },
    outlined: {
      background: hovered && !busy ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
      color: busy ? 'rgba(255,255,255,0.20)' : hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
      border: busy
        ? '1px solid rgba(255,255,255,0.05)'
        : hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
    },
    danger: {
      background: hovered && !busy ? 'rgba(239,68,68,0.10)' : 'transparent',
      color: busy ? 'rgba(239,68,68,0.25)' : hovered ? 'rgba(239,68,68,0.90)' : 'rgba(239,68,68,0.60)',
      border: busy
        ? '1px solid rgba(239,68,68,0.08)'
        : hovered ? '1px solid rgba(239,68,68,0.30)' : '1px solid rgba(239,68,68,0.18)',
    },
    ghost: {
      background: hovered && !busy ? 'rgba(255,255,255,0.05)' : 'transparent',
      color: busy ? 'rgba(255,255,255,0.15)' : hovered ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.32)',
      border: '1px solid transparent',
    },
  };

  return (
    <button
      type="button"
      onClick={busy ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={busy}
      aria-busy={loading}
      className={`flex items-center gap-1.5 text-[0.52rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150 ${
        small ? 'h-8 px-3' : 'h-9 px-4'
      }`}
      style={{
        ...styles[variant],
        cursor:       busy ? 'not-allowed' : 'pointer',
        borderRadius: '2px',
        flexShrink:   0,
      }}
    >
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

// ── FormActionBar ─────────────────────────────────────────────────────────────

interface FormActionBarProps {
  hasUnsavedChanges: boolean;
  savingDraft:       boolean;
  savingPublish:     boolean;
  productSlug?:      string;
  onSaveDraft:       () => void;
  onPublish:         () => void;
  onDelete:          () => void;
}

export default function FormActionBar({
  hasUnsavedChanges,
  savingDraft,
  savingPublish,
  productSlug,
  onSaveDraft,
  onPublish,
  onDelete,
}: FormActionBarProps) {

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function handlePreview() {
    const slug = productSlug || 'preview';
    window.open(`/shop/${slug}?preview=true`, '_blank', 'noopener,noreferrer');
  }

  const anyBusy = savingDraft || savingPublish;

  return (
    <div
      className="fixed bottom-0 right-0 z-40 flex items-center justify-between gap-4 px-5 md:px-7 h-14"
      style={{
        left:         'var(--sidebar-width, 0px)',
        background:   'rgba(20,20,20,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop:    '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left — destructive / preview */}
      <div className="flex items-center gap-2">
        <ActionButton
          label="Delete / Archive"
          icon={<Trash2 size={12} strokeWidth={1.8} />}
          variant="danger"
          disabled={anyBusy}
          onClick={onDelete}
          small
        />
        <ActionButton
          label="Preview"
          icon={<ExternalLink size={12} strokeWidth={1.8} />}
          variant="ghost"
          onClick={handlePreview}
          small
        />
      </div>

      {/* Center — unsaved indicator */}
      <div className="flex-1 flex items-center justify-center">
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
              style={{ background: 'oklch(0.70 0.14 55)' }}
            />
            <span className="text-[0.46rem] tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Unsaved changes
            </span>
          </div>
        )}
      </div>

      {/* Right — save actions */}
      <div className="flex items-center gap-2">
        <ActionButton
          label="Save as Draft"
          icon={<Save size={12} strokeWidth={1.8} />}
          variant="outlined"
          loading={savingDraft}
          disabled={savingPublish}
          onClick={onSaveDraft}
          small
        />
        <ActionButton
          label="Publish Product"
          icon={<Upload size={12} strokeWidth={1.8} />}
          variant="filled"
          loading={savingPublish}
          disabled={savingDraft}
          onClick={onPublish}
          small
        />
      </div>
    </div>
  );
}
