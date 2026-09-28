# Team archetypes

Every archetype has a **product-manager** role, and every archetype with a rendered surface has a **ui-ux-designer** role. Each also has one independent **reviewer** that owns only a findings folder. Domain roles vary by type. The JSON skeletons are in `assets/teams/<type>.json`. Placeholders look like `{{...}}`.

## Shared prompt preamble

Every role prompt except the reviewer's starts with this, with the placeholders filled:

> Read AGENTS.md, PRODUCT.md and {{SOURCE_OF_TRUTH}} (source of truth) before acting; follow {{READING_ORDER}} for new context. {{INVARIANTS_NAME}} are non-negotiable; weakening one needs an ADR plus sign-off from {{SIGNOFF_OWNERS}}. Write only inside your owned paths; anything else is a proposal to its owner. Cross-boundary changes go through an OpenSpec change. Never fabricate sign-off, real labels, benchmark numbers, or hashes. Never put {{SENSITIVE_DATA}} in the repo or logs. Report changed files, commands run with observed output, and what remains unverified.

## code

Used for know-me-decision.

| Role | Owns (typical) | Skills (use only installed ones) | Tier |
|---|---|---|---|
| product-manager | `PRODUCT.md`, `README.md`, `docs/product/**`, `openspec/changes/**` | openspec-propose, openspec-explore, spec-driven-development, product-capability, planning-and-task-breakdown, idea-refine | medium |
| architect | `docs/adr/**`, the playbook, `docs/architecture/**`, `openspec/specs/**` | documentation-and-adrs, domain-modeling, constraint-driven-development, {{stack workspace skill}} | hard |
| core-engineer | Workspace root files, CI, core packages, binaries, `tests/**` | {{stack skills}}, {{testing skill}} | hard |
| domain-engineer (0–n) | Their own packages (models, integrations, …) | {{stack skills}}, {{domain skills}} | hard |
| spec-safety-author | `specs/**`, `rulepacks/**` (if the project has declarative specs) | spec-driven-development, domain-modeling, {{compliance skills}} | hard |
| ui-ux-designer | `DESIGN.md`, `.impeccable.md`, `design-system/**`, `docs/design/**`, `apps/**` | prometheus-ui-ux, prometheus-impeccable-core, impeccable, teach-impeccable, ui-ux-pro-max, design-taste-frontend, web-design-guidelines, {{create-mcp-app, htmx-alpine-lit, vercel-* when used}} | medium |
| integrator | `marketplace/**`, `docs/integration/**` | skill-creator, writing-for-agents, mcp-server, agentic-engineering | medium |
| reviewer | `docs/reviews/**` | code-review-and-quality, security-and-hardening, {{compliance}}, prometheus-ui-review | hard |

## business-process

| Role | Owns | Skills | Tier |
|---|---|---|---|
| product-manager (process owner) | `PRODUCT.md`, `README.md`, `docs/product/**`, `openspec/changes/**` | openspec-propose, product-capability, planning-and-task-breakdown, interview-me | medium |
| process-architect | `processes/**`, `docs/adr/**`, `openspec/specs/**` | domain-modeling, documentation-and-adrs, constraint-driven-development | hard |
| operations-analyst | `metrics/**`, `reports/**`, `data/schemas/**` | market-research, dashboard-builder, deep-research | medium |
| automation-engineer | `automations/**`, `scripts/**`, `.github/workflows/**` | api-connector-builder, ci-cd-and-automation | medium |
| content-writer | `docs/handbook/**`, `templates/**` | better-writing, doc-coauthoring, brand-voice | medium |
| ui-ux-designer (if there's a portal or forms) | `DESIGN.md`, `design-system/**`, `apps/**` | prometheus-ui-ux, impeccable, ui-ux-pro-max | medium |
| reviewer | `docs/reviews/**` | code-review-and-quality, {{compliance}} | hard |

## skill-development

| Role | Owns | Skills | Tier |
|---|---|---|---|
| product-manager | `PRODUCT.md`, `README.md`, `docs/product/**`, `openspec/changes/**` | openspec-propose, product-capability, planning-and-task-breakdown | medium |
| skill-architect | `docs/adr/**`, `openspec/specs/**`, `skills/*/references/**` | writing-for-agents, documentation-and-adrs, skill-creator | hard |
| skill-author | `skills/**` (except `references/**` and `evals/**`), `.claude-plugin/**`, `marketplace/**` | skill-creator, create-skill, writing-for-agents, validate-skill | medium |
| eval-engineer | `evals/**`, `skills/*/evals/**` | eval-harness, ai-regression-testing | hard |
| ui-ux-designer (if the skills render UI) | `DESIGN.md`, `design-system/**` | prometheus-ui-ux, impeccable | medium |
| reviewer | `docs/reviews/**` | code-review-and-quality, security-and-hardening | hard |

## research-docs

| Role | Owns | Skills | Tier |
|---|---|---|---|
| product-manager (editor) | `PRODUCT.md`, `README.md`, `openspec/changes/**` | openspec-propose, planning-and-task-breakdown | medium |
| researcher | `research/**`, `docs/research/**` | deep-research, research, firecrawl-deep-research | hard |
| technical-writer | `docs/**` (except research and reviews) | documentation-and-adrs, better-writing, doc-coauthoring | medium |
| ui-ux-designer (docs site) | `website/src/**`, `DESIGN.md` | prometheus-ui-ux, impeccable, web-design-guidelines | medium |
| reviewer | `docs/reviews/**` | code-review-and-quality | hard |

## Rules

- Check each skill exists (`~/.claude/skills`, `~/.agents/skills`, plugin caches, or the project) before binding it. Replace or remove missing ones, and say so.
- Keep `owns` sets disjoint. Where a path overlaps, the more specific role takes the subtree and the broader role's globs list its remaining siblings explicitly.
- Dependencies:
  - product-manager has none;
  - architect roles depend on the product-manager;
  - builders depend on an architect;
  - the reviewer depends on every builder.
- `modelPolicy` holds only a tier until concrete model IDs are chosen with `agent-team-models`.
- The reviewer prompt says: separate context, read-only, runs at phase boundaries, PASS or BLOCK with evidence, no taste skills.
