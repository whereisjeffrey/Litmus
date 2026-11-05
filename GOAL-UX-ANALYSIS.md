# Goal-Based UX Analysis — Feature Spec

> Status: **Phase 1 in progress** · Last updated: 2026-06-26
> Builds on the existing scanner + consultant prompt; this is the "consultant, not a checklist" layer.

## What it is

Today Litmus answers *"is this page healthy?"* (accessibility, contrast, forms, standards).
Goal-based analysis answers a different, higher-value question:

> **"Does this experience actually get a human to DO the thing — given how attention, motivation, friction, and persuasion really work?"**

The user picks a **goal** (e.g. *"get to the payment page as fast as possible"*, *"make sure users read to the end"*), and Litmus evaluates the page — or the whole multi-page journey — through **behavioral-science lenses**, grounded in deterministic on-page signals, and returns a goal score, a ranked list of friction points (each with "Show Me" highlighting and a quantified upside), and prioritized fixes.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Journey scope | **Automated traversal** — the tool drives clicks through the funnel, scanning each step. Must **never submit forms or complete purchases**; navigate *up to* the conversion point and stop. |
| Goal input | **Goal library (top 5) + custom free-text** |
| First build | The **5 goals**, each with a tuned psychology rubric |
| Monetization | **Teaser/blur** — free users see structure + a few unlocked friction points; the rest are **blurred** with a **quantified-upside label** ("unblur a fix that could lift conversion ~20%"). No free trial (avoids overuse). |

## The 5 goals

Defined in `packages/shared/src/goals.ts` (each with psychology lenses, deterministic signals, and a weighted rubric):

1. **Reach the conversion point fast** — entry → checkout/signup/booking in fewest steps. *Lenses: Hick's, Fitts's, cognitive load, goal-gradient.*
2. **Complete the form / checkout** — finish once started, don't abandon. *Lenses: effort aversion, Zeigarnik, error recovery, loss aversion / surprise costs.*
3. **Capture the lead** — anonymous visitor → known contact. *Lenses: Fogg B=MAT, reciprocity, micro-yes ladder, 5-second clarity.*
4. **Read all the way to the end** — sustain engagement to the end CTA. *Lenses: information scent / F-pattern, readability load, curiosity gap, peak-end.*
5. **Build trust before the ask** — credibility before commitment. *Lenses: Stanford web credibility, social proof, authority, risk reversal.*

Plus a **custom** goal: free text Claude interprets against the same rubric scaffolding.

## Architecture

```
Goal picker (UI)                 ── packages/extension/src/sidepanel/components/GoalPicker*
   │  goalId | customGoal
   ▼
Signal collectors (deterministic)── packages/extension/src/content/scanner/goals/   [Phase 2]
   │  Record<signalKey, value>   reuses dom-crawler / form-analyzer / link-validator
   ▼
Journey engine (automated)       ── packages/extension/src/content/journey/          [Phase 3]
   │  agentic: screenshot+DOM → Claude picks next click toward goal → content script
   │  clicks → re-scan → repeat.  HARD STOP before any submit/purchase.
   ▼
POST /api/ai/goal-analyze        ── packages/api/src/routes/goals.ts                 [Phase 2]
   │  builds goal-aware prompt from goals.ts (lenses + rubric) + signals + journey + screenshot
   ▼
GoalAnalysisResult               ── packages/shared/src/types.ts  ✅ done
   │  goalScore, rubricScores, frictionPoints[], journey[], projectedUpside
   ▼
Results UI + blur/teaser gating  ── packages/extension/src/sidepanel/components/GoalResults* [Phase 2/4]
```

Data model (`GoalDefinition`, `GoalAnalysisResult`, `GoalFrictionPoint`, `JourneyStep`, `GoalAnalyzeRequest`) lives in `packages/shared/src/types.ts`. The goal library lives in `packages/shared/src/goals.ts`.

## Phasing

- **Phase 1 — Foundation (this PR):** types + 5-goal registry with psychology rubrics + barrel export + spec. ✅ compiles.
- **Phase 2 — Single-page vertical:** signal collectors → `/api/ai/goal-analyze` prompt → goal picker UI → results with Show Me + blur teaser. Ships the wow-moment on the current page.
- **Phase 3 — Automated journey traversal:** agentic navigation loop with the hard safety stop; aggregate friction across steps.
- **Phase 4 — Polish & monetization:** blur/upside rendering, Pro gating, caching, per-goal benchmarks.

## Safety constraints (non-negotiable)

- Automated traversal **must not** submit forms, click final "Place order / Pay" buttons, or enter real data. It maps the path *to* the conversion point and stops.
- Respect destructive/irreversible actions: never click logout, delete, or payment-commit controls.
- Free-tier teaser must not be bypassable client-side (gate the unlocked content server-side).
