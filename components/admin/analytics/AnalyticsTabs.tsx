'use client';

import Link from 'next/link';
import { GOLD, TEXT, BORDER } from './shared';

const TABS = [
  { label: 'Overview', href: '/admin/analytics' },
  { label: 'Revenue', href: '/admin/analytics/revenue' },
  { label: 'Products', href: '/admin/analytics/products' },
  { label: 'Customers', href: '/admin/analytics/customers' },
  { label: 'Marketing', href: '/admin/analytics/marketing' },
];

export default function AnalyticsTabs({ active = 'Overview' }: { active?: string }) {
  return (
    <div
      className="flex items-end gap-0 overflow-x-auto"
      style={{ borderBottom: `1px solid ${BORDER.default}` }}
    >
      {TABS.map((tab) => {
        const isActive = tab.label === active;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="relative flex items-center h-9 px-5 text-[0.52rem] tracking-[0.14em] uppercase whitespace-nowrap transition-colors duration-150 flex-shrink-0"
            style={{
              color: isActive ? GOLD : TEXT.secondary,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = TEXT.primary;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = TEXT.secondary;
            }}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: GOLD }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
