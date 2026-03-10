'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { PlusCircle, Download, MessageSquare, TrendingUp } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: PlusCircle,
    title: 'Add a Company',
    description:
      'Enter a company name, ticker symbol, and basic details. Finvest AI creates a dedicated research workspace for it.',
  },
  {
    step: '02',
    icon: Download,
    title: 'Ingest Documents',
    description:
      'Trigger automatic ingestion of SEC 10-K filings from EDGAR or upload your own documents. Chunks are embedded and stored in Qdrant.',
  },
  {
    step: '03',
    icon: MessageSquare,
    title: 'Ask Questions',
    description:
      'Open a research session and ask anything — revenue trends, competitive risks, management strategy. Get cited, grounded answers instantly.',
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'Generate Analysis',
    description:
      'Request a SWOT analysis or executive summary. AI synthesizes insights across all ingested documents into structured, actionable output.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-400 text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            From ticker to insight in{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              4 steps
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No complex setup. Just add a company, ingest its filings, and start asking questions.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {steps.map((s) => (
            <motion.div
              key={s.step}
              variants={itemVariants}
              className="flex gap-5 p-6 rounded-2xl bg-slate-800/40 border border-violet-400/10 hover:border-violet-400/25 transition-all"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-violet-500 mb-1 tracking-widest">
                  STEP {s.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
