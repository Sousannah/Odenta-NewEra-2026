import { createContext, useContext, useId, useState } from "react";
import { cn } from "@/lib/cn";

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internal, setInternal] = useState(defaultValue);
  const active = value ?? internal;
  const setActive = (next) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const id = useId();

  return (
    <TabsContext.Provider value={{ active, setActive, id }}>
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * The tab strip.
 *
 * Scrolls sideways rather than wrapping or overflowing its page: six rotation
 * tabs do not fit a phone, and a second row of tabs reads as a second control.
 */
export function TabsList({ className, children }) {
  return (
    <div
      role="tablist"
      className={cn(
        "od-scroll-x flex items-center gap-5 overflow-x-auto border-b border-slate-200 sm:gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children, badge }) {
  const ctx = useContext(TabsContext);
  const selected = ctx.active === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => ctx.setActive(value)}
      className={cn(
        "od-focus relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 pt-2 text-sm font-semibold transition-colors",
        selected
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-ink-muted hover:text-ink",
        className
      )}
    >
      {children}
      {badge != null ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
            selected ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-ink-soft"
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsContext);
  if (ctx.active !== value) return null;
  return (
    <div role="tabpanel" className={cn("min-h-0 flex-1 animate-fade-in", className)}>
      {children}
    </div>
  );
}

/** Pill-style segmented control (Medical / Cosmetic). */
export function SegmentedControl({ options, value, onChange, className, size = "md" }) {
  const pad = size === "sm" ? "px-3 py-1 text-[12px]" : "px-4 py-1.5 text-[13px]";
  return (
    <div className={cn("od-scroll-x inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1", className)}>
      {options.map((option) => {
        const key = option.value ?? option;
        const label = option.label ?? option;
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key)}
            className={cn(
              "od-focus shrink-0 whitespace-nowrap rounded-lg font-semibold transition",
              pad,
              selected ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
