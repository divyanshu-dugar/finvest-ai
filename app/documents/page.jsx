'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Trash2, Download, Loader2, ArrowLeft,
  CheckCircle, Clock, AlertCircle, RefreshCw, Building2,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';

const DOC_TYPES = [
  { value: 'sec_10k', label: 'SEC 10-K (Annual)' },
  { value: 'sec_10q', label: 'SEC 10-Q (Quarterly)' },
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'earnings_transcript', label: 'Earnings Call Transcript' },
  { value: 'press_release', label: 'Press Release' },
  { value: 'other', label: 'Other' },
];

const DOCTYPE_LABELS = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

function StatusBadge({ status }) {
  const config = {
    completed: { icon: CheckCircle, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    processing: { icon: Clock, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    failed: { icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    pending: { icon: Clock, color: 'text-slate-400 bg-slate-700 border-slate-600' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${c.color}`}>
      <c.icon className="w-3 h-3" /> {status}
    </span>
  );
}

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const companyIdParam = searchParams.get('companyId');

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(companyIdParam || '');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [ingesting, setIngesting] = useState(false);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState('ingest'); // 'ingest' | 'manual'
  const [addForm, setAddForm] = useState({ title: '', docType: 'sec_10k', year: new Date().getFullYear().toString(), sourceUrl: '', content: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) fetchDocuments(selectedCompany);
    else setDocuments([]);
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
        if (!companyIdParam && data.length > 0) setSelectedCompany(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = useCallback(async (companyId) => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents?companyId=${companyId}`);
      if (res.ok) setDocuments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (docId) => {
    if (!confirm('Remove this document and its Qdrant vectors?')) return;
    setDeleting(docId);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) setDocuments((p) => p.filter((d) => d._id !== docId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleIngest = async () => {
    if (!selectedCompany) return;
    setIngesting(true);
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/ingest`, {
        method: 'POST',
        body: JSON.stringify({ companyId: selectedCompany }),
      });
      if (res.ok) {
        await fetchDocuments(selectedCompany);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIngesting(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      const body = { ...addForm, companyId: selectedCompany };
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add document');
      setDocuments((p) => [data, ...p]);
      setShowAddForm(false);
      setAddForm({ title: '', docType: 'sec_10k', year: new Date().getFullYear().toString(), sourceUrl: '', content: '' });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const currentCompany = companies.find((c) => c._id === selectedCompany);

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Documents</h1>
            <p className="text-slate-400 text-sm mt-1">Manage indexed company documents</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCompany && (
              <>
                <button
                  onClick={handleIngest}
                  disabled={ingesting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-violet-400/20 hover:border-violet-400/40 text-slate-300 hover:text-white text-sm font-medium transition-all disabled:opacity-60"
                >
                  {ingesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Auto-Ingest SEC
                </button>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Document
                </button>
              </>
            )}
          </div>
        </div>

        {/* Company Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {companies.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCompany(c._id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCompany === c._id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>{c.emoji || '🏢'}</span>
              {c.name}
            </button>
          ))}
        </div>

        {/* Add Document form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-violet-400/20 rounded-2xl p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add Document</h3>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    placeholder="Apple 2023 Annual Report"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Document Type *</label>
                  <select
                    value={addForm.docType}
                    onChange={(e) => setAddForm({ ...addForm, docType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500 text-sm"
                  >
                    {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Year</label>
                  <input
                    type="text"
                    value={addForm.year}
                    onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                    placeholder="2024"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Source URL</label>
                  <input
                    type="url"
                    value={addForm.sourceUrl}
                    onChange={(e) => setAddForm({ ...addForm, sourceUrl: e.target.value })}
                    placeholder="https://sec.gov/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Content * (will be chunked and embedded)</label>
                <textarea
                  value={addForm.content}
                  onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                  placeholder="Paste document text here..."
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
                />
              </div>
              {addError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{addError}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={addLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-60">
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add & Embed'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Documents List */}
        {!selectedCompany ? (
          <div className="text-center py-16">
            <Building2 className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">Select a company to view its documents.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No documents for {currentCompany?.name} yet.</p>
            <p className="text-sm text-slate-500">Use &ldquo;Auto-Ingest SEC&rdquo; to fetch 10-K filings or &ldquo;Add Document&rdquo; to paste text.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-800/50 border border-violet-400/10 hover:border-violet-400/20 transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/20 to-indigo-600/20 border border-violet-400/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{doc.title}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{DOCTYPE_LABELS[doc.docType] || doc.docType}</span>
                    {doc.year && <span className="text-xs text-slate-500">· {doc.year}</span>}
                    <span className="text-xs text-slate-500">· {doc.chunkCount || 0} chunks</span>
                    {doc.sourceUrl && (
                      <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:text-violet-300">
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
                <StatusBadge status={doc.status} />
                <button
                  onClick={() => handleDelete(doc._id)}
                  disabled={deleting === doc._id}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  {deleting === doc._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
