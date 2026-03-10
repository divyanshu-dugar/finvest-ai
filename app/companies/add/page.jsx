'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/authenticate';

const SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary',
  'Consumer Staples', 'Energy', 'Industrials', 'Materials', 'Real Estate',
  'Utilities', 'Communication Services', 'Other',
];

const EXCHANGES = ['NYSE', 'NASDAQ', 'LSE', 'TSX', 'ASX', 'Other'];

const EMOJI_OPTIONS = ['🏢', '💻', '🏥', '🏦', '⚡', '🛒', '✈️', '🔬', '🛢️', '🏗️', '📡', '🌍'];

export default function AddCompanyPage() {
  const [form, setForm] = useState({
    name: '',
    ticker: '',
    sector: '',
    exchange: '',
    description: '',
    website: '',
    country: '',
    color: '#8B5CF6',
    emoji: '🏢',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
        {/* Back */}
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

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
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
