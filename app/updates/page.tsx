import Link from "next/link";
import { getUpdateLog, type Mover2 } from "@/lib/content";
import { num, pos } from "@/lib/format";
import { Card } from "../components/StatCard";
import { Breadcrumbs } from "../components/Breadcrumbs";

export const metadata = { title: "Update log · Compass" };

const KIND_STYLE: Record<string, string> = {
  added: "border-brand/30 bg-brand/10 text-brand-soft",
  improved: "border-up/30 bg-up/10 text-up",
  declined: "border-down/30 bg-down/10 text-down",
  changed: "border-ink-line bg-white/5 text-flat",
};

function Tag({ kind, count }: { kind: string; count: number }) {
  if (!count) return null;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        KIND_STYLE[kind] ?? KIND_STYLE.changed
      }`}
    >
      {count} {kind}
    </span>
  );
}

function MoverRow({ m }: { m: Mover2 }) {
  const href = m.cluster ? `/p/${m.cluster}/${m.slug}` : "/";
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 border-b border-ink-line/60 px-4 py-2.5 transition last:border-0 hover:bg-white/[0.03]"
    >
      <div className="min-w-0">
        <div className="truncate text-sm text-slate-200 group-hover:text-brand-soft">
          {m.title}
        </div>
        <div className="mt-0.5 truncate text-xs text-flat">{m.detail}</div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <span
          className={`rounded-full border px-2 py-0.5 font-medium ${
            KIND_STYLE[m.kind] ?? KIND_STYLE.changed
          }`}
        >
          {m.kind}
        </span>
        <span className="w-12 text-right tabular-nums text-slate-300">
          {pos(m.position)}
        </span>
        <span className="w-10 text-right tabular-nums text-flat">
          {num(m.clicks)}
        </span>
      </div>
    </Link>
  );
}

export default function UpdatesPage() {
  const log = getUpdateLog();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumbs
          items={[{ label: "Overview", href: "/" }, { label: "Update log" }]}
        />
        <h1 className="text-2xl font-semibold text-white">Update log</h1>
        <p className="max-w-2xl text-sm text-flat">
          Which tracked page moved, and when. Each date is the close of a Search
          Console window, so an entry means the page&apos;s tracked metrics changed
          as of that date. Every page also keeps its own full history on its
          detail view.
        </p>
      </div>

      {log.days.length === 0 && (
        <Card>
          <p className="text-sm text-flat">
            No updates recorded yet. Add an export to{" "}
            <code className="text-slate-300">data/source/</code> and run{" "}
            <code className="text-slate-300">npm run ingest</code>.
          </p>
        </Card>
      )}

      <div className="space-y-5">
        {log.days.map((day) => (
          <section key={day.date}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium text-white">{day.date}</h2>
              <span className="text-xs text-flat">
                {num(day.pagesChanged)} pages changed
              </span>
              <span className="flex flex-wrap gap-1.5">
                <Tag kind="added" count={day.added} />
                <Tag kind="improved" count={day.improved} />
                <Tag kind="declined" count={day.declined} />
                <Tag kind="changed" count={day.changed} />
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40">
              {day.movers.map((m, i) => (
                <MoverRow key={`${m.cluster}/${m.slug}-${i}`} m={m} />
              ))}
            </div>
            {day.pagesChanged > day.movers.length && (
              <p className="mt-1.5 px-1 text-xs text-flat">
                Showing the {day.movers.length} biggest movers of{" "}
                {num(day.pagesChanged)}. Full per-page history lives on each
                page&apos;s detail view.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
