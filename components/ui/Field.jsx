import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-faint shadow-xs ' +
  'transition-[border-color,box-shadow] duration-150 outline-none ' +
  'focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:opacity-60';

export function Label({ children, hint, className, ...props }) {
  return (
    <label className={cn('mb-1.5 block text-[13px] font-medium text-ink-2', className)} {...props}>
      {children}
      {hint && <span className="ml-1 font-normal text-faint">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn(CONTROL, 'h-10 px-3', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(CONTROL, 'px-3 py-2.5 leading-relaxed', className)} {...props} />;
}

/** Native select with a custom chevron inset from the right edge. */
export function Select({ className, children, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(CONTROL, 'h-10 cursor-pointer appearance-none pl-3 pr-10')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg border border-negative/20 bg-negative-soft px-3 py-2 text-[13px] text-negative">
      {children}
    </p>
  );
}
