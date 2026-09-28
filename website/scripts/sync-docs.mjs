// Builds the generated website/docs tree from the repository's public sources.
// Driven by content-sources.json. Only `public` and `public-normalize` entries are
// read; `excluded` paths are enforced as link targets that must never appear.
// Hand-written site pages live in website/content/ and are copied first.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(site, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(site, 'content-sources.json'), 'utf8'));
const out = path.join(site, 'docs');

const excluded = cfg.sources.filter((s) => s.classification === 'excluded').map((s) => s.path.replace(/\/$/, ''));
const renames = {}; // source basename -> dest basename, for link rewriting
for (const s of cfg.sources) if (s.dest && s.classification !== 'excluded') renames[path.basename(s.path)] = path.basename(s.dest);

function frontmatter(fields) {
  const entries = Object.entries(fields ?? {});
  if (!entries.length) return '';
  return `---\n${entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n`;
}

function rewrite(text, file) {
  for (const ex of excluded) {
    const rel = ex.replace(/^docs\//, '');
    if (new RegExp(`\\]\\((?:\\.{1,2}/)*(?:docs/)?${rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text)) {
      throw new Error(`${file} links to excluded content: ${ex}`);
    }
  }
  for (const [from, to] of Object.entries(cfg.linkRewrites ?? {})) text = text.replaceAll(`](${from})`, `](${to})`);
  for (const [from, to] of Object.entries(renames)) {
    const re = new RegExp(`\\]\\(((?:\\.{1,2}/)*)${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(#[^)]*)?\\)`, 'g');
    text = text.replace(re, (_, dir, hash = '') => `](${dir || './'}${to}${hash})`);
  }
  return text;
}

function writeDoc(rel, body) {
  const file = path.join(out, rel);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, body);
}

fs.rmSync(out, {recursive: true, force: true});
for (const s of cfg.sources) if (s.static) fs.rmSync(path.join(site, 'static', s.static), {recursive: true, force: true});

// 1. Site-owned pages.
const content = path.join(site, 'content');
if (fs.existsSync(content)) {
  for (const e of fs.readdirSync(content, {recursive: true, withFileTypes: true})) {
    if (!e.isFile()) continue;
    const src = path.join(e.parentPath, e.name);
    writeDoc(path.relative(content, src), fs.readFileSync(src, 'utf8'));
  }
}

// 2. Repository sources.
for (const s of cfg.sources) {
  if (!['public', 'public-normalize'].includes(s.classification)) continue;
  const src = path.join(repo, s.path);
  if (!fs.existsSync(src)) throw new Error(`content source missing: ${s.path}`);
  if (s.static) {
    // Standalone files (HTML reports, images) served verbatim from static/.
    const dest = path.join(site, 'static', s.static);
    fs.mkdirSync(dest, {recursive: true});
    const files = fs.statSync(src).isDirectory() ? fs.readdirSync(src).map((f) => path.join(src, f)) : [src];
    for (const f of files) if (fs.statSync(f).isFile()) fs.copyFileSync(f, path.join(dest, path.basename(f)));
    continue;
  }
  const files = fs.statSync(src).isDirectory()
    ? fs.readdirSync(src, {recursive: true}).filter((f) => /\.mdx?$/.test(f)).map((f) => [path.join(src, f), path.join(s.dest ?? s.path, f)])
    : [[src, s.dest ?? path.basename(s.path)]];
  for (const [file, dest] of files) {
    let body = fs.readFileSync(file, 'utf8');
    const fm = (s.frontmatter ?? {})[path.basename(file)] ?? (fs.statSync(src).isDirectory() ? null : s.frontmatter);
    // Source files with their own YAML frontmatter (e.g. SKILL.md) would end up with two
    // blocks. Drop the source block when the site supplies one or stripFrontmatter is set.
    if ((fm || s.stripFrontmatter) && body.startsWith('---\n')) {
      const end = body.indexOf('\n---', 4);
      if (end > 0) body = body.slice(body.indexOf('\n', end + 1) + 1).replace(/^\n+/, '');
    }
    if (s.classification === 'public-normalize') body = rewrite(body, path.relative(repo, file));
    writeDoc(dest, frontmatter(fm) + body);
  }
}

console.log(`docs synced (${excluded.length} excluded path(s) enforced)`);
