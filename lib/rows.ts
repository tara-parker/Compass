import { delta } from "./content";
import type { PageDoc } from "./types";
import type { Row } from "@/app/components/PagesExplorer";

/** Flatten a PageDoc into the row shape the PagesExplorer table consumes. */
export function toRow(p: PageDoc): Row {
  const d = delta(p.snapshots);
  const l = d.latest;
  return {
    title: p.title,
    cluster: p.cluster,
    href: "/p/" + p.routeSlug.join("/"),
    clicks: l?.clicks ?? null,
    impressions: l?.impressions ?? null,
    ctr: l?.ctr ?? null,
    position: l?.position ?? null,
    dClicks: d.dClicks,
    dPosition: d.dPosition,
    isNew: d.isNew,
  };
}
