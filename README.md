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

Products use the Patterns names (`--color-surface-*`, `--color-text-*`, `--type-*`, `--motion-*`).
Brand steps such as `--color-green-500` and Intent ramps such as `--color-accent-500` exist so that
the layer above can point at them.

No font files ship here. Load Satoshi Variable yourself, under its license; see
[TRADEMARKS.md](TRADEMARKS.md).

## How the tokens are organized

Brand, meaning, application: three layers, each pointing only at the one below and each
switching one thing.

| Layer | File | Modes | Holds |
|---|---|---|---|
| Brand | `tokens/brand.tokens.json` | one | Raw values: five color ramps (stone, green, clay, blue, ochre), two signal greens and deep ink, the type scale, spacing, radius, stroke, shadow, motion |
| Intent | `tokens/intent/<sub-brand>.tokens.json` | one per sub-brand: atmo, atlas, brand-os | What each ramp means, stop for stop: `neutral`, `accent`, `error`, `success`, `warning`, `info`, `base`, plus `live` (the open-now green) and `ink` (deep ink for shadows) |
| Patterns | `tokens/patterns/<theme>.tokens.json`, `tokens/patterns/components.tokens.json` | one per theme: light, dark | Roles: surfaces, text, borders, action, status, focus, type roles, elevation, motion; and the component geometry no role can hold |

[tokens/atmo.resolver.json](tokens/atmo.resolver.json) follows the DTCG 2025.10 resolver module,
with a `brand` and a `theme` modifier. The build writes every sub-brand in every theme.

**A sub-brand changes only Intent.** Every sub-brand has the same Intent names and the same
Patterns roles. Atmo and Brand OS map `neutral` to stone; Atlas maps it to green, so its grounds,
text and borders come from the green ramp. `base` is stone in every sub-brand: the brand white and
warm ink a role keeps even in Atlas (the light page and card, the ink on status discs).

**Accent variants.** Where a product applies a role in its accent instead of its ink, Patterns
carries a variant on Intent's `accent`: `--color-action-accent-bg`, `--color-selected-bg-accent`,
`--color-focus-ring-accent`, `--color-map-marker-accent`, `--color-mark-accent`, and
`--color-dot-live` for the open-now dot. Atlas uses them.

**Tints and shadows.** A veil, overlay, glass or shadow is an Intent step at an opacity: the source
aliases the step and keeps the opacity in `$extensions["studio.atmo"].alpha` (`layerAlpha` for a
shadow), and the build writes the composite out.

Files keep a `brand.`, `intent.` or `patterns.` prefix so the layers never collide. Published names
drop it: `brand.color.green.500` is `--color-green-500` in CSS and `color/green/500` in Figma. No
Brand ramp shares a name with an Intent ramp, which is why the warm gray is `stone`.

Before 2026-11-24 the system had Core, Intent (the roles, brand × theme) and Patterns (geometry),
and Atlas held its own overrides. Those files, with the provenance of each Atlas decision, are in
the history before the `three-layers` change.

**Provenance.** Every token carries `$extensions["studio.atmo"].provenance`: `decided`, with the
date and the rule that produced it; `extracted`, with where it was read from; or `derived`, with
the derivation. DESIGN.md repeats it as a comment on each token line.

**Where this departs from DTCG 2025.10.** Tracking is stored in `em`, which the format's
`dimension` type does not allow, because tracking has to scale with size. Typography `lineHeight`
points at a px leading token on the 4px baseline grid, and the unitless ratio sits in
`$extensions`. Font feature settings are a `string`.

**Type sizes and leading ship in rem.** The source keeps px, which Figma reads, and the CSS build
divides by 16, so text and its leading follow the visitor's browser text size.

## Build and check

```bash
npm install
npm test
```

`npm test` builds everything, then fails on any of these:

- an alias that does not resolve, or two tokens publishing under one name
- an Intent mode missing a name another mode has, Intent or Patterns holding a raw color, Intent
  pointing anywhere but Brand, or a Patterns color pointing anywhere but Intent
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

`dist/figma/sync.json` maps the tokens onto the library's three collections, `01 Brand`,
`02 Intent` with one mode per sub-brand, and `03 Patterns` with one mode per theme, plus the two
elevation effect styles. A frame picks its sub-brand in Intent and its theme in Patterns. The sync writes them through the Figma Plugin API, because the Variables REST API needs an
Enterprise plan.

Parity is checked inside the library. `npm run build` writes `dist/figma/parity-check.js`, a
read-only script holding a checksum of every collection; run in Figma, it returns which collections
match and the full contents of any that do not. `npm run parity -- <result.json>` turns that result
into [reports/figma-parity.md](reports/figma-parity.md), listing every difference.

## License

The code and token values are [MIT](LICENSE). The Atmo name, the Atlas and Brand OS names and the
Atmo logomark are not licensed. See [TRADEMARKS.md](TRADEMARKS.md).
