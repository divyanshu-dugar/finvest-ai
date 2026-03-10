'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Trash2, Loader2, Building2, Calendar, ArrowRight } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

export default function ResearchSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sessionName: '', companyId: '' });
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetchSessions(),
      fetchCompanies(),
    ]);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions`);
      if (res.ok) setSessions(await res.json());
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) router.push(`/research/${data._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this research session?')) return;
    setDeleting(id);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions/${id}`, { method: 'DELETE' });
      if (res.ok) setSessions((p) => p.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const getCompany = (id) => companies.find((c) => c._id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Research Sessions</h1>
            <p className="text-slate-400 text-sm mt-1">AI-powered company research conversations</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>

        {/* New Session Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-violet-400/20 rounded-2xl p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">New Research Session</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Session Name *</label>
                <input
                  type="text"
                  value={form.sessionName}
                  onChange={(e) => setForm({ ...form, sessionName: e.target.value })}
                  placeholder="e.g. Apple Revenue Analysis"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Company (optional)</label>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500 text-sm"
                >
                  <option value="">No specific company (general research)</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.emoji || '🏢'} {c.name} ({c.ticker})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-60"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Open'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No research sessions yet</h3>
            <p className="text-slate-500 text-sm mb-4">Start a new session to begin AI-powered company research.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
            >
              Create your first session →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => {
              const company = session.companyId ? getCompany(session.companyId) : null;
              return (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={`/research/${session._id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-violet-400/10 hover:border-violet-400/30 hover:bg-slate-800 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-400/20 flex items-center justify-center flex-shrink-0">
                      {company ? (
                        <span className="text-xl">{company.emoji || '🏢'}</span>
                      ) : (
                        <MessageSquare className="w-5 h-5 text-violet-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{session.sessionName}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {company && (
                          <span className="text-xs text-violet-400">{company.name} · {company.ticker}</span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(session._id, e)}
                      disabled={deleting === session._id}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {deleting === session._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
