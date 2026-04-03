'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { ChevronDown, X, Search }          from 'lucide-react';
import type { ProductDraft }               from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const inputBase: React.CSSProperties = {
  background:  '#1A1A1A',
  border:      '1px solid rgba(255,255,255,0.07)',
  color:       'rgba(255,255,255,0.78)',
  outline:     'none',
  width:       '100%',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ title, children, defaultOpen = false }: {
  title:        string;
  children:     React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between transition-colors duration-150"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <h2 className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {title}
        </h2>
        <ChevronDown
          size={14} strokeWidth={1.8}
          style={{
            color:     'rgba(255,255,255,0.30)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.20s',
          }}
        />
      </button>
      {open && <div className="p-5 space-y-5">{children}</div>}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[0.50rem] tracking-[0.14em] uppercase font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
      {children}
      {required && <span className="ml-1" style={{ color: GOLD }}>*</span>}
    </label>
  );
}

// ── Char Counter (color-coded for SEO limits) ──────────────────────────────────

function MetaCharCount({
  current, max,
}: { current: number; max: number }) {
  const pct = current / max;
  const col = pct > 1
    ? 'rgba(239,68,68,0.85)'
    : pct > 0.85
      ? 'oklch(0.70 0.14 55)'
      : 'rgba(74,222,128,0.75)';
  return (
    <span className="text-[0.44rem] tracking-[0.06em] font-medium" style={{ color: col }}>
      {current}/{max}
    </span>
  );
}

// ── Tag Input ──────────────────────────────────────────────────────────────────

function TagInput({
  tags, placeholder, onChange,
}: {
  tags:        string[];
  placeholder: string;
  onChange:    (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(tag: string) {
    const clean = tag.trim().replace(/,/g, '');
    if (clean && !tags.includes(clean)) onChange([...tags, clean]);
    setInput('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.trim()) addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1));
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="min-h-[38px] px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text transition-colors duration-150"
      style={{
        background:   '#1A1A1A',
        border:       focused ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '2px',
      }}
    >
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-1.5 h-[20px] text-[0.44rem] tracking-[0.08em]"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', borderRadius: '2px' }}
        >
          {tag}
          <button type="button" onClick={e => { e.stopPropagation(); onChange(tags.filter(t => t !== tag)); }} style={{ color: 'rgba(255,255,255,0.35)', display: 'flex' }}>
            <X size={9} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        placeholder={tags.length === 0 ? placeholder : ''}
        onChange={e => setInput(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-[80px] h-[20px] outline-none bg-transparent text-[0.54rem] tracking-[0.04em]"
        style={{ color: 'rgba(255,255,255,0.78)' }}
      />
    </div>
  );
}

// ── Google Search Preview ──────────────────────────────────────────────────────

function GooglePreview({
  title, description, slug,
}: {
  title:       string;
  description: string;
  slug:        string;
}) {
  const displayTitle  = title.slice(0, 60) || 'Product Title';
  const displayDesc   = description.slice(0, 160) || 'Product description will appear here…';
  const displaySlug   = slug || 'product-slug';

  return (
    <div
      className="p-4 space-y-1"
      style={{
        background:   'rgba(255,255,255,0.025)',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderRadius: '3px',
      }}
    >
      <p className="text-[0.44rem] tracking-[0.12em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Google Preview
      </p>
      {/* Site name row */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Search size={8} strokeWidth={2} style={{ color: 'rgba(255,255,255,0.40)' }} />
        </div>
        <div>
          <p className="text-[0.50rem] tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.55)' }}>AuraFumeNG</p>
          <p className="text-[0.44rem] tracking-[0.04em]" style={{ color: 'rgba(74,222,128,0.60)' }}>
            https://aurafumeng.com › shop › {displaySlug}
          </p>
        </div>
      </div>
      {/* Title */}
      <p className="text-[0.62rem] tracking-[0.04em] font-medium" style={{ color: 'rgba(100,149,237,0.90)', lineHeight: 1.4 }}>
        {displayTitle}
      </p>
      {/* Description */}
      <p className="text-[0.50rem] tracking-[0.02em] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {displayDesc}
      </p>
    </div>
  );
}

// ── OG Image Upload ────────────────────────────────────────────────────────────

function OGImageUpload({
  value, onChange,
}: {
  value:    string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Create a local object URL for preview; actual upload would go to Cloudinary
    const url = URL.createObjectURL(file);
    onChange(url);
    e.target.value = '';
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="OG preview"
            className="h-20 w-36 object-cover"
            style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 flex items-center justify-center w-5 h-5"
            style={{ background: 'rgba(0,0,0,0.65)', borderRadius: '2px', color: 'rgba(255,255,255,0.70)' }}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 h-8 px-4 text-[0.50rem] tracking-[0.12em] uppercase transition-colors duration-150"
          style={{
            background:   'rgba(255,255,255,0.03)',
            border:       '1px solid rgba(255,255,255,0.08)',
            color:        'rgba(255,255,255,0.38)',
            borderRadius: '2px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)';
          }}
        >
          Upload OG Image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <p className="mt-1.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.20)' }}>
        Recommended: 1200×630px (Facebook, Twitter, LinkedIn)
      </p>
    </div>
  );
}

// ── SEOSection ────────────────────────────────────────────────────────────────

type SEOFields = Pick<ProductDraft, 'metaTitle' | 'metaDescription' | 'keywords' | 'ogImageUrl' | 'slug'>;

interface SEOSectionProps {
  value:    SEOFields;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function SEOSection({ value, onChange }: SEOSectionProps) {
  return (
    <SectionCard title="SEO &amp; Meta" defaultOpen={false}>

      {/* Meta title */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <FieldLabel>Meta Title</FieldLabel>
          <MetaCharCount current={value.metaTitle.length} max={60} />
        </div>
        <input
          type="text"
          value={value.metaTitle}
          maxLength={70}
          placeholder="e.g., Noir Oud Intense | AuraFumeNG"
          onChange={e => onChange({ metaTitle: e.target.value })}
          className="h-9 px-3 text-[0.56rem] tracking-[0.04em] transition-colors duration-150"
          style={inputBase}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
        />
      </div>

      {/* Meta description */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <FieldLabel>Meta Description</FieldLabel>
          <MetaCharCount current={value.metaDescription.length} max={160} />
        </div>
        <textarea
          value={value.metaDescription}
          maxLength={180}
          rows={3}
          placeholder="A concise description for search engines…"
          onChange={e => onChange({ metaDescription: e.target.value })}
          className="px-3 py-2.5 text-[0.56rem] tracking-[0.04em] leading-relaxed resize-none transition-colors duration-150"
          style={inputBase}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
        />
      </div>

      {/* Keywords */}
      <div>
        <FieldLabel>Keywords</FieldLabel>
        <TagInput
          tags={value.keywords}
          placeholder="Type keyword, press Enter…"
          onChange={keywords => onChange({ keywords })}
        />
      </div>

      {/* Open Graph image */}
      <div>
        <FieldLabel>Open Graph Image</FieldLabel>
        <OGImageUpload value={value.ogImageUrl} onChange={ogImageUrl => onChange({ ogImageUrl })} />
      </div>

      {/* Google preview */}
      <GooglePreview
        title={value.metaTitle}
        description={value.metaDescription}
        slug={value.slug}
      />

    </SectionCard>
  );
}
