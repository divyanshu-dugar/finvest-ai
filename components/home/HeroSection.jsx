'use client';

import { ArrowRight, FileText, Quote } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

// Hero animates with CSS (animate-fade-up) so it plays on first paint, before the page hydrates.
const delay = (ms) => ({ animationDelay: `${ms}ms` });

function HeroActions() {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-12" />;

  if (user) {
    return (
      <Button href="/dashboard" size="lg">
        Open dashboard
        <ArrowRight className="size-4" />
      </Button>
    );
  }
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
      <Button href="/register" size="lg">
        Get started free
        <ArrowRight className="size-4" />
      </Button>
      <Button href="/login" size="lg" variant="secondary">
        Sign in
      </Button>
    </div>
  );
}

const FILINGS = [
  { form: '10-Q', date: 'Aug 26, 2026', active: true },
  { form: '10-Q', date: 'May 20, 2026' },
  { form: '10-K', date: 'Feb 25, 2026' },
  { form: '10-Q', date: 'Nov 19, 2025' },
];

/** Static preview of the SEC Explorer, built from the real NVIDIA Q2 FY2027 10-Q. */
function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
      <div className="flex items-center gap-2 border-b border-line bg-subtle/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 truncate text-xs text-muted">SEC Explorer · NVIDIA Corp · Form 10-Q</span>
      </div>

      <div className="grid text-left md:grid-cols-[200px_1fr_280px]">
        <div className="hidden border-r border-line p-3 md:block">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Filings</p>
          {FILINGS.map((f) => (
            <div
              key={f.date}
              className={`mb-1 flex items-center gap-2.5 rounded-lg px-2 py-2 ${f.active ? 'bg-subtle' : ''}`}
            >
              <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-2 ring-1 ring-line">
                {f.form}
              </span>
              <span className="text-xs text-ink-2">{f.date}</span>
            </div>
          ))}
        </div>

        <div className="border-b border-line p-5 md:border-b-0 md:border-r">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Condensed statements of income</p>
          <p className="mt-1 font-display text-lg text-ink">Three months ended July 26, 2026</p>
          <div className="mt-4 divide-y divide-line rounded-lg border border-line text-[13px] tabular-nums">
            {[
              ['Revenue', '$96,221', '$46,743', true],
              ['Cost of revenue', '24,079', '12,890'],
              ['Gross profit', '72,142', '33,853'],
              ['Net income', '$59,688', '$26,422'],
            ].map(([label, now, prior, highlight]) => (
              <div key={label} className={`grid grid-cols-[1fr_auto_auto] gap-6 px-3 py-2 ${highlight ? 'bg-brand-soft/70' : ''}`}>
                <span className="text-ink-2">{label}</span>
                <span className="font-medium text-ink">{now}</span>
                <span className="text-muted">{prior}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-faint">In millions of USD. Current quarter and prior year.</p>
        </div>

        <div className="space-y-3 bg-canvas/50 p-5">
          <div className="ml-auto w-fit max-w-[90%] rounded-xl rounded-br-sm bg-ink px-3 py-2 text-[13px] text-white">
            What were revenue and earnings this quarter?
          </div>
          <div className="rounded-xl rounded-bl-sm border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-ink-2">
            Revenue was <strong className="font-semibold text-ink">$96.2 billion</strong>, up 106% from $46.7 billion a year
            earlier. Net income was <strong className="font-semibold text-ink">$59.7 billion</strong>.
            <span className="mt-2 flex w-fit items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 text-[11px] text-muted">
              <Quote className="size-3" /> Item 2, Management&apos;s Discussion
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-faint">
            <FileText className="size-3.5" /> Ask about this filing
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:pb-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] text-ink-2 shadow-xs">
            <span className="size-1.5 rounded-full bg-brand" />
            Built on SEC EDGAR data
          </span>
        </div>

        <h1
          style={delay(80)}
          className="animate-fade-up mx-auto mt-6 max-w-4xl text-balance font-display text-[2.75rem] font-normal leading-[1.06] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.25rem]"
        >
          Company research, grounded in the filings.
        </h1>

        <p
          style={delay(160)}
          className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
        >
          Read any 10-K or 10-Q, ask questions in plain English, and get answers that point to the exact section they
          came from.
        </p>

        <div style={delay(240)} className="animate-fade-up mt-9 flex justify-center">
          <HeroActions />
        </div>

        <div style={delay(360)} className="animate-fade-up relative mx-auto mt-16 max-w-5xl">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
