// The build's gate. Fails on any structural, contrast or color-vision defect, and writes the
// full measurements to reports/ so every pair's margin is visible even when it passes.
//   1. Every alias resolves, in every mode, with no cycles, and no two tokens publish one name.
//   2. Every Intent mode defines the same roles.
//   3. Intent and Patterns never hold a raw color; they alias Core (alpha composites excepted).
//   4. Every contrast pair in checks/pairs.json clears its floor, in every mode.
//   5. Every pair meant to be told apart by color alone keeps its OKLab ΔE margin under normal,
//      deutan, protan and tritan vision (Machado 2009, severity 1.0). Pairs with another carrier
//      (a glyph, a word) are measured and reported, not enforced.
//   6. Atlas's CSS carries only its six type roles.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, loadModes, flatten, get, resolveValue, publicPath, aliasOf } from './lib/tokens.mjs';
import { contrast, deltaE, simulate, toHex, VISION } from './lib/color.mjs';

const { modes } = loadModes();
const pairs = JSON.parse(readFileSync(resolve(ROOT, 'checks/pairs.json'), 'utf8'));
const failures = [];
const fail = (msg) => failures.push(msg);
let checks = 0;

// 1 and 3
const roleSets = {};
for (const [mode, { tree, origin }] of Object.entries(modes)) {
  let rows;
  try {
    rows = flatten(tree);
  } catch (e) {
    fail(`[${mode}] ${e.message}`);
    continue;
  }
  checks += rows.length;
  roleSets[mode] = rows.filter((r) => origin[r.path]?.startsWith('intent/')).map((r) => r.path).sort();
  const seen = new Map();
  for (const r of rows) {
    const pub = publicPath(r.path);
    if (seen.has(pub)) fail(`[${mode}] ${r.path} and ${seen.get(pub)} both publish as ${pub}`);
    seen.set(pub, r.path);
    const file = origin[r.path] ?? '';
    const themed = !file.startsWith('core');
    const composite = r.token.$extensions?.['studio.atmo']?.composite_of;
    if (themed && r.type === 'color' && !r.alias && !composite)
      fail(`[${mode}] ${r.path} holds a raw color; Intent and Patterns alias Core`);
  }
}

// 2
const [refMode, refRoles] = Object.entries(roleSets)[0] ?? [];
for (const [mode, roles] of Object.entries(roleSets)) {
  const missing = refRoles.filter((r) => !roles.includes(r));
  const extra = roles.filter((r) => !refRoles.includes(r));
  if (missing.length || extra.length)
    fail(`[${mode}] role set differs from ${refMode}: missing ${missing.join(', ') || '-'}; extra ${extra.join(', ') || '-'}`);
}

const hexAt = (tree, path) => {
  const t = get(tree, path);
  if (!t || !('$value' in t)) throw new Error(`no token ${path}`);
  return toHex(resolveValue(tree, t.$value));
};
// The Core step a role lands on, for the report.
const stepAt = (tree, path) => {
  let t = get(tree, path);
  let a;
  while ((a = aliasOf(t))) {
    if (a.startsWith('core.')) return publicPath(a).replace('color.', '');
    t = get(tree, a);
  }
  return 'composite';
};
const short = (p) => publicPath(p).replace('color.', '');
const modesFor = (p) => p.modes ?? Object.keys(modes);

// 4
const contrastRows = [];
for (const p of pairs.contrast) {
  for (const mode of modesFor(p)) {
    const { tree } = modes[mode];
    try {
      const ratio = contrast(hexAt(tree, p.fg), hexAt(tree, p.bg));
      checks++;
      const ok = ratio + 1e-9 >= p.floor;
      contrastRows.push({ mode, ...p, ratio, ok, fgStep: stepAt(tree, p.fg), bgStep: stepAt(tree, p.bg) });
      if (!ok) fail(`[${mode}] ${short(p.fg)} on ${short(p.bg)}: ${ratio.toFixed(2)} < ${p.floor}`);
    } catch (e) {
      fail(`[${mode}] contrast ${p.fg}/${p.bg}: ${e.message}`);
    }
  }
}

// 5
const cvdRows = [];
for (const p of pairs.distinct) {
  for (const mode of modesFor(p)) {
    const { tree } = modes[mode];
    try {
      const [a, b] = [hexAt(tree, p.a), hexAt(tree, p.b)];
      const dE = Object.fromEntries(VISION.map((v) => [v, deltaE(simulate(a, v), simulate(b, v))]));
      const ratio = contrast(a, b);
      checks += VISION.length;
      const below = VISION.filter((v) => dE[v] + 1e-9 < p.min);
      let result;
      if (!below.length) result = 'clears';
      else if (p.rule === 'ratio-2-or-dE-9' && ratio >= 2) result = `clears on lightness (${ratio.toFixed(2)}:1)`;
      else if (p.carrier) result = `below margin (${below.join(', ')}); carried by ${p.carrier}`;
      else {
        result = `**fails** (${below.join(', ')})`;
        fail(`[${mode}] ${short(p.a)} vs ${short(p.b)}: ΔE under ${below.map((v) => `${v} ${dE[v].toFixed(1)}`).join(', ')} < ${p.min}`);
      }
      cvdRows.push({ mode, ...p, stepA: stepAt(tree, p.a), stepB: stepAt(tree, p.b), dE, ratio, result });
    } catch (e) {
      fail(`[${mode}] distinct ${p.a}/${p.b}: ${e.message}`);
    }
  }
}

// 6
for (const theme of ['light', 'dark']) {
  const css = readFileSync(resolve(ROOT, `dist/css/atlas-${theme}.css`), 'utf8');
  const used = new Set([...css.matchAll(/--type-([a-z0-9-]+?)-font-size:/g)].map((m) => m[1]));
  const extra = [...used].filter((r) => !pairs.atlasTypeRoles.includes(r));
  checks++;
  if (extra.length) fail(`[atlas-${theme}] type roles outside Atlas's six: ${extra.join(', ')}`);
}

// Reports. Brand OS resolves like Atmo today, so its rows are dropped where they match Atmo's.
function foldBrandOs(rows, key, measure) {
  const atmo = new Map(rows.filter((r) => r.mode.startsWith('atmo-')).map((r) => [key(r), JSON.stringify(measure(r))]));
  return rows.filter((r) => !(r.mode.startsWith('brand-os-') && atmo.get(key(r).replace('brand-os-', 'atmo-')) === JSON.stringify(measure(r))));
}
const byMode = (rows) => Object.entries(Object.groupBy(rows, (r) => r.mode));
const HEAD = '<!-- Generated by scripts/check.mjs. Do not edit. -->\n\n';
const f1 = (v) => v.toFixed(1);

let md = `${HEAD}# Contrast\n\nWCAG 2.2 contrast for every pair in \`checks/pairs.json\`, in every mode. Floors: 4.5:1 for text, 3:1 for marks and component boundaries. Brand OS modes resolve exactly like Atmo's and are omitted where identical.\n`;
for (const [mode, rows] of byMode(foldBrandOs(contrastRows, (r) => `${r.mode}|${r.fg}|${r.bg}`, (r) => r.ratio))) {
  md += `\n## ${mode}\n\n| Foreground | Background | Steps | Ratio | Floor | Result |\n|---|---|---|---|---|---|\n`;
  for (const r of rows)
    md += `| ${short(r.fg)} | ${short(r.bg)} | ${r.fgStep} on ${r.bgStep} | ${r.ratio.toFixed(2)} | ${r.floor} | ${r.ok ? r.note ?? 'passes' : '**fails**'} |\n`;
}
md += `\n## Known, not enforced\n\n- **border.control on surface.inset** measures 2.6 to 2.7:1. Inset holds skeleton loaders and recessed wells, and no control sits there, so the pair is not checked. A field placed on inset would fail WCAG 1.4.11.\n`;

let md2 = `${HEAD}# Color vision\n\nOKLab ΔE×100 between every pair the system means to be told apart, simulated under deuteranopia, protanopia and tritanopia at full severity (Machado, Oliveira & Fernandes, 2009). The margin is 6, three just-noticeable differences, and 9 on the green/brown and blue/purple confusion axes. A pair that something besides color separates, a glyph or a word, is reported against its margin and not enforced. A pair separated by color alone fails the build below it. Brand OS modes resolve exactly like Atmo's and are omitted where identical.\n`;
for (const [mode, rows] of byMode(foldBrandOs(cvdRows, (r) => `${r.mode}|${r.a}|${r.b}`, (r) => r.dE))) {
  md2 += `\n## ${mode}\n\n| Pair | Steps | Normal | Deutan | Protan | Tritan | Margin | Result |\n|---|---|---|---|---|---|---|---|\n`;
  for (const r of rows)
    md2 += `| ${short(r.a)} vs ${short(r.b)} | ${r.stepA} / ${r.stepB} | ${VISION.map((v) => f1(r.dE[v])).join(' | ')} | ${r.min}${r.axis ? ` (${r.axis})` : ''} | ${r.result} |\n`;
}
mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
writeFileSync(resolve(ROOT, 'reports/contrast.md'), md);
writeFileSync(resolve(ROOT, 'reports/color-vision.md'), md2);

const minDE = (r) => Math.min(...Object.values(r.dE));
const tight = cvdRows.filter((r) => !r.carrier).sort((x, y) => minDE(x) - minDE(y)).slice(0, 3);
console.log(`Checked ${checks} assertions across ${Object.keys(modes).length} modes.`);
console.log('Tightest color-only pairs (ΔE×100 normal / deutan / protan / tritan):');
for (const r of tight)
  console.log(`  ${r.mode.padEnd(15)} ${short(r.a)} vs ${short(r.b)}: ${VISION.map((v) => f1(r.dE[v])).join(' / ')} (min ${r.min}) ${r.result}`);
const worst = contrastRows.filter((r) => r.floor > 1).sort((x, y) => x.ratio / x.floor - y.ratio / y.floor).slice(0, 3);
console.log('Tightest contrast pairs:');
for (const r of worst) console.log(`  ${r.mode.padEnd(15)} ${short(r.fg)} on ${short(r.bg)}: ${r.ratio.toFixed(2)} (floor ${r.floor})`);
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n` + failures.map((f) => `  ✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log('All checks pass. Reports: reports/contrast.md, reports/color-vision.md');
