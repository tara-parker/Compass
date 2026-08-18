import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type DirEntry = {
  name: string;
  slug: string[];
  isDir: boolean;
  count?: number;
};

export type BrowseDir = { kind: "dir"; path: string[]; entries: DirEntry[] };
export type BrowseFile = {
  kind: "file";
  path: string[];
  title: string;
  data: Record<string, unknown>;
  content: string;
};
export type BrowseResult = BrowseDir | BrowseFile | { kind: "missing" };

/** Resolve a slug array to a safe absolute path inside CONTENT_DIR. */
function safeResolve(slug: string[]): string | null {
  const rel = slug.join("/");
  const abs = path.normalize(path.join(CONTENT_DIR, rel));
  if (abs !== CONTENT_DIR && !abs.startsWith(CONTENT_DIR + path.sep)) return null;
  return abs;
}

function countMd(dir: string): number {
  let c = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) c += countMd(path.join(dir, e.name));
    else if (e.name.endsWith(".md")) c += 1;
  }
  return c;
}

export function browse(slug: string[] = []): BrowseResult {
  const abs = safeResolve(slug);
  if (!abs || !fs.existsSync(abs)) {
    // try .md file
    const asFile = abs ? abs + ".md" : null;
    if (asFile && fs.existsSync(asFile)) return readFile(asFile, slug);
    return { kind: "missing" };
  }
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    const entries: DirEntry[] = fs
      .readdirSync(abs, { withFileTypes: true })
      .filter((e) => e.isDirectory() || e.name.endsWith(".md"))
      .map((e) => {
        const isDir = e.isDirectory();
        const name = isDir ? e.name : e.name.replace(/\.md$/, "");
        return {
          name,
          slug: [...slug, name],
          isDir,
          count: isDir ? countMd(path.join(abs, e.name)) : undefined,
        };
      })
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    return { kind: "dir", path: slug, entries };
  }
  return readFile(abs, slug);
}

function readFile(abs: string, slug: string[]): BrowseFile {
  const raw = fs.readFileSync(abs, "utf-8");
  const { data, content } = matter(raw);
  return {
    kind: "file",
    path: slug,
    title: String((data as Record<string, unknown>).title ?? slug[slug.length - 1] ?? "content"),
    data: data as Record<string, unknown>,
    content,
  };
}
