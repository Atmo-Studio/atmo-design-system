// Writes DESIGN.md in Google's format (spec version alpha, linter 0.4.0): YAML front matter of
// tokens, then the eight prose sections in order. The spec has no themes yet, so each brand ships
// a light file and a dark one, each linted on its own.
//
// Every token line carries its provenance as a YAML comment: how the value was reached
// (decided, extracted, derived), when, and the rule behind it. Comments survive any YAML parser
// and are what a reader checks a value against.
import { get, resolveValue, publicPath } from './tokens.mjs';
import { toHex } from './color.mjs';

const BRAND = {
  atmo: { name: 'Atmo', title: 'Atmo Studio' },
  atlas: { name: 'Atlas', title: 'Atlas' },
  'brand-os': { name: 'Brand OS', title: 'Brand OS' },
};

// Front-matter color names → Intent or Core paths. Order is the order they print in.
const COLORS = [
  ['primary', 'core.color.green.700', 'The lead accent: forest green'],
  ['secondary', 'core.color.clay.700', 'Supporting accent: fired clay'],
  ['tertiary', 'core.color.blue.700', 'Supporting accent: Storm Blue'],
  ['neutral', 'core.color.neutral.50', 'Brand white'],
  ['ink', 'core.color.neutral.950', 'Brand black, warm ink'],
  ['surface', 'intent.color.surface.canvas'],
  ['surface-raised', 'intent.color.surface.raised'],
  ['surface-inset', 'intent.color.surface.inset'],
  ['surface-card', 'intent.color.surface.card'],
  ['surface-inverse', 'intent.color.surface.inverse'],
  ['on-surface', 'intent.color.text.primary'],
  ['on-surface-secondary', 'intent.color.text.secondary'],
  ['on-surface-display', 'intent.color.text.display'],
  ['on-surface-disabled', 'intent.color.text.disabled'],
  ['on-inverse', 'intent.color.text.on-inverse'],
  ['on-inverse-secondary', 'intent.color.text.on-inverse-secondary'],
  ['border-divider', 'intent.color.border.divider'],
  ['border-control', 'intent.color.border.control'],
  ['border-strong', 'intent.color.border.strong'],
  ['action', 'intent.color.action.primary.bg'],
  ['action-hover', 'intent.color.action.primary.bg-hover'],
  ['action-pressed', 'intent.color.action.primary.bg-pressed'],
  ['on-action', 'intent.color.action.primary.text'],
  ['action-disabled', 'intent.color.action.primary.bg-disabled'],
  ['on-action-disabled', 'intent.color.action.primary.text-disabled'],
  ['selected', 'intent.color.selected.bg'],
  ['on-selected', 'intent.color.selected.text'],
  ['focus-ring', 'intent.color.focus.ring'],
  ['emphasis', 'intent.color.emphasis'],
  ['dot-open', 'intent.color.dot.open'],
  ['dot-attribute', 'intent.color.dot.attribute'],
  ...['positive', 'negative', 'caution', 'info'].flatMap((s) => [
    [`${s}`, `intent.color.status.${s}.text`],
    [`${s}-mark`, `intent.color.status.${s}.mark`],
    [`on-${s}-mark`, `intent.color.status.${s}.on-mark`],
    [`${s}-surface`, `intent.color.status.${s}.surface`],
  ]),
  ['skeleton', 'intent.color.skeleton'],
];
const ERROR_ALIAS = 'negative';

const TYPE = [
  'display-l', 'display-m', 'display-s', 'display-xs', 'heading-l', 'heading-m', 'heading-s',
  'subheading-l', 'subheading-m', 'subheading-s', 'body-xl', 'body-l', 'body-m', 'body-s', 'label', 'label-caps',
];

function provenance(token) {
  const p = token?.$extensions?.['studio.atmo']?.provenance;
  if (!p) return '';
  const what = [p.kind, p.date].filter(Boolean).join(' ');
  const why = (p.rule ?? p.source ?? '').replace(/\s+/g, ' ');
  const cut = why.length > 110 ? why.slice(0, 107).replace(/\s\S*$/, '') + '...' : why;
  return ` # ${what}${cut ? `: ${cut}` : ''}`;
}

// The token whose provenance explains a role: the role's own when it was decided for this mode,
// else the Core value it lands on.
function explain(tree, path) {
  let t = get(tree, path);
  while (t && typeof t.$value === 'string' && t.$value.startsWith('{')) {
    if (t.$extensions?.['studio.atmo']?.provenance) return t;
    t = get(tree, t.$value.slice(1, -1));
  }
  return t;
}

const q = (s) => JSON.stringify(s);
const px = (d) => `${d.value}${d.unit}`;

function frontMatter(brand, theme, { tree }) {
  const b = BRAND[brand];
  const roles = tree.$extensions?.['studio.atmo']?.typeRoles ?? TYPE;
  const L = ['---', 'version: alpha', `name: ${q(`${b.title}${theme === 'dark' ? ' (dark)' : ''}`)}`];
  L.push(
    `description: ${q(
      `${b.name}'s ${theme} theme, generated from the atmo-design-system DTCG tokens. ` +
        `Values are the ${brand}-${theme} mode; ${theme === 'light' ? 'DESIGN.dark.md' : 'DESIGN.md'} holds the other theme.`,
    )}`,
  );
  L.push('colors:');
  for (const [name, path] of COLORS) {
    const t = get(tree, path);
    L.push(`  ${name}: ${q(toHex(resolveValue(tree, t.$value)))}${provenance(explain(tree, path))}`);
  }
  L.push(`  error: "{colors.${ERROR_ALIAS}}"`);
  L.push('typography:');
  for (const role of roles) {
    const t = get(tree, `intent.type.${role}`);
    const v = resolveValue(tree, t.$value);
    const ext = t.$extensions['studio.atmo'];
    const feat = resolveValue(tree, ext.fontFeatureSettings ?? '');
    L.push(`  ${role}:${provenance(t)}`);
    L.push(`    fontFamily: ${q(Array.isArray(v.fontFamily) ? v.fontFamily[0] : v.fontFamily)}`);
    L.push(`    fontSize: ${px(v.fontSize)}`, `    fontWeight: ${v.fontWeight}`);
    L.push(`    lineHeight: ${px(v.lineHeight)}`, `    letterSpacing: ${px(v.letterSpacing)}`);
    if (feat) L.push(`    fontFeature: ${q(feat)}`);
  }
  L.push('rounded:');
  for (const [k, t] of Object.entries(get(tree, 'core.radius')).filter(([k]) => !k.startsWith('$')))
    L.push(`  ${k}: ${px(t.$value)}${provenance(t)}`);
  L.push('spacing:');
  for (const [k, t] of Object.entries(get(tree, 'core.spacing')).filter(([k]) => !k.startsWith('$') && k !== 'full'))
    L.push(`  ${q(k)}: ${px(t.$value)}${provenance(t)}`);
  for (const [k, label] of [['narrow', 'below 720px'], ['medium', '720 to 1199px'], ['wide', '1200px and up']]) {
    const t = get(tree, `patterns.section.inset.${k}`);
    L.push(`  section-margin-${k}: ${px(resolveValue(tree, t.$value))} # decided 2026-10-02: section margin ${label}`);
  }
  const ty = (r) => (roles.includes(r) ? r : roles.at(-1));
  L.push(
    'components:',
    '  button-primary:',
    '    backgroundColor: "{colors.action}"',
    '    textColor: "{colors.on-action}"',
    `    typography: "{typography.${ty('body-s')}}"`,
    '    rounded: "{rounded.sm}"',
    '    padding: 12px',
    '  button-primary-hover:',
    '    backgroundColor: "{colors.action-hover}"',
    '  button-primary-pressed:',
    '    backgroundColor: "{colors.action-pressed}"',
    '  button-primary-disabled:',
    '    backgroundColor: "{colors.action-disabled}"',
    '    textColor: "{colors.on-action-disabled}"',
    '  input:',
    '    backgroundColor: "{colors.surface-card}"',
    '    textColor: "{colors.on-surface}"',
    `    typography: "{typography.${ty('body-m')}}"`,
    '    rounded: "{rounded.sm}"',
    '  chip:',
    '    backgroundColor: "{colors.surface-raised}"',
    '    textColor: "{colors.on-surface}"',
    '    typography: "{typography.label}"',
    '    rounded: "{rounded.full}"',
    '  chip-selected:',
    '    backgroundColor: "{colors.selected}"',
    '    textColor: "{colors.on-selected}"',
    '  card:',
    '    backgroundColor: "{colors.surface-card}"',
    '    rounded: "{rounded.lg}"',
    '  section:',
    '    backgroundColor: "{colors.surface-raised}"',
    '    rounded: "{rounded.2xl}"',
    '  footer-card:',
    '    backgroundColor: "{colors.surface-inverse}"',
    '    textColor: "{colors.on-inverse}"',
    '    rounded: "{rounded.2xl}"',
    '  toast:',
    '    backgroundColor: "{colors.surface-card}"',
    '    textColor: "{colors.on-surface}"',
    '    rounded: "{rounded.lg}"',
    ...['positive', 'negative', 'caution', 'info'].flatMap((s) => [
      `  status-disc-${s}:`,
      `    backgroundColor: "{colors.${s}-mark}"`,
      `    textColor: "{colors.on-${s}-mark}"`,
      '    size: 20px',
      '    rounded: "{rounded.full}"',
    ]),
    '  dot-open:',
    '    backgroundColor: "{colors.dot-open}"',
    '    size: 6px',
    '    rounded: "{rounded.full}"',
    '  dot-attribute:',
    '    backgroundColor: "{colors.dot-attribute}"',
    '    size: 6px',
    '    rounded: "{rounded.full}"',
    '---',
  );
  return L.join('\n');
}

const hex = (tree, path) => toHex(resolveValue(tree, get(tree, path).$value));

function prose(brand, theme, { tree }) {
  const b = BRAND[brand];
  const h = (p) => `\`${hex(tree, p)}\``;
  const atlas = brand === 'atlas';
  const dark = theme === 'dark';
  const roles = tree.$extensions?.['studio.atmo']?.typeRoles;
  const action = atlas ? 'green' : 'ink';
  return `
# ${b.title}${dark ? ', dark' : ''}

Generated from [tokens/](tokens/) by \`npm run build\`. Do not edit this file: change the tokens and rebuild.

## Overview

${
  atlas
    ? 'Atlas is a theme extending Atmo core. It is green-led: its surfaces, text and action all come from the green ramp, over the same brand white as Atmo. Red and blue are reserved for system states.'
    : `${b.title} works in warm neutrals with forest green as the lead accent, fired clay and Storm Blue in support. Hierarchy comes from tone at one weight, ink against a lighter ink, more than from color.`
}

The brand narrative this section is meant to carry is not written yet. Its source document is still to come, and nothing here stands in for it.

## Colors

Every color sits on one of six 11-step ramps (neutral, green, clay, blue, ochre and red), apart from the two signal greens Atlas uses for its "Open" dot. The ramps share one OKLCH lightness curve and one colorfulness target per step, so the same step reads equally light and equally colorful in every hue. The hex values here are sRGB fallbacks; the CSS ships the OKLCH value to browsers that support it. Reproduction tolerance is ΔE00 ≤ 2, and ≤ 1 for the identity colors.

- **Primary (${h('core.color.green.700')}):** forest green, hue 134. The lead accent${atlas ? ' and, in Atlas, the action color' : ''}.
- **Secondary (${h('core.color.clay.700')}):** fired clay, the warm supporting accent.
- **Tertiary (${h('core.color.blue.700')}):** Storm Blue, the cool supporting accent, pinned at the blue ramp's 700.
- **Neutral (${h('core.color.neutral.50')}) and ink (${h('core.color.neutral.950')}):** the brand white and the warm black. Never pure white or pure black.
- **Action (${h('intent.color.action.primary.bg')}):** ${action} is the primary action.
- **Status:** positive is green, negative is red, caution is ochre and info is blue. A status always shows as a filled disc carrying a glyph (check, cross, triangle, i), never as a bare dot. On ${dark ? 'dark grounds the discs sit at 400, negative at 300' : 'light grounds the discs sit at 500, negative at 600'}, so positive and negative differ in lightness as well as hue. Ochre is for caution only, and may run past the palette's chroma as a status-only exception.
- **Dots:** "Open" takes ${h('intent.color.dot.open')}. Informational attributes take a neutral dot that matches the text. Two dots told apart by color also differ by 2:1 in lightness or by ΔE 9.

Every text pair clears 4.5:1 and every mark 3:1; the build measures each one, and simulates the system under deuteranopia, protanopia and tritanopia. The full tables are in [reports/](reports/).

## Typography

Satoshi Variable, on a 1.2 ratio from 16px, with \`ss02\` (alternate g), \`ss03\` (alternate t) and \`kern\` on. Leading sits on a 4px baseline grid. Body text is regular; everything else is medium. Caps labels track at +0.06em; dot labels are sentence case.${
    roles ? ` Atlas uses six roles only, ${roles.join(', ')}, and crops the range rather than rescaling it.` : ''
  }

## Layout

Spacing runs on a 4px base. Section margins step with the viewport: 8px below 720px, 12px from 720px, 16px from 1200px. The breakpoints were set from content, not device presets.

## Elevation & Depth

A surface takes a shadow or a border, never both. Layered surfaces (toasts, popovers, stacked cards) take a shadow, floating or overlay; toasts take floating. In-flow surfaces (banners, inputs, rows) take a hairline. Shadows are tinted with ${atlas ? 'deep green' : 'warm ink'}, never neutral gray. Glass is for chrome only.

## Shapes

Radius follows one size chart: none 0, xs 2, sm 4, md 6, lg 8, xl 12, 2xl 16, 3xl 24, full. Components apply a size rather than a role. Buttons and inputs take sm (4); chips, labels and dots are pills or circles; cards take lg (8); sections take 2xl (16). A section's corner rounds where it meets the canvas and stays square where it meets an edge.

## Components

- **Buttons:** ${action} fill, square at 4.
- **Toasts:** neutral, with a filled state disc and the state-colored title.
- **Footer:** two patterns. The contained card ships first: the inverse surface, 16 on every corner, margins matching the section margins, portrait on phones and 3:2 from 720px. The flush colophon rounds its top corners and sits square at the page bottom.
- **Menu button:** the label at weight 650, matching the 1.5px line stroke, beside two 20px lines.

## Do's and Don'ts

- Do use ${action} for the primary action.
- Do give every status a disc and a glyph. Don't show one as a bare dot.
- Don't use ochre for anything but caution.${atlas ? "\n- Don't use red or blue for emphasis in Atlas: both belong to system states." : ''}
- Don't use pure white (#ffffff) or pure black for a surface.
- Don't give a surface both a shadow and a border.
- Don't use glass outside chrome.
- Do keep two dots told apart by color at least 2:1 apart in lightness, or ΔE 9 apart.
`;
}

export function designMd(brand, theme, mode) {
  return frontMatter(brand, theme, mode) + '\n' + prose(brand, theme, mode);
}
