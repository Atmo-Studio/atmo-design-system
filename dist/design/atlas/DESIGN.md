---
version: alpha
name: "Atlas"
description: "Atlas's light theme, generated from the atmo-design-system DTCG tokens. Values are the atlas-light mode; DESIGN.dark.md holds the other theme."
colors:
  primary: "#4c5c42" # decided 2026-10-02: shared OKLCH L curve, chroma solved per step for one CAM16 colorfulness target (13.34); Confirmed round 2:...
  secondary: "#714d40" # decided 2026-10-02: shared OKLCH L curve, chroma solved per step for one CAM16 colorfulness target (13.34); clay H42...
  tertiary: "#48536f" # decided 2026-10-02: pinned anchor: Storm Blue #48536f
  neutral: "#faf6f2" # decided 2026-10-02: pinned anchor: neutral-50 is the brand white
  ink: "#25211e" # decided 2026-10-02: pinned anchor: neutral-950 is the brand black
  surface: "#faf6f2" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.canvas
  surface-raised: "#e2ecdc" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.surface-raised
  surface-inset: "#cadcc1" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.surface-inset
  surface-card: "#faf6f2" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.surface-card
  surface-inverse: "#2c3625" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.surface-inverse
  on-surface: "#2c3625" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.text-primary
  on-surface-secondary: "#4c5c42" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.text-secondary
  on-surface-display: "#3b4833" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.text-display
  on-surface-disabled: "#8ba47d" # derived: proposal §4 sets disabled text at 400 on light; dark takes the mirror step, 600. Exempt from contrast...
  on-inverse: "#edf4e9" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.text-on-inverse
  on-inverse-secondary: "#8ba47d" # derived: the step closest to the inverse ground that still clears 4.5:1; reproduces the specimen's n400 on the n950...
  border-divider: "#cadcc1" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.border-divider
  border-control: "#728a62" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.border-control
  border-strong: "#2c3625" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.border-strong
  action: "#4c5c42" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.action-bg
  action-hover: "#3b4833" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.action-bg-hover
  action-pressed: "#4c5c42" # extracted: Atmo specimen, round 4 (2026-10-02): .menu-btn:active / .btn:active
  on-action: "#edf4e9" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.action-text
  action-disabled: "#cadcc1" # derived: the inset step: a recessed fill that no longer reads as the ink action. Exempt from contrast floors (WCAG...
  on-action-disabled: "#728a62" # derived: the control-border step on the disabled fill; legible, visibly inactive. Exempt (inactive component)....
  selected: "#2c3625" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.select-bg
  on-selected: "#edf4e9" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.select-text
  focus-ring: "#2c3625" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.focus
  emphasis: "#2c3625" # decided 2026-10-02: Atlas emphasis is neutral: the text color. Round 4 withdrew the bright-green emphasis dot
  dot-open: "#448648" # decided 2026-10-02: "Open" takes the bright green dot: #448648 on light, #8ed28f on dark
  dot-attribute: "#2c3625" # decided 2026-10-02: informational attribute dots ("Quiet before 10") are neutral and match the label text
  positive: "#2c3625" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.pos-text
  positive-mark: "#728a62" # decided 2026-10-02: state disc at the 500 step on light grounds, every state
  on-positive-mark: "#faf6f2" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.disc-glyph
  positive-surface: "#e2ecdc" # derived: proposal §4 splits each status into text, mark and surface; the surface takes the 100 step (round 4's...
  negative: "#8c5c55" # decided 2026-10-02: negative title on light grounds: red-600, the lightest step that clears 4.5:1 on canvas, card and raised
  negative-mark: "#8c5c55" # decided 2026-10-02: negative disc at 600, one step past the other states, inside "600 or lighter"
  on-negative-mark: "#faf6f2" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.disc-glyph
  negative-surface: "#fce2de" # derived: proposal §4 splits each status into text, mark and surface; the surface takes the 100 step (round 4's...
  caution: "#6c5427" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.cau-text
  caution-mark: "#a08025" # decided 2026-10-02: state disc at the 500 step on light grounds, every state
  on-caution-mark: "#faf6f2" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.cau-glyph
  caution-surface: "#f1e8cd" # derived: proposal §4 splits each status into text, mark and surface; the surface takes the 100 step (round 4's...
  info: "#48536f" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.inf-text
  info-mark: "#6e80a1" # decided 2026-10-02: state disc at the 500 step on light grounds, every state
  on-info-mark: "#faf6f2" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atmo-light.disc-glyph
  info-surface: "#e0eaf4" # derived: proposal §4 splits each status into text, mark and surface; the surface takes the 100 step (round 4's...
  skeleton: "#cadcc1" # extracted: Atmo specimen, round 4 (2026-10-02): intent_modes.atlas-light.skeleton
  error: "{colors.negative}"
typography:
  label: # decided 2026-10-02: 11/16, weight 500, tracking +0.02em. Size from the 1.2 scale; leading per §3; tracking and weight by size...
    fontFamily: "Satoshi"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.02em
    fontFeature: "\"ss02\" 1, \"ss03\" 1, \"kern\" 1"
  body-s: # decided 2026-10-02: 13/20, weight 400, tracking +0em. Size from the 1.2 scale; leading per §3; tracking and weight by size...
    fontFamily: "Satoshi"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em
    fontFeature: "\"ss02\" 1, \"ss03\" 1, \"kern\" 1"
  body-m: # decided 2026-10-02: 16/24, weight 400, tracking +0em. Size from the 1.2 scale; leading per §3; tracking and weight by size...
    fontFamily: "Satoshi"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0em
    fontFeature: "\"ss02\" 1, \"ss03\" 1, \"kern\" 1"
  body-l: # decided 2026-10-02: 19/28, weight 400, tracking +0em. Size from the 1.2 scale; leading per §3; tracking and weight by size...
    fontFamily: "Satoshi"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0em
    fontFeature: "\"ss02\" 1, \"ss03\" 1, \"kern\" 1"
  body-xl: # decided 2026-10-02: 23/36, weight 400, tracking -0.01em. Size from the 1.2 scale; leading per §3; tracking and weight by size...
    fontFamily: "Satoshi"
    fontSize: 23px
    fontWeight: 400
    lineHeight: 36px
    letterSpacing: -0.01em
    fontFeature: "\"ss02\" 1, \"ss03\" 1, \"kern\" 1"
  subheading-s: # decided 2026-10-02: 28/36, weight 500, tracking -0.01em. Size from the 1.2 scale; leading per §3; tracking and weight by size...
    fontFamily: "Satoshi"
    fontSize: 28px
    fontWeight: 500
    lineHeight: 36px
    letterSpacing: -0.01em
    fontFeature: "\"ss02\" 1, \"ss03\" 1, \"kern\" 1"
rounded:
  none: 0px # derived: Tailwind's chart starts at none; square edges (a section where it meets the top bar or the page bottom)...
  xs: 2px # decided 2026-10-02: Tailwind-style size chart; components apply a size
  sm: 4px # decided 2026-10-02: Tailwind-style size chart; components apply a size
  md: 6px # decided 2026-10-02: Tailwind-style size chart; components apply a size
  lg: 8px # decided 2026-10-02: Tailwind-style size chart; components apply a size
  xl: 12px # decided 2026-10-02: Tailwind-style size chart; components apply a size
  2xl: 16px # decided 2026-10-02: Tailwind-style size chart; components apply a size
  3xl: 24px # decided 2026-10-02: Tailwind-style size chart; components apply a size
  full: 9999px # decided 2026-10-02: Tailwind-style size chart; components apply a size
spacing:
  "0": 0px # extracted: Atmo Design System, Figma library: spacing/0
  "1": 4px # extracted: Atmo Design System, Figma library: spacing/1
  "2": 8px # extracted: Atmo Design System, Figma library: spacing/2
  "3": 12px # extracted: Atmo Design System, Figma library: spacing/3
  "4": 16px # extracted: Atmo Design System, Figma library: spacing/4
  "5": 20px # extracted: Atmo Design System, Figma library: spacing/5
  "6": 24px # extracted: Atmo Design System, Figma library: spacing/6
  "7": 28px # extracted: Atmo Design System, Figma library: spacing/7
  "8": 32px # extracted: Atmo Design System, Figma library: spacing/8
  "9": 36px # extracted: Atmo Design System, Figma library: spacing/9
  "10": 40px # extracted: Atmo Design System, Figma library: spacing/10
  "11": 44px # extracted: Atmo Design System, Figma library: spacing/11
  "12": 48px # extracted: Atmo Design System, Figma library: spacing/12
  "16": 64px # extracted: Atmo Design System, Figma library: spacing/16
  "20": 80px # extracted: Atmo Design System, Figma library: spacing/20
  "24": 96px # extracted: Atmo Design System, Figma library: spacing/24
  "px": 1px # extracted: Atmo Design System, Figma library: spacing/px
  "0-5": 2px # extracted: Atmo Design System, Figma library: spacing/0-5
  "1-5": 6px # extracted: Atmo Design System, Figma library: spacing/1-5
  "3-5": 14px # extracted: Atmo Design System, Figma library: spacing/3-5
  section-margin-narrow: 8px # decided 2026-10-02: section margin below 720px
  section-margin-medium: 12px # decided 2026-10-02: section margin 720 to 1199px
  section-margin-wide: 16px # decided 2026-10-02: section margin 1200px and up
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    typography: "{typography.body-s}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.action-pressed}"
  button-primary-disabled:
    backgroundColor: "{colors.action-disabled}"
    textColor: "{colors.on-action-disabled}"
  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-m}"
    rounded: "{rounded.sm}"
  chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
  chip-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.on-selected}"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
  section:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.2xl}"
  footer-card:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.on-inverse}"
    rounded: "{rounded.2xl}"
  toast:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  status-disc-positive:
    backgroundColor: "{colors.positive-mark}"
    textColor: "{colors.on-positive-mark}"
    size: 20px
    rounded: "{rounded.full}"
  status-disc-negative:
    backgroundColor: "{colors.negative-mark}"
    textColor: "{colors.on-negative-mark}"
    size: 20px
    rounded: "{rounded.full}"
  status-disc-caution:
    backgroundColor: "{colors.caution-mark}"
    textColor: "{colors.on-caution-mark}"
    size: 20px
    rounded: "{rounded.full}"
  status-disc-info:
    backgroundColor: "{colors.info-mark}"
    textColor: "{colors.on-info-mark}"
    size: 20px
    rounded: "{rounded.full}"
  dot-open:
    backgroundColor: "{colors.dot-open}"
    size: 6px
    rounded: "{rounded.full}"
  dot-attribute:
    backgroundColor: "{colors.dot-attribute}"
    size: 6px
    rounded: "{rounded.full}"
---

# Atlas

Generated from [tokens/](tokens/) by `npm run build`. Do not edit this file: change the tokens and rebuild.

## Overview

Atlas is a theme extending Atmo core. It is green-led: its surfaces, text and action all come from the green ramp, over the same brand white as Atmo. Red and blue are reserved for system states.

The brand narrative this section is meant to carry is not written yet. Its source document is still to come, and nothing here stands in for it.

## Colors

Every color sits on one of six 11-step ramps (neutral, green, clay, blue, ochre and red), apart from the two signal greens Atlas uses for its "Open" dot. The ramps share one OKLCH lightness curve and one colorfulness target per step, so the same step reads equally light and equally colorful in every hue. The hex values here are sRGB fallbacks; the CSS ships the OKLCH value to browsers that support it. Reproduction tolerance is ΔE00 ≤ 2, and ≤ 1 for the identity colors.

- **Primary (`#4c5c42`):** forest green, hue 134. The lead accent and, in Atlas, the action color.
- **Secondary (`#714d40`):** fired clay, the warm supporting accent.
- **Tertiary (`#48536f`):** Storm Blue, the cool supporting accent, pinned at the blue ramp's 700.
- **Neutral (`#faf6f2`) and ink (`#25211e`):** the brand white and the warm black. Never pure white or pure black.
- **Action (`#4c5c42`):** green is the primary action.
- **Status:** positive is green, negative is red, caution is ochre and info is blue. A status always shows as a filled disc carrying a glyph (check, cross, triangle, i), never as a bare dot. On light grounds the discs sit at 500, negative at 600, so positive and negative differ in lightness as well as hue. Ochre is for caution only, and may run past the palette's chroma as a status-only exception.
- **Dots:** "Open" takes `#448648`. Informational attributes take a neutral dot that matches the text. Two dots told apart by color also differ by 2:1 in lightness or by ΔE 9.

Every text pair clears 4.5:1 and every mark 3:1; the build measures each one, and simulates the system under deuteranopia, protanopia and tritanopia. The full tables are in [reports/](reports/).

## Typography

Satoshi Variable, on a 1.2 ratio from 16px, with `ss02` (alternate g), `ss03` (alternate t) and `kern` on. Leading sits on a 4px baseline grid. Body text is regular; everything else is medium. Caps labels track at +0.06em; dot labels are sentence case. Atlas uses six roles only, label, body-s, body-m, body-l, body-xl, subheading-s, and crops the range rather than rescaling it.

## Layout

Spacing runs on a 4px base. Section margins step with the viewport: 8px below 720px, 12px from 720px, 16px from 1200px. The breakpoints were set from content, not device presets.

## Elevation & Depth

A surface takes a shadow or a border, never both. Layered surfaces (toasts, popovers, stacked cards) take a shadow, floating or overlay; toasts take floating. In-flow surfaces (banners, inputs, rows) take a hairline. Shadows are tinted with deep green, never neutral gray. Glass is for chrome only.

## Shapes

Radius follows one size chart: none 0, xs 2, sm 4, md 6, lg 8, xl 12, 2xl 16, 3xl 24, full. Components apply a size rather than a role. Buttons and inputs take sm (4); chips, labels and dots are pills or circles; cards take lg (8); sections take 2xl (16). A section's corner rounds where it meets the canvas and stays square where it meets an edge.

## Components

- **Buttons:** green fill, square at 4.
- **Toasts:** neutral, with a filled state disc and the state-colored title.
- **Footer:** two patterns. The contained card ships first: the inverse surface, 16 on every corner, margins matching the section margins, portrait on phones and 3:2 from 720px. The flush colophon rounds its top corners and sits square at the page bottom.
- **Menu button:** the label at weight 650, matching the 1.5px line stroke, beside two 20px lines.

## Do's and Don'ts

- Do use green for the primary action.
- Do give every status a disc and a glyph. Don't show one as a bare dot.
- Don't use ochre for anything but caution.
- Don't use red or blue for emphasis in Atlas: both belong to system states.
- Don't use pure white (#ffffff) or pure black for a surface.
- Don't give a surface both a shadow and a border.
- Don't use glass outside chrome.
- Do keep two dots told apart by color at least 2:1 apart in lightness, or ΔE 9 apart.
