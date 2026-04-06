'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { PromoDraft } from './types';
import {
  GOLD,
  inputBase,
  focusBorder,
  blurBorder,
  SectionCard,
  FieldLabel,
  CharCount,
  HelperText,
} from './shared';

// ── Random code generator ──────────────────────────────────────────────────────

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  const rand = (n: number) =>
    Array.from(
      { length: n },
      () => CHARS[Math.floor(Math.random() * CHARS.length)],
    ).join('');
  return `${rand(4)}-${rand(5)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BasicInfoSection({
  value,
  onChange,
  isEdit,
}: {
  value: PromoDraft;
  onChange: (p: Partial<PromoDraft>) => void;
  isEdit?: boolean;
}) {
  const [codeStatus, setCodeStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check code availability with debounce
  useEffect(() => {
    if (!value.code || isEdit) {
      setCodeStatus('idle');
      return;
    }
    setCodeStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/promos/check-code?code=${encodeURIComponent(value.code)}`,
        );
        if (!res.ok) {
          setCodeStatus('idle');
          return;
        }
        const json = (await res.json()) as { data?: { available?: boolean } };
        setCodeStatus(json.data?.available ? 'available' : 'taken');
      } catch {
        setCodeStatus('idle');
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value.code, isEdit]);

  function handleCodeInput(raw: string) {
    const cleaned = raw.toUpperCase().replace(/\s/g, '').slice(0, 20);
    onChange({ code: cleaned });
  }

  function handleGenerate() {
    onChange({ code: generateCode() });
  }

  return (
    <SectionCard title="Basic Information">
      {/* Code */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <FieldLabel required>Code</FieldLabel>
          <CharCount current={value.code.length} max={20} />
        </div>

        <div className="flex items-stretch gap-2">
          {/* Input wrapper */}
          <div className="relative flex-1">
            <input
              type="text"
              value={value.code}
              onChange={(e) => handleCodeInput(e.target.value)}
              placeholder="e.g. WELCOME10"
              spellCheck={false}
              className="h-10 px-3 pr-9 text-[0.62rem] tracking-[0.18em] font-bold font-mono uppercase"
              style={{ ...inputBase }}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
            {/* Availability indicator */}
            {value.code && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {codeStatus === 'checking' && (
                  <Loader2
                    size={13}
                    strokeWidth={1.8}
                    className="animate-spin"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                  />
                )}
                {codeStatus === 'available' && (
                  <CheckCircle2
                    size={13}
                    strokeWidth={1.8}
                    style={{ color: 'rgba(74,222,128,0.80)' }}
                  />
                )}
                {codeStatus === 'taken' && (
                  <XCircle
                    size={13}
                    strokeWidth={1.8}
                    style={{ color: 'rgba(239,68,68,0.75)' }}
                  />
                )}
              </span>
            )}
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            title="Generate random code"
            className="flex items-center gap-1.5 h-10 px-3 text-[0.50rem] tracking-[0.10em] uppercase transition-colors duration-150 shrink-0"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.38)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = GOLD;
              e.currentTarget.style.border = '1px solid rgba(180,130,60,0.28)';
              e.currentTarget.style.background = 'rgba(180,130,60,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.38)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <RefreshCw size={11} strokeWidth={1.8} />
            Generate
          </button>
        </div>

        {/* Status messages */}
        {codeStatus === 'available' && (
          <HelperText color="green">Code is available</HelperText>
        )}
        {codeStatus === 'taken' && (
          <HelperText color="red">This code is already in use</HelperText>
        )}
        {codeStatus === 'idle' && value.code.length > 0 && (
          <HelperText>
            Uppercase only · No spaces · Max 20 characters
          </HelperText>
        )}
        {!value.code && (
          <HelperText>Uppercase letters and numbers only, no spaces</HelperText>
        )}
      </div>

      {/* Internal Description */}
      <div>
        <FieldLabel hint="Admin only">Internal Description</FieldLabel>
        <input
          type="text"
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What is this code for? (admins only see this)"
          className="h-9 px-3 text-[0.56rem] tracking-[0.04em]"
          style={{ ...inputBase }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
      </div>

      {/* Customer-Facing Label */}
      <div>
        <FieldLabel hint="Shown at checkout">Customer-Facing Label</FieldLabel>
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="e.g. Welcome Offer"
          className="h-9 px-3 text-[0.56rem] tracking-[0.04em]"
          style={{ ...inputBase }}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
        <HelperText>
          This label is shown to customers at checkout alongside the code.
        </HelperText>
      </div>
    </SectionCard>
  );
}
