# Phase 1 — Reasoning Audit: Why the Model "Fails to Reason"

**Date:** 2026-07-18
**Verdict up front:** The model is not failing to reason. The infrastructure is *preventing* it from reasoning. Every major complaint — shallow findings, misguided criticism, generic advice — traces to a specific, fixable design decision in the current pipeline. The good news: the gap between what we have and what we want is architectural, not a research problem.

---

## The case study: "Add my location"

The car site incident is the perfect diagnostic. The model criticized a location field next to the hero search button as "diverting attention from the CTA." A real UX consultant would recognize instantly that location-first search is *essential* on a car marketplace — without it the user sees inventory 2,000 miles away.

Why did our system make this mistake? Trace it through the pipeline:

1. **The prompt hands the model a loaded gun.** [ai.ts:95](../packages/api/src/routes/ai.ts#L95) injects `"Single CTA pages: 13.5% conversion vs 2.8% for 5+ CTAs (Unbounce)"` directly into context. We literally taught it the rule it misapplied. Stat-stuffed prompts turn the model into a pattern-matcher: *see element near CTA → cite the stat → ship the finding.*
2. **The model never asked "why is this here?"** There is no instruction anywhere in the prompt to consider the designer's intent before criticizing (the Chesterton's Fence step every real consultant performs). Nothing stops rule-application without task-context reasoning.
3. **It had no room to reason anyway.** The prompt ends with *"Respond with ONLY valid JSON, no markdown, no explanation."* Forced immediate JSON output suppresses chain-of-thought entirely. We asked for conclusions and forbade the thinking that produces good ones.
4. **It was told to be shallow.** *"You have 30 seconds. What do you see?"* — we explicitly instructed a snap judgment. First-impression simulation is a useful *lens*, but we made it the entire methodology.
5. **It couldn't verify.** The model can't click the search button, can't see what happens without a location, can't scroll below the fold. It's a consultant reviewing a Polaroid of the top of your homepage through a mail slot.
6. **Nothing checked the output.** No second pass asks "would a real UX director sign this finding?" One generation, straight to the customer.

Six independent failures, all converging on one wrong finding. Fix any one and the odds improve; fix all six and you have a different product.

---

## Full inventory of infrastructure findings

### F1 — The knowledge base is not wired in (critical)

The [knowledge/](../knowledge/) directory contains 13 well-structured, research-cited files (~200+ rules across page types + 7 industries) — exactly what the ROADMAP describes as the moat. **No code loads them.** The comment at [ai.ts:384](../packages/api/src/routes/ai.ts#L384) says "Build the prompt with knowledge base context," but the function only injects a hardcoded ~6-line stat list per industry. The product's differentiating asset is dead weight on disk.

### F2 — The model is deprecated and retiring (urgent)

[ai.ts:412](../packages/api/src/routes/ai.ts#L412) hardcodes `claude-sonnet-4-20250514` — a May 2025 model that is **deprecated and retires June 15, 2026**. Scans will start hard-failing with 404s. Three model generations of reasoning improvement (Sonnet 4.6 → Sonnet 5 / Opus 4.8) have shipped since, including adaptive thinking — the single biggest reasoning lever available to us — which the current model can't use in its modern form.

### F3 — Forced one-shot JSON kills reasoning (critical)

The entire "consultant" is one `messages.create` call with `max_tokens: 4000`, no thinking configuration, and a "JSON only" instruction. Then [ai.ts:324-341](../packages/api/src/routes/ai.ts#L324-L341) regex-strips code fences and brace-hunts to parse it — fragile and unnecessary. The API has had native structured outputs (`output_config.format` with a JSON schema) for over a year; combined with adaptive thinking, the model can reason freely *and* return guaranteed-valid JSON.

### F4 — The model sees almost nothing (critical)

[service-worker.ts:11-22](../packages/extension/src/background/service-worker.ts#L11-L22) uses `chrome.tabs.captureVisibleTab` at JPEG quality 60. That's **one above-the-fold viewport, compressed**. The model evaluates "social proof placement," "pricing clarity," and "what's missing" on a page it has seen ~15% of. Half the current false-negative/false-positive surface is just blindness. It also gets no DOM alongside the image — the ROADMAP's core differentiation claim ("reads the actual DOM, not a compressed JPEG") is currently the *opposite* of what ships: we send the compressed JPEG and tell the model to ignore the DOM-derived findings.

### F5 — The prompt actively fights insight (high)

Three compounding prompt problems in [ai.ts:196-282](../packages/api/src/routes/ai.ts#L196-L282):

- **Quota forcing:** "Max 5 storyCards… first 2 visible to free users." A page with one real problem still gets a padded report; manufactured findings are exactly where credibility dies. (prompt-framework.ts has "if the page is good, say so" — but that builder appears to be dead code; the server prompt has no such rule.)
- **Tone handcuffs:** the banned-words list and mandatory compliment-sandwich ("ALWAYS lead with something positive") push output toward interchangeable, softened filler. Supportive framing is right for the brand; *mandated flattery structure* is what makes every report read the same.
- **Contradictory instructions:** "IGNORE the technical data below" …followed by the technical data, followed by "use a specific number from the scan" in the hookLine. The model is told to ignore and cite the same information.

### F6 — No verification layer (high)

Findings go from single generation to customer with zero adversarial review. The ROADMAP's hallucination guardrails (§6) are UI labels, not process. A credibility-critical product needs a kill-your-findings pass: if a second model can defeat a finding by steelmanning the designer, the finding doesn't ship.

### F7 — "AI analysis" that is actually templates (medium)

[ai-analyzer.ts](../packages/extension/src/content/scanner/ai-analyzer.ts) (751 lines) generates hookLines, story cards, and "insights" from string templates and thresholds, client-side, and presents them in the same UI surface as AI output. Some hardcoded claims are risky ("You're likely losing 40% of completions" derived from an arbitrary formula at line 19-24). Fine as a deterministic fallback layer — but it must be visually and semantically separated from reasoning output, and the pseudo-statistics need to go.

### F8 — Duplicated, drifting prompt builders (medium)

Two parallel consultant-prompt implementations exist: [prompt-framework.ts](../packages/extension/src/content/scanner/prompt-framework.ts) (client, apparently unused) and the inline builder in [ai.ts](../packages/api/src/routes/ai.ts) (server, live). They have diverged (different output schemas, different rules — one has the "don't manufacture problems" rule, one doesn't). Industry detection is also duplicated, and the server variant scores keywords against *finding descriptions*, polluting the signal.

### F9 — Heuristic page/industry detection caps context quality (low-medium)

Keyword-counting for page type and industry ([page-type-detector.ts](../packages/extension/src/content/scanner/page-type-detector.ts), threshold 3) is a reasonable v1, but misclassification poisons everything downstream (wrong persona, wrong playbook, wrong benchmarks). The model looking at a full-page screenshot classifies page type and industry more reliably than any keyword list — this should be an *output of* the reasoning pass, not a fragile input to it.

### F10 — The agent layer doesn't exist yet (expected, but now the point)

"Agent navigates, fills forms, tests flows" is in the ROADMAP's differentiation table today, but nothing navigates anything. The seed exists — [headless-scan.ts.wip](../packages/api/src/scripts/headless-scan.ts.wip) already pulls in Playwright as a dependency. Phase 3 doc turns this into the core of the product.

---

## The reframe that matters

The market research (see [02-INTEGRATIONS-RESEARCH.md](02-INTEGRATIONS-RESEARCH.md)) shows agentic simulated-user testing is emerging as a category *right now* — tools like Tessary and Synthetic Users run AI personas in real browsers; UXAudit.Now ships a Claude-powered autonomous auditor with a 1,450-rule base. The gap Jeffrey identified is real and others see it too. The window is open, but it is a window.

What we have today is a **scanner with a narrator**. What the mission statement describes is a **simulated usability study with an expert synthesizer**. Phase 3 ([03-REASONING-ENGINE-V2.md](03-REASONING-ENGINE-V2.md)) is the bridge.
