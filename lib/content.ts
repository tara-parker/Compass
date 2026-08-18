import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  ClusterDoc,
  Delta,
  PageDoc,
  Period,
  RootDoc,
  Snapshot,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const DATA_DIR = path.join(process.cwd(), "data");

// --------------------------------------------------------------------------- //
// low-level file reading (memoized per server process)
// --------------------------------------------------------------------------- //
type Parsed = { data: Record<string, unknown>; content: string; rel: string };

let _files: Parsed[] | null = null;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function allFiles(): Parsed[] {
  if (_files) return _files;
  if (!fs.existsSync(CONTENT_DIR)) {
    _files = [];
    return _files;
  }
  _files = walk(CONTENT_DIR).map((full) => {
    const raw = fs.readFileSync(full, "utf-8");
    const { data, content } = matter(raw);
    return {
      data: data as Record<string, unknown>,
      content,
      rel: path.relative(CONTENT_DIR, full).split(path.sep).join("/"),
    };
  });
  return _files;
}

function asSnapshots(v: unknown): Snapshot[] {
  if (!Array.isArray(v)) return [];
  return v.map((s) => {
    const o = s as Record<string, unknown>;
    return {
      period: String(o.period ?? ""),
      label: String(o.label ?? ""),
      start: String(o.start ?? ""),
      end: String(o.end ?? ""),
      clicks: Number(o.clicks ?? 0),
      impressions: Number(o.impressions ?? 0),
      ctr: Number(o.ctr ?? 0),
      position: o.position == null ? null : Number(o.position),
    };
  });
}

// --------------------------------------------------------------------------- //
// documents
// --------------------------------------------------------------------------- //
export function getRoot(): RootDoc {
  const f = allFiles().find((x) => x.rel === "_root.md");
  const d = f?.data ?? {};
  return {
    title: String(d.title ?? "Site Overview"),
    url: String(d.url ?? ""),
    clusters: Number(d.clusters ?? 0),
    pagesTracked: Number(d.pages_tracked ?? 0),
    snapshots: asSnapshots(d.snapshots),
    homepage: asSnapshots(d.homepage),
    daily: (Array.isArray(d.daily) ? d.daily : []).map((x) => {
      const o = x as Record<string, unknown>;
      return {
        date: String(o.date ?? ""),
        clicks: Number(o.clicks ?? 0),
        impressions: Number(o.impressions ?? 0),
        ctr: Number(o.ctr ?? 0),
        position: o.position == null ? null : Number(o.position),
      };
    }),
    body: f?.content ?? "",
  };
}

function pageFromFile(f: Parsed): PageDoc {
  const d = f.data;
  const routeSlug = f.rel.replace(/\.md$/, "").split("/");
  return {
    title: String(d.title ?? routeSlug[routeSlug.length - 1]),
    url: String(d.url ?? ""),
    type: "sub",
    cluster: String(d.cluster ?? routeSlug[0]),
    slug: String(d.slug ?? routeSlug.slice(1).join("/")),
    snapshots: asSnapshots(d.snapshots),
    body: f.content,
    routeSlug,
  };
}

export function getAllPages(): PageDoc[] {
  return allFiles()
    .filter(
      (f) =>
        f.rel !== "_root.md" &&
        !f.rel.endsWith("/_cluster.md") &&
        (f.data.type ?? "sub") === "sub",
    )
    .map(pageFromFile);
}

export function getClusters(): ClusterDoc[] {
  const clusterFiles = allFiles().filter((f) => f.rel.endsWith("/_cluster.md"));
  const pages = getAllPages();
  return clusterFiles
    .map((f) => {
      const d = f.data;
      const name = String(d.cluster ?? f.rel.split("/")[0]);
      return {
        title: String(d.title ?? name),
        cluster: name,
        pagesTracked: Number(d.pages_tracked ?? 0),
        pagesLive: Number(d.pages_live ?? 0),
        snapshots: asSnapshots(d.snapshots),
        body: f.content,
        pages: pages.filter((p) => p.cluster === name),
      };
    })
    .sort((a, b) => latestClicks(b) - latestClicks(a));
}

export function getCluster(name: string): ClusterDoc | null {
  return getClusters().find((c) => c.cluster === name) ?? null;
}

export function getPageByRoute(slug: string[]): PageDoc | null {
  const rel = slug.join("/") + ".md";
  const f = allFiles().find((x) => x.rel === rel);
  return f ? pageFromFile(f) : null;
}

export function getPeriods(): Period[] {
  try {
    const meta = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "meta.json"), "utf-8"),
    );
    return meta.periods ?? [];
  } catch {
    return getRoot().snapshots.map((s) => ({
      id: s.period,
      label: s.label,
      start: s.start,
      end: s.end,
    }));
  }
}

// --------------------------------------------------------------------------- //
// deltas & derived metrics
// --------------------------------------------------------------------------- //
export function delta(snaps: Snapshot[]): Delta {
  const latest = snaps.length ? snaps[snaps.length - 1] : null;
  const prev = snaps.length > 1 ? snaps[snaps.length - 2] : null;
  const periods = getPeriods();
  const lastPeriod = periods.length ? periods[periods.length - 1].id : null;
  const firstOfPair =
    periods.length > 1 ? periods[periods.length - 2].id : null;

  const hasLatest = latest?.period === lastPeriod;
  const hasPrev = prev?.period === firstOfPair;

  const diff = (a?: number | null, b?: number | null) =>
    a == null || b == null ? null : Number((b - a).toFixed(2));

  return {
    latest,
    prev,
    dClicks: hasPrev ? diff(prev?.clicks, latest?.clicks) : null,
    dImpressions: hasPrev ? diff(prev?.impressions, latest?.impressions) : null,
    dPosition: hasPrev ? diff(prev?.position, latest?.position) : null,
    dCtr: hasPrev ? diff(prev?.ctr, latest?.ctr) : null,
    isNew: !!hasLatest && !hasPrev && snaps.length === 1,
    dropped: !hasLatest && snaps.length > 0,
  };
}

function latestClicks(c: ClusterDoc): number {
  const s = c.snapshots;
  return s.length ? s[s.length - 1].clicks : 0;
}

export type Mover = {
  page: PageDoc;
  d: Delta;
};

/** Pages ranked by position change (both periods present). */
export function movers(dir: "up" | "down", limit = 8): Mover[] {
  const rows = getAllPages()
    .map((p) => ({ page: p, d: delta(p.snapshots) }))
    .filter((m) => m.d.dPosition != null && m.d.latest && m.d.prev);
  rows.sort((a, b) => (a.d.dPosition ?? 0) - (b.d.dPosition ?? 0));
  // dPosition < 0 means rank improved (moved toward 1)
  return dir === "up" ? rows.slice(0, limit) : rows.slice(-limit).reverse();
}

export type KeywordData = {
  summary: {
    keyword: string;
    best_position: number | null;
    pages_ranking: number | null;
    positions: string;
    variation: string;
  }[];
  tracked: {
    keyword: string;
    url: string;
    position: number | null;
    variation: string;
  }[];
  ahrefs: {
    keyword: string;
    skill_pos: string;
    ahrefs_pos: string;
    verdict: string;
  }[];
  source?: string;
};

export function getKeywords(): KeywordData {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "keywords.json"), "utf-8"),
    );
  } catch {
    return { summary: [], tracked: [], ahrefs: [] };
  }
}
