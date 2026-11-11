# Phase 4 — Product & Design Direction (status as of 2026-11-10)

**Read this first if you're catching up.** It summarizes everything decided since the last commit (April) and where the code actually stands. Docs 01–03 (July) cover the reasoning-engine architecture; this doc covers the Nov 2026 product/design reset.

## Where the code stands

- **Sprints 1–3 of docs/03 are built but uncommitted-until-now and untested end-to-end**: the rewritten `routes/ai.ts` (adaptive thinking, structured outputs, cached KB prompts, full-page capture), the knowledge-base loader, and the whole `packages/api/src/agent/` pipeline (persona walks via Playwright → synthesis → adversary), plus a 5-case golden set in `packages/api/evals/`.
- The pipeline has **never completed a full run**: API credits ran out in July mid-test. One LLM walk ran 26 steps on peddle.com and exposed a dropdown-targeting bug in our browser tools (see `.data` transcripts locally).
- Model defaults (`claude-opus-4-8`, `claude-sonnet-5`) predate the current model family and need updating before the next run.

## The product reset (Nov 10)

1. **Qualitative only.** Earlier pipelines kept regressing to scanner-style findings (contrast, meta tags). That's a commodity; it's explicitly not the product. The critique must read like a senior researcher: expectation breaks, trust mechanics, contradictions, timing relative to the user's commitment point.
2. **Mobbin as the test bench.** Until critique quality is reliably impressive, we tune on Mobbin app flows (screen-by-screen role-play, no browser automation, no API spend). Two critiques done this way: Lemonade onboarding (13 screens), Copilot Money onboarding (23 screens). The Copilot one set the quality bar — its best findings came from cross-screen contradictions and commitment-point timing. Mobbin also has an official MCP server (Pro plan) — the sanctioned data route if we automate this.
3. **The drawer is restructured** (see `design/`):
   - **No score.** The 0–100 gauge anchored us as a quantitative tool. Old scanner findings demoted to a collapsed "Technical checks" row.
   - Order: **The Read** (2–3 sentence synopsis) → **What's working** → **What's costing you** (ALL findings visible — nothing blurred, replacing the old locked-cards gating) → **Pro ledger** → Technical checks.
   - **Free = full diagnosis of the current page. Pro = the treatment**: exact fixes with rewritten copy, the adversary's steelman reasoning ("why it survived"), and the **multi-page journey** (cross-page contradictions — structurally impossible for a single-page scan to offer).
   - **Honest teasing only**: the journey strip and pro ledger show real counts with locked contents. House line: *"These counts are real — we already found them. The lock is only on the details."*
   - **Exhibits**: every expanded finding embeds a pixel crop of the user's own page (capture segments × DOM digest bounding boxes — both already exist in the extension) with a dashed cobalt ring, same grammar as Show Me on the live page. Pro gets before/after: their element re-rendered with our copy.
4. **Brand**: googly-eyed blob mascot (watches, never judges — no mouth, ever), chartreuse/pink/cobalt/navy on white, full-bleed band layout, Baloo 2 + Inter. Direction B ("full color") chosen from three mockups.
5. **Name**: "Litmus" collides with the email-testing product. Checked candidates: **Peeve** and **Winkle** are clean; Dekko viable with caveats; Squint is dead (Sequoia-backed squint.ai exists). Decision pending — code keeps using `APP_NAME`.

## Next steps (agreed)

1. Keep tuning critique quality on Mobbin flows; encode what works into synthesis/adversary prompts; grow the golden set.
2. Rebuild the React side panel to the new structure using `design/design-system/tokens.json`.
3. Update model IDs, re-fund API credits, fix the walk dropdown bug, then run the full pipeline end-to-end on one golden-set site.
4. Later: upgrade copy polish, background journey runs, name decision + trademark check.
