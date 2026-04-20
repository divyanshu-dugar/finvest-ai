'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const publicPaths = ['/', '/login', '/register'];

export default function RouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicPaths.includes(pathname);

    if (!user && !isPublic) {
      router.push('/login');
      setAuthorized(false);
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }
  }, [pathname, router, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return authorized ? children : null;
}
