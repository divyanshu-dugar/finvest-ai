'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Send, Loader2, MessageSquare, User, Brain,
  Building2, Copy, Check, Sparkles, TrendingUp, FileText,
  BarChart2, ChevronRight,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

// ─── Citation chip parser ────────────────────────────────────────
function parseCitations(text) {
  const citationRegex = /\[Source:[^\]]+\]/g;
  const citations = [];
  const cleanText = text.replace(citationRegex, (match) => {
    citations.push(match.slice(1, -1).replace('Source: ', '').trim());
    return '';
  });
  return { cleanText: cleanText.trim(), citations };
}

function CitationChip({ citation }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 font-medium">
      <FileText className="w-2.5 h-2.5" />
      {citation}
    </span>
  );
}

// ─── Markdown components (styled for dark theme) ─────────────────
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
  hr: () => <hr className="border-slate-700 my-3" />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">
      {children}
    </a>
  ),
};

// ─── Message Bubble ───────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const { cleanText, citations } = isUser
    ? { cleanText: message.content, citations: [] }
    : parseCitations(message.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md shadow-violet-500/20">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`group relative max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm'
              : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-violet-400/10'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {cleanText}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {!isUser && citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {citations.map((c, i) => (
              <CitationChip key={i} citation={c} />
            ))}
          </div>
        )}

        {/* Copy button */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="mt-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="bg-slate-800 border border-violet-400/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
        <span className="text-xs text-slate-400">Analyzing</span>
        {[0, 0.2, 0.4].map((delay) => (
          <motion.div
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-violet-400"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Suggested questions by sector ───────────────────────────────
function getSuggestedQuestions(company) {
  if (!company) {
    return [
      'What are the key risk factors mentioned?',
      'Summarize the main competitive advantages.',
      'What is the revenue growth trend over 5 years?',
      'What are the management priorities going forward?',
    ];
  }
  const sector = (company.sector || '').toLowerCase();
  if (sector.includes('tech') || sector.includes('software') || sector.includes('internet')) {
    return [
      `What is ${company.name}'s revenue trend over the last 5 years?`,
      `What are ${company.name}'s main risk factors?`,
      `Calculate ${company.name}'s financial ratios including P/E and ROE.`,
      `What are ${company.name}'s main products and competitive advantages?`,
      `What was ${company.name}'s R&D spending last year?`,
    ];
  }
  if (sector.includes('financ') || sector.includes('bank') || sector.includes('insurance')) {
    return [
      `What are ${company.name}'s revenue and net income trends?`,
      `Calculate ${company.name}'s key financial ratios.`,
      `What are the regulatory risks for ${company.name}?`,
      `What is ${company.name}'s capital position and debt structure?`,
    ];
  }
  if (sector.includes('health') || sector.includes('pharma') || sector.includes('biotech')) {
    return [
      `What are ${company.name}'s main product lines and pipeline?`,
      `What are the key risk factors and regulatory challenges?`,
      `What was ${company.name}'s revenue and R&D expense last year?`,
      `Calculate ${company.name}'s financial ratios.`,
    ];
  }
  return [
    `What are ${company.name}'s main revenue streams?`,
    `What are the key risk factors for ${company.name}?`,
    `Show ${company.name}'s revenue trend over 5 years with CAGR.`,
    `Calculate ${company.name}'s financial ratios including P/E and ROE.`,
    `What is ${company.name}'s competitive position in its market?`,
  ];
}

// ─── Main page component ──────────────────────────────────────────
export default function ResearchChatPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionRenamed, setSessionRenamed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSessionData();
    fetchCompanies();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchSessionData = async () => {
    try {
      const [sessionRes, messagesRes] = await Promise.all([
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions/${sessionId}`),
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions/${sessionId}/messages`),
      ]);
      if (sessionRes.ok) {
        const s = await sessionRes.json();
        setSession(s);
        // If session was previously given a real name, mark as renamed
        if (s.sessionName && !s.sessionName.toLowerCase().includes('session')) {
          setSessionRenamed(true);
        }
      }
      if (messagesRes.ok) setMessages(await messagesRes.json());
    } catch (err) {
      toast.error('Failed to load session data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`);
      if (res.ok) setCompanies(await res.json());
    } catch (err) {
      // Non-critical
    }
  };

  const autoRenameSession = useCallback(async (firstMessage) => {
    if (sessionRenamed) return;
    const name = firstMessage.split(' ').slice(0, 7).join(' ').substring(0, 60);
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions/${sessionId}`,
        { method: 'PATCH', body: JSON.stringify({ sessionName: name }) }
      );
      if (res.ok) {
        setSession((prev) => ({ ...prev, sessionName: name }));
        setSessionRenamed(true);
      }
    } catch {
      // Non-critical
    }
  }, [sessionId, sessionRenamed]);

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || sending) return;
    setInput('');

    // Optimistically add user message
    const tempUserMsg = { role: 'user', content: userMessage, _id: `temp-${Date.now()}` };
    setMessages((p) => [...p, tempUserMsg]);
    setSending(true);

    // Auto-rename on first real message
    if (messages.length === 0) {
      autoRenameSession(userMessage);
    }

    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-message`, {
        method: 'POST',
        body: JSON.stringify({ sessionId, message: userMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((p) => [
          ...p.filter((m) => m._id !== tempUserMsg._id),
          data.userMessage,
          data.assistantMessage,
        ]);
      } else {
        setMessages((p) => p.filter((m) => m._id !== tempUserMsg._id));
        toast.error(data.error || 'Failed to get AI response.');
      }
    } catch (err) {
      setMessages((p) => p.filter((m) => m._id !== tempUserMsg._id));
      toast.error('Connection error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const company = session?.companyId
    ? (typeof session.companyId === 'object'
        ? session.companyId
        : companies.find((c) => c._id === session.companyId))
    : null;

  const suggestedQuestions = getSuggestedQuestions(company);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center animate-pulse">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 pt-16">
      {/* Chat Header */}
      <div className="bg-slate-900/90 backdrop-blur-sm border-b border-violet-400/15 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/research" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-500/20 to-indigo-600/20 border border-violet-400/20 flex items-center justify-center shrink-0">
            {company ? (
              <span className="text-lg">{company.emoji || '🏢'}</span>
            ) : (
              <MessageSquare className="w-4 h-4 text-violet-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{session?.sessionName || 'Research Session'}</div>
            {company && (
              <Link href={`/companies/${company._id}`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                {company.name} · {company.ticker}
              </Link>
            )}
          </div>
        </div>
        {/* Feature badges */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
            <BarChart2 className="w-2.5 h-2.5" /> SEC Data
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
            <FileText className="w-2.5 h-2.5" /> Cited
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Start your research</h3>
            <p className="text-slate-400 text-sm mb-2 max-w-sm">
              Ask anything about {company ? company.name : 'any company'}. I use live SEC data and your indexed documents, and always cite my sources.
            </p>

            {/* Capability badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[
                { icon: BarChart2, text: 'SEC Financials' },
                { icon: TrendingUp, text: 'Trend Analysis' },
                { icon: Sparkles, text: 'Ratio Calc' },
                { icon: FileText, text: 'Document Search' },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 border border-slate-700 px-2.5 py-1 rounded-full">
                  <Icon className="w-3 h-3 text-violet-400" />
                  {text}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-xs p-3 rounded-xl bg-slate-800/70 border border-violet-400/10 hover:border-violet-400/30 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-start gap-2"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}

        {sending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-900/90 backdrop-blur-sm border-t border-violet-400/15 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${company?.name || 'any company'}... (SEC data, trends, ratios, news)`}
              rows={1}
              className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 text-white placeholder-slate-500 text-sm resize-none transition-colors outline-none max-h-32 overflow-y-auto"
              style={{ minHeight: '48px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          Enter to send · Shift+Enter for new line · All answers cite sources from SEC filings
        </p>
      </div>
    </div>
  );
}
