import { getKeywords } from "@/lib/content";
import { Card } from "../components/StatCard";

export const metadata = { title: "Keywords · Compass" };

function posBadge(p: number | null) {
  if (p == null || p === 0) return <span className="text-flat">—</span>;
  const cls =
    p <= 3 ? "bg-up/15 text-up" : p <= 10 ? "bg-brand/15 text-brand-soft" : "bg-white/5 text-slate-300";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${cls}`}>#{p}</span>;
}

export default function KeywordsPage() {
  const kw = getKeywords();
  const summary = [...kw.summary].sort(
    (a, b) => (a.best_position ?? 999) - (b.best_position ?? 999),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Keyword rankings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tracked target keywords and the ChatFin pages that surface for them.
          {kw.source ? ` Source: ${kw.source}.` : ""}
        </p>
      </div>

      {summary.length > 0 && (
        <Card title="Keywords ChatFin ranks for">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr className="border-b border-ink-line">
                  <th className="px-2 py-2 font-medium">Keyword</th>
                  <th className="px-2 py-2 text-right font-medium">Best pos</th>
                  <th className="px-2 py-2 text-right font-medium">Pages ranking</th>
                  <th className="px-2 py-2 font-medium">Variation that surfaced it</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i} className="border-b border-ink-line/60 hover:bg-white/[0.03]">
                    <td className="px-2 py-2 font-medium text-slate-200">{s.keyword}</td>
                    <td className="px-2 py-2 text-right">{posBadge(s.best_position)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-400">
                      {s.pages_ranking ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-slate-400">{s.variation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title={`Full tracked list (${kw.tracked.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-slate-400">
              <tr className="border-b border-ink-line">
                <th className="px-2 py-2 font-medium">Keyword</th>
                <th className="px-2 py-2 font-medium">ChatFin URL</th>
                <th className="px-2 py-2 text-right font-medium">Position</th>
              </tr>
            </thead>
            <tbody>
              {kw.tracked.map((t, i) => (
                <tr key={i} className="border-b border-ink-line/60 hover:bg-white/[0.03]">
                  <td className="px-2 py-2 text-slate-200">{t.keyword}</td>
                  <td className="max-w-[360px] truncate px-2 py-2 text-slate-500">
                    {t.url && t.url !== "no rank" ? (
                      <a href={t.url} target="_blank" rel="noreferrer" className="hover:text-brand-soft">
                        {t.url}
                      </a>
                    ) : (
                      <span className="text-flat">not ranking</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {t.position && t.position > 0 ? posBadge(t.position) : <span className="text-flat">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
