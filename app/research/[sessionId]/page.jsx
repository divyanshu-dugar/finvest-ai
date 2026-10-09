'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowUp, Loader2, MessagesSquare, Copy, Check, Quote } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { LogoMark } from '@/components/Logo';
import Markdown from '@/components/Markdown';
import CompanyLogo from '@/components/company/CompanyLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Pull "[Source: ...]" markers out of the answer so they render as chips under it.
function parseCitations(text) {
  const citations = [];
  const cleanText = text.replace(/\[Source:[^\]]+\]/g, (match) => {
    citations.push(match.slice(1, -1).replace('Source: ', '').trim());
    return '';
  });
  return { cleanText: cleanText.trim(), citations };
}

function AssistantMessage({ content }) {
  const [copied, setCopied] = useState(false);
  const { cleanText, citations } = parseCitations(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group animate-fade-up">
      <div className="mb-2 flex items-center gap-2">
        <LogoMark className="size-5" />
        <span className="text-[13px] font-medium text-ink">Finvest AI</span>
      </div>
      <Markdown className="text-[15px]">{cleanText}</Markdown>
      {citations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...new Set(citations)].map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-muted">
              <Quote className="size-3" /> {c}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2.5 flex items-center gap-3 text-xs text-faint">
        <span>AI-generated. Verify before relying on it.</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 transition-[opacity,color] hover:text-ink focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          {copied ? <Check className="size-3.5 text-positive" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex animate-fade-up justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-relaxed text-white">
        {content}
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <LogoMark className="size-5" />
      Reading the filings
      <span className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className="size-1 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </div>
  );
}

function suggestedQuestions(company) {
  if (!company) {
    return [
      'What are the key risk factors mentioned?',
      'Summarize the main competitive advantages.',
      'What is the five-year revenue trend?',
      'What are management’s priorities going forward?',
    ];
  }
  const n = company.name;
  return [
    `What are ${n}'s main revenue streams?`,
    `What are the key risk factors for ${n}?`,
    `Show ${n}'s revenue trend over five years with CAGR.`,
    `Calculate ${n}'s P/E, ROE and net margin.`,
  ];
}

export default function ResearchChatPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [renamed, setRenamed] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, messagesRes] = await Promise.all([
          authenticatedFetch(`${API_URL}/api/research-sessions/${sessionId}`),
          authenticatedFetch(`${API_URL}/api/research-sessions/${sessionId}/messages`),
        ]);
        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setSession(s);
          // Default names contain "session" or "Research:"; anything else was set deliberately.
          setRenamed(Boolean(s.sessionName) && !/session|research:/i.test(s.sessionName));
        }
        if (messagesRes.ok) setMessages(await messagesRes.json());
      } catch {
        toast.error('Failed to load this session');
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const autoRename = useCallback(async (firstMessage) => {
    if (renamed) return;
    const name = firstMessage.split(' ').slice(0, 7).join(' ').substring(0, 60);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sessionName: name }),
      });
      if (res.ok) {
        setSession((prev) => ({ ...prev, sessionName: name }));
        setRenamed(true);
      }
    } catch {
      // Renaming is cosmetic; ignore failures.
    }
  }, [sessionId, renamed]);

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const send = async (text) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput('');
    requestAnimationFrame(resizeInput);

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { _id: tempId, role: 'user', content: message }]);
    setSending(true);
    if (messages.length === 0) autoRename(message);

    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-message`, {
        method: 'POST',
        body: JSON.stringify({ sessionId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not get a response');
      setMessages((prev) => [...prev.filter((m) => m._id !== tempId), data.userMessage, data.assistantMessage]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInput(message);
      toast.error(err.message === 'Failed to fetch' ? 'Connection error. Please try again.' : err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const company = session?.companyId && typeof session.companyId === 'object' ? session.companyId : null;

  if (loading) {
    return (
      <div className="flex h-app items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-app flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
        <Link
          href="/research"
          aria-label="Back to research sessions"
          className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
        >
          <ArrowLeft className="size-4" />
        </Link>
        {company ? (
          <CompanyLogo ticker={company.ticker} name={company.name} sector={company.sector} size="sm" />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-lg border border-line bg-canvas">
            <MessagesSquare className="size-4 text-muted" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{session?.sessionName || 'Research session'}</p>
          {company && (
            <Link href={`/companies/${company._id}`} className="block truncate text-xs text-muted hover:text-ink">
              {company.name}{company.ticker ? ` · ${company.ticker}` : ''}
            </Link>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          {messages.length === 0 && !sending ? (
            <div className="pt-10 text-center sm:pt-16">
              <LogoMark className="mx-auto size-10" />
              <h2 className="mt-5 font-display text-2xl font-normal tracking-[-0.02em] text-ink">
                What would you like to know{company ? ` about ${company.name}` : ''}?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Answers draw on SEC data and your indexed documents, and cite where they came from.
              </p>
              <div className="mx-auto mt-8 grid max-w-xl gap-2 text-left sm:grid-cols-2">
                {suggestedQuestions(company).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-xl border border-line bg-surface px-4 py-3 text-[13px] leading-snug text-ink-2 shadow-xs transition-colors hover:border-line-strong hover:text-ink"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((m) =>
                m.role === 'user' ? <UserMessage key={m._id} content={m.content} /> : <AssistantMessage key={m._id} content={m.content} />,
              )}
              {sending && <TypingIndicator />}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-canvas px-4 pb-4 pt-3 sm:px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); resizeInput(); }}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${company?.name || 'a company'}`}
            rows={1}
            aria-label="Message"
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-normal text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition-colors hover:bg-ink-2 disabled:bg-line-strong"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-faint">Enter to send, Shift + Enter for a new line</p>
      </div>
    </div>
  );
}
