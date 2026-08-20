"use client";

import { useMemo, useState } from "react";
import {
  A27_ORDER, A27_STYLE, TIER_LABEL,
  type Plan27, type P27Action, type P27Erp, type P27Page,
} from "@/lib/plan27";

const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("en-US"));

const TABS = ["Tree", "Update queue", "Create", "Merges", "Removals"] as const;
type Tab = (typeof TABS)[number];

const WAVE_TONE: Record<number, string> = {
  1: "text-emerald-300", 2: "text-sky-300", 3: "text-slate-300",
  4: "text-amber-300", 5: "text-flat",
};

/* ---------------------------------------------------------------- tree ---- */

function ClusterRow({ c }: { c: Plan27["erpTree"][0]["clusters"][0] }) {
  const [open, setOpen] = useState(false);
  const isNew = !c.existing;
  return (
    <div className="border-t border-ink-line/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-white/[0.03]"
      >
        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${isNew ? "bg-brand" : "bg-emerald-400"}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[12px] text-slate-200">{c.url}</span>
          <span className="block truncate text-[11px] text-flat">
            {c.label}
            {c.existing ? ` · update ${c.existing}` : " · create"}
            {c.competing > 1 ? ` · ${c.competing} pages compete` : ""}
          </span>
        </span>
        <span className="shrink-0 text-[11px] text-flat">
          {c.subs.length} sub{c.subs.length === 1 ? "" : "s"}
          {c.sections.length ? ` · ${c.sections.length} sections` : ""}
        </span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-ink-line/40 bg-black/20 px-3 py-2.5 pl-8">
          {c.subs.map((s) => (
            <div key={s.url} className="text-[12px]">
              <div className="font-mono text-slate-300">{s.url}</div>
              <div className="text-[11px] text-flat">
                {s.use} · {s.existing ? <>update <span className="font-mono">{s.existing}</span></> : "create"}
              </div>
            </div>
          ))}
          {c.sections.length > 0 && (
            <div className="pt-1 text-[11px] text-flat">
              <span className="text-slate-400">sections on this hub, not separate URLs:</span>{" "}
              {c.sections.join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErpCard({ e }: { e: P27Erp }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-ink-line bg-black/20">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03]"
      >
        <span className="rounded-md border border-ink-line px-1.5 py-0.5 text-[10px] font-semibold text-brand-soft">
          {e.tier}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-white">{e.erp}</span>
          <span className="block truncate font-mono text-[11px] text-flat">{e.pillar}</span>
        </span>
        <span className="shrink-0 text-right text-[11px] text-flat">
          <span className="text-brand-soft">{e.created} create</span> ·{" "}
          <span className="text-emerald-300">{e.promoted} promote</span>
          <span className="block">{e.clusters.length} clusters</span>
        </span>
      </button>
      {open && (
        <div>
          <div className="border-t border-ink-line/60 bg-black/30 px-3 py-2 text-[11px] text-flat">
            PILLAR{" "}
            {e.pillarExisting ? (
              <>update <span className="font-mono text-slate-300">{e.pillarExisting}</span></>
            ) : (
              <span className="text-brand-soft">create — this ERP has no page at all</span>
            )}
            {e.pillarCompeting > 0 && ` · ${e.pillarCompeting} pages compete for this slot`}
          </div>
          {e.clusters.map((c) => <ClusterRow key={c.url} c={c} />)}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- queue ---- */

const PAGE_LIMIT = 80;

function UpdateQueue({ plan }: { plan: Plan27 }) {
  const [wave, setWave] = useState<number | "all">(1);
  const [act, setAct] = useState<P27Action | "all">("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE_LIMIT);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return plan.pages.filter(
      (p) =>
        (act === "all" || p.a === act) &&
        (wave === "all" || p.w === wave) &&
        (!s || p.p.toLowerCase().includes(s) || p.x.toLowerCase().includes(s)),
    );
  }, [plan.pages, wave, act, q]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", ...A27_ORDER] as const).map((a) => (
          <button
            key={a}
            onClick={() => { setAct(a as P27Action | "all"); setLimit(PAGE_LIMIT); }}
            className={`rounded-lg border px-2.5 py-1 text-[11px] ${
              act === a ? "border-brand/60 bg-brand/10 text-white" : "border-ink-line text-flat hover:text-slate-300"
            }`}
          >
            {a === "all" ? `all ${n(plan.totals.urls)}` : `${a} ${n(plan.totals[a.toLowerCase() as "keep"])}`}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-ink-line" />
        <button
          onClick={() => { setWave("all"); setLimit(PAGE_LIMIT); }}
          className={`rounded-lg border px-2.5 py-1 text-[11px] ${
            wave === "all" ? "border-brand/60 bg-brand/10 text-white" : "border-ink-line text-flat hover:text-slate-300"
          }`}
        >
          all waves
        </button>
        {plan.waves.map((w) => (
          <button
            key={w.w}
            onClick={() => { setWave(w.w); setLimit(PAGE_LIMIT); }}
            title={w.label}
            className={`rounded-lg border px-2.5 py-1 text-[11px] ${
              wave === w.w ? "border-brand/60 bg-brand/10 text-white" : "border-ink-line text-flat hover:text-slate-300"
            }`}
          >
            wave {w.w} · {n(w.n)}
          </button>
        ))}
      </div>

      {wave !== "all" && (
        <p className={`text-[11px] ${WAVE_TONE[wave as number]}`}>
          {plan.waves.find((w) => w.w === wave)?.label}
        </p>
      )}

      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setLimit(PAGE_LIMIT); }}
        placeholder="filter by URL or by what needs changing"
        className="w-full rounded-lg border border-ink-line bg-black/30 px-3 py-2 text-[12px] text-slate-200 placeholder:text-flat focus:border-brand/60 focus:outline-none"
      />

      <p className="text-[11px] text-flat">{n(rows.length)} pages</p>

      <div className="divide-y divide-ink-line/60 overflow-hidden rounded-xl border border-ink-line">
        {rows.slice(0, limit).map((p) => <PageRow key={p.p} p={p} />)}
      </div>
      {rows.length > limit && (
        <button
          onClick={() => setLimit((l) => l + 200)}
          className="w-full rounded-lg border border-ink-line py-2 text-[11px] text-flat hover:text-slate-300"
        >
          show 200 more of {n(rows.length - limit)}
        </button>
      )}
    </div>
  );
}

function PageRow({ p }: { p: P27Page }) {
  const st = A27_STYLE[p.a];
  return (
    <div className="flex items-start gap-3 bg-black/20 px-3 py-2.5">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <a
            href={`https://chatfin.ai${p.p}`}
            target="_blank"
            rel="noreferrer"
            className="truncate font-mono text-[12px] text-slate-200 hover:text-brand-soft"
          >
            {p.p}
          </a>
          {p.r && (
            <span className="rounded border border-ink-line px-1 text-[10px] text-brand-soft">{p.r}</span>
          )}
          {p.b === 1 && <span className="text-[10px] text-emerald-300">backlinked</span>}
          {p.ni === 1 && <span className="text-[10px] text-amber-300">not indexed</span>}
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-flat">{p.x}</p>
        {p.pa && <p className="text-[10px] text-slate-500">links up to <span className="font-mono">{p.pa}</span></p>}
      </div>
      <div className="shrink-0 text-right text-[10px] leading-tight text-flat">
        <div>{n(p.c)} clk</div>
        <div>{n(p.i)} impr</div>
        <div>{n(p.v)} views</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- others ---- */

function CreateList({ plan }: { plan: Plan27 }) {
  const [prio, setPrio] = useState<number | "all">(1);
  const rows = plan.create.filter((c) => prio === "all" || c.prio === prio);
  const counts = [1, 2, 3, 4].map((p) => plan.create.filter((c) => c.prio === p).length);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPrio("all")}
          className={`rounded-lg border px-2.5 py-1 text-[11px] ${prio === "all" ? "border-brand/60 bg-brand/10 text-white" : "border-ink-line text-flat"}`}
        >
          all {n(plan.create.length)}
        </button>
        {[1, 2, 3, 4].map((p) => (
          <button
            key={p}
            onClick={() => setPrio(p)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] ${prio === p ? "border-brand/60 bg-brand/10 text-white" : "border-ink-line text-flat"}`}
          >
            P{p} · {n(counts[p - 1])}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-flat">
        {n(rows.length)} pages to create. Build P1, measure the indexed ratio, then release P2.
      </p>
      <div className="divide-y divide-ink-line/60 overflow-hidden rounded-xl border border-ink-line">
        {rows.slice(0, 400).map((c) => (
          <div key={c.url} className="flex items-start gap-3 bg-black/20 px-3 py-2">
            <span className="mt-0.5 shrink-0 rounded border border-ink-line px-1 text-[10px] text-brand-soft">
              {c.level}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-[12px] text-slate-200">{c.url}</div>
              <div className="truncate text-[11px] text-flat">
                {c.erp ? `${c.erp} · ` : ""}{c.what} — {c.why}
              </div>
            </div>
            <span className="shrink-0 text-[10px] text-flat">P{c.prio}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MergeList({ plan }: { plan: Plan27 }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-flat">
        {n(plan.merges.length)} redirects. Validated: no self loops, no chains, no backlinked source,
        no source with clicks. Publish the target first, apply the 301 second.
      </p>
      <div className="divide-y divide-ink-line/60 overflow-hidden rounded-xl border border-ink-line">
        {plan.merges.slice(0, 400).map((m) => (
          <div key={m.s} className="bg-black/20 px-3 py-2 text-[12px]">
            <div className="truncate font-mono text-slate-300">{m.s}</div>
            <div className="truncate font-mono text-[11px] text-brand-soft">↳ {m.t}</div>
            <div className="text-[10px] text-flat">{m.why}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RemovalList({ plan }: { plan: Plan27 }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200/90">
        <strong className="text-amber-200">Nothing here is actioned.</strong> Each page is not indexed,
        has zero clicks, zero impressions and zero views, carries no external link in any export on disk,
        and another page already targets its core search term. The competing sibling is named so you can
        compare before deciding. The backlink check is only as good as the Ahrefs export on disk, which
        is page one.
      </div>
      <div className="divide-y divide-ink-line/60 overflow-hidden rounded-xl border border-ink-line">
        {plan.removals.map((r) => (
          <div key={r.url} className="bg-black/20 px-3 py-2.5 text-[12px]">
            <a
              href={`https://chatfin.ai${r.url}`}
              target="_blank"
              rel="noreferrer"
              className="block truncate font-mono text-slate-200 hover:text-brand-soft"
            >
              {r.url}
            </a>
            <div className="text-[11px] text-flat">
              core term <span className="text-slate-300">{r.core}</span> · {r.competing} pages compete
              {r.earners > 0 && ` · ${r.earners} of them earn`}
            </div>
            <div className="truncate text-[10px] text-slate-500">
              strongest sibling: <span className="font-mono">{r.sibling}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- root ---- */

export default function Plan27Explorer({ plan }: { plan: Plan27 }) {
  const [tab, setTab] = useState<Tab>("Tree");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 border-b border-ink-line pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-[12px] ${
              tab === t ? "bg-brand/15 text-white" : "text-flat hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Tree" && (
        <div className="space-y-4">
          <p className="text-[11px] text-flat">
            {n(plan.totals.treeUrls)} tree URLs, no duplicates. {n(plan.totals.promoted)} existing pages
            are promoted into nodes, {n(plan.totals.create)} are created. Open an ERP, then a cluster.
          </p>
          {(["A", "B", "C"] as const).map((tier) => {
            const es = plan.erpTree.filter((e) => e.tier === tier);
            if (!es.length) return null;
            return (
              <div key={tier} className="space-y-2">
                <h3 className="text-[11px] uppercase tracking-wide text-flat">
                  Tier {tier} — {TIER_LABEL[tier]}
                </h3>
                {es.map((e) => <ErpCard key={e.erp} e={e} />)}
              </div>
            );
          })}
          <div className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wide text-flat">
              Non-ERP tree — the side that actually earns
            </h3>
            {plan.nonTree.map((p) => (
              <div key={p.url} className="overflow-hidden rounded-xl border border-ink-line bg-black/20">
                <div className="px-3 py-2">
                  <div className="font-mono text-[12px] text-slate-200">{p.url}</div>
                  <div className="text-[11px] text-flat">
                    {p.label} · {p.existing ? "update existing" : "create"} · {p.subs.length} hubs
                  </div>
                </div>
                {p.subs.length > 0 && (
                  <div className="border-t border-ink-line/60 bg-black/30 px-3 py-2 pl-6">
                    {p.subs.map((s) => (
                      <div key={s.url} className="text-[11px]">
                        <span className="font-mono text-slate-300">{s.url}</span>
                        <span className="text-flat"> · {s.label} · {s.existing ? "update" : "create"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Update queue" && <UpdateQueue plan={plan} />}
      {tab === "Create" && <CreateList plan={plan} />}
      {tab === "Merges" && <MergeList plan={plan} />}
      {tab === "Removals" && <RemovalList plan={plan} />}
    </div>
  );
}
