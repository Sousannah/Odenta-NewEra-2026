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

/** Card-shaped KPI used on Sales and Report. */
export function StatCard({ label, value, change, icon, tone = "brand", className }) {
  const tones = {
    brand: "bg-brand-100 text-brand-700",
    success: "bg-success-soft text-success-strong",
    warning: "bg-warning-soft text-[#B27B04]",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <div className={cn("od-card flex-row items-center gap-4 px-5 py-4", className)}>
      {icon ? (
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", tones[tone])}>
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <Caption>{label}</Caption>
        <div className="mt-1.5 flex items-center gap-2">
          <Stat className="text-[22px]">{value}</Stat>
          {change != null ? <TrendChip value={change} /> : null}
        </div>
      </div>
    </div>
  );
}
