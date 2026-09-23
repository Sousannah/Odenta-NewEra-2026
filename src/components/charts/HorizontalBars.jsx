import { cn } from "@/lib/cn";
import { chart } from "@/theme/tokens";

/**
 * Ranked horizontal bars — used on the Report screen.
 * data: [{ name, value }]
 */
export function HorizontalBars({ data, color = chart.primary, className, valueFormatter }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-[13px] font-semibold text-ink-muted">
            {item.name}
          </span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-[13px] font-bold text-ink">
            {valueFormatter ? valueFormatter(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
