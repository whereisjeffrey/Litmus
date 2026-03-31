# Pricing Page Best Practices

## Overview
The pricing page is the most visited page in the consideration phase. Its goal is to help users choose a plan and commit to purchase. Success means users quickly understand the value of each tier, identify the right plan for their needs, and click through to signup or checkout. High-performing pricing pages convert 10-20% of visitors to paid signups.

## Rules

### Plan Display: Recommended Plan Highlighted
- **What to check:** One plan is visually emphasized as "recommended," "most popular," or "best value" through color, size, border, badge, or elevation.
- **Why it matters:** Highlighting a recommended plan increases its selection by 20% (ConversionXL). It reduces decision paralysis by giving users a default choice (anchoring effect).
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Make the recommended plan larger, use a contrasting background color, add a "Most Popular" badge, or elevate it with a shadow/border. It should be visually obvious which plan is recommended.

### Plan Display: 3-4 Plans Maximum Visible
- **What to check:** The page displays no more than 3-4 pricing plans at once. Additional plans (enterprise, custom) can be mentioned separately.
- **Why it matters:** More than 4 visible options triggers decision paralysis (Sheena Iyengar "Jam Study" — too many choices reduce purchases by 90%). 3 plans leverages the "Goldilocks effect" (users choose the middle).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show 3 plans as the primary display: a starter/free tier, a mid-tier (highlighted), and a premium tier. Add enterprise as a "Contact Us" option outside the grid.

### Plan Display: Feature Comparison Table
- **What to check:** A detailed feature comparison table is available (either inline or linked) that shows exactly which features are in each plan.
- **Why it matters:** 67% of SaaS buyers use comparison tables to make their decision (Profitwell). Without one, users can't confidently differentiate plans.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Include a full comparison table below the plan cards. Use checkmarks and X marks. Group features by category. Highlight differentiating features between tiers.

### Plan Display: Annual/Monthly Toggle with Savings Shown
- **What to check:** If both billing frequencies are offered, a toggle or tab lets users switch between annual and monthly pricing. The annual discount is displayed ("Save 20%" or "2 months free").
- **Why it matters:** Showing the savings explicitly increases annual plan adoption by 15-25% (Chargebee data). Annual plans improve LTV and reduce churn.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a toggle above the plan cards. Default to annual pricing. Show savings as both percentage and absolute amount ("Save $120/year — that's 2 months free!").

### Plan Display: Most Popular Badge on Mid-Tier
- **What to check:** A "Most Popular" or "Best Value" badge appears on the mid-tier plan, drawing attention to it.
- **Why it matters:** Social proof applied to pricing increases mid-tier selection by 20-30% (Price Intelligently). The badge leverages the bandwagon effect.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Add a prominent badge to the plan you want most users to select. Use social proof language: "Most Popular" or "Chosen by 70% of teams."

### Plan Display: Free Tier or Free Trial Clearly Presented
- **What to check:** If a free plan or free trial exists, it is clearly presented with its limitations stated upfront.
- **Why it matters:** Free trials convert 15-25% to paid (Totango benchmark). Hiding the free option reduces trust. Clearly showing limitations sets expectations and reduces churn.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Include the free tier in the pricing grid with a clear CTA. List its limitations honestly. Use "Start Free" or "Try Free for 14 Days" as the CTA.

### Plan Display: Per-Seat or Usage Pricing Explained
- **What to check:** If pricing is per-seat, per-user, or usage-based, the unit is clearly stated and a calculator or slider helps users estimate their cost.
- **Why it matters:** Ambiguous pricing is the #2 reason users leave pricing pages (Profitwell). Users need to know their actual cost, not just the per-unit price.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** State the pricing unit clearly (e.g., "$10/user/month"). Provide a slider or calculator for variable pricing. Show example costs for common team sizes.

### CTA Per Plan: Each Plan Has Its Own CTA
- **What to check:** Every pricing plan has its own dedicated CTA button, not a single shared CTA at the bottom.
- **Why it matters:** Per-plan CTAs reduce friction. Users shouldn't have to scroll or figure out how to select a plan. Each plan should be independently actionable.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Add a CTA button to the bottom of each plan card. Make the recommended plan's CTA the most prominent (filled, contrasting color).

### CTA Per Plan: Free Plan CTA Uses Low-Commitment Language
- **What to check:** The free plan's CTA says "Get Started" or "Start Free" rather than "Sign Up" or "Register."
- **Why it matters:** Low-commitment language reduces signup friction. "Get Started" converts 12% higher than "Sign Up" because it implies value, not obligation (Unbounce data).
- **Detection:** AI-required
- **Severity:** info
- **Fix:** Use benefit-oriented text: "Get Started Free", "Start Building Free", or "Try Free." Avoid "Sign Up" or "Create Account" which emphasize the obligation.

### CTA Per Plan: Paid Plan CTA Includes Price
- **What to check:** Paid plan CTAs include or are near the price (e.g., "Start Pro — $49/mo" or the price is immediately above the button).
- **Why it matters:** Including the price in or near the CTA sets clear expectations. No price surprises means fewer drop-offs at checkout.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Show the price immediately above the CTA or include it in the button text. Make sure monthly vs annual price matches the selected toggle state.

### CTA Per Plan: Enterprise CTA Offers Human Contact
- **What to check:** The enterprise/custom plan CTA says "Contact Sales", "Book a Demo", or "Talk to Us" rather than linking to a self-serve checkout.
- **Why it matters:** Enterprise buyers expect consultative selling. Self-serve checkout for enterprise plans signals immaturity and loses high-value deals.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Use "Contact Sales", "Book a Demo", or "Get a Custom Quote." Link to a short form (name, email, company, use case) or a Calendly booking page.

### CTA Per Plan: CTAs Use Action Verbs
- **What to check:** All CTA buttons start with an action verb (Start, Get, Try, Choose, Upgrade) rather than nouns or adjectives.
- **Why it matters:** Action-oriented CTAs outperform passive ones by 25-30% (WordStream). Verbs create momentum toward the action.
- **Detection:** AI-required
- **Severity:** info
- **Fix:** Start every CTA with a verb: "Start Free Trial", "Get Pro", "Choose Team Plan", "Upgrade Now." Avoid "Professional Plan" or "Select" (too passive).

### Pricing Psychology: Prices End in 9
- **What to check:** Prices use charm pricing ending in 9 (e.g., $49, $99, $199) rather than round numbers ($50, $100, $200).
- **Why it matters:** Prices ending in 9 outsell the next round number by 24% (MIT/University of Chicago study, "Effects of $9 Price Endings"). This effect is one of the most replicated in pricing research.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Set prices at $X9 price points ($29, $49, $99). For enterprise/luxury positioning, round numbers can signal premium quality — use judgment for the top tier.

### Pricing Psychology: Annual Savings Highlighted in Both Dollars and Percentage
- **What to check:** The annual billing discount is shown as both a dollar amount and a percentage (e.g., "Save $120/year (20% off)").
- **Why it matters:** Different people respond to different frames. Some are motivated by absolute dollars, others by percentages. Showing both captures more users.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Near the billing toggle, show: "Save 20% with annual billing" and in each plan card, show the specific dollar savings.

### Pricing Psychology: Anchoring with High-Tier First (or Prominent)
- **What to check:** The highest-priced plan is visible (even if de-emphasized) to anchor users' price perception.
- **Why it matters:** The anchoring effect makes the mid-tier seem more reasonable when a high-tier is visible. This increases mid-tier selection by 18-25% (Dan Ariely, "Predictably Irrational").
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Display all tiers including the premium/enterprise tier. Even if it's "Contact Sales," showing a high reference price makes the recommended plan feel like a better deal.

### Pricing Psychology: Money-Back Guarantee Prominently Displayed
- **What to check:** A money-back guarantee (30-day, 60-day, etc.) is visible on the pricing page, near the CTAs.
- **Why it matters:** Money-back guarantees reduce perceived risk and increase conversion by 15-30% (Visual Website Optimizer studies). They signal confidence in the product.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Display a guarantee badge or text near the plan CTAs: "30-day money-back guarantee — no questions asked." Include a small shield or checkmark icon.

### Pricing Psychology: ROI Framing
- **What to check:** The pricing page compares the cost to the value received or the cost of NOT buying (e.g., "Less than the cost of a daily coffee" or "Save 10 hours per week").
- **Why it matters:** ROI framing shifts the conversation from cost to value. Pages with ROI calculators convert 2-3x higher than those without (Profitwell).
- **Detection:** AI-required
- **Severity:** info
- **Fix:** Add a brief ROI statement near the pricing. Optionally include an ROI calculator. Compare to a relatable daily cost ("That's $1.63/day").

### FAQ Section: Common Objections Addressed
- **What to check:** A FAQ section below the pricing table addresses the top 5-7 objections (cancellation, data export, billing, limits, support).
- **Why it matters:** 67% of the buyer's journey is done before talking to sales (SiriusDecisions). Unanswered objections on the pricing page cause users to leave.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Include FAQs for: "Can I cancel anytime?", "What happens after the trial?", "Can I change plans later?", "Is my data exportable?", "What payment methods do you accept?"

### FAQ Section: Trial Details Clear
- **What to check:** If a free trial is offered, the FAQ or a nearby section clearly states: trial length, whether a credit card is required, what happens when it ends, and how to cancel.
- **Why it matters:** Unclear trial terms cause signup anxiety. 40% of users avoid trials that require credit card upfront (Totango). Transparency increases trial starts by 20%.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** State explicitly: "14-day free trial. No credit card required. Cancel anytime." If credit card IS required, explain why and emphasize easy cancellation.

### FAQ Section: Billing Frequency Clear
- **What to check:** The page clearly states whether prices are billed monthly or annually. If shown as a monthly rate on an annual plan, the annual total is also visible.
- **Why it matters:** Deceptive billing displays (showing $10/mo that's actually $120/year billed annually) erode trust and increase chargebacks and cancellations.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Label prices clearly: "$49/month billed monthly" or "$39/month billed annually ($468/year)." Don't show monthly-equivalent prices without the annual total.

### FAQ Section: Refund Policy Stated
- **What to check:** The refund policy is stated on the pricing page or in the FAQ section. Users can find it without leaving the page.
- **Why it matters:** A clear refund policy reduces purchase anxiety and can increase conversion by 10-15%. It also reduces support tickets and chargebacks.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Include in the FAQ: "Full refund within 30 days if you're not satisfied." Link to the complete refund policy for details.

### Layout: Plans Arranged Horizontally
- **What to check:** Pricing plans are displayed side-by-side in a horizontal row (on desktop) for easy visual comparison.
- **Why it matters:** Horizontal layout enables instant comparison. Vertical/stacked layouts on desktop require scrolling and increase cognitive load.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use a 3-4 column grid for plans on desktop. Stack vertically on mobile with the recommended plan first. Ensure columns are equal height for clean alignment.

### Layout: Consistent Information Per Plan
- **What to check:** Each plan card shows the same categories of information in the same order: plan name, price, description, feature list, CTA.
- **Why it matters:** Inconsistent card structures make comparison difficult. Users need to compare apples to apples to make a confident decision.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use a consistent template for each plan card. Show the same number of top features for each (5-7). Use the comparison table for the full list.

### Layout: Currency and Regional Pricing
- **What to check:** Prices display in the user's local currency or a currency selector is available. For global products, regional pricing adjustments are considered.
- **Why it matters:** Seeing prices in a foreign currency adds friction and uncertainty. Localized pricing increases international conversion by 30% (FastSpring data).
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Auto-detect the user's location and show local currency. Add a currency selector for manual override. Consider purchasing power parity pricing for global reach.

### Trust: No Hidden Fees or Asterisks
- **What to check:** Prices shown are the actual prices charged. No asterisks leading to fine print that changes the price. No setup fees, implementation fees, or overage charges hidden in footnotes.
- **Why it matters:** Hidden fees are the #1 pricing page complaint (Trustpilot data). They destroy trust and increase churn after the first billing cycle.
- **Detection:** AI-required
- **Severity:** critical
- **Fix:** Be upfront about all costs. If there are setup fees or overages, state them clearly in the plan card or FAQ. Transparency builds long-term trust.

### Trust: Security and Compliance Badges
- **What to check:** If relevant, compliance badges (SOC 2, GDPR, HIPAA) and security badges (SSL, PCI DSS) appear on the pricing page.
- **Why it matters:** For B2B buyers, compliance is often a prerequisite. Showing compliance badges removes a common blocker in the decision process.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Display relevant compliance badges near the bottom of the pricing section or in the FAQ. Link to your security page or trust center.

### Accessibility: Plan Cards Keyboard Navigable
- **What to check:** Users can navigate between plans and activate CTAs using keyboard only (Tab, Enter).
- **Why it matters:** Required for WCAG 2.1 compliance. Keyboard users and screen reader users must be able to compare and select plans.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Ensure plan cards and CTAs are focusable. Use proper button elements (not divs). Show visible focus indicators. Ensure toggle switches are keyboard accessible.

### Accessibility: Screen Reader Friendly Comparison
- **What to check:** Feature comparison tables use proper table markup (<table>, <th>, <td>) with column and row headers. Feature availability (checkmarks/X) has text alternatives.
- **Why it matters:** Screen reader users cannot interpret visual checkmarks. Proper table markup allows screen readers to announce "Feature X: included in Pro, not included in Starter."
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use semantic <table> markup. Add aria-label or visually hidden text for checkmarks ("Included") and X marks ("Not included"). Use scope attributes on headers.
