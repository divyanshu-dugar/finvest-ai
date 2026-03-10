'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const publicPaths = ['/', '/login', '/register'];

export default function RouteGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublic = publicPaths.includes(pathname);

    if (!token && !isPublic) {
      router.push('/login');
      setAuthorized(false);
    } else if (token && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  return authorized ? children : null;
}
