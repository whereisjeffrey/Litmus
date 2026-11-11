# Design sources

Source files for the current brand + drawer design direction (Nov 2026). The living, rendered versions are Claude artifacts — ask Jeffrey for access (they're private until shared from each artifact's Share menu):

- **Litmus Drawer Concepts** (canvas with 4 artboards): https://claude.ai/artifact/Hhui4tk338nwk2wvevR3tt
- **Litmus Design System** (tokens, brand book, live component previews): https://claude.ai/artifact/V1qd74ggMkPH2TtR3xWRdu

## What's here

- `design-system/` — the design system's own files:
  - `tokens.json` — colors (24), type (Baloo 2 display / Inter body, 11 styles), spacing, radius, shadows. Every token has a usage note. **This is the source of truth for the React rebuild.**
  - `README.md` — the brand book: voice, mascot rules, color meanings, drawer dimensions (380px panel, 344px measure), parts inventory with use cases, accessibility pairs.
  - `components/*/` — guidelines + static HTML previews for each part (chips, buttons, finding card/row, evidence block, exhibit, journey strip, pro ledger, header).
  - `litmus-mascot.svg` — the googly-eyed blob.
- `drawer-concepts/` — the four mockup artboards (`.dc.html` — self-contained HTML; open the artifact for proper rendering, or read them as annotated markup):
  - `Main` — direction A, mostly white
  - `Loud` — direction B, full-color bands (**the chosen direction**)
  - `Dense` — B under volume: 9 findings, journey strip, exhibits (crops of the user's own page), pro ledger
  - `Context` — B docked in a real browser next to a page, Show Me active

Naming note: "litmus" is a placeholder wordmark — the name is being changed (Litmus is an existing email product). Current clean candidates: **Peeve**, **Winkle**; see docs/04.
