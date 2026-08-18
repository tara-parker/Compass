import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getPeriods } from "@/lib/content";

export const metadata: Metadata = {
  title: "Compass — ChatFin rank tracker",
  description:
    "Markdown-first SEO rank tracker: cluster, main and sub pages tracked over time.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/clusters", label: "Clusters" },
  { href: "/pages", label: "Pages" },
  { href: "/keywords", label: "Keywords" },
  { href: "/content", label: "Content" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const periods = getPeriods();
  const latest = periods[periods.length - 1];
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8">
          <header className="flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 4v3M12 17v3M4 12h3M17 12h3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15 9l-2.2 3.8L9 15l2.2-3.8L15 9z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                Compass
              </span>
              <span className="hidden text-xs text-flat sm:inline">
                ChatFin rank tracker
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            {latest && (
              <span className="ml-auto rounded-full border border-ink-line bg-ink-soft px-3 py-1 text-xs text-slate-400">
                Latest: <span className="text-slate-200">{latest.label}</span>
              </span>
            )}
          </header>

          <main className="flex-1 pb-16">{children}</main>

          <footer className="border-t border-ink-line py-6 text-xs text-flat">
            Compass · markdown-first rank tracker · data from Google Search
            Console exports. Re-run{" "}
            <code className="rounded bg-ink-soft px-1.5 py-0.5 text-slate-300">
              npm run ingest
            </code>{" "}
            after adding a new export.
          </footer>
        </div>
      </body>
    </html>
  );
}
