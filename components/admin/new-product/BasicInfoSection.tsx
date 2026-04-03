'use client';

import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  Link2, Lock, Unlock, Bold, Italic, Underline,
  List, Heading2, Heading3, Link as LinkIcon,
} from 'lucide-react';
import type { ProductDraft } from './types';
import { slugify } from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const inputBase: React.CSSProperties = {
  background:  '#1A1A1A',
  border:      '1px solid rgba(255,255,255,0.07)',
  color:       'rgba(255,255,255,0.78)',
  outline:     'none',
  width:       '100%',
};

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = e.currentTarget.value
    ? 'rgba(180,130,60,0.20)'
    : 'rgba(255,255,255,0.07)';
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-[0.50rem] tracking-[0.14em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {children}
        {required && <span className="ml-1" style={{ color: GOLD }}>*</span>}
      </label>
      {hint && (
        <span className="text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.20)' }}>{hint}</span>
      )}
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const pct  = current / max;
  const col  = pct > 0.9 ? 'rgba(239,68,68,0.80)' : pct > 0.75 ? 'oklch(0.70 0.14 55)' : 'rgba(255,255,255,0.22)';
  return (
    <span className="text-[0.44rem] tracking-[0.06em] shrink-0" style={{ color: col }}>
      {current}/{max}
    </span>
  );
}

// ── WYSIWYG Editor ─────────────────────────────────────────────────────────────

function WYSIWYGEditor({
  value,
  onChange,
}: {
  value:    string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  // Populate on first mount only
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus();
    try { document.execCommand(cmd, false, val ?? ''); } catch { /* noop */ }
  }

  function handleLink() {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  }

  const ToolbarBtn = ({
    icon, cmd, val, title,
  }: {
    icon:   React.ReactNode;
    cmd?:   string;
    val?:   string;
    title:  string;
    onClick?: () => void;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => {
        e.preventDefault(); // keep editor focus
        if (cmd) exec(cmd, val);
      }}
      className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
      style={{ color: 'rgba(255,255,255,0.42)', borderRadius: '2px' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.72)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.42)';
      }}
    >
      {icon}
    </button>
  );

  return (
    <div
      style={{
        border:       focused ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
        background:   '#1A1A1A',
        borderRadius: '2px',
        transition:   'border-color 0.15s',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <ToolbarBtn icon={<Bold size={12} strokeWidth={2} />}       cmd="bold"                     title="Bold (⌘B)"      />
        <ToolbarBtn icon={<Italic size={12} strokeWidth={2} />}     cmd="italic"                   title="Italic (⌘I)"    />
        <ToolbarBtn icon={<Underline size={12} strokeWidth={2} />}  cmd="underline"                title="Underline (⌘U)" />
        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <ToolbarBtn icon={<Heading2 size={12} strokeWidth={2} />}   cmd="formatBlock" val="<h2>"   title="Heading 2"      />
        <ToolbarBtn icon={<Heading3 size={12} strokeWidth={2} />}   cmd="formatBlock" val="<h3>"   title="Heading 3"      />
        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <ToolbarBtn icon={<List size={12} strokeWidth={2} />}       cmd="insertUnorderedList"      title="Bullet List"    />
        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <button
          type="button"
          title="Insert Link"
          onMouseDown={e => { e.preventDefault(); handleLink(); }}
          className="flex items-center justify-center w-7 h-7 transition-colors duration-100"
          style={{ color: 'rgba(255,255,255,0.42)', borderRadius: '2px' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.72)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.42)';
          }}
        >
          <LinkIcon size={12} strokeWidth={2} />
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
        className="min-h-[160px] px-4 py-3 text-[0.58rem] leading-relaxed outline-none"
        style={{
          color: 'rgba(255,255,255,0.75)',
        }}
        data-placeholder="Write the brand story, mood, inspiration, occasion..."
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.18);
          pointer-events: none;
        }
        [contenteditable] h2 {
          font-size: 0.80rem;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          margin-bottom: 4px;
          letter-spacing: 0.04em;
        }
        [contenteditable] h3 {
          font-size: 0.68rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          margin-bottom: 2px;
          letter-spacing: 0.04em;
        }
        [contenteditable] ul {
          list-style: disc;
          padding-left: 1.2em;
        }
        [contenteditable] a {
          color: ${GOLD};
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// ── BasicInfoSection ───────────────────────────────────────────────────────────

interface BasicInfoProps {
  value:    Pick<ProductDraft, 'name' | 'slug' | 'shortDescription' | 'fullDescription'>;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function BasicInfoSection({ value, onChange }: BasicInfoProps) {
  const [slugLocked,      setSlugLocked]      = useState(true);
  const [slugStatus,      setSlugStatus]      = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-generate slug from name (only when locked)
  useEffect(() => {
    if (slugLocked && value.name) {
      onChange({ slug: slugify(value.name) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.name, slugLocked]);

  // Debounced slug uniqueness check
  const checkSlug = useCallback((slug: string) => {
    if (!slug) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/products/check-slug?slug=${encodeURIComponent(slug)}`);
        const { available } = await res.json() as { available: boolean };
        setSlugStatus(available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);
  }, []);

  function handleSlugChange(slug: string) {
    onChange({ slug });
    checkSlug(slug);
  }

  const slugStatusNode = {
    idle:      null,
    checking:  <span style={{ color: 'rgba(255,255,255,0.30)' }}>Checking…</span>,
    available: <span style={{ color: 'rgba(74,222,128,0.82)' }}>Available</span>,
    taken:     <span style={{ color: 'rgba(239,68,68,0.82)' }}>Already taken</span>,
  }[slugStatus];

  return (
    <SectionCard title="Basic Information">

      {/* ── Product Name ── */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <FieldLabel required>Product Name</FieldLabel>
          <CharCount current={value.name.length} max={100} />
        </div>
        <input
          type="text"
          value={value.name}
          maxLength={100}
          placeholder="e.g., Noir Oud Intense"
          onChange={e => onChange({ name: e.target.value })}
          onFocus={focusBorder}
          onBlur={blurBorder}
          className="h-9 px-3 text-[0.58rem] tracking-[0.04em] w-full transition-colors duration-150"
          style={inputBase}
        />
      </div>

      {/* ── Slug ── */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <FieldLabel>Slug / URL</FieldLabel>
          <span className="text-[0.44rem] tracking-[0.06em] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.20)' }}>
            {slugStatusNode}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={value.slug}
              readOnly={slugLocked}
              placeholder="noir-oud-intense"
              onChange={e => handleSlugChange(e.target.value)}
              onFocus={focusBorder}
              onBlur={blurBorder}
              className="h-9 pl-3 pr-8 text-[0.56rem] tracking-[0.06em] w-full transition-colors duration-150 font-mono"
              style={{
                ...inputBase,
                opacity:  slugLocked ? 0.65 : 1,
                cursor:   slugLocked ? 'default' : 'text',
              }}
            />
            <span
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              <Link2 size={11} strokeWidth={1.8} />
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setSlugLocked(l => !l); if (!slugLocked) checkSlug(value.slug); }}
            className="flex items-center justify-center w-9 h-9 shrink-0 transition-colors duration-150"
            title={slugLocked ? 'Edit slug' : 'Lock slug'}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border:     '1px solid rgba(255,255,255,0.08)',
              color:      slugLocked ? 'rgba(255,255,255,0.35)' : GOLD,
              borderRadius: '2px',
            }}
          >
            {slugLocked ? <Lock size={12} strokeWidth={1.8} /> : <Unlock size={12} strokeWidth={1.8} />}
          </button>
        </div>
        {value.slug && (
          <p className="mt-1.5 text-[0.46rem] tracking-[0.06em] font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
            aurafumeng.com/shop/<span style={{ color: 'rgba(255,255,255,0.45)' }}>{value.slug}</span>
          </p>
        )}
      </div>

      {/* ── Short Description ── */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <FieldLabel required>
            Short Description
            <span className="ml-2 text-[0.42rem] tracking-[0.04em] normal-case font-normal" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Shown on product cards
            </span>
          </FieldLabel>
          <CharCount current={value.shortDescription.length} max={160} />
        </div>
        <textarea
          value={value.shortDescription}
          maxLength={160}
          rows={3}
          placeholder='e.g., A bold, smoky trail of oud and amber.'
          onChange={e => onChange({ shortDescription: e.target.value })}
          onFocus={focusBorder}
          onBlur={blurBorder}
          className="px-3 py-2.5 text-[0.56rem] tracking-[0.04em] leading-relaxed resize-none w-full transition-colors duration-150"
          style={inputBase}
        />
      </div>

      {/* ── Full Description (WYSIWYG) ── */}
      <div>
        <FieldLabel required>
          Full Description
          <span className="ml-2 text-[0.42rem] tracking-[0.04em] normal-case font-normal" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Brand story, mood, inspiration, occasion
          </span>
        </FieldLabel>
        <WYSIWYGEditor
          value={value.fullDescription}
          onChange={html => onChange({ fullDescription: html })}
        />
      </div>

    </SectionCard>
  );
}
