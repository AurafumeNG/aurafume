'use client';

import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { RevenueData, ForecastPoint } from '@/types/analytics-revenue';

interface TooltipPayload { dataKey: string; value: number }

function ForecastTooltip({ active, payload, label }: {
  active?: boolean; payload?: TooltipPayload[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  const actual   = payload.find((p) => p.dataKey === 'actual');
  const forecast = payload.find((p) => p.dataKey === 'forecast');
  const upper    = payload.find((p) => p.dataKey === 'upper');
  const lower    = payload.find((p) => p.dataKey === 'lower');
  return (
    <div className="p-3 min-w-40"
      style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-2" style={{ color: TEXT.muted }}>{label}</p>
      {actual?.value != null && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
            <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>Actual</span>
          </div>
          <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
            {fmtNaira(actual.value, true)}
          </span>
        </div>
      )}
      {forecast?.value != null && (
        <>
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD_BG(0.60) }} />
              <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>Forecast</span>
            </div>
            <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
              {fmtNaira(forecast.value, true)}
            </span>
          </div>
          {upper && lower && (
            <p className="text-[0.44rem] mt-0.5" style={{ color: TEXT.muted }}>
              Range: {fmtNaira(lower.value, true)} – {fmtNaira(upper.value, true)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

interface Props { data: RevenueData | null }

export default function RevenueForecast({ data }: Props) {
  const forecastData: ForecastPoint[] = data?.forecastData ?? [];
  const fkpis = data?.forecastKpis;

  return (
    <SectionCard>
      <SectionHeading title="Revenue Forecast" />

      {/* Projected KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Projected Revenue (Next 2 months)', value: fkpis ? fmtNaira(fkpis.projectedRevenue) : '—', sub: 'Midpoint estimate'          },
          { label: 'Projected Orders',                  value: fkpis ? String(fkpis.projectedOrders)    : '—', sub: 'Based on current trend'      },
          { label: 'Based on Growth Trend',             value: fkpis ? `${fkpis.growthPct > 0 ? '+' : ''}${fkpis.growthPct}%` : '—', sub: 'Period-over-period growth' },
        ].map((item) => (
          <div key={item.label} className="p-4"
            style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
            <p className="text-[0.44rem] tracking-[0.12em] uppercase leading-tight" style={{ color: TEXT.muted }}>
              {item.label}
            </p>
            <p className="mt-2 text-[0.90rem] font-semibold" style={{ color: GOLD }}>{item.value}</p>
            <p className="mt-0.5 text-[0.42rem]" style={{ color: TEXT.secondary }}>{item.sub}</p>
          </div>
        ))}
      </div>

      {forecastData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>Not enough historical data to generate a forecast</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={GOLD} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false} tickLine={false} width={58}
                tickFormatter={(v) => fmtNaira(v as number, true)} />
              <Tooltip content={<ForecastTooltip />} cursor={{ stroke: GOLD_BG(0.25), strokeWidth: 1 }} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" activeDot={false} connectNulls />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#0F0F0F"        activeDot={false} connectNulls />
              <Line type="monotone" dataKey="forecast" stroke={GOLD_BG(0.70)} strokeWidth={2}
                strokeDasharray="5 4" dot={{ fill: GOLD, r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
              <Line type="monotone" dataKey="actual" stroke={GOLD} strokeWidth={2}
                dot={false} activeDot={{ r: 3, fill: GOLD }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-5">
        {[
          { label: 'Actual revenue',    color: GOLD,          dash: false, area: false },
          { label: 'Projected revenue', color: GOLD_BG(0.70), dash: true,  area: false },
          { label: 'Confidence band',   color: GOLD_BG(0.30), dash: false, area: true  },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.area ? (
              <div className="w-4 h-3 rounded-sm" style={{ background: item.color as string }} />
            ) : (
              <svg width="20" height="10">
                <line x1="0" y1="5" x2="20" y2="5" stroke={item.color as string}
                  strokeWidth={item.dash ? 1.5 : 2} strokeDasharray={item.dash ? '5 4' : undefined} />
              </svg>
            )}
            <span className="text-[0.46rem] tracking-[0.06em]" style={{ color: TEXT.secondary }}>{item.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[0.44rem] tracking-[0.04em] italic" style={{ color: TEXT.muted }}>
        Forecast based on linear regression of historical monthly revenue. Actual results may vary.
      </p>
    </SectionCard>
  );
}
