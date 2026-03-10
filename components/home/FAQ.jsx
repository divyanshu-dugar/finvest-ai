'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What types of documents can I ingest?',
    a: 'Finvest AI supports SEC 10-K filings (auto-fetched via EDGAR), SEC 10-Q quarterly reports, annual reports, earnings call transcripts, and any custom PDF or text document you upload.',
  },
  {
    q: 'How does the AI avoid hallucinations?',
    a: 'Every answer is grounded via Retrieval-Augmented Generation (RAG). The AI only uses text retrieved from your ingested documents using Qdrant vector search — it never fabricates facts from generic training data.',
  },
  {
    q: 'How long does document ingestion take?',
    a: 'Most SEC 10-K filings are ingested and fully indexed in under 2 minutes. Ingestion runs asynchronously in the background so you can continue using the app while your documents are being processed.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Documents are stored in your private Qdrant collection scoped to your user ID. No other user can access your research data.',
  },
  {
    q: 'Can I research multiple companies?',
    a: 'Absolutely. You can add as many companies as you need, each with its own document library and research sessions. Ask a question in the context of a specific company to get targeted answers.',
  },
  {
    q: 'What is the tech stack?',
    a: 'Finvest AI uses Next.js 15 on the frontend, Node.js + MongoDB on the backend, Python FastAPI + LangChain for the AI service, and Qdrant as the vector database for semantic document retrieval.',
  },
];

function FAQItem({ item, i }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, duration: 0.5 }}
      className="border border-violet-400/15 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-slate-800/50 hover:bg-slate-800 transition-colors group"
      >
        <span className="text-white font-medium text-sm sm:text-base pr-4">{item.q}</span>
        <ChevronDown
          className={`w-5 h-5 text-violet-400 shrink-0 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 text-slate-400 text-sm leading-relaxed bg-slate-900/40">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 bg-slate-950">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-400 text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-4xl font-bold text-white mb-3">
            Common{' '}
            <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              questions
            </span>
          </h2>
        </motion.div>

        {inView && (
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <FAQItem key={i} item={item} i={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
