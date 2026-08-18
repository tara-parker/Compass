import Link from "next/link";
import { notFound } from "next/navigation";
import { getCluster, getClusters, getSubFolders, delta } from "@/lib/content";
import { toRow } from "@/lib/rows";
import { num, pos, pct } from "@/lib/format";
import { StatCard } from "../../components/StatCard";
import { Breadcrumbs } from "../../components/Breadcrumbs";
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
  const subFolders = getSubFolders(cluster);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Overview", href: "/" },
            { label: "Clusters", href: "/clusters" },
            { label: c.title },
          ]}
        />
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold text-white">{c.title}</h1>
          <span className="text-sm font-light text-flat">cluster</span>
        </div>
        <p className="text-sm text-flat">
          {c.pagesLive} live pages · {c.pagesTracked} tracked
          {subFolders.length > 0 && ` · ${subFolders.length} sub-clusters`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clicks" value={num(l?.clicks)} delta={d.dClicks} />
        <StatCard label="Impressions" value={num(l?.impressions)} delta={d.dImpressions} />
        <StatCard label="Avg position" value={pos(l?.position)} delta={d.dPosition} invert digits={1} />
        <StatCard label="CTR" value={pct(l?.ctr)} delta={d.dCtr ? d.dCtr * 100 : d.dCtr} digits={2} suffix="pp" />
      </div>

      {subFolders.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-flat">
            Sub-clusters
          </h2>
          <div className="flex flex-wrap gap-2">
            {subFolders.map((s) => (
              <Link
                key={s.name}
                href={`/content/${s.slug.join("/")}`}
                className="group flex items-center gap-2 rounded-xl border border-ink-line bg-ink-soft/50 px-3 py-2 text-sm transition hover:border-brand/40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-flat">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <span className="text-slate-200 group-hover:text-brand-soft">{s.name}</span>
                <span className="text-xs text-flat">{s.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <PagesExplorer rows={rows} clusters={[]} showCluster={false} />
    </div>
  );
}
