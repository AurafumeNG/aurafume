'use client';

import { useMemo } from 'react';
import type { PromoDraft } from './types';
import { SectionCard, FieldLabel, ToggleRow, FormToggle, HelperText } from './shared';

// ── Date/time input style ──────────────────────────────────────────────────────

const dtStyle: React.CSSProperties = {
  background:  '#1A1A1A',
  border:      '1px solid rgba(255,255,255,0.07)',
  color:       'rgba(255,255,255,0.72)',
  outline:     'none',
  colorScheme: 'dark',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ValidityPeriodSection({
  value,
  onChange,
}: {
  value:    PromoDraft;
  onChange: (p: Partial<PromoDraft>) => void;
}) {
  const expiryDays = useMemo(() => daysUntil(value.expiresAt), [value.expiresAt]);

  // Determine scheduled status based on start date
  const isScheduled = useMemo(() => {
    if (!value.validFrom) return false;
    const start = new Date(`${value.validFrom}T${value.validFromTime || '00:00'}`);
    return start > new Date();
  }, [value.validFrom, value.validFromTime]);

  return (
    <SectionCard title="Validity Period">

      {/* Start Date & Time */}
      <div>
        <FieldLabel required>Start Date & Time</FieldLabel>
        <div className="flex items-stretch gap-2">
          <input
            type="date"
            value={value.validFrom}
            onChange={(e) => onChange({ validFrom: e.target.value })}
            className="h-9 px-3 text-[0.54rem] tracking-[0.04em] flex-1"
            style={dtStyle}
          />
          <input
            type="time"
            value={value.validFromTime}
            onChange={(e) => onChange({ validFromTime: e.target.value })}
            className="h-9 px-3 text-[0.54rem] tracking-[0.04em] w-28"
            style={dtStyle}
          />
        </div>
        {isScheduled
          ? <HelperText color="gold">Code will be scheduled — activates on {value.validFrom} at {value.validFromTime}</HelperText>
          : <HelperText>Code is immediately active</HelperText>
        }
      </div>

      {/* End Date & Time */}
      <ToggleRow
        enabled={value.hasExpiry}
        onToggle={() => onChange({ hasExpiry: !value.hasExpiry, expiresAt: !value.hasExpiry ? '' : value.expiresAt })}
        label="Set expiry date"
        sublabel={value.hasExpiry ? undefined : 'No expiry — code is valid indefinitely'}
      >
        <div>
          <FieldLabel>Expiry Date & Time</FieldLabel>
          <div className="flex items-stretch gap-2">
            <input
              type="date"
              value={value.expiresAt}
              onChange={(e) => onChange({ expiresAt: e.target.value })}
              min={value.validFrom}
              className="h-9 px-3 text-[0.54rem] tracking-[0.04em] flex-1"
              style={dtStyle}
            />
            <input
              type="time"
              value={value.expiresAtTime}
              onChange={(e) => onChange({ expiresAtTime: e.target.value })}
              className="h-9 px-3 text-[0.54rem] tracking-[0.04em] w-28"
              style={dtStyle}
            />
          </div>
          {value.expiresAt && expiryDays !== null && (
            expiryDays < 0
              ? <HelperText color="red">This date is in the past — code will be expired immediately</HelperText>
              : expiryDays <= 7
              ? <HelperText color="red">Code expires in {expiryDays} day{expiryDays !== 1 ? 's' : ''}</HelperText>
              : expiryDays <= 30
              ? <HelperText color="gold">Code expires in {expiryDays} days</HelperText>
              : <HelperText>Code expires in {expiryDays} days</HelperText>
          )}
        </div>
      </ToggleRow>

      {/* Auto-disable on expiry */}
      <div className="flex items-center gap-3">
        <FormToggle
          enabled={value.autoDisableOnExpiry}
          onToggle={() => onChange({ autoDisableOnExpiry: !value.autoDisableOnExpiry })}
          disabled={!value.hasExpiry}
        />
        <div>
          <p className="text-[0.54rem] tracking-[0.06em] font-medium" style={{ color: value.hasExpiry ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.25)' }}>
            Automatically disable when expired
          </p>
          <p className="mt-0.5 text-[0.44rem] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            {value.hasExpiry ? 'Code will be disabled at expiry time' : 'Requires an expiry date to be set'}
          </p>
        </div>
      </div>

    </SectionCard>
  );
}
