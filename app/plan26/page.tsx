import { getPlan27 } from "@/lib/plan27.server";
import { A27_ORDER, A27_STYLE } from "@/lib/plan27";
import { num } from "@/lib/format";
import { Card } from "../components/StatCard";
import Plan27Explorer from "../components/Plan27Explorer";

export const metadata = { title: "Plan27 · Compass" };

/** The rules the build follows. On the page because a plan whose rules are
 *  invisible gets worked differently by every person who touches it. */
const RULES: [string, string][] = [
  ["A cluster is a group of usecases",
   "Not one page per function. 27 cluster templates cover all 138 usecases. A usecase that does not warrant its own URL is a section on the cluster page."],
  ["Combination words are title variants",
   "AI, AI agents, Claude, Cowork, ChatGPT, Codex vary the title and the body. A separate URL only where demand shows one."],
  ["Never change the slug of a page that exists",
   "Where an existing page becomes a tree node, the tree points at its URL. New URLs are for new pages only, so nothing needs a redirect it did not already need."],
  ["Merge inside one intersection, never across two",
   "Every merge was computed by folding an ERP x category x usecase cell down to its strongest page. Mixing two intersections loses the keywords already cited."],
  ["Publish the target first, redirect second",
   "Reverse order points every 301 at the old thin page."],
  ["Impressions are not demand",
   "The site converts 0.9% of expected clicks at position 3-5. Never prioritise a rewrite on impressions alone."],
  ["Nothing that earns or is backlinked is removed",
   "Enforced by construction, not by scoring margin."],
  ["A cluster is finished when it is linked",
   "Sub links up, cluster links up, pillar links down to all. A rewrite without the link step is unreachable."],
];

export default function Plan26Page() {
  const plan = getPlan27();
  const t = plan.totals;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Plan27</h1>
          <span className="text-xs text-flat">supersedes Plan26 · {plan.generated}</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {num(t.urls)} live URLs · {plan.window}
        </p>
      </header>

      <Card title="The split">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {A27_ORDER.map((a) => {
            const v = t[a.toLowerCase() as "keep" | "update" | "merge"];
            return (
              <div key={a} className="rounded-xl border border-ink-line bg-black/20 p-3">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${A27_STYLE[a].dot}`} />
                  <span className="text-[11px] uppercase tracking-wide text-flat">{a}</span>
                </div>
                <div className="mt-1 text-xl font-semibold text-white">{num(v)}</div>
              </div>
            );
          })}
          <div className="rounded-xl border border-ink-line bg-black/20 p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
              <span className="text-[11px] uppercase tracking-wide text-flat">Delete</span>
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-500">0</div>
            <div className="text-[10px] text-flat">empty by instruction</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["To create", num(t.create), "against a 2,000 ceiling"],
            ["Tree URLs", num(t.treeUrls), `${num(t.promoted)} promoted from existing`],
            ["Internal links", num(t.links), "sub → cluster → pillar"],
            ["Held for review", num(t.removals), "not actioned"],
          ].map(([l, v, s]) => (
            <div key={l} className="rounded-xl border border-ink-line bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-wide text-flat">{l}</div>
              <div className="mt-1 text-xl font-semibold text-white">{v}</div>
              <div className="text-[10px] text-flat">{s}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="What the data changed">
          <ul className="space-y-3">
            {plan.findings.map(([h, b]) => (
              <li key={h}>
                <div className="text-[12px] font-medium text-slate-200">{h}</div>
                <div className="text-[11px] leading-relaxed text-flat">{b}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Where the clicks actually come from">
          <p className="mb-3 text-[11px] text-flat">
            Non-branded demand, 16 months US. 83% of all clicks are branded and excluded here.
          </p>
          <div className="space-y-1.5">
            {plan.demand.map(([theme, clicks, queries]) => (
              <div key={theme} className="flex items-center gap-2">
                <div className="w-32 shrink-0 truncate text-[11px] text-slate-300">{theme}</div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full bg-brand" style={{ width: `${(clicks / 67) * 100}%` }} />
                </div>
                <div className="w-20 shrink-0 text-right text-[10px] text-flat">
                  {clicks} clk · {queries}q
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="The plan">
        <Plan27Explorer plan={plan} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Rules">
          <ul className="space-y-2.5">
            {RULES.map(([h, b]) => (
              <li key={h}>
                <div className="text-[12px] text-slate-200">{h}</div>
                <div className="text-[11px] leading-relaxed text-flat">{b}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Blocked, needed from outside">
          <ul className="space-y-2.5">
            {plan.blocked.map(([h, b]) => (
              <li key={h}>
                <div className="text-[12px] text-amber-200/90">{h}</div>
                <div className="text-[11px] leading-relaxed text-flat">{b}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
