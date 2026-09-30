# Stage contracts

Every stage follows the same shape: **check → act → verify → report** (`CREATE`, `UPDATE`, `SKIP` or `BLOCKED`, with a reason). `<P>` is the project directory, `<S>` is this skill's directory, `<fleet>` is the harness list, and `<stacks>` comes from `detect.mjs`.

---

## 1. Git

**Why:** everything below records state in files, and git is what shares and versions that state. KBD worktrees and Codex parallel tasks need a repository.

| Check | Act |
|---|---|
| `git -C <P> rev-parse --git-dir` fails | `git -C <P> init -b main` |
| Current branch isn't `main` and has no upstream | `git -C <P> branch -M main` |
| A remote was given and no `origin` exists | `git -C <P> remote add origin <url>` |
| `origin` exists with a different URL | Report it and don't change it |

**Verify:** `git branch --show-current` returns `main`, and `git remote -v` shows the expected origin.

## 2. OpenSpec

**Why:** spec-driven change proposals (`openspec/changes/`) plus the `/opsx:*` or `openspec-*` skills in every harness, so any agent can propose, apply, verify and archive a change the same way.

- Greenfield: `openspec init --tools <fleet-csv> --no-animation <P>`
- Brownfield: `openspec update <P>` (add `--force` only when the operator asks), then `openspec init --tools <missing> <P>` for tools not yet configured.
- Tool IDs: `codex, claude, opencode, kimi, zed, minimax-code` (full list: `openspec init --help`).

**Harness notes:**
- Codex, Zed and `agents` share `.agents/skills` (one tree).
- Kimi and MiniMax get skills but no slash commands.
- MiniMax skills go to `~/.minimax/skills`, which is **global**. Say so.

**Verify:**
- `openspec/config.yaml` exists.
- The expected skill trees exist: `.claude/skills/openspec-*`, `.agents/skills/openspec-*`, `.opencode/skills/`, `.kimi-code/skills/`.
- **Optional:** add a `context:` block to `openspec/config.yaml` describing the stack or domain.

## 3. Project context (the `/init` step)

**Why:** a resident file that tells every agent what the project is and what must never break. It gets read every turn, so it must stay short.

**Sources, in order:** `README.md`, `docs/README.md`, the playbook or spec, research, existing `AGENTS.md` or `CLAUDE.md`. If the user supplied docs, read all of them.

**Sections:** Status · What this is · Architecture (code) or Process map (business) or Skill map (skill-dev) · Invariants and non-negotiables · Commands or validators · Workflow · Docs reading order · Privacy notes.

**Rules:**
- Point to the source-of-truth doc instead of copying it.
- No generic advice.
- For code projects that don't exist yet, say "pre-implementation" and name the milestone where code starts.
- Brownfield: merge, and keep operator prose.

Written first to `CLAUDE.md` if nothing exists. Stage 6 moves it into `AGENTS.md`.

## 4. KBD

**Why:** a phase → change → task lifecycle, with waypoints and progress ledgers that survive tool switches (Claude to Codex to OpenCode) and compaction.

0. Use the current skill pack. Run `export KBD_ORCHESTRATOR_ROOT=$HOME/.prometheus/plugins/prometheus-skill-pack/current/skills/kbd-process-orchestrator`, check that `shared/lib/{hooks,stage-gate,waypoint}.sh` exist, and compare the active generation with the skill-pack `origin/main`. Upgrade from a clean `origin/main` worktree with `./install.sh --profile skills --targets detected --non-interactive --yes`, then `--verify`. Never fall back to cached plugin versions.
1. Run `/kbd-init`. It discovers the name, stack and commands, and writes `.kbd-orchestrator/project.json` and `constraints.md`. Run its validator: `node <kbd-init>/scripts/kbd-init-validate.mjs <P>`.
2. `prometheus kbd migrate --check`. If it reports `journalMigrationRequired`, progress files or alias conflicts, run `prometheus kbd migrate --apply` (backups go where the tool reports).
3. `prometheus kbd status` initializes or reads the canonical runtime and writes `.prometheus/project.json` (`projectId` plus `repositoryFingerprint`). **Track that file.**
4. Normalize `project.json`:
   - `focus_project_path` and `workspace.folders[focus].path` set to `"."`;
   - remove the legacy `active_phase`;
   - `preferred_*` set to the fleet;
   - `agents_config` has an entry per harness.
5. Commands per project type: see `project-types.md`. For code that doesn't exist yet, keep the real commands and note in `constraints.md` that they are "N/A until <milestone>".
6. Constraints come from the project's invariants: blocking rules, warning rules, path ownership (tool config directories are **repo-owned, not disposable**), and workflow triggers. Only add the `git commit` trigger once a repo exists.

**Verify:** the validator passes, `/kbd-status` renders, and `.prometheus/project.json` exists.

## 5. Tracking policy (`.gitignore`)

**Why:** KBD state and the knowledge log are project history, so they must be committed. Locks, local ledgers and private content must not be.

`node <S>/scripts/gitignore.mjs <P> --stacks <csv> --private <csv> [--check]`

- Keeps a managed block between `# >>> knowme-project-setup >>>` and `# <<< knowme-project-setup <<<`.
- Writes stack ignores (`target/`, `node_modules/`, `.venv/`, `build/`, …).
- Writes secrets ignores (`.env*` except `.env.example`, `*.pem`, `*.key`, Ed25519 keys).
- Ignores `.kbd-orchestrator/worktrees/`, `.prometheus/.writer.lock`, `.prometheus/.review-pending`, `.claude/settings.json.bak.*`, `.claude/settings.local.json`, `.agent-team/state.json` and `.agent-team/recovery/`.
- Ignores the private paths.
- **Reports** outside lines that would ignore `.kbd-orchestrator/` or `.prometheus/` (or their files). `--fix` removes exactly those lines.
- Adds `.gitkeep` to `.prometheus/postmortems/` and `.prometheus/knowledge/`.

**Verify:** `git check-ignore .kbd-orchestrator/project.json .prometheus/decisions.md` prints nothing.

## 6. Prometheus context bootstrap

**Why:** invariants must survive compaction. `AGENTS.md` is one resident constitution, path-scoped rules load only when relevant, and hooks enforce what prose can't. The resulting `.prometheus/` holds `session-log`, `decisions`, `gotchas`, `postmortems/`, `knowledge/` and `model-fleet.md`.

```bash
B=<prometheus-context-bootstrap>
bash $B/scripts/migrate.sh --path <P>            # report; --apply only if v3 is detected
bash $B/scripts/bootstrap.sh --path <P> --stacks <csv> --dry-run
bash $B/scripts/bootstrap.sh --path <P> --stacks <csv>   # --profile mixed (default) for a mixed fleet
bash $B/scripts/verify.sh --path <P>
```

- `--stacks` takes `rust`, `typescript`, `flutter`, `go` or `python`. Use none for business-process or docs projects.
- Profile: **mixed** whenever any non-frontier model reads the repo (Kimi, MiniMax, local). Use `lean` only with a measured entry in `.prometheus/model-fleet.md`.

**Then consolidate (required):**

1. Copy the current `CLAUDE.md` to `.prometheus/knowledge/CLAUDE.pre-agents-<date>.md`.
2. Append the project section to `AGENTS.md`, **after** `<!-- prometheus-base:end -->` and any tool-owned regions.
3. Run `rm CLAUDE.md && ln -s AGENTS.md CLAUDE.md`.
4. Move stack-specific detail (pins, lints, test tooling, smallest integration gate) into `.claude/rules/<stack>.md`, replacing the placeholder comment.
5. Re-run `verify.sh`. Expect `CLAUDE.md symlink -> AGENTS.md` and no FAIL. WARN on the machine-wide skill budget is expected; report it.

**Watch for:** bootstrap installs a broad UI skill catalog (Android, Expo, Flutter, SwiftUI) into `.claude/skills` and `.agents/skills`. Keep what the project uses; offer to remove the rest.

## 7. Agent team

**Why:** named roles with disjoint ownership, bound skills and a dependency order, installed natively so each harness can delegate, or follow the roles sequentially where it can't.

```bash
C=<agent-team-creator>/scripts/cli.mjs
node $C guide    --input intake.json          # optional; expert path writes the manifest directly
node $C validate --input team-request.json
node $C init     --input team-request.json    # state: .agent-team/state.json (ignored)
for t in claude codex opencode kimi minimax; do
  node $C export --input exp-$t.json          # staged proposal in a scratch dir; inspect it
done
node $C install-project --input install.json --dry-run
node $C install-project --input install.json  # team + target claude + minimaxDataDirectory ".minimax"
for t in codex opencode kimi minimax; do node $C install-project --input inst-$t.json; done
node $C install-project --input inst-claude.json   # restore recorded default target
node $C install-project --project <P> --check      # exit 0
```

**Manifest rules:**
- Role IDs are kebab-case.
- `owns` are disjoint globs.
- Reviewers own only a findings folder (for example `docs/reviews/**`).
- `dependsOn` has no cycles.
- `skills` lists only **installed** skills; check each one exists.
- Every role prompt starts with the shared preamble from `team-archetypes.md`.

**Harness facts:**
- `install-project` takes one target per run, and the last run is recorded as the default.
- Zed gets the routing block through `AGENTS.md`.
- MiniMax agents go in `<P>/.minimax/agents`; launch with `MINIMAX_DATA_DIR=.minimax`.
- Kimi ignores per-role model frontmatter.

**Verify:**
- `.agent-team/project-routing.json` exists.
- `AGENTS.md` contains the `prometheus-team-routing` block.
- Native definitions exist under `.claude/agents`, `.codex/agents`, `.opencode/agents`, `.kimi-code/agents` and `.minimax/agents`.

## 8. UI and design tools (only when there's a UI)

**Why:** design authority and a repeatable craft workflow for any rendered surface: app UI, MCP Apps, operator panels, docs sites.

- **Required skills:** `prometheus-ui-ux`, `prometheus-impeccable-core`, `prometheus-ui-review`, `impeccable`, `teach-impeccable`, `ui-ux-pro-max`, `design-taste-frontend`, `gpt-taste`, `web-design-guidelines`, plus the `vercel-react-best-practices` and `vercel-composition-patterns` skills when React is used, plus the MCP App skills (`create-mcp-app`, `add-app-to-server`) and `htmx-alpine-lit` when relevant.
- For each missing skill: `src=$(readlink -f ~/.claude/skills/<s>)`, then `cp -RL "$src"` into `<P>/.claude/skills/<s>` and `<P>/.agents/skills/<s>`.
- **Don't copy `taste-skill`.** It is another copy of `design-taste-frontend` under the same name.
- Kimi: create relative symlinks from `.kimi-code/skills/<s>` to `../../.agents/skills/<s>`.
- `PRODUCT.md` holds users, journeys, catalogs and principles, taken from the docs. `DESIGN.md` holds incumbent tokens copied from real brand sources, surface mode, semantic colors, platform constraints and open questions.
- **MCP App constraints** (when there's an MCP App):
  - built as a single-file bundle;
  - host theme and variables first, brand tokens only as fallback;
  - empty CSP by default when sensitive data is shown;
  - works in inline and fullscreen modes;
  - falls back to text for hosts without MCP App support;
  - actions go through tools the app alone can see, never direct writes;
  - WCAG 2.2 AA.
- Follow-up for the user: `/teach-impeccable` writes `.impeccable.md` and only the user can start it.

## 9. Docs site

**Why:** a public or internal site built from the same docs the agents read, in the organization's brand, without leaking private material.

1. Classify every doc source as public, public-normalize, private-synthesis-only or excluded. Write `website/content-sources.json` (template in `assets/docs-site/`).
2. Scaffold: `node <build-branded-docusaurus>/scripts/scaffold.mjs website "<Site Name>" "https://<owner-lc>.github.io" "/<repo>/"`.
3. Remove the starter content (`blog/`, `docs/`, `src/components/`, starter images, `README.md`).
4. Copy in the kit from `assets/docs-site/`:
   - `sync-docs.mjs` and `sanitize.mjs` into `website/scripts/`;
   - `content-sources.example.json` as `website/content-sources.json`, filled in. Use `dest` for renamed pages, `linkRewrites` for repo paths that change on the site, and `static` for standalone files. Sources with their own YAML frontmatter (such as `SKILL.md`) get it replaced when the entry supplies `frontmatter`;
   - `sidebars.js`, **replacing the scaffold's**: the config expects the sidebar ID `docs`;
   - `docusaurus.config.template.mjs` as `docusaurus.config.mjs`, with every `__PLACEHOLDER__` filled in;
   - `index.template.js` as `src/pages/index.js`, plus `index.module.css`. Rewrite the copy. Status colors are for statuses only; use the `.mode` class for neutral labels;
   - `brand-knowme.css` as `src/css/custom.css`, or a stylesheet from another brand source;
   - `docs.yml` into `.github/workflows/`: one `paths:` line per public source instead of `__SOURCE_PATH__`;
   - `Dockerfile` and `Dockerfile.dockerignore` into `website/`: one `!` line per public source instead of `__PUBLIC_SOURCE__`.
   Set the package scripts: `sync`, `start` = sync + `docusaurus start`, `build` = sync + `scripts/build.mjs`, `sanitize` = sync + sanitize. Add `/docs` to `website/.gitignore`.
5. Branding:
   - tokens from the brand standard, mapped onto the `--ifm-*` variables;
   - Flat 2.0 (no borders, rules or shadows; visible focus);
   - logo and favicon from brand SVGs;
   - fonts;
   - a deeper accent shade for link text, to keep 4.5:1 contrast.
6. Pin the dependencies. After `npm install`, **add `overrides` pinning every `@docusaurus/*` package that resolved to a different version** (check with `find node_modules/@docusaurus -maxdepth 2 -name package.json | xargs grep version`). Mixed versions break Mermaid during server-side rendering.
7. Gitignore `website/docs` and `website/static/<generated>`, because they're generated by the sync.
8. Verify: `node <build-branded-docusaurus>/scripts/verify.mjs website`. That gate also rejects any `.prometheus/` text, so projects whose docs describe the structure fail it by design (lesson 26). The authoritative output check is: `grep -rlE '/Users/[A-Za-z0-9._-]+/|/home/[A-Za-z0-9._-]+/|BEGIN [A-Z ]*PRIVATE KEY' website/build` prints nothing, and no private-path content appears.

## 10. GitHub settings (confirm first)

- `gh repo view <o>/<r> --json visibility,homepageUrl,defaultBranchRef`.
- `gh api -X POST repos/<o>/<r>/pages -f build_type=workflow` (a 409 means Pages already exists; switch it with `PUT` if the build type differs).
- `gh repo edit <o>/<r> --homepage https://<owner-lc>.github.io/<repo>/`, plus `--description` if the repo has none.

## 11. Commit and push (confirm first)

1. `node <S>/scripts/verify.mjs <P> --privacy`: no private paths staged, no `/Users/<name>/` in tracked config, no key material.
2. `git add -A`. Review the staged counts by top-level directory.
3. Commit with a conventional message and the attribution trailer if required, then `git push -u origin main`.
4. `gh run list --workflow docs.yml -L1`. If there's no run within about two minutes, `gh workflow run docs.yml --ref main`, then `gh run watch <id> --exit-status`.
5. Check the live routes with `curl -o /dev/null -w '%{http_code}'`, including a 404 for a private path.
