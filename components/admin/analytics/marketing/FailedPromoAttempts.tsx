'use client';

import { AlertCircle } from 'lucide-react';
import { GOLD_BG, TEXT, SectionCard, SectionHeading } from '../shared';
import type { MarketingData } from '@/types/analytics-marketing';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Props { data: MarketingData | null }

export default function FailedPromoAttempts({ data: _ }: Props) {
  return (
    <SectionCard>
      <SectionHeading title="Failed Code Applications" />
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: GOLD_BG(0.08) }}>
          <AlertCircle size={18} strokeWidth={1.5} style={{ color: TEXT.muted }} />
        </div>
        <div className="text-center max-w-xs">
          <p className="text-[0.56rem] font-medium mb-1" style={{ color: TEXT.secondary }}>
            No Failed Attempt Tracking
          </p>
          <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.muted }}>
            Failed promo code applications are not currently logged. Instrument checkout
            validation events to track failure reasons over time.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
