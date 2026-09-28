# know-me-project-management

**A repeatable way to set up any project in the KnowMe working structure**, whether it's code, a business process, skill development, or research and docs. It works from scratch (greenfield) or converts an existing repository (brownfield).

The work is packaged as one AgentSkills.io-compliant skill, [`skills/knowme-project-setup`](skills/knowme-project-setup/SKILL.md). This README records **every step that was taken** when the structure was first built, for [`know-me-decision`](https://github.com/Know-Me-Tools/know-me-decision) on 2026-09-28. For each step it explains what the step is for and which parts must change for other projects.

---

## What you end up with

| Piece | Where | Why |
|---|---|---|
| One instruction file for every agent | `AGENTS.md` (`CLAUDE.md` is a symlink to it) | Every harness reads the same invariants, commands and workflow |
| Spec-driven change workflow | `openspec/`, plus OpenSpec skills and commands per harness | Any agent proposes, applies, verifies and archives changes the same way |
| Orchestration state | `.kbd-orchestrator/` (**tracked**) | Phase, change and task lifecycle that survives tool switches and compaction |
| Knowledge log and project identity | `.prometheus/` (**tracked**) | Decisions, gotchas, postmortems, session log, model fleet, KBD project ID |
| Enforcement | `.claude/hooks/`, `.claude/settings.json`, `.claude/rules/<stack>.md` | Rules that prose can't enforce; stack rules load only when relevant |
| Agent team | `.agent-team/`, plus native agents in `.claude/`, `.codex/`, `.opencode/`, `.kimi-code/` and `.minimax/` | Named roles with disjoint ownership, bound skills and a dependency order |
| Product and design authority | `PRODUCT.md`, `DESIGN.md`, local UI skills | Evidence-based intent and design tokens for every rendered surface |
| Docs site | `website/` plus `.github/workflows/docs.yml`, published to GitHub Pages | Branded public docs built from the same sources the agents read |

## Install the skill

```bash
# Claude Code (user scope) and the shared agents tree used by Codex, Zed and OpenCode
ln -s "$PWD/skills/knowme-project-setup" ~/.claude/skills/knowme-project-setup
ln -s "$PWD/skills/knowme-project-setup" ~/.agents/skills/knowme-project-setup
# or as a Claude Code plugin marketplace:
claude plugin marketplace add Know-Me-Tools/know-me-project-management
```

Then, in the target project, say "set up this project with knowme-project-setup" (or `/knowme-project-setup`). The skill detects greenfield or brownfield and the project type, states its plan, and runs the stages. Its tools:

```bash
node skills/knowme-project-setup/scripts/detect.mjs <project>                 # inventory (read-only JSON)
node skills/knowme-project-setup/scripts/gitignore.mjs <project> --stacks rust --private docs/sessions
node skills/knowme-project-setup/scripts/verify.mjs <project>                 # PASS/FAIL/WARN/SKIP table
node skills/knowme-project-setup/scripts/verify.mjs <project> --privacy       # before any push
```

**Prerequisites:**
- git, Node.js 22+, and the `openspec` CLI;
- `gh` for the GitHub stages;
- the `prometheus` CLI for KBD migration;
- the skills `kbd-init`, `kbd-status`, `prometheus-context-bootstrap`, `agent-team-creator` and `build-branded-docusaurus`.

`detect.mjs` reports which dependency skills it can resolve.

---

## Parameters

These are the variable parts. Every step below says which of them it uses.

| Parameter | know-me-decision value | What it is for other projects |
|---|---|---|
| `PROJECT_DIR` | `…/know-me-decision` | The target directory |
| `MODE` | greenfield (design docs only, no git) | `greenfield` or `brownfield`, auto-detected |
| `PROJECT_TYPE` | `code` (pre-implementation Rust) | `code`, `business-process`, `skill-development` or `research-docs`. Drives commands, stacks, team and validators ([project-types](skills/knowme-project-setup/references/project-types.md)) |
| `FLEET` | codex, claude, opencode, kimi, zed, minimax-code | The harnesses your team uses. `openspec init --help` lists the IDs |
| `STACKS` | `rust,python` (planned) | Detected stacks; empty for non-code projects |
| `SOURCE_DOCS` | `README.md`, `docs/**` | Wherever the project's intent lives |
| `SOURCE_OF_TRUTH` | `docs/PLAYBOOK.md` | The doc that wins in a conflict: spec, handbook, roadmap |
| `INVARIANTS` | I-1…I-10 | The project's non-negotiables. For a process: controls; for skills: spec compliance |
| `REMOTE` | `git@github.com:Know-Me-Tools/know-me-decision.git` | Any git remote, or none |
| `VISIBILITY` | public | Read from GitHub; unknown is treated as public |
| `PRIVATE_PATHS` | `docs/sessions/` | Transcripts, personal notes, customer data |
| `BRAND_SOURCE` | `…/know-me-system` (`docs/knowme-ui-ux-standard.md`, `desktop/branding/app-icon-source.svg`) | The brand standard and logo for the organization |
| `SITE_URL` / `BASE_URL` | `https://know-me-tools.github.io` / `/know-me-decision/` | `https://<owner-lowercase>.github.io` / `/<repo>/` |
| `TEAM_ID` and roles | `decide-team`, 8 roles | Archetype per project type ([team-archetypes](skills/knowme-project-setup/references/team-archetypes.md)) |
| `UI_SCOPE` | MCP App review card plus operator panel | Any rendered surface; none skips stage 8 |
| `BOOTSTRAP_PROFILE` | `mixed` | `mixed` whenever a non-frontier model reads the repo; `lean` only after measurement |

---

## Every step that was taken

The steps are in the order they ran. **Stage** is the skill stage that now performs the step; the skill reorders a few steps so git exists before anything depends on it.

### 1. `openspec init` for the whole fleet (stage 2)

```bash
openspec init --tools codex,claude,opencode,kimi,zed,minimax-code --no-animation
```

- **Purpose:** install the OpenSpec change workflow (propose, apply, verify, archive, and so on) as skills and commands in every harness, and create `openspec/config.yaml`.
- **What happened:**
  - 12 skills per tool.
  - Claude and OpenCode also got slash commands (`/opsx:*`, `/opsx-*`).
  - Codex and Zed share `.agents/skills`.
  - Kimi and MiniMax got skills only.
  - **MiniMax skills went to `~/.minimax/skills`, which is global.**
- **Parameters:** `FLEET`. Brownfield uses `openspec update`, then `init` only for missing tools. Optionally add a `context:` block to `openspec/config.yaml` describing the stack or domain.

### 2. `/init`: project context file (stage 3)

- **Purpose:** a resident file that tells future agents what the project is, the architecture or process, the invariants, the commands and the workflow, without repeating the docs.
- **What happened:**
  - Read `README.md`, `docs/README.md` and the full `docs/PLAYBOOK.md`.
  - Wrote `CLAUDE.md`: status (pre-implementation, starting at M0), what it is, the cascade architecture, feature profiles, invariants I-1…I-10, toolchain conventions, workflow and docs reading order.
  - Flagged `docs/sessions/` as private.
  - A Codex config existed, so the user was pointed to `/import` instead of reading foreign configs.
- **Parameters:** `SOURCE_DOCS`, `SOURCE_OF_TRUTH`, `INVARIANTS`, `PROJECT_TYPE` (Architecture for code, Process map for business, Skill map for skill development).

### 3. `/kbd-init`: orchestration config (stage 4)

- **Purpose:** discover the project identity and stack, and write `.kbd-orchestrator/project.json` (commands, spec paths, agent preferences, workspace) and `constraints.md` (blocking and warning rules, path ownership, workflow triggers).
- **What happened:**
  - No `.code-workspace` included the repo, so single-project mode.
  - Commands set to `cargo check/test/clippy/deny`, plus a `core-wasm` check, `xtask spec-lint` and `xtask conformance`.
  - Constraints derived from the playbook invariants.
  - The tool config directories were marked **repo-owned**.
  - The auto-commit trigger was left out because there was no git yet.
  - The validator reported the configuration valid and the prerequisites ready.
- **Parameters:** `PROJECT_TYPE` (commands differ completely: markdownlint and link checks for processes and docs, `prometheus validate` and evals for skills), `STACKS`, `INVARIANTS`, `FLEET` (`preferred_*` and `agents_config`). Pre-implementation projects mark commands "N/A until <milestone>".

### 4. `/kbd-status`: confirm the setup (stage 4)

- **Purpose:** confirm KBD reads its own state and show the next action.
- **What happened:** no phase yet, and the worktree line showed "not a git checkout". The next action was `/kbd-new-phase m0-bootstrap`.
- **Parameters:** none.

### 5. `git init` (stage 1)

- **Purpose:** version everything. KBD worktrees and Codex parallel tasks need a repository.
- **Parameters:** none. Brownfield keeps the existing history.

### 6. `.gitignore`, `git branch -M main`, `git remote add origin` (stages 1 and 5)

```bash
git branch -M main
git remote add origin git@github.com:Know-Me-Tools/know-me-decision.git
```

- **Purpose:**
  - ignore build output, weights, fuzz corpora, Python virtual environments, secrets and keys (including Ed25519 signing keys), editor noise, `.claude/settings.local.json` and KBD worktrees;
  - standardize the branch name;
  - connect GitHub.
- **Parameters:** `STACKS` (the ignore fragments), `REMOTE`, `PRIVATE_PATHS`. The skill manages a marked block with `scripts/gitignore.mjs` instead of hand-editing.

### 7. `/prometheus-context-bootstrap` (stage 6)

```bash
bash migrate.sh --path .                                        # "Nothing to migrate" (no Base Rules v3)
bash bootstrap.sh --path . --stacks rust,python --dry-run
bash bootstrap.sh --path . --stacks rust,python                 # profile: mixed
bash verify.sh --path .
```

- **Purpose:** keep invariants in context across compaction:
  - `AGENTS.md`, with a managed `prometheus-base` region;
  - path-scoped `.claude/rules/rust.md` and `python.md`;
  - hooks: `tier-guard`, `single-writer`, `sycophancy-gate` and `reanchor`;
  - the `artifact-critic` subagent;
  - `.claude/settings.json` (skill budget and hook wiring);
  - `.prometheus/` (`session-log`, `decisions`, `gotchas`, `postmortems/`, `knowledge/`, `model-fleet.md`);
  - the KBD waypoint and `versions.toml`.
- **Why mixed:** Kimi and MiniMax read the same files as Claude, so the execution scaffold stays in.
- **What happened:**
  - `verify.sh` failed *combined resident*, because `CLAUDE.md` imported `AGENTS.md` and also held about 1,000 words.
  - It also installed about 40 UI skills (Android, Expo, Flutter, SwiftUI).
  - It warned about the machine-wide skill-listing budget (58 times over).
- **Parameters:** `STACKS` (none for non-code), `BOOTSTRAP_PROFILE`. Brownfield with Base Rules v3: `migrate.sh --apply` first.

### 8. Consolidate into `AGENTS.md` (stage 6)

```bash
cp CLAUDE.md .prometheus/knowledge/CLAUDE.pre-agents-<date>.md
# append the condensed project section after <!-- prometheus-base:end --> and tool-owned regions
rm CLAUDE.md && ln -s AGENTS.md CLAUDE.md
# move toolchain, pins, lints and test tooling into .claude/rules/rust.md
```

- **Purpose:**
  - Codex, OpenCode, Kimi, MiniMax and Zed read `AGENTS.md`, not `CLAUDE.md`, so the project context has to live there.
  - The symlink removes the double load.
  - Stack detail moves to a rule that loads only when a matching file is opened.
- **Result:** `verify.sh` gave 11 PASS, 0 FAIL, and 2 machine-wide WARN.
- **Parameters:** the project section's content (from step 2); the stack rules file per stack.

### 9. `/agent-team-creator`: the team, the UI tooling, product and design authority (stages 7 and 8)

- **Purpose:** a team that covers product management, architecture, building, specs and safety, UI/UX with MCP App work, developer support for future decision agents, and independent review. Installed natively for each harness.

**Research:**
- Read the playbook milestones M1–M10, models, data, evals, security and release sections.
- Read the architecture report: the MCP tool surface, the `ui://decide/review-card` MCP App, and the four-plugin/14-skill marketplace.
- Read both research docs.

**Local UI tools:**
- Resolved the user-level symlinks and ran `cp -RL` for `impeccable`, `teach-impeccable`, `create-mcp-app`, `add-app-to-server` and `htmx-alpine-lit`, into `.claude/skills` and `.agents/skills`.
- Linked `.kimi-code/skills/*` to `../../.agents/skills/*`.
- Skipped `taste-skill`, a duplicate of `design-taste-frontend` under the same name.

**Evidence files:**
- `PRODUCT.md`: personas, catalogs and principles from the docs.
- `DESIGN.md`: tokens copied from the report, Operate mode, colors per outcome, MCP App constraints, open questions.

**Manifest:** 8 roles with disjoint `owns`:
- product-manager
- decision-architect
- runtime-engineer
- model-engineer
- spec-safety-author
- ui-ux-designer
- marketplace-integrator
- reviewer (read-only; owns `docs/reviews/**`)

**MCP App rules** written into the designer, runtime and reviewer prompts:
- `@modelcontextprotocol/ext-apps`, single-file bundle;
- host theme first, empty CSP;
- `record_override` through a tool only the app can see;
- `Escalate` can't be dismissed;
- a text fallback for hosts without MCP App support;
- WCAG 2.2 AA;
- the stack choice goes to an ADR first.

**Commands:**

```bash
node cli.mjs validate --input team-request.json
node cli.mjs init --input team-request.json                  # .agent-team/state.json
node cli.mjs export --input exp-<target>.json                # claude codex opencode kimi minimax → scratch, inspected
node cli.mjs install-project --input install.json            # team + claude + minimaxDataDirectory ".minimax"
node cli.mjs install-project --input inst-<target>.json      # codex opencode kimi minimax
node cli.mjs install-project --input inst-claude.json        # restore the recorded default
node cli.mjs install-project --project . --check             # exit 0
```

`.agent-team/state.json` and `recovery/` are gitignored.

**Parameters:**
- `TEAM_ID`, and the roles from the `PROJECT_TYPE` archetype;
- `owns` paths from the planned layout;
- skills: only installed ones;
- `UI_SCOPE`, which decides whether the UI tools and the designer's MCP App rules apply;
- `FLEET`, which decides the install targets. Zed is covered by `AGENTS.md`.

**Follow-ups for the user:** run `/teach-impeccable`, choose model IDs per role, launch MiniMax with `MINIMAX_DATA_DIR=.minimax`, and restart harnesses.

### 10. `/build-branded-docusaurus` (stage 9)

- **Purpose:** a KnowMe-branded site built from the repo's docs, with private material excluded.

**Brand:**
- `know-me-system/docs/knowme-ui-ux-standard.md`: the token tables, Flat 2.0, the type pairing (Space Grotesk, Inter, Roboto, JetBrains Mono), and the wordmark rules.
- The K monogram SVG from `desktop/branding`.

**Classification:**
- `PLAYBOOK.md` and `research/`: public-normalize.
- `architecture/`: public, served as static files.
- `docs/README.md`: private-synthesis-only, because it indexes sessions.
- `docs/sessions/`: excluded.

**Build:**
- `scaffold.mjs website "KnowMe Decision" https://know-me-tools.github.io /know-me-decision/`, which pins Docusaurus 3.10.1, Mermaid and local search.
- Removed the starter content.
- Wrote:
  - `sync-docs.mjs` (copies public sources and rewrites links; fails on links into excluded content);
  - the sanitizer;
  - hand-written `content/index.md` (overview with a Mermaid cascade) and `content/architecture.md`;
  - the branded `custom.css` (Flat 2.0, a darker accent for 4.5:1 link contrast);
  - the home page;
  - the config (`markdown.format: 'detect'`, `indexBlog: false`).

**Fixes needed:**
- rewrite the `../PLAYBOOK.md` link;
- add `overrides` pinning `@docusaurus/theme-common` and `plugin-content-docs` to 3.10.1, because a mixed 3.10.2 copy broke Mermaid server-side rendering;
- move the dockerignore to `website/Dockerfile.dockerignore`.

**Delivery:** `.github/workflows/docs.yml` (actions pinned by SHA, private-material scan of the output, Pages deploy), plus a non-root nginx container.

**Parameters:** `BRAND_SOURCE`, `SITE_URL`/`BASE_URL`, the content classification, `PRIVATE_PATHS`, site name and tagline, navigation items.

### 11. GitHub About link and Pages (stage 10)

```bash
gh repo edit Know-Me-Tools/know-me-decision --homepage "https://know-me-tools.github.io/know-me-decision/"
gh api -X POST repos/Know-Me-Tools/know-me-decision/pages -f build_type=workflow
```

- **Purpose:** link the site from the repo page, and let the workflow publish.
- **Parameters:** `REMOTE` (owner and repo), `SITE_URL`/`BASE_URL`. These act outside the repo, so they need confirmation.

### 12. First commit and push (stage 11)

- **Purpose:** publish the structure. `docs/sessions/` was added to `.gitignore` **before** the first commit, because the repo is public.
- **What happened:**
  - A scan for home paths, keys and tokens.
  - Commit `986510f` with 1,161 files, then `git push -u origin main`.
  - The push didn't start the workflow, so `gh workflow run docs.yml --ref main` did. Both build and deploy succeeded.
  - Live routes returned 200, and the transcript URL returned 404.
- **Parameters:** `PRIVATE_PATHS`, `VISIBILITY`, the commit message and attribution policy.

### 13. Track KBD state and knowledge logs (stages 4 and 5)

- **Purpose:** `.kbd-orchestrator/` and `.prometheus/` are project history, so the KBD phases, waypoints, decisions and gotchas must be shared.
- **What happened:**
  - Stopped ignoring `.prometheus/recovery/`.
  - Added `.gitkeep` to `.prometheus/postmortems/` and `knowledge/`.
  - Made `focus_project_path` relative (`.`), then re-validated.
  - `prometheus kbd migrate --check` found nothing to migrate.
  - `prometheus kbd status` created `.prometheus/project.json` (project identity), which is now tracked.
  - Runtime locks (`.writer.lock`, `.review-pending`) and `.kbd-orchestrator/worktrees/` stay ignored.
  - Commit `4b04483`, pushed.
- **Parameters:** none. This policy is the same for every project.

### 14. Capture as a reusable skill (this repository)

- **Purpose:** repeat all of the above for any project.
- **What happened:**
  - Packaged as `skills/knowme-project-setup`: the stage contracts, brownfield rules, project types, team archetypes, privacy rules and lessons, plus `detect`, `gitignore` and `verify` scripts and templates.
  - Validated against the AgentSkills.io spec.
  - The scripts were run read-only against `know-me-decision` (52 PASS, 0 FAIL).

---

## Greenfield and brownfield in one table

| Stage | Greenfield | Brownfield |
|---|---|---|
| 0 Detect | Type and stack from files and docs | The same, plus an inventory of existing structure, tagged at `knowme-setup-base-<date>` |
| 1 Git | init, `main`, remote | Keep history; only add what's missing |
| 2 OpenSpec | `init --tools` | `update`, then `init` for missing tools |
| 3 Context | Synthesize from docs | Merge; keep operator prose |
| 4 KBD | `kbd-init` | Show a diff, then `--force`; `prometheus kbd migrate --check/--apply`; drop the legacy alias |
| 5 Tracking | Managed `.gitignore` block | Splice the block; report conflicting lines |
| 6 Prometheus | `bootstrap.sh`, then consolidate | `migrate.sh` if v3, then `bootstrap.sh`, then consolidate |
| 7 Team | Archetype, then install for each target | Edit the manifest; `updateTeam: true`; merge native diffs by hand |
| 8 UI tools | Copy the set; seed `PRODUCT`/`DESIGN` | Copy only missing ones |
| 9 Docs site | Scaffold, then the kit | Edit the existing site's sources; realign pins |
| 10 GitHub | Pages and About (confirm first) | Only if not set |
| 11 Commit | Privacy scan, push, start the workflow if needed | The same |

Full details: [stages](skills/knowme-project-setup/references/stages.md) · [brownfield](skills/knowme-project-setup/references/brownfield.md) · [project types](skills/knowme-project-setup/references/project-types.md) · [team archetypes](skills/knowme-project-setup/references/team-archetypes.md) · [privacy and publishing](skills/knowme-project-setup/references/privacy-and-publishing.md) · [lessons](skills/knowme-project-setup/references/lessons.md).

---

KnowMe, LLC · know-me.tools
