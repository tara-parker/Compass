import { getPlan } from "@/lib/plan.server";
import { ACTION_ORDER, ACTION_STYLE } from "@/lib/plan";
import { num } from "@/lib/format";
import { Card } from "../components/StatCard";
import PlanExplorer, { ActionBar } from "../components/PlanExplorer";

export const metadata = { title: "Plan26 · Compass" };

const TIER_TONE: Record<string, string> = {
  A: "text-up",
  B: "text-up",
  C: "text-amber-300",
  D: "text-flat",
  E: "text-down",
};

export default function Plan26Page() {
  const plan = getPlan();
  const t = plan.totals;
  const live = t.KEEP + t.UPDATE;
  const cut = t.MERGE + t.DELETE;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Plan26</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Every live URL sorted by what it actually earns, then given an action. The site has{" "}
          {num(t.urls)} URLs and the search traffic of a site with about 500. Prune first, then
          build.
        </p>
        <p className="mt-1 text-xs text-flat">
          Generated {plan.generated} · window {plan.window}
        </p>
      </header>

      {/* ---- the shape of the decision ---- */}
      <Card title="What happens to the site">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACTION_ORDER.map((a) => (
            <div key={a} className="rounded-xl border border-ink-line bg-black/20 p-3">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${ACTION_STYLE[a].dot}`} />
                <span className="text-[10px] uppercase tracking-wide text-flat">{a}</span>
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-white">
                {num(t[a])}
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-flat">{plan.actions[a]}</div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <ActionBar counts={t} total={t.urls} />
          <p className="mt-2 text-xs text-flat">
            <span className="text-slate-200">{num(live)}</span> pages survive and get worked on.{" "}
            <span className="text-slate-200">{num(cut)}</span> are merged or removed. Endpoint is
            roughly 1,200 to 1,500 real pages, not {num(t.urls)}.
          </p>
        </div>
      </Card>

      {/* ---- tier table: why each page got its action ---- */}
      <Card title="How each page was tiered">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-ink-line text-[10px] uppercase tracking-wide text-flat">
                <th className="px-2 py-2 text-left font-medium">Tier</th>
                <th className="px-2 py-2 text-left font-medium">Definition</th>
                <th className="px-2 py-2 text-right font-medium">URLs</th>
                <th className="px-2 py-2 text-right font-medium">Clicks</th>
                <th className="px-2 py-2 text-right font-medium">Impressions</th>
                <th className="px-2 py-2 text-left font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {plan.tiers.map((tr) => (
                <tr key={tr.tier} className="border-b border-ink-line/50 last:border-0">
                  <td className={`px-2 py-2 font-mono font-semibold ${TIER_TONE[tr.tier]}`}>
                    {tr.tier}
                  </td>
                  <td className="px-2 py-2 text-slate-300">{tr.definition}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-200">
                    {num(tr.urls)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right tabular-nums ${
                      tr.clicks ? "text-slate-200" : "text-flat"
                    }`}
                  >
                    {num(tr.clicks)}
                  </td>
                  <td
                    className={`px-2 py-2 text-right tabular-nums ${
                      tr.impressions ? "text-slate-200" : "text-flat"
                    }`}
                  >
                    {num(tr.impressions)}
                  </td>
                  <td className="px-2 py-2 text-[12px] text-flat">{tr.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-flat">
          Tiers A and B are {num(plan.tiers[0].urls + plan.tiers[1].urls)} pages, under 11% of the
          site, and hold {num(plan.tiers[0].clicks + plan.tiers[1].clicks)} of {num(t.clicks)}{" "}
          clicks. Tiers C, D and E hold 89% of the site and zero clicks.
        </p>
      </Card>

      {/* ---- the nested tree ---- */}
      <Card title="Clusters, sub-clusters and pages">
        <PlanExplorer plan={plan} />
      </Card>

      <Card title="Read the numbers with these in mind">
        <ul className="space-y-2 text-[13px] text-slate-300">
          {plan.caveats.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="text-flat">·</span>
              <span>{c}</span>
            </li>
          ))}
          <li className="flex gap-2">
            <span className="text-flat">·</span>
            <span>
              The redirect export on hand holds 25 rows, not the ~1,800 live in the plugin. Redirect
              classification is blocked until a full export exists. Nothing else is.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
