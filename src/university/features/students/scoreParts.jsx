import { cn } from "@/lib/cn";
import { Caption, Stat } from "@/components/ui/Card";

/**
 * The small pieces the scoreboard and the scorecard both render.
 *
 * Kept together because they encode one decision each, and both screens have
 * to make it the same way: what a missing number looks like, and what colour a
 * grade band is.
 */

/** Rounded here as well as on the server — a raw float must never reach a screen. */
export const fmtPct = (value) => (value == null ? "—" : `${Math.round(value * 10) / 10}%`);
export const fmtScore = (value) => (value == null ? "—" : Number(value).toFixed(1));
export const fmtNum = (value) => (value == null ? "—" : value);

/** Score bands. `none` is a student with nothing to score, not a bad one. */
export const TONES = {
  excellent: { text: "text-success-strong", chip: "bg-success-soft text-success-strong", bar: "bg-success" },
  good: { text: "text-brand-700", chip: "bg-brand-100 text-brand-700", bar: "bg-brand-500" },
  fair: { text: "text-warning-ink", chip: "bg-warning-soft text-warning-ink", bar: "bg-warning" },
  weak: { text: "text-warning-ink", chip: "bg-warning-soft text-warning-ink", bar: "bg-warning" },
  risk: { text: "text-danger", chip: "bg-danger-soft text-danger", bar: "bg-danger" },
  none: { text: "text-ink-faint", chip: "bg-slate-100 text-ink-soft", bar: "bg-slate-300" },
};

export const toneOf = (student) => TONES[student?.tone] ?? TONES.none;

export function ScoreBar({ score, tone }) {
  const meta = TONES[tone] ?? TONES.none;
  return (
    <span className="block h-1.5 min-w-[52px] flex-1 overflow-hidden rounded-full bg-slate-200">
      <span
        className={cn("block h-full rounded-full transition-all duration-500", meta.bar)}
        style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%` }}
      />
    </span>
  );
}

export function GradeBadge({ student, size = "sm" }) {
  const meta = toneOf(student);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold",
        size === "lg" ? "px-3 py-1 text-[13px]" : "px-2.5 py-0.5 text-[11px]",
        meta.chip
      )}
    >
      {student?.grade ?? "–"}
      <span className="font-semibold opacity-80">{student?.gradeLabel}</span>
    </span>
  );
}

const TILE_TONES = {
  brand: "text-brand-700",
  success: "text-success-strong",
  warning: "text-warning-ink",
  danger: "text-danger",
};

export function SummaryTile({ label, value, hint, tone, className }) {
  return (
    <div className={cn("od-card px-4 py-3.5", className)}>
      {/* Caption and Stat are both spans, so they need blocking out here or the
          label and the number run together on one line. */}
      <span className="block">
        <Caption>{label}</Caption>
      </span>
      <Stat className={cn("mt-1 block text-[22px]", TILE_TONES[tone])}>{value}</Stat>
      {hint ? <p className="mt-0.5 text-[11.5px] text-ink-soft">{hint}</p> : null}
    </div>
  );
}
