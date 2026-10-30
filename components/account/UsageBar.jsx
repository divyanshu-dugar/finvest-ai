import { cn } from '@/lib/utils';

/** "12 of 25" with a thin bar; turns amber near the limit and red at it. Unlimited shows no bar. */
export default function UsageBar({ label, used, limit, compact = false, className }) {
  const unlimited = limit === null || limit === undefined;
  const ratio = unlimited ? 0 : Math.min(used / Math.max(limit, 1), 1);
  const tone = ratio >= 1 ? 'bg-negative' : ratio >= 0.8 ? 'bg-warning' : 'bg-ink';

  return (
    <div className={className}>
      <div className={cn('flex items-baseline justify-between gap-3', compact ? 'text-xs' : 'text-sm')}>
        <span className={cn('truncate', compact ? 'text-muted' : 'text-ink-2')}>{label}</span>
        <span className="shrink-0 tabular-nums text-muted">
          <span className={cn('font-medium', ratio >= 1 ? 'text-negative' : 'text-ink')}>{used}</span>
          {unlimited ? ' used' : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className={cn('overflow-hidden rounded-full bg-subtle', compact ? 'mt-1.5 h-1' : 'mt-2 h-1.5')}>
          <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out-quint', tone)} style={{ width: `${ratio * 100}%` }} />
        </div>
      )}
    </div>
  );
}
