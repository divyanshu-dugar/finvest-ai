'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FileText, MessagesSquare, ArrowRight, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    icon: Building2,
    title: 'Add a company',
    description:
      'Search any publicly traded company. Its ticker, sector and profile are filled in automatically from SEC EDGAR.',
    cta: 'Add your first company',
    href: '/companies/add',
  },
  {
    icon: FileText,
    title: 'Import SEC filings',
    description:
      'Bring in 10-K, 10-Q or 8-K filings straight from EDGAR. Each one is indexed so the assistant can search it.',
    cta: 'Go to documents',
    href: '/documents',
  },
  {
    icon: MessagesSquare,
    title: 'Ask anything',
    description:
      'Open a research session and ask about risks, revenue trends or ratios. Answers cite the filing they came from.',
    cta: 'Start researching',
    href: '/research',
  },
];

const STORAGE_KEY = 'finvest_onboarded';
const EASE = [0.22, 1, 0.36, 1];

export default function OnboardingModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  const isLast = step === STEPS.length - 1;
  const handleNext = () => {
    if (!isLast) return setStep((s) => s + 1);
    dismiss();
    router.push(STEPS[step].href);
  };

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={dismiss} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-pop"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
            >
              <X className="size-4" />
            </button>

            <p className="text-[13px] font-medium text-brand">Getting started · {step + 1} of {STEPS.length}</p>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="mt-5"
              >
                <div className="flex size-11 items-center justify-center rounded-xl border border-line bg-canvas">
                  <current.icon className="size-5 text-brand" />
                </div>
                <h2 id="onboarding-title" className="mt-5 font-display text-xl font-medium text-ink">{current.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{current.description}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Step ${i + 1}`}
                  className={cn('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-6 bg-ink' : 'w-1.5 bg-line-strong')}
                />
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={dismiss}>Skip</Button>
              <Button onClick={handleNext}>
                {isLast ? current.cta : 'Next'}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
