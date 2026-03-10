'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, FileText, MessageSquare, Activity, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || '');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [companiesRes, sessionsRes] = await Promise.all([
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`),
        authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research-sessions`),
      ]);

      const companies = companiesRes.ok ? await companiesRes.json() : [];
      const sessions = sessionsRes.ok ? await sessionsRes.json() : [];

      // Compute stats
      const totalDocs = companies.reduce((acc, c) => acc + (c.documentCount || 0), 0);
      setStats({
        companies: companies.length,
        documents: totalDocs,
        sessions: sessions.length,
      });
      setRecentCompanies(companies.slice(0, 4));
      setRecentSessions(sessions.slice(0, 4));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      label: 'Companies Tracked',
      value: stats?.companies ?? 0,
      icon: Building2,
      href: '/companies/list',
      accent: 'from-violet-500 to-violet-600',
    },
    {
      label: 'Documents Indexed',
      value: stats?.documents ?? 0,
      icon: FileText,
      href: '/documents',
      accent: 'from-indigo-500 to-indigo-600',
    },
    {
      label: 'Research Sessions',
      value: stats?.sessions ?? 0,
      icon: MessageSquare,
      href: '/research',
      accent: 'from-violet-600 to-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center pt-16">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">
            Welcome back,{' '}
            <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="text-slate-400 mt-1">Here&apos;s your research overview.</p>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {metricCards.map((card) => (
            <motion.div key={card.label} variants={itemVariants}>
              <Link
                href={card.href}
                className="block p-5 rounded-2xl bg-slate-800/50 border border-violet-400/10 hover:border-violet-400/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${card.accent} flex items-center justify-center shadow-md`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-3xl font-bold text-white">{card.value}</div>
                <div className="text-sm text-slate-400 mt-0.5">{card.label}</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Companies */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 border border-violet-400/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-400" />
                Recent Companies
              </h2>
              <Link href="/companies/add" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add
              </Link>
            </div>
            {recentCompanies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No companies yet.</p>
                <Link href="/companies/add" className="text-violet-400 text-sm hover:underline mt-1 inline-block">
                  Add your first company →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCompanies.map((company) => (
                  <Link
                    key={company._id}
                    href={`/companies/${company._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-linear-to-br from-violet-500/20 to-indigo-600/20 border border-violet-400/20 flex items-center justify-center text-lg">
                      {company.emoji || '🏢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{company.name}</div>
                      <div className="text-xs text-slate-400">{company.ticker} · {company.sector || 'N/A'}</div>
                    </div>
                    <div className="text-xs text-slate-500">{company.documentCount || 0} docs</div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </Link>
                ))}
                {recentCompanies.length > 0 && (
                  <Link href="/companies/list" className="block text-center text-xs text-violet-400 hover:text-violet-300 pt-2 transition-colors">
                    View all companies →
                  </Link>
                )}
              </div>
            )}
          </motion.div>

          {/* Recent Research Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-slate-900 border border-violet-400/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-400" />
                Recent Sessions
              </h2>
              <Link href="/research" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New
              </Link>
            </div>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No research sessions yet.</p>
                <Link href="/research" className="text-violet-400 text-sm hover:underline mt-1 inline-block">
                  Start a new session →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <Link
                    key={session._id}
                    href={`/research/${session._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-linear-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-400/20 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{session.sessionName}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </Link>
                ))}
                {recentSessions.length > 0 && (
                  <Link href="/research" className="block text-center text-xs text-violet-400 hover:text-violet-300 pt-2 transition-colors">
                    View all sessions →
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
