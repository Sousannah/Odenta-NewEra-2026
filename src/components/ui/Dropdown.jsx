import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useOnClickOutside } from "@/hooks";

/**
 * Lightweight popover menu.
 * `trigger` is rendered as-is; `items` are [{ value, label, icon, tone }].
 */
export function Dropdown({
  trigger,
  items = [],
  value,
  onSelect,
  align = "right",
  className,
  menuClassName,
  children,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="od-focus block w-full text-left"
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-2 min-w-[200px] animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-pop",
            align === "right" ? "right-0" : "left-0",
            menuClassName
          )}
        >
          {children ??
            items.map((item) => (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelect?.(item.value, item);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                  item.tone === "danger"
                    ? "text-danger hover:bg-danger-soft"
                    : "text-ink hover:bg-slate-100",
                  value === item.value && "bg-brand-50 text-brand-700"
                )}
              >
                {item.icon ? <span className="text-ink-soft">{item.icon}</span> : null}
                <span className="flex-1 truncate">{item.label}</span>
                {value === item.value ? <Check className="h-4 w-4 text-success" /> : null}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}

/** Select-like dropdown with a coloured status dot (Change Status control). */
export function StatusSelect({ value, options, onChange, className }) {
  const active = options.find((option) => option.value === value) ?? options[0];
  return (
    <Dropdown
      className={className}
      value={value}
      items={options}
      onSelect={onChange}
      trigger={
        <span className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-slate-300">
          <span className={cn("h-2 w-2 rounded-full", active?.dot ?? "bg-slate-400")} />
          {active?.label}
          <ChevronDown className="h-4 w-4 text-ink-soft" />
        </span>
      }
    />
  );
}
