# Project types

The structure is the same for every type. What changes is **what counts as build, test and lint**, which stacks the bootstrap installs rules for, which team roles are needed, and whether UI tools and a docs site apply.

`detect.mjs` proposes a type. The user can override it.

| | code | business-process | skill-development | research-docs |
|---|---|---|---|---|
| **Detected by** | A manifest: `Cargo.toml`, `package.json`, `pyproject.toml`, `go.mod`, `pubspec.yaml`, `build.gradle*`, `*.csproj`, `*.sln` | `process/`, `sop/`, `runbooks/`, `*.bpmn`, `policies/`, or mostly Markdown with procedure headings | `SKILL.md` files, `skills/`, `.claude-plugin/`, `marketplace.json` | Mostly Markdown or HTML under `docs/`, `research/`, `notes/`, with no manifest |
| **Bootstrap `--stacks`** | Detected stacks | none | `python` or `typescript` only if the skills ship scripts in those languages | none |
| **`build_health_command`** | Stack check (`cargo check --workspace --all-targets`, `pnpm build`, `uv run python -m compileall`, …) | `npx markdownlint-cli2 "**/*.md"` | `prometheus validate <skills-dir>` (or `skills-ref validate` for each skill) | `npx markdownlint-cli2 "**/*.md"` |
| **`test_command`** | Stack tests | Link check (`npx lychee --offline .` or `npx markdown-link-check`) plus checks that every process has an owner, trigger and outputs | Skill evals (`eval-harness`, `claude plugin validate` for plugins) | Link check |
| **`lint_command`** | Stack lint and format | Spelling and style (`vale` if configured) | Frontmatter and name rules (name = folder name, lowercase-hyphen, ≤64 chars; description ≤1024) | Spelling and style |
| **Blocking constraints** | The project's invariants, plus build, tests and lint | No step without an owner and exit criteria; no PII in examples | Spec compliance; no secrets in scripts; scripts are idempotent | No private sources published |
| **Team archetype** | `assets/teams/code.json` | `assets/teams/business-process.json` | `assets/teams/skill-development.json` | `assets/teams/research-docs.json` |
| **UI tools (stage 8)** | If there's a UI, MCP App or operator panel | If a portal, form or dashboard is in scope | If the skills produce UI | Only for the docs site |
| **Docs site (stage 9)** | Recommended | Recommended (the process handbook) | Recommended (the skill catalog) | Core deliverable |

## Pre-implementation code projects

When the design exists but the code doesn't:
- Keep the real commands in `project.json`. Say in `constraints.md` that they are "N/A until <milestone>", so they report *not applicable* rather than *failed*.
- Pass the planned stacks to bootstrap anyway (for example `--stacks rust,python`) so the path rules are ready.

## Mixed repositories

Use the dominant type for the commands, and add the others' validators to `extra_checks` in `project.json`. For example, a code repo with a `marketplace/` of skills adds `"skills": "prometheus validate marketplace"`.
