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

export default function Plan26Page() {
  const plan = getPlan();
  const t = plan.totals;
  const m = plan.method;
  const survives = t.KEEP + t.UPDATE;
  const w = plan.watch;

  // Reasons grouped under the action they produce, for the breakdown table.
  const REASON_BY_ACTION: Record<string, string[]> = {
    KEEP: ["backlinked-earning", "earns-clicks", "striking-distance", "unique-untested"],
    UPDATE: ["backlinked-idle", "indexed-weak", "canonical", "crowded"],
    MERGE: ["dup-signal", "dup-untested"],
    DELETE: ["dup-redundant", "padded-variant", "dup-dead", "dark-after-trial"],
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Plan26</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          What to do with each of the {num(t.urls)} live URLs. Nothing is removed for merely
          lacking traffic — {num(m.untestedUrls)} pages have never had a fair trial. Removal
          requires positive evidence.
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
            <span className="text-slate-200">{num(survives)}</span> pages stay on the site.{" "}
            <span className="text-slate-200">{num(t.MERGE)}</span> fold into a stronger
            near-duplicate and <span className="text-slate-200">{num(t.DELETE)}</span> come off now,
            with <span className="text-amber-300">{num(w.count)}</span> more queued for review.
          </p>
        </div>
      </Card>

      {/* ---- the staged removal: now, then next ---- */}
      <Card title="Removal happens in two passes, not one">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-5">
          <div className="flex gap-3">
            <div className="rounded-xl border border-down/30 bg-down/10 p-3 text-center">
              <div className="text-2xl font-semibold tabular-nums text-down">{num(t.DELETE)}</div>
              <div className="text-[10px] uppercase tracking-wide text-flat">Now</div>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-center">
              <div className="text-2xl font-semibold tabular-nums text-amber-300">
                {num(w.count)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-flat">Watchlist</div>
            </div>
            <div className="rounded-xl border border-ink-line bg-black/20 p-3 text-center">
              <div className="text-2xl font-semibold tabular-nums text-slate-200">
                {num(t.DELETE + w.count)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-flat">Ceiling</div>
            </div>
          </div>
          <div className="space-y-2 text-[13px] text-slate-300">
            <p>
              The {num(t.DELETE)} in DELETE have evidence against them today. The watchlist is a
              further {num(w.count)} that stay on the site for now, because they were produced too
              recently for their numbers to mean anything.
            </p>
            <p className="text-slate-400">{w.note}</p>
            <p className="text-xs text-flat">
              Watchlisted pages sit inside{" "}
              {Object.entries(w.byAction)
                .map(([a, n]) => `${a} (${n.toLocaleString("en-US")})`)
                .join(" and ")}
              , so they keep getting worked on rather than being written off. Each carries its own
              review date, {plan.method.trialDays} days from when it was last modified. The first
              falls due {w.nextReview}. Re-run the generator then: anything still showing nothing
              becomes the next DELETE batch, and anything that started ranking stays.
            </p>
          </div>
        </div>
      </Card>

      {/* ---- the correction, stated up front ---- */}
      <Card title="Why DELETE is small">
        <p className="mb-3 text-[13px] text-slate-300">
          An earlier cut marked 3,255 URLs for deletion because they drew no Search Console
          impressions. That was wrong, for two reasons that are properties of the data rather
          than of the pages. Removal now needs positive evidence, which is why the number is a
          fraction of that — and why the evidence for each of the {num(t.DELETE)} is named below.
        </p>
        <ol className="space-y-2.5 text-[13px] text-slate-300">
          {plan.whyDeleteIsSmall.map((w, i) => (
            <li key={w} className="flex gap-2.5">
              <span className="mt-px shrink-0 font-mono text-[11px] text-brand">{i + 1}</span>
              <span>{w}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Fact label="Never had a fair trial" value={num(m.untestedUrls)} />
          <Fact label="Near-duplicate groups" value={num(m.duplicateGroups)} />
          <Fact label="URLs in those groups" value={num(m.duplicateUrls)} />
          <Fact label="Crowded-topic URLs" value={num(m.crowdedUrls)} />
          <Fact label="Padded variants" value={num(m.paddedVariants)} />
          <Fact label="Orphans (no links in)" value={num(m.orphanUrls)} />
        </div>
      </Card>

      {/* ---- why each page got what it got ---- */}
      <Card title="Why each page got its action">
        <div className="space-y-4">
          {ACTION_ORDER.map((a) => (
            <div key={a}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ACTION_STYLE[a].dot}`} />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  {a}
                </span>
                <span className="text-[11px] tabular-nums text-flat">{num(t[a])}</span>
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

      {/* ---- tiers: the measurement lens, separate from the action ---- */}
      <Card title="What the traffic data alone says">
        <p className="mb-3 text-[13px] text-slate-400">
          Tiers describe measured performance only. They inform the action but no longer decide
          it, because tier E mixes genuinely dead pages with pages that were never measured.
        </p>
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
          Tiers A and B are {num(plan.tiers[0].urls + plan.tiers[1].urls)} pages holding{" "}
          {num(plan.tiers[0].clicks + plan.tiers[1].clicks)} of {num(t.clicks)} clicks. Tier E is{" "}
          {num(plan.tiers[4].urls)} pages, of which {num(m.untestedUrls)} were published or
          modified inside the measurement window.
        </p>
      </Card>

      {/* ---- what the decision is and is not built on ---- */}
      <Card title="What this is decided on">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink-line text-[10px] uppercase tracking-wide text-flat">
                <th className="px-2 py-2 text-left font-medium">Source</th>
                <th className="px-2 py-2 text-left font-medium">What it contributes</th>
                <th className="px-2 py-2 text-left font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              <Source
                name="Search Console"
                gives="Clicks, impressions and position per page. Decides KEEP and the strength ranking."
                state="In use"
                tone="text-up"
              />
              <Source
                name="Ahrefs backlinks"
                gives={`${num(t.backlinked)} URLs with external links, and referring-domain counts where known. A backlinked page can never be deleted and always takes the canonical slot in its duplicate group.`}
                state="In use"
                tone="text-up"
              />
              <Source
                name="Ahrefs Site Audit crawl"
                gives={`${num(m.crawledUrls)} pages a crawler can actually reach. The other ${num(m.orphanUrls)} are orphans with no internal links pointing in, which ranks them below reachable pages of equal strength.`}
                state="In use"
                tone="text-up"
              />
              <Source
                name="Sitemap"
                gives="The full URL set and lastmod, which is what establishes whether a page has had a fair trial."
                state="In use"
                tone="text-up"
              />
              <Source
                name="Google Analytics"
                gives="Sessions, engagement time and conversions per landing page. Would separate pages that get clicks but bounce from pages that actually convert, which no other source here can see."
                state="Not supplied"
                tone="text-down"
              />
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-flat">
          There is no GA export in the workspace, so nothing here is decided on engagement or
          conversion. The only on-site behavioural file is a form-submit audit with no landing-page
          column, so it cannot attribute a lead back to the page that earned it. Export GA4
          Landing page + sessions, engagement rate and conversions for the last 12 months, and
          the same pages can be re-cut on whether they produce anything.
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
              The redirect export on hand holds 25 rows, not the ~1,800 live in the plugin.
              Redirect classification is blocked until a full export exists. Nothing else is.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function Source({
  name,
  gives,
  state,
  tone,
}: {
  name: string;
  gives: string;
  state: string;
  tone: string;
}) {
  return (
    <tr className="border-b border-ink-line/50 last:border-0">
      <td className="whitespace-nowrap px-2 py-2 font-medium text-slate-200">{name}</td>
      <td className="px-2 py-2 text-[12.5px] text-slate-400">{gives}</td>
      <td className={`whitespace-nowrap px-2 py-2 text-[12px] font-medium ${tone}`}>{state}</td>
    </tr>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-line bg-black/20 p-2.5">
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
      <div className="text-[10.5px] leading-snug text-flat">{label}</div>
    </div>
  );
}
