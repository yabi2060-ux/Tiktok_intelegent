import { useMemo } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyMetric } from '../engine/types';
import { formatCurrency, formatNumber } from '../engine/utils';

export function ReportChart({ data }: { data: DailyMetric[] }) {
  const chartData = useMemo(() => data.map((item) => ({ ...item })), [data]);
  return (
    <div className="trend-chart" aria-label="Grafik tren order dan komisi">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" strokeDasharray="2 5" />
          <XAxis dataKey="label" tick={{ fill: '#7f7f8a', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={18} />
          <YAxis yAxisId="orders" tick={{ fill: '#7f7f8a', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <YAxis yAxisId="commission" orientation="right" tick={{ fill: '#7f7f8a', fontSize: 10 }} axisLine={false} tickLine={false} width={36} tickFormatter={(value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}jt` : value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`} />
          <Tooltip
            cursor={{ fill: 'rgba(139,92,246,0.06)' }}
            contentStyle={{ background: '#0b0b10', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.55)' }}
            labelStyle={{ color: '#a7a7b2', marginBottom: 6 }}
            formatter={(value: number, name: string) => [name === 'commission' ? formatCurrency(value) : formatNumber(value), name === 'commission' ? 'Komisi' : 'Order unik']}
          />
          <Bar yAxisId="orders" dataKey="orders" barSize={12} radius={[4,4,0,0]} fill="rgba(94, 198, 219, 0.55)" isAnimationActive animationDuration={900} />
          <Line yAxisId="commission" dataKey="commission" type="monotone" stroke="#a78bfa" strokeWidth={2.2} dot={false} activeDot={{ r: 4, fill: '#f5f5f7', stroke: '#8b5cf6', strokeWidth: 2 }} isAnimationActive animationDuration={1200} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
