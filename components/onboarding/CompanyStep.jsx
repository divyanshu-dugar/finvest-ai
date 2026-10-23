'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { MAX_STARTER_COMPANIES, POPULAR_COMPANIES } from '@/lib/onboarding';
import CompanyLogo from '@/components/company/CompanyLogo';
import { Input } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Pick up to three companies: popular quick picks plus SEC search. */
export default function CompanyStep({ selected, onToggle }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef(null);

  useEffect(() => () => clearTimeout(debounce.current), []);

  const isSelected = (ticker) => selected.some((c) => c.ticker === ticker);
  const full = selected.length >= MAX_STARTER_COMPANIES;

  const handleSearch = (value) => {
    setQuery(value);
    clearTimeout(debounce.current);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/companies/sec/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data.filter((r) => r.ticker).slice(0, 5) : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  };

  const pick = (company) => {
    onToggle(company);
    setQuery('');
    setResults([]);
  };

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={full ? `You can pick up to ${MAX_STARTER_COMPANIES} for now` : 'Search any US-listed company'}
          disabled={full}
          className="h-11 pl-9 pr-9"
          aria-label="Search companies"
          autoComplete="off"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />}
        {results.length > 0 && (
          <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop animate-fade-up">
            {results.map((r) => (
              <li key={r.cik}>
                <button
                  type="button"
                  onClick={() => pick({ ticker: r.ticker, name: r.name, cik: String(r.cik) })}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-canvas"
                >
                  <CompanyLogo ticker={r.ticker} name={r.name} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.name}</span>
                  <span className="font-mono text-xs text-muted">{r.ticker}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-[0.08em] text-faint">Popular picks</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POPULAR_COMPANIES.map((c) => {
          const on = isSelected(c.ticker);
          return (
            <button
              key={c.ticker}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={!on && full}
              onClick={() => onToggle(c)}
              className={cn(
                'relative flex items-center gap-2.5 rounded-xl border bg-surface p-2.5 text-left transition-[border-color,box-shadow,opacity] duration-200 disabled:opacity-40',
                on ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line shadow-xs hover:border-line-strong',
              )}
            >
              <CompanyLogo ticker={c.ticker} name={c.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">{c.name}</span>
                <span className="block font-mono text-[11px] text-muted">{c.ticker}</span>
              </span>
              {on && (
                <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-ink text-white">
                  <Check className="size-2.5" strokeWidth={3.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex min-h-8 flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted tabular-nums">
          {selected.length} of {MAX_STARTER_COMPANIES} selected
        </span>
        {selected
          .filter((c) => !POPULAR_COMPANIES.some((p) => p.ticker === c.ticker))
          .map((c) => (
            <span key={c.ticker} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface py-1 pl-2 pr-1 text-[13px] text-ink">
              {c.name}
              <button
                type="button"
                onClick={() => onToggle(c)}
                aria-label={`Remove ${c.name}`}
                className="flex size-5 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
      </div>
    </div>
  );
}
