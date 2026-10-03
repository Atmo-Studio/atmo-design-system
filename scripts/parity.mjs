// Figma parity, in two steps, because the library is only reachable through the Plugin API.
//
//   node scripts/parity.mjs script
//     Writes dist/figma/parity-check.js: a read-only Plugin API script carrying a checksum of
//     the expected state of each collection and of the effect styles. Run it in the library
//     (the sync agent does this through use_figma). Where a checksum matches, the collection is
//     identical line for line; where one does not, the script returns that collection's lines
//     so the report can name every difference.
//
//   node scripts/parity.mjs report <result.json>
//     Turns that result into reports/figma-parity.md. Exits non-zero on any difference.
//
// A canonical line is name | type | scopes | code syntax | value per mode, with colors as RGBA to
// four decimals and aliases as @target-name. Both sides build the lines the same way, sort them,
// and hash them with cyrb53 (53-bit), which runs unchanged in Node and in the plugin sandbox.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './lib/tokens.mjs';

const payload = JSON.parse(readFileSync(resolve(ROOT, 'dist/figma/sync.json'), 'utf8'));
const r4 = (n) => Math.round(n * 10000) / 10000;
// Scopes compare as a set (Figma reorders them) and numbers to four decimals (Figma stores
// 32-bit floats, so 0.8 reads back as 0.800000011920929).
const val = (x) =>
  x && typeof x === 'object'
    ? 'alias' in x ? `@${x.alias}` : [x.r, x.g, x.b, x.a].map(r4).join(',')
    : typeof x === 'number' ? String(r4(x)) : String(x);

const HASH = `const cyrb53 = (str, seed = 0) => { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed; for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16); };`;
const cyrb53 = new Function(`${HASH} return cyrb53;`)();
const digest = (lines) => cyrb53([...lines].sort().join('\n'));

function expected() {
  const lines = {};
  for (const v of payload.variables) {
    const modes = payload.collections[v.collection].modes;
    lines[`${v.collection}|${v.name}`] = [v.type, [...v.scopes].sort().join(','), v.codeSyntax.WEB, modes.map((m) => val(v.values[m])).join(';')].join('|');
  }
  const fx = {};
  for (const e of payload.effectStyles)
    fx[e.name] = e.layers.map((l) => [val(l.color), l.offsetX, l.offsetY, l.blur, l.spread].join(' ')).join(';');
  const modes = Object.fromEntries(Object.entries(payload.collections).map(([k, c]) => [k, c.modes.join(';')]));
  return { lines, fx, modes };
}

function digests() {
  const { lines, fx, modes } = expected();
  const cols = {};
  for (const name of Object.keys(modes)) {
    const own = Object.entries(lines).filter(([k]) => k.startsWith(`${name}|`)).map(([k, v]) => `${k.split('|')[1]}|${v}`);
    cols[name] = { modes: modes[name], count: own.length, digest: digest(own) };
  }
  const fxLines = Object.entries(fx).map(([k, v]) => `${k}|${v}`);
  return { cols, fx: { count: fxLines.length, digest: digest(fxLines) } };
}

const CHECK = `
const digest = lines => cyrb53([...lines].sort().join('\\n'));
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const all = await figma.variables.getLocalVariablesAsync();
const byId = new Map(all.map(v => [v.id, v]));
const r4 = n => Math.round(n * 10000) / 10000;
const val = x => x && typeof x === 'object' ? (x.type === 'VARIABLE_ALIAS' ? '@' + (byId.get(x.id)?.name ?? x.id) : [x.r, x.g, x.b, x.a].map(r4).join(',')) : typeof x === 'number' ? String(r4(x)) : String(x);
const out = { capturedAt: new Date().toISOString(), collections: {}, effectStyles: null };
for (const [name, want] of Object.entries(EXPECT.cols)) {
  const c = cols.find(x => x.name === name);
  if (!c) { out.collections[name] = { match: false, missing: true }; continue; }
  const modes = c.modes.map(m => m.name).join(';');
  const lines = c.variableIds.map(id => byId.get(id)).map(v => [v.name, v.resolvedType, [...v.scopes].sort().join(','), v.codeSyntax.WEB ?? '', c.modes.map(m => val(v.valuesByMode[m.modeId])).join(';')].join('|'));
  const d = digest(lines);
  const match = d === want.digest && lines.length === want.count && modes === want.modes;
  out.collections[name] = { match, count: lines.length, digest: d, modes, ...(match ? {} : { lines }) };
}
const styles = (await figma.getLocalEffectStylesAsync()).filter(s => s.name.startsWith('elevation/'));
const fxLines = styles.map(s => s.name + '|' + s.effects.map(e => [val(e.color), e.offset.x, e.offset.y, e.radius, e.spread ?? 0].join(' ')).join(';'));
const fd = digest(fxLines);
out.effectStyles = { match: fd === EXPECT.fx.digest && fxLines.length === EXPECT.fx.count, count: fxLines.length, digest: fd, ...(fd === EXPECT.fx.digest ? {} : { lines: fxLines }) };
return out;
`;

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'script') {
  const out = `// Generated by scripts/parity.mjs from dist/figma/sync.json. Read-only.\n${HASH}\nconst EXPECT = ${JSON.stringify(digests())};\n${CHECK}`;
  writeFileSync(resolve(ROOT, 'dist/figma/parity-check.js'), out);
  console.log(`Wrote dist/figma/parity-check.js (${out.length} chars, ${payload.variables.length} variables, ${payload.effectStyles.length} effect styles)`);
} else if (cmd === 'report') {
  const r = JSON.parse(readFileSync(resolve(ROOT, arg), 'utf8'));
  const { lines, fx } = expected();
  const diffs = [];
  for (const [name, c] of Object.entries(r.collections)) {
    if (c.match) continue;
    if (c.missing) { diffs.push(['collection', name, 'exists', 'missing in Figma']); continue; }
    const want = Object.fromEntries(Object.entries(lines).filter(([k]) => k.startsWith(`${name}|`)).map(([k, v]) => [k.split('|')[1], v]));
    const got = Object.fromEntries(c.lines.map((l) => [l.split('|')[0], l.split('|').slice(1).join('|')]));
    if (c.modes !== payload.collections[name].modes.join(';')) diffs.push(['modes', name, payload.collections[name].modes.join(';'), c.modes]);
    for (const k of new Set([...Object.keys(want), ...Object.keys(got)]))
      if (want[k] !== got[k]) diffs.push(['variable', `${name} / ${k}`, want[k] ?? 'absent in code', got[k] ?? 'missing in Figma']);
  }
  if (!r.effectStyles.match) {
    const got = Object.fromEntries((r.effectStyles.lines ?? []).map((l) => [l.split('|')[0], l.split('|')[1]]));
    for (const k of new Set([...Object.keys(fx), ...Object.keys(got)]))
      if (fx[k] !== got[k]) diffs.push(['effect style', k, fx[k] ?? 'absent in code', got[k] ?? 'missing in Figma']);
  }
  const counts = Object.entries(r.collections).map(([n, c]) => `${n} ${c.count ?? 0}`).join(', ');
  let md = `<!-- Generated by scripts/parity.mjs. Do not edit. -->\n\n# Figma parity\n\nThe Atmo Design System Figma library against \`dist/figma/sync.json\`, checked inside the library by \`dist/figma/parity-check.js\`. Each line compared holds a variable's name, type, scopes, code syntax and its value in every mode. Captured ${r.capturedAt}.\n\n`;
  md += `- **Variables:** ${payload.variables.length} in code; ${counts} in Figma\n- **Effect styles:** ${payload.effectStyles.length} in code, ${r.effectStyles.count} in Figma\n- **Differences:** ${diffs.length}\n`;
  md += `\n| Collection | Checksum | Match |\n|---|---|---|\n${Object.entries(r.collections).map(([n, c]) => `| ${n} | \`${c.digest ?? '-'}\` | ${c.match ? 'yes' : '**no**'} |`).join('\n')}\n| Effect styles | \`${r.effectStyles.digest}\` | ${r.effectStyles.match ? 'yes' : '**no**'} |\n`;
  if (r.notInScope?.length) md += `\n## Not in this sync\n\n${r.notInScope.map((n) => `- ${n}`).join('\n')}\n`;
  if (diffs.length) md += `\n## Differences\n\n| Kind | Token | Code | Figma |\n|---|---|---|---|\n${diffs.map((d) => `| ${d.join(' | ')} |`).join('\n')}\n`;
  writeFileSync(resolve(ROOT, 'reports/figma-parity.md'), md);
  console.log(`${diffs.length} difference(s). Report: reports/figma-parity.md`);
  for (const d of diffs.slice(0, 20)) console.log(`  ${d.join(' | ')}`);
  process.exit(diffs.length ? 1 : 0);
} else {
  console.error('usage: node scripts/parity.mjs script | report <result.json>');
  process.exit(2);
}
