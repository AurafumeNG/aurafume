'use client';

import type { PromoDraft } from './types';
import { SectionCard, FieldLabel, ToggleRow, InlineInput, HelperText, inputBase, focusBorder, blurBorder } from './shared';

export default function NotificationsSection({
  value,
  onChange,
}: {
  value:    PromoDraft;
  onChange: (p: Partial<PromoDraft>) => void;
}) {
  return (
    <SectionCard title="Alerts & Notifications">

      {/* Usage Threshold Alert */}
      <ToggleRow
        enabled={value.hasUsageAlert}
        onToggle={() => onChange({ hasUsageAlert: !value.hasUsageAlert })}
        label="Alert me when usage reaches a threshold"
        sublabel={value.hasUsageAlert ? undefined : 'No usage alerts configured'}
        disabled={!value.hasMaxUses}
      >
        <div>
          <FieldLabel>Alert Threshold</FieldLabel>
          <InlineInput
            type="number"
            value={value.usageAlertPct}
            onChange={(v) => onChange({ usageAlertPct: Math.max(1, Math.min(100, Number(v))) })}
            suffix="% of total uses"
            min={1}
            max={100}
            style={{ width: '200px' }}
          />
          {value.hasMaxUses && (
            <HelperText>
              Alert when {value.usageAlertPct}% of {value.maxUses} uses are consumed
              ({Math.floor((value.usageAlertPct / 100) * value.maxUses)} uses)
            </HelperText>
          )}
          {!value.hasMaxUses && (
            <HelperText color="red">Requires "Limit total uses" to be enabled</HelperText>
          )}
        </div>
      </ToggleRow>

      {/* Expiry Alert */}
      <ToggleRow
        enabled={value.hasExpiryAlert}
        onToggle={() => onChange({ hasExpiryAlert: !value.hasExpiryAlert })}
        label="Alert me before code expires"
        sublabel={value.hasExpiryAlert ? undefined : 'No expiry alerts configured'}
        disabled={!value.hasExpiry}
      >
        <div>
          <FieldLabel>Days Before Expiry</FieldLabel>
          <InlineInput
            type="number"
            value={value.expiryAlertDays}
            onChange={(v) => onChange({ expiryAlertDays: Math.max(1, Number(v)) })}
            suffix="days before expiry"
            min={1}
            style={{ width: '200px' }}
          />
          {!value.hasExpiry && (
            <HelperText color="red">Requires an expiry date to be set</HelperText>
          )}
        </div>
      </ToggleRow>

      {/* Alert recipients */}
      {(value.hasUsageAlert || value.hasExpiryAlert) && (
        <div>
          <FieldLabel>Alert Recipients</FieldLabel>
          <input
            type="text"
            value={value.alertEmails}
            onChange={(e) => onChange({ alertEmails: e.target.value })}
            placeholder="admin@example.com, ops@example.com"
            className="h-9 px-3 text-[0.54rem] tracking-[0.04em]"
            style={{ ...inputBase }}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
          <HelperText>Comma-separated email addresses</HelperText>
        </div>
      )}

    </SectionCard>
  );
}
