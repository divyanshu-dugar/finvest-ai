'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Building2, FileText, MessagesSquare, Plus, FileSearch, ArrowUpRight, ChevronRight } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { formatRelative, greeting } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import CompanyLogo from '@/components/company/CompanyLogo';
import SectorBadge from '@/components/company/SectorBadge';
import Button from '@/components/ui/Button';
import { Card, CardHeader, EmptyState, PageContainer, PageHeader, Skeleton } from '@/components/ui/Card';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function StatCard({ label, value, icon: Icon, href }) {
  return (
    <Link
      href={href}
      className="group min-w-0 rounded-xl border border-line bg-surface p-4 shadow-card transition-colors duration-150 hover:border-line-strong sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted sm:text-[13px]">{label}</span>
        <Icon className="hidden size-4 shrink-0 text-faint sm:block" />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="font-display text-[26px] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums sm:text-[34px]">
          {value}
        </span>
        <ArrowUpRight className="hidden size-4 text-faint transition-colors group-hover:text-ink sm:block" />
      </div>
    </Link>
  );
}

function ViewAll({ href }) {
  return (
    <Link href={href} className="flex items-center gap-0.5 text-[13px] font-medium text-muted hover:text-ink">
      View all <ChevronRight className="size-3.5" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl sm:h-29.5" />)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {[0, 1].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const [companiesRes, sessionsRes] = await Promise.all([
          authenticatedFetch(`${API_URL}/companies`),
          authenticatedFetch(`${API_URL}/api/research-sessions`),
        ]);
        if (!companiesRes.ok || !sessionsRes.ok) toast.error('Some dashboard data failed to load');
        setCompanies(companiesRes.ok ? await companiesRes.json() : []);
        setSessions(sessionsRes.ok ? await sessionsRes.json() : []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const documentCount = companies.reduce((sum, c) => sum + (c.documentCount || 0), 0);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting()}, ${user?.userName || ''}`}
        description={today}
        actions={
          <>
            <Button href="/explore" variant="secondary" icon={FileSearch}>SEC Explorer</Button>
            <Button href="/companies/add" icon={Plus}>Add company</Button>
          </>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="animate-fade-up">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Companies" value={companies.length} icon={Building2} href="/companies/list" />
            <StatCard label="Documents" value={documentCount} icon={FileText} href="/documents" />
            <StatCard label="Sessions" value={sessions.length} icon={MessagesSquare} href="/research" />
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Companies" description="Your most recent workspaces" action={companies.length > 0 && <ViewAll href="/companies/list" />} />
              {companies.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No companies yet"
                  description="Add a company to start reading its filings and asking questions."
                  action={<Button href="/companies/add" size="sm" icon={Plus}>Add company</Button>}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {companies.slice(0, 5).map((c) => (
                    <li key={c._id}>
                      <Link href={`/companies/${c._id}`} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-canvas">
                        <CompanyLogo ticker={c.ticker} name={c.name} sector={c.sector} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted">{c.ticker || 'No ticker'}</p>
                        </div>
                        <SectorBadge sector={c.sector} className="hidden sm:inline-flex" />
                        <span className="w-14 shrink-0 text-right text-xs text-muted tabular-nums">
                          {c.documentCount || 0} {c.documentCount === 1 ? 'doc' : 'docs'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Research sessions" description="Pick up where you left off" action={sessions.length > 0 && <ViewAll href="/research" />} />
              {sessions.length === 0 ? (
                <EmptyState
                  icon={MessagesSquare}
                  title="No sessions yet"
                  description="Start a session to ask questions about a company's filings."
                  action={<Button href="/research" size="sm" variant="secondary">Start a session</Button>}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {sessions.slice(0, 5).map((s) => (
                    <li key={s._id}>
                      <Link href={`/research/${s._id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{s.sessionName}</p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {s.companyId?.name ? `${s.companyId.name} · ` : ''}
                            {formatRelative(s.updatedAt || s.createdAt)}
                          </p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-faint" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
