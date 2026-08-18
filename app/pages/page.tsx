import { getAllPages, getClusters } from "@/lib/content";
import { toRow } from "@/lib/rows";
import PagesExplorer from "../components/PagesExplorer";

export const metadata = { title: "Pages · Compass" };

export default function AllPagesPage() {
  const rows = getAllPages().map(toRow);
  const clusters = getClusters().map((c) => c.cluster);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">All pages</h1>
        <p className="mt-1 text-sm text-slate-400">
          {rows.length.toLocaleString()} tracked pages. Search, filter by cluster, sort any column.
        </p>
      </div>
      <PagesExplorer rows={rows} clusters={clusters} />
    </div>
  );
}
