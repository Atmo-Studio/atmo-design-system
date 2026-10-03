# Atmo design system

Atmo Studio's design tokens, written as [W3C DTCG](https://www.designtokens.org/tr/2025.10/format/)
JSON and built into CSS and [DESIGN.md](https://github.com/google-labs-code/design.md) for three
brands: Atmo, Atlas and Brand OS, each in light and dark.

The JSON in [tokens/](tokens/) is the source of truth. Everything in [dist/](dist/), both DESIGN
files at the root and the two reports are generated from it. The Figma library syncs to the same
JSON.

## Use it

Each brand ships one file with both themes, plus a standalone file per theme.

```css
@import "@atmo-studio/design-system/css/atmo.css";   /* light on :root, dark by [data-theme] or system */
@import "@atmo-studio/design-system/css/atlas-dark.css"; /* one brand, one theme */
```

```css
.card {
  background: var(--color-surface-card);
  color: var(--color-text-primary);
  border-radius: var(--radius-lg);
  font: var(--type-body-m);
  font-feature-settings: var(--type-body-m-font-feature-settings);
  letter-spacing: var(--type-body-m-letter-spacing);
}
```

Products use the Intent names (`--color-surface-*`, `--color-text-*`, `--type-*`, `--motion-*`).
Core steps such as `--color-green-500` exist so that Intent can point at them.

No font files ship here. Load Satoshi Variable yourself, under its license; see
[TRADEMARKS.md](TRADEMARKS.md).

## How the tokens are organized

| Tier | File | Modes | Holds |
|---|---|---|---|
| Core | `tokens/core.tokens.json` | one | Raw values: six color ramps and two signal greens, the type scale, spacing, radius, stroke, shadow, motion |
| Intent | `tokens/intent/*.tokens.json` | six, brand × theme | Roles: surfaces, text, borders, action, status, focus, type roles, elevation, motion |
| Patterns | `tokens/patterns.tokens.json` | one | Only what no role can hold: the menu button, section and footer geometry, dot and disc sizes |

[tokens/atmo.resolver.json](tokens/atmo.resolver.json) follows the DTCG 2025.10 resolver module.
Atmo's Intent files define every role. Atlas and Brand OS files hold only their overrides and
layer on Atmo in the same theme. Brand OS overrides nothing today.

Files keep a `core.`, `intent.` or `patterns.` prefix so the tiers never collide. Published names
drop it: `core.color.green.500` is `--color-green-500` in CSS and `color/green/500` in Figma.

**Provenance.** Every token carries `$extensions["studio.atmo"].provenance`: `decided`, with the
date and the rule that produced it; `extracted`, with where it was read from; or `derived`, with
the derivation. DESIGN.md repeats it as a comment on each token line.

**Where this departs from DTCG 2025.10.** Tracking is stored in `em`, which the format's
`dimension` type does not allow, because tracking has to scale with size. Typography `lineHeight`
points at a px leading token on the 4px baseline grid, and the unitless ratio sits in
`$extensions`. Font feature settings are a `string`.

## Build and check

```bash
npm install
npm test
```

`npm test` builds everything, then fails on any of these:

- an alias that does not resolve, or two tokens publishing under one name
- an Intent mode missing a role another mode has, or Intent or Patterns holding a raw color
- a pair in [checks/pairs.json](checks/pairs.json) under its WCAG floor: 4.5:1 for text, 3:1 for
  marks and component boundaries
- a pair told apart by color alone that falls under its distance margin when simulated under
  deuteranopia, protanopia or tritanopia (Machado, Oliveira & Fernandes, 2009)
- Atlas's CSS carrying a type role outside its six
- a DESIGN.md error from Google's linter

The measurements for every pair, including the ones that pass, are in
[reports/contrast.md](reports/contrast.md) and [reports/color-vision.md](reports/color-vision.md).

## DESIGN.md

The DESIGN.md format has no themes yet ([issue #13](https://github.com/google-labs-code/design.md/issues/13)),
so each brand ships `DESIGN.md` for light and `DESIGN.dark.md` for dark, in
[dist/design/](dist/design/). The root pair is Atmo's. When the format gains themes, the generator
changes and the tokens do not.

## Figma

`dist/figma/sync.json` maps the tokens onto the library's three collections, `01 Core`,
`02 Intent` with one mode per brand × theme, and `03 Patterns`, plus the elevation effect
styles. The sync runs through the Figma Plugin API, and `npm run parity` compares a dump of the
library against this file and lists every difference.

## License

The code and token values are [MIT](LICENSE). The Atmo name, the Atlas and Brand OS names and the
Atmo logomark are not licensed. See [TRADEMARKS.md](TRADEMARKS.md).
