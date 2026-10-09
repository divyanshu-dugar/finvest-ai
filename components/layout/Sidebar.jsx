'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileSearch, Building2, FileText, MessagesSquare,
  TableProperties, LogOut, Menu, X,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Research',
    items: [
      { label: 'SEC Explorer', href: '/explore', icon: FileSearch },
      { label: 'Companies', href: '/companies/list', match: '/companies', icon: Building2 },
      { label: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { label: 'Research Chat', href: '/research', icon: MessagesSquare },
      { label: 'Table Extractor', href: '/extract', icon: TableProperties },
    ],
  },
];

function isActive(pathname, { href, match }) {
  const base = match || href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function SidebarContent({ onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const name = user?.userName || '';

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo onClick={onNavigate} />
      </div>

      <nav aria-label="Main" className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-3">
        {NAV.map((group, i) => (
          <div key={group.title || i}>
            {group.title && (
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150',
                        active ? 'bg-subtle text-ink' : 'text-ink-2 hover:bg-subtle/70 hover:text-ink',
                      )}
                    >
                      <item.icon className={cn('size-4.5 shrink-0', active ? 'text-brand' : 'text-muted')} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold uppercase text-brand-ink">
            {name.charAt(0) || '?'}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{name}</p>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-subtle hover:text-ink"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on navigation and on Escape; lock page scroll while it's open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-subtle"
        >
          <Menu className="size-5" />
        </button>
        <Logo />
      </header>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-40 lg:hidden', !open && 'pointer-events-none')} inert={!open}>
        <div
          onClick={() => setOpen(false)}
          className={cn('absolute inset-0 bg-ink/30 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-pop transition-transform duration-300 ease-out-quint',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-3.5 flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
          >
            <X className="size-5" />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </div>
    </>
  );
}
