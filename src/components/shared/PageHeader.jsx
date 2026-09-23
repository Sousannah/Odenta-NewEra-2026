import { cn } from "@/lib/cn";

/** Title row that sits at the top of a screen's content area. */
export function PageHeader({ title, description, actions, className, children }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4",
        className
      )}
    >
      <div className="min-w-0">
        {title ? (
          <h2 className="text-lg font-extrabold text-ink sm:text-xl">{title}</h2>
        ) : null}
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Toolbar above a table: search on the left, filters/actions on the right.
 *
 * Stacks below `sm` rather than wrapping, so a full-width search field gets a
 * line of its own and the filters sit under it instead of being squeezed
 * against it.
 */
export function Toolbar({ left, right, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}
