'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Each step stays on screen at least this long so the progress reads as deliberate, not a flash.
const MIN_STEP_MS = 650;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs the setup tasks in order and shows their progress. Every row is a real request.
 * tasks: [{ label, run: () => Promise }]
 */
export default function SetupScreen({ tasks, onDone, onSkip }) {
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const started = useRef(false);

  const runFrom = useCallback(async (start) => {
    setError('');
    for (let i = start; i < tasks.length; i++) {
      setCurrent(i);
      try {
        await Promise.all([tasks[i].run(), wait(MIN_STEP_MS)]);
      } catch (err) {
        setError(err.message || 'Something went wrong');
        return;
      }
    }
    setCurrent(tasks.length);
    await wait(350);
    onDone();
  }, [tasks, onDone]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runFrom(0);
  }, [runFrom]);

  const progress = Math.round((Math.min(current, tasks.length) / tasks.length) * 100);

  return (
    <div className="mx-auto w-full max-w-md text-center">
      <LogoMark className="mx-auto size-12" />
      <h1 className="mt-6 font-display text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-ink">
        {error ? 'That didn’t go through' : 'Setting up your workspace'}
      </h1>
      <p className="mt-2 text-sm text-muted">{error ? error : 'This only takes a moment.'}</p>

      <div className="mt-8 h-1 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out-quint" style={{ width: `${progress}%` }} />
      </div>

      <ul className="mt-8 space-y-3 text-left">
        {tasks.map((task, i) => {
          const state = i < current ? 'done' : i === current ? (error ? 'error' : 'running') : 'pending';
          return (
            <li key={task.label} className={cn('flex items-center gap-3 text-sm transition-colors duration-300', state === 'pending' ? 'text-faint' : 'text-ink')}>
              <span className="flex size-5 shrink-0 items-center justify-center">
                {state === 'done' && <span className="flex size-5 items-center justify-center rounded-full bg-ink text-white animate-fade-up"><Check className="size-3" strokeWidth={3} /></span>}
                {state === 'running' && <Loader2 className="size-4 animate-spin text-muted" />}
                {state === 'error' && <AlertCircle className="size-5 text-negative" />}
                {state === 'pending' && <span className="size-1.5 rounded-full bg-line-strong" />}
              </span>
              {task.label}
            </li>
          );
        })}
      </ul>

      {error && (
        <div className="mt-8 flex justify-center gap-2 animate-fade-up">
          <Button variant="secondary" onClick={onSkip}>Go to dashboard</Button>
          <Button onClick={() => runFrom(current)}>Try again</Button>
        </div>
      )}
    </div>
  );
}
