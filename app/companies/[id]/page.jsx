'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, FileText, MessageSquare, BarChart3,
  Globe, Edit2, Loader2, Plus, ExternalLink, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

function SWOTCard({ category, items, icon: Icon, color }) {
  return (
    <div className={`p-4 rounded-xl border ${color} bg-slate-800/40`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" />
        <h4 className="font-semibold text-sm text-white">{category}</h4>
      </div>
      <ul className="space-y-1.5">
        {(items || []).map((item, i) => (
          <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-1.5">
            <span className="text-slate-500 shrink-0 mt-0.5">•</span>
            {item}
          </li>
        ))}
        {(!items || items.length === 0) && (
          <li className="text-xs text-slate-500 italic">No data available</li>
        )}
      </ul>
    </div>
  );
}

export default function CompanyProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [swot, setSwot] = useState(null);
  const [summary, setSummary] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [swotLoading, setSwotLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      const [companyRes, docsRes, sessionsRes] = await Promise.all([
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}`),
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents?companyId=${id}`),
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions?companyId=${id}`),
      ]);
      if (!companyRes.ok) { router.push('/companies/list'); return; }
      const companyData = await companyRes.json();
      const docsData = docsRes.ok ? await docsRes.json() : [];
      const sessionsData = sessionsRes.ok ? await sessionsRes.json() : [];
      setCompany(companyData);
      setDocuments(docsData);
      setSessions(sessionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSWOT = async () => {
    setSwotLoading(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/swot`, {
        method: 'POST',
        body: JSON.stringify({ companyId: id, companyName: company.name }),
      });
      const data = await res.json();
      if (res.ok) setSwot(data.swot || data);
    } catch (err) {
      console.error(err);
    } finally {
      setSwotLoading(false);
    }
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/summary`, {
        method: 'POST',
        body: JSON.stringify({ companyId: id, companyName: company.name }),
      });
      const data = await res.json();
      if (res.ok) setSummary(data.summary || data.answer || '');
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const startNewSession = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions`, {
        method: 'POST',
        body: JSON.stringify({ sessionName: `Research: ${company.name}`, companyId: id }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/research/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'swot', label: 'SWOT', icon: BarChart3 },
    { id: 'summary', label: 'AI Summary', icon: MessageSquare },
    { id: 'sessions', label: `Sessions (${sessions.length})`, icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link
          href="/companies/list"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-violet-400 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>

        {/* Company Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-violet-400/20 rounded-2xl p-6 mb-6 relative overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
            style={{ background: company.color || '#8B5CF6' }}
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="text-5xl">{company.emoji || '🏢'}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {company.ticker && (
                      <span className="text-sm font-semibold text-violet-400">{company.ticker}</span>
                    )}
                    {company.exchange && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{company.exchange}</span>
                    )}
                    {company.sector && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-400/20">{company.sector}</span>
                    )}
                    {company.country && (
                      <span className="text-xs text-slate-400">{company.country}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/documents?companyId=${id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Documents
                  </Link>
                  <button
                    onClick={startNewSession}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> Research
                  </button>
                </div>
              </div>
              {company.description && (
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">{company.description}</p>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-2 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" /> {company.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Documents Indexed', value: documents.length, icon: FileText },
                { label: 'Research Sessions', value: sessions.length, icon: MessageSquare },
                { label: 'Chunks in Qdrant', value: documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0), icon: BarChart3 },
              ].map((stat) => (
                <div key={stat.label} className="p-5 rounded-2xl bg-slate-900 border border-violet-400/10">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-slate-400">{stat.label}</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-end mb-4">
                <Link
                  href={`/documents?companyId=${id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" /> Add / Ingest Document
                </Link>
              </div>
              {documents.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  No documents indexed yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc._id} className="p-4 rounded-xl bg-slate-800/50 border border-violet-400/10 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-violet-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{doc.title}</div>
                        <div className="text-xs text-slate-400">{doc.docType} · {doc.year} · {doc.chunkCount || 0} chunks</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        doc.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        doc.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        doc.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SWOT */}
          {activeTab === 'swot' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={generateSWOT}
                  disabled={swotLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-60"
                >
                  {swotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {swot ? 'Regenerate' : 'Generate'} SWOT
                </button>
              </div>
              {!swot ? (
                <div className="text-center py-12 text-slate-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>Click &ldquo;Generate SWOT&rdquo; to create an AI-powered SWOT analysis from the indexed documents.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SWOTCard category="Strengths" items={swot.strengths} icon={TrendingUp} color="border-green-500/30 text-green-400" />
                  <SWOTCard category="Weaknesses" items={swot.weaknesses} icon={TrendingDown} color="border-red-500/30 text-red-400" />
                  <SWOTCard category="Opportunities" items={swot.opportunities} icon={Lightbulb} color="border-blue-500/30 text-blue-400" />
                  <SWOTCard category="Threats" items={swot.threats} icon={AlertTriangle} color="border-yellow-500/30 text-yellow-400" />
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          {activeTab === 'summary' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={generateSummary}
                  disabled={summaryLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-60"
                >
                  {summaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {summary ? 'Regenerate' : 'Generate'} Summary
                </button>
              </div>
              {!summary ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>Click &ldquo;Generate Summary&rdquo; to create an AI executive summary from the indexed documents.</p>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-900 border border-violet-400/10 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              )}
            </div>
          )}

          {/* Sessions */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={startNewSession}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" /> New Session
                </button>
              </div>
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  No research sessions for this company yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <Link
                      key={s._id}
                      href={`/research/${s._id}`}
                      className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-violet-400/10 hover:border-violet-400/30 hover:bg-slate-800 transition-all group"
                    >
                      <MessageSquare className="w-5 h-5 text-violet-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{s.sessionName}</div>
                        <div className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-600 rotate-180 group-hover:text-violet-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
