# Placeholder — Revised Project Roadmap

> AI-Powered UX Auditing + QA for Companies That Can't Afford Both

**Status:** Phase 1 in progress
**Last Updated:** 2026-03-24
**Name:** "Placeholder" (final name TBD — single `APP_NAME` constant for easy swap)

---

## What We're Building

A Chrome extension that opens a side panel, scans any webpage, and delivers consultant-quality UX and accessibility analysis — not a checklist, a consultant. The killer feature is "Show Me": click any finding and the actual element highlights on the live page with a plain-English tooltip.

**The customer math:** UX researcher + QA = $250K-$400K/year. Agencies = $25K-$55K/month. Placeholder: $49-$299/month. 25-70x cost reduction.

**The market gap:** No tool today combines automated QA testing (does it work?) with UX evaluation (is it good?) in a single product. QA tools like Mabl, Testim, and QA Wolf verify functional correctness. UX tools like Hotjar and FullStory observe real users passively. Nobody has an AI agent that actively tests a site and evaluates UX quality simultaneously — at a price point accessible to small/mid teams.

---

## Key Decisions Made

### 1. Name
Using "Placeholder" everywhere until a final name is chosen. All code references a single `APP_NAME` constant in `packages/shared/constants.ts`. One change, cascades everywhere.

### 2. AI on Free Tier — Two-Model Approach
- **Free tier:** GPT-4.1-nano ($0.0004/call) or Gemini 2.0 Flash ($0.0007/call) on every scan. Quantitative findings: pass/fail, measurements, standards references. All findings shown, nothing hidden.
- **Pro tier:** Claude Sonnet ($0.024/call) for full qualitative analysis. AI Consultant Report, fix code, business impact framing, page-type playbooks.
- **Caching:** 24-hour cache on identical URLs. ~30-40% hit rate from users re-scanning own site after fixes.
- **Projected cost at 75K installs:** $68-118/month on free tier AI. Negligible against projected revenue.

### 3. Free vs Pro Philosophy — "The Figma Model"
**Free must feel complete.** Like Figma free — you can do the whole job. No blurred findings, no "5 of 15 shown." Every finding visible. Mission complete. Users love the product even if they never pay.

**Pro is a different category of value, not more of the same.** Free = the machine report (quantitative, pass/fail). Pro = the consultant report (qualitative, strategic, contextual). The upgrade feeling is "did you like this? Here's what you're going to love" — not "you're still missing out."

The score ceiling creates the natural pull: free users can fix quantitative issues and reach ~80-85. The remaining 15-20 points require qualitative UX analysis that goes beyond automated checks.

### 4. Show Me is the #1 Priority
The element highlighting feature is the demo moment, the viral screenshot, the thing that makes non-technical people take action. It gets disproportionate investment and polish. Stays free — it's marketing, not revenue.

### 5. Score Explainability
Every point deducted has a reason, and every reason has a fix. Users can tap any category bar to see exactly where their lost points went (-12 pts alt text, -8 pts contrast, etc.). Weights: Accessibility 25%, UX Heuristics 30%, Forms 15%, Content 10%, Visual Consistency 10%, Performance UX 10%.

### 6. AI Hallucination Guardrails
- Deterministic findings visually distinct from AI analysis
- AI-generated claims get an "AI Insight" label
- Fix code snippets marked as suggestions, not guaranteed
- No fabricated statistics — confidence qualifiers required

### 7. Research Citations Required
Every qualitative recommendation must cite its source. Not "using specific CTA language is better" but "specific CTA language converts 3x higher than generic (Baymard Institute, 2024)." Links to studies when available. This is a product feature, not a nice-to-have — it's what separates us from ChatGPT giving opinions.

### 8. Scope Cuts for v1
Dropped to ship faster:
- ~~Notification system~~ — retention feature for zero users. Add post-beta.
- ~~PDF export~~ — nice to have, not core. Add in Phase 4.
- ~~Competitor score comparison~~ — vanity metric, low utility. Deprioritized.
- ~~Share feature~~ — needs backend + public URLs. Add in Phase 4.
- ~~Monthly industry digest~~ — not proprietary, free newsletters exist. Low priority.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Monorepo | pnpm workspaces + Turborepo | Shared code, single repo, fast builds |
| Extension UI | React + Tailwind CSS | Fast to build, component ecosystem |
| Extension Arch | Chrome Manifest V3, Side Panel API | Modern, ~380-420px panel |
| Backend | Node.js + Hono | Lightweight, fast, deploys anywhere |
| Database | Supabase (Postgres + Auth + Realtime) | Auth + DB + storage out of the box |
| AI (Free) | GPT-4.1-nano or Gemini 2.0 Flash | $0.0004-0.0007/call, every scan feels smart |
| AI (Pro) | Claude Sonnet | Best nuanced, contextual analysis |
| Hosting | Vercel (landing page), Railway or Fly.io (API) | Cheap, scalable, generous free tiers |
| Payments | Stripe | Subscriptions, trials, webhooks, customer portal |
| Accessibility | axe-core (via offscreen document) | Industry standard, not in content script (avoids perf/CSP issues) |

---

## The Product: Free vs Pro

### Free: The Complete Scanner (Quantitative)

Everything the machine can measure. Pass/fail. Numbers. Standards. Nothing hidden.

- **Unlimited scans** — no scan limits, no monthly caps
- **All findings shown** — every issue found, plain English description, severity, WCAG reference
- **Quantitative analysis** — contrast ratios, element sizes, heading hierarchy, link status, form validation, meta tags, image attributes, touch targets, console errors
- **Score (0-100)** with full category breakdown and point-loss attribution
- **Show Me** — highlight the actual element on the live page with tooltip
- **Screen reader simulation** — text-only linear view
- **Color blindness preview** — deuteranopia/protanopia/tritanopia filters
- **Single page scanning** — one page at a time

**The feeling:** "This is a legit, complete tool. I fixed 8 things and my score went from 63 to 81. I love this."

### Pro ($49/mo): The UX Intelligence Layer (Qualitative)

Everything a consultant would tell you. Strategic, contextual, research-backed.

**Tier 1 — The Reason You Upgrade:**

- **AI Consultant Report** — qualitative analysis that goes beyond pass/fail:
  - Page-type playbooks (200-300 best practices per page type, research-cited)
  - Conversion killer detection ("requiring account creation before showing shipping costs is the #1 checkout abandonment cause — Baymard, 2024")
  - Copy review ("'Submit' converts 3x worse than specific action language like 'Start Free Trial'")
  - Information architecture analysis (navigation depth, cognitive load, Hick's Law)
  - Emotional/persuasion review (trust signals, social proof, risk reducers)
  - UX framework evaluation (Nielsen's 10 heuristics, Gestalt, Fitts's Law, Jakob's Law, F-pattern)
  - "What Would A Customer Think?" — AI visits cold, writes up the first-time visitor experience
- **AI Fix Code** — copy-pasteable solutions, not just descriptions. Exact CSS values, HTML attributes, ARIA labels. Before/after with contrast ratios.
- **Analytics Integration + Impact Reports** — connect Google Analytics, Mixpanel, HubSpot, Stripe. Prove that fixing UX issues moved the needle:
  - "Checkout completion rate: 23.4% → 31.7% (+35.5%) since your March 5th fixes"
  - "Estimated revenue recovered: $3,400/month. Annual projection: $40,800. Your subscription: $588/year. ROI: 69x."
  - Monthly business impact report with before/after metrics timestamped to specific fixes

**Tier 2 — The Reason You Stay:**

- **Continuous monitoring** — weekly auto-scan, regression alerts ("your score dropped 6 points since Tuesday"), deployment change detection
- **Site-wide scanning** — scan full sitemap, rank pages by score, find the weakest pages ("your /checkout scores 54, your /pricing scores 91")
- **Mobile experience gap report** — same URL at mobile vs desktop viewport, show what breaks (spacing, fold, touch targets)
- **Monthly business impact report** — score trends + analytics data combined. The report your boss takes to the board.

**Tier 3 — The Reason Teams Upgrade:**

- **AI flow testing** — agent clicks through your product like a customer. Tests signup, checkout, onboarding. Reports both functional issues (button broken) AND UX issues (flow is confusing, no guidance after account creation)
- **Onboarding flow audit** — agent signs up cold, reports gaps in explanation, missing guidance, cognitive overload. Suggests alternative patterns (learn-as-you-go, progressive disclosure) with research citations
- **Pre-deploy gates (CI/CD)** — scan staging URL before code goes live. Block deploy if score drops below threshold.
- **Automated fix PRs** — for simple fixes (alt text, contrast, ARIA labels, meta tags), generate a GitHub PR. Engineering reviews and merges.
- **Ticket creation** — JIRA/Linear/Asana/GitHub Issues directly from findings

**Enterprise / Future:**
- Expert hour with a real UX designer (General Assembly model — AI does 90% of the work, human interprets and advises)
- Compliance dashboard (WCAG progress tracker, legal risk flags)
- Multi-client management for agencies
- SSO, SLA, dedicated support

### Team ($149/mo)
Everything in Pro + up to 10 users, shared dashboard, issue assignments, team activity feed, role-based permissions. Once 5 people use it, one person can't cancel.

### Agency/Enterprise (Let's Talk)
Unlimited users, multi-client, full white-label, API access, CI/CD, SSO, SLA.

---

## Analytics Integration — How It Works

### Supported Platforms (Priority Order)

| Platform | What We Pull | Why First |
|----------|-------------|-----------|
| **Google Analytics (GA4)** | Bounce rate, conversions, session duration, page views, user flow | Almost everyone has it, free, great API |
| **Mixpanel** | Events, funnels, retention curves, user segments | Popular with SaaS, free tier (20M events) |
| **Amplitude** | Events, funnels, retention, cohorts | Popular with SaaS, free tier |
| **HubSpot** | Form submissions, lead conversion, deal close rates | Free CRM, widely used by SMBs |
| **Stripe** | Revenue, MRR, churn, subscription metrics | Direct revenue attribution |
| **PostHog** | Events, funnels, session data | Growing open-source option, free tier |

### The Flow

1. **Connect** — OAuth flow in Pro settings. Read-only access. 30 seconds.
2. **Timestamp** — every scan and fix is logged with date.
3. **Correlate** — 2 weeks after fixes, pull analytics and compare before/after.
4. **Report** — monthly impact report: what changed, what improved, estimated ROI.

### Honesty Policy

- Always show data with caveats: "Correlation observed. Other factors may contribute."
- Use ranges, not exact numbers: "$2,800-$4,200/month estimated impact"
- Cite research for general claims, show their actual data for specific claims
- Let users override estimates if they know their actual conversion values

---

## The AI Consultant Report — Deep Dive

### What Makes It Different From ChatGPT + Screenshots

| ChatGPT + Screenshots | Our AI Consultant Report |
|----------------------|--------------------------|
| Looks at a compressed JPEG | Reads the actual DOM, CSS, HTML, computed styles |
| Guesses contrast ratios | Calculates exact ratios with WCAG formula |
| Can't click anything | Agent navigates, fills forms, tests flows |
| Can't measure element sizes | Knows exact pixel dimensions |
| Gives different answers every time | Consistent, systematic evaluation against 300+ rules |
| No research citations | Every recommendation backed by specific studies |
| Can't track changes over time | Before/after comparison with metrics |
| One-off conversation | Persistent, accumulating knowledge about your site |

### Knowledge Base Architecture

We build structured markdown documents containing best practices per page type. Not model fine-tuning — prompt context that we control and update:

**Checkout Pages:** 40+ rules (guest checkout, shipping cost visibility, progress indicators, form column layout, trust signals, payment option prominence, etc.)

**Landing Pages:** 30+ rules (5-second value proposition test, single CTA above fold, headline pain-point framing, social proof placement, visual hierarchy, etc.)

**Pricing Pages:** 25+ rules (recommended plan highlighting, feature comparison tables, per-plan CTAs, annual/monthly toggle with savings, enterprise separation, etc.)

**Signup / Login:** 20+ rules (field count impact on conversion, social login, password requirements timing, error message specificity, etc.)

**SaaS Dashboards:** 25+ rules (empty states, obvious first action, quick-start actions, information hierarchy, onboarding guidance, etc.)

**Onboarding Flows:** 20+ rules (progressive disclosure, learn-as-you-go vs front-loaded, completion indicators, time-to-value, etc.)

Total: 200-300+ rules across page types. Each rule includes: the best practice, why it matters, research citation with link, severity level, fix pattern.

### Analysis Layers

| Layer | What It Evaluates | Free? |
|-------|------------------|-------|
| **Quantitative checks** | Contrast, sizes, hierarchy, links, forms, images, meta, touch targets | Yes |
| **UX framework evaluation** | Nielsen's 10, Gestalt, Fitts's Law, Hick's Law, Jakob's Law, F-pattern | Pro |
| **Page-type playbooks** | 200-300 best practices evaluated per page type | Pro |
| **Content & copy analysis** | Reading level, jargon, CTA effectiveness, error message quality, microcopy | Pro |
| **Information architecture** | Navigation depth/breadth, click paths, content hierarchy, fold analysis | Pro |
| **Emotional/persuasion** | Trust signals, social proof, urgency, risk reducers, friction points | Pro |
| **Conversion killer detection** | Research-backed patterns that kill conversion (forced signup, hidden costs, etc.) | Pro |
| **Flow testing** | Agent navigates the product, tests signup/checkout/onboarding end-to-end | Pro |

---

## Build Phases

### Phase 1: Foundation (Weeks 1-3) ← IN PROGRESS
> Goal: Scan a page, see real findings in the side panel. No backend. Everything local.

- [x] **Monorepo scaffold** — pnpm workspace with `packages/extension`, `packages/api`, `packages/web`, `packages/shared`
- [x] **Shared constants** — `APP_NAME`, version, config in `packages/shared`
- [x] **Chrome extension shell** — Manifest V3, side panel opens, content script injects
- [x] **Scan engine** — all 9 scanners with real implementations:
  - DOM crawler (TreeWalker, 3K element cap)
  - Contrast checker (real WCAG luminance formula + alpha compositing)
  - Link validator, form analyzer, heading checker
  - Image auditor, meta checker, touch targets, console capture
- [x] **Scanner orchestrator** — runs all scanners, computes weighted 0-100 score
- [x] **Side panel UI skeleton** — React + Tailwind at 380px, 3 states (idle → scanning → results)
- [x] **Score gauge** — SVG circular gauge with animation
- [x] **Service worker** — wires side panel ↔ content script messaging
- [x] **Build pipeline** — Vite multi-entry, outputs Chrome-loadable dist/
- [x] **TypeScript** — zero errors across all packages
- [ ] **Design system** — awaiting Jeffrey's design inspirations (coming tomorrow)
- [ ] **UI polish** — apply design system to all components once direction is set

**Milestone:** Install extension → click "Analyze" → see real deterministic findings in the panel.

---

### Phase 2: Intelligence (Weeks 3-6)
> Goal: The extension feels like a consultant, not a checklist. "Show Me" works.

- [ ] **Page type detector** — heuristic classification (URL + content analysis)
- [ ] **UX knowledge base** — markdown files with 200-300 best practices per page type, research-cited
- [ ] **AI analysis pipeline** — scan data + page type + knowledge base → AI model
  - Hook line: one specific, insightful sentence
  - Page-type playbook evaluation
  - Conversion killer detection
  - Copy review
  - Top 3 Quick Wins with impact, fix time, code snippet
  - Overall score with explainability
- [ ] **Two-model integration** — cheap model for free (quantitative summary), Sonnet for Pro (full consultant report)
- [ ] **Prompt engineering** — plain English, business impact framing, research citations, page-type-aware
- [ ] **Show Me feature** — click finding → highlight element + tooltip on live page
- [ ] **Expandable finding cards** — collapsed by default, expand to show: The Problem, Why It Matters, The Fix, Show Me, Dismiss, Impact, Effort
- [ ] **Score drill-down** — tap category bar → filter findings to that category → show point-loss attribution
- [ ] **Caching layer** — 24h URL cache in IndexedDB
- [ ] **Screen reader simulation** — text-only linear view
- [ ] **Color blindness preview** — CSS filters

**Milestone:** Full scan with AI consultant report, "Show Me" highlighting, expandable findings with research-backed fixes.

---

### Phase 3: Backend + Persistence (Weeks 6-9)
> Goal: Users sign up, scans persist, free vs Pro distinction is clear.

- [ ] **Backend API** (Hono on Railway/Fly.io)
  - `POST /api/analyze` — proxies AI call (keys server-side)
  - `GET /api/history` — scan history
  - `POST /api/auth/*` — Supabase auth
  - `POST /api/stripe/*` — Stripe webhooks + checkout
  - `GET /api/user/subscription` — plan details
- [ ] **Supabase setup** — schema (users, scans, findings, fixes), auth (email + Google OAuth), RLS
- [ ] **Zero-friction onboarding** — no signup to scan. Account when they want history or Pro.
- [ ] **Scan history** — save and retrieve past scans with scores
- [ ] **Free tier gating** — all findings shown with descriptions (quantitative). Fix code, consultant report, playbooks = Pro.
- [ ] **Fix tracking** — log every fix with timestamp for analytics correlation later

**Milestone:** Scans persist, free = complete quantitative tool, Pro = qualitative intelligence.

---

### Phase 4: Monetization + Analytics Integration (Weeks 9-12)
> Goal: People can pay. The product proves its own ROI.

- [ ] **Stripe integration** — Free, Pro ($49/mo), Team ($149/mo), trials, customer portal, webhooks, coupons
- [ ] **Google Analytics integration** — OAuth connect, pull bounce rate, conversions, session duration per page
- [ ] **Impact correlation engine** — timestamp fixes, compare before/after metrics, generate impact estimates
- [ ] **Monthly impact report** — "Since your fixes: checkout completion +35%, estimated $3,400/mo recovered"
- [ ] **Site-wide scanning** — scan full sitemap, rank pages by score
- [ ] **Mobile experience gap report** — same URL at mobile vs desktop viewport
- [ ] **PDF export** — client-side, free = branded, Pro = white-label
- [ ] **Dark mode**
- [ ] **UI polish pass**

**Milestone:** Full product loop — scan, fix, prove ROI, pay, export. The product sells itself.

---

### Phase 5: Launch Prep (Weeks 12-14)
> Goal: Landing page live, Chrome Web Store listing, beta users recruited.

- [ ] **Landing page** (Vercel)
  - Hero + CTA [Add to Chrome - Free] + URL input for instant preview scan
  - The URL input trick: paste URL → see preview score + top 3 findings → "Install for full report"
  - How it works: 3-step visual
  - Feature showcase with screenshots (free scanner + consultant report + impact report)
  - Pricing section
  - Social proof (after beta)
- [ ] **Chrome Web Store listing** — screenshots, video, privacy policy, activeTab only
- [ ] **Internal testing** — 50+ sites, tune prompts, calibrate scores, test knowledge base accuracy
- [ ] **Private beta** — 20-30 users, free Pro for 3 months for feedback + testimonial

**Milestone:** In Chrome Web Store, landing page live, beta users using it daily.

---

### Phase 6: Public Launch (Weeks 14-16)
> Goal: Product Hunt launch, content engine running.

- [ ] Product Hunt launch
- [ ] Free web scanner on landing page (top-of-funnel lead gen)
- [ ] Content marketing (SEO articles)
- [ ] Chrome Web Store SEO
- [ ] Iterate on beta feedback

---

### Phase 7: Growth (Months 4-12)
> Advanced features, only when core is proven.

- Continuous monitoring + regression alerts + deployment detection
- Additional analytics integrations (Mixpanel, Amplitude, HubSpot, Stripe)
- AI flow testing (agent clicks through signup, checkout, onboarding)
- Onboarding flow audit
- Pre-deploy gates (CI/CD integration)
- Automated fix PRs via GitHub
- JIRA/Linear/Asana ticket creation from findings
- Referral program
- Content readability analysis (grade level, jargon, CTA effectiveness)

### Phase 8: Scale (Months 6-24)
> Sales, upmarket, new revenue streams.

- First salesperson at 200+ paying customers
- Agency/Enterprise tiers
- Expert hour add-on (General Assembly model — AI report + 1hr/month with real UX designer)
- One-time audit packages ($299 / $799 / $1,999)
- Compliance dashboard (WCAG tracker, legal risk flags)
- Figma integration
- Firefox extension
- API access

---

## AI Cost Model

### Assumptions
- ~3,000 tokens input, ~1,000 tokens output per scan
- 30-40% cache hit rate (users re-scanning own site after fixes)
- User behavior: 45% dormant, 28% casual (2/mo), 17% regular (10/mo), 4% power (30/mo)

### Projected Costs

| Installs | Active Scans/Mo | After Caching | Free Tier (nano) | Pro Tier (Sonnet) |
|----------|----------------|---------------|-----------------|-------------------|
| 10,000 | ~35,000 | ~23,000 | **$9/mo** | ~$24/mo |
| 25,000 | ~87,000 | ~57,000 | **$23/mo** | ~$48/mo |
| 75,000 | ~260,000 | ~169,000 | **$68/mo** | ~$72/mo |

At 75K installs with 3K paying subscribers ($147K/month revenue), total AI costs ~$140/month. Less than 0.1% of revenue.

---

## Competitive Landscape

### QA Testing (Does It Work?)

| Tool | What It Does | Price |
|------|-------------|-------|
| QA Wolf | Full-service — humans write/maintain your test suite | $4,000-10,000/mo |
| Mabl | Record flows, AI auto-heals broken tests, visual regression | $500-1,000+/mo |
| Testim | Record-and-playback + AI-stabilized locators | $450+/mo |
| Functionize | AI generates tests from plain English | $40,000+/year |

**None of them evaluate UX quality.** They verify buttons work. They never ask "should this button be here?"

### UX Research (Is It Good?)

| Tool | What It Does | Price |
|------|-------------|-------|
| Baymard Institute | 100K+ UX guidelines, human audits (e-commerce focused) | $400-600/yr database, $20K+ audits |
| UserTesting | Remote user research, real humans on video | $15,000-50,000+/year |
| Hotjar | Heatmaps, session recordings (requires production traffic) | $32-200+/mo |
| FullStory | Session replay, frustration signals, funnels | $300+/mo |
| Contentsquare | Enterprise analytics, revenue-impact analysis | $50,000+/year |

**None of them actively test.** They either require real users (expensive, slow) or require production traffic (can't test before launch).

### Our Position

We sit in the gap nobody fills: **an AI agent that actively tests like a user AND evaluates UX quality like a consultant, at $49/month.** Baymard's knowledge depth + automated scanner precision + AI reasoning + live DOM access. At 1/400th the cost of a human audit.

---

## Project Structure

```
placeholder/
├── packages/
│   ├── extension/     # Chrome extension (React + Tailwind, Manifest V3)
│   ├── api/           # Backend (Hono, Supabase, Stripe)
│   ├── web/           # Landing page (Vercel)
│   └── shared/        # Constants (APP_NAME), types, utilities
├── knowledge/         # UX best practices database (markdown, per page type)
├── agents/            # AI agent team definitions
├── skills/            # Skill guides (design, engineering, QA, etc.)
├── docs/              # Specs, ADRs, personas (created as needed)
├── ROADMAP.md         # This file
└── package.json       # Workspace root
```

---

## Open Questions

- [ ] **Final product name** — exploring Aperture / Loupe / Prism / Lucid direction
- [ ] **Free tier AI model** — GPT-4.1-nano vs Gemini 2.0 Flash. Need to test quality on UX prompts.
- [ ] **Design system** — Jeffrey bringing inspirations. Crude wireframe review first, then build.
- [ ] **Analytics integration priority** — GA4 first (most universal). Mixpanel/HubSpot/Stripe after.
- [ ] **Knowledge base scope for v1** — start with checkout + landing + pricing + signup? Or all page types?
- [ ] **Flow testing feasibility** — how deep can the agent go? Full checkout test vs basic navigation?

---

*Confidential — March 2026*
