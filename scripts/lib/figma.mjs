// Maps the resolved modes onto Figma's three collections. The payload is what the agent-run
// sync pushes through the Plugin API, and what scripts/parity.mjs compares a Figma dump against.
//
// Collection membership comes from the source file a token was defined in:
//   core.tokens.json      → 01 Core     (one mode, "Value")
//   intent/*.tokens.json  → 02 Intent   (one mode per brand × theme)
//   patterns.tokens.json  → 03 Patterns (one mode, "Value")
// A token may set $extensions["studio.atmo.figma"] to { skip, type, value, scopes, name }.
import { walk, aliasOf, resolveValue, publicPath } from './tokens.mjs';
import { toHex, hexToRgb } from './color.mjs';

export const COLLECTIONS = { core: '01 Core', intent: '02 Intent', patterns: '03 Patterns' };

export const modeLabel = (mode) =>
  mode
    .split('-')
    .map((w) => (w === 'os' ? 'OS' : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
    .replace(/ (Light|Dark)$/, ' $1');

const collectionOf = (file) =>
  file.startsWith('core') ? 'core' : file.startsWith('intent/') ? 'intent' : file.startsWith('patterns') ? 'patterns' : null;

export const figmaName = (path) => publicPath(path).replaceAll('.', '/');

// Core colors are hidden from the pickers: products and files consume Intent, never raw steps.
// Intent colors show only in the pickers their role belongs in.
const FILL = ['FRAME_FILL', 'SHAPE_FILL'];
const MARK = ['SHAPE_FILL', 'STROKE_COLOR'];
const COLOR_SCOPES = [
  [/^color\/shadow-tint$/, ['EFFECT_COLOR']],
  [/\/on-mark$/, ['TEXT_FILL', 'SHAPE_FILL']],
  [/^color\/(text\/|status\/[a-z]+\/text$|action\/primary\/text|selected\/text$)/, ['TEXT_FILL']],
  [/^color\/(border|focus)\//, ['STROKE_COLOR']],
  [/^color\/(mark|emphasis|dot\/|status\/[a-z]+\/mark$|map\/marker)/, MARK],
  [/^color\//, FILL],
];
const scopesFor = (col, name, type) => {
  if (type !== 'color') return null;
  if (col === 'core') return [];
  return COLOR_SCOPES.find(([re]) => re.test(name))[1];
};

const DEFAULT_SCOPES = {
  color: FILL,
  dimension: ['GAP', 'WIDTH_HEIGHT', 'CORNER_RADIUS'],
  number: [],
  duration: [],
  cubicBezier: [],
  fontFamily: ['FONT_FAMILY'],
  fontWeight: ['FONT_WEIGHT'],
};

function figmaValue(token, type, tree, ext) {
  if ('value' in ext) return ext.value;
  const v = resolveValue(tree, token.$value);
  switch (type) {
    case 'color': {
      const [r, g, b] = hexToRgb(toHex(v));
      return { r: +r.toFixed(4), g: +g.toFixed(4), b: +b.toFixed(4), a: +(v.alpha ?? 1).toFixed(4) };
    }
    case 'dimension':
    case 'duration':
      return v.value;
    case 'number':
    case 'fontWeight':
      return v;
    case 'fontFamily':
      return Array.isArray(v) ? v[0] : v;
    case 'cubicBezier':
      return v.join(', ');
    case 'string':
      return v;
    default:
      return undefined;
  }
}

const figmaType = (type) =>
  type === 'color' ? 'COLOR' : ['fontFamily', 'cubicBezier', 'string'].includes(type) ? 'STRING' : 'FLOAT';

export function figmaPayload(modes) {
  const entries = Object.entries(modes);
  const vars = new Map(); // figma name → variable
  for (const [mode, { tree, origin }] of entries) {
    for (const [p, token, type] of walk(tree)) {
      const path = p.join('.');
      const col = collectionOf(origin[path]);
      if (!col) continue;
      const ext = token.$extensions?.['studio.atmo.figma'] ?? {};
      if (ext.skip || ['typography', 'shadow'].includes(type)) continue;
      const name = ext.name ?? figmaName(path);
      const modeName = col === 'intent' ? modeLabel(mode) : 'Value';
      const alias = aliasOf(token);
      const value = alias && !('value' in ext) ? { alias: figmaName(alias) } : figmaValue(token, type, tree, ext);
      const v = vars.get(name) ?? {
        name,
        collection: COLLECTIONS[col],
        type: ext.type ?? figmaType(type),
        scopes: ext.scopes ?? scopesFor(col, name, type) ?? (alias ? null : DEFAULT_SCOPES[type] ?? []),
        codeSyntax: { WEB: `var(--${publicPath(path).replaceAll('.', '-')})` },
        description: token.$description ?? '',
        values: {},
      };
      if (col !== 'intent' && v.values.Value !== undefined) continue;
      v.values[modeName] = value;
      vars.set(name, v);
    }
  }
  // Aliases must point at the target's Figma name, which an extension may have overridden.
  const renamed = new Map();
  for (const [mode, { tree }] of entries.slice(0, 1))
    for (const [p, token] of walk(tree)) {
      const n = token.$extensions?.['studio.atmo.figma']?.name;
      if (n) renamed.set(figmaName(p.join('.')), n);
    }
  for (const v of vars.values())
    for (const val of Object.values(v.values)) if (val && val.alias && renamed.has(val.alias)) val.alias = renamed.get(val.alias);

  // An alias takes its target's Figma type, and its scopes unless it set its own.
  const byName = new Map([...vars.values()].map((v) => [v.name, v]));
  for (let pass = 0; pass < 4; pass++)
    for (const v of vars.values()) {
      const a = Object.values(v.values).find((x) => x && x.alias);
      const target = a && byName.get(a.alias);
      if (!target) continue;
      v.type = target.type;
      if (v.scopes === null && target.scopes !== null) v.scopes = target.scopes;
    }
  for (const v of vars.values()) v.scopes ??= [];

  // Effect styles carry Intent's elevation in the default mode. Figma styles have no modes.
  const effects = [];
  const [, first] = entries[0];
  for (const [p, token, type] of walk(first.tree)) {
    if (type !== 'shadow' || !first.origin[p.join('.')]?.startsWith('intent/')) continue;
    const layers = [resolveValue(first.tree, token.$value)].flat().map((s) => ({
      color: figmaValue({ $value: s.color }, 'color', first.tree, {}),
      offsetX: s.offsetX.value,
      offsetY: s.offsetY.value,
      blur: s.blur.value,
      spread: s.spread.value,
    }));
    effects.push({ name: figmaName(p.join('.')), layers });
  }

  return {
    collections: Object.fromEntries(
      Object.entries(COLLECTIONS).map(([k, name]) => [
        name,
        { modes: k === 'intent' ? entries.map(([m]) => modeLabel(m)) : ['Value'] },
      ]),
    ),
    variables: [...vars.values()],
    effectStyles: effects,
  };
}
