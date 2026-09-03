import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-ink placeholder:text-ink-faint transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10 disabled:bg-slate-50 disabled:text-ink-soft";

export function Field({ label, hint, error, required, className, children, counter }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold text-ink">
            {label}
            {required ? <span className="text-danger"> *</span> : null}
            {hint ? (
              <span className="ml-1 font-medium text-ink-soft">({hint})</span>
            ) : null}
          </span>
          {counter ? <span className="text-[11px] text-ink-soft">{counter}</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="text-[12px] font-medium text-danger">{error}</span> : null}
    </label>
  );
}

export function Input({ className, leftIcon, ...props }) {
  if (leftIcon) {
    return (
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
          {leftIcon}
        </span>
        <input className={cn(CONTROL, "h-11 pl-9", className)} {...props} />
      </span>
    );
  }
  return <input className={cn(CONTROL, "h-11", className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }) {
  return <textarea rows={rows} className={cn(CONTROL, "resize-y py-2.5", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <span className="relative block">
      <select
        className={cn(CONTROL, "h-11 cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
      >
        <path
          d="M6 8l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Compact select used in card headers ("Last 6 months"). */
export function MiniSelect({ className, children, ...props }) {
  return (
    <span className="relative inline-block">
      <select
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-[12px] font-semibold text-ink-muted transition hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-600/10",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft"
      >
        <path
          d="M6 8l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Radio({ label, description, checked, className, ...props }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition",
        checked
          ? "border-brand-600 bg-brand-50/60 font-semibold text-ink"
          : "border-slate-200 bg-white text-ink-muted hover:border-slate-300",
        className
      )}
    >
      <input type="radio" checked={checked} className="sr-only" {...props} />
      <span
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition",
          checked ? "border-brand-600" : "border-slate-300"
        )}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-brand-600" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="block truncate text-xs font-medium text-ink-soft">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function Checkbox({ label, checked, className, ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2 text-sm text-ink", className)}>
      <input type="checkbox" checked={checked} className="sr-only" {...props} />
      <span
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-2 transition",
          checked ? "border-success bg-success text-white" : "border-slate-300 bg-white"
        )}
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
            <path
              d="M3.5 8.5l3 3 6-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label, className, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "od-focus relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-brand-600" : "bg-slate-300",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
