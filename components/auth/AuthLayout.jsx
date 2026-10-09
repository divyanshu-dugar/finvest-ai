import Link from 'next/link';
import Logo from '@/components/Logo';
import GoogleSignInButton, { isGoogleSignInEnabled } from '@/components/auth/GoogleSignInButton';

export default function AuthLayout({ title, description, footer, onGoogleError, children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="text-center">
            <h1 className="font-display text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-ink">{title}</h1>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-7">
            {isGoogleSignInEnabled && (
              <>
                <GoogleSignInButton onError={onGoogleError} />
                <div className="my-6 flex items-center gap-3 text-xs text-faint">
                  <span className="h-px flex-1 bg-line" />
                  or
                  <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </main>
    </div>
  );
}

export function AuthLink({ href, children }) {
  return (
    <Link href={href} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
      {children}
    </Link>
  );
}
