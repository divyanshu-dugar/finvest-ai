import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-ink-2 shadow-xs',
  brand: 'bg-brand text-white hover:bg-brand-hover shadow-xs',
  secondary: 'bg-surface text-ink border border-line hover:bg-subtle hover:border-line-strong shadow-xs',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
  danger: 'text-negative hover:bg-negative-soft',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
};

/**
 * Renders a <Link> when `href` is given, otherwise a <button>.
 * `loading` swaps the leading icon for a spinner and disables the button.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium whitespace-nowrap select-none',
    'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4 shrink-0" />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
