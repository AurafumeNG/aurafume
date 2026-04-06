'use client';

import type { PromoDraft } from './types';
import { SectionCard, FieldLabel, ToggleRow, InlineInput, HelperText } from './shared';

export default function UsageLimitsSection({
  value,
  onChange,
  currentUsedCount,
}: {
  value:             PromoDraft;
  onChange:          (p: Partial<PromoDraft>) => void;
  currentUsedCount?: number;
}) {
  return (
    <SectionCard title="Usage Limits">

      {/* Total Usage Limit */}
      <ToggleRow
        enabled={value.hasMaxUses}
        onToggle={() => onChange({ hasMaxUses: !value.hasMaxUses })}
        label="Limit total number of uses"
        sublabel={value.hasMaxUses ? undefined : 'Unlimited uses — anyone can redeem this code'}
        disabled={value.singleUse}
      >
        <div>
          <FieldLabel>Maximum Uses</FieldLabel>
          <InlineInput
            type="number"
            value={value.maxUses}
            onChange={(v) => onChange({ maxUses: Math.max(1, Number(v)) })}
            suffix="uses total"
            min={1}
            style={{ width: '200px' }}
          />
          {currentUsedCount !== undefined && (
            <HelperText>
              {currentUsedCount} / {value.maxUses} used so far
            </HelperText>
          )}
        </div>
      </ToggleRow>

      {/* Per Customer Limit */}
      <ToggleRow
        enabled={value.hasPerCustomerLimit}
        onToggle={() => onChange({ hasPerCustomerLimit: !value.hasPerCustomerLimit })}
        label="Limit uses per customer"
        sublabel={value.hasPerCustomerLimit ? undefined : 'Each customer can use this code any number of times'}
        disabled={value.singleUse}
      >
        <div>
          <FieldLabel>Uses Per Customer</FieldLabel>
          <InlineInput
            type="number"
            value={value.perCustomerLimit}
            onChange={(v) => onChange({ perCustomerLimit: Math.max(1, Number(v)) })}
            suffix="use(s) per customer"
            min={1}
            style={{ width: '220px' }}
          />
        </div>
      </ToggleRow>

      {/* Single Use */}
      <ToggleRow
        enabled={value.singleUse}
        onToggle={() => onChange({
          singleUse:           !value.singleUse,
          hasMaxUses:          !value.singleUse ? false : value.hasMaxUses,
          hasPerCustomerLimit: !value.singleUse ? false : value.hasPerCustomerLimit,
        })}
        label="Single use code (expires after first use)"
        sublabel="Overrides all other usage limits — code can only be redeemed once in total"
      >
        <div className="px-3 py-2.5" style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(234,179,8,0.18)' }}>
          <p className="text-[0.48rem] tracking-[0.06em]" style={{ color: 'rgba(250,204,21,0.70)' }}>
            Single-use mode overrides "Limit total uses" and "Per customer limit" settings.
          </p>
        </div>
      </ToggleRow>

    </SectionCard>
  );
}
