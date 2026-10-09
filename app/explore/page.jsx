'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Search, FileText, ExternalLink, Loader2, ArrowUp, BookmarkPlus, Check,
  MessagesSquare, X, AlertCircle, FileSearch,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { formatDate } from '@/lib/format';
import { LogoMark } from '@/components/Logo';
import Markdown from '@/components/Markdown';
import CompanyLogo from '@/components/company/CompanyLogo';
import SectorBadge from '@/components/company/SectorBadge';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const MOBILE_PANELS = [
  { id: 'filings', label: 'Filings' },
  { id: 'document', label: 'Document' },
  { id: 'analyst', label: 'Analyst' },
];

function SegmentedControl({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-lg bg-subtle p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            'flex-1 rounded-md px-3 py-1 text-[13px] font-medium transition-colors',
            value === o.id ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Left: company search and filings ────────────────────────────

function FilingsPanel({ onCompanySelect, onFilingSelect, companyInfo, filings, selectedFiling, loadingFilings }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState('all');
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/companies/sec/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setDropdownOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (company) => {
    setQuery(company.ticker ? `${company.ticker} · ${company.name}` : company.name);
    setDropdownOpen(false);
    setResults([]);
    onCompanySelect(company);
  };

  const visibleFilings = filter === 'all' ? filings : filings.filter((f) => f.form === filter);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line p-4">
        <div className="relative" ref={wrapperRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setDropdownOpen(true)}
            placeholder="Search a company or ticker"
            className="pl-9 pr-9"
            aria-label="Search companies"
            autoComplete="off"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />}

          {dropdownOpen && results.length > 0 && (
            <ul className="absolute z-30 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-pop animate-fade-up">
              {results.map((r, i) => (
                <li key={`${r.cik}-${i}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-canvas"
                  >
                    <CompanyLogo ticker={r.ticker} name={r.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.name}</span>
                    <span className="font-mono text-xs text-muted">{r.ticker}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {companyInfo && (
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <CompanyLogo ticker={companyInfo.ticker} name={companyInfo.name} sector={companyInfo.sector} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{companyInfo.name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              {companyInfo.ticker && <span className="font-mono text-xs text-muted">{companyInfo.ticker}</span>}
              {companyInfo.exchanges?.[0] && <span className="text-xs text-faint">{companyInfo.exchanges[0]}</span>}
            </div>
            <SectorBadge sector={companyInfo.sector} className="mt-1.5" />
          </div>
        </div>
      )}

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {loadingFilings ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-subtle" />)}
          </div>
        ) : filings.length === 0 ? (
          <EmptyState icon={FileSearch} title="No company selected" description="Search for a company to browse its 10-K and 10-Q filings." />
        ) : (
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <SegmentedControl
                options={[{ id: 'all', label: 'All' }, { id: '10-K', label: '10-K' }, { id: '10-Q', label: '10-Q' }]}
                value={filter}
                onChange={setFilter}
              />
              <span className="text-xs text-muted tabular-nums">{visibleFilings.length}</span>
            </div>
            <ul className="space-y-0.5">
              {visibleFilings.map((filing) => {
                const active = selectedFiling?.accessionNumber === filing.accessionNumber;
                return (
                  <li key={filing.accessionNumber}>
                    <button
                      type="button"
                      onClick={() => onFilingSelect(filing)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        active ? 'bg-subtle' : 'hover:bg-canvas',
                      )}
                    >
                      <span
                        className={cn(
                          'w-11 shrink-0 rounded-md py-0.5 text-center font-mono text-[11px] font-medium',
                          filing.form === '10-K' ? 'bg-ink text-white' : 'bg-surface text-ink-2 ring-1 ring-line',
                        )}
                      >
                        {filing.form}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-ink">{formatDate(filing.filingDate)}</span>
                        <span className="block truncate text-xs text-muted">Period ending {formatDate(filing.reportDate)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Center: filing viewer ───────────────────────────────────────

function DocumentPanel({ companyInfo, selectedFiling, filingContent, loadingContent }) {
  const [viewMode, setViewMode] = useState('rendered');
  const [htmlError, setHtmlError] = useState(false);
  const [filingHtml, setFilingHtml] = useState(null);
  const [loadingHtml, setLoadingHtml] = useState(false);

  const cik = companyInfo ? companyInfo.cikRaw || parseInt(companyInfo.cik) : null;
  const secUrl = selectedFiling && cik
    ? `https://www.sec.gov/Archives/edgar/data/${cik}/${selectedFiling.accessionClean}/${selectedFiling.primaryDocument}`
    : null;

  // sec.gov sends X-Frame-Options: SAMEORIGIN, so it can't be framed directly.
  // The API proxies the filing HTML and we render it in a sandboxed srcDoc iframe instead.
  useEffect(() => {
    setHtmlError(false);
    setViewMode('rendered');
    setFilingHtml(null);
    if (!selectedFiling || !cik) return;

    let cancelled = false;
    setLoadingHtml(true);
    authenticatedFetch(
      `${API_URL}/companies/sec/filing-html/${cik}/${selectedFiling.accessionNumber}?doc=${encodeURIComponent(selectedFiling.primaryDocument)}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => { if (!cancelled) setFilingHtml(html); })
      .catch(() => { if (!cancelled) setHtmlError(true); })
      .finally(() => { if (!cancelled) setLoadingHtml(false); });

    return () => { cancelled = true; };
  }, [selectedFiling?.accessionNumber, cik]);

  if (!selectedFiling) {
    return (
      <EmptyState
        icon={FileText}
        title="Pick a filing to read"
        description="Search for a company, choose a 10-K or 10-Q, and it opens here. The analyst on the right can answer questions about it."
        className="h-full"
      />
    );
  }

  const showRendered = viewMode === 'rendered' && !htmlError;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">{selectedFiling.form}</span>
          <span className="truncate text-sm font-medium text-ink">{companyInfo?.name}</span>
          <span className="hidden text-xs text-muted sm:inline">Filed {formatDate(selectedFiling.filingDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            options={[{ id: 'rendered', label: 'Filing' }, { id: 'text', label: 'Text' }]}
            value={htmlError ? 'text' : viewMode}
            onChange={setViewMode}
          />
          {secUrl && (
            <Button href={secUrl} target="_blank" rel="noopener noreferrer" size="sm" variant="ghost" className="gap-1">
              SEC.gov <ExternalLink className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {showRendered ? (
          loadingHtml ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="size-5 animate-spin text-muted" />
              <p className="text-[13px] text-muted">Loading the filing from SEC EDGAR</p>
            </div>
          ) : (
            filingHtml && (
              // No allow-scripts or allow-same-origin: the filing renders as inert, isolated HTML.
              <iframe
                key={selectedFiling.accessionNumber}
                srcDoc={filingHtml}
                title={`${selectedFiling.form} filing`}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                className="size-full border-0 bg-white"
              />
            )
          )
        ) : (
          <div className="scrollbar-thin h-full overflow-y-auto px-5 py-6 sm:px-8">
            {htmlError && (
              <div className="mx-auto mb-5 flex max-w-3xl items-center gap-2 rounded-lg border border-warning/20 bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
                <AlertCircle className="size-4 shrink-0" />
                The formatted filing isn&apos;t available, so this is the text version.
              </div>
            )}
            {loadingContent ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="size-5 animate-spin text-muted" /></div>
            ) : filingContent?.textContent ? (
              <article className="mx-auto max-w-3xl">
                <p className="mb-5 text-xs text-muted tabular-nums">
                  {filingContent.wordCount?.toLocaleString()} words · {Math.round(filingContent.textLength / 1024)} KB
                </p>
                <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">{filingContent.textContent}</div>
              </article>
            ) : (
              <EmptyState icon={FileText} title="No readable text" description="This filing has no text that could be extracted. Try the SEC.gov link." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Right: analyst chat ─────────────────────────────────────────

function suggestedQuestionsFor(filing) {
  if (!filing) return [];
  return filing.form === '10-K'
    ? [
        'What are the main risk factors?',
        'How has revenue changed over recent years?',
        'Describe the competitive landscape.',
        'What are the key business segments?',
      ]
    : [
        'What were revenue and earnings this quarter?',
        'How did operating income change from last year?',
        'Were there any significant one-time items?',
        'What does management say about the outlook?',
      ];
}

function NewSessionDialog({ companyInfo, selectedFiling, savedCompany, onClose }) {
  const defaultName = `${companyInfo?.name} ${selectedFiling?.form || ''} analysis`.trim();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions`, {
        method: 'POST',
        body: JSON.stringify({ sessionName: name.trim() || defaultName, companyId: savedCompany._id }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] animate-fade-up" onClick={onClose} />
      <form
        onSubmit={handleCreate}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-session-title"
        className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-pop animate-fade-up"
      >
        <div className="flex items-center justify-between">
          <h2 id="new-session-title" className="font-display text-lg font-medium text-ink">New research session</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5">
          <Label htmlFor="session-name">Name</Label>
          <Input id="session-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={defaultName} autoFocus />
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-canvas p-3">
          <CompanyLogo ticker={savedCompany.ticker} name={savedCompany.name} sector={savedCompany.sector} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{savedCompany.name}</p>
            {savedCompany.ticker && <p className="font-mono text-xs text-muted">{savedCompany.ticker}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={creating}>Create and open</Button>
        </div>
      </form>
    </div>
  );
}

function AnalystPanel({ companyInfo, selectedFiling, filingContent, savedCompany, onSaveCompany, savingCompany }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const scrollRef = useRef(null);

  const canChat = Boolean(filingContent?.textContent);

  useEffect(() => setMessages([]), [selectedFiling?.accessionNumber]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = async (question) => {
    const q = question.trim();
    if (!q || !canChat || thinking) return;
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setThinking(true);

    try {
      const res = await authenticatedFetch(`${API_URL}/api/sec/analyze`, {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          filingText: filingContent.textContent,
          companyInfo: companyInfo ? { name: companyInfo.name, ticker: companyInfo.ticker } : {},
          conversationHistory: messages,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', content: err.message }]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line p-4">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-6" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Analyst</p>
            <p className="truncate text-xs text-muted">
              {selectedFiling ? `Reading the ${selectedFiling.form} for ${companyInfo?.ticker || companyInfo?.name}` : 'Open a filing to start'}
            </p>
          </div>
        </div>

        {companyInfo && (
          <div className="mt-3.5 flex gap-2">
            {savedCompany ? (
              <>
                <span className="flex h-8 items-center gap-1.5 rounded-lg bg-positive-soft px-2.5 text-[13px] font-medium text-positive">
                  <Check className="size-3.5" /> Saved
                </span>
                <Button size="sm" icon={MessagesSquare} className="flex-1" onClick={() => setShowSessionDialog(true)}>
                  Research session
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" icon={BookmarkPlus} loading={savingCompany} onClick={onSaveCompany} className="flex-1">
                Save to companies
              </Button>
            )}
          </div>
        )}
      </div>

      <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {!canChat ? (
          <EmptyState
            icon={MessagesSquare}
            title={filingContent ? 'Chat unavailable for this filing' : 'Ask about any filing'}
            description={filingContent ? 'No readable text could be extracted from this filing.' : 'Select a filing and ask questions about it in plain English.'}
          />
        ) : (
          <div className="space-y-5 p-4">
            {messages.length === 0 && (
              <div>
                <p className="mb-2 text-xs text-muted">Try asking</p>
                <div className="space-y-1.5">
                  {suggestedQuestionsFor(selectedFiling).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="w-full rounded-lg border border-line px-3 py-2 text-left text-[13px] leading-snug text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="flex animate-fade-up justify-end">
                  <p className="max-w-[90%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[13px] leading-relaxed text-white">{msg.content}</p>
                </div>
              ) : msg.role === 'error' ? (
                <div key={i} className="flex animate-fade-up items-start gap-2 rounded-lg border border-negative/20 bg-negative-soft px-3 py-2.5 text-[13px] text-negative">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {msg.content}
                </div>
              ) : (
                <div key={i} className="animate-fade-up">
                  <Markdown className="text-[13px]">{msg.content}</Markdown>
                  <p className="mt-2 text-[11px] text-faint">AI-generated. Verify against the filing.</p>
                </div>
              ),
            )}

            {thinking && (
              <div className="flex items-center gap-2 text-[13px] text-muted">
                <Loader2 className="size-3.5 animate-spin" /> Reading the filing
              </div>
            )}
          </div>
        )}
      </div>

      {canChat && (
        <div className="shrink-0 border-t border-line p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-end gap-2 rounded-xl border border-line bg-surface p-1.5 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this filing"
              rows={2}
              aria-label="Question"
              className="min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] leading-normal text-ink outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink text-white transition-colors hover:bg-ink-2 disabled:bg-line-strong"
            >
              {thinking ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </button>
          </form>
        </div>
      )}

      {showSessionDialog && savedCompany && (
        <NewSessionDialog
          companyInfo={companyInfo}
          selectedFiling={selectedFiling}
          savedCompany={savedCompany}
          onClose={() => setShowSessionDialog(false)}
        />
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [filings, setFilings] = useState([]);
  const [loadingFilings, setLoadingFilings] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [filingContent, setFilingContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  const [savedCompany, setSavedCompany] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('filings');

  // Load the user's companies once so an already-saved company shows as saved.
  useEffect(() => {
    authenticatedFetch(`${API_URL}/companies`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setMyCompanies)
      .catch(() => {});
  }, []);

  const handleCompanySelect = useCallback(async (company) => {
    setLoadingFilings(true);
    setSelectedFiling(null);
    setFilingContent(null);
    setFilings([]);
    setMobilePanel('filings');

    const cikRaw = company.cikRaw || parseInt(company.cik);
    try {
      const res = await authenticatedFetch(`${API_URL}/companies/sec/filings/${company.cik || cikRaw}?forms=10-K,10-Q`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanyInfo({ ...data.companyInfo, cikRaw });
      setFilings(data.filings || []);
    } catch {
      toast.error('Failed to load filings');
      setCompanyInfo({ name: company.name, ticker: company.ticker, cik: company.cik, cikRaw });
    } finally {
      setLoadingFilings(false);
    }
  }, []);

  useEffect(() => {
    const ticker = companyInfo?.ticker?.toUpperCase();
    setSavedCompany(ticker ? myCompanies.find((c) => c.ticker === ticker) || null : null);
  }, [companyInfo, myCompanies]);

  const handleFilingSelect = useCallback(async (filing) => {
    setSelectedFiling(filing);
    setFilingContent(null);
    setLoadingContent(true);
    setMobilePanel('document');

    try {
      const cik = companyInfo?.cikRaw || parseInt(companyInfo?.cik);
      const res = await authenticatedFetch(
        `${API_URL}/companies/sec/filing-content/${cik}/${filing.accessionNumber}?doc=${encodeURIComponent(filing.primaryDocument)}`,
      );
      if (!res.ok) throw new Error();
      setFilingContent(await res.json());
    } catch {
      toast.error('Could not load the filing text, so the analyst is unavailable for it');
    } finally {
      setLoadingContent(false);
    }
  }, [companyInfo]);

  const handleSaveCompany = async () => {
    if (!companyInfo || savingCompany) return;
    setSavingCompany(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/companies`, {
        method: 'POST',
        body: JSON.stringify({
          name: companyInfo.name,
          ticker: companyInfo.ticker || '',
          sector: companyInfo.sector || 'Other',
          exchange: companyInfo.exchanges?.[0] || '',
          description: companyInfo.sicDescription ? `${companyInfo.name}. ${companyInfo.sicDescription}.` : '',
          country: 'United States',
        }),
      });
      const data = await res.json();
      if (res.ok || (res.status === 409 && data.company)) {
        setMyCompanies((prev) => (prev.some((c) => c._id === data.company._id) ? prev : [data.company, ...prev]));
        toast.success(res.ok ? `${companyInfo.name} saved to your companies` : data.message);
      } else {
        throw new Error(data.message || 'Could not save the company');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingCompany(false);
    }
  };

  const panelClass = (id) => cn('min-h-0 flex-col bg-surface', mobilePanel === id ? 'flex' : 'hidden', 'xl:flex');

  return (
    <div className="flex h-app flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 xl:hidden">
        <SegmentedControl options={MOBILE_PANELS} value={mobilePanel} onChange={setMobilePanel} className="w-full max-w-sm" />
      </div>

      <div className="flex min-h-0 flex-1">
        <section aria-label="Filings" className={cn(panelClass('filings'), 'w-full xl:w-72 xl:shrink-0 xl:border-r xl:border-line')}>
          <FilingsPanel
            onCompanySelect={handleCompanySelect}
            onFilingSelect={handleFilingSelect}
            companyInfo={companyInfo}
            filings={filings}
            selectedFiling={selectedFiling}
            loadingFilings={loadingFilings}
          />
        </section>

        <section aria-label="Document" className={cn(panelClass('document'), 'w-full min-w-0 xl:flex-1 xl:border-r xl:border-line')}>
          <DocumentPanel
            companyInfo={companyInfo}
            selectedFiling={selectedFiling}
            filingContent={filingContent}
            loadingContent={loadingContent}
          />
        </section>

        <section aria-label="Analyst" className={cn(panelClass('analyst'), 'w-full xl:w-88 xl:shrink-0')}>
          <AnalystPanel
            companyInfo={companyInfo}
            selectedFiling={selectedFiling}
            filingContent={filingContent}
            savedCompany={savedCompany}
            onSaveCompany={handleSaveCompany}
            savingCompany={savingCompany}
          />
        </section>
      </div>
    </div>
  );
}
