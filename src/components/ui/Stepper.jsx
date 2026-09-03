import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Horizontal wizard header.
 * steps: [{ id, label, icon }]  ·  current: 1-based index
 */
export function Stepper({ steps, current = 1, className }) {
  return (
    <div className={cn("flex items-start", className)}>
      {steps.map((step, index) => {
        const position = index + 1;
        const done = position < current;
        const active = position === current;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id ?? step.label} className="flex flex-1 items-start">
            <div className="flex w-full min-w-0 flex-col items-center gap-2 px-1">
              <span
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                  done && "bg-success text-white",
                  active && "bg-brand-600 text-white ring-4 ring-brand-600/15",
                  !done && !active && "border border-slate-200 bg-white text-ink-faint"
                )}
              >
                {active ? (
                  <span className="absolute inset-[-4px] rounded-full border-2 border-dashed border-brand-300" />
                ) : null}
                {done ? <Check className="h-5 w-5" /> : step.icon}
              </span>
              <span className="text-center leading-tight">
                <span className="od-label block">Step {position}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[13px] font-bold",
                    active || done ? "text-ink" : "text-ink-soft"
                  )}
                >
                  {step.label}
                </span>
              </span>
            </div>
            {!isLast ? (
              <span className="mt-[21px] h-[3px] flex-1 shrink-0 overflow-hidden rounded-full bg-slate-200">
                <span
                  className={cn(
                    "block h-full rounded-full transition-all duration-300",
                    done ? "w-full bg-success" : active ? "w-1/2 bg-brand-600" : "w-0"
                  )}
                />
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Small numbered sub-stepper used inside the medical-checkup steps. */
export function DotSteps({ total = 2, current = 1, className }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: total }).map((_, index) => {
        const position = index + 1;
        const active = position === current;
        return (
          <div key={position} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold",
                active
                  ? "border-ink bg-white text-ink"
                  : "border-slate-200 bg-white text-ink-faint"
              )}
            >
              {position}
            </span>
            {position !== total ? <span className="h-px w-4 bg-slate-300" /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value = 0, className, tone = "brand" }) {
  const tones = { brand: "bg-brand-600", success: "bg-success", warning: "bg-warning" };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", tones[tone])}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
