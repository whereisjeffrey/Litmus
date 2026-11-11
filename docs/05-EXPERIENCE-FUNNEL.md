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

---

## 2. Act 1 — the proof (drawer, first scan)

**What displays, in order:**

1. **The Read** — 2–3 sentences, business register, already exposure-framed: not "we found some issues" but *"this page makes three promises your checkout later breaks — and it spends credibility on urgency it doesn't need."*
2. **The sharp pair** — the two highest-conviction findings, fully expanded. Each carries: the exhibit (their pixels, ringed), the evidence quote, the research anchor (cited, never free-recalled), Show Me on the live page, and one line of consequence in exec language.
3. **The count row** — real numbers only: "11 findings · 2 shown in full · every one survived adversarial review."

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
