# Lessons (from the know-me-decision session, 2026-09-28)

Each entry is a failure that happened, and the fix this skill now applies automatically.

| # | What happened | Fix built into the stages |
|---|---|---|
| 1 | `openspec init` put MiniMax skills in `~/.minimax/skills`, which is global | Stage 2 reports it; project MiniMax agents use `.minimax/` with `MINIMAX_DATA_DIR` |
| 2 | `kbd-init` wrote an absolute `focus_project_path`, which leaked the username once the repo went public | Stage 4 normalizes it to `"."` |
| 3 | `prometheus kbd status` quietly created `.prometheus/project.json` | Stage 4 runs it on purpose and tracks the file |
| 4 | Bootstrap failed `combined resident`: `CLAUDE.md` imported `AGENTS.md` **and** held about 1,000 words of project prose, loading both | Stage 6 moves the project section into `AGENTS.md` and replaces `CLAUDE.md` with a symlink |
| 5 | Non-Claude harnesses never saw the project context, because it lived only in `CLAUDE.md` | The same fix: `AGENTS.md` is the single source |
| 6 | Bootstrap installed about 40 UI skills (Android, Expo, Flutter, SwiftUI) into a Rust repo | Stage 6 reports what was installed; the user decides what to keep |
| 7 | The user-level UI skills were symlinks into other checkouts, so a plain copy produced empty links | Stage 8 uses `readlink -f` and `cp -RL` |
| 8 | `taste-skill` and `design-taste-frontend` both declare `name: design-taste-frontend` | Stage 8 never copies `taste-skill` |
| 9 | `.gitignore` initially ignored `.prometheus/recovery/`, and empty `.prometheus/` folders weren't tracked | Stage 5's managed block and `.gitkeep` files |
| 10 | `install-project` takes one target per run and records the last one as the default | Stage 7 installs each target, then runs `claude` last |
| 11 | Docusaurus 3.10.1 plus a search plugin pulled `@docusaurus/theme-common@3.10.2`, so Mermaid failed server-side rendering with "useColorMode outside ColorModeProvider" | Stage 9 adds `overrides` pinning every `@docusaurus/*` package that resolved to a different version |
| 12 | The synced repo Markdown contained `<`, `{port}` and similar text that MDX tries to parse | `markdown.format: 'detect'`, so `.md` files are parsed as CommonMark |
| 13 | A research doc linked to `../PLAYBOOK.md`, which was renamed in the site | `sync-docs.mjs` rewrites links for every renamed file |
| 14 | Links to a standalone HTML report broke the router | Use `pathname:///` links, with the file copied into `static/` |
| 15 | `website/.dockerignore` had no effect, because the build context is the repo root | `website/Dockerfile.dockerignore` next to the Dockerfile |
| 16 | The search plugin warned about a missing blog | `indexBlog: false` |
| 17 | The first push to a new repo didn't start the Pages workflow | Stage 11 starts it by hand if no run appears within about two minutes |
| 18 | The repo turned out to be public, and `docs/sessions/` held personal transcripts | Stage 0 reads visibility; stage 5 ignores private paths before the first commit |
| 19 | The automatic shell safety check failed several times in a row | Stages are idempotent and can be re-run; hand the user `! <command>` lines for anything left pending |
| 20 | A `/plan` request required approval before any work | This skill states the mode, type and stages first, and asks before outward-facing actions |
