/** Action assigned to every live URL by scripts/build_plan26.py. */
export type PlanAction = "KEEP" | "UPDATE" | "MERGE" | "DELETE";

/** Terse keys keep the client payload small — 4,539 pages ship to the browser. */
export type PlanPage = {
  /** path */ p: string;
  /** title */ t: string;
  /** action */ s: PlanAction;
  /** reason key, see Plan.reasons */ r: string;
  /** tier A–E */ k: string;
  /** clicks */ c: number;
  /** impressions */ i: number;
  /** avg position */ o: number | null;
  /** backlinked */ b: number;
  /** in a duplicate group */ d: number;
  /** 1-based rank by measured strength within its list */ n: number;
  /** orphan: in the sitemap but not reachable by Ahrefs' crawler */ x: number;
  /** referring domains, where Ahrefs gave a number */ rd: number;
};

export type PlanCounts = Record<PlanAction, number>;

export type PlanSub = {
  sub: string;
  title: string;
  urls: number;
  counts: PlanCounts;
  tiers: Record<string, number>;
  clicks: number;
  impressions: number;
  backlinked: number;
  pages: PlanPage[];
};

export type PlanCluster = Omit<PlanSub, "sub"> & {
  cluster: string;
  subs: PlanSub[];
};

export type PlanTier = {
  tier: string;
  definition: string;
  verdict: string;
  urls: number;
  clicks: number;
  impressions: number;
};

export type PlanMethod = {
  fairTrialBefore: string;
  tight: number;
  loose: number;
  crowdMin: number;
  duplicateGroups: number;
  duplicateUrls: number;
  duplicateSurplus: number;
  crowdedUrls: number;
  paddedVariants: number;
  crawledUrls: number;
  orphanUrls: number;
  untestedUrls: number;
};

export type Plan = {
  generated: string;
  window: string;
  method: PlanMethod;
  source: Record<string, string>;
  whyDeleteIsSmall: string[];
  caveats: string[];
  totals: PlanCounts & {
    urls: number;
    clicks: number;
    impressions: number;
    backlinked: number;
  };
  actions: Record<PlanAction, string>;
  reasons: Record<string, string>;
  reasonCounts: Record<string, number>;
  tiers: PlanTier[];
  clusters: PlanCluster[];
};

export const ACTION_ORDER: PlanAction[] = ["KEEP", "UPDATE", "MERGE", "DELETE"];

/** Tailwind classes per action. Green keeps, blue improves, amber merges, red removes. */
export const ACTION_STYLE: Record<PlanAction, { chip: string; bar: string; dot: string }> = {
  KEEP:   { chip: "bg-up/15 text-up border-up/30",                bar: "bg-up",        dot: "bg-up" },
  UPDATE: { chip: "bg-brand/15 text-brand-soft border-brand/30",  bar: "bg-brand",     dot: "bg-brand" },
  MERGE:  { chip: "bg-amber-400/15 text-amber-300 border-amber-400/30", bar: "bg-amber-400", dot: "bg-amber-400" },
  DELETE: { chip: "bg-down/15 text-down border-down/30",          bar: "bg-down",      dot: "bg-down" },
};

/** Flatten every page in the plan, for the search/filter table. */
export function allPlanPages(plan: Plan): (PlanPage & { cluster: string; sub: string | null })[] {
  const out: (PlanPage & { cluster: string; sub: string | null })[] = [];
  for (const c of plan.clusters) {
    for (const pg of c.pages) out.push({ ...pg, cluster: c.cluster, sub: null });
    for (const s of c.subs) {
      for (const pg of s.pages) out.push({ ...pg, cluster: c.cluster, sub: s.sub });
    }
  }
  return out;
}
