'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { RevenueData, TimingPoint } from '@/types/analytics-revenue';

interface TooltipPayload { value: number }

function HourTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.08em] mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.56rem] font-semibold" style={{ color: GOLD }}>{fmtNaira(payload[0].value, true)}</p>
    </div>
  );
}

interface Props { data: RevenueData | null }

export default function RevenueTimingCharts({ data }: Props) {
  const byHour: TimingPoint[] = data?.revenueByHour ?? [];
  const byDow:  TimingPoint[] = data?.revenueByDow  ?? [];

  const peakHour = byHour.reduce<TimingPoint | null>((mx, d) => (!mx || d.revenue > mx.revenue ? d : mx), null);
  const peakDow  = byDow.reduce<TimingPoint  | null>((mx, d) => (!mx || d.revenue > mx.revenue ? d : mx), null);

  const totalHour = byHour.reduce((s, d) => s + d.revenue, 0);
  const totalDow  = byDow.reduce((s, d) => s + d.revenue, 0);

  const peakHourMax = peakHour?.revenue ?? 1;
  const peakDowMax  = peakDow?.revenue  ?? 1;

  // Evening hours 6PM–10PM = indices 18–22
  const eveningRevenue = byHour.slice(18, 23).reduce((s, d) => s + d.revenue, 0);
  const eveningPct     = totalHour > 0 ? Math.round((eveningRevenue / totalHour) * 100) : 0;

  // Fri + Sat weekend revenue
  const weekendRevenue = byDow.filter((d) => d.label === 'Fri' || d.label === 'Sat').reduce((s, d) => s + d.revenue, 0);
  const weekendPct     = totalDow > 0 ? Math.round((weekendRevenue / totalDow) * 100) : 0;

  return (
    <SectionCard>
      <SectionHeading title="Revenue Timing" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* By hour */}
        <div>
          <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Revenue by Hour of Day
          </p>
          {byHour.every((d) => d.revenue === 0) ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data for this period</p>
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byHour} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={10}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} width={44}
                      tickFormatter={(v) => fmtNaira(v as number, true)} />
                    <Tooltip content={<HourTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                      {byHour.map((entry) => {
                        const ratio = peakHourMax > 0 ? entry.revenue / peakHourMax : 0;
                        return <Cell key={entry.label} fill={GOLD_BG(0.15 + ratio * 0.75)} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
                <p className="text-[0.48rem]" style={{ color: TEXT.secondary }}>
                  {peakHour && (
                    <><span style={{ color: GOLD, fontWeight: 600 }}>Peak revenue hour: {peakHour.label}</span>
                    {' '}— {fmtNaira(peakHour.revenue, true)} generated.{' '}</>
                  )}
                  {eveningPct > 0 && `Evening hours (6PM–10PM) account for ${eveningPct}% of daily revenue.`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* By day of week */}
        <div>
          <p className="text-[0.50rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Revenue by Day of Week
          </p>
          {byDow.every((d) => d.revenue === 0) ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data for this period</p>
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDow} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={36}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: TEXT.muted, fontSize: 9, fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} width={52}
                      tickFormatter={(v) => fmtNaira(v as number, true)} />
                    <Tooltip content={<HourTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                      {byDow.map((entry) => {
                        const ratio = peakDowMax > 0 ? entry.revenue / peakDowMax : 0;
                        return <Cell key={entry.label} fill={GOLD_BG(0.15 + ratio * 0.75)} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
                <p className="text-[0.48rem]" style={{ color: TEXT.secondary }}>
                  {peakDow && (
                    <><span style={{ color: GOLD, fontWeight: 600 }}>Best revenue day: {peakDow.label}</span>
                    {' '}— {fmtNaira(peakDow.revenue, true)}.{' '}</>
                  )}
                  {weekendPct > 0 && `The weekend (Fri–Sat) drives ${weekendPct}% of weekly revenue.`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
