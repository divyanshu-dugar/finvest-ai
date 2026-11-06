'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from '@/context/AccountContext';
import { cn } from '@/lib/utils';

const VIEWS = [
  { href: '/dashboard', label: 'My dashboard' },
  { href: '/admin', label: 'Admin' },
];

/** Switch between your own dashboard and the admin view. Renders nothing for non-admins. */
export default function ViewSwitch({ className }) {
  const { account } = useAccount();
  const pathname = usePathname();
  if (account?.usage?.plan !== 'admin') return null;

  return (
    <nav aria-label="Dashboard view" className={cn('inline-flex rounded-lg border border-line bg-subtle p-0.5', className)}>
      {VIEWS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-8 items-center rounded-md px-3 text-[13px] font-medium transition-colors duration-150',
              active ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
