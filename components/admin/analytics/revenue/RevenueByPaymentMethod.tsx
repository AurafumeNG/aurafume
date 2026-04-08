'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GOLD, GOLD_BG, TEXT, BORDER, SectionCard, SectionHeading, fmtNaira } from '../shared';
import type { RevenueData, PaymentMethodStat } from '@/types/analytics-revenue';

const PAYSTACK_COLOR = GOLD;
const BANK_COLOR     = 'rgba(255,255,255,0.28)';

const METHOD_COLOR: Record<string, string> = {
  'paystack':      PAYSTACK_COLOR,
  'bank-transfer': BANK_COLOR,
};
const METHOD_LABEL: Record<string, string> = {
  'paystack':      'Paystack',
  'bank-transfer': 'Bank Transfer',
};

interface TooltipEntry { dataKey: string; value: number; color: string }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-2" style={{ color: TEXT.muted }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>
              {p.dataKey === 'paystack' ? 'Paystack' : 'Bank Transfer'}
            </span>
          </div>
          <span className="text-[0.50rem] font-semibold" style={{ color: TEXT.primary }}>
            {fmtNaira(p.value, true)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props { data: RevenueData | null }

export default function RevenueByPaymentMethod({ data }: Props) {
  const stats: PaymentMethodStat[] = data?.paymentStats ?? [];
  const monthly = data?.paymentMonthly ?? [];

  return (
    <SectionCard>
      <SectionHeading title="Revenue by Payment Method" />

      {stats.length === 0 ? (
        <p className="text-[0.48rem] py-8 text-center" style={{ color: TEXT.muted }}>No payment data for this period</p>
      ) : (
        <>
          {/* Stats comparison cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {stats.map((method) => {
              const color  = METHOD_COLOR[method.method] ?? TEXT.primary;
              const label  = METHOD_LABEL[method.method] ?? method.method;
              const isPay  = method.method === 'paystack';
              return (
                <div key={method.method} className="p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${isPay ? GOLD_BG(0.20) : BORDER.default}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <p className="text-[0.52rem] tracking-[0.10em] uppercase font-semibold"
                      style={{ color: isPay ? GOLD : TEXT.primary }}>{label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {[
                      { label: 'Revenue',      value: fmtNaira(method.revenue, true)   },
                      { label: 'Orders',       value: String(method.orders)            },
                      { label: 'AOV',          value: fmtNaira(method.aov, true)       },
                      { label: 'Success Rate', value: `${method.successRate}%`         },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="text-[0.42rem] tracking-[0.10em] uppercase" style={{ color: TEXT.muted }}>{m.label}</p>
                        <p className="mt-0.5 text-[0.62rem] font-semibold" style={{ color: TEXT.primary }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Monthly trend bar chart */}
      {monthly.length > 0 && (
        <>
          <p className="text-[0.48rem] tracking-[0.12em] uppercase mb-3" style={{ color: TEXT.muted }}>
            Monthly Revenue Trend by Method
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                  axisLine={false} tickLine={false} width={52}
                  tickFormatter={(v) => fmtNaira(v as number, true)} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 9, color: TEXT.secondary, paddingTop: 8 }}
                  formatter={(v) => v === 'paystack' ? 'Paystack' : 'Bank Transfer'} />
                <Bar dataKey="paystack" name="paystack" fill={PAYSTACK_COLOR} radius={[2, 2, 0, 0]} />
                <Bar dataKey="bank"     name="bank"     fill={BANK_COLOR}     radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </SectionCard>
  );
}
