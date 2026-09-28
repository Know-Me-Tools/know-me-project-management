#!/usr/bin/env node
// Aggregate verification for knowme-project-setup. Read-only.
// Usage: node verify.mjs <project-dir> [--fleet claude,codex,opencode,kimi,minimax,zed] [--privacy] [--private docs/sessions] [--json]
// Exit 0 = no FAIL, 1 = at least one FAIL. SKIP is never PASS.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const P = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1].split(',') : d;
};
const fleet = opt('fleet', ['claude', 'codex', 'opencode', 'kimi', 'minimax', 'zed']);
const privatePaths = opt('private', ['docs/sessions']);
const privacyOnly = args.includes('--privacy');
const asJson = args.includes('--json');

const results = [];
const add = (stage, check, status, detail = '') => results.push({stage, check, status, detail});
const ex = (rel) => fs.existsSync(path.join(P, rel));
const rd = (rel) => {
  try {
    return fs.readFileSync(path.join(P, rel), 'utf8');
  } catch {
    return null;
  }
};
const sh = (cmd, a) => {
  try {
    return {ok: true, out: execFileSync(cmd, a, {cwd: P, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000}).trim()};
  } catch (e) {
    return {ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim()};
  }
};
const isRepo = sh('git', ['rev-parse', '--git-dir']).ok;
const tracked = isRepo ? sh('git', ['ls-files']).out.split('\n').filter(Boolean) : [];
const ignored = (rel) => isRepo && sh('git', ['check-ignore', '-q', rel]).ok;

function privacy() {
  if (!isRepo) return add('privacy', 'git repository', 'SKIP', 'not a git repo');
  const staged = sh('git', ['diff', '--cached', '--name-only']).out.split('\n').filter(Boolean);
  const all = [...new Set([...tracked, ...staged])];
  const leakedPrivate = all.filter((f) => privatePaths.some((p) => f === p || f.startsWith(`${p.replace(/\/$/, '')}/`)));
  add('privacy', 'private paths not tracked/staged', leakedPrivate.length ? 'FAIL' : 'PASS', leakedPrivate.slice(0, 5).join(', '));
  const secretRe = /BEGIN [A-Z ]*PRIVATE KEY|\bsk-[A-Za-z0-9]{20,}|\bghp_[A-Za-z0-9]{20,}|\bxox[bp]-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16}/;
  const homeRe = /\/Users\/[A-Za-z0-9._-]+\/|\/home\/[A-Za-z0-9._-]+\//;
  const secrets = [];
  const homes = [];
  for (const f of all) {
    if (!/\.(md|json|ya?ml|toml|mjs|js|ts|sh|txt|html|css|env)$/.test(f) || f.includes('/skills/')) continue;
    const t = rd(f);
    if (!t) continue;
    if (secretRe.test(t)) secrets.push(f);
    if (homeRe.test(t) && /^(\.kbd-orchestrator|\.agent-team|\.prometheus\/project\.json|AGENTS\.md|PRODUCT\.md|DESIGN\.md|website\/(src|content|docusaurus))/.test(f)) homes.push(f);
  }
  add('privacy', 'no key material or tokens', secrets.length ? 'FAIL' : 'PASS', secrets.slice(0, 5).join(', '));
  add('privacy', 'no home-directory paths in config', homes.length ? 'WARN' : 'PASS', homes.slice(0, 5).join(', '));
  const gi = rd('.gitignore') ?? '';
  const hasBlock = gi.includes('# >>> knowme-project-setup >>>');
  add('privacy', 'managed .gitignore block', hasBlock ? 'PASS' : 'WARN', hasBlock ? '' : 'run scripts/gitignore.mjs');
}

if (privacyOnly) {
  privacy();
} else {
  // 1 git
  add('git', 'repository', isRepo ? 'PASS' : 'FAIL');
  if (isRepo) {
    const br = sh('git', ['branch', '--show-current']).out;
    add('git', 'branch main', br === 'main' ? 'PASS' : 'WARN', br);
    const origin = sh('git', ['remote', 'get-url', 'origin']);
    add('git', 'origin remote', origin.ok ? 'PASS' : 'WARN', origin.ok ? origin.out : 'none');
  }
  // 2 openspec
  add('openspec', 'openspec/config.yaml', ex('openspec/config.yaml') ? 'PASS' : 'FAIL');
  const toolDir = {claude: '.claude/skills', codex: '.agents/skills', zed: '.agents/skills', opencode: '.opencode/skills', kimi: '.kimi-code/skills'};
  for (const t of fleet) {
    if (t === 'minimax' || t === 'minimax-code') {
      add('openspec', 'minimax skills', 'SKIP', 'global ~/.minimax/skills; not verifiable per project');
      continue;
    }
    const d = toolDir[t];
    if (d) add('openspec', `${t} skills`, ex(`${d}/openspec-propose`) ? 'PASS' : 'FAIL', d);
  }
  // 3/6 context
  const agents = rd('AGENTS.md');
  add('context', 'AGENTS.md', agents ? 'PASS' : 'FAIL');
  let claudeLink = null;
  try {
    const st = fs.lstatSync(path.join(P, 'CLAUDE.md'));
    claudeLink = st.isSymbolicLink() ? fs.readlinkSync(path.join(P, 'CLAUDE.md')) : 'file';
  } catch {}
  add('context', 'CLAUDE.md -> AGENTS.md', claudeLink === 'AGENTS.md' ? 'PASS' : claudeLink === 'file' && /^@AGENTS\.md\s*$/m.test(rd('CLAUDE.md') ?? '') ? 'WARN' : 'FAIL', claudeLink ?? 'absent');
  if (agents) {
    add('context', 'prometheus-base region', agents.includes('<!-- prometheus-base:start') && agents.includes('<!-- prometheus-base:end -->') ? 'PASS' : 'FAIL');
    const tail = agents.split('<!-- prometheus-base:end -->')[1] ?? '';
    add('context', 'project section after managed region', /^# /m.test(tail) ? 'PASS' : 'WARN', /^# /m.test(tail) ? '' : 'expected a project H1 below the managed region');
  }
  // 4 kbd
  const pj = rd('.kbd-orchestrator/project.json');
  if (!pj) add('kbd', 'project.json', 'FAIL');
  else {
    try {
      const j = JSON.parse(pj);
      add('kbd', 'project.json', 'PASS');
      add('kbd', 'no legacy active_phase', 'active_phase' in j ? 'FAIL' : 'PASS');
      add('kbd', 'relative focus path', j.focus_project_path && path.isAbsolute(j.focus_project_path) ? 'WARN' : 'PASS', j.focus_project_path ?? '');
    } catch {
      add('kbd', 'project.json', 'FAIL', 'invalid JSON');
    }
  }
  add('kbd', 'constraints.md', ex('.kbd-orchestrator/constraints.md') ? 'PASS' : 'FAIL');
  add('kbd', 'project identity .prometheus/project.json', ex('.prometheus/project.json') ? 'PASS' : 'WARN', ex('.prometheus/project.json') ? '' : 'run `prometheus kbd status`');
  // 5 tracking
  for (const rel of ['.kbd-orchestrator/project.json', '.kbd-orchestrator/constraints.md', '.prometheus/decisions.md', '.prometheus/session-log.md', '.prometheus/project.json']) {
    if (!ex(rel)) continue;
    if (!isRepo) {
      add('tracking', rel, 'SKIP', 'no git');
      continue;
    }
    add('tracking', `${rel} not ignored`, ignored(rel) ? 'FAIL' : 'PASS');
  }
  for (const rel of ['.prometheus/.writer.lock', '.agent-team/state.json']) if (isRepo && ex(rel)) add('tracking', `${rel} ignored`, ignored(rel) ? 'PASS' : 'WARN');
  // 6 prometheus layout
  for (const rel of ['.prometheus/session-log.md', '.prometheus/decisions.md', '.prometheus/gotchas.md', '.prometheus/postmortems', '.prometheus/knowledge', '.prometheus/model-fleet.md'])
    add('prometheus', rel, ex(rel) ? 'PASS' : 'FAIL');
  add('prometheus', 'hooks', ex('.claude/hooks') && fs.readdirSync(path.join(P, '.claude/hooks')).length ? 'PASS' : 'WARN');
  // 7 team
  const routing = rd('.agent-team/project-routing.json');
  if (!routing) add('team', 'project-routing.json', 'FAIL');
  else {
    const r = JSON.parse(routing);
    add('team', `active team ${r.activeTeam}`, ex(r.manifest) ? 'PASS' : 'FAIL', r.manifest);
    add('team', 'AGENTS.md routing block', agents?.includes('prometheus-team-routing:start') ? 'PASS' : 'FAIL');
    const nativeDir = {claude: '.claude/agents', codex: '.codex/agents', opencode: '.opencode/agents', kimi: '.kimi-code/agents', minimax: '.minimax/agents'};
    for (const t of fleet) {
      const k = t === 'minimax-code' ? 'minimax' : t;
      if (k === 'zed') {
        add('team', 'zed', agents ? 'PASS' : 'FAIL', 'via AGENTS.md');
        continue;
      }
      const d = nativeDir[k];
      if (d) add('team', `${k} native agents`, ex(d) && fs.readdirSync(path.join(P, d)).length ? 'PASS' : 'FAIL', d);
    }
  }
  // 8 UI (informational)
  if (ex('DESIGN.md') || ex('apps')) {
    for (const s of ['prometheus-ui-ux', 'impeccable', 'ui-ux-pro-max', 'design-taste-frontend'])
      add('ui', `${s} local`, ex(`.claude/skills/${s}/SKILL.md`) ? 'PASS' : 'WARN');
    add('ui', 'no duplicate taste-skill', ex('.claude/skills/taste-skill') ? 'WARN' : 'PASS');
  }
  // 9 docs site
  if (ex('website')) {
    add('docs-site', 'package-lock.json', ex('website/package-lock.json') ? 'PASS' : 'FAIL');
    add('docs-site', 'workflow', ex('.github/workflows/docs.yml') ? 'PASS' : 'WARN');
    add('docs-site', 'Dockerfile.dockerignore (not website/.dockerignore)', ex('website/.dockerignore') ? 'WARN' : 'PASS');
    const pkg = JSON.parse(rd('website/package.json') ?? '{}');
    add('docs-site', '@docusaurus overrides pinned', Object.keys(pkg.overrides ?? {}).some((k) => k.startsWith('@docusaurus/')) ? 'PASS' : 'WARN');
  }
  privacy();
}

const fails = results.filter((r) => r.status === 'FAIL').length;
if (asJson) console.log(JSON.stringify({project: P, results, fails}, null, 2));
else {
  for (const r of results) console.log(`${r.status.padEnd(5)} ${r.stage.padEnd(10)} ${r.check}${r.detail ? `  (${r.detail})` : ''}`);
  const count = (s) => results.filter((r) => r.status === s).length;
  console.log(`\nPASS ${count('PASS')}  FAIL ${fails}  WARN ${count('WARN')}  SKIP ${count('SKIP')}`);
}
process.exit(fails ? 1 : 0);
