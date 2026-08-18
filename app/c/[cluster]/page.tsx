import Link from "next/link";
import { notFound } from "next/navigation";
import { getCluster, getClusters, delta } from "@/lib/content";
import { toRow } from "@/lib/rows";
import { num, pos, pct } from "@/lib/format";
import { StatCard } from "../../components/StatCard";
import PagesExplorer from "../../components/PagesExplorer";

export function generateStaticParams() {
  return getClusters().map((c) => ({ cluster: c.cluster }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cluster: string }>;
}) {
  const { cluster } = await params;
  const c = getCluster(cluster);
  return { title: `${c?.title ?? cluster} cluster · Compass` };
}

export default async function ClusterPage({
  params,
}: {
  params: Promise<{ cluster: string }>;
}) {
  const { cluster } = await params;
  const c = getCluster(cluster);
  if (!c) notFound();

  const d = delta(c.snapshots);
  const l = d.latest;
  const rows = c.pages.map(toRow);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clusters" className="text-xs text-brand-soft hover:underline">
          ← Clusters
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {c.title}{" "}
          <span className="text-base font-normal text-flat">cluster</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {c.pagesLive} live pages · {c.pagesTracked} tracked
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clicks" value={num(l?.clicks)} delta={d.dClicks} />
        <StatCard label="Impressions" value={num(l?.impressions)} delta={d.dImpressions} />
        <StatCard label="Avg position" value={pos(l?.position)} delta={d.dPosition} invert digits={1} />
        <StatCard label="CTR" value={pct(l?.ctr)} delta={d.dCtr ? d.dCtr * 100 : d.dCtr} digits={2} suffix="pp" />
      </div>

      <PagesExplorer rows={rows} clusters={[]} showCluster={false} />
    </div>
  );
}
