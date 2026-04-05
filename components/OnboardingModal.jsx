'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FileText, MessageSquare, ChevronRight, X, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: Building2,
    accent: 'from-violet-500 to-violet-600',
    title: 'Add a company',
    description:
      'Start by adding any publicly traded company. Finvest AI will pull its ticker, sector, and profile automatically from SEC EDGAR.',
    cta: 'Add your first company',
    href: '/companies/add',
  },
  {
    icon: FileText,
    accent: 'from-indigo-500 to-indigo-600',
    title: 'Ingest SEC filings',
    description:
      'Fetch 10-K, 10-Q, or 8-K filings directly from SEC EDGAR. They are chunked, embedded, and indexed into a vector store so the AI can search them instantly.',
    cta: 'Go to Documents',
    href: '/documents',
  },
  {
    icon: MessageSquare,
    accent: 'from-violet-600 to-indigo-500',
    title: 'Ask the AI anything',
    description:
      'Open a research session and ask questions like "What are the key risks?", "Show me 5-year revenue trends", or "Calculate the P/E and ROE" — every answer is cited.',
    cta: 'Start researching',
    href: '/research',
  },
];

const STORAGE_KEY = 'finvest_onboarded';

export default function OnboardingModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  const handleCta = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
      router.push(STEPS[step].href);
    }
  };

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-slate-900 border border-violet-400/20 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${currentStep.accent}`} />

            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Getting started</span>
              </div>

              {/* Icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStep.accent} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{currentStep.title}</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">{currentStep.description}</p>
                </motion.div>
              </AnimatePresence>

              {/* Step dots */}
              <div className="flex items-center gap-1.5 my-6">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`rounded-full transition-all ${
                      i === step ? 'w-6 h-2 bg-violet-500' : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={dismiss}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip tour
                </button>
                <button
                  onClick={handleCta}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${currentStep.accent} hover:opacity-90 text-white text-sm font-semibold transition-all shadow-md`}
                >
                  {step < STEPS.length - 1 ? (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  ) : (
                    <>{currentStep.cta} <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
