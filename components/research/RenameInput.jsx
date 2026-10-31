'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/authenticate';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Inline editor for a session's name. Enter or clicking away saves, Escape cancels. */
export default function RenameInput({ sessionId, name, onDone, className }) {
  const [value, setValue] = useState(name);
  const finished = useRef(false);

  const finish = (newName) => {
    if (finished.current) return;
    finished.current = true;
    onDone(newName);
  };

  const save = async () => {
    const next = value.trim();
    if (!next || next === name) return finish(null);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/research-sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sessionName: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      finish(data.sessionName);
    } catch {
      toast.error('Could not rename the session');
      finish(null);
    }
  };

  return (
    <input
      autoFocus
      value={value}
      maxLength={80}
      aria-label="Session name"
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') finish(null);
      }}
      className={cn('w-full rounded-md border border-brand bg-surface px-2 py-1 text-sm font-medium text-ink outline-none ring-3 ring-brand/15', className)}
    />
  );
}
