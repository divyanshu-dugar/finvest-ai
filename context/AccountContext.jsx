'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authenticatedFetch, USAGE_CHANGED_EVENT } from '@/lib/authenticate';

const AccountContext = createContext(null);

/**
 * The signed-in user's profile, plan and this month's usage (GET /api/me).
 * Refreshes whenever a metered request succeeds, so usage meters stay current.
 */
export function AccountProvider({ children }) {
  const [account, setAccount] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`);
      if (res.ok) setAccount(await res.json());
    } catch {
      // Usage display is non-essential; keep the last known value.
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(USAGE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(USAGE_CHANGED_EVENT, refresh);
  }, [refresh]);

  return <AccountContext.Provider value={{ account, refresh }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}
