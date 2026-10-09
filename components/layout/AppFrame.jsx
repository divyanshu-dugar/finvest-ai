'use client';

import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import { PUBLIC_PATHS } from '@/lib/routes';

/** Marketing and auth pages render their own header; app pages get the sidebar shell. */
export default function AppFrame({ children }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  return (
    <MotionConfig reducedMotion="user">
      {isPublic ? (
        children
      ) : (
        <>
          <Sidebar />
          <main className="min-h-dvh pt-14 lg:pl-64 lg:pt-0">{children}</main>
        </>
      )}
    </MotionConfig>
  );
}
