import { cn } from "@/lib/cn";

/** Title row that sits at the top of a screen's content area. */
export function PageHeader({ title, description, actions, className, children }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {title ? <h2 className="text-xl font-extrabold text-ink">{title}</h2> : null}
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Toolbar above a table: search on the left, filters/actions on the right. */
export function Toolbar({ left, right, className }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}
