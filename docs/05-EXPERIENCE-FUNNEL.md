# Phase 5 — The Experience Funnel: how we make them need it

**Status:** working draft, 2026-11-11. High-fidelity design is paused; this doc defines the full experience (drawer → dashboard) at the structural level so we can judge whether it's compelling before we polish anything.

**The test this doc has to pass:** a founder runs one scan and thinks *"oh my god, I need this in my life."* Not "neat tool." Need.

---

## 1. The spine: give sharp → show scale → name the stakes

The funnel is three acts. Each act has one job and one emotion.

| Act | Surface | Job | Emotion |
|---|---|---|---|
| 1. **The proof** | Drawer, first 60 seconds | Two findings so sharp they'd pay a consultant for either one. Free, fully revealed. | *"They know my site better than I do."* |
| 2. **The scale** | Drawer + dashboard | Show the volume behind the sample — located, classified, counted. Withheld, not hidden. | *"That was two of ELEVEN?"* |
| 3. **The stakes** | Dashboard | Tie everything to business exposure and say what to expect when it's fixed. | *"Every week I don't fix this costs me."* |

The core trade: **we are generous with diagnosis quality and withholding with breadth and treatment.** The free sample is our *best* material, not our leftovers — a mediocre free sample implies a mediocre paid product. What's withheld: the other findings' mechanisms, every fix, the cross-page journey, and the reasoning.

**The trailer problem** (and why this doesn't cause it): if the two best scenes are free, does paying feel like the rest of the movie sucking? No — because the free peak and the paid peak are different goods, and the paid one is structurally reserved:

1. **Full diagnosis, zero treatment — even on the sharp pair.** The free finding tells you you're sick with total precision; the cure (exact fix, rewritten copy, before/after exhibit, the steelman) is paid. Doctor model, not trailer model.
2. **The climax can't leak.** The biggest finding in most audits is a journey-class finding (a promise that breaks across pages) — and free scans one page, so that class is *structurally* paid. The megaphone gets to say, honestly: *"the loudest thing we found isn't on this page."*
3. **Breadth withholding on the sharp pair:** diagnose one instance at full sharpness; hold its siblings — *"the same break appears in 2 more places — held for the full report."*
4. Good trailers show real scenes but never the ending. Our ending is the fix, the journey, and your numbers.

> **This revises an earlier decision.** We previously said free = all findings on the page, fully visible. New rule: free = the 1–2 sharpest findings *complete* (exhibit, evidence, citation, Show Me), plus every remaining finding **located, classified, and counted** — but with mechanism and fix withheld. The honest-teaser laws still hold absolutely: every count real, every location real, nothing claimed that wasn't generated. We never blur text. We withhold like a doctor scheduling the follow-up, not like a paywall.
>
> **Imagery is the exception (decided 2026-11-11):** the no-blur law protects *our diagnosis text*, not *their pixels*. Locked findings may show their own screenshot blurred under a sharp located caption — the blur proves the evidence exists. And one locked finding per report gets the **"spot it" treatment**: the crop shown *clear* with the ring hidden — *"We see something in this screenshot. Do you?"* — so they hunt their own UI for the flaw. Blur never touches words, and never appears without a real located/classified caption above it.

---

## 2. Act 1 — the proof (drawer, first scan)

**What displays, in order:**

1. **The Read** — 2–3 sentences, business register, already exposure-framed: not "we found some issues" but *"this page makes three promises your checkout later breaks — and it spends credibility on urgency it doesn't need."*
2. **The sharp pair** — the two highest-conviction findings, fully expanded. Each carries: the exhibit (their pixels, ringed), the evidence quote, the research anchor (cited, never free-recalled), Show Me on the live page, and one line of consequence in exec language.
3. **The count row** — real numbers only: "11 findings · 2 shown in full · every one survived adversarial review."
4. **One named theme** — when findings cluster (see Act 2), Act 1 closes by naming exactly one site-wide habit with its count: *"Six of these are one habit: **The Overpromise** — your site keeps writing checks the checkout won't cash."* The name and count are free; the evidence stack and the other themes are paid. The sticky name is deliberate marketing: it's the sentence they'll repeat in Monday's standup.

**Example — a sharp card, final copy register:**

> **Your checkout hides the $14.90 shipping fee until after the address form.**
> The reveal lands at step 4 of 4 — after the customer has done all the work. Unexpected costs surfaced late are the most-cited reason US shoppers abandon carts (48%, Baymard 2024). This is a known contributor to abandonment at your single highest-intent moment.
> [exhibit: their totals block, Shipping ringed] [Show me] [Why it survived 🔒]

**What deliberately does NOT display in Act 1:**

- No score, no grade, no severity dashboard up front — nothing that lets them file us under "audit tool."
- No fix on the sharp pair's siblings. No list of everything else yet — the count row only.
- No technical findings anywhere near the top (they live collapsed at the bottom, unsold).
- No ask. Act 1 ends without a CTA. The restraint is the credibility.

**Choosing the sharp pair** (pipeline rule, not editorial whim): highest conviction × **undeniability** (the best exhibit) × business exposure — in that order. Undeniability converts skeptics; raw stakes retain customers. Prefer a finding with a cross-instance count ("14 of 16 products") or a money moment (pricing, payment, signup). The global #1 by exposure is usually journey-class anyway — reserved as the paid climax, never spent here.

---

## 3. Act 2 — the scale (the Missed Opportunities board)

Not a list. A board of **opportunity cards**, ranked loudest-first by estimated exposure. Each teased finding follows the ambiguity formula:

> **State WHERE (exactly) and WHAT CLASS (and its stakes). Withhold WHAT and HOW.**

Specificity about location and classification is what makes the tease credible — like a home inspector saying "you have a structural issue in the northeast corner of the foundation." You believe him *because he pointed at a corner*, and you still need him to tell you what it is.

**Opportunity card anatomy:** class label → one located sentence → one stakes sentence (anchored, cited where we have it) → status line.

**Examples, final copy register:**

> **TRUST BREAK · between product page and cart**
> A promise made in your hero is contradicted two steps later, at the moment customers compare totals. Contradictions of this class are documented drivers of cart abandonment.
> *Located · verified · held for the full report.*

> **COMMITMENT MISMATCH · your wishlist**
> One low-stakes feature demands more commitment than your cart does. The inconsistency teaches customers to hesitate.
> *Located · verified · fix drafted.*

> **FRICTION AT PEAK INTENT · your payment step**
> One field on this screen sends full-price buyers off-site, mid-purchase. Some don't come back.
> *Located · verified · rewritten copy ready.*

Note the status lines escalate: "fix drafted," "rewritten copy ready" — the treatment already exists, which is the ProLedger's honesty line generalized: **the counts are real, the work is done, the lock is only on the details.**

**Themes — the layer above findings (decided 2026-11-11, and the dashboard's home view).** Findings fix pages; themes fix companies. A theme is a *habit*: 3+ findings sharing a class (or a tight cross-class cluster) get a sticky, per-site name in the house register — *The Overpromise. Door Clutter. Ask-Before-Earn.* The engine detects clusters systematically (the taxonomy is the detector); the model names them bespoke per site. Why themes matter commercially: they're **repeatable** (a founder recites the theme to their team — word-of-mouth built in) and they **survive redesigns** (fix the page, the finding dies; the habit reappears on the next page the team ships — *"we'll watch whether your new pricing page inherits The Overpromise"* is a subscription sentence). Dashboard home = the themes (3–4 habits with evidence stacks, mixed clear/blurred/spot-it exhibits); the journey map is tab 2 — their funnel as screenshot thumbnails of their own pages, findings pinned, unscanned pages as gray slots ("5 pages we haven't walked yet"); exposure ranking is a sort, not a view.

**Board furniture:** the journey strip (per-step real counts, locked), the class breakdown ("4 trust · 3 friction · 2 credibility"), and the megaphone slot — one opportunity per visit gets promoted to the top with its stakes sentence amplified. Rotate it; urgency without rotation goes stale (we literally have a finding about that).

---

## 4. Act 3 — the stakes (dashboard: what to expect)

The conversion moment. Three moves, in exec language, honesty policy intact:

1. **Aggregate the exposure:** "Nine of your eleven findings are tied to documented abandonment or conversion drivers. Three sit on your payment path."
2. **Prove the sample worked:** the two free findings carry a "fixed it?" check — we re-verify on their live page and say so: *"Re-checked today: the shipping reveal still lands at step 4."* (Recurring, dated, automatic — this line alone teaches them we're watching, which is the subscription.)
3. **Offer the expectation, in ranges, theirs:** "Connect your analytics and every fix gets a before/after in your numbers — completion rate, drop-off by step, recovered carts. Until then we quote documented ranges, not promises."

---

## 5. The quant doctrine (how numbers enter without becoming unsexy)

**Rule zero: quant quantifies the consequences of qualitative findings. It is never its own list of findings.** "Add a meta tag" is invisible to a CEO and stays in Technical checks, collapsed, unsold, forever.

Three sources, a ladder — and no number without a source:

| Source | What it is | Example | Tier |
|---|---|---|---|
| **Site facts** | Numbers we measured on *their* site | "The same scarcity badge on 14 of 16 products." "Price appears after 9 of your 12 questions." | Free — these are the sexiest quant we have and they cost us nothing |
| **Industry anchors** | Published research rates, attached by KB lookup only | "48% of shoppers cite surprise costs as why they abandoned (Baymard 2024)" | Free on the sharp pair; summarized on opportunity cards ("documented driver of…") |
| **Your numbers** | Their connected analytics (GA4/Clarity, docs/02 Wave 1) | "Checkout completion 23.4% → 29.1% since the Nov 12 fixes" | Paid — this is the subscription's spine |
| Site fact × anchor | The inference, stated as exposure | "Late-cost reveals are the #1 cited abandonment driver, and yours lands at the last step — this is exposure at your highest-intent moment" | The house move |

**Forecast discipline:** ranges, "known contributor," "documented driver," never "this will increase conversion by X." One honest sentence ("a range, not a promise — connect analytics and we'll use yours") buys more trust than any inflated number. Evidence-or-it-didn't-happen now extends to numerals.

## 6. Language register

| Never (dev-speak) | Never (feelings-speak) | House register |
|---|---|---|
| "Missing alt text on 12 images" | "This may frustrate users" | "A known contributor to abandonment at the payment step" |
| "H1 hierarchy is broken" | "Customers might feel confused" | "This page makes a promise your checkout breaks" |
| "Add schema markup" | "It makes the site feel untrustworthy" | "A documented credibility risk that discounts your real offers" |
| "CLS score is 0.4" | "Users don't like waiting" | "Friction at the moment customers decide to pay you" |

Verbs that carry the register: *costs, leaks, breaks, contradicts, discounts, teaches customers to hesitate, sends buyers off-site.* The mascot stays fun; the sentences stay serious. That contrast *is* the brand.

## 7. What keeps them (sketch — to hash out later, per Jeffrey)

Monetization is explicitly second priority right now; parked shapes: one-time report · monitoring subscription (weekly re-walks, regression alerts, "re-checked today" lines, monthly impact letter in their numbers) · annual plan with quarterly full re-audits · per-journey deep audits as add-ons. The retention engine regardless of packaging: **fix verification + impact deltas** — the product that confirms you fixed it is the product you don't cancel.

## 8. What this implies next

1. **Low-fi wireframes** (allowed under the design pause): the Missed Opportunities board and the dashboard's three acts — boxes and copy, no polish.
2. **Pipeline additions:** sharp-pair selection rule; opportunity-card generation (class + located sentence + stakes sentence) as a synthesis output; site-fact extraction (cross-instance counts) as a first-class finding property.
3. **Copy source of truth:** the example cards above are the register benchmark; critique output should be evaled against them.
4. Open: class taxonomy (trust break / friction / credibility / commitment mismatch / …) — needs a fixed, small vocabulary; megaphone rotation logic; where Act 3 lives pre-analytics-connect.

---

## Appendix A — the finding class taxonomy (draft 1)

A **closed vocabulary of eight classes**. Every finding gets exactly one primary class; the class drives the opportunity card's label, its stakes sentence, and which research-anchor family the KB lookup searches. If a finding fits no class, it's either a technical check (collapsed, unsold) or it isn't a finding — the taxonomy doubles as a qualitative filter.

| # | Class | It means | The detecting question | Example from our critiques |
|---|---|---|---|---|
| 1 | **Trust Break** | A promise about the *deal* is contradicted later | "Where does the product contradict its own offer?" | Free-returns hero vs. "final sale" badge; hidden $14.90 shipping |
| 2 | **Expectation Break** | The *interface* signals one thing and does another | "Where does a label or pattern lie about what happens next?" | "Check our prices" starts account creation (Lemonade); "Complete onboarding" isn't the end (Copilot) |
| 3 | **Credibility Leak** | A claim reads as a trick and discounts the real ones | "What would a skeptic call manipulative?" | "Only 2 left!" on 14 of 16 products, surviving refresh |
| 4 | **Friction at Intent** | Effort or diversion at a high-intent moment | "What makes the customer work, wait, or leave right when they've decided?" | Promo field sending buyers coupon-hunting; PDF size guide mid-purchase |
| 5 | **Commitment Mismatch** | The ask outruns the trust earned so far | "What does the product demand before it has given anything?" | Legal name + ToS before any price (Lemonade); wishlist needs an account, cart doesn't |
| 6 | **Buried Value** | What the customer wants exists but can't be found | "What's present that behaves as absent?" | Guest checkout below the fold |
| 7 | **Confidence Gap** | Missing reassurance at a fear moment | "Where does the customer have a question nobody answers?" | No scale reference in photos; no "what happens next" after signup |
| 8 | **Coherence Break** | The site disagrees with itself or with convention | "Where do two parts of the site do the same job differently — or one part defy what everyone expects?" | Five buttons for the same action; a control living where no convention puts it |

**Stakes sentence templates** (the card's second line writes itself from the class):

1. Trust Break → "Contradictions of this class are documented drivers of cart abandonment."
2. Expectation Break → "Broken interaction promises are a known cause of mid-flow drop-off and support load."
3. Credibility Leak → "A documented credibility risk that discounts every claim on the page — including your real offers."
4. Friction at Intent → "A known contributor to abandonment at the moment customers decide to pay you."
5. Commitment Mismatch → "Premature asks are documented drop-off points at signup and checkout."
6. Buried Value → "Customers can't choose what they can't find — a measured drag on conversion."
7. Confidence Gap → "Unanswered doubts surface as hesitation at payment and inflated returns."
8. Coherence Break → "Inconsistency taxes every visit — customers relearn your site instead of using it."

**Boundary rules:**
- Trust Break vs. Expectation Break: *deal* vs. *interaction*. "You said free shipping" is Trust; "the button lied about what it does" is Expectation.
- Credibility Leak is the only class where the content itself is the problem (manipulation, cherry-picking); it never requires a contradiction.
- Friction vs. Buried Value: friction adds work to a found path; buried value hides the path entirely.
- Scope is orthogonal: any class can be page-scope or **journey-scope** (the paid climax tier). Cross-page contradictions are almost always Trust or Expectation Breaks at journey scope.
- Strengths reuse the same vocabulary inverted ("Trust kept: security setup *before* bank linking") — one language for both directions keeps praise structural, not decorative.

- Coherence Break vs. Expectation Break: coherence is *internal or conventional* disagreement (parts of the site vs. each other, or vs. the web's norms); expectation is a single element lying about itself. Coherence findings often only matter in aggregate — they are the most theme-prone class.

**Pipeline hook:** `class` becomes a required enum on every synthesis finding; the adversary verifies class fit as part of review (a finding whose class doesn't survive scrutiny is a KILLED finding); the KB files get re-tagged by class so citation lookup narrows by class + page type. **Themes hook:** after review, a clustering pass groups confirmed findings (same class, or tight cross-class affinity, 3+ members) into themes; the model names each theme per-site in the house register; the adversary gets final say on whether the cluster genuinely shares one habit.
