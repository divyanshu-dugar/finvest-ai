'use client';

import { useState } from 'react';
import { getSector } from '@/lib/sectors';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'size-8 rounded-lg text-[11px]',
  md: 'size-10 rounded-lg text-xs',
  lg: 'size-14 rounded-xl text-base',
};

// Public, key-free logo source keyed by ticker. Unknown tickers 404 and fall back to a monogram.
const logoUrl = (ticker) => `https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`;

function initials(name = '') {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
}

export default function CompanyLogo({ ticker, name, sector, size = 'md', className }) {
  const [failedTicker, setFailedTicker] = useState(null);
  const showImage = ticker && failedTicker !== ticker;
  const { color } = getSector(sector);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden border border-line bg-surface',
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- external logos, sized by the container
        <img
          src={logoUrl(ticker)}
          alt=""
          loading="lazy"
          className="size-full object-contain p-1.5"
          onError={() => setFailedTicker(ticker)}
        />
      ) : (
        <span
          className="flex size-full items-center justify-center font-display font-medium"
          style={{ color, backgroundColor: `color-mix(in oklab, ${color} 8%, white)` }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
