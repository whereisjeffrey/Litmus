# Litmus Platform — SaaS + Measurement Spec

> Status: **Draft for review** · Created: 2026-11-04
> Extends `ROADMAP.md` (extension + analysis) and `GOAL-UX-ANALYSIS.md` (goal-based analysis).
> This doc covers the move from browser plugin → full SaaS where **we get paid for measured UX improvement**.

## Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Commercial model | **Hybrid** — flat platform fee (keeps small accounts cheap and predictable) + success fee on *causally verified* uplift (captures value on large accounts) |
| 2 | Who implements fixes | **Client's developers** (human or AI agents). Litmus publishes recommendations as **Markdown files** agents can read, act on and write status back to |
| 3 | First vertical | **E-commerce** (Shopify first, then WooCommerce, then custom stacks via JS + server API) |
| 4 | Event store | **Built in-house** (own snippet, ingest pipeline, ClickHouse storage) |

## Core principle

When revenue depends on uplift, **the measurement is the product.** Every number we bill on must be auditable,
conservative, and robust to seasonality, campaigns and bots. The extension remains the free acquisition funnel and
the "Show Me" tool; the platform is the loop:

```
Observe ──► Diagnose ──► Recommend ──► Implement ──► Verify ──► Measure ──► Bill / re-prioritise
snippet     scans+RUM    .md files     client devs   re-scan    causal      contract
```

---

## 1. Commercial model (hybrid)

**Platform fee** — tiered by monthly sessions (bands TBD, e.g. <25k / <250k / <2.5M / custom). Includes snippet,
dashboard, scans, recommendations, Level C/D impact reports.

**Success fee** — only on uplift measured at **Level A or B** (randomised; see §4):
- Basis: **incremental gross profit** (client declares margin %; default to revenue × declared margin) — revenue share
  punishes low-margin retailers.
- Billed on the **lower bound of the 90% confidence interval**, not the point estimate. Conservative by design;
  this is what makes the invoice defensible.
- Per-change attribution window (default 90 days post-ship), then the change is "banked" and stops accruing.
- Floor at zero (negative results are reported, never billed); monthly cap (e.g. N× platform fee) to remove
  procurement fear for large accounts.
- **Auto-disabled below a traffic threshold** — if a site can't reach power for a typical effect within ~6 weeks, it
  stays flat-fee only. Small accounts never face a confusing variable bill.

**Measurement contract** (a first-class DB object, signed in-app): primary metric, guardrail metrics, margin %,
baseline window, attribution window, minimum detectable effect, consent/bot-handling rules, fee %, cap. Versioned;
every invoice references the contract version and the experiment IDs it was computed from.

## 2. E-commerce metrics

| Metric | Role |
|---|---|
| **Revenue per visitor (RPV)** | Default primary — combines conversion and AOV, hardest to game |
| Conversion rate, AOV | Decomposition of RPV |
| Funnel step rates (PDP → cart → checkout → purchase) | Diagnosis + per-recommendation targeting |
| Cart / checkout abandonment, time-to-purchase | Goal-specific primaries (maps to `goals.ts`: `reach-conversion-fast`, `complete-the-form`) |
| Refund/return rate, error rate, Web Vitals | **Guardrails** — an "uplift" that raises returns isn't an uplift |

Revenue truth comes from **server-side order data** (Shopify webhooks / Woo REST / client server API), never from
client-side events alone.

## 3. Tracking + event store (built in-house)

### Collection
- **Storefront snippet** (`@litmus/snippet`): <5 KB gzipped, async, `sendBeacon` batching. Page views, SPA routes,
  auto-captured funnel events, friction signals (rage/dead clicks, scroll depth, field-level abandonment, JS errors,
  Web Vitals). No session replay, no PII, consent-mode aware, cookieless option (salted daily visitor hash).
- **Shopify**: theme app embed (storefront snippet) + **Web Pixel extension** (checkout events, works on
  non-Plus checkout) + order webhooks (revenue truth). Install as a Shopify app.
- **Server API** (`POST /v1/orders`, `/v1/events`) for custom stacks.
- **Experiment SDK**: `litmus.variant('rec_0042') → 'control' | 'treatment'` — deterministic hash of visitor ID,
  logs an exposure event. Client devs implement both branches; we own assignment + measurement. Server-side SDK
  for SSR/edge rendering.

### Pipeline
```
snippet / pixel / webhooks
   │  HTTPS, batched
   ▼
Ingest service (edge, TS/Hono)   validate schema · event_id dedupe · bot filter · enrich (UA, coarse geo) · consent flag
   │
   ▼
Durable queue (Redpanda or NATS JetStream)
   │  batch consumers
   ▼
ClickHouse
   ├─ events_raw        MergeTree, partition (property_id, month), TTL per plan
   ├─ orders            from server-side sources (ReplacingMergeTree on order_id)
   ├─ exposures         experiment assignments
   └─ MVs: sessions · funnel_steps · daily_metrics · experiment_daily
   │
   ▼
Query API → dashboard, stats engine, billing
```
Postgres/Supabase stays the system of record for accounts, properties, contracts, recommendations, change log, invoices.

### Integrity requirements (billing-grade)
- Identity stitching: anonymous visitor ID ↔ cart/checkout token ↔ order ID.
- Bot/crawler filtering *before* metrics, with filtered volumes visible in the dashboard.
- Reconciliation job: daily orders/revenue vs. platform source must match ≥99.5%; alert otherwise.
- Tracking-health monitor: event volume anomaly, consent rate, page coverage — alert within hours.
- Immutable, replayable raw log (re-derive any invoice from raw events + contract version).

## 4. Attribution levels

| Level | Method | Billable? |
|---|---|---|
| **A** | Randomised A/B via experiment SDK | ✅ |
| **B** | Ship to all + 5–10% holdout via SDK | ✅ |
| **C** | Difference-in-differences vs. untouched pages/segments | Report only |
| **D** | Before/after with seasonality adjustment | Report only |

Stats engine: sequential testing (safe to peek), CUPED variance reduction using pre-period data, winsorised RPV
(heavy-tailed), bootstrap CIs, sample-ratio-mismatch checks. Dashboard shows "expected time to result" per
recommendation, computed from the site's real traffic.

## 5. Recommendations as Markdown (agent interface)

Server (Postgres) is the source of truth; Markdown is a **projection** synced into the client's world.

### Delivery
1. **GitHub App** — opens/updates a PR maintaining `.litmus/` in the client repo.
2. **CLI** — `npx litmus pull` / `npx litmus push` (status write-back).
3. **MCP server** — `list_recommendations`, `get_recommendation`, `update_status` for agents that don't work in-repo.

### Layout
```
.litmus/
  AGENTS.md                 # how agents should use this folder (lifecycle, rules, how to report back)
  index.md                  # ranked table of open recommendations
  recommendations/
    rec_0042-shipping-cost-on-pdp.md
  done/                     # banked recommendations with measured outcome
```

### File format
```markdown
---
id: rec_0042
title: Show shipping cost estimate on product page
status: open            # open → in_progress → shipped → verifying → measuring → banked | rejected | reverted
priority: 1
goal: complete-the-form
metric: rpv
expected_impact: { rpv_lift_pct: [2, 6], confidence: medium }
affected_traffic_pct: 64
pages: ["/products/*"]
selectors: [".product-form__buttons"]
experiment: { flag: rec_0042, method: holdout, split: 0.9 }
acceptance:             # machine-checkable; the verification re-scan evaluates these
  - selector: "[data-litmus='shipping-estimate']"
    exists: true
    visible_above_fold: true
evidence: [scan_8812, friction_cart_drop_pdp]
updated: 2026-11-04
---
## Problem
## Why it matters (evidence: this site's data + cited research)
## Suggested implementation (incl. wrapping in `litmus.variant('rec_0042')`)
## Acceptance criteria
## Notes from implementer   <!-- agent/dev writes here -->
```

### Write-back rules
- Implementers may change only `status`, `Notes from implementer`, and add `pr_url`. Everything else is
  server-owned; server wins on conflict.
- `shipped` triggers a **verification re-scan** against `acceptance`; pass → `measuring`, fail → back to
  `in_progress` with the reason.
- Agents must wrap changes in the experiment flag when `experiment` is present — otherwise the change can only be
  measured at Level C/D and is not billable (this is stated in `AGENTS.md`).

## 6. Dashboard modules (`packages/web`)

1. **Properties & tracking health** — install flow (Shopify app / snippet), live event stream, health checks.
2. **Goals & contract** — pick primary metric + guardrails, sign measurement contract.
3. **Funnel & friction** — step drop-off, friction hotspots per page, linked to "Show Me".
4. **Recommendations** — ranked backlog (expected € × traffic), sync status with repo/MCP.
5. **Change log** — shipped → verified timeline.
6. **Experiments & impact** — live results, CIs, time-to-result.
7. **Reports & billing** — monthly impact report, invoice with audit drill-down to experiments.

## 7. Build phases

### Phase 0 — Foundations
- [ ] Commit/merge current WIP in `~/Litmus` (goal analysis, journey, capture) and resolve the open branch
- [ ] Rename `@placeholder/*` scope decision (keep until name final)
- [ ] `packages/web` scaffold (framework TBD — Next.js or Vite+React to share components with extension)
- [ ] Supabase schema v2: orgs, users, properties, contracts, recommendations, changes, invoices
- [ ] Auth + org/property creation in dashboard
- **Exit:** log in, create a property, get a snippet key

### Phase 1 — Measure only
- [ ] `packages/snippet` with size/perf budget enforced in CI
- [ ] `packages/ingest` (validate, dedupe, bot filter, enrich) → queue → ClickHouse
- [ ] ClickHouse schema + MVs (sessions, funnel_steps, daily_metrics)
- [ ] Shopify app: theme embed + Web Pixel + order webhooks
- [ ] Identity stitching + reconciliation job + tracking-health alerts
- [ ] Dashboard: tracking health + funnel view
- **Exit:** on a Shopify dev store with simulated traffic, revenue reconciles ≥99.5% and sessions within ~10% of Shopify analytics

### Phase 2 — Diagnose + recommend
- [ ] Site-wide crawler scans (Playwright) reusing extension scanners
- [ ] Friction signals → ranked backlog (expected impact × traffic)
- [ ] Markdown projection + CLI pull/push + `AGENTS.md`
- **Exit:** a coding agent can pull a recommendation, implement it, and mark it shipped

### Phase 3 — Verify + Level C/D
- [ ] Acceptance-criteria verification re-scan
- [ ] Change log + DiD / before-after reports
- **Exit:** first impact report with CIs on a test store

### Phase 4 — Causal measurement
- [ ] Experiment SDK (client + server), exposure logging
- [ ] Stats engine (sequential, CUPED, SRM checks)
- [ ] GitHub App + MCP server
- **Exit:** A/A false-positive rate ≤ nominal; known injected lift recovered within CI

### Phase 5 — Commercialise
- [ ] Measurement contract object + signing flow
- [ ] Stripe: platform subscription + metered success fee, caps, threshold auto-disable
- [ ] Invoice audit export (re-derivable from raw events)
- **Exit:** a design partner accepts a real invoice

## 8. Testing strategy

1. **Software** — unit tests (stats engine above all), Playwright snippet tests across Chrome/Safari/Firefox,
   SPA + consent states, ingest load tests, CI size/perf budget on the snippet.
2. **Measurement validity (simulation harness)** — demo store + Shopify dev store + synthetic traffic generator
   with a *known* true conversion rate/AOV:
   - **A/A**: no change → engine reports no effect ~90–95% of the time
   - **Known lift**: inject +8% RPV → recovered within CI
   - **Confounders**: traffic spike, campaign, bot flood → Level C/D adjusts or flags; bot filter holds
   - **Billing replay**: invoice recomputed from raw log matches byte-for-byte
   This harness doubles as the regression suite and the sales artefact for sceptical finance teams.
3. **Market** — 3–5 Shopify design partners, ~60 days: measurement-only (reconcile against their analytics) →
   a handful of shipped recommendations → shadow invoice they review before any real billing.

## Open questions
- Platform-fee bands and success-fee % / cap
- Dashboard framework (Next.js vs. Vite SPA sharing extension components)
- Queue choice (Redpanda vs. NATS JetStream) and ClickHouse self-host vs. ClickHouse Cloud
- Data residency (UK/EU region from day one?)
- Final product name
