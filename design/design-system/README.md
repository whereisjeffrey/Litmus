# litmus

The watchful, friendly eye on your UX.

Litmus is an AI UX critic that lives in a Chrome side panel. It watches a product the way a curious friend would — always looking, never judging — and tells founders what a $25K/month consultancy would tell them. The brand has to carry two things at once: **playful enough that criticism doesn't sting, rigorous enough that it's worth paying for.** Every visual decision below serves that pair.

## Voice

- Consultant, not auditor. We say "what's costing you," never "violations" or "errors."
- Findings are stated plainly and backed by evidence; warmth comes from the visual language (the mascot, the pills, the color), not from softened words.
- Section labels are lowercase and conversational: *what's working*, *what's costing you*. Impact chips are the only ALL-CAPS element — severity earns formality.

## The mascot

A pink blob with googly eyes (`assets/Mascot/litmus-mascot.svg`). It *looks at things* — that's its whole job and its whole charm.

- Body: `pink-mascot`. Eyes: white with `ink` pupils, **deliberately uneven** (different sizes, offset pupils) — symmetry would make it a logo; unevenness keeps it a creature.
- The pupils point toward whatever the mascot is "reading" — page content, a finding, the user's cursor in future animated versions.
- **The peek:** its signature move. The dome and eyes peer over the top edge of a card (first HIGH finding, empty states, loading). At most **one peek per screen** — it's a wink, not a pattern.
- Full mascot in the header at small size (26–36px wide). Never place it next to severe content doing something cute — it observes, it doesn't react.
- Never give it a mouth. The moment it smiles or frowns, it's judging.

## Color

White ground, color in **full-bleed bands** — the drawer reads as a stack of colored sections, not colored components on gray.

| Color | Means | Spent on |
| --- | --- | --- |
| `chartreuse` | the brand; insight | The Read band, working-checks, Pro CTA. Ink text always. |
| `pink-band` / `pink-mascot` | findings; the mascot | "What's costing you" band; the blob. |
| `cobalt` | action | Show me, links, the Pro band. The only color buttons come in. |
| `ink` | authority | Text, outlines, the Pro block ground. |
| `cream` | evidence | Quote/evidence blocks — paper inside the card. |

Rules: a band's children are white cards or white chips — never tint-on-tint. Impact chips are tints with matching dark inks (rust, not alarm-red: we inform, we don't scold). The band order in the drawer is fixed: chartreuse (read) → white (working) → pink (costing) → cobalt (pro) → white (utility).

## Type

- **Display — Baloo 2.** Chunky, rounded, friendly. Wordmark (lowercase, always), the Read headline, card headlines, section pills. Never below 13px.
- **Body — Inter.** Everything that must be effortless at small sizes: narratives, chips, labels, buttons.
- The Read headline (26px/31px) is the hero — budget it 3 lines max at the 344px measure. If the synthesis sentence runs longer, the sentence is wrong, not the type.

## Dimensions — design for the drawer first

- The Chrome side panel is **380px wide, docked** beside the page (the page reflows; we never overlay content). Content measure: **344px** (380 − 2×18 gutter).
- **Above the fold ≈ 850px**: header + The Read + the teaser chips must land inside it. The Read is what a founder screenshots.
- Bands run full-bleed to the panel edges; only the gutter indents content.
- Cards are compact: `card-pad` 14px, one idea per card. If a card needs two columns, it's two cards.
- Marketing/report surfaces reuse the same bands at wider measures — the drawer is the constraint that keeps the system honest.

## Shape

- Pills (`radius-pill`) for anything tappable or labeling: chips, buttons, section pills.
- Cards at `radius-card` 16px; feature blocks at `radius-block` 18px; nested surfaces at `radius-inner` 10px.
- Shadows are **flat offsets** (`shadow-card`), like print — never blur. On white, cards also take a 1.5px `ink` outline; on color bands the band supplies contrast and the outline drops.

## Parts inventory (use case per part)

1. **Header** — mascot + lowercase wordmark + context chip (page type · scope). Always visible first.
2. **Section pill** — opens each band: Baloo 13px lowercase on `chartreuse` (working) or white-on-band (costing).
3. **Stat chip** — the honest teaser row under The Read: "3 things working · 3 costing you · expert-reviewed." Counts only what's visible below — never tease hidden content.
4. **Impact chip** — HIGH / MEDIUM / LOW tint pills on finding cards.
5. **Review badge** — shield + "survived review": the free-tier proof that an adversary tried to kill the finding and failed.
6. **Finding card** — the atom. Anatomy: impact chip + review badge → headline (Baloo 16px) → narrative (2–3 lines) → evidence block (optional, expanded cards only) → action row. One finding, one card.
7. **Evidence block** — `cream`, `radius-inner`, EVIDENCE label-caps. Carries quotes/observations only — no opinions.
8. **Primary button** — cobalt pill, white text, eye icon: *Show me*. The product's hero verb; one per card max.
9. **Secondary button** — white pill, `line` border, lock icon when the content is paid (*Why it survived*).
10. **Pro block** — `ink` ground, chartreuse *pro* pill, white Baloo headline, chartreuse-arrow bullets, chartreuse CTA. The only dark surface in the drawer.
11. **Technical checks row** — the old quantitative scanner, demoted: one collapsed row at `radius-card`, `line` border, bottom of the stack.
12. **Mascot peek** — see The mascot. Decoration with a job: it marks where litmus is currently "looking."

## Accessibility pairs (all ≥ 4.5:1)

`ink`/`surface` 15.1 · `ink-soft`/`surface` 7.6 · `ink`/`chartreuse` ~13 · `ink`/`pink-band` ~11 · white/`cobalt` 6.9 · `on-dark-body`/`ink` ~12 · `impact-high-ink`/`impact-high` ~6 · `chartreuse-ink`/`chartreuse-tint` ~7 · `pink-ink`/`pink-tint` ~7. Icons are inline stroke SVG in the text's color — never emoji.

## Status & roadmap

- Light theme only (the drawer ships light; dark mode is a later theme on the same tokens).
- Components exist as specs above and live mockups in the *Litmus Drawer Concepts* canvas; a coded bundle comes when the React drawer is rebuilt.
- "litmus" is the working name — the codebase still calls it `APP_NAME` (Placeholder). If the name changes, only the wordmark and this README change; the system holds.
