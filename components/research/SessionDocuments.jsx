'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, FileText, Plus, X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** The documents a session could use, and which of them are attached to it. */
export function useSessionDocuments(session) {
  const sessionId = session?._id;
  const companyId = session?.companyId?._id;
  const [documents, setDocuments] = useState([]);
  const [attachedIds, setAttachedIds] = useState([]);

  const reload = useCallback(async () => {
    const res = await authenticatedFetch(`${API_URL}/documents${companyId ? `?companyId=${companyId}` : ''}`);
    if (res.ok) setDocuments((await res.json()).filter((d) => d.status !== 'failed'));
  }, [companyId]);

  useEffect(() => {
    if (!sessionId) return;
    setAttachedIds(session.documentIds || []);
    reload().catch(() => {});
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (id) => {
    const previous = attachedIds;
    const next = previous.includes(id) ? previous.filter((d) => d !== id) : [...previous, id];
    setAttachedIds(next);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions/${sessionId}/documents`, {
        method: 'PUT',
        body: JSON.stringify({ documentIds: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setAttachedIds(previous);
      toast.error('Could not update the attached documents');
    }
  };

  return { documents, attached: documents.filter((d) => attachedIds.includes(d._id)), attachedIds, toggle, reload };
}

function DocumentOption({ doc, selected, onToggle }) {
  const ready = doc.status === 'completed';
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={selected}
      disabled={!ready}
      onClick={() => onToggle(doc._id)}
      className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-subtle disabled:opacity-60 disabled:hover:bg-transparent"
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
          selected ? 'border-ink bg-ink text-white' : 'border-line-strong',
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] leading-snug text-ink">{doc.title}</span>
        {!ready && <span className="mt-0.5 block text-xs text-muted">Still indexing</span>}
      </span>
    </button>
  );
}

/** The + button in the composer, with a menu of documents to attach. */
export function AttachButton({ documents, attachedIds, onToggle, onOpen, company }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open) onOpen().catch(() => {});
    setOpen(!open);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Attach documents"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Attach documents"
        className={cn(
          'flex size-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-subtle hover:text-ink',
          open && 'bg-subtle text-ink',
        )}
      >
        <Plus className={cn('size-4.5 transition-transform', open && 'rotate-45')} />
      </button>

      {open && (
        <div role="menu" className="absolute bottom-full left-0 z-20 mb-3 w-80 max-w-[calc(100vw-3rem)] animate-fade-up rounded-xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-medium text-ink">Documents for this session</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">The AI only reads what you attach here.</p>
          </div>
          {documents.length === 0 ? (
            <p className="px-4 py-5 text-[13px] leading-relaxed text-muted">
              {company ? `${company.name} has no documents yet.` : 'You have no documents yet.'}
            </p>
          ) : (
            <div className="scrollbar-thin max-h-64 overflow-y-auto p-1.5">
              {documents.map((doc) => (
                <DocumentOption key={doc._id} doc={doc} selected={attachedIds.includes(doc._id)} onToggle={onToggle} />
              ))}
            </div>
          )}
          <Link
            href={company ? `/documents?companyId=${company._id}` : '/documents'}
            className="flex items-center gap-1.5 border-t border-line px-4 py-2.5 text-[13px] font-medium text-ink-2 hover:text-ink"
          >
            <Plus className="size-3.5" /> Import or add documents
          </Link>
        </div>
      )}
    </div>
  );
}

/** Chips above the message box, one per attached document. */
export function AttachedDocuments({ documents, onRemove }) {
  if (documents.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-1.5 pt-0.5">
      {documents.map((doc) => (
        <span key={doc._id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-canvas py-1 pl-2 pr-1 text-xs text-ink-2">
          <FileText className="size-3.5 shrink-0 text-muted" />
          <span className="truncate">{doc.title}</span>
          <button
            type="button"
            onClick={() => onRemove(doc._id)}
            aria-label={`Remove ${doc.title}`}
            className="flex size-4.5 shrink-0 items-center justify-center rounded text-faint transition-colors hover:bg-subtle hover:text-ink"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

