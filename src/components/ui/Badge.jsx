import { cn } from "@/lib/cn";

const TONES = {
  neutral: "bg-slate-100 text-ink-muted",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info-ink",
  outline: "border border-slate-200 bg-white text-ink-muted",
};

export function Badge({ tone = "neutral", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        TONES[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const DOTS = {
  neutral: "bg-slate-400",
  brand: "bg-brand-600",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

/** Bordered pill with a leading status dot — the calendar / detail chip. */
export function StatusPill({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] font-semibold text-ink",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[tone])} />
      {children}
    </span>
  );
}

/** ▲ 4.51% / ▼ 2.41% trend chip. */
export function TrendChip({ value, className, showIcon = true }) {
  const up = Number(value) >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[11px] font-bold",
        up ? "bg-success-soft text-success-strong" : "bg-danger-soft text-danger",
        className
      )}
    >
      {showIcon ? (
        <span
          className={cn(
            "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] text-white",
            up ? "bg-success" : "bg-danger"
          )}
        >
          {up ? "▲" : "▼"}
        </span>
      ) : null}
      {Math.abs(Number(value)).toFixed(2)}%
    </span>
  );
}
