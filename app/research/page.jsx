'use client';

import { useEffect, useState } from 'react';
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

function NewSessionForm({ companies, onCancel }) {
  const [form, setForm] = useState({ sessionName: '', companyId: '' });
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

export default function ResearchSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
        actions={<Button icon={Plus} onClick={() => setShowForm((v) => !v)}>New session</Button>}
      />

      {showForm && <NewSessionForm companies={companies} onCancel={() => setShowForm(false)} />}

      <Card>
        {loading ? (
          <div className="divide-y divide-line">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No research sessions yet"
            description="Start a session to ask questions about a company and keep the answers in one place."
            action={<Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>New session</Button>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((s) => {
              const company = s.companyId;
              return (
                <li key={s._id} className="group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas">
                  {company ? (
                    <CompanyLogo ticker={company.ticker} name={company.name} sector={company.sector} />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas">
                      <MessagesSquare className="size-4 text-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/research/${s._id}`} className="block truncate text-sm font-medium text-ink after:absolute after:inset-0">
                      {s.sessionName}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {company ? `${company.name} · ` : 'General research · '}
                      {formatRelative(s.updatedAt || s.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(s, e)}
                    disabled={deleting === s._id}
                    aria-label={`Delete ${s.sessionName}`}
                    className="relative z-10 flex size-8 items-center justify-center rounded-lg text-faint transition-[opacity,color,background-color] hover:bg-negative-soft hover:text-negative focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    {deleting === s._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                  <ChevronRight className="size-4 shrink-0 text-faint" />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
