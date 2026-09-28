---
name: knowme-project-setup
description: Set up or convert any project (code, business process, skill development, research or docs) into the KnowMe working structure - git and GitHub, OpenSpec for a multi-harness agent fleet, KBD orchestration, Prometheus context bootstrap (AGENTS.md with CLAUDE.md symlink, hooks, .prometheus knowledge logs), an agent team with product-manager and UI/UX roles, local UI/design skills, and a branded Docusaurus site on GitHub Pages. Use for greenfield initialization or brownfield conversion/upgrade of an existing repository.
license: MIT
compatibility: Requires git, Node.js 22+, and the openspec CLI. GitHub stages need gh. Uses the kbd-init, kbd-status, prometheus-context-bootstrap, agent-team-creator and build-branded-docusaurus skills and the prometheus CLI when present; each stage stops with a clear message when its dependency is missing.
metadata:
  version: "1.0.0"
  author: KnowMe, LLC
  tags: project-setup, greenfield, brownfield, openspec, kbd, prometheus, agent-team, docusaurus
  origin: distilled from the know-me-decision setup session, 2026-09-28
---

# KnowMe project setup

Turn any directory into a KnowMe-structured project, or bring an existing one up to date. The result is the same whatever the project type:

- One resident instruction file, `AGENTS.md`, that every harness reads. `CLAUDE.md` is a symlink to it.
- OpenSpec change workflow installed for the whole harness fleet.
- KBD orchestration state in `.kbd-orchestrator/` and a knowledge log in `.prometheus/`. **Both are tracked in git.**
- A project agent team, installed natively for each harness.
- Optionally, local UI/design skills, `PRODUCT.md`/`DESIGN.md`, and a branded docs site published to GitHub Pages.

This skill orchestrates. It does not reimplement `kbd-init`, `prometheus-context-bootstrap`, `agent-team-creator` or `build-branded-docusaurus`; it calls them in the right order, with the right inputs, and applies the fixes recorded in [references/lessons.md](references/lessons.md).

## Inputs

Ask only for what detection can't answer. Defaults are in bold.

| Input | Default |
|---|---|
| Mode | **auto** (`greenfield` if no git history and no project files, else `brownfield`) |
| Project type | **detected** by `scripts/detect.mjs`: `code`, `business-process`, `skill-development`, `research-docs` |
| Harness fleet | **codex, claude, opencode, kimi, zed, minimax-code** |
| GitHub remote | ask; none is valid |
| Visibility | read from GitHub; **treat as public** if unknown |
| Private paths | **`docs/sessions/`** plus anything the operator names (transcripts, personal notes) |
| Brand source | ask for a directory holding the brand standard and logo; skip branding if none |
| Stages to skip | none |

## Step 0: Detect (always)

```bash
node <skill-dir>/scripts/detect.mjs <project-dir> > /tmp/project-inventory.json
```

It reports the git state, remote and visibility, stacks, project type, and each structure piece (present, version, legacy markers). It also reports resolved paths for the dependency skills. Read it, state the mode and project type to the user in two lines, and list the stages you'll run. Brownfield work starts from this inventory, never from assumptions.

## Stages

Run in order. Each stage is idempotent. It checks first, then changes only what's missing or outdated, and reports `CREATE`, `UPDATE`, `SKIP` or `BLOCKED`. Full commands, checks and edge cases are in [references/stages.md](references/stages.md). Brownfield rules are in [references/brownfield.md](references/brownfield.md).

1. **Git.** Run `git init -b main` if needed, rename to `main` if needed, and add the remote if one was given. Never rewrite history.
2. **OpenSpec.** Greenfield: `openspec init --tools <fleet> --no-animation`. Brownfield: `openspec update`, then `init` again only for missing tools. Zed shares `.agents/skills` with Codex. MiniMax skills are global (`~/.minimax/skills`).
3. **Project context.** Synthesize the project section of `AGENTS.md` from the README and docs: status, purpose, architecture or process map, invariants, commands or validators, workflow. The source docs remain the source of truth. Don't restate them at length.
4. **KBD.** Run `/kbd-init` (it writes `project.json` and `constraints.md`). Then run `prometheus kbd migrate --check`, and `--apply` only if it reports work. Then `prometheus kbd status`, which registers `.prometheus/project.json`. Make `focus_project_path` relative (`.`). The commands in `project.json` must match the project type: see [references/project-types.md](references/project-types.md).
5. **Tracking policy.** Run `node <skill-dir>/scripts/gitignore.mjs <project-dir> --stacks <list> --private <paths>`. It maintains a marked block that keeps `.kbd-orchestrator/` and `.prometheus/` tracked (except `worktrees/` and lock files) and ignores `.agent-team/state.json`, `.agent-team/recovery/` and the private paths. Add `.gitkeep` to empty `.prometheus/` subfolders.
6. **Prometheus context.** If Base Rules v3 is detected, run `migrate.sh`. Then run `bootstrap.sh --stacks <list>` (profile **mixed** for a mixed-model fleet), then `verify.sh`. Then **move the project section into `AGENTS.md`, below the managed region, and replace `CLAUDE.md` with a symlink to `AGENTS.md`**. Keep the old `CLAUDE.md` in `.prometheus/knowledge/`. Put stack detail in `.claude/rules/<stack>.md`, not in the resident file.
7. **Agent team.** Pick the archetype from [references/team-archetypes.md](references/team-archetypes.md) and fill it from `assets/teams/<type>.json`. Give each role disjoint `owns` paths and bind only installed skills. Validate, then `install-project` once per native target (claude, codex, opencode, kimi, minimax with `minimaxDataDirectory: ".minimax"`), and finish with `claude` so it is the recorded default. Brownfield: `updateTeam: true` after showing the diff.
8. **UI and design tools** (only when the project has a rendered UI, MCP App, operator panel or site). Copy missing UI skills into `.claude/skills` and `.agents/skills` with `cp -RL`, because the user-level entries are symlinks. Link them into `.kimi-code/skills`. Seed `PRODUCT.md` and `DESIGN.md` from evidence only (`assets/PRODUCT.template.md`, `assets/DESIGN.template.md`). `/teach-impeccable` can only be run by the user, so list it as a follow-up.
9. **Docs site** (optional). Use `build-branded-docusaurus` to scaffold `website/`, then apply `assets/docs-site/`: `sync-docs.mjs`, `content-sources.json`, the pinned `@docusaurus/*` overrides, the Pages workflow, and `Dockerfile` plus `Dockerfile.dockerignore`. Brand tokens and the logo come from the brand source. Private paths are never synced.
10. **GitHub.** Needs confirmation because it acts outside the repo. Enable Pages from workflows (`gh api -X POST repos/<o>/<r>/pages -f build_type=workflow`) and set the About homepage (`gh repo edit --homepage <pages-url>`).
11. **Commit and push.** Needs confirmation. Run the privacy scan (`verify.mjs --privacy`), commit with a conventional message, and push `main`. If the Pages workflow didn't start from the push, run `gh workflow run docs.yml --ref main`. Check the live routes.

## Finish

```bash
node <skill-dir>/scripts/verify.mjs <project-dir>
```

Report the verify table, what each stage did (CREATE/UPDATE/SKIP/BLOCKED), anything left for the user (`/teach-impeccable`, model IDs per role, `MINIMAX_DATA_DIR=.minimax`, restarting the harness to load agents), and what remains unverified. **SKIP is never PASS.**

## Rules

- **Evidence over invention.** `PRODUCT.md`, `DESIGN.md`, tokens and team prompts come from the project's own docs and brand files. Leave unknowns as open questions.
- **Publishing is a boundary.** On a public repo, private paths stay out of both the git history and the site. Check before the first commit, not after. See [references/privacy-and-publishing.md](references/privacy-and-publishing.md).
- **Don't overwrite what an operator wrote.** Operate on marked regions, show a diff before replacing, and keep archive copies in `.prometheus/knowledge/`.
- **Ask before outward-facing actions:** pushing, GitHub settings, and installing at user level.
- **Remove noise the tools add.** Bootstrap may install UI skills for stacks the project doesn't use; offer to remove them.
