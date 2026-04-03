'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { ProductDraft } from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const NOTE_SUGGESTIONS: Record<'top' | 'heart' | 'base', string[]> = {
  top: [
    'Bergamot', 'Lemon', 'Grapefruit', 'Orange', 'Lime', 'Pink Pepper',
    'Cardamom', 'Ginger', 'Aldehydes', 'Neroli', 'Mandarin', 'Petitgrain',
    'Basil', 'Coriander', 'Eucalyptus', 'Green Apple', 'Pear', 'Peach',
  ],
  heart: [
    'Rose', 'Jasmine', 'Geranium', 'Iris', 'Ylang Ylang', 'Violet',
    'Peony', 'Freesia', 'Magnolia', 'Lily', 'Orris', 'Tuberose',
    'Lavender', 'Heliotrope', 'Clove', 'Nutmeg', 'Cinnamon', 'Cedar',
  ],
  base: [
    'Oud', 'Amber', 'Sandalwood', 'Vetiver', 'Musk', 'Vanilla',
    'Patchouli', 'Benzoin', 'Labdanum', 'Civet', 'Oakmoss', 'Tonka Bean',
    'Castoreum', 'Frankincense', 'Myrrh', 'Ambergris', 'Leather', 'Incense',
  ],
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-6">{children}</div>
    </div>
  );
}

// ── Tag Input ──────────────────────────────────────────────────────────────────

function TagInput({
  label,
  required,
  tags,
  suggestions,
  placeholder,
  onChange,
}: {
  label:       string;
  required?:   boolean;
  tags:        string[];
  suggestions: string[];
  placeholder: string;
  onChange:    (tags: string[]) => void;
}) {
  const [input,    setInput]    = useState('');
  const [focused,  setFocused]  = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const filtered = suggestions
    .filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
    .slice(0, 8);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSugg(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function addTag(tag: string) {
    const clean = tag.trim();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setInput('');
    setShowSugg(false);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
    if (e.key === 'Escape') {
      setShowSugg(false);
    }
  }

  return (
    <div>
      {/* Label */}
      <label className="block text-[0.50rem] tracking-[0.14em] uppercase font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {label}
        {required && <span className="ml-1" style={{ color: GOLD }}>*</span>}
      </label>

      {/* Input + tags container */}
      <div
        ref={wrapRef}
        onClick={() => inputRef.current?.focus()}
        className="relative min-h-[38px] px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text transition-colors duration-150"
        style={{
          background:  '#1A1A1A',
          border:      focused ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: '2px',
        }}
      >
        {/* Tags */}
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 h-[22px] text-[0.46rem] tracking-[0.08em] font-medium shrink-0"
            style={{
              background:   'rgba(180,130,60,0.14)',
              color:        GOLD,
              borderRadius: '2px',
              border:       '1px solid rgba(180,130,60,0.22)',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag); }}
              style={{ color: 'rgba(180,130,60,0.60)', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(180,130,60,0.60)'; }}
            >
              <X size={9} strokeWidth={2.5} />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          placeholder={tags.length === 0 ? placeholder : ''}
          onChange={e => { setInput(e.target.value); setShowSugg(true); }}
          onFocus={() => { setFocused(true); setShowSugg(true); }}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[80px] h-[22px] outline-none bg-transparent text-[0.54rem] tracking-[0.04em]"
          style={{ color: 'rgba(255,255,255,0.78)' }}
        />

        {/* Suggestions */}
        {showSugg && filtered.length > 0 && (
          <div
            className="absolute left-0 right-0 top-[calc(100%+3px)] z-20 py-1"
            style={{
              background: '#1E1E1E',
              border:     '1px solid rgba(255,255,255,0.10)',
              boxShadow:  '0 8px 24px rgba(0,0,0,0.45)',
              borderRadius: '2px',
            }}
          >
            {filtered.map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={e => { e.preventDefault(); addTag(s); }}
                className="w-full text-left px-3 py-2 text-[0.52rem] tracking-[0.06em] transition-colors duration-100"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(180,130,60,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = GOLD;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                }}
              >
                {s}
              </button>
            ))}
            <p className="px-3 pt-1 pb-1.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.20)' }}>
              Press Enter or , to add custom notes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notes Preview ──────────────────────────────────────────────────────────────

function NotesPreview({
  top, heart, base,
}: {
  top:   string[];
  heart: string[];
  base:  string[];
}) {
  if (!top.length && !heart.length && !base.length) return null;

  const Row = ({ label, notes, accent }: { label: string; notes: string[]; accent: string }) => (
    <div className="flex items-start gap-3">
      <span
        className="text-[0.44rem] tracking-[0.14em] uppercase font-semibold shrink-0 w-10 mt-0.5"
        style={{ color: accent }}
      >
        {label}
      </span>
      <span className="text-[0.52rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {notes.join(', ') || <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>}
      </span>
    </div>
  );

  return (
    <div
      className="p-4 space-y-2"
      style={{
        background:   'rgba(255,255,255,0.02)',
        border:       '1px solid rgba(255,255,255,0.06)',
        borderRadius: '3px',
      }}
    >
      <p className="text-[0.44rem] tracking-[0.16em] uppercase font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
        PDP Preview
      </p>
      <Row label="Top"    notes={top}   accent="rgba(255,255,255,0.40)" />
      <Row label="Heart"  notes={heart} accent={GOLD}                    />
      <Row label="Base"   notes={base}  accent="rgba(180,130,60,0.60)"  />
    </div>
  );
}

// ── ScentNotesSection ──────────────────────────────────────────────────────────

type ScentFields = Pick<ProductDraft, 'topNotes' | 'heartNotes' | 'baseNotes'>;

interface ScentNotesProps {
  value:    ScentFields;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function ScentNotesSection({ value, onChange }: ScentNotesProps) {
  return (
    <SectionCard title="Scent Notes">

      <TagInput
        label="Top Notes"
        required
        tags={value.topNotes}
        suggestions={NOTE_SUGGESTIONS.top}
        placeholder="e.g., Bergamot, Pink Pepper, Lemon…"
        onChange={topNotes => onChange({ topNotes })}
      />

      <TagInput
        label="Heart / Middle Notes"
        required
        tags={value.heartNotes}
        suggestions={NOTE_SUGGESTIONS.heart}
        placeholder="e.g., Rose, Jasmine, Geranium…"
        onChange={heartNotes => onChange({ heartNotes })}
      />

      <TagInput
        label="Base Notes"
        required
        tags={value.baseNotes}
        suggestions={NOTE_SUGGESTIONS.base}
        placeholder="e.g., Oud, Amber, Sandalwood, Vetiver…"
        onChange={baseNotes => onChange({ baseNotes })}
      />

      {/* Preview */}
      <NotesPreview
        top={value.topNotes}
        heart={value.heartNotes}
        base={value.baseNotes}
      />

    </SectionCard>
  );
}
