import { FileSearch, Quote, LayoutGrid, MessagesSquare, LineChart, TableProperties } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import SectionHeading from '@/components/home/SectionHeading';

const FEATURES = [
  {
    icon: FileSearch,
    title: 'SEC Explorer',
    description: 'Search any US-listed company and read its 10-K and 10-Q filings side by side with an analyst that has read them too.',
  },
  {
    icon: Quote,
    title: 'Answers with citations',
    description: 'Every answer points back to the section of the filing it came from, so checking a number takes seconds.',
  },
  {
    icon: LayoutGrid,
    title: 'SWOT and summaries',
    description: 'Generate a structured SWOT or an executive summary from the documents you have indexed for a company.',
  },
  {
    icon: LineChart,
    title: 'Ratios and trends',
    description: 'Pull multi-year figures from XBRL data and compute margins, returns and growth rates without a spreadsheet.',
  },
  {
    icon: MessagesSquare,
    title: 'Research sessions',
    description: 'Keep a running conversation per company, with full history, so your work builds up instead of starting over.',
  },
  {
    icon: TableProperties,
    title: 'Table extraction',
    description: 'Lift balance sheets and income statements out of any PDF, correct a cell if needed, and export to Excel.',
  },
];

export default function Features() {
  return (
    <section id="product" className="scroll-mt-20 border-t border-line bg-surface py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Product"
          title="Everything you need to understand a business."
          description="Built around the primary source. Finvest AI reads the filings so you can spend your time on judgement."
        />

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.06} className="bg-surface p-7">
              <div className="flex size-10 items-center justify-center rounded-lg border border-line bg-canvas">
                <f.icon className="size-5 text-brand" />
              </div>
              <h3 className="mt-5 font-display text-lg font-medium text-ink">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
