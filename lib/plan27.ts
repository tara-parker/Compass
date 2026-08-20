/** plan27: the structure build. Produced by scripts/build_plan27.py. */
export type P27Action = "KEEP" | "UPDATE" | "MERGE";

/** Terse keys: 4,539 pages ship to the browser. */
export type P27Page = {
  /** path */ p: string;
  /** action */ a: P27Action;
  /** update wave, 0 when not an update */ w: number;
  /** tree role */ r: string;
  /** parent url in the tree */ pa: string;
  /** what to change */ x: string;
  /** clicks */ c: number;
  /** impressions */ i: number;
  /** avg position */ o: number | null;
  /** GA views */ v: number;
  /** GA engagement seconds */ e: number;
  /** backlinked */ b: number;
  /** not indexed */ ni: number;
  /** referring domains, authoritative export only */ rd: number;
  /** highest DR pointing at it */ dr: number;
  /** sample referring domains */ dom: string[];
  erp: string;
  cat: string;
};

export type P27Sub = { use?: string; label?: string; url: string; existing: string | null };
export type P27Cluster = {
  url: string; label: string; existing: string | null;
  competing: number; sections: string[]; subs: P27Sub[];
};
export type P27Erp = {
  erp: string; tier: "A" | "B" | "C"; pillar: string;
  pillarExisting: string | null; pillarCompeting: number;
  clusters: P27Cluster[]; created: number; promoted: number;
};
export type P27NonPillar = { url: string; label: string; existing: string | null; subs: P27Sub[] };
export type P27Create = {
  prio: number; tree: string; level: string; erp: string; what: string; url: string; why: string;
};
export type P27Merge = { s: string; t: string; why: string };
export type P27Removal = {
  url: string; core: string; competing: number; earners: number; sibling: string;
};

export type P27Protected = {
  count: number; domains: number; source: string;
  pages: { p: string; rd: number; dr: number; dom: string[]; a: P27Action }[];
};

export type Plan27 = {
  generated: string;
  window: string;
  totals: {
    urls: number; keep: number; update: number; merge: number; delete: number;
    create: number; links: number; removals: number; treeUrls: number; promoted: number;
  };
  findings: [string, string][];
  blocked: [string, string][];
  demand: [string, number, number][];
  waves: { w: number; n: number; label: string }[];
  erpTree: P27Erp[];
  nonTree: P27NonPillar[];
  create: P27Create[];
  merges: P27Merge[];
  removals: P27Removal[];
  protected: P27Protected;
  pages: P27Page[];
};

export const A27_ORDER: P27Action[] = ["KEEP", "UPDATE", "MERGE"];

export const A27_STYLE: Record<P27Action, { dot: string; bar: string; text: string }> = {
  KEEP:   { dot: "bg-emerald-400", bar: "bg-emerald-400", text: "text-emerald-300" },
  UPDATE: { dot: "bg-sky-400",     bar: "bg-sky-400",     text: "text-sky-300" },
  MERGE:  { dot: "bg-amber-400",   bar: "bg-amber-400",   text: "text-amber-300" },
};

export const TIER_LABEL: Record<string, string> = {
  A: "full master-list coverage",
  B: "15 clusters, phased",
  C: "8 clusters, phased",
};
