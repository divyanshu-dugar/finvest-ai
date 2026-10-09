'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import SectionHeading from '@/components/home/SectionHeading';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'Which documents can I work with?',
    a: 'SEC 10-K, 10-Q and 8-K filings, fetched directly from EDGAR. You can also add annual reports, earnings call transcripts or any other text you paste in.',
  },
  {
    q: 'How do you keep answers accurate?',
    a: 'Answers are generated only from the filing or documents you are working with, and each one cites the section it relies on. When the source does not cover a question, the assistant says so instead of guessing.',
  },
  {
    q: 'How long does importing a filing take?',
    a: 'Most filings are indexed in under two minutes. Importing runs in the background, so you can keep working while it finishes.',
  },
  {
    q: 'Is my research private?',
    a: 'Yes. Your companies, documents and research sessions are scoped to your account and are not visible to anyone else.',
  },
  {
    q: 'Can I research more than one company?',
    a: 'Yes. Each company gets its own workspace with documents, research sessions and analysis.',
  },
  {
    q: 'Is this investment advice?',
    a: 'No. Finvest AI is a research tool. Verify important figures against the original filing before relying on them.',
  },
];

function FAQItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base font-medium text-ink">{item.q}</span>
        <Plus
          className={cn('size-5 shrink-0 text-muted transition-transform duration-300 ease-out-quint', open && 'rotate-45')}
        />
      </button>
      {/* grid-rows animates to the content's natural height without JS measurement */}
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out-quint',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-10 text-[15px] leading-relaxed text-muted">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <SectionHeading eyebrow="FAQ" title="Questions, answered." />
        <Reveal className="border-t border-line">
          {FAQS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
