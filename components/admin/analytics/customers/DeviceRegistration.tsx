'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading } from '../shared';
import type { CustomersData, DonutSlice } from '@/types/analytics-customers';

interface TooltipEntry { name: string; value: number }

function DonutTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] font-semibold" style={{ color: TEXT.primary }}>
        {payload[0].name}: {payload[0].value}%
      </p>
    </div>
  );
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.44rem] mb-0.5" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>+{payload[0].value} signups</p>
    </div>
  );
}

function DonutCard({ title, data }: { title: string; data: DonutSlice[] }) {
  const top = data[0];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.46rem] tracking-[0.10em] uppercase" style={{ color: TEXT.secondary }}>{title}</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
              dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {top && (
        <div className="-mt-2 flex flex-col items-center">
          <p className="text-[0.38rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>Top</p>
          <p className="text-[0.60rem] font-semibold" style={{ color: top.color }}>{top.value}%</p>
          <p className="text-[0.40rem]" style={{ color: TEXT.muted }}>{top.name}</p>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>{entry.name}</span>
            </div>
            <span className="text-[0.48rem] font-semibold" style={{ color: TEXT.primary }}>{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props { data: CustomersData | null }

export default function DeviceRegistration({ data }: Props) {
  const regSource   = data?.regSource    ?? [];
  const verifyStatus= data?.verifyStatus ?? [];
  const signupTrend = data?.signupTrend  ?? [];
  const stats       = data?.signupStats;

  const verifiedPct = verifyStatus.find((s) => s.name === 'Verified')?.value ?? 0;
  const unverified  = stats?.unverified ?? 0;

  return (
    <SectionCard>
      <SectionHeading title="Device & Registration Analysis" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6">
          {regSource.length > 0 && <DonutCard title="Registration Source" data={regSource} />}
          {verifyStatus.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER.default}` }} className="pt-5">
              <DonutCard title="Verification Status" data={verifyStatus} />
            </div>
          )}
        </div>

        <div className="xl:col-span-2">
          <p className="text-[0.46rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Signup Trend (Period)
          </p>
          {signupTrend.length === 0 ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No signup data in this period</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: TEXT.muted, fontSize: 7, fontFamily: 'inherit' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<TrendTooltip />} cursor={{ stroke: GOLD_BG(0.25), strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="signups" stroke={GOLD} strokeWidth={1.5} fill="url(#signupGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${BORDER.default}` }}>
            {[
              { label: 'Avg daily signups', value: stats ? String(stats.avgDaily) : '—' },
              { label: 'Peak day signups',  value: stats ? String(stats.peakDay)  : '—' },
              { label: 'Unverified emails', value: stats ? String(stats.unverified): '—' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[0.44rem] tracking-[0.12em] uppercase" style={{ color: TEXT.muted }}>{item.label}</p>
                <p className="mt-0.5 text-[0.62rem] font-semibold" style={{ color: TEXT.primary }}>{item.value}</p>
              </div>
            ))}
          </div>

          {verifiedPct > 0 && unverified > 0 && (
            <div className="mt-4 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
              <p className="text-[0.46rem] leading-relaxed" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>{verifiedPct}% email verification</span> rate indicates
                strong list hygiene. The remaining{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{unverified} unverified account{unverified !== 1 ? 's' : ''}</span>{' '}
                represent a retention win via re-engagement emails.
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
