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
  E: "text-slate-400",
};

const REASON_BY_ACTION: Record<string, string[]> = {
  KEEP: ["backlinked-earning", "earns-clicks", "striking-distance", "unique-untested"],
  UPDATE: ["backlinked-idle", "indexed-weak", "canonical", "crowded"],
  MERGE: ["dup-signal", "dup-untested"],
  DELETE: ["not-indexed", "dup-redundant", "padded-variant", "dup-dead", "dark-after-trial"],
};

// The rules the rewrites follow. Kept on the page because a plan nobody can see
// the rules for gets worked differently by every person who touches it.
const RULES: [string, string][] = [
  ["Title and meta are search terms",
   "Both must read like something a person typed into Google, not like a headline."],
  ["Never change the slug or the URL",
   "Change the title, the body and the meta. The URL stays, so nothing needs a redirect."],
  ["Work the impressions first",
   "A page with impressions and no clicks is a snippet problem and the fastest fix on the site."],
  ["One wording for the product",
   "Finance AI platform. Same phrase every time, so it accumulates instead of splitting."],
  ["Keep the WP forms",
   "Do not drop the form when rewriting a page body."],
  ["Only SAP Business One has a real hub",
   "Every other topic is a flat pile of posts with nothing to link up to. Build the hub before more posts."],
  ["Create by intersection, not by volume",
   "ERP x function x use case. A new page needs a query no existing page answers."],
  ["Zero impressions is not proof on its own",
   "Delete only with evidence: not indexed by Google, near-duplicate, padded variant, or dead after 90 days."],
];

export default function Plan26Page() {
  const plan = getPlan();
  const t = plan.totals;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Plan26</h1>
        <p className="mt-1 text-sm text-slate-400">{num(t.urls)} live URLs</p>
      </header>

      <Card title="The split">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACTION_ORDER.map((a) => (
            <div key={a} className="rounded-xl border border-ink-line bg-black/20 p-3">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${ACTION_STYLE[a].dot}`} />
                <span className="text-[10px] uppercase tracking-wide text-flat">{a}</span>
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{num(t[a])}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <ActionBar counts={t} total={t.urls} />
        </div>
      </Card>

      <Card title="Topics: what exists, what it earns, what is missing">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ink-line text-[10px] uppercase tracking-wide text-flat">
                <th className="px-2 py-2 text-left font-medium">Topic</th>
                <th className="px-2 py-2 text-right font-medium">Pages</th>
                <th className="px-2 py-2 text-right font-medium">Impressions</th>
                <th className="px-2 py-2 text-right font-medium">Clicks</th>
                <th className="px-2 py-2 text-right font-medium">Orphans</th>
                <th className="px-2 py-2 text-left font-medium">Hub</th>
                <th className="px-2 py-2 text-left font-medium">Keep / Update / Merge / Delete</th>
              </tr>
            </thead>
            <tbody>
              {plan.topics.map((tp) => {
                const realHub = tp.hub && !tp.hub.startsWith("/blog/") && tp.hubImpressions > 0;
                return (
                  <tr key={tp.topic} className="border-b border-ink-line/50 last:border-0">
                    <td className="whitespace-nowrap px-2 py-2 font-medium text-slate-200">
                      {tp.topic}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-200">
                      {num(tp.pages)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-200">
                      {num(tp.impressions)}
                    </td>
                    <td
                      className={`px-2 py-2 text-right tabular-nums ${
                        tp.clicks ? "text-up" : "text-flat"
                      }`}
                    >
                      {num(tp.clicks)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-flat">
                      {num(tp.orphans)}
                    </td>
                    <td className="px-2 py-2">
                      {realHub ? (
                        <span className="font-mono text-[10.5px] text-slate-400">{tp.hub}</span>
                      ) : (
                        <span className="rounded bg-down/15 px-1.5 py-0.5 text-[10px] font-semibold text-down">
                          NO HUB
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-24 shrink-0 tabular-nums text-[11px] text-slate-400">
                          {tp.counts.KEEP}/{tp.counts.UPDATE}/{tp.counts.MERGE}/{tp.counts.DELETE}
                        </span>
                        <span className="min-w-[72px] flex-1">
                          <ActionBar counts={tp.counts} total={tp.pages} />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Rules for every rewrite">
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {RULES.map(([rule, detail]) => (
            <div key={rule} className="border-b border-ink-line/40 pb-2 last:border-0">
              <div className="text-[12.5px] font-semibold text-slate-200">{rule}</div>
              <div className="text-[12px] leading-snug text-flat">{detail}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Why each page landed where it did">
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {ACTION_ORDER.map((a) => (
            <div key={a}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ACTION_STYLE[a].dot}`} />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  {a}
                </span>
              </div>
              <div className="space-y-1">
                {REASON_BY_ACTION[a].map((key) => {
                  const count = plan.reasonCounts[key] ?? 0;
                  if (!count) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-baseline justify-between gap-3 border-b border-ink-line/40 pb-1 last:border-0"
                    >
                      <span className="text-[12.5px] text-slate-300">{plan.reasons[key]}</span>
                      <span className="shrink-0 tabular-nums text-[12px] text-slate-400">
                        {num(count)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Measured performance">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="border-b border-ink-line text-[10px] uppercase tracking-wide text-flat">
                <th className="px-2 py-2 text-left font-medium">Tier</th>
                <th className="px-2 py-2 text-left font-medium">Definition</th>
                <th className="px-2 py-2 text-right font-medium">URLs</th>
                <th className="px-2 py-2 text-right font-medium">Clicks</th>
                <th className="px-2 py-2 text-right font-medium">Impressions</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Clusters, sub-clusters and pages">
        <PlanExplorer plan={plan} />
      </Card>

    </div>
  );
}

