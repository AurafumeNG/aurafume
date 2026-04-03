'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ProductDraft, ProductVariant } from './types';

// ── Constants ──────────────────────────────────────────────────────────────────

const GOLD = 'oklch(0.53 0.09 70)';

// ── Helpers ────────────────────────────────────────────────────────────────────

function newVariant(productName: string, index: number): ProductVariant {
  const prefix = productName
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3) || 'PRD';
  return {
    id:                crypto.randomUUID(),
    size:              '',
    sku:               `${prefix}-${String(index + 1).padStart(3, '0')}`,
    price:             '',
    compareAtPrice:    '',
    costPrice:         '',
    stock:             '',
    lowStockThreshold: '5',
    barcode:           '',
  };
}

function autoSKU(productName: string, size: string, index: number): string {
  const prefix = productName
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3) || 'PRD';
  const sizePart = size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5) || String(index + 1).padStart(3, '0');
  return `${prefix}-${sizePart}`;
}

function calcMargin(price: string, costPrice: string): string {
  const p = parseFloat(price);
  const c = parseFloat(costPrice);
  if (!p || !c || p <= 0) return '—';
  if (c >= p) return <span style={{ color: 'rgba(239,68,68,0.80)' }}>Negative</span> as unknown as string;
  return `${(((p - c) / p) * 100).toFixed(1)}%`;
}

function formatNaira(val: string): string {
  const n = parseFloat(val.replace(/,/g, ''));
  if (isNaN(n)) return '';
  return n.toLocaleString('en-NG');
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-[0.60rem] tracking-[0.18em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[0.44rem] tracking-[0.12em] uppercase font-medium mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
      {children}
    </label>
  );
}

function VInput({
  value, placeholder, type = 'text', readOnly, onChange, highlight,
}: {
  value:       string;
  placeholder: string;
  type?:       string;
  readOnly?:   boolean;
  onChange?:   (v: string) => void;
  highlight?:  boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={e => onChange?.(e.target.value)}
      className="h-8 px-2.5 w-full text-[0.54rem] tracking-[0.04em] outline-none transition-colors duration-150"
      style={{
        background:  readOnly ? 'rgba(255,255,255,0.03)' : '#1A1A1A',
        border:      highlight ? `1px solid ${GOLD}30` : '1px solid rgba(255,255,255,0.06)',
        color:       readOnly ? 'rgba(255,255,255,0.40)' : highlight ? GOLD : 'rgba(255,255,255,0.78)',
        cursor:      readOnly ? 'default' : 'text',
        borderRadius: '2px',
      }}
      onFocus={e  => { if (!readOnly) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
      onBlur={e   => { if (!readOnly) e.currentTarget.style.borderColor = highlight ? `${GOLD}30` : 'rgba(255,255,255,0.06)'; }}
    />
  );
}

// ── Variant Row ────────────────────────────────────────────────────────────────

function VariantRow({
  variant,
  index,
  productName,
  isDragging,
  isOver,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  variant:     ProductVariant;
  index:       number;
  productName: string;
  isDragging:  boolean;
  isOver:      boolean;
  onChange:    (patch: Partial<ProductVariant>) => void;
  onDelete:    () => void;
  onDragStart: () => void;
  onDragOver:  (e: React.DragEvent) => void;
  onDrop:      () => void;
}) {
  const margin = calcMargin(variant.price, variant.costPrice);

  function handleSizeChange(size: string) {
    onChange({
      size,
      sku: autoSKU(productName, size, index),
    });
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="relative p-4 space-y-3"
      style={{
        background:   '#1A1A1A',
        border:       isOver ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '3px',
        opacity:      isDragging ? 0.45 : 1,
        transition:   'border-color 0.10s, opacity 0.15s',
      }}
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            style={{ color: 'rgba(255,255,255,0.25)', cursor: 'grab' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.55)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.25)'; }}
          >
            <GripVertical size={13} strokeWidth={1.8} />
          </div>
          <span className="text-[0.48rem] tracking-[0.14em] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Variant {index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center w-6 h-6 transition-colors duration-150"
          style={{ color: 'rgba(239,68,68,0.50)', borderRadius: '2px' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.85)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.50)';
          }}
        >
          <Trash2 size={12} strokeWidth={1.8} />
        </button>
      </div>

      {/* Row 1: Size + SKU */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Size <span style={{ color: GOLD }}>*</span></FieldLabel>
          <VInput
            value={variant.size}
            placeholder="e.g., 50ml"
            onChange={handleSizeChange}
          />
        </div>
        <div>
          <FieldLabel>SKU</FieldLabel>
          <VInput
            value={variant.sku}
            placeholder="Auto-generated"
            onChange={sku => onChange({ sku })}
          />
        </div>
      </div>

      {/* Row 2: Price + Compare-at + Cost */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <FieldLabel>Price (₦) <span style={{ color: GOLD }}>*</span></FieldLabel>
          <VInput
            value={variant.price}
            placeholder="0"
            type="number"
            onChange={price => onChange({ price })}
          />
        </div>
        <div>
          <FieldLabel>Compare-at (₦)</FieldLabel>
          <VInput
            value={variant.compareAtPrice}
            placeholder="0"
            type="number"
            onChange={compareAtPrice => onChange({ compareAtPrice })}
          />
        </div>
        <div>
          <FieldLabel>Cost Price (₦)</FieldLabel>
          <VInput
            value={variant.costPrice}
            placeholder="0"
            type="number"
            onChange={costPrice => onChange({ costPrice })}
          />
        </div>
      </div>

      {/* Row 3: Profit margin + Stock + Threshold */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <FieldLabel>Profit Margin</FieldLabel>
          <div
            className="flex items-center h-8 px-2.5 text-[0.54rem] tracking-[0.04em]"
            style={{
              background:   'rgba(255,255,255,0.02)',
              border:       '1px solid rgba(255,255,255,0.05)',
              color:        margin === '—' ? 'rgba(255,255,255,0.25)' : 'rgba(74,222,128,0.82)',
              borderRadius: '2px',
            }}
          >
            {margin}
          </div>
        </div>
        <div>
          <FieldLabel>Stock Qty</FieldLabel>
          <VInput
            value={variant.stock}
            placeholder="0"
            type="number"
            onChange={stock => onChange({ stock })}
          />
        </div>
        <div>
          <FieldLabel>Low-stock Alert</FieldLabel>
          <VInput
            value={variant.lowStockThreshold}
            placeholder="5"
            type="number"
            onChange={lowStockThreshold => onChange({ lowStockThreshold })}
          />
        </div>
      </div>

      {/* Row 4: Barcode */}
      <div className="max-w-[50%]">
        <FieldLabel>Barcode (optional)</FieldLabel>
        <VInput
          value={variant.barcode}
          placeholder="UPC / EAN / ISBN"
          onChange={barcode => onChange({ barcode })}
        />
      </div>

    </div>
  );
}

// ── VariantsPricingSection ─────────────────────────────────────────────────────

type VariantFields = Pick<ProductDraft, 'variants' | 'name'>;

interface VariantsPricingProps {
  value:    VariantFields;
  onChange: (patch: Partial<ProductDraft>) => void;
}

export default function VariantsPricingSection({ value, onChange }: VariantsPricingProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const { variants, name } = value;

  function setVariants(v: ProductVariant[]) {
    onChange({ variants: v });
  }

  function addVariant() {
    setVariants([...variants, newVariant(name, variants.length)]);
  }

  function updateVariant(id: string, patch: Partial<ProductVariant>) {
    setVariants(variants.map(v => v.id === id ? { ...v, ...patch } : v));
  }

  function deleteVariant(id: string) {
    setVariants(variants.filter(v => v.id !== id));
  }

  function handleDrop(dropIdx: number) {
    if (dragIdx === null || dragIdx === dropIdx) return;
    const next = [...variants];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    setVariants(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <SectionCard title="Variants & Pricing">

      <div className="space-y-3">

        {/* Variant rows */}
        {variants.length === 0 && (
          <div
            className="flex items-center justify-center py-8 text-center"
            style={{
              border:       '1px dashed rgba(255,255,255,0.08)',
              borderRadius: '3px',
            }}
          >
            <div className="space-y-1">
              <p className="text-[0.54rem] tracking-[0.10em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                No variants yet
              </p>
              <p className="text-[0.46rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.16)' }}>
                At least one variant is required to publish
              </p>
            </div>
          </div>
        )}

        {variants.map((v, idx) => (
          <VariantRow
            key={v.id}
            variant={v}
            index={idx}
            productName={name}
            isDragging={dragIdx === idx}
            isOver={overIdx === idx}
            onChange={patch => updateVariant(v.id, patch)}
            onDelete={() => deleteVariant(v.id)}
            onDragStart={() => setDragIdx(idx)}
            onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
            onDrop={() => handleDrop(idx)}
          />
        ))}

        {/* Add variant button */}
        <button
          type="button"
          onClick={addVariant}
          className="w-full flex items-center justify-center gap-2 h-9 text-[0.52rem] tracking-[0.12em] uppercase font-medium transition-colors duration-150"
          style={{
            border:       `1px dashed rgba(180,130,60,0.22)`,
            color:        'rgba(180,130,60,0.55)',
            borderRadius: '3px',
            background:   'transparent',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(180,130,60,0.05)';
            (e.currentTarget as HTMLButtonElement).style.color = GOLD;
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(180,130,60,0.40)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(180,130,60,0.55)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(180,130,60,0.22)';
          }}
        >
          <Plus size={13} strokeWidth={2} />
          Add Variant
        </button>

        {/* Note */}
        <p className="text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Drag rows to reorder · Compare-at price shows as strikethrough on storefront · Cost price is internal only
        </p>

      </div>
    </SectionCard>
  );
}
