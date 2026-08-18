import { DeltaBadge } from "./Delta";

export function StatCard({
  label,
  value,
  delta,
  invert = false,
  digits = 0,
  suffix = "",
}: {
  label: string;
  value: string;
  delta?: number | null;
  invert?: boolean;
  digits?: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-line bg-ink-soft/60 p-4">
      <div className="text-xs uppercase tracking-wide text-flat">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {delta !== undefined && (
          <DeltaBadge value={delta} invert={invert} digits={digits} suffix={suffix} />
        )}
      </div>
    </div>
  );
}

export function Card({
  title,
  children,
  right,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-ink-line bg-ink-soft/40 p-4 sm:p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold text-slate-200">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
