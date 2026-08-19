"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeltaBadge } from "./Delta";

export type Row = {
  title: string;
  cluster: string;
  href: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  dClicks: number | null;
  dPosition: number | null;
  isNew: boolean;
};

type SortKey = "clicks" | "impressions" | "position" | "dPosition" | "dClicks";

const PAGE_SIZE = 40;

export default function PagesExplorer({
  rows,
  clusters,
  showCluster = true,
}: {
  rows: Row[];
  clusters: string[];
  showCluster?: boolean;
}) {
  const [q, setQ] = useState("");
  const [cluster, setCluster] = useState("all");
  const [sort, setSort] = useState<SortKey>("clicks");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = rows.filter(
      (x) =>
        (cluster === "all" || x.cluster === cluster) &&
        (!needle ||
          x.title.toLowerCase().includes(needle) ||
          x.href.toLowerCase().includes(needle)),
    );
    r = [...r].sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      const an = av == null ? (asc ? Infinity : -Infinity) : av;
      const bn = bv == null ? (asc ? Infinity : -Infinity) : bv;
      return asc ? an - bn : bn - an;
    });
    return r;
  }, [rows, q, cluster, sort, asc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pageCount - 1);
  const slice = filtered.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);

  const setSortKey = (k: SortKey) => {
    if (k === sort) setAsc(!asc);
    else {
      setSort(k);
      setAsc(k === "position");
    }
    setPage(0);
  };

  const Th = ({ k, label, cls = "" }: { k: SortKey; label: string; cls?: string }) => (
    <th
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium text-slate-400 hover:text-slate-200 ${cls}`}
      onClick={() => setSortKey(k)}
    >
      {label} {sort === k ? (asc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search pages…"
          className="w-56 rounded-lg border border-ink-line bg-ink-soft px-3 py-1.5 text-sm text-slate-200 outline-none placeholder:text-flat focus:border-brand/60"
        />
        {showCluster && (
          <select
            value={cluster}
            onChange={(e) => {
              setCluster(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-ink-line bg-ink-soft px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-brand/60"
          >
            <option value="all">All clusters</option>
            {clusters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <span className="ml-auto text-xs text-flat">
          {filtered.length.toLocaleString()} pages
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-line">
        <table className="w-full text-sm sm:min-w-[720px]">
          <thead className="bg-ink-soft/70 text-left text-xs">
            <tr>
              <th className="px-3 py-2 font-medium text-slate-400">Page</th>
              {showCluster && (
                <th className="hidden px-3 py-2 font-medium text-slate-400 md:table-cell">
                  Cluster
                </th>
              )}
              <Th k="position" label="Pos" cls="text-right" />
              <Th k="dPosition" label="Δ Pos" cls="hidden text-right sm:table-cell" />
              <Th k="clicks" label="Clicks" cls="text-right" />
              <Th k="dClicks" label="Δ Clk" cls="hidden text-right sm:table-cell" />
              <Th k="impressions" label="Impr" cls="hidden text-right md:table-cell" />
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr
                key={r.href + i}
                className="border-t border-ink-line/70 hover:bg-white/[0.03]"
              >
                <td className="max-w-[180px] px-3 py-2 sm:max-w-[340px]">
                  <Link href={r.href} className="text-slate-200 hover:text-brand-soft">
                    <span className="line-clamp-1">{r.title}</span>
                  </Link>
                </td>
                {showCluster && (
                  <td className="hidden px-3 py-2 md:table-cell">
                    <Link
                      href={`/c/${r.cluster}`}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300 hover:text-white"
                    >
                      {r.cluster}
                    </Link>
                  </td>
                )}
                <td className="px-3 py-2 text-right tabular-nums text-slate-200">
                  {r.position == null ? "-" : r.position.toFixed(1)}
                </td>
                <td className="hidden px-3 py-2 text-right sm:table-cell">
                  <DeltaBadge value={r.dPosition} invert digits={1} isNew={r.isNew} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-200">
                  {r.clicks ?? 0}
                </td>
                <td className="hidden px-3 py-2 text-right sm:table-cell">
                  <DeltaBadge value={r.dClicks} isNew={r.isNew} />
                </td>
                <td className="hidden px-3 py-2 text-right tabular-nums text-slate-400 md:table-cell">
                  {(r.impressions ?? 0).toLocaleString()}
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-flat">
                  No pages match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage(Math.max(0, cur - 1))}
            disabled={cur === 0}
            className="rounded-lg border border-ink-line px-3 py-1 text-slate-300 disabled:opacity-40 hover:enabled:bg-white/5"
          >
            Prev
          </button>
          <span className="text-flat">
            {cur + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, cur + 1))}
            disabled={cur >= pageCount - 1}
            className="rounded-lg border border-ink-line px-3 py-1 text-slate-300 disabled:opacity-40 hover:enabled:bg-white/5"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
