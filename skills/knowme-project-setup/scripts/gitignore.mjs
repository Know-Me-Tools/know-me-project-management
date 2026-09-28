#!/usr/bin/env node
// Maintain the knowme-project-setup block in .gitignore.
// Usage: node gitignore.mjs <project-dir> [--stacks rust,python] [--private docs/sessions,notes/private] [--check] [--fix]
//   --check  exit 2 if the block is missing/stale or conflicting lines exist; write nothing
//   --fix    also remove lines outside the block that ignore tracked KBD/Prometheus state
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const P = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1].split(',').filter(Boolean) : [];
};
const stacks = opt('stacks');
const privatePaths = opt('private');
const check = args.includes('--check');
const fix = args.includes('--fix');

const START = '# >>> knowme-project-setup >>>';
const END = '# <<< knowme-project-setup <<<';

const STACK = {
  rust: ['/target/', '**/*.rs.bk', '*.pdb', '/fuzz/target/', '/fuzz/corpus/', '/fuzz/artifacts/', '*.snap.new', '*.pending-snap'],
  typescript: ['node_modules/', 'dist/', '.next/', '.turbo/', '*.tsbuildinfo', 'coverage/'],
  python: ['.venv/', '__pycache__/', '*.py[cod]', '.pytest_cache/', '.ruff_cache/', '.mypy_cache/'],
  go: ['/bin/', '*.test', '*.out'],
  flutter: ['.dart_tool/', 'build/', '.flutter-plugins*'],
  jvm: ['.gradle/', 'build/', '*.class'],
  dotnet: ['bin/', 'obj/'],
};

const block = [
  START,
  '# Managed by knowme-project-setup. Edit outside this block.',
  '# Tracked on purpose: .kbd-orchestrator/ (KBD state) and .prometheus/ (knowledge logs).',
  '',
  '# KBD / Prometheus runtime-only files',
  '.kbd-orchestrator/worktrees/',
  '.prometheus/.writer.lock',
  '.prometheus/.review-pending',
  '.claude/settings.json.bak.*',
  '.claude/settings.local.json',
  '',
  '# Agent-team local coordination state (prompts, evidence, recovery copies)',
  '/.agent-team/state.json',
  '/.agent-team/recovery/',
  '',
  '# Docs site generated content',
  '/website/build/',
  '/website/.docusaurus/',
  '',
  '# Secrets and keys',
  '.env',
  '.env.*',
  '!.env.example',
  '*.pem',
  '*.key',
  '*_ed25519',
  '*.ed25519',
  '',
  '# OS / editors',
  '.DS_Store',
  '.idea/',
  '*.swp',
  ...stacks.flatMap((s) => (STACK[s] ? ['', `# ${s}`, ...STACK[s]] : [])),
  ...(privatePaths.length ? ['', '# Private content: never committed', ...privatePaths.map((p) => `/${p.replace(/^\/+|\/+$/g, '')}/`)] : []),
  END,
].join('\n');

const file = path.join(P, '.gitignore');
const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const startIdx = current.indexOf(START);
const endIdx = current.indexOf(END);
if ((startIdx >= 0) !== (endIdx >= 0) || (startIdx >= 0 && endIdx < startIdx)) {
  console.error('corrupt knowme-project-setup marker pair in .gitignore; repair by hand');
  process.exit(2);
}
let outside = startIdx >= 0 ? current.slice(0, startIdx) + current.slice(endIdx + END.length) : current;

// Lines that would hide tracked state.
const conflictRe = /^\s*\/?(\.kbd-orchestrator|\.prometheus)(\/?|\/\*\*?|\/(recovery|knowledge|postmortems|decisions\.md|session-log\.md|gotchas\.md|project\.json)\/?)\s*$/;
const conflicts = outside.split('\n').filter((l) => conflictRe.test(l));
if (fix && conflicts.length) outside = outside.split('\n').filter((l) => !conflictRe.test(l)).join('\n');

const base = outside.replace(/\n{3,}/g, '\n\n').trimEnd();
const next = (base ? `${base}\n\n` : '') + block + '\n';
const stale = next !== current;

if (check) {
  console.log(JSON.stringify({blockPresent: startIdx >= 0, stale, conflicts}, null, 2));
  process.exit(stale || conflicts.length ? 2 : 0);
}
fs.writeFileSync(file, next);
for (const dir of ['.prometheus/postmortems', '.prometheus/knowledge']) {
  const d = path.join(P, dir);
  if (fs.existsSync(d) && fs.readdirSync(d).length === 0) fs.writeFileSync(path.join(d, '.gitkeep'), '');
}
console.log(JSON.stringify({written: '.gitignore', stale, conflictsReported: fix ? [] : conflicts, conflictsRemoved: fix ? conflicts : []}, null, 2));
