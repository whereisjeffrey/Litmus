/**
 * Goal Library — the five curated UX goals Litmus can evaluate a page or
 * journey against, each encoded with the behavioral-science lenses, the
 * deterministic signals to collect, and the scoring rubric that define it.
 *
 * This is the product's UX IP. The scanner answers "is this page healthy?";
 * these goals answer "does this experience get a human to DO the thing?" —
 * reasoned through how attention, motivation, friction, and persuasion
 * actually work, not just accessibility and standards compliance.
 *
 * Consumed by:
 *   - the extension (goal picker UI, deterministic signal collection)
 *   - the API (builds the goal-aware Claude prompt from these definitions)
 */

import type { GoalDefinition, GoalId } from "./types";
import { PageType } from "./types";

// ─── 1. Reach the conversion point fast ─────────────────────────────

const REACH_CONVERSION_FAST: GoalDefinition = {
  id: "reach-conversion-fast",
  label: "Reach the conversion point fast",
  tagline: "Get the visitor from here to checkout / signup / booking in as few steps and as little friction as possible.",
  icon: "🏁",
  suggestedFor: [PageType.Homepage, PageType.Landing, PageType.Product, PageType.Pricing],
  targetOutcome:
    "A motivated visitor can reach the primary conversion action (payment, signup, booking, demo request) in the fewest possible clicks, with each step removing doubt rather than adding it.",
  upsideMetric: "conversion rate",
  psychologyLenses: [
    {
      principle: "Hick's Law",
      meaning: "Decision time grows with the number and complexity of choices presented.",
      application: "Every competing CTA, nav item, or branch on the path to conversion adds hesitation. The fast path has one obvious next step at each stage.",
    },
    {
      principle: "Fitts's Law",
      meaning: "Time to acquire a target depends on its size and distance.",
      application: "Primary CTAs should be large, high-contrast, and positioned where the eye already is (above the fold, end of the value pitch) — not small links in a crowded header.",
    },
    {
      principle: "Cognitive load / Miller's Law",
      meaning: "Working memory is limited; extraneous load crowds out progress.",
      application: "Each step that forces the user to read, compare, or remember something unrelated to buying slows the journey. Defer everything non-essential.",
    },
    {
      principle: "Goal-gradient effect",
      meaning: "Motivation increases as people perceive themselves nearing a goal.",
      application: "Show progress and proximity to completion (steps, 'almost done'). Hiding how far the finish line is kills momentum.",
    },
  ],
  signals: [
    { key: "clicksToTarget", label: "Clicks to conversion", description: "Minimum number of clicks from the current page to the primary conversion action." },
    { key: "primaryCtaCount", label: "Competing primary CTAs", description: "Number of equally-weighted primary calls-to-action on the page (more = more hesitation)." },
    { key: "navItemCount", label: "Navigation options", description: "Count of top-level navigation links that can pull the user off the conversion path." },
    { key: "ctaAboveFold", label: "CTA above the fold", description: "Whether the primary conversion CTA is visible without scrolling." },
    { key: "interstitialCount", label: "Interstitials / detours", description: "Pop-ups, cookie walls, upsells, or required detours encountered on the path." },
  ],
  rubric: [
    { key: "pathLength", label: "Path length", description: "Few steps; no unnecessary pages between intent and conversion.", weight: 0.3 },
    { key: "ctaClarity", label: "CTA clarity & prominence", description: "One obvious, specific, well-placed next action at every step.", weight: 0.3 },
    { key: "distraction", label: "Freedom from distraction", description: "Minimal competing choices, detours, or interruptions on the path.", weight: 0.25 },
    { key: "momentum", label: "Momentum & reassurance", description: "Progress is visible and each step reduces doubt rather than adding it.", weight: 0.15 },
  ],
};

// ─── 2. Complete the form / checkout ────────────────────────────────

const COMPLETE_THE_FORM: GoalDefinition = {
  id: "complete-the-form",
  label: "Complete the form / checkout",
  tagline: "Once a user starts the critical form or checkout, get them to finish it without abandoning.",
  icon: "✅",
  suggestedFor: [PageType.Checkout, PageType.Signup, PageType.Contact],
  targetOutcome:
    "A user who begins the form completes it: every field is justified, errors are easy to recover from, and nothing surprises them late enough to make them quit.",
  upsideMetric: "form completion rate",
  psychologyLenses: [
    {
      principle: "Friction / sunk-cost & effort aversion",
      meaning: "Each additional field or step is a chance to quit; perceived effort predicts abandonment.",
      application: "Cut fields to the minimum, group logically, and never ask for what you can infer or defer. The benchmark is ~7 fields for checkout.",
    },
    {
      principle: "Zeigarnik effect & progress",
      meaning: "People are pulled to finish tasks they perceive as in-progress and nearly done.",
      application: "Show a step indicator and pre-fill/auto-format so the user always feels close to done.",
    },
    {
      principle: "Error recovery / forgiveness",
      meaning: "Frustration from unrecoverable or unclear errors causes immediate abandonment.",
      application: "Inline validation on blur, specific error messages next to the field, never lose entered data on error.",
    },
    {
      principle: "Loss aversion & surprise costs",
      meaning: "Late-revealed costs feel like a loss and trigger walk-away.",
      application: "Show shipping, tax, and fees early; never spring them at the final step (the #1 checkout abandonment cause).",
    },
  ],
  signals: [
    { key: "fieldCount", label: "Total fields", description: "Number of visible input fields across the whole form/checkout." },
    { key: "requiredFieldCount", label: "Required fields", description: "How many fields are mandatory vs optional." },
    { key: "hasInlineValidation", label: "Inline validation", description: "Whether fields validate on blur with field-level messages." },
    { key: "hasGuestOption", label: "Guest checkout", description: "Whether the user can proceed without creating an account." },
    { key: "stepsCount", label: "Steps", description: "Number of discrete steps/pages in the form flow." },
    { key: "costsShownEarly", label: "Costs shown early", description: "Whether shipping/tax/fees are visible before the final step." },
  ],
  rubric: [
    { key: "effort", label: "Effort minimization", description: "Field count and steps reduced to the essential; smart defaults and autofill.", weight: 0.3 },
    { key: "errorRecovery", label: "Error recovery", description: "Inline, specific, forgiving validation; data never lost.", weight: 0.25 },
    { key: "transparency", label: "Cost & expectation transparency", description: "No surprise costs or steps; the user always knows what's next.", weight: 0.25 },
    { key: "trustAtPoint", label: "Trust at the point of action", description: "Security cues and reassurance near payment/submit.", weight: 0.2 },
  ],
};

// ─── 3. Capture the lead ────────────────────────────────────────────

const CAPTURE_THE_LEAD: GoalDefinition = {
  id: "capture-the-lead",
  label: "Capture the lead",
  tagline: "Turn an anonymous visitor into a known lead — an email, a contact, a started account.",
  icon: "🎣",
  suggestedFor: [PageType.Landing, PageType.Homepage, PageType.About, PageType.Pricing],
  targetOutcome:
    "The visitor understands the value, trusts the exchange, and gives their contact info because the perceived reward clearly exceeds the perceived cost of doing so.",
  upsideMetric: "lead capture rate",
  psychologyLenses: [
    {
      principle: "Fogg Behavior Model (B = MAT)",
      meaning: "Behavior happens when Motivation, Ability, and a Trigger converge.",
      application: "Raise motivation (clear, specific value), raise ability (make the ask tiny — just an email), and place a clear trigger (one prominent CTA) at the moment of peak intent.",
    },
    {
      principle: "Value exchange / reciprocity",
      meaning: "People give more freely when they receive something concrete first.",
      application: "Lead with what they get (the guide, the demo, the saved cart). Vague 'sign up for updates' undersells the exchange.",
    },
    {
      principle: "Commitment & micro-yes ladders",
      meaning: "Small initial commitments make larger ones more likely.",
      application: "Ask for the smallest viable first step; defer everything else to after the email is captured.",
    },
    {
      principle: "5-second clarity test",
      meaning: "If the value isn't obvious in ~5 seconds, most visitors leave.",
      application: "The headline must state the specific benefit, not the company's cleverness.",
    },
  ],
  signals: [
    { key: "valuePropClarity", label: "Value-prop presence", description: "Whether a benefit-led headline states what the visitor gets, above the fold." },
    { key: "leadCtaCount", label: "Lead CTAs", description: "Number of distinct lead-capture asks and whether one is clearly primary." },
    { key: "leadFormFields", label: "Lead form fields", description: "How many fields the lead form asks for (fewer = higher capture)." },
    { key: "hasSocialProof", label: "Social proof present", description: "Whether testimonials, logos, counts, or ratings are visible near the ask." },
    { key: "exchangeSpecificity", label: "Exchange specificity", description: "Whether the offer is concrete ('get the 2024 report') vs vague ('subscribe')." },
  ],
  rubric: [
    { key: "valueClarity", label: "Value clarity", description: "The benefit is specific, obvious, and framed around the visitor.", weight: 0.3 },
    { key: "askSize", label: "Ask size", description: "The first commitment is tiny and the form is short.", weight: 0.25 },
    { key: "triggerPlacement", label: "Trigger placement", description: "One prominent CTA at the moment of peak motivation.", weight: 0.2 },
    { key: "credibility", label: "Credibility at the ask", description: "Social proof and risk-reversal reduce hesitation right where the ask is.", weight: 0.25 },
  ],
};

// ─── 4. Read to the end ─────────────────────────────────────────────

const READ_TO_THE_END: GoalDefinition = {
  id: "read-to-the-end",
  label: "Read all the way to the end",
  tagline: "Keep the visitor engaged so they reach the end of the content — and the message or CTA waiting there.",
  icon: "📖",
  suggestedFor: [PageType.Blog, PageType.Landing, PageType.About, PageType.Product],
  targetOutcome:
    "A reader who starts keeps scrolling: the content earns continued attention at every screen, and the payload at the end (CTA, conclusion) is actually reached.",
  upsideMetric: "scroll-through / read-completion rate",
  psychologyLenses: [
    {
      principle: "Information scent & the F-pattern",
      meaning: "Readers scan, following cues that promise the content they want; weak scent makes them bail.",
      application: "Strong subheads, front-loaded value, and scannable structure keep the scent alive screen after screen.",
    },
    {
      principle: "Cognitive load & readability",
      meaning: "Dense, low-contrast, wide-measure text exhausts readers and they quit.",
      application: "Comfortable measure (50–75 chars), generous line height, chunked paragraphs, and visual breaks sustain reading.",
    },
    {
      principle: "Curiosity gap & open loops",
      meaning: "Unresolved questions pull readers forward to get closure.",
      application: "Open loops early ('here's why X fails — more below'), resolve them progressively to keep momentum.",
    },
    {
      principle: "Peak-End Rule",
      meaning: "People judge an experience by its peak and its end.",
      application: "The ending must deliver a satisfying payoff and a clear next step — not trail off or dump links.",
    },
  ],
  signals: [
    { key: "wordCount", label: "Content length", description: "Approximate word count of the main content." },
    { key: "avgParagraphLength", label: "Avg paragraph length", description: "Average words per paragraph (long blocks reduce completion)." },
    { key: "subheadCount", label: "Subheadings", description: "Number of subheadings breaking up the content (scannability)." },
    { key: "lineLength", label: "Line measure", description: "Characters per line of body text (ideal 50–75)." },
    { key: "hasEndCta", label: "End CTA present", description: "Whether a clear next step exists at the end of the content." },
    { key: "distractionDensity", label: "Mid-content distractions", description: "Ads, pop-ups, or unrelated interruptions within the reading flow." },
  ],
  rubric: [
    { key: "scent", label: "Information scent", description: "Subheads and structure continuously signal value worth continuing for.", weight: 0.3 },
    { key: "readability", label: "Readability comfort", description: "Measure, spacing, and chunking make sustained reading effortless.", weight: 0.25 },
    { key: "momentumDevices", label: "Momentum devices", description: "Open loops, transitions, and pacing pull the reader forward.", weight: 0.2 },
    { key: "endingPayoff", label: "Ending payoff", description: "A satisfying conclusion and a single clear next step at the end.", weight: 0.25 },
  ],
};

// ─── 5. Build trust fast ────────────────────────────────────────────

const BUILD_TRUST_FAST: GoalDefinition = {
  id: "build-trust-fast",
  label: "Build trust before the ask",
  tagline: "Establish credibility quickly so hesitation doesn't kill the conversion when you ask.",
  icon: "🛡️",
  suggestedFor: [PageType.Homepage, PageType.Landing, PageType.Pricing, PageType.Checkout, PageType.About],
  targetOutcome:
    "A first-time visitor feels the site is legitimate, competent, and safe before being asked to commit — so trust is never the reason they walk.",
  upsideMetric: "conversion rate",
  psychologyLenses: [
    {
      principle: "Stanford Web Credibility (design = trust)",
      meaning: "Most people judge credibility first by visual design and professionalism.",
      application: "Polished, consistent, error-free presentation is itself a trust signal; visual sloppiness reads as risk.",
    },
    {
      principle: "Social proof (Cialdini)",
      meaning: "People look to others' behavior to decide what's safe and correct.",
      application: "Specific testimonials, recognizable logos, real numbers, and ratings — positioned before the ask, not buried in a footer.",
    },
    {
      principle: "Authority & expertise cues",
      meaning: "Credentials, named people, and evidence raise perceived competence.",
      application: "Real names, faces, credentials, certifications, and concrete results beat anonymous claims.",
    },
    {
      principle: "Risk reversal & loss aversion",
      meaning: "Reducing the downside of acting is often more persuasive than amplifying the upside.",
      application: "Guarantees, free returns, security badges, and transparent policies shrink the perceived cost of saying yes.",
    },
  ],
  signals: [
    { key: "socialProofPresent", label: "Social proof", description: "Whether testimonials, logos, counts, or ratings are present and specific." },
    { key: "trustBadgePresent", label: "Trust/security badges", description: "Whether security or compliance badges appear near the ask." },
    { key: "namedAuthority", label: "Named authority", description: "Whether real people, credentials, or named sources back the claims." },
    { key: "riskReversalPresent", label: "Risk reversal", description: "Whether guarantees, returns, or transparent policies reduce perceived risk." },
    { key: "visualPolish", label: "Visual polish", description: "Whether design is consistent and free of obvious errors (proxy via scan)." },
    { key: "trustBeforeAsk", label: "Trust before the ask", description: "Whether trust signals appear before, not after, the conversion ask." },
  ],
  rubric: [
    { key: "professionalism", label: "Professionalism", description: "Polished, consistent, error-free presentation.", weight: 0.25 },
    { key: "socialProof", label: "Social proof quality", description: "Specific, credible proof from real others, well-placed.", weight: 0.3 },
    { key: "authority", label: "Authority & evidence", description: "Named people, credentials, and concrete results.", weight: 0.2 },
    { key: "riskReversal", label: "Risk reversal & transparency", description: "Guarantees, policies, and security cues that shrink perceived risk.", weight: 0.25 },
  ],
};

// ─── Registry ───────────────────────────────────────────────────────

/** All curated goals, in display order. */
export const GOALS: GoalDefinition[] = [
  REACH_CONVERSION_FAST,
  COMPLETE_THE_FORM,
  CAPTURE_THE_LEAD,
  READ_TO_THE_END,
  BUILD_TRUST_FAST,
];

/** Lookup by id (excludes "custom", which has no static definition). */
export const GOALS_BY_ID: Record<Exclude<GoalId, "custom">, GoalDefinition> = {
  "reach-conversion-fast": REACH_CONVERSION_FAST,
  "complete-the-form": COMPLETE_THE_FORM,
  "capture-the-lead": CAPTURE_THE_LEAD,
  "read-to-the-end": READ_TO_THE_END,
  "build-trust-fast": BUILD_TRUST_FAST,
};

export function getGoal(id: GoalId): GoalDefinition | undefined {
  return id === "custom" ? undefined : GOALS_BY_ID[id];
}

/** Suggest the most relevant goals for a detected page type, best first. */
export function suggestGoalsForPage(pageType: PageType): GoalDefinition[] {
  const matches = GOALS.filter((g) => g.suggestedFor.includes(pageType));
  const rest = GOALS.filter((g) => !g.suggestedFor.includes(pageType));
  return [...matches, ...rest];
}
