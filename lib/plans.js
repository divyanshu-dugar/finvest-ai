// Plan descriptions for onboarding and the Plan & usage page. Limits must match the API's
// finvest-ai-api/config/plans.js, which is what actually enforces them.
// Billing isn't live yet: everyone is on Free, and choosing Pro or Enterprise joins a waitlist.
// The Pro price is a placeholder (SUBSCRIPTION_ROADMAP.md, item 2.1).
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    tagline: 'For getting started and occasional research.',
    features: [
      'SEC Explorer for every US-listed company',
      '3 company workspaces',
      '25 AI questions a month',
      '2 SWOT analyses or summaries a month',
      '5 filing imports and 3 table extractions a month',
    ],
    cta: 'Continue for free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$24',
    cadence: 'per month',
    tagline: 'For people who research every week.',
    features: [
      'Everything in Free',
      'Unlimited company workspaces',
      '400 AI questions a month',
      '40 SWOT analyses or summaries a month',
      '100 filing imports and 100 table extractions a month',
    ],
    cta: 'Join the Pro waitlist',
    badge: 'Coming soon',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'for teams',
    tagline: 'For research teams and institutions.',
    features: ['Everything in Pro', 'No monthly usage limits', 'Shared workspaces and seats', 'SSO and dedicated support'],
    cta: 'Talk to us',
  },
];

export const getPlanInfo = (id) => PLANS.find((p) => p.id === id) || PLANS[0];
