'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessagesSquare, Plus, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { formatRelative } from '@/lib/format';
import CompanyLogo from '@/components/company/CompanyLogo';
import Button from '@/components/ui/Button';
import { Card, CardHeader, EmptyState, PageContainer, PageHeader, Skeleton } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Field';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GENERAL = 'general';

const lastActivity = (s) => new Date(s.updatedAt || s.createdAt).getTime();

/**
 * One group per company (plus "General research"), each listing that company's sessions.
 * Groups are ordered by their most recent session.
 */
function groupSessionsByCompany(sessions) {
  const groups = new Map();
  for (const s of sessions) {
    const company = s.companyId && typeof s.companyId === 'object' ? s.companyId : null;
    const key = company ? company._id : GENERAL;
    if (!groups.has(key)) groups.set(key, { key, company, sessions: [] });
    groups.get(key).sessions.push(s);
  }
  for (const g of groups.values()) g.sessions.sort((a, b) => lastActivity(b) - lastActivity(a));
  return [...groups.values()].sort((a, b) => lastActivity(b.sessions[0]) - lastActivity(a.sessions[0]));
}

function NewSessionForm({ companies, initialCompanyId, onCancel }) {
  const [form, setForm] = useState({ sessionName: '', companyId: initialCompanyId || '' });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the session');
      router.push(`/research/${data._id}`);
    } catch (err) {
      toast.error(err.message);
      setCreating(false);
    }
  };

  return (
    <Card className="mb-6 animate-fade-up">
      <CardHeader title="New research session" description="Sessions keep the full conversation, so you can come back to it." />
      <form onSubmit={handleCreate} className="space-y-5 p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="session-name">Name</Label>
            <Input
              id="session-name"
              value={form.sessionName}
              onChange={(e) => setForm({ ...form, sessionName: e.target.value })}
              placeholder="Apple revenue analysis"
              autoFocus
              required
            />
          </div>
          <div>
            <Label htmlFor="session-company" hint="Optional">Company</Label>
            <Select
              id="session-company"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">General research</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.ticker ? `${c.name} (${c.ticker})` : c.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={creating}>Create and open</Button>
        </div>
      </form>
    </Card>
  );
}

function SessionRow({ session, deleting, onDelete }) {
  return (
    <li className="group relative flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas">
      <div className="min-w-0 flex-1">
        <Link href={`/research/${session._id}`} className="block truncate text-sm font-medium text-ink after:absolute after:inset-0">
          {session.sessionName}
        </Link>
        <p className="mt-0.5 text-xs text-muted">{formatRelative(session.updatedAt || session.createdAt)}</p>
      </div>
      <button
        type="button"
        onClick={(e) => onDelete(session, e)}
        disabled={deleting}
        aria-label={`Delete ${session.sessionName}`}
        className="relative z-10 flex size-8 items-center justify-center rounded-lg text-faint transition-[opacity,color,background-color] hover:bg-negative-soft hover:text-negative focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
      <ChevronRight className="size-4 shrink-0 text-faint" />
    </li>
  );
}

function CompanyGroup({ group, deletingId, onDelete, onNewSession }) {
  const { company, sessions } = group;
  const count = `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`;

  return (
    <Card>
      <div className="flex items-center gap-3.5 border-b border-line px-5 py-4">
        {company ? (
          <CompanyLogo ticker={company.ticker} name={company.name} sector={company.sector} />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas">
            <MessagesSquare className="size-4 text-muted" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {company ? (
            <Link href={`/companies/${company._id}`} className="block truncate text-[15px] font-medium text-ink hover:underline hover:underline-offset-4">
              {company.name}
            </Link>
          ) : (
            <p className="text-[15px] font-medium text-ink">General research</p>
          )}
          <p className="mt-0.5 text-xs text-muted">
            {company?.ticker && <span className="font-mono">{company.ticker} · </span>}
            {count}
          </p>
        </div>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => onNewSession(company?._id)}>
          <span className="hidden sm:inline">New session</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
      <ul className="divide-y divide-line">
        {sessions.map((s) => (
          <SessionRow key={s._id} session={s} deleting={deletingId === s._id} onDelete={onDelete} />
        ))}
      </ul>
    </Card>
  );
}

export default function ResearchSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  // null = form hidden; otherwise the company to preselect ('' for general research).
  const [formCompanyId, setFormCompanyId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sessionsRes, companiesRes] = await Promise.all([
          authenticatedFetch(`${API_URL}/api/research-sessions`),
          authenticatedFetch(`${API_URL}/companies`),
        ]);
        if (sessionsRes.ok) setSessions(await sessionsRes.json());
        if (companiesRes.ok) setCompanies(await companiesRes.json());
      } catch {
        toast.error('Failed to load research sessions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => groupSessionsByCompany(sessions), [sessions]);

  const openForm = (companyId = '') => {
    setFormCompanyId(companyId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (session, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${session.sessionName}"?`)) return;
    setDeleting(session._id);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions/${session._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSessions((prev) => prev.filter((s) => s._id !== session._id));
    } catch {
      toast.error('Could not delete the session');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <PageContainer size="lg">
      <PageHeader
        title="Research chat"
        description="Conversations about a company, grounded in its filings and your documents."
        actions={<Button icon={Plus} onClick={() => (formCompanyId === null ? openForm() : setFormCompanyId(null))}>New session</Button>}
      />

      {formCompanyId !== null && (
        <NewSessionForm
          key={formCompanyId}
          companies={companies}
          initialCompanyId={formCompanyId}
          onCancel={() => setFormCompanyId(null)}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessagesSquare}
            title="No research sessions yet"
            description="Start a session to ask questions about a company and keep the answers in one place."
            action={<Button size="sm" icon={Plus} onClick={() => openForm()}>New session</Button>}
          />
        </Card>
      ) : (
        <div className="animate-fade-up space-y-4">
          {groups.map((g) => (
            <CompanyGroup key={g.key} group={g} deletingId={deleting} onDelete={handleDelete} onNewSession={openForm} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
