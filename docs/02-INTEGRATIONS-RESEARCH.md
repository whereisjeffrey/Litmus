# Phase 2 — Integration Ecosystem Research (Pie-in-the-Sky Edition)

**Date:** 2026-07-18
**Purpose:** Map every integration that could make our analysis *evidence-backed* rather than opinion-based. The strategic thesis: **an insight plus the customer's own data confirming it is a different product category than an insight alone.** "Your checkout is confusing" is an opinion. "Your checkout is confusing, and your own analytics show 68% of mobile users exit on that exact step" is a diagnosis with a chart attached.

The pattern for every integration below is the same **evidence loop**:

```
Agent forms hypothesis  →  Integration provides the customer's data  →
Hypothesis confirmed/refuted/quantified  →  Finding ships with evidence + $ impact  →
Post-fix, same integration measures the delta  →  Product proves its own ROI
```

This loop also *feeds the reasoning engine*: rage-click coordinates, funnel drop-off steps, and search queries tell the walkthrough agent exactly where to go dig. Integrations aren't just reporting garnish — they are targeting data for the agent.

---

## Tier 1 — Evidence & correlation (build first)

### 1. Google Analytics 4 (GA4 Data API)
The universal one. Read-only OAuth, free API.
- **Pull:** engagement rate, exits per page, conversions, funnel exploration, device/geo splits, landing-page performance, user paths.
- **Evidence use:** confirm/refute agent hypotheses ("high exit on /search supports the finding"); rank the site-wide scan by *actual traffic × score* instead of score alone — a 54-scoring page with 40% of traffic beats a 30-scoring page nobody visits.
- **Targeting use:** top entry pages and top exit pages tell the agent which flows to walk first.
- **Correlation use:** the before/after impact reports already in the ROADMAP.

### 2. Microsoft Clarity (Data Export API) — the sleeper pick
Free for the customer forever, 100% session sampling, and it directly measures *behavioral frustration* — the qualitative signal we care most about: **rage clicks, dead clicks, excessive scrolling, quick-backs, JS errors per session**, plus scroll-depth and click heatmaps. It even ships an MCP server and a GA4 cross-link.
- **Evidence use:** "The agent found the filter panel confusing → Clarity shows a 4.2% rage-click rate on that exact element" is the strongest confirmation available anywhere, at zero cost to the customer.
- **Constraints to design around:** Data Export API allows ~10 requests/day/project, 3-day windows, 1,000 rows/response — fine for a daily snapshot job, not for real-time queries. Pull nightly, store our own history.
- **Bonus play:** for customers with no analytics at all, "install Clarity (free, 2 minutes) and connect it" becomes our onboarding wedge — we bootstrap the evidence loop even for tiny sites.

### 3. Google Search Console
Free, OAuth, everyone with a website qualifies.
- **Pull:** queries, impressions, CTR, positions per page; Core Web Vitals field data.
- **Evidence use:** *intent-mismatch detection* — the killer qualitative insight nobody else automates. If people arrive on /pricing from the query "free invoice template" and bounce, the page isn't failing at design; it's answering the wrong question. The agent can evaluate the page *against the actual queries that bring people to it.*

### 4. Stripe (read-only)
- **Pull:** revenue, MRR, conversion from checkout session → payment, failed payments, churn.
- **Evidence use:** the money quote in every impact report. "Checkout completion +8.3pp since the March fixes ≈ $3,400/mo recovered" with the customer's real numbers, not industry benchmarks.

### 5. Product analytics — Mixpanel / Amplitude / PostHog
- **Pull:** event funnels, retention curves, cohort behavior; PostHog additionally has session replay + feature flags + free tier and is the developer-crowd favorite.
- **Evidence use:** exact funnel step where users die; retention curves that confirm "onboarding doesn't land."
- **Targeting use:** the agent replays the *actual* funnel definition (the customer's own named steps) instead of guessing what the critical path is.

## Tier 2 — Qualitative signal mining (the "why" sources)

### 6. Session replay platforms — Hotjar / FullStory / LogRocket
Same category as Clarity but paid; support where customers already have them. FullStory's frustration signals and LogRocket's error+replay pairing are strong. Priority below Clarity only because Clarity is free and API-friendly.

### 7. Voice-of-customer mining — support & surveys
- **Intercom / Zendesk / Help Scout:** cluster support conversations by topic; recurring "how do I…" questions are UX findings written by real users. An agent that reads 500 tickets and says "11% of tickets are password-reset confusion; here's the flow problem" is a consultant.
- **Typeform / Delighted / NPS feeds:** verbatims give the agent hypotheses to verify in-product.

### 8. Public review mining — G2, Capterra, Trustpilot, App Store / Play Store
No OAuth needed for public data. Mine the customer's (and competitors'!) reviews for UX complaints. "Your competitor's most-loved feature is the thing your product hides three menus deep" is a boardroom slide.

## Tier 3 — Closing the loop (act on findings)

### 9. Dev workflow — GitHub / GitLab, Jira / Linear / Asana, Slack
Already in the ROADMAP; the reasoning-engine tie-in is what's new:
- Findings → tickets with the *evidence bundle attached* (screenshot, session-replay link, funnel chart).
- Automated fix PRs for mechanical issues (alt text, contrast, meta) — now much more reliable with current-generation models.
- Slack digest: "weekly UX health" with deltas, not dashboards nobody opens.

### 10. Deploy hooks — Vercel / Netlify / GitHub Actions
Scan-on-deploy and pre-deploy gates (ROADMAP Phase 7). The reasoning-engine version: the walkthrough agent re-runs the *flows that changed* after each deploy and diffs the experience, not just the score. "Your Tuesday deploy added a step to checkout" is regression detection no test suite catches.

### 11. A/B testing — GrowthBook / VWO / Optimizely / Statsig
The far end of the loop: recommendation → generated experiment variant → measured result. Even a v1 that just *formats the finding as a ready-to-run hypothesis* ("Variant B: move guest checkout above the fold; success metric: checkout completion") makes us the tool that feeds the customer's experimentation program. GrowthBook being open-source makes it the friendliest first target.

## Tier 4 — Commerce & platform-specific depth

### 12. Shopify / BigCommerce Admin APIs
For e-commerce (our densest knowledge-base vertical): cart abandonment, checkout events, product analytics straight from the platform. A Shopify App listing is also a *distribution channel*, not just an integration.

### 13. Segment / RudderStack (CDP) — the leverage play
One OAuth that carries the customer's entire event stream. Highest engineering cost, but one integration ≈ ten. Enterprise-tier feature.

### 14. Figma
Pre-build audits: run the consultant on designs before code exists. Natural enterprise expansion, already parked in ROADMAP Phase 8.

## Infrastructure integrations (for the agent itself, not the customer)

- **Disposable inbox API (Mailosaur / MailSlurp / Testmail):** gives the walkthrough agent real email addresses so it can complete *actual* signup flows — receive the verification email, click the link, judge the entire first-run experience including "the confirmation email took 4 minutes and landed in spam." This is cheap (~$10-50/mo) and unlocks the single most-requested flow test.
- **Stripe test cards:** only usable on sites in test mode — for production sites the agent walks checkout up to the final payment submit and stops. That boundary should be an explicit, documented guardrail.
- **Proxy/geo services (later):** view the site as a visitor from the customer's actual top geos (from GA4 data — the loop again).

---

## Priority recommendation

| Wave | Integrations | Why |
|------|-------------|-----|
| **Wave 1** (with reasoning engine v2) | GA4, Microsoft Clarity, Search Console | Free for customers, read-only OAuth, directly feed + confirm agent findings |
| **Wave 2** (monetization phase) | Stripe, PostHog/Mixpanel, disposable inbox | Revenue attribution + funnel targeting + real signup testing |
| **Wave 3** (retention phase) | Slack, Linear/Jira, GitHub PRs, deploy hooks | Findings become workflow, product becomes sticky |
| **Wave 4** (upmarket) | Intercom/Zendesk mining, review mining, A/B, Shopify app, Segment | Enterprise depth + distribution |

**Honesty policy carries over unchanged:** correlation caveats, ranges not point estimates, customer's own data for specific claims, citations for general claims.

Sources: [Clarity Data Export API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api) · [Clarity blog: Data Export API](https://clarity.microsoft.com/blog/data-export-api/) · [Clarity review 2026](https://spilnoagency.com.ua/en/instructions-us/microsoft-clarity-review-heatmaps-session-recordings) · [Clarity MCP/Composio](https://composio.dev/toolkits/microsoft_clarity) · [Best usability testing tools 2026 (Koji)](https://www.koji.so/blog/best-usability-testing-tools-2026) · [AI usability testing tools (Tessary)](https://tessary.ai/best-ai-usability-testing-tools) · [UXAudit.Now](https://uxaudit.now/) · [AI think-aloud agent study (Lieben)](https://eriklieben.com/posts/agentic-dev-workflow-ux-testing/) · [VWO UX audit tools](https://vwo.com/blog/ux-audit-tools/) · [Figma AI usability testing guide](https://www.figma.com/resource-library/ai-usability-testing/)

---

# Part 2 — Deep Dive: The MCP-First Integration Architecture (added 2026-07-18)

Part 1 assumed every integration is a bespoke REST connector (OAuth + API client + data mapping, weeks per vendor). The 2026 landscape has changed that math entirely: **the analytics ecosystem has gone agent-native**, and because *our reasoning engine is itself a Claude agent*, we can consume vendors' Model Context Protocol servers directly instead of building connectors.

## The finding that changes the plan

As of Q1 2026, **ten major analytics vendors ship official MCP servers**: Amplitude, Mixpanel, PostHog, Heap (Contentsquare), Pendo, FullStory, LogRocket, Statsig, and GA4 — plus Sentry, Stripe, GitHub, Microsoft Clarity, and Shopify outside the analytics core. Highlights:

- **PostHog** hosts an MCP at `mcp.posthog.com/mcp` with **27 tools across 7 categories**: analytics, funnels, feature flags, experiments, error tracking, *and session recordings*. One connection ≈ five of our Part 1 integrations.
- **GA4's MCP is read-only by design** — agents can pull reports and analyze traffic but can't alter configuration. Read-only is exactly our trust posture; this is a feature for our sales pitch, not a limitation.
- **Sentry's MCP** answers "any new errors since yesterday's deploy?" — pairs directly with our post-deploy re-walk.
- **Amplitude, Pendo, and PostHog use OAuth flows** (no raw API keys in config) — matching the vault-style credential handling we'd want anyway.

## What this means architecturally

Instead of N bespoke connectors, we build **one MCP client layer + per-customer OAuth credential storage**, and hand the customer's connected MCP servers to our pipeline as tools. The Claude API supports MCP servers natively on the Messages API (server-side MCP connector), so the plumbing is thin.

The deeper win is *when* the data gets pulled. Part 1's evidence loop pre-fetched analytics snapshots for correlation. MCP flips this: **the expert synthesizer (Stage C) can pull its own evidence live, mid-reasoning** — it forms the hypothesis "checkout is confusing at the shipping step," then *itself* queries the customer's PostHog funnel or GA4 exits to confirm, refute, or quantify before the finding ships. That's not "analysis + a data appendix"; that's a consultant who checks the numbers before speaking. The adversary stage (Stage D) gets the same tools — findings can now be killed by data, not just logic.

## Category-by-category updates from the deep dive

### Experimentation: GrowthBook 4.4 is explicitly AI-native
GrowthBook rebuilt its REST API for agent workflows: **agents can create experiments from templates, run the pre-launch checklist, build persistent report resources, read results against the team's decision criteria, and conclude the experiment — setting winner and analysis summary — programmatically.** Statsig ships an MCP server as well. The full loop is now buildable: *our finding → auto-drafted experiment with success metric → customer approves launch → agent reads the result → the finding's impact is now measured, not estimated.* This moves A/B integration from Wave 4 "someday" to a legitimate Wave 2–3 feature.

### Commerce: Shopify is agent-native with zero merchant setup
Every Shopify store already exposes a live **Storefront MCP endpoint at `/api/mcp`** — catalog search, cart operations, policy Q&A — with no merchant installation required, plus a Customer Accounts MCP for logged-in flows (orders, returns). Two consequences:

1. **Our walker can use it today.** For any Shopify merchant, the persona agent gets both the human storefront *and* the store's own structured MCP data — instant cross-checking ("your return policy is in the MCP but a shopper can't find it on the page").
2. **New product surface: the Agentic Commerce Readiness Audit.** In 2026 the storefront's "user" is increasingly an AI shopping agent completing purchases via MCP + Universal Cart/Checkout Kit. Nobody is auditing how well stores serve *both* audiences. "Your store scores 84 for humans and 31 for AI shopping agents — here's what agents can't see or do" is a report section with zero competition and a built-in urgency narrative. This is a candidate flagship feature for the e-commerce vertical.

### Voice-of-customer: go through aggregators, not per-platform APIs
Direct API access is gated (Trustpilot = Enterprise plan; G2's API is limited, and G2 acquired Capterra in early 2026 so that market is consolidating). The practical route: **review-monitoring aggregator APIs (e.g. Reviewflowz)** that cover Trustpilot, App Store/Play Store, Chrome Web Store, Shopify App Store, and WordPress in one integration, with scraper services (Apify) as fallback for competitor mining. One aggregator ≈ eight review sources.

## Revised integration architecture

```
Customer connects account (OAuth, read-only)
        │
        ▼
┌─────────────────────────────────────────────┐
│  Credential vault (per-customer tokens)     │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│  MCP client layer (one implementation)      │
│  • PostHog MCP  • GA4 MCP    • Sentry MCP   │
│  • Clarity MCP  • Stripe MCP • Statsig MCP  │
│  • Shopify Storefront MCP (no auth needed)  │
│  Fallback REST connectors only where no MCP │
│  exists (Search Console, Clarity export,    │
│  review aggregator)                         │
└──────────────┬──────────────────────────────┘
               ▼
   Tools handed to pipeline stages:
   • Stage C synthesizer — pulls evidence mid-reasoning
   • Stage D adversary  — kills findings with data
   • Stage F reports    — before/after deltas, ROI
   • Walker (Shopify)   — cross-checks storefront vs MCP
```

## Revised wave plan

| Wave | Was (Part 1) | Now |
|------|--------------|-----|
| **Wave 1** | GA4 + Clarity + GSC REST connectors | **MCP client layer** + GA4 MCP + PostHog MCP + Clarity; GSC stays REST |
| **Wave 2** | Stripe, product analytics, inbox | Stripe MCP, Sentry MCP, disposable inbox; **Shopify Storefront MCP walker cross-check** |
| **Wave 3** | Workflow (Slack/Linear/GitHub) | Same, plus **GrowthBook experiment loop** (moved up from Wave 4) |
| **Wave 4** | Enterprise depth | Review aggregator, Segment CDP, **Agentic Commerce Readiness Audit** as flagship e-comm feature |

Build estimate impact: the MCP route turns most "1–2 week per vendor" connectors into "1–2 days per vendor" once the client layer + OAuth vault exist. The expensive part shifts from integration plumbing to *prompting the pipeline to use the data well* — which is exactly where we want our engineering hours going.

Part 2 sources: [PostHog MCP analytics docs](https://posthog.com/docs/mcp-analytics) · [Analytics MCP comparison (Lodd)](https://lodd.dev/blog/analytics-mcp-comparison) · [Product analytics MCP servers ranked](https://productleadersdayindia.org/blogs/ai-product-analytics-agent-signals/product-analytics-mcp-server-comparison.html) · [Amplitude: best MCP servers for product analytics](https://amplitude.com/compare/best-mcp-servers-for-product-analytics) · [GA4 MCP setup](https://growthmethod.com/ga4-mcp/) · [PostHog: best MCP servers for startups](https://posthog.com/blog/best-mcp-servers-for-startups) · [GrowthBook 4.4: AI-native experimentation](https://www.growthbook.io/blog/growthbook-4-4) · [Shopify Storefront MCP server](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront) · [Shopify MCP guide (Presta)](https://wearepresta.com/shopify-mcp-server-the-standardized-interface-for-agentic-commerce-2026/) · [Shopify Winter '26 Edition](https://www.shopify.com/news/winter-26-edition-dev) · [Reviewflowz review API](https://www.reviewflowz.com/review-api) · [Trustpilot pricing/G2](https://www.g2.com/products/trustpilot/pricing) · [Apify G2 scraper](https://apify.com/automation-lab/g2-scraper)
