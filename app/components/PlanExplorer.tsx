"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Link from "next/link";
import {
  ACTION_ORDER,
  ACTION_STYLE,
  type Plan,
  type PlanAction,
  type PlanCluster,
  type PlanCounts,
  type PlanPage,
  type PlanSub,
} from "@/lib/plan";

const PAGE_LIMIT = 60;

/** Reason lookup, so every page row can say why it got its action. */
const ReasonCtx = createContext<Record<string, string>>({});

function n(v: number | null | undefined) {
  return v == null ? "—" : v.toLocaleString("en-US");
}

/** Proportional bar of the four actions. Encodes the mix at a glance. */
export function ActionBar({ counts, total }: { counts: PlanCounts; total: number }) {
  if (!total) return null;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-black/40">
      {ACTION_ORDER.map((a) =>
        counts[a] ? (
          <div
            key={a}
            className={ACTION_STYLE[a].bar}
            style={{ width: `${(counts[a] / total) * 100}%` }}
            title={`${a} ${counts[a]}`}
          />
        ) : null,
      )}
    </div>
  );
}

function ActionChip({ action, count }: { action: PlanAction; count?: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${ACTION_STYLE[action].chip}`}
    >
      {action}
      {count != null && <span className="tabular-nums opacity-80">{count}</span>}
    </span>
  );
}

function CountStrip({ counts }: { counts: PlanCounts }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ACTION_ORDER.filter((a) => counts[a] > 0).map((a) => (
        <ActionChip key={a} action={a} count={counts[a]} />
      ))}
    </div>
  );
}

function PageRow({ pg, depth }: { pg: PlanPage; depth: number }) {
  const reason = useContext(ReasonCtx)[pg.r];
  return (
    <div
      className="grid grid-cols-[1fr_auto] items-start gap-2 border-t border-ink-line/50 py-2 sm:grid-cols-[1fr_72px_78px_58px_84px] sm:items-center"
      style={{ paddingLeft: `${depth * 12}px` }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {pg.b === 1 && (
            <span
              className="shrink-0 rounded bg-up/15 px-1 py-px text-[9px] font-semibold text-up"
              title="Has external backlinks — never delete"
            >
              LINK
            </span>
          )}
          {pg.d === 1 && (
            <span
              className="shrink-0 rounded bg-amber-400/15 px-1 py-px text-[9px] font-semibold text-amber-300"
              title="Member of a near-duplicate group"
            >
              DUP
            </span>
          )}
          <span className="truncate text-[13px] text-slate-200">{pg.t}</span>
        </div>
        <a
          href={`https://chatfin.ai${pg.p}`}
          target="_blank"
          rel="noreferrer"
          className="block truncate font-mono text-[10.5px] text-flat transition hover:text-brand-soft"
        >
          {pg.p}
        </a>
        {reason && <div className="truncate text-[10.5px] italic text-flat/80">{reason}</div>}
      </div>
      <div className="sm:hidden">
        <ActionChip action={pg.s} />
      </div>
      <div className="hidden tabular-nums text-right text-[12px] text-slate-300 sm:block">
        {pg.c ? n(pg.c) : <span className="text-flat">0</span>}
      </div>
      <div className="hidden tabular-nums text-right text-[12px] text-slate-300 sm:block">
        {pg.i ? n(pg.i) : <span className="text-flat">0</span>}
      </div>
      <div className="hidden tabular-nums text-right text-[12px] text-slate-300 sm:block">
        {pg.o == null ? <span className="text-flat">—</span> : pg.o.toFixed(1)}
      </div>
      <div className="hidden justify-end sm:flex">
        <ActionChip action={pg.s} />
      </div>
    </div>
  );
}

function PageList({ pages, depth }: { pages: PlanPage[]; depth: number }) {
  const [limit, setLimit] = useState(PAGE_LIMIT);
  if (!pages.length) return null;
  return (
    <div>
      <div
        className="hidden grid-cols-[1fr_72px_78px_58px_84px] gap-2 border-t border-ink-line/50 pb-1 pt-2 text-[10px] uppercase tracking-wide text-flat sm:grid"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <span>Page</span>
        <span className="text-right">Clicks</span>
        <span className="text-right">Impr</span>
        <span className="text-right">Pos</span>
        <span className="text-right">Status</span>
      </div>
      {pages.slice(0, limit).map((pg) => (
        <PageRow key={pg.p} pg={pg} depth={depth} />
      ))}
      {pages.length > limit && (
        <button
          onClick={() => setLimit(limit + 200)}
          className="mt-2 rounded-lg border border-ink-line px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand/40 hover:text-white"
          style={{ marginLeft: `${depth * 12}px` }}
        >
          Show more · {(pages.length - limit).toLocaleString("en-US")} hidden
        </button>
      )}
    </div>
  );
}

function SubNode({ sub, counts }: { sub: PlanSub; counts: PlanCounts }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-ink-line/60 bg-black/15">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-white/[0.03]"
      >
        <span className="w-3 shrink-0 text-[10px] text-flat">{open ? "▾" : "▸"}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-slate-200">{sub.title}</span>
          <span className="block truncate font-mono text-[10px] text-flat">/{sub.sub}/</span>
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-flat">
          {n(sub.pages.length)} of {n(sub.urls)}
        </span>
        <span className="hidden shrink-0 sm:block">
          <CountStrip counts={counts} />
        </span>
      </button>
      <div className="px-3 pb-2">
        <ActionBar counts={counts} total={sub.pages.length} />
      </div>
      {open && (
        <div className="px-3 pb-3">
          <PageList pages={sub.pages} depth={1} />
        </div>
      )}
    </div>
  );
}

function ClusterNode({ cluster }: { cluster: PlanCluster }) {
  const [open, setOpen] = useState(false);

  // Counts are recomputed from the filtered pages actually present, so the
  // chips always describe what is on screen rather than the unfiltered totals.
  const { counts, shown } = useMemo(() => {
    const c: PlanCounts = { KEEP: 0, UPDATE: 0, MERGE: 0, DELETE: 0 };
    let total = 0;
    for (const pg of cluster.pages) { c[pg.s]++; total++; }
    for (const s of cluster.subs) for (const pg of s.pages) { c[pg.s]++; total++; }
    return { counts: c, shown: total };
  }, [cluster]);

  const subCounts = (s: PlanSub) => {
    const c: PlanCounts = { KEEP: 0, UPDATE: 0, MERGE: 0, DELETE: 0 };
    for (const pg of s.pages) c[pg.s]++;
    return c;
  };

  return (
    <section className="rounded-2xl border border-ink-line bg-ink-soft/40">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.02]"
      >
        <span className="w-3 shrink-0 text-xs text-flat">{open ? "▾" : "▸"}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate font-semibold text-white">{cluster.title}</span>
            <span className="shrink-0 font-mono text-[10px] text-flat">/{cluster.cluster}/</span>
          </span>
          <span className="mt-0.5 block text-[11px] text-flat">
            {n(shown)} of {n(cluster.urls)} URLs
            {cluster.subs.length > 0 && ` · ${cluster.subs.length} sub-clusters`}
            {cluster.backlinked > 0 && ` · ${cluster.backlinked} backlinked`}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[11px] text-flat">clicks / impr</span>
          <span className="block text-[12px] tabular-nums text-slate-300">
            {n(cluster.clicks)} / {n(cluster.impressions)}
          </span>
        </span>
      </button>

      <div className="px-4 pb-3">
        <div className="mb-2">
          <CountStrip counts={counts} />
        </div>
        <ActionBar counts={counts} total={shown} />
      </div>

      {open && (
        <div className="space-y-2 px-4 pb-4">
          {cluster.subs.map((s) => (
            <SubNode key={s.sub} sub={s} counts={subCounts(s)} />
          ))}
          {cluster.pages.length > 0 && (
            <div className="rounded-xl border border-ink-line/60 bg-black/15 px-3 pb-3 pt-1">
              {cluster.subs.length > 0 && (
                <div className="pt-2 text-[11px] text-flat">Directly under /{cluster.cluster}/</div>
              )}
              <PageList pages={cluster.pages} depth={0} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function PlanExplorer({ plan }: { plan: Plan }) {
  const [q, setQ] = useState("");
  const [action, setAction] = useState<PlanAction | "all">("all");
  const [tier, setTier] = useState<string>("all");
  const [linkedOnly, setLinkedOnly] = useState(false);

  const clusters = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const keep = (pg: PlanPage) =>
      (action === "all" || pg.s === action) &&
      (tier === "all" || pg.k === tier) &&
      (!linkedOnly || pg.b === 1) &&
      (!needle || pg.p.toLowerCase().includes(needle) || pg.t.toLowerCase().includes(needle));

    return plan.clusters
      .map((c) => ({
        ...c,
        pages: c.pages.filter(keep),
        subs: c.subs
          .map((s) => ({ ...s, pages: s.pages.filter(keep) }))
          .filter((s) => s.pages.length > 0),
      }))
      .filter((c) => c.pages.length > 0 || c.subs.length > 0);
  }, [plan, q, action, tier, linkedOnly]);

  const matched = useMemo(
    () =>
      clusters.reduce(
        (t, c) => t + c.pages.length + c.subs.reduce((u, s) => u + s.pages.length, 0),
        0,
      ),
    [clusters],
  );

  const filtering = action !== "all" || tier !== "all" || linkedOnly || q.trim() !== "";

  return (
    <ReasonCtx.Provider value={plan.reasons}>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search paths and titles…"
          className="w-full rounded-lg border border-ink-line bg-ink-soft px-3 py-1.5 text-sm text-slate-200 outline-none placeholder:text-flat focus:border-brand/60 sm:w-64"
        />

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setAction("all")}
            className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${
              action === "all"
                ? "border-brand/50 bg-brand/10 text-white"
                : "border-ink-line text-slate-300 hover:text-white"
            }`}
          >
            All actions
          </button>
          {ACTION_ORDER.map((a) => (
            <button
              key={a}
              onClick={() => setAction(action === a ? "all" : a)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${
                action === a ? ACTION_STYLE[a].chip : "border-ink-line text-slate-300 hover:text-white"
              }`}
            >
              {a} <span className="tabular-nums opacity-70">{plan.totals[a].toLocaleString("en-US")}</span>
            </button>
          ))}
        </div>

        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-lg border border-ink-line bg-ink-soft px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-brand/60"
        >
          <option value="all">All tiers</option>
          {plan.tiers.map((t) => (
            <option key={t.tier} value={t.tier}>
              Tier {t.tier} · {t.urls.toLocaleString("en-US")}
            </option>
          ))}
        </select>

        <button
          onClick={() => setLinkedOnly(!linkedOnly)}
          className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${
            linkedOnly
              ? "border-up/40 bg-up/10 text-up"
              : "border-ink-line text-slate-300 hover:text-white"
          }`}
        >
          Backlinked only
        </button>
      </div>

      <p className="text-xs text-flat">
        {filtering ? (
          <>
            <span className="text-slate-200">{matched.toLocaleString("en-US")}</span> of{" "}
            {plan.totals.urls.toLocaleString("en-US")} URLs match, across {clusters.length} clusters.
          </>
        ) : (
          <>
            {plan.totals.urls.toLocaleString("en-US")} URLs across {clusters.length} clusters. Open a
            cluster to see its sub-clusters and pages.
          </>
        )}
      </p>

      <div className="space-y-3">
        {clusters.map((c) => (
          <ClusterNode key={c.cluster} cluster={c} />
        ))}
        {clusters.length === 0 && (
          <p className="rounded-2xl border border-ink-line bg-ink-soft/40 p-6 text-center text-sm text-flat">
            Nothing matches those filters.
          </p>
        )}
      </div>
    </div>
    </ReasonCtx.Provider>
  );
}
