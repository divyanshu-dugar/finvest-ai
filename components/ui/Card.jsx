import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface shadow-card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[15px] font-medium leading-snug text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] leading-normal text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-balance font-display text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm leading-normal text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-line bg-subtle">
          <Icon className="size-5 text-muted" />
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-balance text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-subtle', className)} />;
}

/** Page container used by every app screen. */
export function PageContainer({ size = 'xl', className, children }) {
  const widths = { md: 'max-w-3xl', lg: 'max-w-5xl', xl: 'max-w-6xl' };
  return (
    <div className={cn('mx-auto w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10', widths[size], className)}>
      {children}
    </div>
  );
}
