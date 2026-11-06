'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Mail } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { getPlanInfo } from '@/lib/plans';
import { CONTACT_EMAIL } from '@/lib/site';
import { useAccount } from '@/context/AccountContext';
import UsageBar from '@/components/account/UsageBar';
import SecuritySettings from '@/components/account/SecuritySettings';
import Button from '@/components/ui/Button';
import { Card, CardHeader, PageContainer, PageHeader, Skeleton } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function formatDay(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function PlanCard({ plan, current, onWaitlist, waitlisted, joining }) {
  return (
    <div className={cn('flex flex-col rounded-xl border p-5', current ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line')}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-medium text-ink">{plan.name}</span>
        {current ? (
          <span className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-medium text-white">Current plan</span>
        ) : (
          plan.badge && <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-muted">{plan.badge}</span>
        )}
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-[28px] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums">{plan.price}</span>
        <span className="text-[13px] text-muted">{plan.cadence}</span>
      </p>
      <ul className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2 text-[13px] leading-snug text-ink-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-brand" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      {!current && plan.id === 'pro' && (
        <Button
          className="mt-5 w-full"
          variant={waitlisted ? 'secondary' : 'primary'}
          disabled={waitlisted}
          loading={joining}
          onClick={onWaitlist}
        >
          {waitlisted ? "You're on the waitlist" : plan.cta}
        </Button>
      )}
      {!current && plan.id === 'enterprise' && (
        <Button className="mt-5 w-full" variant="secondary" icon={Mail} href={`mailto:${CONTACT_EMAIL}?subject=Finvest%20AI%20Enterprise`}>
          {plan.cta}
        </Button>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { account, refresh } = useAccount();
  const [joining, setJoining] = useState(false);

  const joinWaitlist = async () => {
    setJoining(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/me/plan-interest`, {
        method: 'PUT',
        body: JSON.stringify({ plan: 'pro' }),
      });
      if (!res.ok) throw new Error();
      await refresh();
      toast.success("You're on the Pro waitlist. We'll let you know when it launches.");
    } catch {
      toast.error('Could not join the waitlist. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (!account) {
    return (
      <PageContainer size="lg">
        <Skeleton className="mb-8 h-14 w-64" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="mt-6 h-96 rounded-xl" />
      </PageContainer>
    );
  }

  const { usage } = account;
  const isAdmin = usage.plan === 'admin';

  return (
    <PageContainer size="lg">
      <PageHeader
        title="Plan & usage"
        description={isAdmin
          ? `Admin account: usage is tracked but never limited. Monthly counts reset on ${formatDay(usage.resetsAt)}.`
          : `You're on the ${usage.planName} plan. Monthly usage resets on ${formatDay(usage.resetsAt)}.`}
      />

      <Card>
        <CardHeader title="This month" description={isAdmin ? "What you've used so far." : "What you've used against your plan's limits."} />
        <div className="grid gap-x-10 gap-y-6 p-5 sm:grid-cols-2">
          <UsageBar label="Company workspaces" used={usage.companies.used} limit={usage.companies.limit} />
          {usage.meters.map((m) => (
            <UsageBar key={m.key} label={m.label} used={m.used} limit={m.limit} />
          ))}
        </div>
      </Card>

      {!isAdmin && (
        <Card className="mt-6">
          <CardHeader
            title="Plans"
            description="Billing isn't live yet. Join the Pro waitlist and we'll let you know when it opens."
          />
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {['free', 'pro', 'enterprise'].map((id) => (
              <PlanCard
                key={id}
                plan={getPlanInfo(id)}
                current={usage.plan === id}
                waitlisted={account.planInterest === 'pro'}
                joining={joining}
                onWaitlist={joinWaitlist}
              />
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader title="Account" />
        <dl className="divide-y divide-line text-sm">
          {[
            ['Username', account.userName],
            ['Name', account.displayName],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <dt className="text-muted">{label}</dt>
              <dd className="truncate text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <SecuritySettings account={account} onChange={refresh} />
    </PageContainer>
  );
}
