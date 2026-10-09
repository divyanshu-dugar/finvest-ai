'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AUTH_PATHS, PUBLIC_PATHS } from '@/lib/routes';

export default function RouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isAuthPage = AUTH_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) router.replace('/login');
    else if (user && isAuthPage) router.replace('/dashboard');
  }, [loading, user, isPublic, isAuthPage, router]);

  // Public pages render straight away (good for first paint); everything else waits for auth.
  const waiting = isPublic ? !loading && user && isAuthPage : loading || !user;
  if (waiting) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted" />
      </div>
    );
  }

  return children;
}
