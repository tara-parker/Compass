import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-flat">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-flat/50">/</span>}
          {c.href ? (
            <Link href={c.href} className="transition hover:text-brand-soft">
              {c.label}
            </Link>
          ) : (
            <span className="text-slate-300">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
