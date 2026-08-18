import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div>
        <p className="text-5xl font-semibold text-white">404</p>
        <p className="mt-2 text-slate-400">That page isn&apos;t being tracked.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg border border-ink-line bg-ink-soft px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
        >
          ← Back to overview
        </Link>
      </div>
    </div>
  );
}
