'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Mail } from 'lucide-react';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import Reveal from '@/components/motion/Reveal';
import { useAuth } from '@/context/AuthContext';
import { CONTACT_EMAIL, LINKEDIN_URL } from '@/lib/site';

function LinkedInIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function ClosingCallToAction({ user }) {
  return (
    <Reveal>
      <div className="rounded-2xl bg-ink px-6 py-14 text-center sm:px-12 sm:py-16">
        <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-normal leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl">
          Your next 10-K, read in minutes.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/60">
          Start with any public company. No credit card, no setup.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href={user ? '/dashboard' : '/register'} size="lg" className="bg-white text-ink hover:bg-white/90">
            {user ? 'Open dashboard' : 'Get started free'}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </Reveal>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-[13px] font-medium text-ink">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map(({ label, href, external }) => (
          <li key={label}>
            {external ? (
              <a
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
              >
                {label}
                {!href.startsWith('mailto:') && <ArrowUpRight className="size-3.5" />}
              </a>
            ) : (
              <Link href={href} className="text-sm text-muted transition-colors hover:text-ink">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { user } = useAuth();

  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#product' },
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'SEC Explorer', href: '/explore' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      title: 'Account',
      links: user
        ? [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Companies', href: '/companies/list' },
            { label: 'Research chat', href: '/research' },
          ]
        : [
            { label: 'Sign in', href: '/login' },
            { label: 'Create an account', href: '/register' },
          ],
    },
    {
      title: 'Company',
      links: [
        { label: 'LinkedIn', href: LINKEDIN_URL, external: true },
        { label: 'Contact us', href: `mailto:${CONTACT_EMAIL}`, external: true },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy policy', href: '/privacy' },
        { label: 'Terms of service', href: '/terms' },
        { label: 'Disclaimer', href: '/terms#investment-disclaimer' },
      ],
    },
  ];

  return (
    <footer className="pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ClosingCallToAction user={user} />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_2fr] lg:gap-16">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Company research grounded in SEC filings. Read, ask and analyze in one place.
            </p>
            <div className="mt-5 flex gap-2">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Finvest AI on LinkedIn"
                className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <LinkedInIcon className="size-4" />
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label={`Email ${CONTACT_EMAIL}`}
                className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <Mail className="size-4" />
              </a>
            </div>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-4 block text-sm text-ink-2 hover:text-ink">
              {CONTACT_EMAIL}
            </a>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {columns.map((col) => <FooterColumn key={col.title} {...col} />)}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-8 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Finvest Studios. All rights reserved.</p>
          <p>Research tool, not investment advice. Filing data from SEC EDGAR.</p>
        </div>
      </div>
    </footer>
  );
}
