'use client';

// ── Design constants ────────────────────────────────────────────────────────────

export const GOLD = 'oklch(0.53 0.09 70)';
export const GOLD_MUTED = 'rgba(180,130,60,0.70)';
export const GOLD_BG = (a: number) => `rgba(180,130,60,${a})`;
export const CARD_BG = '#1A1A1A';
export const PAGE_BG = '#0F0F0F';

export const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.45)',
  muted: 'rgba(255,255,255,0.25)',
  faint: 'rgba(255,255,255,0.12)',
};

export const BORDER = {
  default: 'rgba(255,255,255,0.06)',
  hover: 'rgba(255,255,255,0.10)',
  gold: 'rgba(180,130,60,0.20)',
};

export const POSITIVE = '#4ade80';
export const NEGATIVE = '#f87171';
export const CHART_COLORS = {
  gold: GOLD,
  goldArea: 'rgba(180,130,60,0.15)',
  prev: 'rgba(255,255,255,0.25)',
  prevArea: 'rgba(255,255,255,0.05)',
  paystack: 'oklch(0.53 0.09 70)',
  bank: 'rgba(255,255,255,0.30)',
  express: 'oklch(0.55 0.09 74)',
  standard: 'rgba(180,130,60,0.55)',
  pickup: 'rgba(180,130,60,0.28)',
  pending: '#facc15',
  processing: '#60a5fa',
  shipped: '#a78bfa',
  delivered: '#4ade80',
  cancelled: '#f87171',
};

// ── Types ──────────────────────────────────────────────────────────────────────

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'last90'
  | 'thisYear'
  | 'allTime';

export type AnalyticsState = {
  preset: DatePreset;
  from: string;
  to: string;
  compare: boolean;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export function fmtNaira(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
    return `₦${n.toLocaleString('en-NG')}`;
  }
  return `₦${n.toLocaleString('en-NG')}`;
}

export function fmtPct(n: number, sign = true): string {
  return `${sign && n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

// ── Section card wrapper ───────────────────────────────────────────────────────

export function SectionCard({
  children,
  className = '',
  gold = false,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`p-5 md:p-6 ${className}`}
      style={{
        background: CARD_BG,
        border: `1px solid ${gold ? BORDER.gold : BORDER.default}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2
        className="text-[0.65rem] tracking-[0.20em] uppercase font-semibold"
        style={{ color: TEXT.primary }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}

// ── Toggle group ───────────────────────────────────────────────────────────────

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        border: `1px solid ${BORDER.default}`,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="h-7 px-3 text-[0.52rem] tracking-[0.10em] uppercase transition-colors duration-150"
            style={{
              color: active ? GOLD : TEXT.secondary,
              background: active ? GOLD_BG(0.08) : 'transparent',
              borderRight: `1px solid ${BORDER.default}`,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

