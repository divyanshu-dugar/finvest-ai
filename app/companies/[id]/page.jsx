'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, Building2, FileText, MessageSquare, BarChart3,
  Globe, Edit2, Loader2, Plus, ExternalLink, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, PieChart,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

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
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');
  const [secMetricGroups, setSecMetricGroups] = useState([]);
  const [secMetricLoading, setSecMetricLoading] = useState(false);
  const [secMetricError, setSecMetricError] = useState('');
  const [selectedMetricKey, setSelectedMetricKey] = useState('');
  const [metricDetail, setMetricDetail] = useState(null);
  const [metricDetailLoading, setMetricDetailLoading] = useState(false);
  const [metricDetailError, setMetricDetailError] = useState('');
  const [ratios, setRatios] = useState(null);
  const [ratiosLoading, setRatiosLoading] = useState(false);
  const [ratiosError, setRatiosError] = useState('');
  const [trendMetric, setTrendMetric] = useState('revenue');
  const [trendYears, setTrendYears] = useState(5);
  const [trend, setTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState('');

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
      if (companyData?.ticker) {
        fetchMarketData();
        fetchSecMetricCatalog();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecMetricCatalog = async () => {
    setSecMetricLoading(true);
    setSecMetricError('');
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}/sec-metrics`);
      const data = await res.json();
      if (!res.ok) {
        setSecMetricError(data.error || 'Unable to load SEC metrics');
        return;
      }
      setSecMetricGroups(data.groups || []);
    } catch (err) {
      console.error(err);
      setSecMetricError('Unable to load SEC metrics');
    } finally {
      setSecMetricLoading(false);
    }
  };

  const fetchMetricDetail = async (metricKey, forceRefresh = false) => {
    setSelectedMetricKey(metricKey);
    setMetricDetailLoading(true);
    setMetricDetailError('');
    try {
      const refreshParam = forceRefresh ? `?refresh=1&t=${Date.now()}` : '';
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}/sec-metrics/${metricKey}${refreshParam}`);
      const data = await res.json();
      if (!res.ok) {
        setMetricDetailError(data.error || 'Unable to fetch metric explanation');
        setMetricDetail(null);
        return;
      }
      setMetricDetail(data);
    } catch (err) {
      console.error(err);
      setMetricDetailError('Unable to fetch metric explanation');
      setMetricDetail(null);
    } finally {
      setMetricDetailLoading(false);
    }
  };

  const fetchRatios = async () => {
    setRatiosLoading(true);
    setRatiosError('');
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}/ratios`);
      const data = await res.json();
      if (!res.ok) { setRatiosError(data.error || 'Unable to load financial ratios'); return; }
      setRatios(data);
    } catch (err) {
      console.error(err);
      setRatiosError('Unable to load financial ratios');
    } finally {
      setRatiosLoading(false);
    }
  };

  const fetchTrend = async (metric = trendMetric, years = trendYears) => {
    setTrendLoading(true);
    setTrendError('');
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/${id}/trend?metric=${encodeURIComponent(metric)}&years=${years}`,
      );
      const data = await res.json();
      if (!res.ok) { setTrendError(data.error || 'Unable to load trend data'); return; }
      setTrend(data);
    } catch (err) {
      console.error(err);
      setTrendError('Unable to load trend data');
    } finally {
      setTrendLoading(false);
    }
  };

  const fetchMarketData = async () => {
    setMarketError('');
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}/market-data`);
      const data = await res.json();
      if (!res.ok) {
        setMarketError(data.error || 'Unable to load market data');
        setMarketData(null);
        return;
      }
      setMarketData(data);
    } catch (err) {
      console.error(err);
      setMarketError('Unable to load market data');
      setMarketData(null);
    } finally {
      setMarketLoading(false);
    }
  };

  const formatMoney = (value, currency = 'USD') => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const formatCompactMoney = (value, currency = 'USD') => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const formatNumber = (value, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return Number(value).toFixed(digits);
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
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'ratios', label: 'Ratios', icon: PieChart },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
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
            <div className="space-y-4">
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

              <div className="rounded-2xl bg-slate-900 border border-violet-400/10 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-base">Market Snapshot</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {company.ticker ? `${company.ticker} · 1Y price chart and key metrics` : 'Add ticker to view market data'}
                    </p>
                  </div>
                  {company.ticker && (
                    <button
                      onClick={fetchMarketData}
                      disabled={marketLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors disabled:opacity-60"
                    >
                      {marketLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Refresh
                    </button>
                  )}
                </div>

                {!company.ticker && (
                  <div className="text-sm text-slate-400">Ticker is required for live market data.</div>
                )}

                {company.ticker && marketError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{marketError}</div>
                )}

                {company.ticker && !marketError && marketLoading && !marketData && (
                  <div className="h-60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                  </div>
                )}

                {company.ticker && marketData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-xs text-slate-400">Current Price</div>
                        <div className="text-sm font-semibold text-white mt-1">
                          {formatMoney(marketData.quote?.currentPrice, marketData.currency)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-xs text-slate-400">Daily Change</div>
                        <div className={`text-sm font-semibold mt-1 ${Number(marketData.quote?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatMoney(marketData.quote?.change, marketData.currency)} ({formatNumber(marketData.quote?.changePercent)}%)
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-xs text-slate-400">P/E Ratio</div>
                        <div className="text-sm font-semibold text-white mt-1">{formatNumber(marketData.metrics?.peRatio)}</div>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-xs text-slate-400">Market Cap</div>
                        <div className="text-sm font-semibold text-white mt-1">
                          {formatCompactMoney(marketData.metrics?.marketCap, marketData.currency)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-xs text-slate-400">52W High</div>
                        <div className="text-sm font-semibold text-white mt-1">
                          {formatMoney(marketData.metrics?.week52High, marketData.currency)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3">
                        <div className="text-xs text-slate-400">52W Low</div>
                        <div className="text-sm font-semibold text-white mt-1">
                          {formatMoney(marketData.metrics?.week52Low, marketData.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full rounded-xl bg-slate-800/40 border border-slate-700 p-2">
                      {(marketData.chart?.points || []).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={marketData.chart?.points || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={["auto", "auto"]} tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                              labelStyle={{ color: '#e2e8f0' }}
                              formatter={(value) => [formatMoney(value, marketData.currency), 'Close']}
                            />
                            <Line
                              type="monotone"
                              dataKey="close"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-slate-400">
                          No chart data available for this ticker right now.
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Source: {marketData.provider}. Last updated: {new Date(marketData.lastUpdated).toLocaleString()}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-slate-900 border border-violet-400/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-base">SEC Filing Metrics</h3>
                  <button
                    onClick={fetchSecMetricCatalog}
                    disabled={secMetricLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors disabled:opacity-60"
                  >
                    {secMetricLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Refresh
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Click any metric to fetch the latest SEC XBRL value and a plain-English explanation.
                </p>

                {secMetricError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                    {secMetricError}
                  </div>
                )}

                {!secMetricError && secMetricGroups.length === 0 && !secMetricLoading && (
                  <div className="text-sm text-slate-400">No SEC metric groups available.</div>
                )}

                <div className="space-y-4 max-h-128 overflow-y-auto pr-1">
                  {secMetricGroups.map((group) => (
                    <div key={group.id}>
                      <h4 className="text-sm font-semibold text-violet-300 mb-2">{group.title}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(group.metrics || []).map((metric) => (
                          <button
                            key={metric.key}
                            onClick={() => fetchMetricDetail(metric.key)}
                            className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                              selectedMetricKey === metric.key
                                ? 'border-violet-400 bg-violet-500/10 text-violet-200'
                                : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-violet-400/40 hover:text-white'
                            }`}
                          >
                            {metric.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-violet-400/10 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-white font-semibold text-base">Metric Explanation</h3>
                  {selectedMetricKey && (
                    <button
                      onClick={() => fetchMetricDetail(selectedMetricKey, true)}
                      disabled={metricDetailLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors disabled:opacity-60"
                    >
                      {metricDetailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Re-fetch
                    </button>
                  )}
                </div>

                {!selectedMetricKey && (
                  <div className="text-sm text-slate-400">
                    Select a metric from the list to see the fetched value, what it means, formula, and why it matters.
                  </div>
                )}

                {metricDetailLoading && (
                  <div className="h-48 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                  </div>
                )}

                {metricDetailError && !metricDetailLoading && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {metricDetailError}
                  </div>
                )}

                {metricDetail && !metricDetailLoading && !metricDetailError && (
                  <div>
                    <div className="mb-3 text-xs text-slate-400">
                      {metricDetail.metric?.groupTitle} · {metricDetail.ticker}
                    </div>
                    <div className="text-sm font-semibold text-white mb-3">
                      {metricDetail.metric?.label}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {metricDetail.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ratios */}
          {activeTab === 'ratios' && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <button
                  onClick={fetchRatios}
                  disabled={ratiosLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-60"
                >
                  {ratiosLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {ratios ? 'Refresh Ratios' : 'Load Financial Ratios'}
                </button>
              </div>

              {ratiosError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{ratiosError}</div>
              )}

              {ratiosLoading && !ratios && (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              )}

              {!ratios && !ratiosLoading && !ratiosError && (
                <div className="text-center py-16 text-slate-400">
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-sm">Load AI-computed financial ratios pulled from SEC XBRL data and live market prices.</p>
                  <p className="text-xs mt-2 text-slate-500">Includes P/E, P/B, Net Margin, ROE, ROA, Current Ratio, Debt/Equity and more.</p>
                </div>
              )}

              {ratios && !ratiosLoading && (
                <div className="rounded-2xl bg-slate-900 border border-violet-400/10 p-6">
                  <div className="prose prose-invert prose-sm max-w-none
                    [&_h1]:text-violet-300 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4
                    [&_h2]:text-violet-200 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6
                    [&_h3]:text-slate-200 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                    [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3
                    [&_strong]:text-white [&_strong]:font-semibold
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-slate-300
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:text-slate-300
                    [&_li]:text-slate-300 [&_li]:leading-relaxed
                    [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
                    [&_th]:bg-violet-500/10 [&_th]:text-violet-300 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:border [&_th]:border-slate-700
                    [&_td]:px-3 [&_td]:py-2 [&_td]:text-slate-300 [&_td]:border [&_td]:border-slate-700 [&_tr:nth-child(even)_td]:bg-slate-800/40
                    [&_code]:bg-slate-800 [&_code]:text-violet-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
                    [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500/50 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_blockquote]:italic">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{ratios.result || ''}</ReactMarkdown>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4">Source: SEC XBRL + Finnhub live price. Computed by Finvest AI.</p>
                </div>
              )}
            </div>
          )}

          {/* Trends */}
          {activeTab === 'trends' && (
            <div className="space-y-5">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-48">
                  <label className="block text-xs text-slate-400 mb-1.5">Metric</label>
                  <select
                    value={trendMetric}
                    onChange={(e) => setTrendMetric(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {[
                      { value: 'revenue', label: 'Revenue' },
                      { value: 'net income', label: 'Net Income' },
                      { value: 'gross profit', label: 'Gross Profit' },
                      { value: 'operating income', label: 'Operating Income' },
                      { value: 'eps', label: 'EPS (Basic)' },
                      { value: 'total assets', label: 'Total Assets' },
                      { value: 'total liabilities', label: 'Total Liabilities' },
                      { value: 'stockholders equity', label: "Stockholders' Equity" },
                      { value: 'operating cash flow', label: 'Operating Cash Flow' },
                      { value: 'capex', label: 'CapEx' },
                      { value: 'r&d', label: 'R&D Expense' },
                    ].map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-xs text-slate-400 mb-1.5">Years Back</label>
                  <select
                    value={trendYears}
                    onChange={(e) => setTrendYears(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {[3, 5, 7, 10].map((n) => (
                      <option key={n} value={n}>{n} years</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => fetchTrend(trendMetric, trendYears)}
                    disabled={trendLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-60"
                  >
                    {trendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                    {trend ? 'Update' : 'Load Trend'}
                  </button>
                </div>
              </div>

              {trendError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{trendError}</div>
              )}

              {trendLoading && !trend && (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              )}

              {!trend && !trendLoading && !trendError && (
                <div className="text-center py-16 text-slate-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-sm">Select a metric and load multi-year historical data from SEC XBRL filings.</p>
                  <p className="text-xs mt-2 text-slate-500">Includes YoY change % and CAGR computation.</p>
                </div>
              )}

              {trend && !trendLoading && (
                <div className="rounded-2xl bg-slate-900 border border-violet-400/10 p-6">
                  <div className="prose prose-invert prose-sm max-w-none
                    [&_h1]:text-violet-300 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4
                    [&_h2]:text-violet-200 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6
                    [&_h3]:text-slate-200 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                    [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3
                    [&_strong]:text-white [&_strong]:font-semibold
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-slate-300
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:text-slate-300
                    [&_li]:text-slate-300 [&_li]:leading-relaxed
                    [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
                    [&_th]:bg-violet-500/10 [&_th]:text-violet-300 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:border [&_th]:border-slate-700
                    [&_td]:px-3 [&_td]:py-2 [&_td]:text-slate-300 [&_td]:border [&_td]:border-slate-700 [&_tr:nth-child(even)_td]:bg-slate-800/40
                    [&_code]:bg-slate-800 [&_code]:text-violet-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
                    [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500/50 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_blockquote]:italic">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{trend.result || ''}</ReactMarkdown>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4">Source: SEC XBRL annual 10-K filings. Computed by Finvest AI.</p>
                </div>
              )}
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
