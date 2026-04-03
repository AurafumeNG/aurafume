'use client';

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import { X, Check, ChevronDown, Search, Plus }                     from 'lucide-react';
import type { ProductDraft }                                        from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

const COLLECTION_OPTIONS = [
  'Summer Collection', 'Oud Collection', 'Gift Sets',
  'New Arrivals',      'Best Sellers',   'Limited Edition',
  'Floral Picks',      'Fresh & Light',  'Evening Collection',
  'Unisex Edits',      'Travel Size',    'Luxury Line',
];

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[0.50rem] tracking-[0.14em] uppercase font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
      {children}
    </label>
  );
}

// ── Simple Tag Input ───────────────────────────────────────────────────────────

function TagInput({
  tags, placeholder, onChange,
}: {
  tags:        string[];
  placeholder: string;
  onChange:    (tags: string[]) => void;
}) {
  const [input, setInput]   = useState('');
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
          className="inline-flex items-center gap-1 px-1.5 h-[20px] text-[0.44rem] tracking-[0.08em] font-mono"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', borderRadius: '2px' }}
        >
          #{tag}
          <button type="button" onClick={e => { e.stopPropagation(); onChange(tags.filter(t => t !== tag)); }} style={{ color: 'rgba(255,255,255,0.30)', display: 'flex' }}>
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

// ── Collections Multi-Select ───────────────────────────────────────────────────

function CollectionsSelect({
  values, onChange,
}: {
  values:   string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function toggle(opt: string) {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[36px] px-3 py-1.5 flex items-start justify-between gap-2 text-[0.56rem] tracking-[0.06em] transition-colors duration-150"
        style={{
          background:   '#1A1A1A',
          border:       open ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
          color:        'rgba(255,255,255,0.78)',
          borderRadius: '2px',
        }}
      >
        <span className="flex flex-wrap gap-1 flex-1 min-w-0">
          {values.length === 0
            ? <span style={{ color: 'rgba(255,255,255,0.28)' }}>Select collections…</span>
            : values.map(v => (
                <span
                  key={v}
                  className="inline-flex items-center px-1.5 h-5 text-[0.42rem] tracking-[0.08em] font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.60)', borderRadius: '2px' }}
                >
                  {v}
                </span>
              ))
          }
        </span>
        <ChevronDown
          size={12} strokeWidth={2}
          style={{ color: 'rgba(255,255,255,0.28)', transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.15s', flexShrink: 0, marginTop: '2px' }}
        />
      </button>
      {open && (
        <div
          className="absolute z-20 left-0 right-0 top-[calc(100%+3px)] py-1"
          style={{
            background: '#1E1E1E',
            border:     '1px solid rgba(255,255,255,0.10)',
            boxShadow:  '0 8px 24px rgba(0,0,0,0.45)',
            maxHeight:  '220px',
            overflowY:  'auto',
            borderRadius: '2px',
          }}
        >
          {COLLECTION_OPTIONS.map(opt => {
            const isSelected = values.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[0.52rem] tracking-[0.06em] transition-colors duration-100"
                style={{
                  color:      isSelected ? GOLD : 'rgba(255,255,255,0.55)',
                  background: isSelected ? 'rgba(180,130,60,0.08)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span
                  className="flex items-center justify-center w-3.5 h-3.5 shrink-0"
                  style={{
                    background:   isSelected ? GOLD : 'transparent',
                    border:       isSelected ? 'none' : '1px solid rgba(255,255,255,0.20)',
                    borderRadius: '2px',
                  }}
                >
                  {isSelected && <Check size={8} strokeWidth={3} style={{ color: 'oklch(0.10 0 0)' }} />}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Related Products Search ────────────────────────────────────────────────────

interface RelatedProduct {
  id:   string;
  name: string;
  sku:  string;
  imageUrl?: string;
}

function RelatedProductsSearch({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  // Store resolved product objects for display
  const [selectedProducts, setSelectedProducts] = useState<RelatedProduct[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  const MAX_RELATED = 8;

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json() as { products: RelatedProduct[] };
      setResults((data.products ?? []).filter(p => !selected.includes(p.id)));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  function handleQueryChange(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  }

  function addProduct(p: RelatedProduct) {
    if (selected.length >= MAX_RELATED) return;
    setSelectedProducts(prev => [...prev, p]);
    onChange([...selected, p.id]);
    setQuery('');
    setResults([]);
  }

  function removeProduct(id: string) {
    setSelectedProducts(prev => prev.filter(p => p.id !== id));
    onChange(selected.filter(s => s !== id));
  }

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
        setResults([]);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={wrapRef} className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search
          size={12} strokeWidth={1.8}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        />
        <input
          type="text"
          value={query}
          placeholder={selected.length >= MAX_RELATED ? 'Max 8 products' : 'Search products by name or SKU…'}
          disabled={selected.length >= MAX_RELATED}
          onChange={e => handleQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          className="h-9 pl-8 pr-3 text-[0.54rem] tracking-[0.04em] w-full outline-none transition-colors duration-150"
          style={{
            background:   '#1A1A1A',
            border:       focused ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
            color:        'rgba(255,255,255,0.78)',
            borderRadius: '2px',
            opacity:      selected.length >= MAX_RELATED ? 0.5 : 1,
          }}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.42rem]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            …
          </span>
        )}
      </div>

      {/* Dropdown results */}
      {focused && results.length > 0 && (
        <div
          className="py-1"
          style={{
            background:   '#1E1E1E',
            border:       '1px solid rgba(255,255,255,0.10)',
            boxShadow:    '0 8px 24px rgba(0,0,0,0.45)',
            borderRadius: '2px',
          }}
        >
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100"
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="w-8 h-8 object-cover shrink-0" style={{ borderRadius: '2px' }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[0.52rem] tracking-[0.06em] truncate" style={{ color: 'rgba(255,255,255,0.70)' }}>{p.name}</p>
                <p className="text-[0.44rem] tracking-[0.06em] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>{p.sku}</p>
              </div>
              <Plus size={12} strokeWidth={2} style={{ color: GOLD, flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {/* Selected products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-1.5">
          {selectedProducts.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 px-3 py-2"
              style={{
                background:   'rgba(255,255,255,0.03)',
                border:       '1px solid rgba(255,255,255,0.06)',
                borderRadius: '2px',
              }}
            >
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="w-6 h-6 object-cover shrink-0" style={{ borderRadius: '2px' }} />
              )}
              <p className="flex-1 text-[0.52rem] tracking-[0.06em] truncate" style={{ color: 'rgba(255,255,255,0.62)' }}>
                {p.name}
              </p>
              <button
                type="button"
                onClick={() => removeProduct(p.id)}
                className="flex items-center justify-center w-5 h-5 shrink-0 transition-colors"
                style={{ color: 'rgba(255,255,255,0.22)', borderRadius: '2px' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.75)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.22)';
                }}
              >
                <X size={10} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
        {selected.length}/{MAX_RELATED} related products · Shown in "You May Also Like" on PDP
      </p>
    </div>
  );
}

// ── OrganizationSection ────────────────────────────────────────────────────────

type OrgFields = Pick<ProductDraft, 'tags' | 'collections' | 'relatedProductIds'>;

interface OrganizationSectionProps {
  value:    OrgFields;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function OrganizationSection({ value, onChange }: OrganizationSectionProps) {
  return (
    <SectionCard title="Organization">

      {/* Tags */}
      <div>
        <FieldLabel>Tags</FieldLabel>
        <TagInput
          tags={value.tags}
          placeholder="e.g., gift-set, limited-edition…"
          onChange={tags => onChange({ tags })}
        />
        <p className="mt-1.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Used for internal filtering and search
        </p>
      </div>

      {/* Collections */}
      <div>
        <FieldLabel>Collections</FieldLabel>
        <CollectionsSelect
          values={value.collections}
          onChange={collections => onChange({ collections })}
        />
      </div>

      {/* Related Products */}
      <div>
        <FieldLabel>Related Products</FieldLabel>
        <RelatedProductsSearch
          selected={value.relatedProductIds}
          onChange={relatedProductIds => onChange({ relatedProductIds })}
        />
      </div>

    </SectionCard>
  );
}
