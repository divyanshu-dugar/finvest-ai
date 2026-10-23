'use client';

import { useCallback, useRef, useState } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export const isGoogleSignInEnabled = Boolean(CLIENT_ID);

/**
 * Google Identity Services button. Google returns a signed ID token, which the API verifies
 * and exchanges for a Finvest session token.
 */
export default function GoogleSignInButton({ onError }) {
  const containerRef = useRef(null);
  const { login } = useAuth();
  const [pending, setPending] = useState(false);

  const handleCredential = useCallback(async ({ credential }) => {
    setPending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
      login(data.token, data.displayName || data.userName, { onboarded: data.onboarded });
    } catch (err) {
      onError?.(err.message);
      setPending(false);
    }
  }, [login, onError]);

  const renderButton = useCallback(() => {
    const google = window.google;
    if (!google || !containerRef.current) return;
    google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential });
    google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      width: Math.min(containerRef.current.offsetWidth, 400),
    });
  }, [handleCredential]);

  if (!CLIENT_ID) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={renderButton} />
      {/* Fixed height reserves space for Google's iframe so the form doesn't jump when it loads. */}
      <div
        ref={containerRef}
        aria-busy={pending}
        className={`flex h-11 w-full justify-center transition-opacity ${pending ? 'pointer-events-none opacity-50' : ''}`}
      />
    </>
  );
}
