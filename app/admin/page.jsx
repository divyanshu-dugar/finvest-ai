'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldAlert, Users } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { formatDate, formatRelative } from '@/lib/format';
import { useAccount } from '@/context/AccountContext';
import ViewSwitch from '@/components/admin/ViewSwitch';
import Button from '@/components/ui/Button';
import { Card, CardHeader, EmptyState, PageContainer, PageHeader, Skeleton } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const METERS = [
  { key: 'aiQuestions', label: 'AI questions', short: 'AI' },
  { key: 'analyses', label: 'Analyses', short: 'Analyses' },
  { key: 'filingImports', label: 'Filing imports', short: 'Imports' },
  { key: 'tableExtractions', label: 'Table extractions', short: 'Tables' },
];

const PLAN_TONE = {
  admin: 'bg-ink text-white',
  pro: 'bg-brand-soft text-brand-ink',
  enterprise: 'bg-brand-soft text-brand-ink',
  free: 'bg-subtle text-muted',
};

function monthLabel(period) {
  const [year, month] = period.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function Stat({ label, value, note }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <p className="truncate text-xs text-muted sm:text-[13px]">{label}</p>
      <p className="mt-3 font-display text-[26px] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums sm:text-[32px]">
        {value}
      </p>
      {note && <p className="mt-2 truncate text-xs text-muted">{note}</p>}
    </div>
  );
}

function Badge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-normal', className)}>
      {children}
    </span>
  );
}

/** Table cell helpers: numbers right-aligned, zeros faded so real activity stands out. */
function Num({ value }) {
  return <span className={cn('tabular-nums', value ? 'text-ink' : 'text-faint')}>{value}</span>;
}

const TH = 'whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-muted';
const TD = 'whitespace-nowrap px-4 py-3 align-top';

function WaitlistCard({ users }) {
  const waiting = users
    .filter((u) => u.waitlist)
    .sort((a, b) => new Date(b.waitlistSince || 0) - new Date(a.waitlistSince || 0));

  return (
    <Card>
      <CardHeader
        title="Waitlist"
        description={waiting.length
          ? `${waiting.length} ${waiting.length === 1 ? 'person wants' : 'people want'} a paid plan. You get an email each time someone joins.`
          : 'People who ask for a paid plan show up here. You get an email each time someone joins.'}
      />
      {waiting.length === 0 ? (
        <EmptyState title="Nobody yet" description="When someone joins the Pro or Enterprise waitlist, they'll appear here." />
      ) : (
        <ul className="divide-y divide-line">
          {waiting.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{u.displayName || u.userName}</p>
                {u.email ? (
                  <a href={`mailto:${u.email}`} className="truncate text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">
                    {u.email}
                  </a>
                ) : (
                  <p className="text-[13px] text-faint">@{u.userName}, no confirmed email</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <Badge className={PLAN_TONE[u.waitlist]}>{capitalize(u.waitlist)}</Badge>
                <p className="mt-1 text-xs text-muted">{u.waitlistSince ? formatDate(u.waitlistSince) : 'Before dates were kept'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityCard({ months }) {
  return (
    <Card>
      <CardHeader title="Monthly activity" description="All users combined. Usage counters reset on the 1st (UTC)." />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-subtle/50">
            <tr>
              <th className={TH}>Month</th>
              <th className={cn(TH, 'text-right')}>Sign-ups</th>
              <th className={cn(TH, 'text-right')}>Active users</th>
              {METERS.map((m) => <th key={m.key} className={cn(TH, 'text-right')}>{m.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {months.map((row, i) => (
              <tr key={row.period}>
                <td className={cn(TD, 'text-ink')}>
                  {monthLabel(row.period)}
                  {i === 0 && <span className="ml-2 text-xs text-muted">so far</span>}
                </td>
                <td className={cn(TD, 'text-right')}><Num value={row.signups} /></td>
                <td className={cn(TD, 'text-right')}><Num value={row.activeUsers} /></td>
                {METERS.map((m) => <td key={m.key} className={cn(TD, 'text-right')}><Num value={row[m.key]} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function UsersCard({ users }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.userName, u.displayName, u.email, u.pendingEmail].some((v) => v?.toLowerCase().includes(q)));
  }, [users, query]);

  return (
    <Card>
      <CardHeader
        title="Users"
        description={`${users.length} ${users.length === 1 ? 'account' : 'accounts'}, newest first. Usage is for this month.`}
        action={
          <div className="relative w-56 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              aria-label="Search users"
              className="h-9 pl-9"
            />
          </div>
        }
      />
      {shown.length === 0 ? (
        <EmptyState icon={Users} title="No matches" description={`Nobody matches "${query.trim()}".`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-subtle/50">
              <tr>
                <th className={TH}>User</th>
                <th className={TH}>Plan</th>
                <th className={TH}>Sign-in</th>
                {METERS.map((m) => <th key={m.key} className={cn(TH, 'text-right')} title={m.label}>{m.short}</th>)}
                <th className={cn(TH, 'text-right')}>Companies</th>
                <th className={cn(TH, 'text-right')}>Docs</th>
                <th className={TH}>Joined</th>
                <th className={TH}>Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((u) => (
                <tr key={u.id} className="hover:bg-subtle/40">
                  <td className={TD}>
                    <p className="font-medium text-ink">{u.displayName || u.userName}</p>
                    <p className="text-xs text-muted">
                      @{u.userName}
                      {u.email && <> · {u.email}</>}
                      {!u.email && u.pendingEmail && <> · {u.pendingEmail} (unconfirmed)</>}
                    </p>
                  </td>
                  <td className={TD}>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={PLAN_TONE[u.plan] || PLAN_TONE.free}>{capitalize(u.plan)}</Badge>
                      {u.waitlist && <Badge className="bg-warning-soft text-warning">Wants {capitalize(u.waitlist)}</Badge>}
                    </div>
                  </td>
                  <td className={cn(TD, 'text-ink-2')}>{u.signIn}</td>
                  {METERS.map((m) => <td key={m.key} className={cn(TD, 'text-right')}><Num value={u.usage[m.key]} /></td>)}
                  <td className={cn(TD, 'text-right')}><Num value={u.companies} /></td>
                  <td className={cn(TD, 'text-right')}><Num value={u.documents} /></td>
                  <td className={cn(TD, 'text-ink-2')}>{formatDate(u.joinedAt)}</td>
                  <td className={cn(TD, 'text-ink-2')}>{u.lastActiveAt ? formatRelative(u.lastActiveAt) : <span className="text-faint">Never</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function AdminPage() {
  const { account } = useAccount();
  const isAdmin = account?.usage?.plan === 'admin';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const [overviewRes, usersRes] = await Promise.all([
          authenticatedFetch(`${API_URL}/api/admin/overview`),
          authenticatedFetch(`${API_URL}/api/admin/users`),
        ]);
        const [overview, users] = await Promise.all([overviewRes.json(), usersRes.json()]);
        if (!overviewRes.ok) throw new Error(overview.message || 'Could not load the overview');
        if (!usersRes.ok) throw new Error(users.message || 'Could not load users');
        setData({ ...overview, users });
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [isAdmin]);

  if (account && !isAdmin) {
    return (
      <PageContainer>
        <Card>
          <EmptyState
            icon={ShieldAlert}
            title="Admins only"
            description="This page is only available to Finvest AI admins."
            action={<Button href="/dashboard" variant="secondary">Back to your dashboard</Button>}
          />
        </Card>
      </PageContainer>
    );
  }

  const totals = data?.totals;

  return (
    <PageContainer>
      <PageHeader title="Admin" description="Everyone using Finvest AI, and how much." actions={<ViewSwitch />} />

      {error ? (
        <Card><EmptyState icon={ShieldAlert} title="Couldn't load the admin data" description={error} /></Card>
      ) : !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <div className="animate-fade-up space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
            <Stat label="Users" value={totals.users} />
            <Stat label="New this month" value={totals.newThisMonth} />
            <Stat
              label="Waitlist"
              value={totals.waitlist.pro + totals.waitlist.enterprise}
              note={`${totals.waitlist.pro} Pro, ${totals.waitlist.enterprise} Enterprise`}
            />
            <Stat label="Companies" value={totals.companies} />
            <Stat label="Indexed filings" value={totals.documents} />
            <Stat label="Research sessions" value={totals.sessions} />
          </div>

          {/* min-w-0 lets the wide tables scroll inside their cards instead of widening the page. */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_1.6fr] [&>*]:min-w-0">
            <WaitlistCard users={data.users} />
            <ActivityCard months={data.months} />
          </div>

          <UsersCard users={data.users} />
        </div>
      )}
    </PageContainer>
  );
}
