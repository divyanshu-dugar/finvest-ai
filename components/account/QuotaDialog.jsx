'use client';

import { useEffect, useState } from 'react';
import { Gauge, X } from 'lucide-react';
import { QUOTA_EXCEEDED_EVENT } from '@/lib/authenticate';
import Button from '@/components/ui/Button';

/** App-wide prompt shown when any request hits a plan limit (HTTP 402 from the API). */
export default function QuotaDialog() {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const onQuota = (e) => setDetail(e.detail);
    window.addEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
    return () => window.removeEventListener(QUOTA_EXCEEDED_EVENT, onQuota);
  }, []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e) => e.key === 'Escape' && setDetail(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detail]);

  if (!detail) return null;
  const close = () => setDetail(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] animate-fade-up" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quota-title"
        className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-pop animate-fade-up"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
        >
          <X className="size-4" />
        </button>
        <div className="flex size-10 items-center justify-center rounded-xl border border-line bg-canvas">
          <Gauge className="size-5 text-ink-2" />
        </div>
        <h2 id="quota-title" className="mt-4 font-display text-lg font-medium text-ink">You&apos;ve reached a plan limit</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{detail.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>Not now</Button>
          <Button href="/account" onClick={close}>See plans</Button>
        </div>
      </div>
    </div>
  );
}
