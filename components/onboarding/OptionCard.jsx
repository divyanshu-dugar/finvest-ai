import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Selectable answer card. Shows a radio dot for single choice and a checkbox for multiple choice. */
export default function OptionCard({ option, selected, multiple, shortcut, onSelect }) {
  const { icon: Icon, label, detail } = option;
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-4 rounded-xl border bg-surface p-4 text-left transition-[border-color,box-shadow,background-color] duration-200',
        selected
          ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]'
          : 'border-line shadow-xs hover:border-line-strong hover:bg-canvas/60',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200',
          selected ? 'border-ink bg-ink text-white' : 'border-line bg-canvas text-ink-2',
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-snug text-ink">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{detail}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        {shortcut && (
          <kbd className="hidden h-5 min-w-5 items-center justify-center rounded border border-line px-1 font-mono text-[11px] text-faint sm:flex">
            {shortcut}
          </kbd>
        )}
        <span
          className={cn(
            'flex size-5 items-center justify-center border transition-colors duration-200',
            multiple ? 'rounded-md' : 'rounded-full',
            selected ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface',
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}
