import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className={cn('size-7 shrink-0', className)}>
      <rect width="28" height="28" rx="7" fill="#121412" />
      <rect x="7" y="15" width="3.5" height="6" rx="1" fill="#fff" fillOpacity="0.5" />
      <rect x="12.25" y="11" width="3.5" height="10" rx="1" fill="#fff" fillOpacity="0.78" />
      <rect x="17.5" y="7" width="3.5" height="14" rx="1" fill="#3fd39a" />
    </svg>
  );
}

/** Brand lockup. Always links to the marketing home page. */
export default function Logo({ className, onClick }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Finvest AI home"
      className={cn('inline-flex items-center gap-2.5 rounded-md', className)}
    >
      <LogoMark />
      <span className="font-display text-[17px] font-medium leading-none tracking-[-0.01em] text-ink">
        Finvest <span className="text-muted">AI</span>
      </span>
    </Link>
  );
}
