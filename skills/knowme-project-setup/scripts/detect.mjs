#!/usr/bin/env node
// Inventory a project for knowme-project-setup. Read-only: never writes.
// Usage: node detect.mjs [project-dir]  → JSON on stdout
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const P = path.resolve(process.argv[2] ?? '.');
const exists = (rel) => fs.existsSync(path.join(P, rel));
const read = (rel) => {
  try {
    return fs.readFileSync(path.join(P, rel), 'utf8');
  } catch {
    return null;
  }
};

function sh(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, {cwd: P, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000, ...opts}).trim();
  } catch {
    return null;
  }
}

function walk(dir, depth, out = []) {
  if (depth < 0) return out;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return out;
  }
  for (const e of entries) {
    if (['node_modules', '.git', 'target', 'build', '.venv', 'dist'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, depth - 1, out);
    else out.push(path.relative(P, full));
  }
  return out;
}

// ---- git ----
const isRepo = sh('git', ['rev-parse', '--git-dir']) !== null;
const git = {
  repo: isRepo,
  branch: isRepo ? sh('git', ['branch', '--show-current']) : null,
  commits: isRepo ? Number(sh('git', ['rev-list', '--count', 'HEAD']) ?? 0) : 0,
  origin: isRepo ? sh('git', ['remote', 'get-url', 'origin']) : null,
  clean: isRepo ? sh('git', ['status', '--porcelain']) === '' : null,
};
let github = null;
const m = git.origin?.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
if (m) {
  const info = sh('gh', ['repo', 'view', `${m[1]}/${m[2]}`, '--json', 'visibility,homepageUrl,description']);
  github = {owner: m[1], repo: m[2], ...(info ? JSON.parse(info) : {visibility: 'UNKNOWN'})};
  github.pagesUrl = `https://${m[1].toLowerCase()}.github.io/${m[2]}/`;
}

// ---- files, stacks, type ----
const files = walk(P, 3);
const has = (re) => files.some((f) => re.test(f));
const stacks = [];
if (has(/(^|\/)Cargo\.toml$/)) stacks.push('rust');
if (has(/(^|\/)package\.json$/) && !files.every((f) => !/package\.json$/.test(f) || f.startsWith('website/'))) stacks.push('typescript');
if (has(/(^|\/)(pyproject\.toml|requirements\.txt|setup\.py)$/)) stacks.push('python');
if (has(/(^|\/)go\.mod$/)) stacks.push('go');
if (has(/(^|\/)pubspec\.yaml$/)) stacks.push('flutter');
if (has(/(^|\/)build\.gradle(\.kts)?$/)) stacks.push('jvm');
if (has(/\.(csproj|sln)$/)) stacks.push('dotnet');

const skillFiles = files.filter((f) => /(^|\/)SKILL\.md$/.test(f) && !/^\.(claude|agents|opencode|kimi-code|codex)\//.test(f));
const mdFiles = files.filter((f) => /\.(md|mdx)$/.test(f) && !f.startsWith('.'));
const processHints = has(/^(process|processes|sop|sops|runbooks|policies)\//) || has(/\.bpmn$/);
let type = 'research-docs';
if (stacks.length) type = 'code';
else if (skillFiles.length || exists('.claude-plugin') || exists('marketplace')) type = 'skill-development';
else if (processHints) type = 'business-process';

// Planned stacks named in docs (pre-implementation code projects).
const docText = ['README.md', 'docs/PLAYBOOK.md', 'AGENTS.md', 'CLAUDE.md'].map(read).filter(Boolean).join('\n');
const planned = [];
if (!stacks.includes('rust') && /\bCargo workspace|\bRust crate/i.test(docText)) planned.push('rust');
if (!stacks.includes('typescript') && /\b(TypeScript|React|Next\.js)\b/.test(docText)) planned.push('typescript');
if (!stacks.includes('python') && /\b(uv-managed Python|pyproject)\b/i.test(docText)) planned.push('python');
if (type === 'research-docs' && planned.length) type = 'code';

// ---- structure pieces ----
const agentsMd = read('AGENTS.md');
let claudeKind = 'absent';
try {
  const st = fs.lstatSync(path.join(P, 'CLAUDE.md'));
  claudeKind = st.isSymbolicLink() ? `symlink:${fs.readlinkSync(path.join(P, 'CLAUDE.md'))}` : 'file';
} catch {}
const kbdProject = read('.kbd-orchestrator/project.json');
let kbd = {present: !!kbdProject};
if (kbdProject) {
  try {
    const j = JSON.parse(kbdProject);
    kbd = {
      present: true,
      activePhase: j.activePhase ?? null,
      legacyAlias: 'active_phase' in j,
      absoluteFocusPath: typeof j.focus_project_path === 'string' && path.isAbsolute(j.focus_project_path),
      phases: exists('.kbd-orchestrator/phases') ? fs.readdirSync(path.join(P, '.kbd-orchestrator/phases')) : [],
    };
  } catch {
    kbd = {present: true, invalidJson: true};
  }
}
const v3 = agentsMd ? /Prometheus Base Rules/i.test(agentsMd) && (agentsMd.match(/\*\*[A-G]-\d+ ·/g) ?? []).length >= 5 : false;
const routing = read('.agent-team/project-routing.json');
const teams = exists('.agent-team') ? fs.readdirSync(path.join(P, '.agent-team')).filter((d) => exists(`.agent-team/${d}/team.json`)) : [];
const openspecVersion = sh('openspec', ['--version']);
const toolDirs = Object.fromEntries(
  [['claude', '.claude/skills/openspec-propose'], ['codex', '.agents/skills/openspec-propose'], ['opencode', '.opencode/skills/openspec-propose'], ['kimi', '.kimi-code/skills/openspec-propose']].map(([t, d]) => [t, exists(d)]),
);
const uiSignals = has(/\.(tsx|jsx|vue|svelte|dart|swift)$/) || /\b(MCP App|ui:\/\/|operator panel|dashboard|review card)\b/i.test(docText);
const privateCandidates = ['docs/sessions', 'sessions', 'transcripts', 'notes/private', 'private'].filter(exists);

// ---- dependency skills ----
function findSkill(name) {
  const home = os.homedir();
  const direct = [path.join(home, '.claude/skills', name), path.join(home, '.agents/skills', name)];
  for (const d of direct) if (fs.existsSync(path.join(d, 'SKILL.md'))) return fs.realpathSync(d);
  const cache = path.join(home, '.claude/plugins/cache');
  const hits = [];
  const scan = (dir, depth) => {
    if (depth < 0) return;
    let es = [];
    try {
      es = fs.readdirSync(dir, {withFileTypes: true});
    } catch {
      return;
    }
    for (const e of es) {
      if (!e.isDirectory()) continue;
      const full = path.join(dir, e.name);
      if (e.name === name && fs.existsSync(path.join(full, 'SKILL.md'))) hits.push(full);
      else scan(full, depth - 1);
    }
  };
  scan(cache, 5);
  return hits.sort().at(-1) ?? null;
}
const deps = Object.fromEntries(
  ['kbd-init', 'kbd-status', 'prometheus-context-bootstrap', 'agent-team-creator', 'build-branded-docusaurus', 'prometheus-ui-ux', 'impeccable', 'teach-impeccable', 'create-mcp-app'].map((s) => [s, findSkill(s)]),
);
const tools = Object.fromEntries(['git', 'node', 'openspec', 'gh', 'prometheus', 'jq', 'python3'].map((t) => [t, sh('which', [t]) !== null]));

const mode = !git.repo || (git.commits === 0 && files.filter((f) => !f.startsWith('.')).length <= 3) ? 'greenfield' : 'brownfield';

console.log(
  JSON.stringify(
    {
      project: P,
      mode,
      type,
      stacks,
      plannedStacks: planned,
      git,
      github,
      structure: {
        openspec: {present: exists('openspec/config.yaml'), cliVersion: openspecVersion, tools: toolDirs},
        agentsMd: {present: !!agentsMd, managedRegion: agentsMd?.includes('<!-- prometheus-base:start') ?? false, baseRulesV3: v3, teamRouting: agentsMd?.includes('prometheus-team-routing:start') ?? false},
        claudeMd: claudeKind,
        kbd,
        prometheus: {present: exists('.prometheus'), identity: exists('.prometheus/project.json'), modelFleet: exists('.prometheus/model-fleet.md')},
        agentTeam: {routing: !!routing, teams, activeTeam: routing ? JSON.parse(routing).activeTeam : null},
        docsSite: {website: exists('website/docusaurus.config.mjs') || exists('website/docusaurus.config.js'), workflow: exists('.github/workflows/docs.yml')},
        productMd: exists('PRODUCT.md'),
        designMd: exists('DESIGN.md'),
      },
      signals: {ui: uiSignals, markdownFiles: mdFiles.length, skillFiles: skillFiles.length, privateCandidates},
      deps,
      tools,
    },
    null,
    2,
  ),
);
