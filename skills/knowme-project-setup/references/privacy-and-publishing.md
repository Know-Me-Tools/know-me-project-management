# Privacy and publishing

Publishing happens three ways: a git push, the docs site, and GitHub settings. Each needs its own check.

## Classify sources before writing anything public

| Class | Meaning | Examples |
|---|---|---|
| public | Copied as-is | Architecture reports already published elsewhere |
| public-normalize | Copied after links and frontmatter are rewritten | Playbooks, research notes, ADRs |
| private-synthesis-only | May inform hand-written pages, never copied | `docs/README.md` that indexes private material, `PRODUCT.md` drafts |
| excluded | Never read by publishing tools | Session transcripts, personal notes, `.prometheus/`, `.agent-team/`, `.kbd-orchestrator/` |

## Public repositories

- Check visibility first: `gh repo view <o>/<r> --json visibility`. Unknown means public.
- Add private paths to `.gitignore` **before the first commit**. Removing them from history later requires a rewrite and a force-push.
- Tracked config must not contain `/Users/<name>/` or similar home paths. KBD's `focus_project_path` should be `"."`.
- `.agent-team/state.json` and `.agent-team/recovery/` stay ignored. They hold prompts, evidence and copies of instruction files.
- `.prometheus/recovery/` **is** tracked. It holds copies of instruction files made during bootstrap edits, which are not secret. Leave it ignored if those files contain anything sensitive.

## Docs site

- The sync script reads only public and public-normalize entries, and fails if a public page links into an excluded path.
- The sanitizer rejects home paths, private keys, credential assignments and any named private file patterns. It scans `docs`, `content`, `src` and `static`, including `.html` and `.svg` files.
- The workflow repeats the scan on the build output before uploading it.
- A container build uses `Dockerfile.dockerignore` next to the Dockerfile (the build context is the repo root), which excludes private paths.

## Before any push

`node <S>/scripts/verify.mjs <P> --privacy` must pass. It checks that:
- no staged or tracked file lives under a private path;
- no tracked file contains a home path, key material or common token formats;
- the gitignore managed block is present.
