import Button from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

const GROUPS = [
  { id: 'valuation', title: 'Valuation' },
  { id: 'profitability', title: 'Profitability' },
  { id: 'health', title: 'Financial health' },
];

function formatDay(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function RatioCell({ ratio }) {
  return (
    <div className="bg-surface p-4">
      <p className="text-[13px] text-muted">{ratio.label}</p>
      {ratio.value ? (
        <>
          <p className="mt-1.5 font-display text-2xl font-normal leading-tight text-ink tabular-nums">{ratio.value}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{ratio.description}</p>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm font-medium text-ink-2">Not available</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{ratio.unavailableReason}</p>
        </>
      )}
    </div>
  );
}

/** Financial ratios grouped by what they tell you, for one fiscal year. */
export default function RatioGrid({ data, loading, onRefresh }) {
  const period = `Fiscal ${data.fiscalYear}, year ended ${formatDay(data.fiscalYearEnd)}`;
  const price = data.price ? ` · Share price $${data.price.toFixed(2)}` : '';

  return (
    <Card>
      <CardHeader
        title="Financial ratios"
        description={`${period}${price}`}
        action={<Button size="sm" variant="secondary" icon={RefreshCw} loading={loading} onClick={onRefresh}>Refresh</Button>}
      />
      <div className="space-y-6 p-5">
        {GROUPS.map((group) => {
          const ratios = data.ratios.filter((r) => r.group === group.id);
          return (
            <section key={group.id}>
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{group.title}</h3>
              <div className={cn('grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2', ratios.length === 4 && 'lg:grid-cols-4')}>
                {ratios.map((ratio) => <RatioCell key={ratio.key} ratio={ratio} />)}
              </div>
            </section>
          );
        })}
        <p className="text-xs text-faint">Source: SEC XBRL data and the live Finnhub share price.</p>
      </div>
    </Card>
  );
}
