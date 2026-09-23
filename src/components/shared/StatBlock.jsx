import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";
import { Caption, Stat } from "@/components/ui/Card";
import { TrendChip } from "@/components/ui/Badge";

/** Caption + big number + optional trend chip. Reused across every screen. */
export function StatBlock({ label, value, change, accent, className, icon, hint }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1.5">
        {accent ? <span className={cn("h-1 w-3 rounded-full", accent)} /> : null}
        <Caption>{label}</Caption>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {icon}
        <Stat>{value}</Stat>
        {change != null ? <TrendChip value={change} /> : null}
      </div>
      {hint ? <div className="mt-1 text-xs text-ink-soft">{hint}</div> : null}
    </div>
  );
}

const TONES = {
  brand: "bg-brand-100 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info-ink",
  neutral: "bg-slate-100 text-ink-muted",
};

/**
 * The KPI tile every screen opens with.
 *
 * The icon is not decoration and not optional: a row of tiles where some carry
 * a glyph and some do not reads as two different components, and the eye stops
 * on the gap rather than on the numbers. Callers that pass nothing get a
 * neutral mark in the tone's colour, so the row still scans as one row — but
 * the right fix is always to name the thing being counted.
 *
 * Sized to sit two-up on a phone: the padding, the glyph and the number all
 * step up at `sm` rather than the tile wrapping to something else entirely.
 */
export function StatCard({ label, value, change, icon, tone = "brand", hint, className }) {
  return (
    <div
      className={cn(
        "od-card flex min-w-0 flex-row items-center gap-3 px-3.5 py-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop sm:gap-4 sm:px-5 sm:py-4",
        className
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl [&_svg]:h-[18px] [&_svg]:w-[18px] sm:[&_svg]:h-5 sm:[&_svg]:w-5",
          TONES[tone] ?? TONES.brand
        )}
      >
        {icon ?? <Activity strokeWidth={2.2} />}
      </span>

      <div className="min-w-0 flex-1">
        {/* Wraps rather than truncates: "Not yet issued" clipped to "Not yet
            iss…" on a two-up phone row is a label that no longer says
            anything, and the tiles in a row equalise height anyway. */}
        <Caption className="block leading-snug">{label}</Caption>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Stat className="text-[19px] sm:text-[22px]">{value}</Stat>
          {change != null ? <TrendChip value={change} /> : null}
        </div>
        {hint ? <div className="mt-0.5 truncate text-[11.5px] text-ink-soft">{hint}</div> : null}
      </div>
    </div>
  );
}

/**
 * The row a screen's KPI tiles sit in.
 *
 * One component rather than a grid class copied into forty screens, because
 * "how many tiles fit on a tablet" is a product decision and it should only be
 * made once. Two-up on a phone at every count — a column of full-width tiles
 * pushes the actual screen below the fold.
 */
/**
 * Two-up on a phone, then the requested count.
 *
 * The `:last-child:nth-child(odd)` rule widens a trailing tile across both
 * columns so an odd row never ends in a half-width stub next to empty canvas —
 * and it stands down at whatever breakpoint the column count changes.
 */
const ORPHAN = "[&>*:last-child:nth-child(odd)]:col-span-2";
const COLUMNS = {
  2: `grid-cols-2 ${ORPHAN}`,
  3: `grid-cols-2 sm:grid-cols-3 ${ORPHAN} sm:[&>*:last-child:nth-child(odd)]:col-span-1`,
  4: `grid-cols-2 lg:grid-cols-4 ${ORPHAN} lg:[&>*:last-child:nth-child(odd)]:col-span-1`,
  5: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 ${ORPHAN} sm:[&>*:last-child:nth-child(odd)]:col-span-1`,
  6: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 ${ORPHAN} sm:[&>*:last-child:nth-child(odd)]:col-span-1`,
};

export function StatGrid({ cols = 4, className, children }) {
  return (
    <div className={cn("grid gap-3 sm:gap-4", COLUMNS[cols] ?? COLUMNS[4], className)}>
      {children}
    </div>
  );
}
