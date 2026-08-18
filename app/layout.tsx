import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getPeriods } from "@/lib/content";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Compass — ChatFin pages tracking",
  description:
    "ChatFin pages tracking: cluster, main and sub pages tracked over time.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/clusters", label: "Clusters" },
  { href: "/pages", label: "Pages" },
  { href: "/keywords", label: "Keywords" },
  { href: "/updated", label: "Updated" },
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
    <html lang="en" className={poppins.variable}>
      <body>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8">
          <header className="py-4 sm:py-5">
            {/* brand + latest window share one row; nav scrolls sideways on phones */}
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-baseline gap-2.5">
                <span className="text-lg font-semibold tracking-tight text-white">
                  Compass
                </span>
                <span className="hidden text-xs text-flat sm:inline">
                  ChatFin pages tracking
                </span>
              </Link>
              {latest && (
                <span className="shrink-0 rounded-full border border-ink-line bg-ink-soft px-2.5 py-1 text-[11px] text-slate-400 sm:px-3 sm:text-xs">
                  <span className="hidden sm:inline">Latest: </span>
                  <span className="text-slate-200">{latest.label}</span>
                </span>
              )}
            </div>
            <nav className="-mx-5 mt-2 flex items-center gap-1 overflow-x-auto px-5 pb-1 text-sm [scrollbar-width:none] sm:mx-0 sm:mt-3 sm:flex-wrap sm:overflow-visible sm:px-0">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </header>

          <main className="flex-1 pb-16">{children}</main>

          <footer className="border-t border-ink-line py-6 text-xs text-flat">
            Compass · ChatFin pages tracking · data from Google Search
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
