'use client';

import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import { FOCUS_PATHS, PUBLIC_PATHS } from '@/lib/routes';

/** Marketing, auth and focus pages (onboarding) render their own header; app pages get the sidebar shell. */
export default function AppFrame({ children }) {
  const pathname = usePathname();
  const ownLayout = PUBLIC_PATHS.includes(pathname) || FOCUS_PATHS.includes(pathname);

  return (
    <MotionConfig reducedMotion="user">
      {ownLayout ? (
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
