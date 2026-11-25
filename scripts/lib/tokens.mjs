// Loads the DTCG token files through the resolver, merges each mode's sources in order,
// and resolves aliases. Follows the DTCG 2025.10 format and resolver modules.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));

export const resolver = () => readJson('tokens/atmo.resolver.json');

const isToken = (node) => node && typeof node === 'object' && '$value' in node;
const isGroup = (node) => node && typeof node === 'object' && !Array.isArray(node) && !isToken(node);

// Deep merge where a later source's token replaces an earlier one whole.
function merge(into, from) {
  for (const [k, v] of Object.entries(from)) {
    if (isGroup(v) && isGroup(into[k])) merge(into[k], v);
    else into[k] = structuredClone(v);
  }
  return into;
}

// Walks a tree and yields [path, token, inheritedType] for every token.
export function* walk(node, path = [], type) {
  const t = node.$type ?? type;
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    if (isToken(v)) yield [[...path, k], v, v.$type ?? t];
    else if (isGroup(v)) yield* walk(v, [...path, k], t);
  }
}

function sourcesOf(ref, doc) {
  const [, kind, name] = ref.split('/'); // "#/sets/brand" or "#/modifiers/theme"
  return { kind, name, def: doc[kind][name] };
}

// A color that aliases a ramp step at an opacity, or a shadow whose layers do, keeps the alias in
// the source and the opacity in an extension. Loading writes the composite out, since a CSS var()
// and a Figma alias cannot carry an opacity.
function composite(tree) {
  for (const [p, token, type] of walk(tree)) {
    const x = token.$extensions?.['studio.atmo'];
    if (type === 'color' && x?.alpha !== undefined && aliasOf(token)) {
      x.composite_of = token.$value;
      token.$value = { ...resolveValue(tree, token.$value), alpha: x.alpha };
    }
    if (type === 'shadow' && Array.isArray(x?.layerAlpha))
      token.$value = token.$value.map((l, i) => ({ ...l, color: { ...resolveValue(tree, l.color), alpha: x.layerAlpha[i] } }));
  }
}

// Returns { [brand-theme]: { tree, origin } }: every sub-brand in every theme. Brand, then the
// sub-brand's Intent, then the theme's Patterns, then the sets after them.
// origin maps a token path to the source file that last set it, for provenance.
export function loadModes() {
  const doc = resolver();
  const order = doc.resolutionOrder.map((r) => sourcesOf(r.$ref, doc));
  const brands = Object.keys(doc.modifiers.brand.contexts);
  const themes = Object.keys(doc.modifiers.theme.contexts);
  const out = {};
  for (const brand of brands)
    for (const theme of themes) {
      const pick = { brand, theme };
      const tree = {};
      const origin = {};
      for (const step of order) {
        const files = step.kind === 'sets' ? step.def.sources : step.def.contexts[pick[step.name]];
        for (const f of files) {
          const src = readJson(`tokens/${f.$ref}`);
          for (const [p] of walk(src)) origin[p.join('.')] = f.$ref;
          merge(tree, src);
        }
      }
      composite(tree);
      out[`${brand}-${theme}`] = { tree, origin };
    }
  return { doc, modifier: 'brand x theme', modes: out };
}

// The name a token is published under: its path without the layer prefix. brand.color.stone.50
// becomes color.stone.50, which is --color-stone-50 in CSS and color/stone/50 in Figma.
export const publicPath = (path) => path.replace(/^(brand|intent|patterns)\./, '');

export function get(tree, path) {
  return path.split('.').reduce((n, k) => (n == null ? n : n[k]), tree);
}

const REF = /^\{([^}]+)\}$/;

// Resolves a value, following aliases (including ones nested in composites).
export function resolveValue(tree, value, seen = []) {
  if (typeof value === 'string') {
    const m = value.match(REF);
    if (!m) return value;
    const target = get(tree, m[1]);
    if (!isToken(target)) throw new Error(`Unresolved alias ${value} (via ${seen.join(' → ') || 'root'})`);
    if (seen.includes(m[1])) throw new Error(`Circular alias ${[...seen, m[1]].join(' → ')}`);
    return resolveValue(tree, target.$value, [...seen, m[1]]);
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(tree, v, seen));
  if (value && typeof value === 'object') {
    if ('colorSpace' in value) return value;
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValue(tree, v, seen)]));
  }
  return value;
}

// The alias a token points at directly, or null when it holds a raw value.
export function aliasOf(token) {
  const m = typeof token.$value === 'string' && token.$value.match(REF);
  return m ? m[1] : null;
}

export function flatten(tree) {
  const rows = [];
  for (const [path, token, type] of walk(tree)) {
    rows.push({ path: path.join('.'), token, type, value: resolveValue(tree, token.$value), alias: aliasOf(token) });
  }
  return rows;
}
