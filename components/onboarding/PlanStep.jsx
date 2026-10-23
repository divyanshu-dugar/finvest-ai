import { Check } from 'lucide-react';
import { PLANS } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

/** Plan cards. Clicking a card selects it; the page's footer button commits the choice. */
export default function PlanStep({ selected, onSelect }) {
  return (
    <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Plan">
      {PLANS.map((plan) => {
        const on = selected === plan.id;
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(plan.id)}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-surface p-5 text-left transition-[border-color,box-shadow] duration-200',
              on ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line shadow-xs hover:border-line-strong',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-lg font-medium text-ink">{plan.name}</span>
              {plan.badge ? (
                <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-muted">{plan.badge}</span>
              ) : (
                plan.id === 'free' && <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand-ink">Available now</span>
              )}
            </div>
            <p className="mt-1 text-[13px] leading-snug text-muted">{plan.tagline}</p>
            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="font-display text-[32px] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums">{plan.price}</span>
              <span className="text-[13px] text-muted">{plan.cadence}</span>
            </p>
            <ul className="mt-5 space-y-2 border-t border-line pt-4">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-[13px] leading-snug text-ink-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-brand" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
