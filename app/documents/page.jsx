'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FileText, Plus, Trash2, Loader2, Download, Building2, Check, ExternalLink } from 'lucide-react';
import { apiError, authenticatedFetch } from '@/lib/authenticate';
import { formatRelative } from '@/lib/format';
import CompanyLogo from '@/components/company/CompanyLogo';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { progressToast } from '@/components/ui/ProgressToast';
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

const FILING_SECTIONS = [
  { form: '10-K', title: 'Annual report' },
  { form: '10-Q', title: 'Quarterly reports' },
  { form: '8-K', title: 'Current reports' },
];
const MAX_FILINGS = 5; // Matches the API's limit per import.

const POLL_MS = 5000;

const emptyForm = () => ({ title: '', docType: 'sec_10k', year: String(new Date().getFullYear()), sourceUrl: '', content: '' });

const formatDay = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function filingPeriod({ form, reportDate, filingDate }) {
  if (form === '10-K') return `Year ended ${formatDay(reportDate)}`;
  if (form === '10-Q') return `Quarter ended ${formatDay(reportDate)}`;
  return `Filed ${formatDay(filingDate)}`;
}

function FilingOption({ filing, selected, disabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(filing)}
      aria-pressed={selected}
      disabled={filing.imported || disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed',
        selected ? 'border-ink bg-canvas' : 'border-line enabled:hover:border-line-strong',
        (filing.imported || disabled) && 'opacity-60',
      )}
    >
      <span
        className={cn(
          'flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors',
          selected || filing.imported ? 'border-ink bg-ink text-white' : 'border-line-strong',
        )}
      >
        {(selected || filing.imported) && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">{filingPeriod(filing)}</span>
      <span className="shrink-0 text-xs text-muted">
        {filing.imported ? 'Imported' : filing.form === '8-K' ? '' : `Filed ${formatDay(filing.filingDate)}`}
      </span>
    </button>
  );
}

function ImportPanel({ companyId, onImport, onCancel, importing }) {
  const [filings, setFilings] = useState(null);
  const [error, setError] = useState('');
  const [year, setYear] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/companies/${companyId}/filings`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFilings(data.filings);
        // Open on the latest year with an annual report, the filing people want most often.
        const start = data.filings.find((f) => f.form === '10-K') || data.filings[0];
        setYear(start?.reportDate.slice(0, 4) || '');
      } catch (err) {
        setError(err.message || 'Could not load filings from the SEC');
      }
    })();
  }, [companyId]);

  const years = [...new Set((filings || []).map((f) => f.reportDate.slice(0, 4)))].sort().reverse();
  const inYear = (filings || []).filter((f) => f.reportDate.startsWith(year));
  const isSelected = (filing) => selected.some((f) => f.accessionNumber === filing.accessionNumber);
  const toggle = (filing) => {
    setSelected((prev) => (isSelected(filing)
      ? prev.filter((f) => f.accessionNumber !== filing.accessionNumber)
      : [...prev, filing]));
  };
  const atLimit = selected.length >= MAX_FILINGS;

  return (
    <Card className="mb-6 animate-fade-up">
      <CardHeader
        title="Import SEC filings"
        description="Choose a year, then the filings you want. Each one becomes its own document."
        action={years.length > 0 && (
          <Select aria-label="Filing year" value={year} onChange={(e) => setYear(e.target.value)} className="w-28">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        )}
      />
      <div className="p-5">
        {error ? (
          <FieldError>{error}</FieldError>
        ) : !filings ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted" /></div>
        ) : filings.length === 0 ? (
          <p className="text-sm text-muted">The SEC has no 10-K, 10-Q or 8-K filings for this company.</p>
        ) : (
          <div className="space-y-5">
            {FILING_SECTIONS.map(({ form, title }) => {
              const rows = inYear.filter((f) => f.form === form);
              return (
                <section key={form}>
                  <h3 className="mb-2 flex items-baseline gap-2 text-[13px] font-medium text-ink">
                    {title} <span className="font-mono text-xs font-normal text-muted">{form}</span>
                  </h3>
                  {rows.length === 0 ? (
                    <p className="text-[13px] text-muted">None for {year}.</p>
                  ) : (
                    <div className="scrollbar-thin grid max-h-56 gap-1.5 overflow-y-auto sm:grid-cols-2">
                      {rows.map((f) => (
                        <FilingOption
                          key={f.accessionNumber}
                          filing={f}
                          selected={isSelected(f)}
                          disabled={atLimit && !isSelected(f)}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <p className="mr-auto text-xs text-muted">Up to {MAX_FILINGS} filings at a time. Each counts as one import.</p>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button icon={Download} loading={importing} disabled={selected.length === 0} onClick={() => onImport(selected)}>
            {selected.length === 0 ? 'Import' : `Import ${selected.length} ${selected.length === 1 ? 'filing' : 'filings'}`}
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

function DocumentCard({ doc, deleting, onDelete }) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas px-1.5">
          {doc.form ? <span className="font-mono text-[11px] font-medium text-ink-2">{doc.form}</span> : <FileText className="size-4 text-muted" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-ink">{doc.title}</p>
          <p className="mt-1 text-xs text-muted">
            {[DOCTYPE_LABELS[doc.docType] || doc.docType, doc.status === 'completed' && `${doc.chunkCount || 0} sections`, formatRelative(doc.createdAt)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(doc)}
          disabled={deleting}
          aria-label={`Delete ${doc.title}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-negative-soft hover:text-negative disabled:opacity-50"
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>
      {doc.status === 'failed' && doc.excerpt && (
        <p className="mt-2 line-clamp-2 text-xs text-negative" title={doc.excerpt}>{doc.excerpt}</p>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
        <StatusBadge status={doc.status} />
        {doc.sourceUrl && (
          <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink">
            Source <ExternalLink className="size-3" />
          </a>
        )}
      </div>
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

  // The "import started" toast closes early once every document it started has finished.
  const importToast = useRef(null);
  useEffect(() => {
    const pending = importToast.current;
    if (!pending) return;
    const done = pending.documentIds.every((docId) => {
      const doc = documents.find((d) => d._id === docId);
      return doc && doc.status !== 'processing';
    });
    if (done) {
      toast.dismiss(pending.id);
      importToast.current = null;
    }
  }, [documents]);

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

  const handleImport = async (filings) => {
    setImporting(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/documents/ingest`, {
        method: 'POST',
        body: JSON.stringify({ companyId: selectedCompany, filings }),
      });
      const data = await res.json();
      if (!res.ok) throw apiError(res, data, 'Import failed');
      if (importToast.current) toast.dismiss(importToast.current.id);
      importToast.current = data.documentIds?.length
        ? {
            id: progressToast('Import started. This usually takes a minute or two.', { duration: 20000 }),
            documentIds: data.documentIds,
          }
        : null;
      if (!importToast.current) toast.success('Those filings are already imported.');
      setPanel(null);
      await fetchDocuments(selectedCompany, { quiet: true });
    } catch (err) {
      if (!err.isQuota) toast.error(err.message);
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
        <ImportPanel key={selectedCompany} companyId={selectedCompany} importing={importing} onImport={handleImport} onCancel={() => setPanel(null)} />
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

      {!loadingCompanies && companies.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Documents belong to a company. Add one first."
            action={<Button href="/companies/add" size="sm" icon={Plus}>Add company</Button>}
          />
        </Card>
      ) : loadingDocs || loadingCompanies ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={`No documents for ${currentCompany?.name || 'this company'} yet`}
            description="Import filings from SEC EDGAR, or add a document by pasting its text."
            action={<Button size="sm" variant="secondary" icon={Download} onClick={() => setPanel('import')}>Import SEC filings</Button>}
          />
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {documents.map((doc) => (
            <li key={doc._id}>
              <DocumentCard doc={doc} deleting={deleting === doc._id} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
