import MarketingNav from '@/components/layout/MarketingNav';
import Footer from '@/components/home/Footer';
import { LEGAL_LAST_UPDATED } from '@/lib/site';

/** Shared shell for the privacy policy and terms: page title, date, and long-form typography. */
export default function LegalPage({ title, intro, children }) {
  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
        <p className="text-[13px] font-medium text-brand">Last updated {LEGAL_LAST_UPDATED}</p>
        <h1 className="mt-3 text-balance font-display text-4xl font-normal leading-[1.1] tracking-[-0.025em] text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-muted">{intro}</p>
        <div
          className="mt-12 space-y-10 text-[15px] leading-relaxed text-ink-2
            [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-4 hover:[&_a]:decoration-ink
            [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-ink
            [&_li]:pl-1 [&_p+p]:mt-3 [&_section>*+*]:mt-3 [&_strong]:font-medium [&_strong]:text-ink
            [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-faint"
        >
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
