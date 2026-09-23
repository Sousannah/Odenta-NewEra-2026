import { cn } from "@/lib/cn";

/**
 * `min-w-0` is load-bearing, not tidiness.
 *
 * A card is always somebody's grid or flex child, and a grid item's automatic
 * minimum is its *min-content* — which for a card is the widest thing it
 * contains, usually a `truncate`d heading that reports its full un-wrapped
 * width. Without this a single long announcement title pushed a phone's whole
 * page 124px sideways, and the column it was in never shrank to the track it
 * had been given. A card must never be what decides how wide its container is.
 */
export function Card({ className, children, as: Tag = "section", ...props }) {
  return (
    <Tag className={cn("od-card flex min-w-0 flex-col", className)} {...props}>
      {children}
    </Tag>
  );
}

/**
 * Title on the left, action on the right — and on a phone, under it.
 *
 * The action is a badge strip or a button group that cannot shrink, so on a
 * narrow card it and the title fought over the same line and the title lost
 * every time. Below `sm` they stack; the header is `min-w-0` so neither can
 * widen the card.
 */
export function CardHeader({ title, subtitle, action, className, children }) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:pt-5",
        className
      )}
    >
      <div className="min-w-0">
        {title ? (
          <h3 className="truncate text-[15px] font-bold text-ink">{title}</h3>
        ) : null}
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p>
        ) : null}
        {children}
      </div>
      {action ? <div className="min-w-0 sm:shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("min-w-0 flex-1 px-4 py-4 sm:px-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <footer className={cn("min-w-0 border-t border-slate-100 px-4 py-3.5 sm:px-5", className)}>
      {children}
    </footer>
  );
}

/** Small uppercase caption used all over the dashboard. */
export function Caption({ className, children }) {
  return <span className={cn("od-label", className)}>{children}</span>;
}

/** Big number used inside stat blocks. */
export function Stat({ className, children }) {
  return (
    <span className={cn("text-[26px] font-extrabold leading-none tracking-tight text-ink", className)}>
      {children}
    </span>
  );
}
