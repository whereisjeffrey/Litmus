# Voice Laws — the graded assertions

The content evals (`golden-set.json`) grade **what** the pipeline finds. These laws grade
**how it speaks**. A report can score perfect recall and still fail voice — and a voice
failure ships nothing, because the voice *is* the product (docs/05 §6).

Every law records its origin: the feedback that created it and the date. That is the
point of this file — founder feedback becomes a permanent, testable assertion instead of
a patch on whatever artifact was on screen that day. Prompt changes get run against these
laws before shipping, exactly like golden-set cases.

Two check types:
- **`regex`** — deterministic, runs free and offline (`check-voice.ts`, no API).
- **`judge`** — LLM-graded (`check-voice.ts --judge`), for laws a pattern can't catch.

Severity: **fail** blocks shipping; **warn** is reviewed, not blocking.

| # | Law | Origin | Check |
|---|-----|--------|-------|
| V1 | **Opportunity framing.** Critique moments and elements, never the owner or their work. No wit at the site's expense ("your checkout does the un-convincing" is the canonical banned sentence). The summary opens with what demonstrably works, then frames findings as recoverable sales. | 2026-11-16 — "maybe this person built the checkout… frame it as an opportunity. It's not good sales language." | regex + judge · fail |
| V2 | **Trade-off first.** Every finding narrative opens by granting the strongest honest reason the design might be intentional (the adversary's steelman), then shows where the trade-off leaks value. | 2026-11-16 — "acknowledge the trade-off because the trade-off is real." | judge · fail |
| V3 | **Quotes are evidence, not copy.** No synthesized customer quotes in customer-facing narrative; walker quotes live only in evidence refs / receipts. | 2026-11-16 — "I don't think you need that quote. It's just confusing." | regex + judge · fail |
| V4 | **No class labels customer-facing.** The taxonomy (Trust Break, Credibility Leak, …) runs the engine and never appears in copy a cold reader sees. | 2026-11-11 — "what's a trust break? I don't know." | regex · fail |
| V5 | **No feelings-speak.** Never "users might feel confused / may frustrate users." Business consequences only: costs, leaks, breaks, discounts. | 2026-11-10 — the founding qualitative-not-quantitative correction. | regex + judge · fail |
| V6 | **Located and counted.** Every claim carries its number and its location ("14 of 16 products," "step 4 of checkout"). Adjectives never arrive alone. | 2026-11-15 — five-layer anatomy; sharpness lives in facts. | regex (warn) + judge (fail) |
| V7 | **Cited research only.** Any statistic must come from the knowledge base with its source attached; a percentage with `research: null` is a failure. Never free-recalled numbers. | 2026-07 design, reaffirmed 2026-11-16 — "link to studies… break down what the document says." | regex · fail |
| V8 | **Competitor contrast: verified and contrasting.** A competitor row ships only when observed this run (link/screenshot) AND when it actually contrasts. A competitor doing the same thing kills the row — cite research instead. | 2026-11-16 — competitor-crawl directive + honesty rule. | judge · fail (when present) |
| V9 | **No scanner residue.** No scores (N/100), no dev-speak units (alt text, H1, schema, CLS) in customer-facing copy. | 2026-11-10 — "put a tag in your text… doesn't resonate with owners and CEOs." | regex · fail |
| V10 | **Strengths present and specific.** Accurate, specific praise ("96% true-to-size at the size picker"), not generic ("nice design"). Praise is what makes the critique credible. | 2026-07 synthesis rule, reinforced on the 2026-11-16 live run. | regex (warn) + judge |

## How a new piece of feedback gets in

1. Add the law here with its origin quote and date.
2. Add its machine form to `voice-laws.json` (regex if a pattern can catch it, judge question otherwise).
3. If the feedback came from a concrete run, add that run's copy to `fixtures/` as the register benchmark.
4. Run `check-voice.ts` against the current golden fixtures — the new law should pass on approved copy and fail on the copy that prompted the feedback. If it can't tell them apart, the law is written wrong.

## Register benchmark

`fixtures/chubbies-2026-11-16.md` — the first live run (real store, real walk), with the
v3-approved copy. Judge checks grade against it; it is the "what good sounds like" reference.
The pre-v3 verdict sentence that violated V1 is preserved there as the negative example.

## Usage

```
# free, offline, deterministic laws only — runs in CI
npx tsx src/scripts/check-voice.ts <reportFile>
npx tsx src/scripts/check-voice.ts --text <anyCopyFile>

# full grade including judge laws (needs API credits)
npx tsx src/scripts/check-voice.ts <reportFile> --judge
```

Exit code 1 on any `fail` — wire it next to `run-evals.ts` in the pre-ship checklist.
