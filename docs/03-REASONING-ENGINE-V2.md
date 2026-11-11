# Phase 3 — Reasoning Engine v2: The Simulated Usability Study

**Date:** 2026-07-18
**Goal:** Replace "scanner with a narrator" with a system that *uses* the product like a person, reasons like a consultant, and never ships a finding it can't defend. This document answers the open design questions (which persona? multi-agent? second model?), specifies the architecture, and lays out the build order.

---

## 1. Design principles (the answers to the open questions)

### Q: UX-director persona or naive-user persona — which finds more?
**Both, in different roles — because that's how real usability research works.** A usability study has *participants* (naive, task-driven, think-aloud) and a *researcher* (expert, observes, synthesizes). Neither replaces the other:

- **Naive task-driven personas discover.** "I'm trying to find a 3-bedroom near me under $400k" produces the raw qualitative gold: hesitation, misreadings, wrong turns, "I expected this button to…". A naive persona at the car site would have *used* the location field and never flagged it — discovery through use is the natural immunity to the "add my location" class of error.
- **The expert persona interprets and prioritizes.** It reads the session transcripts + evidence, maps observations to research (this is where the knowledge base finally earns its keep), ranks by business impact, and writes the report. Experts pattern-match too aggressively when *looking at* a page; they're excellent when *reviewing evidence from* a session.

So: **personas generate evidence, the expert synthesizes it, and a critic tries to destroy it.** Three roles, not one.

### Q: Do we need a second model debating the first? Multi-agent?
Yes — but as a **pipeline of roles with different incentives**, not a free-form debate. Debate without structure converges to mush. The structure that works:

1. **Walker(s)** — biased toward *doing the task* (can't pontificate; must act).
2. **Synthesizer** — biased toward *insight* (must cite evidence for every claim).
3. **Adversary** — biased toward *killing findings* (rewarded for defeating claims, explicitly steelmanning the designer).

A finding survives only if the adversary fails to kill it. This is the single highest-leverage addition for credibility: the "add my location" finding dies at step 3 even if it somehow survives 1 and 2, because the adversary's first move is *"why might a car marketplace put location entry in the hero?"*

### Q: One-shot vs agentic?
Tiered. The free/preview tier stays near-one-shot (but fixed — see §3). The paid consultant report becomes agentic. Cost analysis in §6 shows this is comfortably affordable at $49/mo.

### Non-negotiable rules baked into every stage
- **Chesterton's Fence:** before criticizing any element, articulate the strongest reason it exists. If the criticism doesn't survive that, it isn't a finding.
- **Task-first evaluation:** derive what the visitor is actually trying to *do*, then judge every element by whether it serves that task — never by generic heuristics alone.
- **Evidence or it didn't happen:** every finding cites what was observed (element, step, screenshot, quote from the walk transcript). Citations get attached from the knowledge base by lookup — the model doesn't free-recall statistics (this kills hallucinated stats at the root).
- **No quotas:** a great page gets a short report that says so. Credibility compounds; padding destroys it. (The free/Pro split moves from "first 2 of 5 cards" to "diagnosis free / treatment paid" — consistent with the existing free-pro model decision.)
- **Supportive tone via voice, not word-bans:** keep the consultant-not-auditor framing and opportunity language as *style guidance*; delete banned-word lists and the mandatory compliment sandwich, which produce interchangeable filler.

---

## 2. Architecture

```
                        ┌──────────────────────────────────────────────┐
                        │  STAGE A · EVIDENCE COLLECTION (deterministic)│
                        │  • existing 9 scanners (unchanged, still free)│
                        │  • FULL-PAGE capture, desktop + mobile        │
                        │  • DOM digest: interactive-element inventory  │
                        │    (tag, text, position, size, visibility)    │
                        └──────────────┬───────────────────────────────┘
                                       │
              ┌────────────────────────┼─────────────────────────┐
              │ FREE TIER              │ PRO TIER                 │
              ▼                        ▼                          │
┌───────────────────────┐  ┌──────────────────────────────────────────┐
│ STAGE B0 · QUICK READ │  │ STAGE B · THE WALK (agentic, server-side) │
│ one call, adaptive    │  │ Playwright + tool-runner loop             │
│ thinking, full-page   │  │ tools: navigate/click/type/scroll/        │
│ screenshots, structured│ │        screenshot/read_dom/wait           │
│ output. Diagnosis-only │ │ • 1-3 task-driven naive personas          │
└───────────────────────┘  │ • think-aloud transcript per step         │
                           │ • annotated screenshots per step          │
                           │ • flows: browse → signup (real email via  │
                           │   disposable inbox) → checkout-to-payment │
                           └──────────────┬───────────────────────────┘
                                          ▼
                           ┌──────────────────────────────────────────┐
                           │ STAGE C · EXPERT SYNTHESIS                │
                           │ Opus-class model, adaptive thinking       │
                           │ inputs: walk transcripts + evidence +     │
                           │   scanner data + KNOWLEDGE BASE (cached)  │
                           │ rules: Chesterton's Fence, task-first,    │
                           │   evidence citations, no quotas           │
                           └──────────────┬───────────────────────────┘
                                          ▼
                           ┌──────────────────────────────────────────┐
                           │ STAGE D · ADVERSARIAL REVIEW              │
                           │ separate call, opposite incentive:        │
                           │ "kill each finding; steelman the designer"│
                           │ verdict per finding: CONFIRMED / KILLED / │
                           │ NEEDS-EVIDENCE (→ agent re-checks, once)  │
                           └──────────────┬───────────────────────────┘
                                          ▼
                           ┌──────────────────────────────────────────┐
                           │ STAGE E · REPORT ASSEMBLY                 │
                           │ structured outputs (output_config.format) │
                           │ citations attached by KB lookup           │
                           │ evidence bundle linked per finding        │
                           └──────────────┬───────────────────────────┘
                                          ▼
                           ┌──────────────────────────────────────────┐
                           │ STAGE F · EVIDENCE LOOP (Phase-2 integr.) │
                           │ GA4/Clarity/GSC confirm + quantify;       │
                           │ post-fix deltas prove ROI                 │
                           └──────────────────────────────────────────┘
```

### Stage A — Perception fix (prerequisite for everything)
- **Full-page capture:** scroll-and-stitch in the extension (or CDP `captureBeyondViewport`), desktop *and* mobile-viewport passes. The mobile gap report in the ROADMAP falls out of this for free.
- **DOM digest:** a compact inventory of interactive elements (selector, role, text, bounding box, above/below fold) sent *alongside* screenshots. This is what makes "Show Me" linkable from AI findings and lets the model reference concrete elements instead of vibes.
- Existing scanners unchanged — they remain the free quantitative layer and the deterministic ground truth.

### Stage B — The Walk (the product's new heart)
Server-side Playwright (resurrect and finish [headless-scan.ts.wip](../packages/api/src/scripts/headless-scan.ts.wip)), driven by the SDK's tool-runner loop. Persona prompt shape:

> You are [persona from industry detection]. Your goal: [task derived from the page/industry — "find a 3-bedroom near you and contact an agent"]. Think aloud before every action: what you expect, what you're looking at, what confuses you. You are not a critic — you are a person trying to get something done. Narrate honestly, including when things work well.

Per step, the harness records: screenshot, action taken, think-aloud text, DOM state. That transcript *is* the qualitative data — the same artifact a $15K UserTesting study produces.

**Flow coverage tiers:** (1) navigation & content-finding — safe everywhere; (2) signup with a disposable-inbox address, full verification loop; (3) checkout walked to the final payment submit, then stop. **Guardrails:** never submit real payments, never post user-generated content, respect robots/rate limits, per-domain step budget, customer-authorized flows only for logged-in areas.

### Stage C — Synthesis (where the knowledge base finally gets wired in)
Load the relevant `knowledge/*.md` page-type file + industry file + universal file into the system prompt **with prompt caching** (`cache_control` on the stable KB block — the KB is identical across all scans of a page type, so it's nearly free after the first request). The synthesizer maps walk observations to KB rules; the rule's pre-written citation ships with the finding. Page-type and industry classification also move here — the model decides from the full-page screenshot, replacing the keyword heuristics as the source of truth (heuristics stay as a pre-fetch hint for which KB files to load).

### Stage D — The Adversary
Separate call, deliberately hostile system prompt: *"You are the site's lead designer defending your work, and a senior researcher checking methodology. For each finding: (1) strongest reason the design is intentional and correct; (2) whether the cited evidence actually supports the claim; (3) verdict."* Only CONFIRMED findings ship. KILLED findings are logged (they're our eval set — see §5). NEEDS-EVIDENCE triggers one targeted re-check by the walker ("go click that and see what happens"), then a final verdict.

### Stage E — Assembly
Structured outputs (`output_config.format` with a JSON schema) replace the "ONLY valid JSON" prompt hack and the regex parser — guaranteed-valid JSON with zero reasoning suppression, because thinking happens before formatting. Story-card UI schema stays compatible; each card gains an `evidence` array (screenshot refs, transcript quotes, KB citation).

---

## 3. Model & API decisions (per current Claude API reference)

| Role | Model | Config | Rationale |
|------|-------|--------|-----------|
| Free quick-read | `claude-haiku-4-5` (or Sonnet 5 at low effort) | adaptive thinking, structured outputs | Cheap, honest diagnosis-only tier |
| Walker personas | `claude-sonnet-5` | adaptive thinking, tool runner, `effort: high` | Near-Opus agentic quality at $3/$15 (intro $2/$10 through Aug 2026); walking is action-heavy, not insight-heavy |
| Expert synthesis | `claude-opus-4-8` | adaptive thinking, `effort: xhigh` | The report IS the product; this is where intelligence is bought |
| Adversary | `claude-opus-4-8` (or Sonnet 5) | adaptive thinking, `effort: high` | Must be smart enough to beat the synthesizer |

Mandatory immediate fixes regardless of anything else: replace retiring `claude-sonnet-4-20250514`; adopt `thinking: {type: "adaptive"}`; adopt `output_config.format`; add `cache_control` to the KB/system block; stream responses (Opus turns at high effort can run minutes).

## 4. Codebase changes summary

1. **Delete/merge duplicate prompt builders** — one server-side prompt module; retire [prompt-framework.ts](../packages/extension/src/content/scanner/prompt-framework.ts) or make it the single shared source.
2. **`knowledge/` loader** — server reads KB files by page type + industry, injects with cache breakpoints. (~1 day; the single best ROI in the repo.)
3. **Rename the template layer** — [ai-analyzer.ts](../packages/extension/src/content/scanner/ai-analyzer.ts) output labeled as deterministic summaries, never "AI"; remove fabricated-percentage formulas.
4. **Full-page + dual-viewport capture** in extension; DOM digest message added to scan payload.
5. **New `packages/api/src/agent/`** — Playwright session runner, tool definitions, persona prompts, transcript store.
6. **Pipeline orchestrator** — stages C/D/E as separate calls with structured outputs; findings persisted with evidence bundles and verdicts.

## 5. Trust the system: evals

We can't tune reasoning we don't measure. Build a small eval harness early (Sprint 2):
- **Golden set:** 15-20 real sites where we hand-write the findings a great consultant would produce (including "this element looks wrong but is right" traps like the location field).
- Score each pipeline change on precision (no bogus findings), recall (catches the real ones), and trap-avoidance.
- Every KILLED finding from Stage D and every user "dismiss" in the UI feeds the set. This is how the product gets *smarter every month* instead of vibes-driven prompt tweaking.

## 6. Cost model (rough, with caching)

| Tier | Pipeline | Est. cost/run |
|------|----------|---------------|
| Free quick-read | 1 Haiku/Sonnet call, 2 full-page images | $0.01–0.04 |
| Pro page report | Synthesis (Opus) + Adversary + assembly, KB cached | $0.15–0.40 |
| Pro full walk (1 persona, ~25 steps) | Walker (Sonnet) + synthesis + adversary | $1–3 |
| Deep audit (3 personas + flows) | Full pipeline | $4–8 |

At $49/mo with, say, 10 full walks + unlimited page reports, worst-case AI cost ≈ $30–40/customer — tight but viable at launch, and caching + falling prices + Sonnet-for-synthesis experiments give margin room. A "deep audit" also justifies the one-time audit packages ($299+) already in ROADMAP Phase 8, where unit economics are trivial.

## 7. Build order

**Sprint 1 — "Stop preventing reasoning" (week 1, all quick wins)**
Model upgrade off the retiring Sonnet 4 → Sonnet 5/Opus 4.8 with adaptive thinking; structured outputs replacing the JSON hack + parser; full-page dual-viewport capture + DOM digest; prompt rewrite (kill quotas, banned-word lists, compliment sandwich, "30 seconds", "IGNORE the technical data"; add Chesterton's Fence + task-first + evidence rules). *Every one of the six failures in the case study is at least partially addressed in week 1.*

**Sprint 2 — "Wire the moat" (weeks 2–3)**
Knowledge-base loader with prompt caching; citation-by-lookup; synthesis + adversary two-stage pipeline; eval harness with golden set; page-type/industry classification moved into the model pass.

**Sprint 3 — "The Walk MVP" (weeks 4–6)**
Playwright agent runner (finish the .wip); navigation-tier persona walks with think-aloud transcripts + annotated screenshots; walk evidence feeding synthesis; "What Would A Customer Think?" report section becomes real.

**Sprint 4 — "Flows" (weeks 7–9)**
Disposable-inbox signup testing end-to-end (verification email UX included); checkout-to-payment walks; guardrail hardening; multi-persona runs; deep-audit product tier.

**Sprint 5 — "Evidence loop" (weeks 10–12)**
GA4 + Clarity + Search Console OAuth (Wave 1 from Phase 2 doc); hypothesis-confirmation in reports; traffic-weighted prioritization; first before/after impact report.

**ROADMAP.md changes implied:** the current Phase 2 "AI analysis pipeline" items are superseded by Sprints 1–2; "AI flow testing" moves up from Phase 7 (month 4+) to Sprint 3–4 — it is the differentiator, not a growth feature, and the competitive window (Tessary, Synthetic Users, UXAudit.Now) says it can't wait until month 4.

---

## 8. What this buys us, in one paragraph

Today a scan produces "opinions about a screenshot." After this: a customer connects their site, three simulated users try to actually accomplish things on it while narrating their confusion, an expert consultant reads those sessions alongside 200+ research-backed rules, a hostile reviewer kills every finding that wouldn't survive a real design review, and what ships is a short list of confirmed problems — each with a screenshot of the moment it happened, a quote from the session, a research citation, and (once analytics connect) the customer's own data showing how much it costs them. That is not a better scanner. That is the $25K/month agency deliverable at $49.
