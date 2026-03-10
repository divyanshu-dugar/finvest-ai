'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, Search, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const floatingVariants = {
  animate: {
    y: [-8, 8, -8],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

const orb = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.5, 0.75, 0.5],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
  },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 pt-16">
      {/* Background orbs */}
      <motion.div
        variants={orb}
        animate="animate"
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        variants={orb}
        animate="animate"
        style={{ animationDelay: '2s' }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-400 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Company Research
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
        >
          Research Any Company{' '}
          <span className="bg-linear-to-r from-violet-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            10x Faster
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Ingest SEC filings, annual reports, and financial documents. Ask deep questions and get
          instant AI-powered answers grounded in real company data.
        </motion.p>

        {/* CTA buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-lg transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50"
          >
            Start Researching
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-violet-400/30 text-slate-300 hover:bg-violet-500/10 hover:text-violet-300 font-semibold text-lg transition-all"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Floating feature pills */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3">
          {[
            { icon: Search, label: 'SEC EDGAR Ingestion' },
            { icon: Brain, label: 'RAG-Powered Q&A' },
            { icon: BarChart3, label: 'SWOT Analysis' },
          ].map(({ icon: Icon, label }) => (
            <motion.div
              key={label}
              variants={floatingVariants}
              animate="animate"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-violet-400/20 text-slate-300 text-sm"
            >
              <Icon className="w-4 h-4 text-violet-400" />
              {label}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
