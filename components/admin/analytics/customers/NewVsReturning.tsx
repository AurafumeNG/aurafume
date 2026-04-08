'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, fmtNaira,
} from '../shared';
import type { CustomersData } from '@/types/analytics-customers';

const NEW_COLOR = '#4ade80';
const RET_COLOR = GOLD;

interface TooltipEntry { dataKey: string; value: number }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 min-w-[150px]" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-2" style={{ color: TEXT.muted }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.dataKey.startsWith('new') ? NEW_COLOR : RET_COLOR }} />
            <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>
              {p.dataKey.startsWith('new') ? 'New' : 'Returning'}
            </span>
          </div>
          <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props { data: CustomersData | null }

export default function NewVsReturning({ data }: Props) {
  const nvrMonthly = data?.nvrMonthly ?? [];
  const m          = data?.nvrMetrics;

  const metricRows = m ? [
    { label: 'Orders',          newVal: String(m.new.orders),          retVal: String(m.ret.orders) },
    { label: 'Revenue',         newVal: fmtNaira(m.new.revenue, true), retVal: fmtNaira(m.ret.revenue, true) },
    { label: 'AOV',             newVal: fmtNaira(m.new.aov, true),     retVal: fmtNaira(m.ret.aov, true) },
    { label: 'Avg Items/Order', newVal: String(m.new.avgItems),         retVal: String(m.ret.avgItems) },
  ] : [];

  const retHigher = m && m.ret.avgItems > m.new.avgItems;
  const itemsDiff = m ? Math.round(((m.ret.avgItems - m.new.avgItems) / Math.max(m.new.avgItems, 1)) * 100) : 0;

  return (
    <SectionCard>
      <SectionHeading title="New vs Returning Customers" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Customers per Month
          </p>
          {nvrMonthly.length === 0 ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nvrMonthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 9, color: TEXT.secondary, paddingTop: 8 }}
                    formatter={(v) => v === 'newCustomers' ? 'New' : 'Returning'} />
                  <Bar dataKey="newCustomers" name="newCustomers" fill={NEW_COLOR} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="returning"    name="returning"    fill={RET_COLOR} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div>
          <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
            Current Period Metrics
          </p>
          {metricRows.length === 0 ? (
            <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No data</p>
          ) : (
            <div style={{ border: `1px solid ${BORDER.default}` }}>
              <div className="grid grid-cols-3 px-3 py-2"
                style={{ borderBottom: `1px solid ${BORDER.default}`, background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>Metric</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: NEW_COLOR }} />
                  <span className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>New</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: RET_COLOR }} />
                  <span className="text-[0.44rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>Return</span>
                </div>
              </div>
              {metricRows.map((row, i) => (
                <div key={row.label}
                  className="grid grid-cols-3 px-3 py-2.5"
                  style={{ borderBottom: i < metricRows.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>
                  <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>{row.label}</span>
                  <span className="text-[0.48rem] font-semibold" style={{ color: NEW_COLOR }}>{row.newVal}</span>
                  <span className="text-[0.48rem] font-semibold" style={{ color: RET_COLOR }}>{row.retVal}</span>
                </div>
              ))}
            </div>
          )}

          {retHigher && itemsDiff > 0 && (
            <div className="mt-3 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
              <p className="text-[0.46rem] tracking-[0.04em]" style={{ color: TEXT.secondary }}>
                Returning customers have a{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{itemsDiff}% higher avg items/order</span>{' '}
                than new customers — driving higher basket value per visit.
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
