import { getSector } from '@/lib/sectors';
import { cn } from '@/lib/utils';

export default function SectorBadge({ sector, className }) {
  if (!sector) return null;
  const { icon: Icon, color } = getSector(sector);
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium leading-normal',
        className,
      )}
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 9%, transparent)` }}
    >
      <Icon className="size-3 shrink-0" strokeWidth={2.25} />
      <span className="truncate">{sector}</span>
    </span>
  );
}
