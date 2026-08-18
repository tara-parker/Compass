export type Snapshot = {
  period: string;
  label: string;
  start: string;
  end: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
};

export type Daily = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
};

export type PageDoc = {
  title: string;
  url: string;
  type: "sub";
  cluster: string;
  slug: string;
  snapshots: Snapshot[];
  body: string;
  routeSlug: string[];
  /** Raw frontmatter, for fields the typed shape does not cover (e.g. updates). */
  raw?: Record<string, unknown>;
};

export type ClusterDoc = {
  title: string;
  cluster: string;
  pagesTracked: number;
  pagesLive: number;
  snapshots: Snapshot[];
  body: string;
  pages: PageDoc[];
};

export type RootDoc = {
  title: string;
  url: string;
  clusters: number;
  pagesTracked: number;
  snapshots: Snapshot[];
  homepage: Snapshot[];
  daily: Daily[];
  body: string;
};

export type Delta = {
  latest: Snapshot | null;
  prev: Snapshot | null;
  dClicks: number | null;
  dImpressions: number | null;
  dPosition: number | null;
  dCtr: number | null;
  isNew: boolean;
  dropped: boolean;
};

export type Period = { id: string; label: string; start: string; end: string };
