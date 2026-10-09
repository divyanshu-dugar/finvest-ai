'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Building2, Plus, Search, FileText, Loader2, Trash2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import CompanyLogo from '@/components/company/CompanyLogo';
import SectorBadge from '@/components/company/SectorBadge';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { EmptyState, PageContainer, PageHeader, Skeleton } from '@/components/ui/Card';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CompanyListPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/companies`);
        if (res.ok) setCompanies(await res.json());
        else toast.error('Failed to load companies');
      } catch {
        toast.error('Failed to load companies');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (company, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete ${company.name} and all of its documents? This cannot be undone.`)) return;
    setDeleting(company._id);
    try {
      const res = await authenticatedFetch(`${API_URL}/companies/${company._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setCompanies((prev) => prev.filter((c) => c._id !== company._id));
      toast.success(`${company.name} deleted`);
    } catch {
      toast.error('Could not delete the company');
    } finally {
      setDeleting(null);
    }
  };

  const query = search.trim().toLowerCase();
  const filtered = companies.filter((c) =>
    [c.name, c.ticker, c.sector].some((v) => v?.toLowerCase().includes(query)),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Companies"
        description={loading ? 'Loading your workspaces' : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} tracked`}
        actions={<Button href="/companies/add" icon={Plus}>Add company</Button>}
      />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <Input
          type="search"
          placeholder="Search by name, ticker or sector"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search companies"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong">
          <EmptyState
            icon={Building2}
            title={search ? 'No matching companies' : 'No companies yet'}
            description={search ? 'Try a different name, ticker or sector.' : 'Add a company to create its research workspace.'}
            action={!search && <Button href="/companies/add" size="sm" icon={Plus}>Add company</Button>}
          />
        </div>
      ) : (
        <div className="grid animate-fade-up gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="group relative flex flex-col rounded-xl border border-line bg-surface p-5 shadow-card transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-pop"
            >
              <div className="flex items-start gap-3.5">
                <CompanyLogo ticker={c.ticker} name={c.name} sector={c.sector} size="md" />
                <div className="min-w-0 flex-1 pr-8">
                  <h3 className="truncate text-[15px] font-medium leading-snug text-ink">
                    {/* Stretched link: the whole card is clickable without nesting the delete button inside it. */}
                    <Link href={`/companies/${c._id}`} className="after:absolute after:inset-0 after:rounded-xl">
                      {c.name}
                    </Link>
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {c.ticker || 'No ticker'}
                    {c.exchange && <span className="text-faint"> · {c.exchange}</span>}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDelete(c, e)}
                disabled={deleting === c._id}
                aria-label={`Delete ${c.name}`}
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg text-faint transition-[opacity,color,background-color] hover:bg-negative-soft hover:text-negative focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                {deleting === c._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                {c.sector ? <SectorBadge sector={c.sector} /> : <span className="text-xs text-faint">No sector</span>}
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted tabular-nums">
                  <FileText className="size-3.5" />
                  {c.documentCount || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
