'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import {
  Search, Building2, FileText, ChevronRight, ExternalLink,
  Loader2, Send, BookmarkPlus, MessageSquare, Sparkles,
  X, Check, Filter, AlertCircle, Info,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Markdown components (matching finvest-ai dark theme) ─────────
const markdownComponents = {
  h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-violet-300 mb-2 mt-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-200 mb-1.5 mt-2">{children}</h3>,
  p: ({ children }) => <p className="text-sm text-slate-200 leading-relaxed mb-2">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 pl-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 pl-2">{children}</ol>,
  li: ({ children }) => <li className="text-sm text-slate-200 leading-relaxed">{children}</li>,
  code: ({ inline, children }) =>
    inline ? (
      <code className="text-xs font-mono bg-slate-700 text-violet-300 px-1.5 py-0.5 rounded">{children}</code>
    ) : (
      <pre className="text-xs font-mono bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto mb-2 border border-slate-700">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-xs text-slate-200 border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-700/50">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-violet-300 border border-slate-600">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 border border-slate-700">{children}</td>,
  tr: ({ children }) => <tr className="even:bg-slate-800/30">{children}</tr>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-violet-500 pl-3 my-2 text-sm text-slate-400 italic">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">
      {children}
    </a>
  ),
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Left Panel: Company Search + Filings ─────────────────────────
function LeftPanel({ onCompanySelect, onFilingSelect, companyInfo, filings, selectedFiling, loadingFilings }) {
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
    if (!val.trim()) { setResults([]); setDropdownOpen(false); return; }
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
    setQuery(`${company.ticker ? company.ticker + ' — ' : ''}${company.name}`);
    setDropdownOpen(false);
    setResults([]);
    onCompanySelect(company);
  };

  const filteredFilings = filings.filter((f) => {
    if (filter === 'all') return true;
    return f.form === filter;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">SEC Explorer</p>
        <div className="relative" ref={wrapperRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setDropdownOpen(true)}
            placeholder="Search by ticker or name…"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />
          )}

          <AnimatePresence>
            {dropdownOpen && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
              >
                {results.map((r, i) => (
                  <button
                    key={`${r.cik}-${i}`}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/60 transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-violet-400 w-12 shrink-0">{r.ticker || '—'}</span>
                    <span className="text-sm text-slate-200 truncate">{r.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Company info strip */}
      {companyInfo && (
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{companyInfo.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {companyInfo.ticker && (
                  <span className="text-xs font-mono text-violet-300">{companyInfo.ticker}</span>
                )}
                {companyInfo.exchanges?.[0] && (
                  <span className="text-xs text-slate-500">{companyInfo.exchanges[0]}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filings list */}
      <div className="flex-1 overflow-y-auto">
        {loadingFilings ? (
          <div className="p-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <FileText className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">Search for a company to browse its SEC filings</p>
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 mb-3">
              {['all', '10-K', '10-Q'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                    filter === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500">{filteredFilings.length}</span>
            </div>

            {filteredFilings.map((filing) => {
              const isActive = selectedFiling?.accessionNumber === filing.accessionNumber;
              const is10K = filing.form === '10-K';
              return (
                <button
                  key={filing.accessionNumber}
                  onClick={() => onFilingSelect(filing)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? 'border-violet-500/50 bg-violet-500/10'
                      : 'border-transparent hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                      is10K
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {filing.form}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-200 font-medium">{formatDate(filing.filingDate)}</p>
                    <p className="text-xs text-slate-500 truncate">Period: {formatDate(filing.reportDate)}</p>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Center Panel: Filing Viewer ──────────────────────────────────
function CenterPanel({ companyInfo, selectedFiling, filingContent, loadingContent }) {
  const [viewMode, setViewMode] = useState('iframe'); // 'iframe' | 'text'
  const [iframeError, setIframeError] = useState(false);

  // Build SEC URL for the filing
  const secUrl = selectedFiling && companyInfo
    ? `https://www.sec.gov/Archives/edgar/data/${companyInfo.cikRaw || parseInt(companyInfo.cik)}/${selectedFiling.accessionClean}/${selectedFiling.primaryDocument}`
    : null;

  // Reset iframe error when filing changes
  useEffect(() => {
    setIframeError(false);
    setViewMode('iframe');
  }, [selectedFiling?.accessionNumber]);

  if (!selectedFiling) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-violet-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">SEC Filing Analyzer</h2>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
          Search for any publicly traded US company, then select a 10-K or 10-Q filing to view it here.
        </p>
        <div className="space-y-2.5 text-left w-full max-w-xs">
          {[
            { step: '1', text: 'Search for a company by name or ticker' },
            { step: '2', text: 'Select a filing from the list on the left' },
            { step: '3', text: 'Read the document and ask AI questions' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                {step}
              </span>
              <p className="text-xs text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadingContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-sm text-slate-400">Fetching filing from SEC EDGAR…</p>
        <p className="text-xs text-slate-600">Large filings may take a few moments</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              selectedFiling.form === '10-K'
                ? 'bg-violet-500/20 text-violet-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {selectedFiling.form}
          </span>
          <span className="text-sm text-white font-medium">
            {companyInfo?.name}
          </span>
          <span className="text-xs text-slate-500">{formatDate(selectedFiling.filingDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          {filingContent && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('iframe')}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${viewMode === 'iframe' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Live View
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${viewMode === 'text' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Text View
              </button>
            </div>
          )}
          {secUrl && (
            <a
              href={secUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/30 hover:border-violet-400/50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              SEC.gov
            </a>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'iframe' && secUrl && !iframeError ? (
          <div className="relative w-full h-full">
            <iframe
              key={secUrl}
              src={secUrl}
              className="w-full h-full border-0"
              title={`${selectedFiling.form} Filing`}
              onError={() => setIframeError(true)}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
            {/* Iframe notice banner */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 px-4 py-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <p className="text-xs text-slate-500">
                Viewing the official SEC filing — some documents may require text view. Use the <strong className="text-slate-400">AI Chat</strong> panel on the right to ask questions.
              </p>
              <button
                onClick={() => setViewMode('text')}
                className="ml-auto text-xs text-violet-400 hover:text-violet-300 shrink-0"
              >
                Switch to text
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6">
            {iframeError && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">
                  Live view blocked by SEC.gov — showing text version.{' '}
                  <a href={secUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Open on SEC.gov ↗
                  </a>
                </p>
              </div>
            )}
            {filingContent ? (
              <>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{filingContent.wordCount?.toLocaleString()} words</span>
                    <span>·</span>
                    <span>{Math.round(filingContent.textLength / 1024)} KB</span>
                  </div>
                </div>
                <div className="max-w-3xl mx-auto">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {filingContent.textContent}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin mb-3" />
                <p className="text-sm text-slate-400">Loading filing content…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Right Panel: AI Chat + Save Company ─────────────────────────
function RightPanel({ companyInfo, selectedFiling, filingContent, savedCompany, onSaveCompany, savingCompany }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  const isDisabled = !filingContent;

  // Clear chat when filing changes
  useEffect(() => {
    setMessages([]);
  }, [selectedFiling?.accessionNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = async (question) => {
    if (!question.trim() || !filingContent || thinking) return;
    const q = question.trim();
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setThinking(true);

    try {
      const res = await authenticatedFetch(`${API_URL}/api/sec/analyze`, {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          filingText: filingContent.textContent,
          companyInfo: companyInfo ? {
            name: companyInfo.name,
            ticker: companyInfo.ticker,
          } : {},
          conversationHistory: messages,
        }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `**Error:** Failed to analyze the filing. ${err.message}`,
      }]);
    } finally {
      setThinking(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!savedCompany) return;
    setCreatingSession(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions`, {
        method: 'POST',
        body: JSON.stringify({
          sessionName: sessionName.trim() || `${companyInfo?.name} — ${selectedFiling?.form} Analysis`,
          companyId: savedCompany._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Research session created!');
        router.push(`/research/${data._id}`);
      } else {
        toast.error(data.error || 'Failed to create session');
      }
    } catch {
      toast.error('Failed to create session');
    } finally {
      setCreatingSession(false);
    }
  };

  const suggestedQuestions = selectedFiling
    ? selectedFiling.form === '10-K'
      ? [
          'What are the main risk factors disclosed?',
          'What is the revenue trend over recent periods?',
          'Describe the competitive landscape.',
          'What is management\'s outlook for next year?',
          'What are the key business segments?',
        ]
      : [
          'What were the revenue and earnings this quarter?',
          'How did operating income change vs last quarter?',
          'Were there any significant one-time items?',
          'What does management say about guidance?',
          'What are the key risks highlighted?',
        ]
    : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Analyst</p>
            <p className="text-xs text-slate-500">
              {selectedFiling
                ? `Analyzing ${selectedFiling.form} · ${companyInfo?.ticker || 'company'}`
                : 'Load a filing to start'}
            </p>
          </div>
        </div>

        {/* Save Company / Research Session buttons */}
        {companyInfo && (
          <div className="flex items-center gap-2">
            {!savedCompany ? (
              <button
                onClick={onSaveCompany}
                disabled={savingCompany}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              >
                {savingCompany ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" />
                )}
                Save to My Companies
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </div>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Start Research Session
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto">
        {isDisabled ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">Select a filing to start asking questions about it</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {messages.length === 0 && suggestedQuestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 font-medium mb-2">Suggested questions</p>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-white transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                    <span className="text-xs text-slate-500 ml-2">Analyzing…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {!isDisabled && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this filing…"
              rows={2}
              className="flex-1 resize-none bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
            >
              {thinking ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
        </form>
      )}

      {/* Create Research Session Modal */}
      <AnimatePresence>
        {showSessionModal && savedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">New Research Session</h3>
                <button onClick={() => setShowSessionModal(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Session Name</label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder={`${companyInfo?.name} — ${selectedFiling?.form} Analysis`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl">
                  <Building2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-200">{savedCompany.name}</p>
                    {savedCompany.ticker && (
                      <p className="text-xs text-slate-500 font-mono">{savedCompany.ticker}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingSession}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {creatingSession ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Create & Go'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Explorer Page ────────────────────────────────────────────
export default function ExplorePage() {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [filings, setFilings] = useState([]);
  const [loadingFilings, setLoadingFilings] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [filingContent, setFilingContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [savedCompany, setSavedCompany] = useState(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const handleCompanySelect = useCallback(async (company) => {
    setLoadingFilings(true);
    setSelectedFiling(null);
    setFilingContent(null);
    setFilings([]);
    setSavedCompany(null);

    try {
      const res = await authenticatedFetch(
        `${API_URL}/companies/sec/filings/${company.cik || company.cikRaw}?forms=10-K,10-Q`
      );
      const data = await res.json();
      setCompanyInfo({
        ...data.companyInfo,
        cikRaw: company.cikRaw || parseInt(company.cik),
      });
      setFilings(data.filings || []);
    } catch (err) {
      toast.error('Failed to load filings');
      setCompanyInfo({
        name: company.name,
        ticker: company.ticker,
        cik: company.cik,
        cikRaw: company.cikRaw || parseInt(company.cik),
      });
    } finally {
      setLoadingFilings(false);
    }
  }, []);

  const handleFilingSelect = useCallback(async (filing) => {
    setSelectedFiling(filing);
    setFilingContent(null);
    setLoadingContent(true);

    try {
      const cik = companyInfo?.cikRaw || parseInt(companyInfo?.cik);
      const res = await authenticatedFetch(
        `${API_URL}/companies/sec/filing-content/${cik}/${filing.accessionNumber}?doc=${encodeURIComponent(filing.primaryDocument)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFilingContent(data);
    } catch (err) {
      toast.error('Failed to load filing content — try text view');
      setFilingContent(null);
    } finally {
      setLoadingContent(false);
    }
  }, [companyInfo]);

  const handleSaveCompany = async () => {
    if (!companyInfo || savingCompany) return;
    setSavingCompany(true);
    try {
      const sector = companyInfo.sicDescription
        ? deriveSectorFromSic(companyInfo.sicDescription)
        : 'Other';

      const res = await authenticatedFetch(`${API_URL}/companies`, {
        method: 'POST',
        body: JSON.stringify({
          name: companyInfo.name,
          ticker: companyInfo.ticker || '',
          sector,
          exchange: companyInfo.exchanges?.[0] || '',
          description: companyInfo.sicDescription ? `${companyInfo.name} — ${companyInfo.sicDescription}` : companyInfo.name,
          country: '',
          emoji: '🏢',
          color: '#8B5CF6',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSavedCompany(data);
        toast.success(`${companyInfo.name} added to My Companies`);
      } else if (res.status === 409 || data.error?.includes('duplicate')) {
        toast('Company already in your list', { icon: 'ℹ️' });
        setSavedCompany(data);
      } else {
        toast.error(data.error || 'Failed to save company');
      }
    } catch {
      toast.error('Failed to save company');
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 pt-16">
      {/* Left Panel */}
      <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
        <LeftPanel
          onCompanySelect={handleCompanySelect}
          onFilingSelect={handleFilingSelect}
          companyInfo={companyInfo}
          filings={filings}
          selectedFiling={selectedFiling}
          loadingFilings={loadingFilings}
        />
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-slate-800">
        <CenterPanel
          companyInfo={companyInfo}
          selectedFiling={selectedFiling}
          filingContent={filingContent}
          loadingContent={loadingContent}
        />
      </div>

      {/* Right Panel */}
      <div className="w-80 shrink-0 flex flex-col overflow-hidden relative">
        <RightPanel
          companyInfo={companyInfo}
          selectedFiling={selectedFiling}
          filingContent={filingContent}
          savedCompany={savedCompany}
          onSaveCompany={handleSaveCompany}
          savingCompany={savingCompany}
        />
      </div>
    </div>
  );
}

// Derive a rough sector from SEC SIC description
function deriveSectorFromSic(sicDescription) {
  const d = (sicDescription || '').toLowerCase();
  if (d.includes('software') || d.includes('computer') || d.includes('semiconductor') || d.includes('tech')) return 'Technology';
  if (d.includes('health') || d.includes('pharma') || d.includes('biotech') || d.includes('medical')) return 'Healthcare';
  if (d.includes('bank') || d.includes('financ') || d.includes('invest') || d.includes('insurance')) return 'Financial Services';
  if (d.includes('energy') || d.includes('oil') || d.includes('gas') || d.includes('petroleum')) return 'Energy';
  if (d.includes('retail') || d.includes('wholesale') || d.includes('food') || d.includes('beverag')) return 'Consumer Staples';
  if (d.includes('manufactur') || d.includes('industrial') || d.includes('machine')) return 'Industrials';
  if (d.includes('telecom') || d.includes('communicat') || d.includes('media')) return 'Communication Services';
  if (d.includes('real estate') || d.includes('reit')) return 'Real Estate';
  if (d.includes('utilities') || d.includes('electric') || d.includes('water')) return 'Utilities';
  return 'Other';
}
