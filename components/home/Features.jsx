'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  FileSearch,
  Brain,
  BarChart3,
  MessageSquare,
  Shield,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: FileSearch,
    title: 'Automated Document Ingestion',
    description:
      'Enter a ticker symbol and let Finvest AI automatically fetch and index SEC 10-K filings, annual reports, and more from EDGAR.',
    accent: 'from-violet-500 to-violet-600',
  },
  {
    icon: Brain,
    title: 'RAG-Powered Q&A',
    description:
      'Ask any question about a company in plain English. Our retrieval-augmented generation finds exact passages and synthesizes precise answers.',
    accent: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'AI SWOT Analysis',
    description:
      'Instantly generate structured Strengths, Weaknesses, Opportunities, and Threats analyses grounded in real filing data.',
    accent: 'from-violet-500 to-indigo-600',
  },
  {
    icon: MessageSquare,
    title: 'Persistent Research Sessions',
    description:
      'Save and resume research sessions per company. Build your knowledge base over time with full conversation history.',
    accent: 'from-indigo-500 to-violet-600',
  },
  {
    icon: Shield,
    title: 'Grounded in Real Data',
    description:
      'Every answer is sourced from ingested documents using Qdrant vector search — no hallucinations from generic training data.',
    accent: 'from-violet-600 to-indigo-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast Semantic Search',
    description:
      'Qdrant vector database enables millisecond retrieval across thousands of document chunks with semantic precision.',
    accent: 'from-indigo-600 to-violet-500',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-400 text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              research smarter
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            From SEC filings to AI-powered SWOT — Finvest AI handles the heavy lifting so you can
            focus on the insight.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              className="group relative p-6 rounded-2xl bg-slate-800/50 border border-violet-400/10 hover:border-violet-400/30 transition-all hover:bg-slate-800"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4 shadow-lg`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
