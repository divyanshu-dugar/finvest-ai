import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS = {
  completed: { label: 'Indexed', icon: CheckCircle2, className: 'bg-positive-soft text-positive' },
  processing: { label: 'Processing', icon: Clock, className: 'bg-warning-soft text-warning' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-subtle text-muted' },
  failed: { label: 'Failed', icon: AlertCircle, className: 'bg-negative-soft text-negative' },
};

export default function StatusBadge({ status, className }) {
  const { label, icon: Icon, className: tone } = STATUS[status] || STATUS.pending;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium leading-normal', tone, className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
