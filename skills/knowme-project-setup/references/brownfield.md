# Brownfield conversion

A brownfield project already has history, and possibly some of the structure. The job is to **converge** on the target structure without losing anything an operator wrote.

## Order of operations

1. **Inventory.** Run `scripts/detect.mjs` and save the JSON with the run's notes. Every later decision cites it.
2. **Snapshot.** Make sure the working tree is clean, or get the user's agreement to proceed with changes present. Tag the starting point: `git tag knowme-setup-base-<date>`. Local only; don't push it unless asked.
3. **Run the stages in order**, applying the rules below. Stop at the first `BLOCKED` stage and report it. Don't skip ahead past a missing dependency.

## Per-stage rules

| Stage | Present | Missing | Outdated |
|---|---|---|---|
| Git | Keep history, branch and remote | `init -b main` | Rename `master` to `main` only if there's no upstream, or with the user's agreement |
| OpenSpec | `openspec update`; add missing tools with `init --tools` | `init` | `update --force` only on request |
| Context | Merge into the existing project section; keep operator headings | Synthesize from docs | Refresh commands and status lines; point to the playbook instead of copying it |
| KBD | `kbd-init` shows a diff and asks, `--force` after confirmation; run `prometheus kbd migrate --check`, then `--apply`; drop the legacy `active_phase` | `kbd-init` | Keep existing `phases/` and progress ledgers exactly as they are; never hand-edit generated projections |
| Tracking | Splice the managed `.gitignore` block; report conflicting lines, remove them with `--fix` after confirmation | Create it | Rewrite only the managed block |
| Prometheus | v3 detected: `migrate.sh`, then `--apply` (archives to `.prometheus/knowledge/`); otherwise `bootstrap.sh` replaces only the marked region | `bootstrap.sh` | `bootstrap.sh --force` re-copies hooks, rules and settings only; operator prose is never touched |
| Team | Existing `.agent-team/<id>/team.json`: edit the manifest, `validate`, `install-project` with `updateTeam: true`; review the reported native diffs and merge by hand | Create from an archetype | Existing native agent files are kept; the installer reports differences instead of overwriting them |
| UI tools | Copy only missing skills | Copy them | Skills copied by a previous run: re-copy only when the user asks, and diff first |
| Docs site | Existing Docusaurus: edit its sources (config, CSS, sync); never edit generated HTML | Scaffold | Align the `@docusaurus/*` pins and overrides; update the SHAs pinned in the workflow |
| GitHub | Leave the homepage alone if it's already set, unless asked | Enable and set | — |

## KBD specifics

- Readers accept the legacy `active_phase`, but writers must use `activePhase`. Remove the alias.
- If `.kbd-orchestrator/phases/` exists, run `/kbd-status` before and after the conversion and compare the phase, the change counts and the next action. Any difference is a regression.
- `prometheus kbd status` may create `.prometheus/project.json` on first use. Commit it; it's the project identity for replicas and worktrees.
- A settings deny rule on `.kbd-orchestrator/**` (from bootstrap releases up to 1.10.0) blocks KBD. `bootstrap.sh` removes that entry and reports `REPAIR`.

## Context specifics

- A large `CLAUDE.md` is not shrunk automatically. Measure first with `/context` and a fixed set of tasks. Move stack detail to `.claude/rules/` and procedures to skills. Delete a line only if removing it wouldn't cause a mistake. Measure again.
- If `CLAUDE.md` and `AGENTS.md` both carry the constitution, `migrate.sh` archives both and bootstrap links `CLAUDE.md` to `AGENTS.md`.
- Tool-owned regions (`agent-rules`, `uiux-routing`, `zed-workspace`, `prometheus-team-routing`) move automatically, with their markers intact.

## Team specifics

- Keep role IDs stable: native agents, KBD handoffs and routing refer to them.
- A new role needs `owns` that don't overlap existing roles. Shrink an existing role's ownership before adding a role that takes over part of it.
- `project-routing.json` keeps an explicit `activeTeam`. With more than one team, pass `teamId`.

## Done means

- `verify.mjs` shows no FAIL.
- `/kbd-status` renders the same phase state as before, or a documented improvement.
- The diff against the base tag is reviewed. Anything removed is listed with where it went (usually `.prometheus/knowledge/`).
