import { arrow, signed } from "@/lib/format";

/**
 * DeltaBadge — small coloured change indicator.
 * `invert` = true for position (lower is better).
 */
export function DeltaBadge({
  value,
  invert = false,
  digits = 0,
  suffix = "",
  isNew = false,
}: {
  value: number | null | undefined;
  invert?: boolean;
  digits?: number;
  suffix?: string;
  isNew?: boolean;
}) {
  if (isNew) {
    return (
      <span className="inline-flex items-center rounded-md bg-brand/15 px-1.5 py-0.5 text-[11px] font-medium text-brand-soft">
        new
      </span>
    );
  }
  if (value == null) {
    return <span className="text-[11px] text-flat">—</span>;
  }
  const good = value === 0 ? false : invert ? value < 0 : value > 0;
  const bad = value === 0 ? false : invert ? value > 0 : value < 0;
  const cls = good ? "text-up" : bad ? "text-down" : "text-flat";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${cls}`}>
      <span className="text-[9px]">{arrow(value, invert)}</span>
      {signed(value, digits)}
      {suffix}
    </span>
  );
}
