'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER, POSITIVE,
  SectionCard, SectionHeading, ToggleGroup, fmtNaira,
} from '../shared';
import type { ProductsData, CategoryPerf } from '@/types/analytics-products';

type Mode = 'revenue' | 'units' | 'orders';

const MODE_OPTIONS: { label: string; value: Mode }[] = [
  { label: 'Revenue', value: 'revenue' },
  { label: 'Units',   value: 'units'   },
  { label: 'Orders',  value: 'orders'  },
];

const CAT_COLORS = [
  GOLD,
  'rgba(244,114,182,0.80)',
  'rgba(52,211,153,0.80)',
  'rgba(167,139,250,0.80)',
  'rgba(251,191,36,0.80)',
];

interface TooltipPayload { payload: CategoryPerf; value: number }

function CustomTooltip({ active, payload, label, mode }: {
  active?: boolean; payload?: TooltipPayload[]; label?: string; mode: Mode;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="p-3" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem] tracking-[0.10em] uppercase mb-1.5" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.58rem] font-semibold" style={{ color: TEXT.primary }}>
        {mode === 'revenue' ? fmtNaira(d.revenue, true) : mode === 'units' ? `${d.units} units` : `${d.orders} orders`}
      </p>
      {d.growth !== 0 && (
        <p className="text-[0.46rem] mt-0.5" style={{ color: d.growth > 0 ? POSITIVE : '#f87171' }}>
          {d.growth > 0 ? '↑' : '↓'} {Math.abs(d.growth)}% vs prev period
        </p>
      )}
    </div>
  );
}

interface PieTooltipPayload { name: string; value: number; payload: CategoryPerf }
function PieTooltip({ active, payload }: { active?: boolean; payload?: PieTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2.5" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem]" style={{ color: TEXT.primary }}>{payload[0].name}</p>
      <p className="text-[0.54rem] font-semibold mt-0.5" style={{ color: GOLD }}>
        {fmtNaira(payload[0].value, true)} · {payload[0].payload.pct}%
      </p>
    </div>
  );
}

interface Props { data: ProductsData | null }

export default function CategoryPerformanceChart({ data }: Props) {
  const [mode, setMode] = useState<Mode>('revenue');

  const categoryPerf  = data?.categoryPerf ?? [];
  const donutData     = categoryPerf.map((c) => ({ name: c.category, value: c.revenue, pct: c.pct }));

  return (
    <SectionCard>
      <SectionHeading
        title="Performance by Category"
        action={<ToggleGroup options={MODE_OPTIONS} value={mode} onChange={setMode} />}
      />

      {categoryPerf.length === 0 ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No category data for this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Bar chart — 3/5 width */}
          <div className="xl:col-span-3">
            <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
              {mode === 'revenue' ? 'Revenue' : mode === 'units' ? 'Units Sold' : 'Orders'} by Category
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerf} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={30}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="category"
                    tick={{ fill: TEXT.secondary, fontSize: 8, fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} width={52}
                    tickFormatter={(v) => mode === 'revenue' ? fmtNaira(v as number, true) : String(v)} />
                  <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey={mode} radius={[2, 2, 0, 0]}>
                    {categoryPerf.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Growth trend tags */}
            {categoryPerf.some((c) => c.growth !== 0) && (
              <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${BORDER.default}` }}>
                <p className="text-[0.44rem] tracking-[0.10em] uppercase mb-2" style={{ color: TEXT.muted }}>
                  Growth vs previous period
                </p>
                <div className="flex flex-wrap gap-2">
                  {categoryPerf.map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-1.5 px-2 py-1"
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER.default}` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span className="text-[0.44rem]" style={{ color: TEXT.secondary }}>{cat.category}</span>
                      <span className="text-[0.44rem] font-semibold"
                        style={{ color: cat.growth > 0 ? POSITIVE : cat.growth < 0 ? '#f87171' : TEXT.secondary }}>
                        {cat.growth > 0 ? '↑' : cat.growth < 0 ? '↓' : '—'}{cat.growth !== 0 ? ` ${Math.abs(cat.growth)}%` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Donut chart — 2/5 width */}
          <div className="xl:col-span-2">
            <p className="text-[0.48rem] tracking-[0.10em] uppercase mb-3" style={{ color: TEXT.secondary }}>
              Revenue Market Share
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%"
                    innerRadius="50%" outerRadius="78%"
                    dataKey="value" paddingAngle={2} strokeWidth={0}>
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(v) => v}
                    wrapperStyle={{ fontSize: 9, color: TEXT.secondary }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with pct */}
            <div className="mt-2 space-y-1">
              {donutData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span className="text-[0.46rem]" style={{ color: TEXT.secondary }}>{cat.name}</span>
                  </div>
                  <span className="text-[0.46rem] font-semibold" style={{ color: TEXT.primary }}>
                    {cat.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
