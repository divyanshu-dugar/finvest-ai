'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, X, AlertCircle, Pencil, Check, RotateCcw, ScanLine } from 'lucide-react';
import { authenticatedFetch, getToken } from '@/lib/authenticate';
import Button from '@/components/ui/Button';
import { Card, CardHeader, EmptyState, PageContainer, PageHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_FILE_MB = 50;

/**
 * Fetch wrapper for multipart uploads. It must not set Content-Type, so the browser can add
 * the multipart boundary itself.
 */
function authenticatedFileFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  return fetch(url, { ...options, headers });
}

const PRESET_TABLES = [
  { label: 'Balance sheet', value: 'balance sheet' },
  { label: 'Income statement', value: 'income statement' },
  { label: 'Cash flow statement', value: 'cash flow statement' },
  { label: 'Shareholders’ equity', value: 'statement of shareholders equity' },
  { label: 'Earnings per share', value: 'earnings per share' },
];

// Indent levels for the label column (0 to 4).
const INDENT_PL = ['pl-3', 'pl-7', 'pl-11', 'pl-15', 'pl-19'];

function ExtractedTable({ result, rows, editMode, onCellEdit }) {
  const { row_styles = [], header_row = 0 } = result;

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-lg border border-line">
      <table className="min-w-full text-[13px] tabular-nums">
        <tbody>
          {rows.map((row, ri) => {
            const style = row_styles[ri] || {};
            const isHeader = style.is_header ?? ri === header_row;
            const isSection = style.is_section ?? false;
            const isCategory = style.is_category ?? false;
            const isTotal = style.is_total ?? false;
            const isBold = style.bold ?? isHeader;
            const indent = Math.min(style.indent ?? 0, 4);

            return (
              <tr
                key={ri}
                className={cn(
                  'border-b border-line last:border-b-0',
                  isHeader && 'bg-subtle',
                  isSection && 'bg-canvas',
                  isTotal && 'border-t border-t-line-strong',
                )}
              >
                {row.map((cell, ci) => {
                  const isLabel = ci === 0;
                  const align = isHeader ? (isLabel ? 'text-left' : 'text-right') : isLabel ? 'text-left' : 'text-right font-mono';
                  const weight = isBold || isTotal || isSection ? 'font-semibold' : isCategory ? 'font-medium' : 'font-normal';

                  if (editMode) {
                    return (
                      <td key={ci} className={cn('px-1.5 py-1', isLabel && INDENT_PL[indent])}>
                        <input
                          value={cell ?? ''}
                          onChange={(e) => onCellEdit(ri, ci, e.target.value)}
                          className={cn(
                            'w-full min-w-20 rounded border border-line bg-surface px-2 py-1 text-[13px] text-ink outline-none focus:border-brand',
                            align,
                            weight,
                          )}
                        />
                      </td>
                    );
                  }

                  const Tag = isHeader ? 'th' : 'td';
                  return (
                    <Tag
                      key={ci}
                      className={cn(
                        'whitespace-nowrap py-2 pr-4',
                        isLabel ? INDENT_PL[indent] : 'pl-4',
                        align,
                        weight,
                        isHeader || isTotal || isSection ? 'text-ink' : 'text-ink-2',
                      )}
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
}

export default function ExtractPage() {
  const [file, setFile] = useState(null);
  const [tableType, setTableType] = useState(PRESET_TABLES[0].value);
  const [customType, setCustomType] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedRows, setEditedRows] = useState([]);
  const fileInputRef = useRef(null);

  // Start a fresh editable copy whenever a new result arrives.
  useEffect(() => {
    setEditedRows(result?.rows ? result.rows.map((row) => [...row]) : []);
    setEditMode(false);
  }, [result]);

  const effectiveTableType = useCustom ? customType.trim() : tableType;

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') return setError('Only PDF files are supported.');
    if (f.size > MAX_FILE_MB * 1024 * 1024) return setError(`File exceeds the ${MAX_FILE_MB} MB limit.`);
    setFile(f);
    setError('');
    setResult(null);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExtract = async () => {
    if (!file) return setError('Choose a PDF first.');
    if (!effectiveTableType) return setError('Choose which table to extract.');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('tableType', effectiveTableType);
      const res = await authenticatedFileFetch(`${API_URL}/api/extract/table`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Extraction failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!result) return;
    setExporting(true);
    try {
      // Send the edited rows so corrections carry into the spreadsheet.
      const payload = { ...result, rows: editedRows.length ? editedRows : result.rows };
      const res = await authenticatedFetch(`${API_URL}/api/extract/excel`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Excel export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(result.title || 'extracted_table').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').toLowerCase()}.xlsx`;
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

  const handleCellEdit = (ri, ci, value) => {
    setEditedRows((prev) => {
      const next = prev.map((row) => [...row]);
      next[ri][ci] = value;
      return next;
    });
  };

  const rows = editedRows.length ? editedRows : result?.rows || [];

  return (
    <PageContainer>
      <PageHeader
        title="Table extractor"
        description="Pull a financial statement out of any PDF. Figures are read from the document itself, never generated."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors',
              dragging ? 'border-brand bg-brand-soft/50' : file ? 'border-line bg-surface' : 'border-line-strong bg-surface hover:border-muted',
            )}
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
                <FileText className="size-7 text-brand" />
                <p className="max-w-full truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove file"
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <>
                <Upload className="size-6 text-muted" />
                <p className="text-sm text-ink-2">
                  <span className="font-medium text-ink">Choose a PDF</span> or drop it here
                </p>
                <p className="text-xs text-faint">Up to {MAX_FILE_MB} MB</p>
              </>
            )}
          </div>

          <Card>
            <CardHeader title="What to extract" />
            <div className="p-3">
              {useCustom ? (
                <Input
                  autoFocus
                  placeholder="For example, segment revenue"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  aria-label="Custom table type"
                />
              ) : (
                <div className="space-y-0.5" role="radiogroup" aria-label="Table type">
                  {PRESET_TABLES.map((p) => {
                    const selected = tableType === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setTableType(p.value)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          selected ? 'bg-subtle font-medium text-ink' : 'text-ink-2 hover:bg-canvas',
                        )}
                      >
                        {p.label}
                        {selected && <Check className="size-4 text-brand" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => { setUseCustom(!useCustom); setCustomType(''); }}
                className="mb-1 mt-2 px-3 py-1 text-[13px] font-medium text-muted hover:text-ink"
              >
                {useCustom ? 'Use a standard statement' : 'Something else'}
              </button>
            </div>
          </Card>

          <Button
            onClick={handleExtract}
            loading={loading}
            icon={ScanLine}
            disabled={!file || !effectiveTableType}
            className="w-full"
            size="lg"
          >
            {loading ? 'Extracting' : 'Extract table'}
          </Button>
        </div>

        <Card className="min-h-96">
          {error ? (
            <div className="m-5 flex items-start gap-3 rounded-lg border border-negative/20 bg-negative-soft p-4 animate-fade-up">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-negative" />
              <p className="text-sm text-negative">{error}</p>
            </div>
          ) : loading ? (
            <EmptyState
              icon={ScanLine}
              title="Scanning the document"
              description={`Finding the ${effectiveTableType} and reading its rows. Large filings can take a minute.`}
              className="py-24"
            />
          ) : result ? (
            <div className="animate-fade-up">
              <CardHeader
                title={result.title}
                description={`Page ${result.page} · ${result.rows?.length ?? 0} rows · ${result.source}`}
                action={
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setEditedRows(result.rows.map((r) => [...r]))}>Reset</Button>
                        <Button size="sm" variant="secondary" icon={Check} onClick={() => setEditMode(false)}>Done</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditMode(true)}>Edit</Button>
                    )}
                    <Button size="sm" variant="brand" icon={Download} loading={exporting} onClick={handleExportExcel}>Excel</Button>
                  </div>
                }
              />
              <div className="p-5">
                {editMode && (
                  <p className="mb-3 text-[13px] text-muted">Click any cell to correct it. Your edits are included in the Excel download.</p>
                )}
                <ExtractedTable result={result} rows={rows} editMode={editMode} onCellEdit={handleCellEdit} />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Your table will appear here"
              description="Works with SEC filings, annual reports and most financial PDFs."
              className="py-24"
            />
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
