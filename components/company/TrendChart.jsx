'use client';

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const formatChange = (pct) => (pct === null || pct === undefined ? 'N/A' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`);
const changeTone = (pct) => (!pct ? 'text-ink' : pct > 0 ? 'text-positive' : 'text-negative');

function axisFormatter(unit) {
  const format = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...(unit === 'USD' ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 2 }),
  });
  return (value) => format.format(value);
}

function ChartTooltip({ active, payload }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-card">
      <p className="text-muted">Fiscal {point.year}</p>
      <p className="mt-1 text-sm font-medium text-ink tabular-nums">{point.formatted}</p>
      {point.yoy !== null && <p className="mt-0.5 text-muted tabular-nums">{formatChange(point.yoy)} on the prior year</p>}
    </div>
  );
}

/** A metric's yearly history: headline figures, a bar chart, and the same numbers as a table. */
export default function TrendChart({ trend, label }) {
  const { points, cagr, unit, ticker } = trend;
  const first = points[0];
  const latest = points[points.length - 1];
  // Recharts copies data fields onto the SVG bars, and "display" is a real SVG attribute.
  const bars = points.map(({ year, value, yoy, display }) => ({ year, value, yoy, formatted: display }));
  const stats = [
    [`Fiscal ${latest.year}`, latest.display],
    ['Year over year', formatChange(latest.yoy), changeTone(latest.yoy)],
    [`CAGR, ${latest.year - first.year} years`, formatChange(cagr), changeTone(cagr)],
  ];

  return (
    <Card>
      <CardHeader title={label} description={`${ticker} · fiscal ${first.year} to ${latest.year}`} />
      <div className="p-5">
        <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {stats.map(([name, value, tone]) => (
            <div key={name} className="bg-surface px-4 py-3">
              <dt className="text-xs text-muted">{name}</dt>
              <dd className={cn('mt-1 font-display text-2xl font-normal leading-tight text-ink tabular-nums', tone)}>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="36%">
              <CartesianGrid stroke="#e4e3dd" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: '#6a6d67', fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickFormatter={axisFormatter(unit)} tick={{ fill: '#6a6d67', fontSize: 11 }} tickLine={false} axisLine={false} width={64} />
              <ReferenceLine y={0} stroke="#6a6d67" strokeOpacity={0.5} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f6f6f3' }} isAnimationActive={false} />
              <Bar dataKey="value" fill="#0b6e4f" radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="scrollbar-thin mt-6 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2 pr-4 font-normal">Fiscal year</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">{label}</th>
                <th scope="col" className="py-2 text-right font-normal">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...points].reverse().map((p) => (
                <tr key={p.year}>
                  <th scope="row" className="py-2 pr-4 font-medium text-ink tabular-nums">{p.year}</th>
                  <td className="py-2 pr-4 text-right text-ink-2 tabular-nums">{p.display}</td>
                  <td className={cn('py-2 text-right tabular-nums', changeTone(p.yoy))}>{formatChange(p.yoy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-faint">Source: SEC XBRL data from annual 10-K filings.</p>
      </div>
    </Card>
  );
}
