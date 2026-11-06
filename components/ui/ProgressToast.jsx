'use client';

import { useEffect, useRef } from 'react';
import toast, { CheckmarkIcon } from 'react-hot-toast';
import { cn } from '@/lib/utils';

/**
 * A success toast with a bar along the bottom that shrinks as its time runs out.
 * The toast closes when the bar is empty. Hovering pauses both the bar and the timer.
 * Close it early with toast.dismiss(id).
 */
function ProgressToast({ t, message, duration }) {
  const timer = useRef(null);
  const endsAt = useRef(0);
  const remaining = useRef(duration);

  const resume = () => {
    endsAt.current = Date.now() + remaining.current;
    timer.current = setTimeout(() => toast.dismiss(t.id), remaining.current);
  };

  const pause = () => {
    clearTimeout(timer.current);
    remaining.current = Math.max(0, endsAt.current - Date.now());
  };

  useEffect(() => {
    resume();
    return () => clearTimeout(timer.current);
    // Runs once per toast: the timer lives in refs, not in render state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={pause}
      onMouseLeave={resume}
      className={cn(
        'group relative w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[10px] border border-line bg-white',
        'shadow-[0_12px_32px_-8px_rgb(18_20_18/0.16),0_2px_6px_rgb(18_20_18/0.06)]',
        'transition-[opacity,transform] duration-200 ease-out',
        t.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      )}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-3 text-sm leading-snug text-ink">
        <span className="mt-px shrink-0">
          <CheckmarkIcon primary="#0b6e4f" secondary="#fff" />
        </span>
        <p>{message}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-soft motion-reduce:hidden">
        <div
          className="animate-countdown h-full origin-left bg-brand group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

/** Show a success toast with a countdown bar. Returns the toast id. */
export function progressToast(message, { duration = 15000, id } = {}) {
  return toast.custom((t) => <ProgressToast t={t} message={message} duration={duration} />, {
    id,
    duration: Infinity, // ProgressToast closes itself when its bar runs out
  });
}
