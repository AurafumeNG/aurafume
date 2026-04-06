'use client';

import type { PromoDraft } from './types';
import { SectionCard, ToggleRow } from './shared';

export default function StackabilitySection({
  value,
  onChange,
}: {
  value:    PromoDraft;
  onChange: (p: Partial<PromoDraft>) => void;
}) {
  return (
    <SectionCard title="Code Stacking">

      <ToggleRow
        enabled={value.combinableWithCodes}
        onToggle={() => onChange({ combinableWithCodes: !value.combinableWithCodes })}
        label="Allow this code to be used with other promo codes"
        sublabel={
          value.combinableWithCodes
            ? 'Customers can stack this code with other active codes'
            : 'Only one promo code can be applied per order (recommended)'
        }
      />

      <ToggleRow
        enabled={value.combinableWithSales}
        onToggle={() => onChange({ combinableWithSales: !value.combinableWithSales })}
        label="Allow on already-discounted items"
        sublabel={
          value.combinableWithSales
            ? 'Code applies even when items are on sale'
            : 'Code will not apply to items already on sale'
        }
      />

    </SectionCard>
  );
}
