import Link from "next/link";
import { notFound } from "next/navigation";
import { browse } from "@/lib/browse";
import { Card } from "../../components/StatCard";
import { Breadcrumbs, type Crumb } from "../../components/Breadcrumbs";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export const metadata = { title: "Content · Compass" };

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const res = browse(slug);

  if (res.kind === "missing") notFound();

  const crumbs: Crumb[] = [{ label: "content", href: "/content" }];
  slug.forEach((s, i) => {
    const isLast = i === slug.length - 1;
    crumbs.push({
      label: s,
      href: isLast ? undefined : "/content/" + slug.slice(0, i + 1).join("/"),
    });
  });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Breadcrumbs items={crumbs} />
        <p className="text-xs text-flat">
          Nested markdown content tree — the source of truth for every tracked page.
        </p>
      </div>

      {res.kind === "dir" ? (
        <Card title={`${res.entries.length} entries`}>
          <ul className="divide-y divide-ink-line/60">
            {res.entries.map((e) => (
              <li key={e.slug.join("/")}>
                <Link
                  href={`/content/${e.slug.join("/")}`}
                  className="flex items-center gap-3 py-2.5 hover:text-brand-soft"
                >
                  <span className="text-flat">
                    {e.isDir ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 text-slate-200">{e.name}</span>
                  {e.isDir && e.count != null && (
                    <span className="text-xs text-flat">{e.count} pages</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <details className="mb-4 rounded-xl border border-ink-line bg-black/20 p-3">
            <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-flat">
              Frontmatter
            </summary>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-300">
              {JSON.stringify(res.data, null, 2)}
            </pre>
          </details>
          <MarkdownRenderer>{res.content}</MarkdownRenderer>
        </Card>
      )}
    </div>
  );
}
