The exhibit puts the user's own work inside the finding: a pixel-perfect crop of their page, framed like a specimen, with our annotation on top.

- Source: a crop from the page screenshot at the finding element's bounding box plus ~16px context (extension: capture segments × DOM digest; walks: Playwright element screenshots). Never a redrawn imitation — their actual pixels.
- Frame: `surface` ground, 1.5px `ink` border, `radius-inner`, no shadow — the crop is the hero, the frame stays quiet.
- Annotation: 2px dashed `cobalt` ring around the offending region *inside* the crop — the same visual grammar Show Me uses on the live page, so panel and page speak one language.
- Caption above in `label-caps` + crop icon: provenance, always concrete — "FROM YOUR CHECKOUT · STEP 4", "FROM YOUR CATALOG · 14 OF 16 PRODUCTS".
- One exhibit per expanded card, placed between narrative and evidence quote. Multi-instance findings may show up to 3 crops in a row + a "+N more" chip.
- Pro's before/after reuses the exhibit frame: their element re-rendered with the rewritten copy, labeled "AFTER (PROPOSED)".
