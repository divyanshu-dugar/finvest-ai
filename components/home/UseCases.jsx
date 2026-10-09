import { TrendingUp, SearchCheck, BookOpen, Swords } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import SectionHeading from '@/components/home/SectionHeading';

const USE_CASES = [
  {
    icon: TrendingUp,
    audience: 'Investors',
    title: 'Investment research',
    description: 'Work through a 10-K in minutes. Find the revenue drivers, risk factors and competitive position without reading every page.',
  },
  {
    icon: SearchCheck,
    audience: 'Analysts',
    title: 'Due diligence',
    description: 'Ask targeted questions across a company’s filings and surface material risks and key metrics quickly.',
  },
  {
    icon: BookOpen,
    audience: 'Students and researchers',
    title: 'Academic research',
    description: 'Study strategy, governance or industry trends using SEC filings as the primary source, with citations to match.',
  },
  {
    icon: Swords,
    audience: 'Strategy teams',
    title: 'Competitive intelligence',
    description: 'Ask the same question of several competitors and build a clear picture of the landscape.',
  },
];

export default function UseCases() {
  return (
    <section className="border-y border-line bg-surface py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Use cases" title="Built for people who read filings for a living." />

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.title} delay={(i % 2) * 0.06}>
              <div className="h-full rounded-xl border border-line bg-canvas/60 p-7">
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <u.icon className="size-4 text-brand" />
                  {u.audience}
                </div>
                <h3 className="mt-4 font-display text-xl font-medium text-ink">{u.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{u.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
