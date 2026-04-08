'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  GOLD, GOLD_BG, TEXT, BORDER,
  SectionCard, SectionHeading, ToggleGroup, fmtNaira,
} from '../shared';
import type { ProductsData, SizeData } from '@/types/analytics-products';

type Mode = 'units' | 'revenue';

const MODE_OPTIONS: { label: string; value: Mode }[] = [
  { label: 'Units',   value: 'units'   },
  { label: 'Revenue', value: 'revenue' },
];

const SIZE_COLORS = [GOLD_BG(0.45), GOLD, GOLD_BG(0.72), GOLD_BG(0.55)];

interface TooltipPayload { payload: SizeData; value: number }

function CustomTooltip({ active, payload, label, mode }: {
  active?: boolean; payload?: TooltipPayload[]; label?: string; mode: Mode;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="p-3" style={{ background: '#242424', border: `1px solid ${BORDER.default}` }}>
      <p className="text-[0.50rem] tracking-[0.10em] uppercase mb-1" style={{ color: TEXT.muted }}>{label}</p>
      <p className="text-[0.58rem] font-semibold" style={{ color: TEXT.primary }}>
        {mode === 'units' ? `${d.units} units` : fmtNaira(d.revenue, true)}
      </p>
      <p className="text-[0.46rem] mt-0.5" style={{ color: TEXT.secondary }}>
        AOV: {fmtNaira(d.aov, true)} · {mode === 'units' ? d.pctUnits : d.pctRevenue}% of total
      </p>
    </div>
  );
}

interface Props { data: ProductsData | null }

export default function VariantSizeAnalysis({ data }: Props) {
  const [mode, setMode] = useState<Mode>('units');

  const sizeData: SizeData[] = data?.sizeData ?? [];

  const topByRevenue = [...sizeData].sort((a, b) => b.revenue - a.revenue)[0];
  const topByUnits   = [...sizeData].sort((a, b) => b.units   - a.units  )[0];

  return (
    <SectionCard>
      <SectionHeading
        title="Sales by Variant Size"
        action={<ToggleGroup options={MODE_OPTIONS} value={mode} onChange={setMode} />}
      />

      {sizeData.length === 0 ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-[0.48rem]" style={{ color: TEXT.muted }}>No size data for this period</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={48}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="size"
                    tick={{ fill: TEXT.secondary, fontSize: 10, fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TEXT.muted, fontSize: 8, fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} width={52}
                    tickFormatter={(v) => mode === 'revenue' ? fmtNaira(v as number, true) : String(v)} />
                  <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey={mode} radius={[3, 3, 0, 0]}>
                    {sizeData.map((_, i) => (
                      <Cell key={i} fill={SIZE_COLORS[i % SIZE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER.default}` }}>
                    {['Size', 'Units Sold', 'Revenue', 'AOV', '% Total'].map((col) => (
                      <th key={col} className="pb-2 text-left text-[0.44rem] tracking-[0.12em] uppercase font-medium pr-4"
                        style={{ color: TEXT.muted }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeData.map((row, i) => (
                    <tr key={row.size} style={{ borderBottom: i < sizeData.length - 1 ? `1px solid ${BORDER.default}` : 'none' }}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: SIZE_COLORS[i % SIZE_COLORS.length] }} />
                          <span className="text-[0.52rem] font-semibold" style={{ color: TEXT.primary }}>{row.size}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[0.50rem]" style={{ color: TEXT.primary }}>{row.units}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[0.50rem] font-semibold" style={{ color: GOLD }}>
                          {fmtNaira(row.revenue, true)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>
                          {fmtNaira(row.aov, true)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div>
                          <span className="text-[0.50rem]" style={{ color: TEXT.secondary }}>
                            {row.pctRevenue}% rev
                          </span>
                          <div className="mt-0.5 h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${row.pctRevenue}%`, background: SIZE_COLORS[i % SIZE_COLORS.length] }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insight */}
          {topByRevenue && topByUnits && (
            <div className="mt-5 p-3" style={{ background: GOLD_BG(0.05), border: `1px solid ${GOLD_BG(0.18)}` }}>
              <p className="text-[0.50rem] tracking-[0.04em]" style={{ color: TEXT.secondary }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>{topByRevenue.size} variants</span> generate{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{topByRevenue.pctRevenue}% of revenue</span>{' '}
                with a highest AOV of{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{fmtNaira(topByRevenue.aov)}</span>.{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>{topByUnits.size}</span> drives the most unit volume
                at <span style={{ color: GOLD, fontWeight: 600 }}>{topByUnits.pctUnits}% of units</span> sold.
              </p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
