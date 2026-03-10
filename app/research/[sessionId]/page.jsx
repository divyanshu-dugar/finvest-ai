'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Loader2, MessageSquare, User, Brain,
  Building2, Copy, Check, RefreshCw,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-violet-500/20">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`group relative max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm'
              : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-violet-400/10'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {!isUser && (
          <button
            onClick={handleCopy}
            className="mt-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="bg-slate-800 border border-violet-400/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        {[0, 0.2, 0.4].map((delay) => (
          <motion.div
            key={delay}
            className="w-2 h-2 rounded-full bg-violet-400"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ResearchChatPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchSessionData();
    fetchCompanies();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessionData = async () => {
    try {
      const [sessionRes, messagesRes] = await Promise.all([
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions/${sessionId}`),
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions/${sessionId}/messages`),
      ]);
      if (sessionRes.ok) setSession(await sessionRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`);
      if (res.ok) setCompanies(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || sending) return;
    setInput('');

    // Optimistically add user message
    const tempUserMsg = { role: 'user', content: userMessage, _id: Date.now() };
    setMessages((p) => [...p, tempUserMsg]);
    setSending(true);

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
      }
    } catch (err) {
      console.error(err);
      setMessages((p) => p.filter((m) => m._id !== tempUserMsg._id));
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

  const company = session?.companyId ? companies.find((c) => c._id === session.companyId) : null;

  const suggestedQuestions = company
    ? [
        `What are ${company.name}'s main revenue streams?`,
        `What are the key risk factors for ${company.name}?`,
        `Summarize ${company.name}'s competitive position.`,
        `What is ${company.name}'s growth strategy?`,
      ]
    : [
        'What are the key risk factors mentioned?',
        'Summarize the main competitive advantages.',
        'What is the revenue growth trend?',
        'What are the management priorities?',
      ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-400/20 flex items-center justify-center flex-shrink-0">
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Start your research</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">
              Ask anything about {company ? company.name : 'the company'} based on its indexed documents.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-xs p-3 rounded-xl bg-slate-800 border border-violet-400/10 hover:border-violet-400/30 text-slate-300 hover:text-white transition-all"
                >
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
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${company?.name || 'this company'}...`}
              rows={1}
              className="w-full px-4 py-3 pr-4 rounded-2xl bg-slate-800 border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 text-white placeholder-slate-500 text-sm resize-none transition-colors outline-none max-h-32 overflow-y-auto"
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
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
