'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FileText, MessagesSquare, Globe, Loader2, Plus, RefreshCw, TrendingUp,
  TrendingDown, AlertTriangle, Lightbulb, Info, Upload, ChevronRight, PieChart, LineChart as LineChartIcon,
  ShieldCheck, ScrollText,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { authenticatedFetch } from '@/lib/authenticate';
import { formatRelative } from '@/lib/format';
import CompanyLogo from '@/components/company/CompanyLogo';
import SectorBadge from '@/components/company/SectorBadge';
import Markdown from '@/components/Markdown';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Card, CardHeader, EmptyState, PageContainer, Skeleton } from '@/components/ui/Card';
import { Label, Select } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const TREND_METRICS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'net income', label: 'Net income' },
  { value: 'gross profit', label: 'Gross profit' },
  { value: 'operating income', label: 'Operating income' },
  { value: 'eps', label: 'EPS (basic)' },
  { value: 'total assets', label: 'Total assets' },
  { value: 'total liabilities', label: 'Total liabilities' },
  { value: 'stockholders equity', label: 'Stockholders’ equity' },
  { value: 'operating cash flow', label: 'Operating cash flow' },
  { value: 'capex', label: 'Capital expenditure' },
  { value: 'r&d', label: 'R&D expense' },
];

// ─── Formatting ──────────────────────────────────────────────────

const isMissing = (v) => v === null || v === undefined || Number.isNaN(Number(v));

function formatMoney(value, currency = 'USD', compact = false) {
  if (isMissing(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

const formatNumber = (value, digits = 2) => (isMissing(value) ? 'N/A' : Number(value).toFixed(digits));

// ─── Shared pieces ───────────────────────────────────────────────

/** Always-visible notice above AI-written content that isn't backed by a deterministic calculation. */
function AIDisclaimer({ children }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-warning/20 bg-warning-soft px-3.5 py-3 text-[13px] leading-relaxed text-warning">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-semibold">AI-generated.</span>{' '}
        {children || 'Verify against the underlying filing before relying on it. Not investment advice.'}
      </p>
    </div>
  );
}

function InsufficientData({ message, companyId }) {
  return (
    <Card>
      <EmptyState
        icon={AlertTriangle}
        title="Not enough source material yet"
        description={message}
        action={<Button href={`/documents?companyId=${companyId}`} size="sm" variant="secondary" icon={Upload}>Add documents</Button>}
      />
    </Card>
  );
}

function ErrorNote({ children }) {
  if (!children) return null;
  return <p className="rounded-lg border border-negative/20 bg-negative-soft px-3.5 py-2.5 text-[13px] text-negative">{children}</p>;
}

function LoadingBlock({ className = 'h-48' }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className="size-5 animate-spin text-muted" />
    </div>
  );
}

function AnalysisCard({ source, children }) {
  return (
    <Card className="animate-fade-up p-6">
      <Markdown>{children}</Markdown>
      <p className="mt-5 border-t border-line pt-3 text-xs text-faint">{source}</p>
    </Card>
  );
}

// ─── Overview ────────────────────────────────────────────────────

function MarketSnapshot({ company, data, loading, error, onRefresh }) {
  const currency = data?.currency || 'USD';
  const change = Number(data?.quote?.change || 0);
  const stats = data && [
    ['Price', formatMoney(data.quote?.currentPrice, currency)],
    [
      'Day change',
      `${change >= 0 ? '+' : ''}${formatMoney(data.quote?.change, currency)} (${formatNumber(data.quote?.changePercent)}%)`,
      change >= 0 ? 'text-positive' : 'text-negative',
    ],
    ['P/E ratio', formatNumber(data.metrics?.peRatio)],
    ['Market cap', formatMoney(data.metrics?.marketCap, currency, true)],
    ['52-week high', formatMoney(data.metrics?.week52High, currency)],
    ['52-week low', formatMoney(data.metrics?.week52Low, currency)],
  ];
  const points = data?.chart?.points || [];

  return (
    <Card>
      <CardHeader
        title="Market snapshot"
        description={company.ticker ? `${company.ticker} · one-year price history` : 'Add a ticker to see market data'}
        action={company.ticker && (
          <Button size="sm" variant="secondary" icon={RefreshCw} loading={loading} onClick={onRefresh}>Refresh</Button>
        )}
      />
      <div className="p-5">
        {!company.ticker ? (
          <p className="text-sm text-muted">A ticker symbol is needed for live market data.</p>
        ) : error ? (
          <ErrorNote>{error}</ErrorNote>
        ) : !data ? (
          <LoadingBlock className="h-72" />
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
              {stats.map(([label, value, tone]) => (
                <div key={label} className="bg-surface px-4 py-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className={cn('mt-1 text-sm font-medium text-ink tabular-nums', tone)}>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 h-64 w-full">
              {points.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0b6e4f" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="#0b6e4f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e4e3dd" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#6a6d67', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e4e3dd', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#6a6d67' }}
                      formatter={(value) => [formatMoney(value, currency), 'Close']}
                    />
                    <Area type="monotone" dataKey="close" stroke="#0b6e4f" strokeWidth={1.75} fill="url(#priceFill)" activeDot={{ r: 3.5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">No chart data for this ticker right now.</div>
              )}
            </div>
            <p className="mt-3 text-xs text-faint">
              Source: {data.provider}. Updated {formatRelative(data.lastUpdated)}.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

function OverviewTab({ company, documents, sessions, market }) {
  const chunks = documents.reduce((sum, d) => sum + (d.chunkCount || 0), 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Documents', documents.length],
          ['Research sessions', sessions.length],
          ['Sections indexed', chunks],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-[13px] text-muted">{label}</p>
            <p className="mt-2 font-display text-3xl font-normal leading-none text-ink tabular-nums">{value}</p>
          </Card>
        ))}
      </div>
      <MarketSnapshot company={company} {...market} />
    </div>
  );
}

// ─── Metrics ─────────────────────────────────────────────────────

function MetricsTab({ groups, loading, error, onReload, selectedKey, detail, detailLoading, detailError, onSelect }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="SEC filing metrics"
          description="Pick a metric to fetch its latest XBRL value with a plain-English explanation."
          action={<Button size="sm" variant="secondary" icon={RefreshCw} loading={loading} onClick={onReload}>Refresh</Button>}
        />
        <div className="scrollbar-thin max-h-128 space-y-5 overflow-y-auto p-5">
          <ErrorNote>{error}</ErrorNote>
          {!error && !loading && groups.length === 0 && <p className="text-sm text-muted">No SEC metrics available.</p>}
          {loading && groups.length === 0 && <LoadingBlock className="h-32" />}
          {groups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{group.title}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {(group.metrics || []).map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => onSelect(metric.key)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-[13px] transition-colors',
                      selectedKey === metric.key
                        ? 'border-ink bg-canvas font-medium text-ink'
                        : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
                    )}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:sticky lg:top-6">
        <CardHeader
          title={detail?.metric?.label || 'Metric explanation'}
          description={detail ? `${detail.metric?.groupTitle} · ${detail.ticker}` : 'What the number is, how it is calculated and why it matters.'}
          action={selectedKey && (
            <Button size="sm" variant="secondary" icon={RefreshCw} loading={detailLoading} onClick={() => onSelect(selectedKey, true)}>
              Re-fetch
            </Button>
          )}
        />
        <div className="p-5">
          {!selectedKey ? (
            <p className="text-sm text-muted">Select a metric on the left.</p>
          ) : detailLoading ? (
            <LoadingBlock />
          ) : detailError ? (
            <ErrorNote>{detailError}</ErrorNote>
          ) : detail ? (
            <p className="animate-fade-up whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{detail.explanation}</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

// ─── SWOT ────────────────────────────────────────────────────────

const SWOT_QUADRANTS = [
  { key: 'strengths', label: 'Strengths', icon: TrendingUp, tone: 'text-positive' },
  { key: 'weaknesses', label: 'Weaknesses', icon: TrendingDown, tone: 'text-negative' },
  { key: 'opportunities', label: 'Opportunities', icon: Lightbulb, tone: 'text-info' },
  { key: 'threats', label: 'Threats', icon: AlertTriangle, tone: 'text-warning' },
];

function SwotGrid({ swot }) {
  return (
    <div className="animate-fade-up">
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        {SWOT_QUADRANTS.map(({ key, label, icon: Icon, tone }) => {
          const items = swot[key] || [];
          return (
            <div key={key} className="bg-surface p-5">
              <h3 className={cn('flex items-center gap-2 text-sm font-semibold', tone)}>
                <Icon className="size-4" /> {label}
              </h3>
              {items.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-line-strong" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[13px] text-faint">Nothing found in the source documents.</p>
              )}
            </div>
          );
        })}
      </div>
      {swot.summary && (
        <Card className="mt-4 p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Overall</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{swot.summary}</p>
        </Card>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function CompanyProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);

  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');

  const [metricGroups, setMetricGroups] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');
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

  const [swot, setSwot] = useState(null);
  const [swotLoading, setSwotLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  /** GET helper for the analysis endpoints: returns parsed JSON or throws with the API's message. */
  const getJson = async (path, fallbackError) => {
    const res = await authenticatedFetch(`${API_URL}${path}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || fallbackError);
    return data;
  };

  const fetchMarketData = async () => {
    setMarketLoading(true);
    setMarketError('');
    try {
      setMarketData(await getJson(`/companies/${id}/market-data`, 'Unable to load market data'));
    } catch (err) {
      setMarketError(err.message);
      setMarketData(null);
    } finally {
      setMarketLoading(false);
    }
  };

  const fetchMetricCatalog = async () => {
    setMetricsLoading(true);
    setMetricsError('');
    try {
      const data = await getJson(`/companies/${id}/sec-metrics`, 'Unable to load SEC metrics');
      setMetricGroups(data.groups || []);
    } catch (err) {
      setMetricsError(err.message);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchMetricDetail = async (metricKey, forceRefresh = false) => {
    setSelectedMetricKey(metricKey);
    setMetricDetailLoading(true);
    setMetricDetailError('');
    try {
      const refresh = forceRefresh ? `?refresh=1&t=${Date.now()}` : '';
      setMetricDetail(await getJson(`/companies/${id}/sec-metrics/${metricKey}${refresh}`, 'Unable to fetch this metric'));
    } catch (err) {
      setMetricDetailError(err.message);
      setMetricDetail(null);
    } finally {
      setMetricDetailLoading(false);
    }
  };

  const fetchRatios = async () => {
    setRatiosLoading(true);
    setRatiosError('');
    try {
      setRatios(await getJson(`/companies/${id}/ratios`, 'Unable to load financial ratios'));
    } catch (err) {
      setRatiosError(err.message);
    } finally {
      setRatiosLoading(false);
    }
  };

  const fetchTrend = async () => {
    setTrendLoading(true);
    setTrendError('');
    try {
      setTrend(await getJson(`/companies/${id}/trend?metric=${encodeURIComponent(trendMetric)}&years=${trendYears}`, 'Unable to load trend data'));
    } catch (err) {
      setTrendError(err.message);
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [companyRes, docsRes, sessionsRes] = await Promise.all([
          authenticatedFetch(`${API_URL}/companies/${id}`),
          authenticatedFetch(`${API_URL}/documents?companyId=${id}`),
          authenticatedFetch(`${API_URL}/api/research-sessions?companyId=${id}`),
        ]);
        if (!companyRes.ok) {
          router.replace('/companies/list');
          return;
        }
        const companyData = await companyRes.json();
        setCompany(companyData);
        setDocuments(docsRes.ok ? await docsRes.json() : []);
        setSessions(sessionsRes.ok ? await sessionsRes.json() : []);
        if (companyData.ticker) {
          fetchMarketData();
          fetchMetricCatalog();
        }
      } catch {
        toast.error('Failed to load this company');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const postAnalysis = async (path, setResult, setBusy) => {
    setBusy(true);
    try {
      const res = await authenticatedFetch(`${API_URL}${path}`, {
        method: 'POST',
        body: JSON.stringify({ companyId: id, companyName: company.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // The SWOT endpoint wraps its payload in { swot }; the summary endpoint returns it directly.
  const generateSwot = () => postAnalysis('/api/swot', (d) => setSwot(d.swot || d), setSwotLoading);
  const generateSummary = () => postAnalysis('/api/summary', setSummary, setSummaryLoading);

  const startNewSession = async () => {
    setStartingSession(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions`, {
        method: 'POST',
        body: JSON.stringify({ sessionName: `Research: ${company.name}`, companyId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start a session');
      router.push(`/research/${data._id}`);
    } catch (err) {
      toast.error(err.message);
      setStartingSession(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="mb-6 h-4 w-24" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="mt-6 h-10 w-full max-w-xl" />
        <Skeleton className="mt-6 h-80 rounded-xl" />
      </PageContainer>
    );
  }
  if (!company) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'ratios', label: 'Ratios' },
    { id: 'trends', label: 'Trends' },
    { id: 'swot', label: 'SWOT' },
    { id: 'summary', label: 'Summary' },
    { id: 'documents', label: 'Documents', count: documents.length },
    { id: 'sessions', label: 'Sessions', count: sessions.length },
  ];

  return (
    <PageContainer>
      <Link href="/companies/list" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Companies
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <CompanyLogo ticker={company.ticker} name={company.name} sector={company.sector} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-ink">{company.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted">
            {company.ticker && <span className="font-mono font-medium text-ink">{company.ticker}</span>}
            {company.exchange && <span>{company.exchange}</span>}
            <SectorBadge sector={company.sector} />
            {company.country && <span>{company.country}</span>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-ink">
                <Globe className="size-3.5" />
                {company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
          {company.description && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{company.description}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button href={`/documents?companyId=${id}`} variant="secondary" icon={FileText}>Documents</Button>
          <Button icon={MessagesSquare} loading={startingSession} onClick={startNewSession}>Ask a question</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="scrollbar-thin -mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" className="flex min-w-max gap-6 border-b border-line">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-md bg-subtle px-1.5 text-xs leading-5 text-muted tabular-nums">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div key={activeTab} className="mt-6 animate-fade-up">
        {activeTab === 'overview' && (
          <OverviewTab
            company={company}
            documents={documents}
            sessions={sessions}
            market={{ data: marketData, loading: marketLoading, error: marketError, onRefresh: fetchMarketData }}
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsTab
            groups={metricGroups}
            loading={metricsLoading}
            error={metricsError}
            onReload={fetchMetricCatalog}
            selectedKey={selectedMetricKey}
            detail={metricDetail}
            detailLoading={metricDetailLoading}
            detailError={metricDetailError}
            onSelect={fetchMetricDetail}
          />
        )}

        {activeTab === 'ratios' && (
          <div className="space-y-4">
            <ErrorNote>{ratiosError}</ErrorNote>
            {ratios && !ratiosLoading ? (
              <>
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchRatios}>Refresh</Button>
                </div>
                <AnalysisCard source="Source: SEC XBRL data and live Finnhub price.">{ratios.result}</AnalysisCard>
              </>
            ) : (
              <Card>
                <EmptyState
                  icon={PieChart}
                  title={ratiosLoading ? 'Calculating ratios' : 'Financial ratios'}
                  description="P/E, P/B, net margin, ROE, ROA, current ratio, debt to equity and more, from SEC XBRL data and the live share price."
                  action={<Button icon={PieChart} loading={ratiosLoading} onClick={fetchRatios}>Calculate ratios</Button>}
                />
              </Card>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4">
            <Card className="flex flex-wrap items-end gap-4 p-5">
              <div className="min-w-48 flex-1">
                <Label htmlFor="trend-metric">Metric</Label>
                <Select id="trend-metric" value={trendMetric} onChange={(e) => setTrendMetric(e.target.value)}>
                  {TREND_METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
              </div>
              <div className="w-36">
                <Label htmlFor="trend-years">Period</Label>
                <Select id="trend-years" value={trendYears} onChange={(e) => setTrendYears(Number(e.target.value))}>
                  {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n} years</option>)}
                </Select>
              </div>
              <Button icon={LineChartIcon} loading={trendLoading} onClick={fetchTrend}>
                {trend ? 'Update' : 'Show trend'}
              </Button>
            </Card>
            <ErrorNote>{trendError}</ErrorNote>
            {trendLoading ? (
              <Card><LoadingBlock /></Card>
            ) : trend ? (
              <AnalysisCard source="Source: SEC XBRL data from annual 10-K filings.">{trend.result}</AnalysisCard>
            ) : (
              !trendError && (
                <Card>
                  <EmptyState
                    icon={LineChartIcon}
                    title="Multi-year history"
                    description="Choose a metric to see its history from 10-K filings, with year-over-year change and CAGR."
                  />
                </Card>
              )
            )}
          </div>
        )}

        {activeTab === 'swot' && (
          !swot ? (
            <Card>
              <EmptyState
                icon={ShieldCheck}
                title={swotLoading ? 'Writing the SWOT analysis' : 'SWOT analysis'}
                description="Strengths, weaknesses, opportunities and threats, drawn only from this company's indexed documents."
                action={<Button loading={swotLoading} onClick={generateSwot}>Generate SWOT</Button>}
              />
            </Card>
          ) : swot.insufficient_data ? (
            <InsufficientData
              companyId={id}
              message={swot.message || `There are no indexed documents for ${company.name} yet. Add a 10-K or annual report to enable SWOT analysis.`}
            />
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <Button size="sm" variant="secondary" icon={RefreshCw} loading={swotLoading} onClick={generateSwot}>Regenerate</Button>
              </div>
              <AIDisclaimer>
                Drawn from your documents only, and each point cites its source. Check against the filing before relying on it. Not investment advice.
              </AIDisclaimer>
              <SwotGrid swot={swot} />
            </>
          )
        )}

        {activeTab === 'summary' && (
          !summary ? (
            <Card>
              <EmptyState
                icon={ScrollText}
                title={summaryLoading ? 'Writing the summary' : 'Executive summary'}
                description="A concise overview of the business, built from this company's indexed documents."
                action={<Button loading={summaryLoading} onClick={generateSummary}>Generate summary</Button>}
              />
            </Card>
          ) : summary.insufficient_data ? (
            <InsufficientData
              companyId={id}
              message={summary.message || `There are no indexed documents for ${company.name} yet. Add a 10-K or annual report to enable a summary.`}
            />
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <Button size="sm" variant="secondary" icon={RefreshCw} loading={summaryLoading} onClick={generateSummary}>Regenerate</Button>
              </div>
              <AIDisclaimer>
                Drawn from your documents only. Where they don&apos;t cover a topic, the summary says so rather than filling the gap. Not investment advice.
              </AIDisclaimer>
              <Card className="p-6">
                <Markdown>{typeof summary === 'string' ? summary : summary.summary}</Markdown>
              </Card>
            </>
          )
        )}

        {activeTab === 'documents' && (
          <Card>
            <CardHeader
              title="Documents"
              description="Filings and documents indexed for this company"
              action={<Button href={`/documents?companyId=${id}`} size="sm" icon={Plus}>Add or import</Button>}
            />
            {documents.length === 0 ? (
              <EmptyState icon={FileText} title="No documents yet" description="Import SEC filings or add a document to power SWOT, summaries and chat." />
            ) : (
              <ul className="divide-y divide-line">
                {documents.map((doc) => (
                  <li key={doc._id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{doc.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[doc.year, doc.status === 'completed' && `${doc.chunkCount || 0} sections`, formatRelative(doc.createdAt)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <StatusBadge status={doc.status} className="shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {activeTab === 'sessions' && (
          <Card>
            <CardHeader
              title="Research sessions"
              description="Conversations about this company"
              action={<Button size="sm" icon={Plus} loading={startingSession} onClick={startNewSession}>New session</Button>}
            />
            {sessions.length === 0 ? (
              <EmptyState icon={MessagesSquare} title="No sessions yet" description="Start a session to ask questions about this company." />
            ) : (
              <ul className="divide-y divide-line">
                {sessions.map((s) => (
                  <li key={s._id}>
                    <Link href={`/research/${s._id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{s.sessionName}</p>
                        <p className="mt-0.5 text-xs text-muted">{formatRelative(s.updatedAt || s.createdAt)}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
