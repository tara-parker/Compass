import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageByRoute, delta } from "@/lib/content";
import { num, pos, pct } from "@/lib/format";
import { StatCard, Card } from "../../components/StatCard";
import { Sparkline } from "../../components/Charts";
import { DeltaBadge } from "../../components/Delta";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const p = getPageByRoute(slug);
  return { title: `${p?.title ?? "Page"} · Compass` };
}

export default async function PageDetail({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = getPageByRoute(slug);
  if (!page) notFound();

  const d = delta(page.snapshots);
  const l = d.latest;
  const snaps = page.snapshots;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/c/${page.cluster}`} className="text-xs text-brand-soft hover:underline">
          ← {page.cluster} cluster
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {page.title}
        </h1>
        <a
          href={page.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block break-all text-xs text-slate-400 hover:text-brand-soft"
        >
          {page.url} ↗
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Position" value={pos(l?.position)} delta={d.dPosition} invert digits={1} />
        <StatCard label="Clicks" value={num(l?.clicks)} delta={d.dClicks} />
        <StatCard label="Impressions" value={num(l?.impressions)} delta={d.dImpressions} />
        <StatCard label="CTR" value={pct(l?.ctr)} delta={d.dCtr ? d.dCtr * 100 : d.dCtr} digits={2} suffix="pp" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Snapshots over time" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr className="border-b border-ink-line">
                  <th className="px-2 py-2 font-medium">Window</th>
                  <th className="px-2 py-2 text-right font-medium">Position</th>
                  <th className="px-2 py-2 text-right font-medium">Clicks</th>
                  <th className="px-2 py-2 text-right font-medium">Impr</th>
                  <th className="px-2 py-2 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {snaps.map((s) => (
                  <tr key={s.period} className="border-b border-ink-line/60">
                    <td className="px-2 py-2 text-slate-300">{s.label}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-200">{pos(s.position)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-200">{num(s.clicks)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-400">{num(s.impressions)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-400">{pct(s.ctr)}</td>
                  </tr>
                ))}
                {snaps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-flat">
                      No snapshots recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Trends">
          <div className="space-y-4">
            <TrendRow label="Position" values={snaps.map((s) => s.position)} invert delta={d.dPosition} invertDelta />
            <TrendRow label="Clicks" values={snaps.map((s) => s.clicks)} delta={d.dClicks} />
            <TrendRow label="Impressions" values={snaps.map((s) => s.impressions)} delta={d.dImpressions} />
          </div>
        </Card>
      </div>

      <Card title="Notes">
        <MarkdownRenderer>{page.body}</MarkdownRenderer>
      </Card>
    </div>
  );
}

function TrendRow({
  label,
  values,
  invert = false,
  invertDelta = false,
  delta,
}: {
  label: string;
  values: (number | null)[];
  invert?: boolean;
  invertDelta?: boolean;
  delta: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-xs text-flat">{label}</div>
        <DeltaBadge value={delta} invert={invertDelta} digits={invertDelta ? 1 : 0} />
      </div>
      <Sparkline values={values} invert={invert} width={110} height={30} />
    </div>
  );
}
