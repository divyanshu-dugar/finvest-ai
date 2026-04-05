'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, Plus, Search, FileText, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CompanyListPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this company and all its documents from Qdrant? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) setCompanies((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.ticker && c.ticker.toLowerCase().includes(search.toLowerCase())) ||
      (c.sector && c.sector.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="h-9 w-48 bg-slate-800 rounded-xl animate-pulse mb-2" />
              <div className="h-4 w-32 bg-slate-800/60 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-slate-800 rounded-xl animate-pulse" />
          </div>
          <div className="h-12 w-full bg-slate-800 rounded-xl animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-800/50 border border-violet-400/10 animate-pulse relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700 rounded-t-2xl" />
                <div className="flex items-start justify-between mb-3 pt-1">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl" />
                </div>
                <div className="h-5 w-3/4 bg-slate-700 rounded mb-1" />
                <div className="h-4 w-1/3 bg-slate-700/60 rounded mb-2" />
                <div className="h-5 w-1/2 bg-slate-700/40 rounded-full mb-3" />
                <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                  <div className="h-3 w-14 bg-slate-700 rounded" />
                  <div className="h-3 w-10 bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Companies</h1>
            <p className="text-slate-400 text-sm mt-1">{companies.length} companies tracked</p>
          </div>
          <Link
            href="/companies/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, ticker, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 text-sm transition-colors"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              {search ? 'No companies found' : 'No companies yet'}
            </h3>
            {!search && (
              <Link href="/companies/add" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                Add your first company →
              </Link>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((company) => (
              <motion.div key={company._id} variants={cardVariants}>
                <Link
                  href={`/companies/${company._id}`}
                  className="group block p-5 rounded-2xl bg-slate-800/50 border border-violet-400/10 hover:border-violet-400/30 transition-all hover:bg-slate-800 relative overflow-hidden"
                >
                  {/* Accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-60"
                    style={{ background: company.color || '#8B5CF6' }}
                  />

                  <div className="flex items-start justify-between mb-3 pt-1">
                    <div className="text-3xl">{company.emoji || '🏢'}</div>
                    <button
                      onClick={(e) => handleDelete(company._id, e)}
                      disabled={deleting === company._id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      {deleting === company._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h3 className="font-semibold text-white text-base mb-0.5 truncate">{company.name}</h3>
                  <p className="text-xs text-violet-400 font-medium mb-2">{company.ticker}</p>

                  {company.sector && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs mb-3">
                      {company.sector}
                    </span>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700 pt-3">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {company.documentCount || 0} docs
                    </span>
                    <span className="flex items-center gap-1 text-violet-400 group-hover:gap-1.5 transition-all">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
