'use client';

import { useState, useEffect } from 'react';
import { Save, Zap, Archive, Eye, Loader2 } from 'lucide-react';
import { GOLD } from './shared';

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner() {
  return <Loader2 size={12} strokeWidth={1.8} className="animate-spin shrink-0" />;
}

// ── Action Button ──────────────────────────────────────────────────────────────

function ActionButton({
  label,
  icon,
  variant,
  loading,
  disabled,
  onClick,
}: {
  label:    string;
  icon:     React.ReactNode;
  variant:  'filled' | 'outlined' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  onClick:  () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const busy = loading || disabled;

  const styles: Record<string, React.CSSProperties> = {
    filled: {
      background: busy ? 'rgba(180,130,60,0.35)' : hovered ? 'oklch(0.60 0.10 70)' : GOLD,
      color:  busy ? 'rgba(255,255,255,0.40)' : 'oklch(0.10 0 0)',
      border: 'none',
    },
    outlined: {
      background: hovered && !busy ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
      color:  busy ? 'rgba(255,255,255,0.20)' : hovered ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
      border: busy
        ? '1px solid rgba(255,255,255,0.05)'
        : hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
    },
    danger: {
      background: hovered && !busy ? 'rgba(239,68,68,0.10)' : 'transparent',
      color:  busy ? 'rgba(239,68,68,0.25)' : hovered ? 'rgba(239,68,68,0.90)' : 'rgba(239,68,68,0.60)',
      border: busy
        ? '1px solid rgba(239,68,68,0.08)'
        : hovered ? '1px solid rgba(239,68,68,0.30)' : '1px solid rgba(239,68,68,0.18)',
    },
    ghost: {
      background: hovered && !busy ? 'rgba(255,255,255,0.05)' : 'transparent',
      color:  busy ? 'rgba(255,255,255,0.15)' : hovered ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.32)',
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
      className="flex items-center gap-1.5 h-8 px-3 text-[0.52rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150"
      style={{ ...styles[variant], cursor: busy ? 'not-allowed' : 'pointer', borderRadius: '2px', flexShrink: 0 }}
    >
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

// ── FormActionBar ──────────────────────────────────────────────────────────────

export default function FormActionBar({
  isEdit,
  hasUnsavedChanges,
  savingDraft,
  savingActivate,
  onSaveDraft,
  onActivate,
  onArchive,
  onPreview,
}: {
  isEdit?:           boolean;
  hasUnsavedChanges: boolean;
  savingDraft:       boolean;
  savingActivate:    boolean;
  onSaveDraft:       () => void;
  onActivate:        () => void;
  onArchive?:        () => void;
  onPreview?:        () => void;
}) {
  // Warn before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const anyBusy = savingDraft || savingActivate;

  return (
    <div
      className="fixed bottom-0 right-0 z-40 flex items-center justify-between gap-4 px-5 md:px-7 h-14"
      style={{
        left:           'var(--sidebar-width, 0px)',
        background:     'rgba(20,20,20,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop:      '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left — archive + preview */}
      <div className="flex items-center gap-2">
        {isEdit && onArchive && (
          <ActionButton
            label="Archive"
            icon={<Archive size={12} strokeWidth={1.8} />}
            variant="danger"
            disabled={anyBusy}
            onClick={onArchive}
          />
        )}
        {onPreview && (
          <ActionButton
            label="Preview"
            icon={<Eye size={12} strokeWidth={1.8} />}
            variant="ghost"
            disabled={anyBusy}
            onClick={onPreview}
          />
        )}
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
          disabled={savingActivate}
          onClick={onSaveDraft}
        />
        <ActionButton
          label="Activate Code"
          icon={<Zap size={12} strokeWidth={2} />}
          variant="filled"
          loading={savingActivate}
          disabled={savingDraft}
          onClick={onActivate}
        />
      </div>
    </div>
  );
}
