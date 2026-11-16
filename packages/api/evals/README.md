# Reasoning Engine Evals

The golden set is how we tune the pipeline on evidence instead of vibes
(docs/03 §5). Every prompt or model change gets scored against it before
shipping.

Two layers, two runners:
- **Content** (`golden-set.json` + `run-evals.ts`) — did it find the right
  things and avoid the traps?
- **Voice** (`VOICE-LAWS.md` + `voice-laws.json` + `check-voice.ts`) — does it
  speak like the consultant we sell? Founder feedback becomes numbered, graded
  laws with origin dates; the deterministic subset runs free/offline in CI.
  First register benchmark: `fixtures/chubbies-2026-11-16.md` (the first live
  run). A report ships only when both layers pass.

## Structure

- `golden-set.json` — the cases. Each case is a real page plus the findings a
  great consultant *would* and *would not* produce there.
- Case types:
  - `expected` findings — a good report catches these (recall).
  - `forbidden` findings — **traps**: elements that pattern-match to a
    heuristic violation but are correct for the task (the "add my location"
    class). A report that flags one fails the case (precision).
- Sources that grow the set over time:
  - Stage D `killed` findings (persisted in `.data/reports/*.json`)
  - User "dismiss" actions in the extension UI
  - Any real-world miss we notice

## Scoring (runner TBD — Sprint 2 backlog)

Per case: recall = expected found / expected total; precision penalty per
forbidden finding flagged; trap-avoidance is reported separately because it is
the metric this product lives or dies on.

## Writing a good trap case

Describe the element, the naive heuristic that would flag it, and the
task-level reason it's correct. The adversary stage should articulate that
reason on its own — if it can't, the case has caught a real weakness.
