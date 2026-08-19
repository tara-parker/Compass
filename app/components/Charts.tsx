import type { Daily } from "@/lib/types";

/** Sparkline - tiny inline trend line. */
export function Sparkline({
  values,
  width = 88,
  height = 24,
  invert = false,
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
  invert?: boolean;
}) {
  const pts = values.filter((v): v is number => v != null);
  if (pts.length < 2) {
    return <span className="text-[11px] text-flat">-</span>;
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const step = width / (pts.length - 1);
  const y = (v: number) => {
    const t = (v - min) / range;
    return height - (invert ? 1 - t : t) * (height - 4) - 2;
  };
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const first = pts[0];
  const last = pts[pts.length - 1];
  const rising = last > first;
  const good = invert ? !rising : rising;
  const stroke = last === first ? "#94a3b8" : good ? "#22c55e" : "#ef4444";
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(pts.length - 1) * step} cy={y(last)} r="2" fill={stroke} />
    </svg>
  );
}

/** Full daily line chart with two series (clicks + impressions) and axis. */
export function DailyChart({ daily }: { daily: Daily[] }) {
  if (daily.length < 2) return null;
  const W = 760;
  const H = 240;
  const padL = 44;
  const padR = 44;
  const padT = 16;
  const padB = 28;
  const n = daily.length;

  const clicks = daily.map((d) => d.clicks);
  const impr = daily.map((d) => d.impressions);
  const maxClicks = Math.max(...clicks, 1);
  const maxImpr = Math.max(...impr, 1);

  const x = (i: number) => padL + (i * (W - padL - padR)) / (n - 1);
  const yC = (v: number) => H - padB - (v / maxClicks) * (H - padT - padB);
  const yI = (v: number) => H - padB - (v / maxImpr) * (H - padT - padB);

  const line = (vals: number[], fn: (v: number) => number) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${fn(v).toFixed(1)}`).join(" ");

  const area = (vals: number[], fn: (v: number) => number) =>
    `${line(vals, fn)} L${x(n - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;

  const gridYs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px] sm:min-w-[640px]" role="img" aria-label="Daily clicks and impressions">
        <defs>
          <linearGradient id="imprFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b8cff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#5b8cff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((g, i) => {
          const yy = padT + g * (H - padT - padB);
          return (
            <g key={i}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#1c2440" strokeWidth="1" />
              <text x={padL - 8} y={yy + 3} textAnchor="end" fontSize="9" fill="#64748b">
                {Math.round(maxImpr * (1 - g)).toLocaleString()}
              </text>
              <text x={W - padR + 8} y={yy + 3} textAnchor="start" fontSize="9" fill="#64748b">
                {Math.round(maxClicks * (1 - g))}
              </text>
            </g>
          );
        })}

        <path d={area(impr, yI)} fill="url(#imprFill)" />
        <path d={line(impr, yI)} fill="none" stroke="#5b8cff" strokeWidth="1.8" />
        <path d={line(clicks, yC)} fill="none" stroke="#22c55e" strokeWidth="1.8" />

        {daily.map((d, i) =>
          i % Math.ceil(n / 8) === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#64748b">
              {d.date.slice(5)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="mt-2 flex gap-4 pl-11 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#5b8cff]" /> Impressions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e]" /> Clicks
        </span>
      </div>
    </div>
  );
}
