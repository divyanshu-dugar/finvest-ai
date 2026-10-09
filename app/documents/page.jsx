'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FileText, Plus, Trash2, Loader2, Download, Building2, Check, ExternalLink } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { formatRelative } from '@/lib/format';
import CompanyLogo from '@/components/company/CompanyLogo';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardHeader, EmptyState, PageContainer, PageHeader, Skeleton } from '@/components/ui/Card';
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Values match the Document model's docType enum in the API.
const DOC_TYPES = [
  { value: 'sec_10k', label: 'SEC 10-K (annual)' },
  { value: 'sec_10q', label: 'SEC 10-Q (quarterly)' },
  { value: 'sec_8k', label: 'SEC 8-K (current report)' },
  { value: 'annual_report', label: 'Annual report' },
  { value: 'earnings_call', label: 'Earnings call transcript' },
  { value: 'press_release', label: 'Press release' },
  { value: 'analyst_report', label: 'Analyst report' },
  { value: 'news_article', label: 'News article' },
  { value: 'custom', label: 'Other' },
];
const DOCTYPE_LABELS = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

const SEC_FORMS = [
  { key: '10-K', label: '10-K', description: 'Annual report' },
  { key: '10-Q', label: '10-Q', description: 'Quarterly report' },
  { key: '8-K', label: '8-K', description: 'Current report' },
];

const POLL_MS = 5000;

const emptyForm = () => ({ title: '', docType: 'sec_10k', year: String(new Date().getFullYear()), sourceUrl: '', content: '' });

function ImportPanel({ onImport, onCancel, importing }) {
  const [forms, setForms] = useState(['10-K']);
  const toggle = (key) => setForms((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));

  return (
    <Card className="mb-6 animate-fade-up">
      <CardHeader title="Import SEC filings" description="Fetch the latest filings from SEC EDGAR and index them for search." />
      <div className="p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {SEC_FORMS.map((f) => {
            const selected = forms.includes(f.key);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggle(f.key)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors',
                  selected ? 'border-ink bg-canvas' : 'border-line hover:border-line-strong',
                )}
              >
                <span
                  className={cn(
                    'flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors',
                    selected ? 'border-ink bg-ink text-white' : 'border-line-strong',
                  )}
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block font-mono text-sm font-medium text-ink">{f.label}</span>
                  <span className="block text-xs text-muted">{f.description}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button icon={Download} loading={importing} disabled={forms.length === 0} onClick={() => onImport(forms)}>
            Import {forms.join(', ')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AddDocumentPanel({ companyId, onAdded, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await authenticatedFetch(`${API_URL}/documents`, {
        method: 'POST',
        body: JSON.stringify({ ...form, companyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to add document');
      onAdded(data.document);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 animate-fade-up">
      <CardHeader title="Add a document" description="Paste the text of a report, transcript or article. It will be split up and indexed." />
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="doc-title">Title</Label>
            <Input id="doc-title" value={form.title} onChange={set('title')} placeholder="Apple 2025 annual report" required />
          </div>
          <div>
            <Label htmlFor="doc-type">Type</Label>
            <Select id="doc-type" value={form.docType} onChange={set('docType')}>
              {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-year">Year</Label>
            <Input id="doc-year" value={form.year} onChange={set('year')} inputMode="numeric" placeholder="2025" />
          </div>
          <div>
            <Label htmlFor="doc-url" hint="Optional">Source URL</Label>
            <Input id="doc-url" type="url" value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://www.sec.gov/..." />
          </div>
        </div>
        <div>
          <Label htmlFor="doc-content">Content</Label>
          <Textarea id="doc-content" value={form.content} onChange={set('content')} rows={7} placeholder="Paste the document text here" required />
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={saving}>Add and index</Button>
        </div>
      </form>
    </Card>
  );
}

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const companyIdParam = searchParams.get('companyId');

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(companyIdParam || '');
  const [documents, setDocuments] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);
  const [panel, setPanel] = useState(null); // 'import' | 'add' | null

  useEffect(() => {
    (async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/companies`);
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
          if (!companyIdParam && data.length > 0) setSelectedCompany(data[0]._id);
        }
      } catch {
        toast.error('Failed to load companies');
      } finally {
        setLoadingCompanies(false);
      }
    })();
  }, [companyIdParam]);

  const fetchDocuments = useCallback(async (companyId, { quiet = false } = {}) => {
    if (!quiet) setLoadingDocs(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/documents?companyId=${companyId}`);
      if (res.ok) setDocuments(await res.json());
    } catch {
      if (!quiet) toast.error('Failed to load documents');
    } finally {
      if (!quiet) setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    setPanel(null);
    if (selectedCompany) fetchDocuments(selectedCompany);
    else setDocuments([]);
  }, [selectedCompany, fetchDocuments]);

  // Imports run in the background: refresh quietly until nothing is processing.
  const hasProcessing = documents.some((d) => d.status === 'processing');
  useEffect(() => {
    if (!hasProcessing || !selectedCompany) return;
    const id = setInterval(() => fetchDocuments(selectedCompany, { quiet: true }), POLL_MS);
    return () => clearInterval(id);
  }, [hasProcessing, selectedCompany, fetchDocuments]);

  const handleDelete = async (doc) => {
    if (!confirm(`Remove "${doc.title}" and its search index?`)) return;
    setDeleting(doc._id);
    try {
      const res = await authenticatedFetch(`${API_URL}/documents/${doc._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
    } catch {
      toast.error('Could not delete the document');
    } finally {
      setDeleting(null);
    }
  };

  const handleImport = async (forms) => {
    setImporting(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/documents/ingest`, {
        method: 'POST',
        body: JSON.stringify({ companyId: selectedCompany, docTypes: forms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Import failed');
      toast.success('Import started. This usually takes a minute or two.');
      setPanel(null);
      await fetchDocuments(selectedCompany, { quiet: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const currentCompany = companies.find((c) => c._id === selectedCompany);
  const togglePanel = (name) => setPanel((p) => (p === name ? null : name));

  return (
    <PageContainer size="lg">
      <PageHeader
        title="Documents"
        description="Filings and documents indexed for each company."
        actions={
          selectedCompany && (
            <>
              <Button variant="secondary" icon={Download} onClick={() => togglePanel('import')}>Import SEC filings</Button>
              <Button icon={Plus} onClick={() => togglePanel('add')}>Add document</Button>
            </>
          )
        }
      />

      {loadingCompanies ? (
        <Skeleton className="mb-6 h-10 w-80" />
      ) : companies.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <CompanyLogo ticker={currentCompany?.ticker} name={currentCompany?.name} sector={currentCompany?.sector} />
          <Select
            aria-label="Company"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full max-w-xs"
          >
            {companies.map((c) => (
              <option key={c._id} value={c._id}>{c.ticker ? `${c.name} (${c.ticker})` : c.name}</option>
            ))}
          </Select>
        </div>
      )}

      {panel === 'import' && (
        <ImportPanel importing={importing} onImport={handleImport} onCancel={() => setPanel(null)} />
      )}
      {panel === 'add' && (
        <AddDocumentPanel
          key={selectedCompany}
          companyId={selectedCompany}
          onCancel={() => setPanel(null)}
          onAdded={(doc) => {
            setDocuments((prev) => [doc, ...prev]);
            setPanel(null);
            toast.success('Document added');
          }}
        />
      )}

      <Card>
        {!loadingCompanies && companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Documents belong to a company. Add one first."
            action={<Button href="/companies/add" size="sm" icon={Plus}>Add company</Button>}
          />
        ) : loadingDocs || loadingCompanies ? (
          <div className="divide-y divide-line">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={`No documents for ${currentCompany?.name || 'this company'} yet`}
            description="Import filings from SEC EDGAR, or add a document by pasting its text."
            action={<Button size="sm" variant="secondary" icon={Download} onClick={() => setPanel('import')}>Import SEC filings</Button>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {documents.map((doc) => (
              <li key={doc._id} className="flex items-center gap-4 px-5 py-4">
                <div className="hidden size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas sm:flex">
                  <FileText className="size-4 text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{doc.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                    <span>{DOCTYPE_LABELS[doc.docType] || doc.docType}</span>
                    {doc.year && <span>· {doc.year}</span>}
                    {doc.status === 'completed' && <span>· {doc.chunkCount || 0} sections indexed</span>}
                    <span>· {formatRelative(doc.createdAt)}</span>
                    {doc.sourceUrl && (
                      <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-ink-2 hover:text-ink">
                        · Source <ExternalLink className="size-3" />
                      </a>
                    )}
                  </p>
                  {doc.status === 'failed' && doc.excerpt && (
                    <p className="mt-1 truncate text-xs text-negative" title={doc.excerpt}>{doc.excerpt}</p>
                  )}
                </div>
                <StatusBadge status={doc.status} className="shrink-0" />
                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  disabled={deleting === doc._id}
                  aria-label={`Delete ${doc.title}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-negative-soft hover:text-negative disabled:opacity-50"
                >
                  {deleting === doc._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
