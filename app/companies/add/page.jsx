'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowLeft, Loader2, Search, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/authenticate';

const SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary',
  'Consumer Staples', 'Energy', 'Industrials', 'Materials', 'Real Estate',
  'Utilities', 'Communication Services', 'Other',
];

const EXCHANGES = ['NYSE', 'NASDAQ', 'LSE', 'TSX', 'ASX', 'Other'];

const EMOJI_OPTIONS = ['🏢', '💻', '🏥', '🏦', '⚡', '🛒', '✈️', '🔬', '🛢️', '🏗️', '📡', '🌍'];

const STATE_COUNTRY_MAP = {
  'DE': 'United States', 'NY': 'United States', 'CA': 'United States',
  'TX': 'United States', 'WA': 'United States', 'IL': 'United States',
  'FL': 'United States', 'NV': 'United States', 'OH': 'United States',
  'MA': 'United States', 'PA': 'United States', 'MN': 'United States',
  'X2': 'Canada', 'X3': 'United Kingdom', 'X4': 'Germany', 'X5': 'France',
  'X6': 'Japan', 'X7': 'Australia', 'X8': 'China', 'X9': 'Singapore',
};

function deriveEmoji(sector) {
  const map = {
    'Technology': '💻', 'Healthcare': '🏥', 'Financial Services': '🏦',
    'Energy': '🛢️', 'Consumer Discretionary': '🛒', 'Consumer Staples': '🛒',
    'Industrials': '🏗️', 'Materials': '🔬', 'Real Estate': '🏢',
    'Utilities': '⚡', 'Communication Services': '📡',
  };
  return map[sector] || '🏢';
}

export default function AddCompanyPage() {
  const [form, setForm] = useState({
    name: '', ticker: '', sector: '', exchange: '',
    description: '', website: '', country: '', color: '#8B5CF6', emoji: '🏢',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Company search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [fillingDetails, setFillingDetails] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    clearTimeout(debounceTimer.current);
    if (!value.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/companies/sec/search?q=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectCompany = async (company) => {
    setShowDropdown(false);
    setSearchQuery(`${company.name} (${company.ticker})`);
    setFillingDetails(true);
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/sec/details/${company.cik}`
      );
      const d = await res.json();
      const sector = d.sector || '';
      setForm((prev) => ({
        ...prev,
        name: d.name || company.name,
        ticker: d.ticker || company.ticker,
        sector,
        exchange: d.exchange || '',
        description: d.sicDescription ? `${d.name} — ${d.sicDescription}` : prev.description,
        website: d.website ? (d.website.startsWith('http') ? d.website : `https://${d.website}`) : prev.website,
        country: STATE_COUNTRY_MAP[d.stateOfIncorporation] || (d.stateOfIncorporation ? 'United States' : prev.country),
        emoji: deriveEmoji(sector),
      }));
      setAutoFilled(true);
    } catch {
      // partial fill from search result
      setForm((prev) => ({ ...prev, name: company.name, ticker: company.ticker }));
    } finally {
      setFillingDetails(false);
    }
  };

  const clearAutoFill = () => {
    setSearchQuery('');
    setAutoFilled(false);
    setForm({ name: '', ticker: '', sector: '', exchange: '', description: '', website: '', country: '', color: '#8B5CF6', emoji: '🏢' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add company');
      router.push(`/companies/${data._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/companies/list"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-violet-400 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-violet-400/20 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Add Company</h1>
              <p className="text-slate-400 text-sm">Create a research workspace for a company</p>
            </div>
          </div>

          {/* ── SEC Company Search ── */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Search Company <span className="text-slate-500 font-normal">(optional — auto-fills the form)</span>
            </label>
            <div ref={searchRef} className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  placeholder="Search by company name or ticker, e.g. Apple or AAPL…"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800 border border-violet-500/40 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm"
                />
                {(searching || fillingDetails) && (
                  <Loader2 className="absolute right-3.5 w-4 h-4 text-violet-400 animate-spin" />
                )}
                {autoFilled && !fillingDetails && (
                  <button type="button" onClick={clearAutoFill} className="absolute right-3.5 text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showDropdown && searchResults.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute z-50 w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    {searchResults.map((company) => (
                      <li key={company.cik}>
                        <button
                          type="button"
                          onMouseDown={() => handleSelectCompany(company)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-violet-500/10 text-left transition-colors"
                        >
                          <span className="text-white text-sm font-medium truncate">{company.name}</span>
                          <span className="ml-3 shrink-0 text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                            {company.ticker}
                          </span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
                {showDropdown && !searching && searchQuery.trim() && searchResults.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-50 w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-500"
                  >
                    No results found. Fill the form manually below.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {autoFilled && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Auto-filled from SEC EDGAR — review and edit as needed
              </motion.div>
            )}
          </div>

          <div className="border-t border-slate-800 mb-5" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Ticker */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Apple Inc."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Ticker Symbol</label>
                <input
                  type="text"
                  name="ticker"
                  value={form.ticker}
                  onChange={handleChange}
                  placeholder="AAPL"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm uppercase"
                />
              </div>
            </div>

            {/* Sector + Exchange */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Sector</label>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm"
                >
                  <option value="">Select sector</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Exchange</label>
                <select
                  name="exchange"
                  value={form.exchange}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm"
                >
                  <option value="">Select exchange</option>
                  {EXCHANGES.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            {/* Country + Website */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Country</label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="United States"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Website</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://apple.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of the company..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors text-sm resize-none"
              />
            </div>

            {/* Emoji + Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, emoji })}
                      className={`w-9 h-9 text-lg rounded-lg border transition-all ${
                        form.emoji === emoji
                          ? 'border-violet-500 bg-violet-500/20'
                          : 'border-slate-700 bg-slate-800 hover:border-violet-400/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700"
                  />
                  <span className="text-sm text-slate-400">{form.color}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Company'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
