import { cn } from "@/lib/cn";
import { useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";

/** Row of headline numbers — `stats` is `[{ value, label }]`. */
export function StatStrip({ stats, inverted = false, className }) {
  const t = useT();

  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-3xl",
        inverted ? "bg-white/15" : "bg-slate-200/80 shadow-card",
        "grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((stat, index) => (
        <Reveal
          key={stat.key ?? index}
          delay={index * 80}
          className={cn(
            "flex flex-col items-center gap-1.5 px-6 py-8 text-center",
            inverted ? "bg-brand-700/40 backdrop-blur-sm" : "bg-white"
          )}
        >
          <span
            className={cn(
              "text-[34px] font-extrabold leading-none tracking-tight",
              inverted ? "text-white" : "od-gradient-text"
            )}
          >
            {t(stat.value)}
          </span>
          <span
            className={cn(
              "text-[13px] font-semibold",
              inverted ? "text-white/75" : "text-ink-muted"
            )}
          >
            {t(stat.label)}
          </span>
        </Reveal>
      ))}
    </div>
  );
}
