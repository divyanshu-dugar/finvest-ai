'use client';

import { useEffect, useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Product', href: '/#product' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faq' },
];

function AuthActions({ stacked = false }) {
  const { user, loading } = useAuth();
  // Keep the slot's size while auth state loads so the nav doesn't shift.
  if (loading) return <div className={stacked ? 'h-10' : 'h-9 w-44'} />;

  if (user) {
    return (
      <Button href="/dashboard" size={stacked ? 'md' : 'sm'} className={cn(stacked && 'w-full')}>
        Open dashboard
        <ArrowRight className="size-4" />
      </Button>
    );
  }
  return (
    <div className={cn('flex gap-2', stacked && 'flex-col')}>
      <Button href="/login" variant={stacked ? 'secondary' : 'ghost'} size={stacked ? 'md' : 'sm'}>
        Sign in
      </Button>
      <Button href="/register" size={stacked ? 'md' : 'sm'}>
        Get started
      </Button>
    </div>
  );
}

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-200',
        scrolled || open ? 'border-line bg-canvas/85 backdrop-blur-md' : 'border-transparent bg-canvas',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-ink-2 transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <AuthActions />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-subtle md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu: grid-rows trick animates height without measuring. */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out-quint md:hidden',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        inert={!open}
      >
        <div className="overflow-hidden">
          <div className="space-y-1 border-t border-line px-4 pb-5 pt-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-[15px] text-ink-2 hover:bg-subtle hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3">
              <AuthActions stacked />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
