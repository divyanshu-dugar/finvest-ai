'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Search, CheckCircle2, X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { SECTOR_NAMES } from '@/lib/sectors';
import CompanyLogo from '@/components/company/CompanyLogo';
import Button from '@/components/ui/Button';
import { Card, PageContainer, PageHeader } from '@/components/ui/Card';
import { FieldError, Input, Label, Select, Textarea } from '@/components/ui/Field';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const EXCHANGES = ['NYSE', 'NASDAQ', 'LSE', 'TSX', 'ASX', 'Other'];

const STATE_COUNTRY_MAP = {
  X2: 'Canada', X3: 'United Kingdom', X4: 'Germany', X5: 'France',
  X6: 'Japan', X7: 'Australia', X8: 'China', X9: 'Singapore',
};

const EMPTY_FORM = { name: '', ticker: '', sector: '', exchange: '', description: '', website: '', country: '' };

export default function AddCompanyPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [fillingDetails, setFillingDetails] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    clearTimeout(debounceTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/companies/sec/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectCompany = async (company) => {
    setShowDropdown(false);
    setSearchQuery(`${company.name} (${company.ticker})`);
    setFillingDetails(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/companies/sec/details/${company.cik}`);
      const d = await res.json();
      setForm({
        name: d.name || company.name,
        ticker: d.ticker || company.ticker,
        sector: d.sector || '',
        exchange: d.exchange || '',
        description: d.sicDescription ? `${d.name}. ${d.sicDescription}.` : '',
        website: d.website ? (d.website.startsWith('http') ? d.website : `https://${d.website}`) : '',
        country: STATE_COUNTRY_MAP[d.stateOfIncorporation] || (d.stateOfIncorporation ? 'United States' : ''),
      });
      setAutoFilled(true);
    } catch {
      setForm((prev) => ({ ...prev, name: company.name, ticker: company.ticker }));
    } finally {
      setFillingDetails(false);
    }
  };

  const clearAutoFill = () => {
    setSearchQuery('');
    setAutoFilled(false);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authenticatedFetch(`${API_URL}/companies`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 409 && data.company) {
        toast(data.message);
        router.push(`/companies/${data.company._id}`);
        return;
      }
      if (!res.ok) throw new Error(data.message || 'Failed to add company');
      router.push(`/companies/${data.company._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <PageContainer size="md">
      <Link href="/companies/list" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Companies
      </Link>
      <PageHeader title="Add a company" description="Create a research workspace for a public company." />

      <Card className="p-6 sm:p-7">
        <div ref={searchRef} className="relative">
          <Label htmlFor="company-search" hint="Fills in the form from SEC EDGAR">Find a company</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input
              id="company-search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              placeholder="Company name or ticker, for example Apple or AAPL"
              className="pl-9 pr-10"
              autoComplete="off"
            />
            {(searching || fillingDetails) && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />
            )}
            {autoFilled && !fillingDetails && (
              <button
                type="button"
                onClick={clearAutoFill}
                aria-label="Clear"
                className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {showDropdown && searchQuery.trim() && !searching && (
            <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-fade-up">
              {searchResults.length > 0 ? (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {searchResults.map((company) => (
                    <li key={company.cik}>
                      <button
                        type="button"
                        onMouseDown={() => handleSelectCompany(company)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-canvas"
                      >
                        <CompanyLogo ticker={company.ticker} name={company.name} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">{company.name}</span>
                        <span className="font-mono text-xs text-muted">{company.ticker}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-[13px] text-muted">No matches. Fill in the details below instead.</p>
              )}
            </div>
          )}

          {autoFilled && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-positive">
              <CheckCircle2 className="size-3.5" />
              Filled in from SEC EDGAR. Review before saving.
            </p>
          )}
        </div>

        <div className="my-6 border-t border-line" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Company name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Apple Inc." required />
            </div>
            <div>
              <Label htmlFor="ticker">Ticker</Label>
              <Input id="ticker" name="ticker" value={form.ticker} onChange={handleChange} placeholder="AAPL" className="font-mono uppercase" />
            </div>
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Select id="sector" name="sector" value={form.sector} onChange={handleChange}>
                <option value="">Select a sector</option>
                {SECTOR_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="exchange">Exchange</Label>
              <Select id="exchange" name="exchange" value={form.exchange} onChange={handleChange}>
                <option value="">Select an exchange</option>
                {EXCHANGES.map((x) => <option key={x} value={x}>{x}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" value={form.country} onChange={handleChange} placeholder="United States" />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://apple.com" />
            </div>
          </div>

          <div>
            <Label htmlFor="description" hint="Optional">Description</Label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} className="resize-none" />
          </div>

          <FieldError>{error}</FieldError>

          <div className="flex justify-end gap-2 pt-1">
            <Button href="/companies/list" variant="secondary">Cancel</Button>
            <Button type="submit" loading={loading}>Add company</Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
