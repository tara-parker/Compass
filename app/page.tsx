import Link from "next/link";
import { getClusters, getRoot, movers, delta } from "@/lib/content";
import { num, pos, pct } from "@/lib/format";
import { StatCard, Card } from "./components/StatCard";
import { DailyChart, Sparkline } from "./components/Charts";
import { DeltaBadge } from "./components/Delta";

export default function OverviewPage() {
  const root = getRoot();
  const clusters = getClusters();
  const d = delta(root.snapshots);
  const l = d.latest;

  const up = movers("up", 6);
  const down = movers("down", 6);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-flat">Main pillar · whole-site rollup</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          ChatFin Search performance
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {root.clusters} clusters · {num(root.pagesTracked)} tracked pages ·{" "}
          {l ? `latest window ${l.label}` : "no data"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clicks" value={num(l?.clicks)} delta={d.dClicks} />
        <StatCard label="Impressions" value={num(l?.impressions)} delta={d.dImpressions} />
        <StatCard label="Avg position" value={pos(l?.position)} delta={d.dPosition} invert digits={1} />
        <StatCard label="CTR" value={pct(l?.ctr)} delta={d.dCtr ? d.dCtr * 100 : d.dCtr} digits={2} suffix="pp" />
      </div>

      <Card title="Daily clicks & impressions (all tracked windows)">
        <DailyChart daily={root.daily} />
      </Card>

      <Card
        title="Clusters"
        right={
          <Link href="/clusters" className="text-xs text-brand-soft hover:underline">
            View all →
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:min-w-[640px]">
            <thead className="text-left text-xs text-slate-400">
              <tr className="border-b border-ink-line">
                <th className="px-2 py-2 font-medium">Cluster</th>
                <th className="px-2 py-2 text-right font-medium">Pages</th>
                <th className="px-2 py-2 text-right font-medium">Avg pos</th>
                <th className="px-2 py-2 text-right font-medium">Clicks</th>
                <th className="px-2 py-2 text-right font-medium">Impr</th>
                <th className="px-2 py-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c) => {
                const cd = delta(c.snapshots);
                const cl = cd.latest;
                return (
                  <tr key={c.cluster} className="border-b border-ink-line/60 hover:bg-white/[0.03]">
                    <td className="px-2 py-2">
                      <Link href={`/c/${c.cluster}`} className="font-medium text-slate-200 hover:text-brand-soft">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-400">{c.pagesLive}</td>
                    <td className="px-2 py-2 text-right">
                      <span className="tabular-nums text-slate-200">{pos(cl?.position)}</span>{" "}
                      <DeltaBadge value={cd.dPosition} invert digits={1} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className="tabular-nums text-slate-200">{num(cl?.clicks)}</span>{" "}
                      <DeltaBadge value={cd.dClicks} />
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-400">{num(cl?.impressions)}</td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex justify-end">
                        <Sparkline values={c.snapshots.map((s) => s.clicks)} width={70} height={22} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <MoverCard title="Biggest rank gains" rows={up} good />
        <MoverCard title="Biggest rank drops" rows={down} />
      </div>
    </div>
  );
}

function MoverCard({
  title,
  rows,
  good = false,
}: {
  title: string;
  rows: { page: { title: string; cluster: string; routeSlug: string[] }; d: ReturnType<typeof delta> }[];
  good?: boolean;
}) {
  return (
    <Card title={title}>
      <ul className="space-y-2">
        {rows.map((m, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-semibold ${good ? "bg-up/15 text-up" : "bg-down/15 text-down"}`}>
              {i + 1}
            </span>
            <Link
              href={`/p/${m.page.routeSlug.join("/")}`}
              className="min-w-0 flex-1 truncate text-sm text-slate-200 hover:text-brand-soft"
            >
              {m.page.title}
            </Link>
            <span className="shrink-0 text-xs tabular-nums text-slate-400">
              {pos(m.d.prev?.position)} → {pos(m.d.latest?.position)}
            </span>
            <span className="w-14 shrink-0 text-right">
              <DeltaBadge value={m.d.dPosition} invert digits={1} />
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-flat">Not enough data yet.</li>}
      </ul>
    </Card>
  );
}
