export function num(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function pos(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(1);
}

export function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n * 100).toFixed(2) + "%";
}

export function signed(n: number | null | undefined, digits = 0): string {
  if (n == null) return "";
  const v = digits ? n.toFixed(digits) : Math.round(n).toString();
  return (n > 0 ? "+" : "") + v;
}

/** For counts/CTR: higher is better. */
export function trendClass(n: number | null | undefined): string {
  if (n == null || n === 0) return "text-flat";
  return n > 0 ? "text-up" : "text-down";
}

/** For position: lower is better, so invert. */
export function posTrendClass(n: number | null | undefined): string {
  if (n == null || n === 0) return "text-flat";
  return n < 0 ? "text-up" : "text-down";
}

export function arrow(n: number | null | undefined, invert = false): string {
  if (n == null || n === 0) return "→";
  const up = invert ? n < 0 : n > 0;
  return up ? "▲" : "▼";
}
