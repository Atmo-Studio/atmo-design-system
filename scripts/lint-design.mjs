// Lints every generated DESIGN.md with Google's linter. Errors fail the build; warnings print.
import { execFileSync } from 'node:child_process';
import { globSync } from 'node:fs';
import { ROOT } from './lib/tokens.mjs';

const files = ['DESIGN.md', 'DESIGN.dark.md', ...globSync('dist/design/*/DESIGN*.md', { cwd: ROOT })];
let errors = 0;
for (const f of files) {
  let out;
  try {
    out = execFileSync('npx', ['design.md', 'lint', '--format', 'json', f], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    out = e.stdout;
  }
  const report = JSON.parse(out);
  const findings = report.findings ?? report.diagnostics ?? report.issues ?? [];
  const errs = findings.filter((x) => x.severity === 'error');
  const warns = findings.filter((x) => x.severity === 'warning');
  errors += errs.length;
  console.log(`${f}: ${errs.length} errors, ${warns.length} warnings`);
  for (const x of [...errs, ...warns]) console.log(`  ${x.severity}: ${x.message ?? JSON.stringify(x)}`);
}
if (errors) process.exit(1);
