import Link from "next/link";
import { getClusters, delta } from "@/lib/content";
import { num, pos, pct } from "@/lib/format";
import { DeltaBadge } from "../components/Delta";
import { Sparkline } from "../components/Charts";

export const metadata = { title: "Clusters · Compass" };

export default function ClustersPage() {
  const clusters = getClusters();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Clusters</h1>
        <p className="mt-1 text-sm text-slate-400">
          {clusters.length} content clusters, each a section of the site tracked over time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clusters.map((c) => {
          const d = delta(c.snapshots);
          const l = d.latest;
          return (
            <Link
              key={c.cluster}
              href={`/c/${c.cluster}`}
              className="group rounded-2xl border border-ink-line bg-ink-soft/40 p-5 transition hover:border-brand/40 hover:bg-ink-soft/70"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-white group-hover:text-brand-soft">{c.title}</h2>
                  <p className="text-xs text-flat">{c.pagesLive} live · {c.pagesTracked} tracked</p>
                </div>
                <Sparkline values={c.snapshots.map((s) => s.clicks)} width={64} height={24} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Pos" value={pos(l?.position)} d={d.dPosition} invert digits={1} />
                <Metric label="Clicks" value={num(l?.clicks)} d={d.dClicks} />
                <Metric label="CTR" value={pct(l?.ctr)} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  d,
  invert = false,
  digits = 0,
}: {
  label: string;
  value: string;
  d?: number | null;
  invert?: boolean;
  digits?: number;
}) {
  return (
    <div className="rounded-lg bg-black/20 p-2">
      <div className="text-[10px] uppercase tracking-wide text-flat">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="tabular-nums text-slate-100">{value}</span>
        {d !== undefined && <DeltaBadge value={d} invert={invert} digits={digits} />}
      </div>
    </div>
  );
}
