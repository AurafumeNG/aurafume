'use client';

import { TrendingUp, Package, Award, Tag, AlertTriangle, Users } from 'lucide-react';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading } from './shared';
import type { OverviewData, OverviewEvent } from '@/types/analytics-overview';

type EventType = OverviewEvent['type'];

const EVENT_ICON: Record<EventType, React.ElementType> = {
  revenue:   TrendingUp,
  milestone: Award,
  product:   Package,
  promo:     Tag,
  stock:     AlertTriangle,
  customer:  Users,
};

const EVENT_COLOR: Record<EventType, string> = {
  revenue:   GOLD,
  milestone: GOLD,
  product:   '#60a5fa',
  promo:     '#a78bfa',
  stock:     '#facc15',
  customer:  '#4ade80',
};

const EVENT_BG: Record<EventType, string> = {
  revenue:   GOLD_BG(0.12),
  milestone: GOLD_BG(0.10),
  product:   'rgba(96,165,250,0.12)',
  promo:     'rgba(167,139,250,0.12)',
  stock:     'rgba(250,204,21,0.12)',
  customer:  'rgba(74,222,128,0.12)',
};

interface Props { data: OverviewData | null }

export default function EventsFeed({ data }: Props) {
  const events = data?.events ?? [];

  return (
    <SectionCard>
      <SectionHeading title="Notable Events" />

      {events.length === 0 ? (
        <p className="text-[0.48rem] py-8 text-center" style={{ color: TEXT.muted }}>No notable events in this period</p>
      ) : (
        <div className="space-y-0">
          {events.map((event, i) => {
            const Icon = EVENT_ICON[event.type];
            const color = EVENT_COLOR[event.type];
            const bg = EVENT_BG[event.type];
            const isLast = i === events.length - 1;

            return (
              <div key={i} className="flex gap-3 relative">
                {!isLast && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-px" style={{ background: BORDER.default }} />
                )}
                <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5" style={{ background: bg }}>
                  <Icon size={12} strokeWidth={1.8} style={{ color }} />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>{event.title}</p>
                    <span className="text-[0.44rem] tracking-[0.06em]" style={{ color: TEXT.muted }}>{event.date}</span>
                  </div>
                  <p className="mt-0.5 text-[0.48rem] leading-relaxed" style={{ color: TEXT.secondary }}>{event.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
