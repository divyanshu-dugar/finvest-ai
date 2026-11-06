'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'verifying' });
  const started = useRef(false);

  useEffect(() => {
    // A link works once, so never send it twice (React runs effects twice in development).
    if (started.current) return;
    started.current = true;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState({ status: 'failed', message: 'This link is incomplete. Copy the whole link from the email.' });
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Could not confirm your email');
        setState({ status: 'confirmed', email: data.email });
      } catch (err) {
        setState({ status: 'failed', message: err.message });
      }
    })();
  }, []);

  const next = user
    ? { href: '/account', label: 'Go to your account' }
    : { href: '/login', label: 'Sign in' };

  const view = {
    verifying: {
      icon: <Loader2 className="size-5 animate-spin text-muted" />,
      tone: 'bg-subtle',
      title: 'Confirming your email',
      body: 'This only takes a moment.',
    },
    confirmed: {
      icon: <CheckCircle2 className="size-5 text-brand" />,
      tone: 'bg-brand-soft',
      title: 'Email confirmed',
      body: `${state.email} is now the email on your account. We'll use it for password resets and important account notices.`,
    },
    failed: {
      icon: <XCircle className="size-5 text-negative" />,
      tone: 'bg-negative-soft',
      title: "We couldn't confirm your email",
      body: `${state.message} You can send a new link from your account page.`,
    },
  }[state.status];

  return (
    <AuthLayout title="Email confirmation" description="Finvest AI account" showGoogle={false}>
      <div className="text-center" aria-live="polite">
        <div className={`mx-auto mb-4 flex size-11 items-center justify-center rounded-xl ${view.tone}`}>{view.icon}</div>
        <p className="text-sm font-medium text-ink">{view.title}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{view.body}</p>
        {state.status !== 'verifying' && (
          <Button href={next.href} className="mt-6 w-full">
            {next.label}
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
