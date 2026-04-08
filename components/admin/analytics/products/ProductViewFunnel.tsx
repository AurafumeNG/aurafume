'use client';

import { EyeOff } from 'lucide-react';
import { GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading } from '../shared';
import type { ProductsData } from '@/types/analytics-products';

interface Props { data: ProductsData | null }

export default function ProductViewFunnel({ data: _ }: Props) {
  return (
    <SectionCard>
      <SectionHeading title="Product Conversion Funnel" />

      <div className="py-12 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER.default}` }}>
          <EyeOff size={20} strokeWidth={1.4} style={{ color: TEXT.muted }} />
        </div>
        <div className="text-center max-w-xs">
          <p className="text-[0.56rem] font-semibold mb-1" style={{ color: TEXT.secondary }}>
            Analytics tracking not available
          </p>
          <p className="text-[0.48rem] leading-relaxed" style={{ color: TEXT.muted }}>
            Product view, add-to-cart, and checkout events are not currently tracked.
            Integrate a client-side analytics SDK to enable funnel reporting.
          </p>
        </div>
        <div className="mt-2 p-3 w-full max-w-sm"
          style={{ background: GOLD_BG(0.04), border: `1px solid ${GOLD_BG(0.14)}` }}>
          <p className="text-[0.46rem] tracking-[0.04em] text-center" style={{ color: TEXT.muted }}>
            Suggestion: instrument <code className="font-mono" style={{ color: TEXT.secondary }}>page_view</code>,{' '}
            <code className="font-mono" style={{ color: TEXT.secondary }}>add_to_cart</code>, and{' '}
            <code className="font-mono" style={{ color: TEXT.secondary }}>begin_checkout</code> events
            to populate this chart.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
