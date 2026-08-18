import Link from "next/link";
import {
  getUpdatedPages,
  getUpdateLog,
  routeForUrl,
  type UpdatedPage,
} from "@/lib/content";
import { num, pos } from "@/lib/format";
import { Card } from "../components/StatCard";
import { Breadcrumbs } from "../components/Breadcrumbs";

export const metadata = { title: "Updated · Compass" };

const KIND_STYLE: Record<string, string> = {
  added: "border-brand/30 bg-brand/10 text-brand-soft",
  improved: "border-up/30 bg-up/10 text-up",
  declined: "border-down/30 bg-down/10 text-down",
  changed: "border-ink-line bg-white/5 text-flat",
};

/** null means "no export has covered this page yet" — shown, not hidden. */
function Cell({ value, format }: { value: number | null; format: "pos" | "num" }) {
  if (value === null) {
    return <span className="text-flat/60" title="No data yet">—</span>;
  }
  return (
    <span className="tabular-nums text-slate-200">
      {format === "pos" ? pos(value) : num(value)}
    </span>
  );
}

function PageRow({ p }: { p: UpdatedPage }) {
  const route = routeForUrl(p.url);
  const title = (
    <span className="block truncate font-medium text-slate-200 group-hover:text-brand-soft">
      {p.title}
    </span>
  );
  return (
    <div className="group border-b border-ink-line/60 px-3 py-3 last:border-0 sm:px-4">
      {/* stacked on mobile, columnar from sm up */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          {route ? <Link href={route}>{title}</Link> : title}
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block truncate text-[11px] text-flat hover:text-brand-soft"
          >
            {p.url.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <dl className="flex shrink-0 items-center gap-4 text-xs sm:gap-5">
          <div className="flex items-center gap-1.5 sm:block sm:w-14 sm:text-right">
            <dt className="text-flat sm:text-[10px] sm:uppercase sm:tracking-wide">Pos</dt>
            <dd><Cell value={p.position} format="pos" /></dd>
          </div>
          <div className="flex items-center gap-1.5 sm:block sm:w-12 sm:text-right">
            <dt className="text-flat sm:text-[10px] sm:uppercase sm:tracking-wide">Clicks</dt>
            <dd><Cell value={p.clicks} format="num" /></dd>
          </div>
          <div className="flex items-center gap-1.5 sm:block sm:w-16 sm:text-right">
            <dt className="text-flat sm:text-[10px] sm:uppercase sm:tracking-wide">Impr</dt>
            <dd><Cell value={p.impressions} format="num" /></dd>
          </div>
          <div className="flex items-center gap-1.5 sm:block sm:w-14 sm:text-right">
            <dt className="text-flat sm:text-[10px] sm:uppercase sm:tracking-wide">Kw</dt>
            <dd>
              {p.keywordCount === 0 ? (
                <span className="text-flat/60">—</span>
              ) : (
                <span className="tabular-nums text-slate-200">
                  {p.keywordCount}
                  {p.keywordBest != null && (
                    <span className="text-flat"> · {pos(p.keywordBest)}</span>
                  )}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default function UpdatedPage() {
  const days = getUpdatedPages();
  const log = getUpdateLog();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Breadcrumbs
          items={[{ label: "Overview", href: "/" }, { label: "Updated" }]}
        />
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Updated</h1>
        <p className="max-w-2xl text-sm text-flat">
          Pages published or updated on each date, joined to whatever Search
          Console and keyword data exists. A dash means the page has not appeared
          in an export yet, so its position starts being tracked from the first
          window that includes it.
        </p>
      </div>

      {days.map((day) => {
        const batches = [...new Set(day.pages.map((p) => p.batch))];
        return (
          <section key={day.date} className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-base font-semibold text-white">{day.date}</h2>
              <span className="text-xs text-flat">{day.count} pages</span>
              <span className="rounded-full border border-up/30 bg-up/10 px-2 py-0.5 text-[11px] text-up">
                {day.withData} with data
              </span>
              <span className="rounded-full border border-ink-line bg-white/5 px-2 py-0.5 text-[11px] text-flat">
                {day.awaitingData} awaiting
              </span>
            </div>

            {batches.map((batch) => {
              const rows = day.pages.filter((p) => p.batch === batch);
              return (
                <div key={batch}>
                  <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-flat">
                    {batch} <span className="text-flat/60">({rows.length})</span>
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40">
                    {rows.map((p) => (
                      <PageRow key={p.url} p={p} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {/* auto-detected metric movement, from the Search Console windows */}
      {log.days.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Metric movement
            </h2>
            <p className="text-sm text-flat">
              Detected automatically when a tracked page&apos;s numbers change
              between Search Console windows.
            </p>
          </div>
          {log.days.map((day) => (
            <Card key={day.date} title={day.date}>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(["added", "improved", "declined", "changed"] as const).map(
                  (k) =>
                    day[k] > 0 && (
                      <span
                        key={k}
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE[k]}`}
                      >
                        {day[k]} {k}
                      </span>
                    ),
                )}
              </div>
              <ul className="space-y-1.5">
                {day.movers.slice(0, 10).map((m, i) => (
                  <li key={`${m.slug}-${i}`} className="flex gap-3 text-sm">
                    <Link
                      href={m.cluster ? `/p/${m.cluster}/${m.slug}` : "/"}
                      className="min-w-0 flex-1 truncate text-slate-300 hover:text-brand-soft"
                    >
                      {m.title}
                    </Link>
                    <span className="shrink-0 tabular-nums text-xs text-flat">
                      {pos(m.position)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
