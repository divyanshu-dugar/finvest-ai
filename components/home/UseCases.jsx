'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { TrendingUp, Search, BookOpen, Briefcase } from 'lucide-react';

const useCases = [
  {
    icon: TrendingUp,
    title: 'Investment Research',
    description:
      'Analyze 10-K filings for any public company in minutes. Identify revenue drivers, risk factors, and competitive positioning without reading hundreds of pages.',
    tag: 'For Investors',
  },
  {
    icon: Search,
    title: 'Due Diligence',
    description:
      'Accelerate M&A due diligence by asking targeted questions across multiple company documents. Surface material risks and key metrics instantly.',
    tag: 'For Analysts',
  },
  {
    icon: BookOpen,
    title: 'Academic Research',
    description:
      'Study corporate strategy, governance, or industry trends using real SEC filings as a primary source. Get cited answers backed by document evidence.',
    tag: 'For Researchers',
  },
  {
    icon: Briefcase,
    title: 'Competitive Intelligence',
    description:
      'Compare multiple competitors side by side. Ask the same question across different companies to rapidly build competitive landscape maps.',
    tag: 'For Strategy Teams',
  },
];

export default function UseCases() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-400 text-sm font-medium mb-4">
            Use Cases
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built for{' '}
            <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              every researcher
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="p-6 rounded-2xl bg-slate-800/50 border border-violet-400/10 hover:border-violet-400/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-500/20 to-indigo-600/20 border border-violet-400/20 flex items-center justify-center shrink-0">
                  <uc.icon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{uc.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-400/20">
                      {uc.tag}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{uc.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
