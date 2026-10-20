import { Inter, Sometype_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import AppFrame from '@/components/layout/AppFrame';
import RouteGuard from '@/components/RouteGuard';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const sometypeMono = Sometype_Mono({ subsets: ['latin'], variable: '--font-sometype', display: 'swap' });

// Google Sans Flex isn't in next/font's catalogue yet, so it's self-hosted (SIL Open Font License).
const googleSans = localFont({
  src: './fonts/GoogleSansFlex-Latin.woff2',
  variable: '--font-google-sans',
  weight: '1 1000',
  display: 'swap',
});

const SITE_DESCRIPTION = 'Read SEC filings, ask questions with cited answers, and build research on any public company.';

// Icons (app/icon.svg, app/apple-icon.png) and the share image (app/opengraph-image.png)
// are picked up from the app directory automatically.
export const metadata = {
  metadataBase: new URL('https://finvest-ai.tech'),
  title: 'Finvest AI | Company research, grounded in SEC filings',
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Finvest AI',
    title: 'Finvest AI',
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  themeColor: '#f6f6f3',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sometypeMono.variable} ${googleSans.variable}`}>
      <body className="font-sans text-[15px] antialiased">
        <AuthProvider>
          <RouteGuard>
            <AppFrame>{children}</AppFrame>
          </RouteGuard>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#121412',
              border: '1px solid #e4e3dd',
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: '0 12px 32px -8px rgb(18 20 18 / 0.16), 0 2px 6px rgb(18 20 18 / 0.06)',
            },
            success: { iconTheme: { primary: '#0b6e4f', secondary: '#fff' } },
            error: { iconTheme: { primary: '#b93a26', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
