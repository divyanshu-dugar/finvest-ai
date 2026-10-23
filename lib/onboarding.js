import {
  Wallet, BriefcaseBusiness, GraduationCap, Compass, FileText, Scale, TableProperties,
  Eye, PenLine, Sprout, Gauge, BookOpenCheck,
} from 'lucide-react';

// Option values are stored on the user (see finvest-ai-api/models/User.js) and must stay in sync.

export const QUESTIONS = [
  {
    id: 'persona',
    eyebrow: 'Welcome to Finvest AI',
    title: 'Which best describes you?',
    description: 'It helps us shape Finvest AI around the way you work.',
    multiple: false,
    options: [
      { value: 'investor', icon: Wallet, label: 'Individual investor', detail: 'Researching companies for my own portfolio' },
      { value: 'analyst', icon: BriefcaseBusiness, label: 'Professional analyst', detail: 'Equity research, credit or buy-side work' },
      { value: 'student', icon: GraduationCap, label: 'Student or researcher', detail: 'Coursework, a thesis or academic research' },
      { value: 'operator', icon: Compass, label: 'Founder or operator', detail: 'Sizing up competitors, customers or a market' },
    ],
  },
  {
    id: 'goals',
    eyebrow: 'Your first week',
    title: 'What do you want to get done?',
    description: 'Choose as many as you like.',
    multiple: true,
    options: [
      { value: 'read-filings', icon: FileText, label: 'Get through a 10-K faster', detail: 'Find the parts that matter without reading every page' },
      { value: 'compare', icon: Scale, label: 'Compare competitors', detail: 'Line up margins, growth and risks side by side' },
      { value: 'excel', icon: TableProperties, label: 'Pull statements into Excel', detail: 'Clean balance sheets and income statements for a model' },
      { value: 'track', icon: Eye, label: 'Keep tabs on a few companies', detail: 'Catch what changed in each new filing' },
      { value: 'thesis', icon: PenLine, label: 'Write up an investment thesis', detail: 'Build an argument backed by the source documents' },
    ],
  },
  {
    id: 'filingExperience',
    eyebrow: 'One more thing',
    title: 'How well do you know SEC filings?',
    description: 'There is no wrong answer. Everyone starts somewhere.',
    multiple: false,
    options: [
      { value: 'new', icon: Sprout, label: 'Just getting started', detail: "I've rarely opened a 10-K" },
      { value: 'comfortable', icon: Gauge, label: 'Comfortable', detail: 'I know where to find the numbers' },
      { value: 'fluent', icon: BookOpenCheck, label: 'Fluent', detail: 'I read the notes to the financial statements' },
    ],
  },
];

// Quick picks for the company step. CIKs are SEC identifiers, used to fetch each profile.
export const POPULAR_COMPANIES = [
  { ticker: 'AAPL', name: 'Apple', cik: '320193' },
  { ticker: 'MSFT', name: 'Microsoft', cik: '789019' },
  { ticker: 'NVDA', name: 'NVIDIA', cik: '1045810' },
  { ticker: 'AMZN', name: 'Amazon', cik: '1018724' },
  { ticker: 'GOOGL', name: 'Alphabet', cik: '1652044' },
  { ticker: 'JPM', name: 'JPMorgan Chase', cik: '19617' },
  { ticker: 'TSLA', name: 'Tesla', cik: '1318605' },
  { ticker: 'COST', name: 'Costco', cik: '909832' },
];

export const MAX_STARTER_COMPANIES = 3;

// Billing isn't live yet. Everyone starts on Free; choosing Pro or Enterprise records interest.
// Prices and limits here are placeholders for marketing copy and should be confirmed before launch.
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tagline: 'The full product while we\'re in beta.',
    features: ['SEC Explorer for every US-listed company', 'Research chat with cited answers', 'SWOT, summaries, ratios and trends', 'Table extraction to Excel'],
    cta: 'Continue for free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$24',
    cadence: 'per month',
    tagline: 'For people who research every week.',
    features: ['Everything in Free', 'Higher monthly usage limits', 'Priority answers on larger filings', 'Bulk exports and saved comparisons'],
    cta: 'Join the Pro waitlist',
    badge: 'Coming soon',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'for teams',
    tagline: 'For research teams and institutions.',
    features: ['Everything in Pro', 'Shared workspaces and seats', 'SSO and admin controls', 'Dedicated support'],
    cta: 'Talk to us',
  },
];
