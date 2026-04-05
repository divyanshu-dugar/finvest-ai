'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, TableProperties, Download, Loader2,
  X, CheckCircle, AlertCircle, ChevronDown, Sparkles,
  Pencil, Eye, RotateCcw,
} from 'lucide-react';
import { authenticatedFetch, getToken } from '@/lib/authenticate';

/**
 * Fetch wrapper for multipart file uploads — does NOT set Content-Type so the
 * browser can attach the correct multipart/form-data boundary automatically.
 */
function authenticatedFileFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}

const PRESET_TABLES = [
  { label: 'Balance Sheet', value: 'balance sheet' },
  { label: 'Income Statement', value: 'income statement' },
  { label: 'Cash Flow Statement', value: 'cash flow statement' },
  { label: 'Statement of Shareholders\' Equity', value: 'statement of shareholders equity' },
  { label: 'Earnings Per Share', value: 'earnings per share' },
];

export default function ExtractPage() {
  const [file, setFile] = useState(null);
  const [tableType, setTableType] = useState('balance sheet');
  const [customType, setCustomType] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null); // extracted table JSON
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedRows, setEditedRows] = useState([]);
  const fileInputRef = useRef(null);

  // Sync editable rows whenever a new result arrives
  useEffect(() => {
    if (result?.rows) {
      setEditedRows(result.rows.map(row => [...row]));
      setEditMode(false);
    } else {
      setEditedRows([]);
    }
  }, [result]);

  const effectiveTableType = useCustom ? customType.trim() : tableType;

  // ── File handling ────────────────────────────────────────────────────────

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File exceeds the 50 MB limit.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── Extract ──────────────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!file) { setError('Please select a PDF first.'); return; }
    if (!effectiveTableType) { setError('Please specify a table type.'); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('tableType', effectiveTableType);

      const res = await authenticatedFileFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/extract/table`,
        { method: 'POST', body: form }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Extraction failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────────────

  const handleExportExcel = async () => {
    if (!result) return;
    setExporting(true);
    try {
      // Send editedRows so any user corrections are reflected in the Excel file
      const payload = { ...result, rows: editedRows.length ? editedRows : result.rows };
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/extract/excel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error('Excel export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = (result.title || 'extracted_table').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
      a.download = `${title}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // Update a single cell value in edit mode
  const handleCellEdit = (ri, ci, value) => {
    setEditedRows(prev => {
      const next = prev.map(row => [...row]);
      next[ri][ci] = value;
      return next;
    });
  };

  const handleReset = () => {
    if (result?.rows) setEditedRows(result.rows.map(row => [...row]));
  };

  // ── Table render ─────────────────────────────────────────────────────────

  // Indent levels → Tailwind padding classes (0 → pl-0, 1 → pl-4, 2 → pl-8, …)
  const INDENT_PL = ['pl-0', 'pl-4', 'pl-8', 'pl-12', 'pl-16'];

  const renderTable = () => {
    const rows = editMode ? editedRows : (editedRows.length ? editedRows : result?.rows);
    if (!rows?.length) return null;
    const { row_styles = [], header_row = 0 } = result;

    return (
      <div className="overflow-x-auto rounded-xl border border-violet-400/20">
        <table className="min-w-full text-sm">
          <tbody>
            {rows.map((row, ri) => {
              const style = row_styles[ri] || {};
              const isHeader   = style.is_header   ?? (ri === header_row);
              const isSection  = style.is_section  ?? false;
              const isCategory = style.is_category ?? false;
              const isTotal    = style.is_total    ?? false;
              const isBold     = style.bold        ?? isHeader;
              const indent     = Math.min(style.indent ?? 0, 4);

              // Row background
              const rowBg = isHeader
                ? 'bg-violet-700'
                : isSection
                ? 'bg-slate-700'
                : isCategory
                ? 'bg-slate-800'
                : isTotal
                ? 'bg-violet-950/60 border-t border-violet-400/20'
                : ri % 2 === 0
                ? 'bg-slate-800/60'
                : 'bg-slate-800/30';

              const textColor = isHeader || isSection
                ? 'text-white'
                : isCategory
                ? 'text-slate-200'
                : isTotal
                ? 'text-violet-200'
                : 'text-slate-300';

              return (
                <tr key={ri} className={rowBg}>
                  {row.map((cell, ci) => {
                    const isLabelCol = ci === 0;
                    const indentClass = isLabelCol ? (INDENT_PL[indent] || 'pl-16') : '';
                    const alignClass  = isHeader
                      ? 'text-center'
                      : isLabelCol
                      ? 'text-left'
                      : 'text-right font-mono tracking-tight';
                    const boldClass   = isBold ? 'font-bold' : 'font-normal';

                    if (editMode) {
                      return (
                        <td key={ci} className={`px-2 py-1 ${isLabelCol ? indentClass : ''}`}>
                          <input
                            value={cell ?? ''}
                            onChange={e => handleCellEdit(ri, ci, e.target.value)}
                            className={`w-full bg-slate-700/70 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-violet-400 text-slate-100 ${alignClass} ${boldClass}`}
                          />
                        </td>
                      );
                    }

                    const Tag = isHeader ? 'th' : 'td';
                    return (
                      <Tag
                        key={ci}
                        className={`px-4 py-2 whitespace-nowrap ${alignClass} ${boldClass} ${textColor} ${isLabelCol ? indentClass : ''}`}
                      >
                        {cell ?? ''}
                      </Tag>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
              <TableProperties className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Table Extractor</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Upload a financial PDF and extract any statement table — numbers are read verbatim from the document, never generated by AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left panel: controls ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                dragging
                  ? 'border-violet-400 bg-violet-500/10'
                  : file
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-slate-700 hover:border-violet-500/50 hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {file ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <p className="text-sm font-medium text-green-400">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(''); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500" />
                  <p className="text-sm text-slate-400 text-center">
                    <span className="text-violet-400 font-medium">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-slate-600">PDF only · max 50 MB</p>
                </>
              )}
            </div>

            {/* Table type selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <label className="block text-sm font-medium text-slate-300">What to extract</label>

              {!useCustom && (
                <div className="grid grid-cols-1 gap-2">
                  {PRESET_TABLES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setTableType(p.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                        tableType === p.value
                          ? 'bg-violet-600 border-violet-500 text-white font-medium'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-400/40 hover:text-white'
                      }`}
                    >
                      {tableType === p.value && <span className="mr-2">✓</span>}
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {useCustom && (
                <input
                  type="text"
                  placeholder="e.g. Segment Revenue Breakdown"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                />
              )}

              <button
                onClick={() => { setUseCustom(!useCustom); setCustomType(''); }}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {useCustom ? '← Use presets' : '+ Custom table type'}
              </button>
            </div>

            {/* Extract button */}
            <button
              onClick={handleExtract}
              disabled={loading || !file || !effectiveTableType}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Extract Table</>
              )}
            </button>

            {/* Accuracy note */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Numbers are extracted directly from PDF structure using pdfplumber —
              the AI only identifies which section to look at. Figures are never generated or recalled.
            </p>
          </div>

          {/* ── Right panel: result ── */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 gap-4"
                >
                  <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-slate-300 font-medium">Scanning document…</p>
                    <p className="text-slate-500 text-sm mt-1">Identifying {effectiveTableType} pages and extracting table structure</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Result header */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{result.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Extracted from page {result.page} · {result.rows?.length ?? 0} rows
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit / View toggle */}
                      {editMode ? (
                        <>
                          <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-all"
                            title="Reset edits"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Done
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {/* Excel download */}
                      <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-60"
                      >
                        {exporting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {exporting ? 'Generating…' : 'Download Excel'}
                      </button>
                    </div>
                  </div>

                  {/* Edit mode banner */}
                  {editMode && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      <Pencil className="w-3.5 h-3.5 shrink-0" />
                      Editing mode — click any cell to correct it. Changes will be reflected in the downloaded Excel file.
                    </div>
                  )}

                  {/* Table */}
                  {renderTable()}

                  {/* Source badge */}
                  <p className="text-xs text-slate-600">
                    Source: {result.source} · Numbers are verbatim from the PDF
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 gap-4"
                >
                  <FileText className="w-14 h-14 text-slate-800" />
                  <div className="text-center">
                    <p className="text-slate-500">Upload a PDF and click Extract Table</p>
                    <p className="text-slate-700 text-sm mt-1">Supports SEC filings, Bloomberg exports, annual reports</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
