import Reveal from '@/components/motion/Reveal';
import SectionHeading from '@/components/home/SectionHeading';

const STEPS = [
  {
    title: 'Pick a company',
    description: 'Search by name or ticker. Profile, sector and filings come straight from SEC EDGAR.',
  },
  {
    title: 'Bring in the filings',
    description: 'Import 10-K, 10-Q or 8-K filings, or add your own documents. Each one is indexed for search.',
  },
  {
    title: 'Ask questions',
    description: 'Revenue drivers, risk factors, guidance. Get answers that cite the section they came from.',
  },
  {
    title: 'Build the analysis',
    description: 'Generate a SWOT or summary, compare ratios over time, and keep it all in one workspace.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From ticker to insight in four steps."
          description="No setup, no data pipelines. Add a company and start reading."
        />

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.07} className="border-t border-ink pt-5">
              <span className="font-mono text-[13px] text-muted">0{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-medium text-ink">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
