'use client';

import { Mail } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { CustomersData } from '@/types/analytics-customers';

interface Props { data: CustomersData | null }

export default function CustomerSegmentation({ data }: Props) {
  const rfmSegments = data?.rfmSegments ?? [];
  const totalRevenue  = rfmSegments.reduce((s, r) => s + r.revenue, 0);
  const totalCustomers = rfmSegments.reduce((s, r) => s + r.count, 0);

  const champions = rfmSegments.find((s) => s.segment === 'Champions');
  const loyal     = rfmSegments.find((s) => s.segment === 'Loyal Customers');
  const topTwo    = (champions?.count ?? 0) + (loyal?.count ?? 0);
  const topTwoPct = totalCustomers > 0 ? Math.round((topTwo / totalCustomers) * 100) : 0;
  const topTwoRev = ((champions?.revenue ?? 0) + (loyal?.revenue ?? 0));
  const topTwoRevPct = totalRevenue > 0 ? Math.round((topTwoRev / totalRevenue) * 100) : 0;

  return (
    <SectionCard>
      <SectionHeading title="Customer Segmentation (RFM)" />

      <p className="text-[0.48rem] leading-relaxed mb-5" style={{ color: TEXT.secondary }}>
        Customers grouped by Recency, Frequency, and Monetary value. Segments guide targeted marketing efforts.
      </p>

      {rfmSegments.length === 0 ? (
        <p className="py-8 text-center text-[0.50rem]" style={{ color: TEXT.muted }}>No data</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {rfmSegments.map((seg) => (
              <div key={seg.segment} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm"
                style={{ background: seg.bg, border: `1px solid ${seg.color}30` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color }} />
                <span className="text-[0.46rem] font-medium" style={{ color: seg.color }}>{seg.segment}</span>
                <span className="text-[0.44rem]" style={{ color: TEXT.muted }}>({seg.count})</span>
              </div>
            ))}
          </div>

          <div style={{ border: `1px solid ${BORDER.default}` }}>
            <div className="grid px-4 py-2.5"
              style={{
                gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr auto',
                borderBottom: `1px solid ${BORDER.default}`,
                background: 'rgba(255,255,255,0.02)',
              }}>
              {['Segment', 'Customers', 'Revenue', '% Customers', '% Revenue', ''].map((h) => (
                <span key={h} className="text-[0.42rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{h}</span>
              ))}
            </div>

            {rfmSegments.map((seg, i) => {
              const custPct = Math.round((seg.count / Math.max(totalCustomers, 1)) * 100);
              const revPct  = Math.round((seg.revenue / Math.max(totalRevenue, 1)) * 100);
              return (
                <div key={seg.segment}
                  className="grid px-4 py-3 items-center"
                  style={{
                    gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr auto',
                    borderBottom: i < rfmSegments.length - 1 ? `1px solid ${BORDER.default}` : 'none',
                  }}>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                      <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>{seg.segment}</span>
                    </div>
                    <p className="text-[0.42rem] pl-3.5" style={{ color: TEXT.muted }}>{seg.desc}</p>
                  </div>
                  <span className="text-[0.50rem] font-medium" style={{ color: TEXT.secondary }}>
                    {seg.count.toLocaleString()}
                  </span>
                  <span className="text-[0.50rem] font-medium" style={{ color: TEXT.secondary }}>
                    {seg.revenue > 0 ? fmtNaira(seg.revenue, true) : '—'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${custPct}%`, background: seg.color }} />
                    </div>
                    <span className="text-[0.44rem] w-6 text-right" style={{ color: TEXT.muted }}>{custPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${revPct}%`, background: GOLD_BG(0.65) }} />
                    </div>
                    <span className="text-[0.44rem] w-6 text-right" style={{ color: TEXT.muted }}>{revPct}%</span>
                  </div>
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded-sm text-[0.42rem] tracking-[0.08em] uppercase transition-colors"
                    style={{ border: `1px solid ${BORDER.default}`, color: TEXT.secondary }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER.hover; e.currentTarget.style.color = TEXT.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER.default; e.currentTarget.style.color = TEXT.secondary; }}
                  >
                    <Mail size={9} strokeWidth={1.8} />
                    Email
                  </button>
                </div>
              );
            })}
          </div>

          {topTwoPct > 0 && (
            <div className="mt-4 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
              <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>Champions + Loyal</span> make up only{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{topTwoPct}%</span> of customers but contribute{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{topTwoRevPct}%</span> of total revenue.
                Prioritise retention for these segments.
              </p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
