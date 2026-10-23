'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticate';
import { PLANS, QUESTIONS } from '@/lib/onboarding';
import { CONTACT_EMAIL } from '@/lib/site';
import { isSoundEnabled, playCue, setSoundEnabled } from '@/lib/sounds';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import OptionCard from '@/components/onboarding/OptionCard';
import CompanyStep from '@/components/onboarding/CompanyStep';
import PlanStep from '@/components/onboarding/PlanStep';
import SetupScreen from '@/components/onboarding/SetupScreen';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const EASE = [0.22, 1, 0.36, 1];

const COMPANY_STEP = QUESTIONS.length;
const PLAN_STEP = QUESTIONS.length + 1;
const SETUP_STEP = QUESTIONS.length + 2;
const STEP_COUNT = SETUP_STEP; // steps shown in the progress bar

// Single-choice answers advance on their own after a beat, so the selection registers first.
const AUTO_ADVANCE_MS = 380;

const slide = {
  enter: (dir) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir * -28 }),
};

function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** Creates a company workspace from its SEC profile. An existing one (409) counts as success. */
async function addCompany({ cik, ticker, name }) {
  const detailsRes = await authenticatedFetch(`${API_URL}/companies/sec/details/${cik}`);
  const d = detailsRes.ok ? await detailsRes.json() : {};
  const res = await authenticatedFetch(`${API_URL}/companies`, {
    method: 'POST',
    body: JSON.stringify({
      name: d.name || name,
      ticker: d.ticker || ticker,
      sector: d.sector || '',
      exchange: d.exchange || '',
      description: d.sicDescription ? `${d.name}. ${d.sicDescription}.` : '',
      website: d.website ? (d.website.startsWith('http') ? d.website : `https://${d.website}`) : '',
      country: d.stateOfIncorporation ? 'United States' : '',
    }),
  });
  if (!res.ok && res.status !== 409) throw new Error(`Could not add ${name}`);
}

function StepHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-8 text-center">
      <p className="text-[13px] font-medium text-brand">{eyebrow}</p>
      <h1 className="mt-3 text-balance font-display text-[30px] font-normal leading-[1.12] tracking-[-0.025em] text-ink sm:text-[36px]">
        {title}
      </h1>
      {description && <p className="mx-auto mt-3 max-w-md text-balance text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({ persona: null, goals: [], filingExperience: null });
  const [companies, setCompanies] = useState([]);
  const [plan, setPlan] = useState('free');
  const [soundOn, setSoundOn] = useState(true);
  const advanceTimer = useRef(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    return () => clearTimeout(advanceTimer.current);
  }, []);

  const question = QUESTIONS[step];
  const answer = question ? answers[question.id] : null;
  const canContinue = question ? (question.multiple ? answer.length > 0 : Boolean(answer)) : true;

  const goTo = useCallback((next) => {
    clearTimeout(advanceTimer.current);
    setDirection(next > step ? 1 : -1);
    if (next > step) playCue('advance');
    setStep(next);
  }, [step]);

  const choose = useCallback((value) => {
    if (!question) return;
    if (question.multiple) {
      const has = answers[question.id].includes(value);
      playCue(has ? 'deselect' : 'select');
      setAnswers((a) => ({
        ...a,
        [question.id]: has ? a[question.id].filter((v) => v !== value) : [...a[question.id], value],
      }));
      return;
    }
    playCue('select');
    setAnswers((a) => ({ ...a, [question.id]: value }));
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => goTo(step + 1), AUTO_ADVANCE_MS);
  }, [question, answers, goTo, step]);

  const toggleCompany = (company) => {
    const has = companies.some((c) => c.ticker === company.ticker);
    playCue(has ? 'deselect' : 'select');
    setCompanies((list) => (has ? list.filter((c) => c.ticker !== company.ticker) : [...list, company]));
  };

  const selectPlan = (id) => {
    if (id !== plan) playCue('select');
    setPlan(id);
  };

  // Keyboard: number keys pick an answer, Enter continues.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return; // typing in the company search
      if (question && /^[1-9]$/.test(e.key)) {
        const option = question.options[Number(e.key) - 1];
        if (option) choose(option.value);
      } else if (e.key === 'Enter' && !e.target.closest?.('button') && step < SETUP_STEP && canContinue) {
        // A focused button already turns Enter into a click, so only handle Enter elsewhere.
        e.preventDefault();
        goTo(step + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, choose, canContinue, goTo, step]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playCue('select');
  };

  // Built once, when setup starts, from the final answers.
  const tasks = useMemo(() => {
    if (step !== SETUP_STEP) return [];
    const list = [
      {
        label: plan === 'pro' ? 'Saving your preferences and joining the Pro waitlist' : 'Saving your preferences',
        run: async () => {
          const res = await authenticatedFetch(`${API_URL}/api/me/onboarding`, {
            method: 'PUT',
            body: JSON.stringify({ ...answers, plan }),
          });
          if (!res.ok) throw new Error('We couldn’t save your answers. Check your connection and try again.');
        },
      },
    ];
    if (companies.length > 0) {
      list.push({
        label: `Adding ${joinNames(companies.map((c) => c.name))}`,
        // One company failing to load shouldn't hold up the rest of setup.
        run: () => Promise.allSettled(companies.map(addCompany)),
      });
    }
    list.push({ label: 'Opening your dashboard', run: async () => router.prefetch('/dashboard') });
    return list;
  }, [step, answers, companies, plan, router]);

  const finish = useCallback(() => {
    playCue('complete');
    if (plan === 'enterprise') {
      toast(`Thanks for your interest in Enterprise. Email ${CONTACT_EMAIL} and we’ll set up a call.`, { duration: 7000 });
    }
    router.replace('/dashboard');
  }, [plan, router]);

  const skipAll = () => {
    setCompanies([]);
    setPlan('free');
    goTo(SETUP_STEP);
  };

  const firstName = (user?.userName || '').split(/[\s_]/)[0];
  const primaryLabel =
    step === COMPANY_STEP
      ? companies.length ? 'Continue' : 'Skip for now'
      : step === PLAN_STEP
        ? PLANS.find((p) => p.id === plan).cta
        : 'Continue';

  const isSetup = step === SETUP_STEP;
  const width = step === PLAN_STEP ? 'max-w-4xl' : step === COMPANY_STEP ? 'max-w-2xl' : 'max-w-xl';

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          {!isSetup && (
            <div className="flex w-20 items-center gap-1 sm:w-48 sm:gap-1.5" aria-label={`Step ${step + 1} of ${STEP_COUNT}`}>
              {Array.from({ length: STEP_COUNT }, (_, i) => (
                <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-ink transition-transform duration-500 ease-out-quint origin-left"
                    style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
                  />
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
              aria-pressed={soundOn}
              className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-subtle hover:text-ink"
            >
              {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
            {!isSetup && (
              <Button variant="ghost" size="sm" onClick={skipAll}>Skip</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-32 pt-8 sm:px-6 sm:pt-16">
        <div className={cn('w-full', isSetup ? 'max-w-md' : width)}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: EASE }}
            >
              {question && (
                <>
                  <StepHeading
                    eyebrow={step === 0 && firstName ? `Welcome to Finvest AI, ${firstName}` : question.eyebrow}
                    title={question.title}
                    description={question.description}
                  />
                  <div className="space-y-2.5" role={question.multiple ? 'group' : 'radiogroup'} aria-label={question.title}>
                    {question.options.map((option, i) => (
                      <OptionCard
                        key={option.value}
                        option={option}
                        multiple={question.multiple}
                        shortcut={String(i + 1)}
                        selected={question.multiple ? answer.includes(option.value) : answer === option.value}
                        onSelect={() => choose(option.value)}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === COMPANY_STEP && (
                <>
                  <StepHeading
                    eyebrow="Your workspace"
                    title="Pick a few companies to start with"
                    description="Each one gets its own workspace with filings, analysis and research chat. You can add more anytime."
                  />
                  <CompanyStep selected={companies} onToggle={toggleCompany} />
                </>
              )}

              {step === PLAN_STEP && (
                <>
                  <StepHeading
                    eyebrow="Plans"
                    title="Choose how you'd like to start"
                    description="Everything in Finvest AI is free while we're in beta. Paid plans are on the way."
                  />
                  <PlanStep selected={plan} onSelect={selectPlan} />
                </>
              )}

              {isSetup && <SetupScreen tasks={tasks} onDone={finish} onSkip={() => router.replace('/dashboard')} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {!isSetup && (
        <footer className="fixed inset-x-0 bottom-0 border-t border-line bg-canvas/90 backdrop-blur-md">
          <div className={cn('mx-auto flex h-18 w-full items-center justify-between gap-3 px-4 sm:px-6', width)}>
            {step > 0 ? (
              <Button variant="ghost" icon={ArrowLeft} onClick={() => goTo(step - 1)}>Back</Button>
            ) : (
              <span className="text-[13px] text-muted">Takes about a minute</span>
            )}
            <Button onClick={() => goTo(step + 1)} disabled={!canContinue} size="lg" className="min-w-36">
              {primaryLabel}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
