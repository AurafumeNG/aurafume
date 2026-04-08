'use client';

import { Heart } from 'lucide-react';
import { GOLD_BG, TEXT, SectionCard, SectionHeading } from '../shared';
import type { MarketingData } from '@/types/analytics-marketing';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Props { data: MarketingData | null }

export default function WishlistFunnel({ data: _ }: Props) {
  return (
    <SectionCard>
      <SectionHeading title="Wishlist Conversion" />
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: GOLD_BG(0.08) }}>
          <Heart size={18} strokeWidth={1.5} style={{ color: TEXT.muted }} />
        </div>
        <div className="text-center max-w-xs">
          <p className="text-[0.56rem] font-medium mb-1" style={{ color: TEXT.secondary }}>
            Wishlist Tracking Not Available
          </p>
          <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.muted }}>
            The current data model does not include a wishlist collection. Add a Wishlist model
            storing product saves per user to enable funnel and conversion analytics here.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
